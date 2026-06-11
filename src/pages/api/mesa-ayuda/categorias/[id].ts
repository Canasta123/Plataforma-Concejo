import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import { getSession } from '../../../../lib/auth';

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.rol !== 'admin') {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });
  }

  const { id } = params;
  const body = await request.json();
  const campos: Record<string, unknown> = {};
  if (body.nombre          !== undefined) campos.nombre          = body.nombre;
  if (body.sla_horas_alta  !== undefined) campos.sla_horas_alta  = body.sla_horas_alta;
  if (body.sla_horas_media !== undefined) campos.sla_horas_media = body.sla_horas_media;
  if (body.sla_horas_baja  !== undefined) campos.sla_horas_baja  = body.sla_horas_baja;

  const { data, error } = await supabase
    .from('categorias_ticket')
    .update(campos)
    .eq('id', id)
    .select()
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { status: 200 });
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.rol !== 'admin') {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });
  }

  const { id } = params;
  const { error } = await supabase
    .from('categorias_ticket')
    .delete()
    .eq('id', id);

  if (error) {
    if (error.code === '23503') {
      return new Response(JSON.stringify({ error: 'No se puede eliminar: hay tickets con esta categoría. Primero mueve esos tickets.' }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
