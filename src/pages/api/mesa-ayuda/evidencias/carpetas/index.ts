import type { APIRoute } from 'astro';
import { supabase } from '../../../../../lib/supabase';
import { getSession } from '../../../../../lib/auth';
import fs from 'node:fs/promises';
import path from 'node:path';

const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : process.env.FILES_BASE_DIR
    ? path.resolve(process.env.FILES_BASE_DIR, 'archivos')
    : process.env.NODE_ENV === 'production'
      ? path.join(process.cwd(), 'dist', 'client', 'archivos')
      : path.join(process.cwd(), 'public', 'archivos');

export const GET: APIRoute = async ({ request, cookies }) => {
  const url = new URL(request.url);
  const soloActivas = url.searchParams.get('activasOnly') === 'true' || !cookies.get('session');

  // Si se desean ver todas las carpetas (activas y archivadas), se requiere autenticación
  if (!soloActivas) {
    const session = await getSession(cookies);
    if (!session) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const { data: dbUser } = await supabase
      .from('usuarios')
      .select('acceso_evidencias')
      .eq('id', session.id)
      .single();

    const tieneAcceso = dbUser?.acceso_evidencias || ['admin', 'auditor'].includes(session.rol);
    if (!tieneAcceso) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });
    }
  }

  let query = supabase.from('carpetas_evidencia').select('*').order('nombre', { ascending: true });
  if (soloActivas) {
    query = query.eq('activa', true);
  }

  const { data, error } = await query;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  // Solo admins pueden crear carpetas
  if (session.rol !== 'admin') {
    return new Response(JSON.stringify({ error: 'No autorizado. Se requieren permisos de administrador.' }), { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Formato de cuerpo inválido' }), { status: 400 });
  }

  const { nombre, icono, color } = body;
  if (!nombre || !nombre.trim()) {
    return new Response(JSON.stringify({ error: 'El nombre de la carpeta es requerido' }), { status: 400 });
  }

  const nombreLimpio = nombre.trim();

  // 1. Insertar en base de datos
  const { data, error } = await supabase
    .from('carpetas_evidencia')
    .insert({
      nombre: nombreLimpio,
      icono: icono || 'fas fa-folder',
      color: color || 'text-blue-600 bg-blue-50 border-blue-100',
      activa: true,
      created_by: session.id
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return new Response(JSON.stringify({ error: 'Ya existe una carpeta con este nombre.' }), { status: 409 });
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // 2. Crear carpeta física en disco / NAS
  try {
    const targetDir = path.join(UPLOAD_DIR, nombreLimpio);
    await fs.mkdir(targetDir, { recursive: true });
  } catch (err: any) {
    console.error('Error al crear directorio físico:', err);
    // Nota: mantenemos el registro en la base de datos pero advertimos sobre el error
    return new Response(JSON.stringify({ 
      warning: 'Carpeta registrada en base de datos, pero hubo un problema al crearla físicamente en disco: ' + err.message,
      data 
    }), { status: 201 });
  }

  return new Response(JSON.stringify(data), { status: 201 });
};
