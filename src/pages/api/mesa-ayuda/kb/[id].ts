import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import { getSession } from '../../../../lib/auth';

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.rol !== 'admin') {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });
  }

  const { id } = params;
  const { error } = await supabase
    .from('kb_articulos')
    .delete()
    .eq('id', id);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.rol !== 'admin') {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });
  }

  const { id } = params;
  const body = await request.json();
  const campos: Record<string, unknown> = {};
  if (body.titulo    !== undefined) campos.titulo    = body.titulo;
  if (body.categoria !== undefined) campos.categoria = body.categoria;
  if (body.resumen   !== undefined) campos.resumen   = body.resumen;
  if (body.contenido !== undefined) campos.contenido = body.contenido;
  if (body.tags      !== undefined) campos.tags      = body.tags;

  const { data, error } = await supabase
    .from('kb_articulos')
    .update(campos)
    .eq('id', id)
    .select()
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { status: 200 });
};
