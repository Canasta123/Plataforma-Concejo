import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';

export const GET: APIRoute = async ({ cookies }) => {
  const session = await getSession(cookies);
  if (!session) return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401 });
  if (session.rol !== 'auditor' && session.rol !== 'agente') {
    return new Response(JSON.stringify({ error: 'Sin permiso' }), { status: 403 });
  }

  const [
    { data: tickets },
    { data: trazabilidad },
  ] = await Promise.all([
    supabase.from('tickets').select('*'),
    supabase.from('trazabilidad').select('created_at, tipo').order('created_at', { ascending: true }),
  ]);

  const all = tickets ?? [];

  // Tickets por estado
  const porEstado = {
    abierto:     all.filter(t => t.estado === 'abierto').length,
    en_progreso: all.filter(t => t.estado === 'en_progreso').length,
    resuelto:    all.filter(t => t.estado === 'resuelto').length,
    cerrado:     all.filter(t => t.estado === 'cerrado').length,
  };

  // Tickets por prioridad
  const porPrioridad = {
    alta:  all.filter(t => t.prioridad === 'alta').length,
    media: all.filter(t => t.prioridad === 'media').length,
    baja:  all.filter(t => t.prioridad === 'baja').length,
  };

  // Tickets por categoría
  const porCategoria = {
    hardware: all.filter(t => t.categoria === 'hardware').length,
    software: all.filter(t => t.categoria === 'software').length,
    redes:    all.filter(t => t.categoria === 'redes').length,
    otro:     all.filter(t => t.categoria === 'otro').length,
  };

  // Cumplimiento SLA: tickets resueltos/cerrados dentro del límite
  const terminados = all.filter(t => t.estado === 'resuelto' || t.estado === 'cerrado');
  const dentroSla  = terminados.filter(t => {
    // Usamos updated_at como aproximación del momento de cierre
    const cierre = new Date(t.updated_at ?? t.fecha_creacion).getTime();
    return cierre <= new Date(t.fecha_limite).getTime();
  }).length;

  const sla = {
    total:     terminados.length,
    cumplidos: dentroSla,
    pct:       terminados.length > 0 ? Math.round((dentroSla / terminados.length) * 100) : 0,
  };

  // Tickets vencidos activos
  const vencidos = all.filter(t => {
    if (t.estado === 'resuelto' || t.estado === 'cerrado') return false;
    return Date.now() > new Date(t.fecha_limite).getTime();
  }).length;

  // Volumen por día (últimos 30 días)
  const hace30 = Date.now() - 30 * 24 * 3600 * 1000;
  const porDia: Record<string, number> = {};
  all
    .filter(t => new Date(t.fecha_creacion).getTime() >= hace30)
    .forEach(t => {
      const dia = t.fecha_creacion.slice(0, 10);
      porDia[dia] = (porDia[dia] ?? 0) + 1;
    });

  const diasOrdenados = Object.keys(porDia).sort();
  const volumen = {
    labels: diasOrdenados,
    data:   diasOrdenados.map(d => porDia[d]),
  };

  return new Response(JSON.stringify({
    total: all.length,
    porEstado,
    porPrioridad,
    porCategoria,
    sla,
    vencidos,
    volumen,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
