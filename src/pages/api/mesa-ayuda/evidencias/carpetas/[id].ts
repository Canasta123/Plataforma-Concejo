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

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  const session = await getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  // Solo admins pueden modificar carpetas
  if (session.rol !== 'admin') {
    return new Response(JSON.stringify({ error: 'No autorizado. Se requieren permisos de administrador.' }), { status: 403 });
  }

  const { id } = params;
  if (!id) return new Response(JSON.stringify({ error: 'ID de carpeta no proporcionado' }), { status: 400 });

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Formato de cuerpo inválido' }), { status: 400 });
  }

  const { nombre, icono, color, activa } = body;

  // 1. Obtener la carpeta existente para conocer el nombre anterior
  const { data: carpetaExistente, error: getError } = await supabase
    .from('carpetas_evidencia')
    .select('*')
    .eq('id', id)
    .single();

  if (getError || !carpetaExistente) {
    return new Response(JSON.stringify({ error: 'Carpeta no encontrada' }), { status: 404 });
  }

  const campos: Record<string, any> = {};
  if (icono !== undefined) campos.icono = icono;
  if (color !== undefined) campos.color = color;
  if (activa !== undefined) campos.activa = activa;

  let renombrarFisico = false;
  let nombreNuevo = '';
  if (nombre !== undefined && nombre.trim() && nombre.trim() !== carpetaExistente.nombre) {
    nombreNuevo = nombre.trim();
    campos.nombre = nombreNuevo;
    renombrarFisico = true;
  }

  // 2. Actualizar en Supabase
  const { data, error: updateError } = await supabase
    .from('carpetas_evidencia')
    .update(campos)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    if (updateError.code === '23505') {
      return new Response(JSON.stringify({ error: 'Ya existe una carpeta con ese nombre.' }), { status: 409 });
    }
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
  }

  // Actualizar trazabilidad de forma retroactiva si cambió el nombre
  if (renombrarFisico) {
    await supabase
      .from('trazabilidad_evidencias')
      .update({ carpeta_destino: nombreNuevo })
      .eq('carpeta_id', id);
  }

  // 3. Renombrar carpeta física si cambió el nombre
  if (renombrarFisico) {
    try {
      const rutaAnterior = path.join(UPLOAD_DIR, carpetaExistente.nombre);
      const rutaNueva = path.join(UPLOAD_DIR, nombreNuevo);

      // Verificar si la carpeta anterior existe en disco antes de renombrar
      try {
        await fs.access(rutaAnterior);
        await fs.rename(rutaAnterior, rutaNueva);
      } catch (errAccess) {
        // Si no existía, simplemente la creamos con el nuevo nombre
        await fs.mkdir(rutaNueva, { recursive: true });
      }
    } catch (err: any) {
      console.error('Error al renombrar directorio físico:', err);
      return new Response(JSON.stringify({
        warning: 'Carpeta renombrada en base de datos, pero hubo un error al renombrar físicamente en disco: ' + err.message,
        data
      }), { status: 200 });
    }
  }

  return new Response(JSON.stringify(data), { status: 200 });
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const session = await getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  if (session.rol !== 'admin') {
    return new Response(JSON.stringify({ error: 'No autorizado. Se requieren permisos de administrador.' }), { status: 403 });
  }

  const { id } = params;
  if (!id) return new Response(JSON.stringify({ error: 'ID de carpeta no proporcionado' }), { status: 400 });

  // Borrado lógico (archivar carpeta)
  const { data, error } = await supabase
    .from('carpetas_evidencia')
    .update({ activa: false })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ message: 'Carpeta archivada correctamente (borrado lógico)', data }), { status: 200 });
};
