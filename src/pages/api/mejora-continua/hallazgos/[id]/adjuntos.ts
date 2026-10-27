import type { APIRoute } from 'astro';
import { supabase } from '../../../../../lib/supabase';
import { getSession } from '../../../../../lib/auth';
import { esGestorMejora } from '../../../../../lib/mejora-auth';
import { crearNotificacion } from '../../../../../lib/notifications';

export const GET: APIRoute = async ({ request, cookies, params }) => {
  try {
    const session = await getSession(cookies);
    if (!session) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const { id: hallazgo_id } = params;
    
    const { data: adjuntos, error } = await supabase
      .from('hallazgo_adjuntos')
      .select('*')
      .eq('hallazgo_id', hallazgo_id)
      .order('creado_en', { ascending: false });

    if (error) throw error;

    // Generate signed URLs
    const adjuntosUrl = await Promise.all(adjuntos.map(async (adj) => {
      const { data } = await supabase.storage
        .from('hallazgo-adjuntos')
        .createSignedUrl(adj.archivo_ruta, 3600);
      
      return {
        ...adj,
        url: data?.signedUrl || null
      };
    }));

    return new Response(JSON.stringify(adjuntosUrl), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const POST: APIRoute = async ({ request, cookies, params }) => {
  try {
    const session = await getSession(cookies);
    if (!session) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const { id: hallazgo_id } = params;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const etapa = formData.get('etapa');

    if (!file || !etapa) {
      return new Response(JSON.stringify({ error: 'Archivo o etapa no proporcionados' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const fileExt = file.name.split('.').pop();
    const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    const filePath = `hallazgos/${hallazgo_id}/${etapa}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from('hallazgo-adjuntos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: adjunto, error: dbError } = await supabase
      .from('hallazgo_adjuntos')
      .insert({
        hallazgo_id,
        nombre_original: file.name,
        archivo_ruta: filePath,
        etapa_cargado: parseInt(etapa.toString()),
        subido_por: session.id,
        tipo_mime: file.type,
        tamanio_bytes: file.size
      })
      .select()
      .single();

    if (dbError) throw dbError;

    await supabase.from('hallazgo_trazabilidad').insert({
      hallazgo_id,
      tipo: 'adjunto',
      contenido: 'Archivo adjunto subido',
      autor_id: session.id,
      metadata: { adjunto_id: adjunto.id }
    });

    return new Response(JSON.stringify(adjunto), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
