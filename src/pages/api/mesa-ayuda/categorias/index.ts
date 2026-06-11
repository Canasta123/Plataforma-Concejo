import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import { getSession } from '../../../../lib/auth';

export const GET: APIRoute = async ({ cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.rol !== 'admin') {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });
  }

  const { data, error } = await supabase
    .from('categorias_ticket')
    .select('*')
    .order('nombre');

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data ?? []), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.rol !== 'admin') {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });
  }

  const { nombre, sla_horas_alta, sla_horas_media, sla_horas_baja } = await request.json();
  if (!nombre) return new Response(JSON.stringify({ error: 'El nombre es obligatorio' }), { status: 400 });

  const { data, error } = await supabase
    .from('categorias_ticket')
    .insert({ nombre, sla_horas_alta: sla_horas_alta ?? 4, sla_horas_media: sla_horas_media ?? 8, sla_horas_baja: sla_horas_baja ?? 24 })
    .select()
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { status: 201 });
};
