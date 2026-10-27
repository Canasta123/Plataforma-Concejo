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
      .from('plan_accion_tareas')
      .select(`
        *,
        responsable:usuarios!plan_accion_tareas_responsable_id_fkey(nombre)
      `)
      .eq('hallazgo_id', hallazgo_id)
      .order('fecha_inicio', { ascending: true });

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
    const { actividad, descripcion_detalle, responsable_id, fecha_inicio, fecha_limite } = body;

    const gestor = await esGestorMejora(session);
    const { data: hallazgo } = await supabase
      .from('hallazgos')
      .select('responsable_id')
      .eq('id', hallazgo_id)
      .single();

    if (!gestor && session.rol !== 'admin' && hallazgo?.responsable_id !== session.id) {
      return new Response(JSON.stringify({ error: 'Permisos insuficientes' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    const { data: tarea, error } = await supabase
      .from('plan_accion_tareas')
      .insert({
        hallazgo_id,
        actividad,
        descripcion_detalle,
        responsable_id,
        fecha_inicio,
        fecha_limite,
        estado: 'pendiente',
        porcentaje_avance: 0
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('hallazgo_trazabilidad').insert({
      hallazgo_id,
      tipo: 'tarea_plan',
      contenido: 'Nueva tarea del plan de acción creada',
      autor_id: session.id,
      metadata: { tarea_id: tarea.id }
    });

    if (responsable_id !== session.id) {
      await crearNotificacion({
        usuario_id: responsable_id,
        titulo: 'Nueva tarea asignada',
        contenido: `Se te ha asignado una nueva tarea: ${actividad}`,
        tipo: 'mejora'
      });
    }

    return new Response(JSON.stringify(tarea), { status: 201, headers: { 'Content-Type': 'application/json' } });
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
    const { tarea_id, estado, porcentaje_avance, evidencia_texto } = body;

    const gestor = await esGestorMejora(session);
    const { data: tarea_actual } = await supabase
      .from('plan_accion_tareas')
      .select('responsable_id')
      .eq('id', tarea_id)
      .single();

    if (!gestor && session.rol !== 'admin' && tarea_actual?.responsable_id !== session.id) {
      return new Response(JSON.stringify({ error: 'Permisos insuficientes' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    const completada = estado === 'completada';
    
    const updates: any = {
      estado,
      evidencia_texto,
      porcentaje_avance: completada ? 100 : porcentaje_avance
    };

    if (completada) {
      updates.fecha_completado = new Date().toISOString();
    }

    const { data: tarea, error } = await supabase
      .from('plan_accion_tareas')
      .update(updates)
      .eq('id', tarea_id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('hallazgo_trazabilidad').insert({
      hallazgo_id,
      tipo: 'tarea_plan',
      contenido: `Tarea actualizada: ${estado}`,
      autor_id: session.id,
      metadata: { tarea_id, avance: updates.porcentaje_avance }
    });

    return new Response(JSON.stringify(tarea), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
