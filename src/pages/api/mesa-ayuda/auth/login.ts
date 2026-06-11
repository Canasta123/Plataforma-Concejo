import type { APIRoute } from 'astro';
import bcrypt from 'bcryptjs';
import { supabase } from '../../../../lib/supabase';
import { createSession, setSessionCookie } from '../../../../lib/auth';
import type { Usuario } from '../../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  let correo: string;
  let password: string;

  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const body = await request.json();
    correo   = (body.correo   ?? '').trim().toLowerCase();
    password = (body.password ?? '');
  } else {
    const form = await request.formData();
    correo   = ((form.get('correo')   as string) ?? '').trim().toLowerCase();
    password = ((form.get('password') as string) ?? '');
  }

  if (!correo || !password) {
    return new Response(JSON.stringify({ error: 'Correo y contraseña requeridos' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('correo', correo)
    .eq('activo', true)
    .single<Usuario>();

  if (error || !usuario) {
    return redirect('/mesa-ayuda/login?error=credenciales');
  }

  const passwordValida = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordValida) {
    return redirect('/mesa-ayuda/login?error=credenciales');
  }

  const token = await createSession({
    id:     usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol:    usuario.rol,
    cargo:  usuario.cargo,
  });

  setSessionCookie(cookies, token);

  return redirect('/mesa-ayuda', 302);
};
