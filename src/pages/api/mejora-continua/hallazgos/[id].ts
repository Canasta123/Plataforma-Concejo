import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import { getSession } from '../../../../lib/auth';
import { esGestorMejora } from '../../../../lib/mejora-auth';

export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    const session = await getSession(cookies);
    if (!session) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const hallazgoId = params.id;
    if (!hallazgoId) {
      return new Response(JSON.stringify({ error: 'ID de hallazgo requerido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const { data: hallazgo, error } = await supabase
      .from('hallazgos')
      .select(`
        *,
        proceso:procesos_sgc(nombre),
        responsable:usuarios!responsable_id(id, nombre),
        creador:usuarios!creador_id(id, nombre)
      `)
      .eq('id', hallazgoId)
      .single();

    if (error || !hallazgo) {
      return new Response(JSON.stringify({ error: 'Hallazgo no encontrado' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const isGestor = await esGestorMejora(session);
    let hasAccess = isGestor || hallazgo.creador_id === session.id || hallazgo.responsable_id === session.id;

    // Fetch related data separately for cleaner queries
    const [
      { data: tratamientos },
      { data: analisis },
      { data: tareas },
      { data: evaluaciones },
      { data: trazabilidad }
    ] = await Promise.all([
      supabase.from('tratamientos_inmediatos')
        .select('*, responsable:usuarios!responsable_id(id, nombre)')
        .eq('hallazgo_id', hallazgoId)
        .order('created_at'),
      supabase.from('analisis_causas')
        .select('*, analista:usuarios!analista_id(id, nombre)')
        .eq('hallazgo_id', hallazgoId)
        .order('created_at'),
      supabase.from('plan_accion_tareas')
        .select('*, responsable:usuarios!responsable_id(id, nombre)')
        .eq('hallazgo_id', hallazgoId)
        .order('created_at'),
      supabase.from('evaluaciones_eficacia')
        .select('*, evaluador:usuarios!evaluador_id(id, nombre)')
        .eq('hallazgo_id', hallazgoId)
        .order('created_at'),
      supabase.from('hallazgo_trazabilidad')
        .select('*, autor:usuarios!autor_id(id, nombre)')
        .eq('hallazgo_id', hallazgoId)
        .order('created_at')
    ]);

    // Check if user has tasks assigned to them
    if (!hasAccess && tareas) {
      hasAccess = tareas.some((t: any) => t.responsable_id === session.id);
    }
    if (!hasAccess && tratamientos) {
      hasAccess = tratamientos.some((t: any) => t.responsable_id === session.id);
    }

    if (!hasAccess) {
      return new Response(JSON.stringify({ error: 'Acceso denegado' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    const result = {
      ...hallazgo,
      tratamientos_inmediatos: tratamientos ?? [],
      analisis_causas: analisis ?? [],
      plan_accion_tareas: tareas ?? [],
      evaluaciones_eficacia: evaluaciones ?? [],
      hallazgo_trazabilidad: trazabilidad ?? []
    };

    return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const PATCH: APIRoute = async ({ request, params, cookies }) => {
  try {
    const session = await getSession(cookies);
    if (!session) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const hallazgoId = params.id;
    const body = await request.json();
    const isGestor = await esGestorMejora(session);

    const { data: currentHallazgo, error: fetchError } = await supabase
      .from('hallazgos')
      .select('etapa_actual, responsable_id, creador_id')
      .eq('id', hallazgoId)
      .single();

    if (fetchError || !currentHallazgo) {
      return new Response(JSON.stringify({ error: 'Hallazgo no encontrado' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    if (!isGestor && currentHallazgo.responsable_id !== session.id) {
      return new Response(JSON.stringify({ error: 'Solo el gestor o el responsable pueden actualizar' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    const updateData: any = { ...body };
    let trazabilidadMsg = 'Hallazgo actualizado';

    if (updateData.etapa_actual && updateData.etapa_actual !== currentHallazgo.etapa_actual) {
      const newEtapa = updateData.etapa_actual;
      const oldEtapa = currentHallazgo.etapa_actual;

      if (newEtapa < oldEtapa && newEtapa !== 3) {
         return new Response(JSON.stringify({ error: 'No se puede retroceder de etapa (excepto a reformulación)' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      switch (newEtapa) {
        case 2: updateData.estado = 'en_tratamiento'; break;
        case 3: updateData.estado = oldEtapa > 3 ? 'reformulado' : 'en_analisis'; break;
        case 4: updateData.estado = 'en_plan_accion'; break;
        case 5: updateData.estado = 'en_evaluacion'; break;
      }
      trazabilidadMsg = `Etapa cambiada de ${oldEtapa} a ${newEtapa}. Estado: ${updateData.estado}`;
    }

    const { data: updatedHallazgo, error: updateError } = await supabase
      .from('hallazgos')
      .update(updateData)
      .eq('id', hallazgoId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating hallazgo:', updateError);
      return new Response(JSON.stringify({ error: 'Error al actualizar el hallazgo' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    await supabase.from('hallazgo_trazabilidad').insert({
      hallazgo_id: hallazgoId,
      autor_id: session.id,
      tipo: updateData.etapa_actual && updateData.etapa_actual !== currentHallazgo.etapa_actual ? 'cambio_estado' : 'actualizacion',
      contenido: trazabilidadMsg,
    });

    return new Response(JSON.stringify(updatedHallazgo), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
