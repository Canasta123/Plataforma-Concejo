import type { APIRoute } from 'astro';
import { supabase } from '../../../../../lib/supabase';
import { getSession } from '../../../../../lib/auth';

const BUCKET = 'ticket-adjuntos';
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const TIPOS_PERMITIDOS = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

async function verificarAcceso(ticketId: string, session: { id: string; rol: string }) {
  if (['admin', 'agente', 'auditor'].includes(session.rol)) return true;
  const { data } = await supabase
    .from('tickets')
    .select('id')
    .eq('id', ticketId)
    .eq('creador_id', session.id)
    .single();
  return !!data;
}

// GET: listar adjuntos del ticket con URLs firmadas
export const GET: APIRoute = async ({ params, cookies }) => {
  const session = await getSession(cookies);
  if (!session) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const { id: ticketId } = params;
  const tieneAcceso = await verificarAcceso(ticketId!, session);
  if (!tieneAcceso) return new Response(JSON.stringify({ error: 'No tienes acceso a este ticket' }), { status: 403 });

  const { data: adjuntos, error } = await supabase
    .from('ticket_adjuntos')
    .select('*, subido_por_usuario:subido_por(nombre)')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  // Generar URLs firmadas (válidas 1 hora) para cada adjunto
  const conUrls = await Promise.all(
    (adjuntos ?? []).map(async (adj) => {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(adj.storage_path, 3600);
      return { ...adj, url_firmada: signed?.signedUrl ?? null };
    })
  );

  return new Response(JSON.stringify(conUrls), { status: 200 });
};

// POST: subir un adjunto al ticket
export const POST: APIRoute = async ({ params, request, cookies }) => {
  const session = await getSession(cookies);
  if (!session) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const { id: ticketId } = params;
  const tieneAcceso = await verificarAcceso(ticketId!, session);
  if (!tieneAcceso) return new Response(JSON.stringify({ error: 'No tienes acceso a este ticket' }), { status: 403 });

  const formData = await request.formData();
  const archivo = formData.get('archivo') as File | null;

  if (!archivo) return new Response(JSON.stringify({ error: 'No se recibió ningún archivo' }), { status: 400 });
  if (archivo.size > MAX_BYTES) return new Response(JSON.stringify({ error: 'El archivo supera el límite de 10 MB' }), { status: 400 });
  if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
    return new Response(JSON.stringify({ error: 'Tipo de archivo no permitido. Se aceptan: imágenes, PDF, Word y Excel.' }), { status: 400 });
  }

  // Nombre único para evitar colisiones
  const extension = archivo.name.split('.').pop() ?? 'bin';
  const storagePath = `${ticketId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  const buffer = await archivo.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: archivo.type, upsert: false });

  if (uploadError) return new Response(JSON.stringify({ error: 'Error al subir el archivo: ' + uploadError.message }), { status: 500 });

  const { data, error: dbError } = await supabase
    .from('ticket_adjuntos')
    .insert({
      ticket_id: ticketId,
      nombre_original: archivo.name,
      storage_path: storagePath,
      mime_type: archivo.type,
      tamanio_bytes: archivo.size,
      subido_por: session.id,
    })
    .select()
    .single();

  if (dbError) {
    // Limpiar el archivo si falla la BD
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return new Response(JSON.stringify({ error: dbError.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data), { status: 201 });
};
