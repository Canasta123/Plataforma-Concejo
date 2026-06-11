import type { APIRoute } from 'astro';
import { supabase } from '../../../../../lib/supabase';
import { getSession } from '../../../../../lib/auth';
import { notificarRespuesta } from '../../../../../lib/mailer';

export const POST: APIRoute = async ({ params, request, cookies }) => {
  const session = await getSession(cookies);
  if (!session) return new Response('Unauthorized', { status: 401 });

  const body = await request.json();
  const contenido  = (body.contenido  ?? '').trim();
  const es_interno = body.es_interno === true && session.rol !== 'solicitante';
  const tipo       = (session.rol !== 'solicitante' && !es_interno) ? 'respuesta' : 'comentario';

  if (!contenido) {
    return new Response(JSON.stringify({ error: 'El contenido es requerido' }), { status: 400 });
  }

  const { data: ticket } = await supabase.from('tickets').select('*').eq('id', params.id!).single();
  if (!ticket) return new Response('Not found', { status: 404 });

  if (session.rol === 'solicitante' && ticket.creador_id !== session.id) {
    return new Response('Forbidden', { status: 403 });
  }

  const { error } = await supabase.from('trazabilidad').insert({
    ticket_id:  params.id!,
    autor_id:   session.id,
    tipo,
    contenido,
    es_interno,
  });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  if (tipo === 'respuesta') {
    (async () => {
      const { data: solicitante } = await supabase.from('usuarios').select('*').eq('id', ticket.creador_id).single();
      if (solicitante) await notificarRespuesta(ticket, solicitante, contenido).catch(() => {});
    })();
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
