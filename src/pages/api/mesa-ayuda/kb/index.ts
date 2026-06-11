import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import { getSession } from '../../../../lib/auth';

export const GET: APIRoute = async () => {
  const { data, error } = await supabase
    .from('kb_articulos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data ?? []), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.rol !== 'admin') {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });
  }

  const body = await request.json();
  const { titulo, categoria, resumen, contenido, tags } = body;

  if (!titulo || !categoria || !resumen || !contenido) {
    return new Response(JSON.stringify({ error: 'Faltan campos obligatorios' }), { status: 400 });
  }

  const id = 'kb-' + Date.now();
  const { data, error } = await supabase
    .from('kb_articulos')
    .insert({ id, titulo, categoria, resumen, contenido, tags: tags ?? [] })
    .select()
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { status: 201 });
};
