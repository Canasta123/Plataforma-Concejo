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

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const session = await getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  // Solo admins pueden borrar archivos
  if (session.rol !== 'admin') {
    return new Response(JSON.stringify({ error: 'No autorizado. Se requieren permisos de administrador.' }), { status: 403 });
  }

  const { id } = params;
  if (!id) return new Response(JSON.stringify({ error: 'ID de archivo no proporcionado' }), { status: 400 });

  // 1. Obtener la trazabilidad del archivo para saber dónde está guardado físicamente
  const { data: evidencia, error: fetchError } = await supabase
    .from('trazabilidad_evidencias')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !evidencia) {
    return new Response(JSON.stringify({ error: 'Archivo no encontrado' }), { status: 404 });
  }

  // 2. Eliminar el archivo físico en disco
  try {
    const targetFile = path.join(UPLOAD_DIR, evidencia.carpeta_destino, evidencia.nombre_archivo);
    await fs.unlink(targetFile);
  } catch (err: any) {
    console.error('Error al eliminar archivo físico (puede que no exista en disco):', err.message);
  }

  // 3. Eliminar de la base de datos
  const { error: deleteError } = await supabase
    .from('trazabilidad_evidencias')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ message: 'Archivo eliminado correctamente' }), { status: 200 });
};
