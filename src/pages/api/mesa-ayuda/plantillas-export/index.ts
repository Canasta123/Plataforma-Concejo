import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import { getSession } from '../../../../lib/auth';

export const GET: APIRoute = async ({ cookies }) => {
  const session = await getSession(cookies);
  if (!session) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const { data, error } = await supabase
    .from('plantillas_export')
    .select('*')
    .eq('usuario_id', session.id)
    .order('created_at', { ascending: false });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const { nombre, filtros } = await request.json();
  if (!nombre || !filtros) {
    return new Response(JSON.stringify({ error: 'nombre y filtros son obligatorios' }), { status: 400 });
  }

  const { data, error } = await supabase
    .from('plantillas_export')
    .insert({ usuario_id: session.id, nombre, filtros })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return new Response(JSON.stringify({ error: 'Ya tienes una plantilla con ese nombre' }), { status: 409 });
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify(data), { status: 201 });
};
