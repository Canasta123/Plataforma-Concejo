import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import { getSession } from '../../../../lib/auth';
import bcrypt from 'bcryptjs';
import { notificarPasswordReset } from '../../../../lib/mailer';

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.rol !== 'admin') {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });
  }

  const { id } = params;
  const body = await request.json();

  if (session.id === id) {
    if (body.rol !== undefined || body.activo === false) {
      return new Response(JSON.stringify({ error: 'No puedes cambiar tu propio rol ni desactivarte' }), { status: 400 });
    }
  }
  const campos: Record<string, unknown> = {};
  if (body.nombre !== undefined)             campos.nombre = body.nombre;
  if (body.cargo !== undefined)              campos.cargo = body.cargo;
  if (body.rol !== undefined)                campos.rol = body.rol;
  if (body.activo !== undefined)             campos.activo = body.activo;
  if (body.correo_notificacion !== undefined) campos.correo_notificacion = body.correo_notificacion || null;
  if (body.induccion_habilitada !== undefined) campos.induccion_habilitada = body.induccion_habilitada;
  if (body.acceso_evidencias !== undefined)  campos.acceso_evidencias = body.acceso_evidencias;
  if (body.password) {
    campos.password_hash = await bcrypt.hash(body.password, 12);
  }

  const { data, error } = await supabase
    .from('usuarios')
    .update(campos)
    .eq('id', id)
    .select('id, nombre, correo, rol, cargo, activo, correo_notificacion, created_at, induccion_completada, induccion_habilitada, acceso_evidencias')
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  if (!data) return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), { status: 404 });

  return new Response(JSON.stringify(data), { status: 200 });
};

export const POST: APIRoute = async ({ params, url, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.rol !== 'admin') {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });
  }

  if (!url.pathname.endsWith('/reset-password')) {
    return new Response(JSON.stringify({ error: 'Ruta no encontrada' }), { status: 404 });
  }

  const { id } = params;

  const { data: usuario, error: fetchError } = await supabase
    .from('usuarios')
    .select('id, nombre, correo, correo_notificacion')
    .eq('id', id)
    .single();

  if (fetchError || !usuario) {
    return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), { status: 404 });
  }

  const temporal = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-2).toUpperCase();
  const password_hash = await bcrypt.hash(temporal, 12);

  const { error: updateError } = await supabase
    .from('usuarios')
    .update({ password_hash })
    .eq('id', id);

  if (updateError) return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });

  try {
    await notificarPasswordReset(usuario, temporal);
  } catch (e) {
    console.error('Error enviando correo de reset:', e);
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.rol !== 'admin') {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });
  }

  const { id } = params;

  if (session.id === id) {
    return new Response(JSON.stringify({ error: 'No puedes eliminar tu propia cuenta' }), { status: 400 });
  }

  const { error } = await supabase
    .from('usuarios')
    .delete()
    .eq('id', id);

  if (error) {
    // Foreign key violation error code in PostgreSQL is typically 23503
    if (error.code === '23503') {
      return new Response(JSON.stringify({ error: 'El usuario no se puede eliminar porque tiene tickets asignados o historial. Por favor, "Desactívalo" en su lugar para mantener el registro.' }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
