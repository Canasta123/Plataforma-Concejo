import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import { getSession } from '../../../../lib/auth';

const BUCKET = 'ticket-adjuntos';

// DELETE: eliminar un adjunto
export const DELETE: APIRoute = async ({ params, cookies }) => {
  const session = await getSession(cookies);
  if (!session) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const { id: adjuntoId } = params;

  const { data: adjunto } = await supabase
    .from('ticket_adjuntos')
    .select('*, ticket:ticket_id(creador_id)')
    .eq('id', adjuntoId)
    .single();

  if (!adjunto) return new Response(JSON.stringify({ error: 'Adjunto no encontrado' }), { status: 404 });

  // Solo puede eliminar: el que lo subió, o un admin/agente
  const esAdmin = ['admin', 'agente'].includes(session.rol);
  const esElQueSubio = adjunto.subido_por === session.id;

  if (!esAdmin && !esElQueSubio) {
    return new Response(JSON.stringify({ error: 'No tienes permiso para eliminar este archivo' }), { status: 403 });
  }

  // Eliminar del storage
  await supabase.storage.from(BUCKET).remove([adjunto.storage_path]);

  // Eliminar de la BD
  const { error } = await supabase.from('ticket_adjuntos').delete().eq('id', adjuntoId);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
