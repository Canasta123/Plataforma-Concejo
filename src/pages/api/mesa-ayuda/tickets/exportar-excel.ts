import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import { getSession } from '../../../../lib/auth';
import { generarLibroTickets } from '../../../../lib/excel';

export const GET: APIRoute = async ({ url, cookies }) => {
  const session = await getSession(cookies);
  if (!session) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const params = url.searchParams;
  const scope          = params.get('scope') ?? 'mios';
  const desde          = params.get('desde');
  const hasta          = params.get('hasta');
  const estados        = params.get('estados')?.split(',').filter(Boolean) ?? [];
  const categorias     = params.get('categorias')?.split(',').filter(Boolean) ?? [];
  const prioridades    = params.get('prioridades')?.split(',').filter(Boolean) ?? [];
  const agente_id      = params.get('agente_id');
  const solicitante_id = params.get('solicitante_id');
  const inclInternos   = params.get('incluir_internos') === 'true';
  const inclTrazab     = params.get('incluir_trazabilidad') !== 'false';

  // Permisos: solicitante solo puede ver sus propios tickets
  const esSolicitante = session.rol === 'solicitante';
  const scopeReal = esSolicitante ? 'mios' : scope;

  // Construir query de tickets
  let query = supabase
    .from('tickets')
    .select(`
      *,
      creador:creador_id ( id, nombre, correo, cargo ),
      agente:agente_id ( id, nombre, correo )
    `)
    .order('fecha_creacion', { ascending: false });

  if (scopeReal === 'mios' && session.rol === 'agente') {
    query = query.eq('agente_id', session.id);
  }
  if (esSolicitante) {
    query = query.eq('creador_id', session.id);
  }
  if (desde) query = query.gte('fecha_creacion', desde);
  if (hasta) query = query.lte('fecha_creacion', hasta + 'T23:59:59');
  if (estados.length)    query = query.in('estado', estados);
  if (categorias.length) query = query.in('categoria', categorias);
  if (prioridades.length) query = query.in('prioridad', prioridades);
  if (agente_id && agente_id !== 'todos' && session.rol !== 'solicitante') {
    query = query.eq('agente_id', agente_id);
  }
  if (solicitante_id && solicitante_id !== 'todos' && (session.rol === 'auditor' || session.rol === 'admin')) {
    query = query.eq('creador_id', solicitante_id);
  }

  const { data: tickets, error: ticketsError } = await query;
  if (ticketsError) return new Response(JSON.stringify({ error: ticketsError.message }), { status: 500 });

  const ticketIds = (tickets ?? []).map((t: any) => t.id);

  // Trazabilidad (si se pidió)
  let trazabilidad: any[] = [];
  if (inclTrazab && ticketIds.length > 0) {
    let tQuery = supabase
      .from('trazabilidad')
      .select('*, autor:autor_id ( nombre )')
      .in('ticket_id', ticketIds)
      .order('created_at', { ascending: true });

    if (!inclInternos) tQuery = tQuery.eq('es_interno', false);
    const { data } = await tQuery;
    trazabilidad = data ?? [];
  }

  // Generar Excel
  const filtrosAplicados = { scope: scopeReal, desde, hasta, estados, categorias, prioridades, agente_id, solicitante_id };
  const buffer = await generarLibroTickets(tickets ?? [], trazabilidad, {
    incluirTrazabilidad: inclTrazab,
    incluirInternos: inclInternos,
    filtrosAplicados,
    generadoPor: session.nombre,
  });

  // Registrar exportación
  await supabase.from('exportaciones').insert({
    usuario_id: session.id,
    filtros: filtrosAplicados,
    tickets_count: tickets?.length ?? 0,
    incluyo_internos: inclInternos,
  });

  const fecha = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '');
  const filename = `tickets-${fecha}.xlsx`;

  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
};
