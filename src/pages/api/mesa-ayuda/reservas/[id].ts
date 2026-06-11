import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import { getSession } from '../../../../lib/auth';
import { notificarReservaAprobada, notificarReservaRechazada, notificarReservaCancelada } from '../../../../lib/mailer';

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  const session = await getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const { id } = params;

  // Obtener la reserva, solicitante_id, y responsable del recurso asociado
  const { data: reservaActual, error: fetchError } = await supabase
    .from('reservas')
    .select('id, solicitante_id, recurso:recurso_id(notificar_usuario_id, notificar_usuarios_ids)')
    .eq('id', id)
    .single();

  if (fetchError || !reservaActual) {
    return new Response(JSON.stringify({ error: 'Reserva no encontrada' }), { status: 404 });
  }

  const esSolicitante = reservaActual.solicitante_id === session.id;
  const responsableId = (reservaActual.recurso as any)?.notificar_usuario_id;
  const responsablesIds = (reservaActual.recurso as any)?.notificar_usuarios_ids || [];
  const esResponsable = (responsableId && responsableId === session.id) || (Array.isArray(responsablesIds) && responsablesIds.includes(session.id));
  const esAdminOAgente = ['admin', 'agente'].includes(session.rol);

  const body = await request.json();
  const { estado, nota_admin } = body;

  if (!['aprobada', 'rechazada', 'cancelada'].includes(estado)) {
    return new Response(JSON.stringify({ error: 'Estado inválido' }), { status: 400 });
  }

  // Si se quiere cancelar, el solicitante o el admin/agente pueden hacerlo.
  // Para aprobar o rechazar, solo el responsable o el admin/agente.
  if (estado === 'cancelada') {
    if (!esSolicitante && !esAdminOAgente) {
      return new Response(JSON.stringify({ error: 'No tienes permisos para cancelar esta reserva' }), { status: 403 });
    }
  } else {
    if (!esAdminOAgente && !esResponsable) {
      return new Response(JSON.stringify({ error: 'No tienes permisos para aprobar/rechazar esta reserva' }), { status: 403 });
    }
  }

  const { data, error } = await supabase
    .from('reservas')
    .update({ 
      estado, 
      nota_admin: nota_admin ?? null, 
      aprobado_por: estado === 'cancelada' ? null : session.id 
    })
    .eq('id', id)
    .select(`id, motivo, fecha_inicio, fecha_fin, nota_admin,
      solicitante:solicitante_id(id, nombre, correo, correo_notificacion),
      recurso:recurso_id(id, nombre, notificar_usuario_id, notificar_usuarios_ids)`)
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  // Enviar notificación correspondiente
  try {
    const solicitante = data.solicitante as any;
    const recurso = data.recurso as any;

    if (estado === 'aprobada') {
      await notificarReservaAprobada(
        { id: data.id, motivo: data.motivo, fecha_inicio: data.fecha_inicio, fecha_fin: data.fecha_fin, nota_admin: data.nota_admin },
        solicitante, recurso, session.nombre
      );
    } else if (estado === 'rechazada') {
      await notificarReservaRechazada(
        { motivo: data.motivo, fecha_inicio: data.fecha_inicio, nota_admin: data.nota_admin },
        solicitante, recurso
      );
    } else if (estado === 'cancelada') {
      // Notificar a los encargados del recurso sobre la cancelación
      let responsables: any[] = [];
      const idsResponsables = recurso?.notificar_usuarios_ids || (recurso?.notificar_usuario_id ? [recurso.notificar_usuario_id] : []);
      if (idsResponsables.length > 0) {
        const { data: dbResponsables } = await supabase
          .from('usuarios')
          .select('id, nombre, correo, correo_notificacion')
          .in('id', idsResponsables);
        if (dbResponsables) responsables = dbResponsables;
      }
      
      if (responsables.length === 0) {
        const { data: admins } = await supabase
          .from('usuarios')
          .select('id, nombre, correo, correo_notificacion')
          .in('rol', ['admin', 'agente'])
          .eq('activo', true);
        responsables = admins ?? [];
      }

      await notificarReservaCancelada(
        { motivo: data.motivo, fecha_inicio: data.fecha_inicio, fecha_fin: data.fecha_fin },
        solicitante,
        { nombre: recurso.nombre },
        responsables
      );
    }
  } catch (e) {
    console.error('Error enviando notificación de estado de reserva:', e);
  }

  return new Response(JSON.stringify(data), { status: 200 });
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const session = await getSession(cookies);
  if (!session) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });

  const { id } = params;

  // Solo el solicitante puede cancelar su propia reserva (si está pendiente), o el admin puede eliminar cualquiera
  const { data: reserva } = await supabase.from('reservas').select('solicitante_id, estado').eq('id', id).single();
  if (!reserva) return new Response(JSON.stringify({ error: 'Reserva no encontrada' }), { status: 404 });

  const esPropia = reserva.solicitante_id === session.id;
  const esAdmin = ['admin', 'agente'].includes(session.rol);

  if (!esAdmin && !(esPropia && reserva.estado === 'pendiente')) {
    return new Response(JSON.stringify({ error: 'No puedes cancelar esta reserva' }), { status: 403 });
  }

  const { error } = await supabase.from('reservas').delete().eq('id', id);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
