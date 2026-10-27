import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { getSession } from '../../../lib/auth';
import { esGestorMejora } from '../../../lib/mejora-auth';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const session = await getSession(cookies);
    if (!session) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const gestor = await esGestorMejora(session);
    if (!gestor && session.rol !== 'admin') {
      return new Response(JSON.stringify({ error: 'Permisos insuficientes' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // 1. Total hallazgos by estado
    const { data: estadoData, error: estadoError } = await supabase
      .from('hallazgos')
      .select('estado');
    if (estadoError) throw estadoError;

    const estadosCount = estadoData.reduce((acc: any, curr) => {
      acc[curr.estado] = (acc[curr.estado] || 0) + 1;
      return acc;
    }, {});

    // 2. Total by tipo
    const { data: tipoData, error: tipoError } = await supabase
      .from('hallazgos')
      .select('tipo');
    if (tipoError) throw tipoError;

    const tiposCount = tipoData.reduce((acc: any, curr) => {
      acc[curr.tipo] = (acc[curr.tipo] || 0) + 1;
      return acc;
    }, {});

    // 3. Total by proceso
    const { data: procesoData, error: procesoError } = await supabase
      .from('hallazgos')
      .select(`
        proceso_id,
        procesos(nombre)
      `);
    if (procesoError) throw procesoError;

    const procesosCount = procesoData.reduce((acc: any, curr: any) => {
      const name = Array.isArray(curr.procesos) ? curr.procesos[0]?.nombre : (curr.procesos?.nombre || 'Desconocido');
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});

    // 4. Percentage of cerrado_eficaz vs total cerrados
    const totalCerrados = estadoData.filter(h => h.estado === 'cerrado_eficaz' || h.estado === 'cerrado_no_eficaz').length;
    const cerradosEficaces = estadoData.filter(h => h.estado === 'cerrado_eficaz').length;
    const porcentajeEficacia = totalCerrados > 0 ? (cerradosEficaces / totalCerrados) * 100 : 0;

    // 5. Hallazgos vencidos
    const now = new Date().toISOString();
    const { data: vencidos, error: vencidosError } = await supabase
      .from('hallazgos')
      .select('id, codigo, estado, fecha_limite')
      .not('estado', 'in', '("cerrado_eficaz","cerrado_no_eficaz")')
      .lt('fecha_limite', now);
    if (vencidosError) throw vencidosError;

    // 6. Monthly trend (last 6 months)
    const sixMonthsAgoDate = new Date();
    sixMonthsAgoDate.setMonth(sixMonthsAgoDate.getMonth() - 6);
    const { data: trendData, error: trendError } = await supabase
      .from('hallazgos')
      .select('fecha_registro')
      .gte('fecha_registro', sixMonthsAgoDate.toISOString());
    if (trendError) throw trendError;

    const monthlyTrend = trendData.reduce((acc: any, curr) => {
      const month = new Date(curr.fecha_registro).toLocaleString('default', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    // 7. Recent hallazgos
    const { data: recientes, error: recientesError } = await supabase
      .from('hallazgos')
      .select('id, codigo, titulo, estado, fecha_registro')
      .order('fecha_registro', { ascending: false })
      .limit(10);
    if (recientesError) throw recientesError;

    return new Response(JSON.stringify({
      estadosCount,
      tiposCount,
      procesosCount,
      porcentajeEficacia,
      vencidosCount: vencidos.length,
      monthlyTrend,
      recientes
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
