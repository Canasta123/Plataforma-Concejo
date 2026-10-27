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
    
    const { data, error } = await supabase
      .from('tratamientos_inmediatos')
      .select(`
        *,
        responsable:usuarios!tratamientos_inmediatos_responsable_id_fkey(nombre)
      `)
      .eq('hallazgo_id', hallazgo_id)
      .order('creado_en', { ascending: true });

    if (error) throw error;

    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
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
    const body = await request.json();
    const { descripcion, responsable_id, fecha_compromiso } = body;

    const gestor = await esGestorMejora(session);
    
    // Check if user is hallazgo responsable or gestor/admin
    const { data: hallazgo } = await supabase
      .from('hallazgos')
      .select('responsable_id')
      .eq('id', hallazgo_id)
      .single();
      
    if (!gestor && session.rol !== 'admin' && hallazgo?.responsable_id !== session.id) {
      return new Response(JSON.stringify({ error: 'Permisos insuficientes' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    const { data: tratamiento, error } = await supabase
      .from('tratamientos_inmediatos')
      .insert({
        hallazgo_id,
        descripcion,
        responsable_id,
        fecha_compromiso,
        completada: false
      })
      .select()
      .single();

    if (error) throw error;

    // Trazabilidad
    await supabase.from('hallazgo_trazabilidad').insert({
      hallazgo_id,
      tipo: 'tratamiento',
      contenido: 'Nuevo tratamiento inmediato creado',
      autor_id: session.id,
      metadata: { tratamiento_id: tratamiento.id }
    });

    // Notify responsable
    if (responsable_id !== session.id) {
      await crearNotificacion({
        usuario_id: responsable_id,
        titulo: 'Nuevo tratamiento asignado',
        contenido: 'Se te ha asignado un nuevo tratamiento inmediato.',
        tipo: 'mejora'
      });
    }

    return new Response(JSON.stringify(tratamiento), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const PATCH: APIRoute = async ({ request, cookies, params }) => {
  try {
    const session = await getSession(cookies);
    if (!session) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const { id: hallazgo_id } = params;
    const body = await request.json();
    const { tratamiento_id, completada, evidencia_texto } = body;

    const gestor = await esGestorMejora(session);

    const { data: tratamiento_actual } = await supabase
      .from('tratamientos_inmediatos')
      .select('responsable_id')
      .eq('id', tratamiento_id)
      .single();

    if (!gestor && session.rol !== 'admin' && tratamiento_actual?.responsable_id !== session.id) {
      return new Response(JSON.stringify({ error: 'Permisos insuficientes' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    const { data: tratamiento, error } = await supabase
      .from('tratamientos_inmediatos')
      .update({
        completada,
        evidencia_texto,
        fecha_completado: completada ? new Date().toISOString() : null
      })
      .eq('id', tratamiento_id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('hallazgo_trazabilidad').insert({
      hallazgo_id,
      tipo: 'tratamiento',
      contenido: completada ? 'Tratamiento completado' : 'Tratamiento actualizado',
      autor_id: session.id,
      metadata: { tratamiento_id }
    });

    return new Response(JSON.stringify(tratamiento), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
