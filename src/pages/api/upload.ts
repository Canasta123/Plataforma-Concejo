import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import { supabase } from '../../lib/supabase';
import { crearNotificacion } from '../../lib/notifications';

// Ruta de uploads: prioriza UPLOAD_DIR, luego FILES_BASE_DIR/archivos, finalmente public/archivos.
const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : process.env.FILES_BASE_DIR
    ? path.resolve(process.env.FILES_BASE_DIR, 'archivos')
    : process.env.NODE_ENV === 'production'
      ? path.join(process.cwd(), 'dist', 'client', 'archivos')
      : path.join(process.cwd(), 'public', 'archivos');

// Las carpetas se validan dinámicamente con la base de datos

function formatDate(d: Date): string {
  const formatter = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(d);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value ?? '00';
  return `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;
}

export const POST: APIRoute = async ({ request }) => {
  const logError = async (step: string, err: any) => {
    const errorMsg = `[${new Date().toISOString()}] Step: ${step} - Error: ${err.stack || err.message}`;
    console.error(errorMsg);
    try {
      const logPath = path.join(process.cwd(), 'api_errors.log');
      await fs.appendFile(logPath, errorMsg + '\n', 'utf8');
    } catch (e) {
      console.error('No se pudo escribir en api_errors.log:', e);
    }
  };

  let data;
  try {
    data = await request.formData();
  } catch (err: any) {
    await logError('Parsing formData', err);
    return new Response(JSON.stringify({ error: 'Error al procesar los datos del formulario: ' + err.message }), { status: 400 });
  }

  const file = data.get('file') as File;
  const folder = data.get('folder') as string || '';
  const username = (data.get('username') as string || '').trim();

  if (!file || typeof file === 'string' || !file.name) {
    return new Response(JSON.stringify({ error: 'No se ha proporcionado ningún archivo válido.' }), { status: 400 });
  }

  if (typeof file.arrayBuffer !== 'function') {
    return new Response(JSON.stringify({ error: 'El objeto de archivo no soporta lectura de buffer (arrayBuffer).' }), { status: 400 });
  }

  if (!username || username === 'Anónimo') {
    return new Response(JSON.stringify({ error: 'El nombre es obligatorio para la trazabilidad.' }), { status: 400 });
  }

  // Verificar si la carpeta existe y está activa en Supabase
  const { data: dbFolder, error: folderError } = await supabase
    .from('carpetas_evidencia')
    .select('id, nombre, activa')
    .eq('nombre', folder)
    .single();

  if (folderError || !dbFolder) {
    return new Response(JSON.stringify({ error: `La carpeta de destino "${folder}" no existe en el sistema.` }), { status: 400 });
  }

  if (!dbFolder.activa) {
    return new Response(JSON.stringify({ error: `La carpeta "${folder}" ha sido archivada y ya no acepta cargas.` }), { status: 400 });
  }

  const allowed = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
  const ext = path.extname(file.name).toLowerCase();
  if (!allowed.includes(ext)) {
    return new Response(JSON.stringify({ error: 'Extensión no permitida. Solo Office y PDF.' }), { status: 400 });
  }

  let targetFolder = '';
  try {
    targetFolder = path.join(UPLOAD_DIR, folder);
    await fs.mkdir(targetFolder, { recursive: true });
  } catch (err: any) {
    await logError('Creating target folder: ' + targetFolder, err);
    return new Response(JSON.stringify({ error: 'Error al crear la carpeta de destino: ' + err.message }), { status: 500 });
  }

  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  const filePath = path.join(targetFolder, fileName);

  let buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch (err: any) {
    await logError('Reading file arrayBuffer', err);
    return new Response(JSON.stringify({ error: 'Error al leer el contenido del archivo: ' + err.message }), { status: 500 });
  }

  try {
    await fs.writeFile(filePath, buffer);
  } catch (err: any) {
    await logError('Writing file to path: ' + filePath, err);
    return new Response(JSON.stringify({ error: 'Error al guardar el archivo físico en el servidor: ' + err.message }), { status: 500 });
  }

  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'desconocida';
  const dateStr = formatDate(new Date());
  const csvLine = `${dateStr},${ip},${username},${folder},${fileName}\n`;

  // Dynamically resolve csvPath to NAS if FILES_BASE_DIR is defined
  const csvPath = process.env.TRAZABILIDAD_CSV
    ? path.resolve(process.env.TRAZABILIDAD_CSV)
    : process.env.FILES_BASE_DIR
      ? path.join(path.dirname(path.resolve(process.env.FILES_BASE_DIR)), 'trazabilidad.csv')
      : path.join(process.cwd(), 'trazabilidad.csv');

  try {
    const csvDir = path.dirname(csvPath);
    await fs.mkdir(csvDir, { recursive: true });

    try {
      await fs.access(csvPath);
    } catch {
      await fs.writeFile(csvPath, 'Fecha,IP,Usuario,Carpeta Destino,Nombre del Archivo\n', 'utf8');
    }

    await fs.appendFile(csvPath, csvLine, 'utf8');
  } catch (err: any) {
    await logError('Writing to trazabilidad CSV: ' + csvPath, err);
  }

  // Registrar en Supabase y notificar a los administradores/auditores
  try {
    let success = false;
    let dbError = null;

    // Primer intento: incluir carpeta_id
    const resInsert = await supabase
      .from('trazabilidad_evidencias')
      .insert({
        ip,
        usuario: username,
        carpeta_destino: folder,
        nombre_archivo: fileName,
        carpeta_id: dbFolder.id
      });
    
    dbError = resInsert.error;

    if (!dbError) {
      success = true;
    } else {
      console.warn('Fallo al insertar con carpeta_id, reintentando sin él (probablemente no existe la columna):', dbError.message);
      // Fallback: reintentar sin carpeta_id
      const resFallback = await supabase
        .from('trazabilidad_evidencias')
        .insert({
          ip,
          usuario: username,
          carpeta_destino: folder,
          nombre_archivo: fileName
        });
      
      if (!resFallback.error) {
        success = true;
      } else {
        dbError = resFallback.error;
      }
    }

    if (!success && dbError) {
      console.error('Error definitivo al insertar trazabilidad de evidencia en Supabase:', dbError);
      return new Response(JSON.stringify({ error: 'Error al registrar la trazabilidad de la evidencia en la base de datos: ' + dbError.message }), { status: 500 });
    }

    // Notificar a los administradores/auditores si se registró con éxito
    if (success) {
      const { data: destUsers } = await supabase
        .from('usuarios')
        .select('id')
        .in('rol', ['admin', 'auditor'])
        .eq('activo', true);

      for (const dest of destUsers ?? []) {
        await crearNotificacion({
          usuario_id: dest.id,
          titulo: 'Nueva Evidencia Subida',
          contenido: `${username} ha depositado el archivo "${file.name}" en la carpeta "${folder}".`,
          tipo: 'evidencia'
        }).catch(() => {});
      }
    }
  } catch (dbErr: any) {
    console.error('Excepción al registrar trazabilidad en Supabase:', dbErr);
    return new Response(JSON.stringify({ error: 'Error interno en el servidor al registrar la evidencia: ' + dbErr.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ message: 'Subida exitosa', file: fileName }), { status: 200 });
}
