import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import { getSession } from '../../../../lib/auth';
import bcrypt from 'bcryptjs';
import { notificarUsuarioCreado } from '../../../../lib/mailer';

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.rol !== 'admin') {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });
  }

  const body = await request.json();
  const usuarios: Array<{ nombre: string; correo: string; rol: string; cargo: string; correo_notificacion?: string }> = body.usuarios;

  if (!Array.isArray(usuarios) || usuarios.length === 0) {
    return new Response(JSON.stringify({ error: 'Lista vacía o formato inválido' }), { status: 400 });
  }

  const resultados: { correo: string; ok: boolean; error?: string }[] = [];

  for (const u of usuarios) {
    if (!u.nombre || !u.correo || !u.rol || !u.cargo) {
      resultados.push({ correo: u.correo ?? '(vacío)', ok: false, error: 'Faltan campos obligatorios' });
      continue;
    }

    const passwordTemporal = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-2).toUpperCase();
    const password_hash = await bcrypt.hash(passwordTemporal, 12);

    const { error } = await supabase.from('usuarios').insert({
      nombre: u.nombre,
      correo: u.correo.toLowerCase().trim(),
      password_hash,
      rol: u.rol,
      cargo: u.cargo,
      activo: true,
      correo_notificacion: u.correo_notificacion || null,
    });

    if (error) {
      resultados.push({ correo: u.correo, ok: false, error: error.message });
      continue;
    }

    try {
      await notificarUsuarioCreado({ nombre: u.nombre, correo: u.correo, correo_notificacion: u.correo_notificacion ?? null }, passwordTemporal);
    } catch (e) {
      console.error('Error enviando correo a', u.correo, e);
    }

    resultados.push({ correo: u.correo, ok: true });
  }

  return new Response(JSON.stringify({ resultados }), { status: 200 });
};
