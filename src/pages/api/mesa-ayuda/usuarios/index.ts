import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import { getSession } from '../../../../lib/auth';
import { notificarUsuarioCreado } from '../../../../lib/mailer';
import bcrypt from 'bcryptjs';

export const GET: APIRoute = async ({ cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.rol !== 'admin') {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });
  }

  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre, correo, rol, cargo, activo, correo_notificacion, created_at')
    .order('created_at', { ascending: false });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.rol !== 'admin') {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });
  }

  const body = await request.json();
  const { nombre, correo, password, rol, cargo, correo_notificacion } = body;

  if (!nombre || !correo || !password || !rol || !cargo) {
    return new Response(JSON.stringify({ error: 'Faltan campos obligatorios' }), { status: 400 });
  }

  const password_hash = await bcrypt.hash(password, 12);

  const { data, error } = await supabase
    .from('usuarios')
    .insert({ nombre, correo, password_hash, rol, cargo, correo_notificacion: correo_notificacion || null, activo: true })
    .select('id, nombre, correo, rol, cargo, activo, correo_notificacion, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      return new Response(JSON.stringify({ error: 'Ya existe un usuario con ese correo' }), { status: 409 });
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  try {
    await notificarUsuarioCreado(data, password);
  } catch (e) {
    console.error('Error enviando correo de bienvenida:', e);
  }

  return new Response(JSON.stringify(data), { status: 201 });
};
