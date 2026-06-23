import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { getSession } from '../../../lib/auth';

export const GET: APIRoute = async ({ cookies }) => {
  const session = await getSession(cookies);
  if (!session) return new Response('Unauthorized', { status: 401 });

  const { data, error } = await supabase
    .from('notificaciones')
    .select('*')
    .eq('usuario_id', session.id)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data ?? []), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session) return new Response('Unauthorized', { status: 401 });

  const body = await request.json();
  const { action, id } = body;

  if (action === 'read_all') {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leido: true })
      .eq('usuario_id', session.id)
      .eq('leido', false);

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  }

  if (action === 'read_one' && id) {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leido: true })
      .eq('id', id)
      .eq('usuario_id', session.id);

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  }

  return new Response('Bad request', { status: 400 });
};
