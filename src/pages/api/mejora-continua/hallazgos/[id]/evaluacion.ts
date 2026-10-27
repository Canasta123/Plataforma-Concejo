import type { APIRoute } from 'astro';
import { supabase } from '../../../../../lib/supabase';
import { getSession } from '../../../../../lib/auth';
import { esGestorMejora } from '../../../../../lib/mejora-auth';
import { crearNotificacion } from '../../../../../lib/notifications';

export const POST: APIRoute = async ({ request, params, cookies }) => {
  try {
    const session = await getSession(cookies);
    if (!session) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const isGestor = await esGestorMejora(session);
    if (!isGestor) {
      return new Response(JSON.stringify({ error: 'Solo administradores o gestores pueden evaluar eficacia' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    const hallazgo_id = params.id;
    const body = await request.json();
    const { es_eficaz, justificacion } = body;

    if (typeof es_eficaz !== 'boolean' || !justificacion?.trim()) {
      return new Response(JSON.stringify({ error: 'es_eficaz (boolean) y justificacion son requeridos' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const { data: hallazgo, error: hallazgoError } = await supabase
      .from('hallazgos')
      .select('*')
      .eq('id', hallazgo_id)
      .single();

    if (hallazgoError || !hallazgo) {
      return new Response(JSON.stringify({ error: 'Hallazgo no encontrado' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Insert evaluation record
    await supabase.from('evaluaciones_eficacia').insert({
      hallazgo_id,
      evaluador_id: session.id,
      es_eficaz,
      justificacion,
      accion_tomada: es_eficaz ? 'cerrar' : 'reformular'
    });

    if (es_eficaz) {
      // Close as effective
      await supabase
        .from('hallazgos')
        .update({
          estado: 'cerrado_eficaz',
          fecha_cierre: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', hallazgo_id);

      await supabase.from('hallazgo_trazabilidad').insert({
        hallazgo_id,
        autor_id: session.id,
        tipo: 'evaluacion',
        contenido: 'Hallazgo cerrado como eficaz',
        metadata: { justificacion }
      });
    } else {
      // Not effective — check reformulation limit
      const { data: config } = await supabase
        .from('config_mejora')
        .select('valor')
        .eq('clave', 'max_reformulaciones')
        .single();

      const maxReformulaciones = config?.valor ? parseInt(config.valor) : 3;
      const nuevosIntentos = (hallazgo.intentos_reformulacion || 0) + 1;

      if (nuevosIntentos < maxReformulaciones) {
        // Reformulate — send back to stage 3
        await supabase
          .from('hallazgos')
          .update({
            estado: 'reformulado',
            etapa_actual: 3,
            intentos_reformulacion: nuevosIntentos,
            updated_at: new Date().toISOString()
          })
          .eq('id', hallazgo_id);

        await supabase.from('hallazgo_trazabilidad').insert({
          hallazgo_id,
          autor_id: session.id,
          tipo: 'reformulacion',
          contenido: `Hallazgo reformulado — regresa a Etapa 3 (Intento ${nuevosIntentos} de ${maxReformulaciones})`,
          metadata: { justificacion, intento: nuevosIntentos }
        });
      } else {
        // Limit exceeded — close as not effective
        await supabase
          .from('hallazgos')
          .update({
            estado: 'cerrado_no_eficaz',
            fecha_cierre: new Date().toISOString(),
            intentos_reformulacion: nuevosIntentos,
            updated_at: new Date().toISOString()
          })
          .eq('id', hallazgo_id);

        await supabase.from('hallazgo_trazabilidad').insert({
          hallazgo_id,
          autor_id: session.id,
          tipo: 'evaluacion',
          contenido: `Hallazgo cerrado como NO eficaz — límite de ${maxReformulaciones} reformulaciones alcanzado`,
          metadata: { justificacion, intento: nuevosIntentos }
        });

        // Critical notification to all admins
        const { data: admins } = await supabase
          .from('usuarios')
          .select('id')
          .eq('rol', 'admin')
          .eq('activo', true);

        if (admins) {
          for (const admin of admins) {
            await crearNotificacion({
              usuario_id: admin.id,
              titulo: '⚠️ Alerta Crítica: Hallazgo No Eficaz',
              contenido: `El hallazgo ${hallazgo.codigo} "${hallazgo.titulo}" ha sido cerrado como NO eficaz tras ${nuevosIntentos} intentos de reformulación. Se requiere intervención.`,
              tipo: 'mejora'
            });
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Error en evaluación de eficacia:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error interno del servidor' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
