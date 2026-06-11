import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import { getSession } from '../../../../lib/auth';
import { notificarCambioEstado, notificarAsignacion } from '../../../../lib/mailer';
import type { EstadoTicket } from '../../../../lib/supabase';

export const GET: APIRoute = async ({ params, cookies }) => {
  const session = await getSession(cookies);
  if (!session) return new Response('Unauthorized', { status: 401 });

  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', params.id!)
    .single();

  if (error || !ticket) return new Response('Not found', { status: 404 });

  if (session.rol === 'solicitante' && ticket.creador_id !== session.id) {
    return new Response('Forbidden', { status: 403 });
  }

  let trazQuery = supabase
    .from('trazabilidad')
    .select('*, autor:usuarios!trazabilidad_autor_id_fkey(nombre, cargo)')
    .eq('ticket_id', params.id!)
    .order('created_at', { ascending: true });

  if (session.rol === 'solicitante') {
    trazQuery = trazQuery.eq('es_interno', false);
  }

  const { data: trazabilidad } = await trazQuery;

  let creador = null;
  let agente  = null;

  const { data: creadorData } = await supabase.from('usuarios').select('nombre, correo, cargo').eq('id', ticket.creador_id).single();
  creador = creadorData;

  if (ticket.agente_id) {
    const { data: agenteData } = await supabase.from('usuarios').select('nombre, correo').eq('id', ticket.agente_id).single();
    agente = agenteData;
  }

  return new Response(JSON.stringify({ ...ticket, trazabilidad: trazabilidad ?? [], creador, agente }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.rol === 'solicitante') return new Response('Forbidden', { status: 403 });

  const body = await request.json();

  const { data: ticketAnterior } = await supabase.from('tickets').select('*').eq('id', params.id!).single();
  if (!ticketAnterior) return new Response('Not found', { status: 404 });

  const cambios: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const entradas = [];

  if (body.estado && body.estado !== ticketAnterior.estado) {
    cambios.estado = body.estado as EstadoTicket;
    if (body.estado === 'cerrado' || body.estado === 'resuelto') {
      cambios.fecha_cierre = new Date().toISOString();
    }
    entradas.push({
      ticket_id:  params.id!,
      autor_id:   session.id,
      tipo:       'cambio_estado',
      contenido:  `Estado cambiado de "${ticketAnterior.estado}" a "${body.estado}"`,
      es_interno: false,
    });
  }

  if (body.asignar && !ticketAnterior.agente_id) {
    cambios.agente_id = session.id;
    entradas.push({
      ticket_id:  params.id!,
      autor_id:   session.id,
      tipo:       'asignacion',
      contenido:  `Ticket asignado a ${session.nombre}`,
      es_interno: false,
    });
  }

  const { error } = await supabase.from('tickets').update(cambios).eq('id', params.id!);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  if (entradas.length) await supabase.from('trazabilidad').insert(entradas);

  (async () => {
    const { data: solicitante } = await supabase.from('usuarios').select('*').eq('id', ticketAnterior.creador_id).single();
    const ticketActualizado = { ...ticketAnterior, ...cambios } as any;

    if (cambios.estado && solicitante) {
      await notificarCambioEstado(ticketActualizado, solicitante, ticketAnterior.estado).catch(() => {});
    }
    if (cambios.agente_id) {
      const { data: agenteData } = await supabase.from('usuarios').select('*').eq('id', session.id).single();
      if (agenteData) await notificarAsignacion(ticketActualizado, agenteData).catch(() => {});
    }
  })();

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
};
