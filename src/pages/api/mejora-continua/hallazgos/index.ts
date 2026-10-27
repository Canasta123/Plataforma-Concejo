import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import { getSession } from '../../../../lib/auth';
import { esGestorMejora } from '../../../../lib/mejora-auth';
import { crearNotificacion } from '../../../../lib/notifications';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const session = await getSession(cookies);
    if (!session) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const isGestor = await esGestorMejora(session);
    const url = new URL(request.url);
    const estado = url.searchParams.get('estado');
    const tipo = url.searchParams.get('tipo');
    const origen = url.searchParams.get('origen');
    const proceso_id = url.searchParams.get('proceso_id');
    const responsable_id = url.searchParams.get('responsable_id');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('hallazgos')
      .select(`
        *,
        proceso:procesos_sgc(nombre),
        responsable:usuarios!responsable_id(nombre),
        creador:usuarios!creador_id(nombre)
      `, { count: 'exact' });

    if (!isGestor) {
      query = query.or(`creador_id.eq.${session.id},responsable_id.eq.${session.id}`);
    }

    if (estado) query = query.eq('estado', estado);
    if (tipo) query = query.eq('tipo', tipo);
    if (origen) query = query.eq('origen', origen);
    if (proceso_id) query = query.eq('proceso_id', proceso_id);
    if (responsable_id) query = query.eq('responsable_id', responsable_id);

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('Error fetching hallazgos:', error);
      return new Response(JSON.stringify({ error: 'Error al obtener hallazgos' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      data,
      meta: {
        total: count,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0
      }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const session = await getSession(cookies);
    if (!session) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await request.json();
    const { titulo, descripcion, tipo, proceso_id, responsable_id, requisito_incumplido, fecha_limite } = body;
    const isGestor = await esGestorMejora(session);

    let finalResponsableId = responsable_id;
    if (!finalResponsableId || !isGestor) {
      finalResponsableId = session.id;
    }

    const currentYear = new Date().getFullYear();
    const prefixMap: Record<string, string> = {
      no_conformidad_mayor: 'NCM',
      no_conformidad_menor: 'NCm',
      oportunidad_mejora: 'OM',
      producto_no_conforme: 'PNC',
      correctiva: 'NCM',
      mejora: 'OM',
      riesgo: 'AR'
    };
    const prefix = prefixMap[tipo as string] || 'HZ';

    const { count, error: countError } = await supabase
      .from('hallazgos')
      .select('*', { count: 'exact', head: true })
      .eq('tipo', tipo)
      .like('codigo', `${prefix}-${currentYear}-%`);

    if (countError) throw countError;

    const sequence = (count || 0) + 1;
    const codigo = `${prefix}-${currentYear}-${sequence.toString().padStart(4, '0')}`;

    const { data: newHallazgo, error: insertError } = await supabase
      .from('hallazgos')
      .insert({
        codigo,
        titulo,
        descripcion,
        tipo,
        proceso_id: proceso_id || null,
        responsable_id: finalResponsableId,
        creador_id: session.id,
        requisito_incumplido,
        fecha_limite,
        origen: 'autocontrol',
        etapa_actual: 1,
        estado: 'abierto'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting hallazgo:', insertError);
      return new Response(JSON.stringify({ error: 'Error al crear el hallazgo' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    await supabase.from('hallazgo_trazabilidad').insert({
      hallazgo_id: newHallazgo.id,
      autor_id: session.id,
      tipo: 'creacion',
      contenido: `Hallazgo creado con código ${codigo}`,
    });

    if (finalResponsableId !== session.id) {
      await crearNotificacion({
        usuario_id: finalResponsableId,
        titulo: 'Nuevo hallazgo asignado',
        contenido: `Se te ha asignado el hallazgo ${codigo}: ${titulo}`,
        tipo: 'mejora'
      });
    }

    return new Response(JSON.stringify(newHallazgo), { status: 201, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
