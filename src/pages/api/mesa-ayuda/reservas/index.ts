import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import { getSession } from '../../../../lib/auth';
import { notificarReservaSolicitada } from '../../../../lib/mailer';
import crypto from 'crypto';

export const GET: APIRoute = async ({ cookies }) => {
  const session = await getSession(cookies);
  if (!session) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });

  let query = supabase
    .from('reservas')
    .select(`id, motivo, fecha_inicio, fecha_fin, estado, nota_admin, created_at, grupo_id,
      solicitante:solicitante_id(id, nombre, correo),
      recurso:recurso_id(id, nombre, tipo, notificar_usuario_id, notificar_usuarios_ids),
      aprobador:aprobado_por(nombre)`)
    .order('fecha_inicio', { ascending: true });

  const { data, error } = await query;
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data ?? []), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });

  const body = await request.json();
  const { recurso_id, recursos_ids, fecha_inicio, fecha_fin, motivo } = body;

  const idsToReserve = Array.isArray(recursos_ids) && recursos_ids.length > 0 
    ? recursos_ids 
    : (recurso_id ? [recurso_id] : []);

  if (idsToReserve.length === 0 || !fecha_inicio || !fecha_fin || !motivo) {
    return new Response(JSON.stringify({ error: 'Faltan campos obligatorios' }), { status: 400 });
  }

  if (new Date(fecha_fin) <= new Date(fecha_inicio)) {
    return new Response(JSON.stringify({ error: 'La hora de fin debe ser posterior a la hora de inicio' }), { status: 400 });
  }

  // Verificar choques de horario para cada uno de los recursos
  const { data: choques } = await supabase
    .from('reservas')
    .select('id, recurso_id')
    .in('recurso_id', idsToReserve)
    .in('estado', ['pendiente', 'aprobada'])
    .lt('fecha_inicio', fecha_fin)
    .gt('fecha_fin', fecha_inicio);

  if (choques && choques.length > 0) {
    // Obtener nombres de los recursos que chocan
    const { data: recursosChocados } = await supabase
      .from('recursos_reserva')
      .select('nombre')
      .in('id', choques.map(c => c.recurso_id));
    
    const nombres = recursosChocados?.map(r => r.nombre).join(', ') ?? 'alguno de los recursos';
    return new Response(JSON.stringify({ error: `Conflicto de horario: Ya existe una reserva para: ${nombres}` }), { status: 409 });
  }

  // Generar un grupo_id si es más de 1 recurso
  const grupo_id = idsToReserve.length > 1 ? crypto.randomUUID() : null;

  const rowsToInsert = idsToReserve.map(id => ({
    recurso_id: id,
    solicitante_id: session.id,
    fecha_inicio,
    fecha_fin,
    motivo,
    estado: 'pendiente',
    grupo_id
  }));

  const { data: insertedData, error: insertError } = await supabase
    .from('reservas')
    .insert(rowsToInsert)
    .select(`id, motivo, fecha_inicio, fecha_fin, estado, grupo_id,
      solicitante:solicitante_id(id, nombre, correo, correo_notificacion),
      recurso:recurso_id(id, nombre, notificar_usuario_id, notificar_usuarios_ids)`);

  if (insertError) return new Response(JSON.stringify({ error: insertError.message }), { status: 500 });

  // Notificar por cada recurso creado
  try {
    for (const row of insertedData || []) {
      const recurso = row.recurso as any;
      let destinatarios: any[] = [];

      const idsResponsables = recurso?.notificar_usuarios_ids || (recurso?.notificar_usuario_id ? [recurso.notificar_usuario_id] : []);
      if (idsResponsables.length > 0) {
        const { data: responsables } = await supabase
          .from('usuarios')
          .select('id, nombre, correo, correo_notificacion')
          .in('id', idsResponsables);
        if (responsables) destinatarios = responsables;
      }

      if (destinatarios.length === 0) {
        const { data: admins } = await supabase
          .from('usuarios')
          .select('id, nombre, correo, correo_notificacion')
          .in('rol', ['admin', 'agente'])
          .eq('activo', true);
        destinatarios = admins ?? [];
      }

      await notificarReservaSolicitada(
        { id: row.id, motivo: row.motivo, fecha_inicio: row.fecha_inicio, fecha_fin: row.fecha_fin },
        row.solicitante as any,
        { nombre: recurso.nombre },
        destinatarios
      );
    }
  } catch (e) {
    console.error('Error enviando notificación de reserva:', e);
  }

  return new Response(JSON.stringify(insertedData), { status: 201 });
};
