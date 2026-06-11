import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import { getSession } from '../../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const body = await request.json();
    const { sgc_marcador, mesa_marcador, capacitacion_recibida, comentarios, valoracion_sgc, valoracion_mesa } = body;

    const { error } = await supabase
      .from('usuarios')
      .update({
        induccion_sgc: !!sgc_marcador,
        induccion_mesa: !!mesa_marcador,
        induccion_capacitacion: !!capacitacion_recibida,
        induccion_completada: true,
        induccion_fecha: new Date().toISOString(),
        induccion_comentarios: comentarios || null,
        induccion_valoracion_sgc: typeof valoracion_sgc === 'number' ? valoracion_sgc : null,
        induccion_valoracion_mesa: typeof valoracion_mesa === 'number' ? valoracion_mesa : null,
      })
      .eq('id', session.id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
};
