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
  if (body.nombre               !== undefined) campos.nombre               = body.nombre;
  if (body.tipo                 !== undefined) campos.tipo                 = body.tipo;
  if (body.descripcion          !== undefined) campos.descripcion          = body.descripcion;
  if (body.activo               !== undefined) campos.activo               = body.activo;
  if (body.notificar_usuarios_ids !== undefined) {
    const idsArray = Array.isArray(body.notificar_usuarios_ids) ? body.notificar_usuarios_ids : [];
    campos.notificar_usuarios_ids = idsArray;
    campos.notificar_usuario_id = idsArray[0] || null; // Retrocompatibilidad
  }

  const { data, error } = await supabase
    .from('recursos_reserva')
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

  // Verificar si hay reservas activas para este recurso
  const { data: activas } = await supabase
    .from('reservas')
    .select('id')
    .eq('recurso_id', id)
    .in('estado', ['pendiente', 'aprobada']);

  if (activas && activas.length > 0) {
    return new Response(JSON.stringify({ error: `No se puede eliminar: hay ${activas.length} reserva(s) activas para este recurso.` }), { status: 400 });
  }

  // Desactivar en lugar de eliminar (para preservar historial)
  const { error } = await supabase.from('recursos_reserva').update({ activo: false }).eq('id', id);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
