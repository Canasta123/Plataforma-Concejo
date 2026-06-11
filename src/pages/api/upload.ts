import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

// Ruta de uploads: prioriza UPLOAD_DIR, luego FILES_BASE_DIR/archivos, finalmente public/archivos.
const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : process.env.FILES_BASE_DIR
    ? path.resolve(process.env.FILES_BASE_DIR, 'archivos')
    : process.env.NODE_ENV === 'production'
      ? path.join(process.cwd(), 'dist', 'client', 'archivos')
      : path.join(process.cwd(), 'public', 'archivos');

const CARPETAS_PERMITIDAS = [
  'Riesgos y oportunidades',
  'Planes de Mejoramiento',
  'Indicadores',
  'Revisión por la Dirección',
  'Modelo Integrado de Planeación y Gestión 2025',
  'Seguimiento Planes Institucionales',
  'SG-SST',
  'Empalme',
];

function formatDate(d: Date): string {
  const p = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
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

  if (!CARPETAS_PERMITIDAS.includes(folder)) {
    return new Response(JSON.stringify({ error: `Categoría de destino "${folder}" no permitida para evidencias.` }), { status: 400 });
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
    // We don't fail the upload if only CSV log fails, but we log it
  }

  return new Response(JSON.stringify({ message: 'Subida exitosa', file: fileName }), { status: 200 });
}
