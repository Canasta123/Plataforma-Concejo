import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import { getSession } from '../../../../lib/auth';
import { notificarTicketCreado } from '../../../../lib/mailer';
import type { Prioridad, Categoria } from '../../../../lib/supabase';

// Valores de fallback en caso de que la categoría no exista en la BD
const SLA_HORAS_DEFAULT: Record<Prioridad, number> = { alta: 4, media: 24, baja: 72 };

export const GET: APIRoute = async ({ cookies }) => {
  const session = await getSession(cookies);
  if (!session) return new Response('Unauthorized', { status: 401 });

  let query = supabase
    .from('tickets')
    .select('*')
    .order('fecha_creacion', { ascending: false });

  if (session.rol === 'solicitante') {
    query = query.eq('creador_id', session.id);
  }

  const { data, error } = await query;
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
};

function calcularFechaLimiteHabiles(fechaInicio: Date, horasSla: number): Date {
  const currentDate = new Date(fechaInicio.getTime());
  let slaMinutesRemaining = horasSla * 60;
  let safetyLoop = 0;

  while (slaMinutesRemaining > 0 && safetyLoop < 1000) {
    safetyLoop++;
    const day = currentDate.getDay(); // 0 = Domingo, 6 = Sábado
    const hour = currentDate.getHours();
    const minute = currentDate.getMinutes();
    const timeInMinutes = hour * 60 + minute;

    // 1. Fin de semana -> saltar al lunes a las 8:00 AM
    if (day === 0 || day === 6) {
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(8, 0, 0, 0);
      continue;
    }

    // 2. Antes de las 8:00 AM -> ir a las 8:00 AM del mismo día
    if (timeInMinutes < 8 * 60) {
      currentDate.setHours(8, 0, 0, 0);
      continue;
    }

    // 3. Hora de almuerzo (1:00 PM a 2:00 PM) -> ir a las 2:00 PM del mismo día
    if (timeInMinutes >= 13 * 60 && timeInMinutes < 14 * 60) {
      currentDate.setHours(14, 0, 0, 0);
      continue;
    }

    // 4. Después de las 5:30 PM (17:30) -> ir a las 8:00 AM del siguiente día
    if (timeInMinutes >= 17 * 60 + 30) {
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(8, 0, 0, 0);
      continue;
    }

    // 5. Horario laboral
    const blockEnd = new Date(currentDate.getTime());
    if (timeInMinutes >= 8 * 60 && timeInMinutes < 13 * 60) {
      // Bloque mañana: 8:00 AM - 1:00 PM
      blockEnd.setHours(13, 0, 0, 0);
    } else {
      // Bloque tarde: 2:00 PM - 5:30 PM
      blockEnd.setHours(17, 30, 0, 0);
    }

    const minutesInBlock = (blockEnd.getTime() - currentDate.getTime()) / (60 * 1000);

    if (slaMinutesRemaining <= minutesInBlock) {
      currentDate.setTime(currentDate.getTime() + slaMinutesRemaining * 60 * 1000);
      slaMinutesRemaining = 0;
    } else {
      currentDate.setTime(blockEnd.getTime());
      slaMinutesRemaining -= minutesInBlock;
    }
  }

  return currentDate;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session) return new Response('Unauthorized', { status: 401 });

  const form = await request.formData();
  const rawCategoria = (form.get('categoria') as string) ?? 'otro';
  const categoria  = rawCategoria.toLowerCase() as Categoria;
  const prioridad  = (form.get('prioridad')   as Prioridad) ?? 'media';
  const titulo     = ((form.get('titulo')     as string) ?? '').trim();
  const descripcion = ((form.get('descripcion') as string) ?? '').trim();

  if (!titulo || !descripcion) {
    return new Response(JSON.stringify({ error: 'Título y descripción son requeridos' }), { status: 400 });
  }

  // Leer SLA dinámicamente desde la base de datos según la categoría del ticket
  let horasSla = SLA_HORAS_DEFAULT[prioridad]; // Fallback a los valores por defecto

  const { data: catData } = await supabase
    .from('categorias_ticket')
    .select('sla_horas_alta, sla_horas_media, sla_horas_baja')
    .ilike('nombre', categoria)
    .maybeSingle();

  if (catData) {
    const mapaDb: Record<Prioridad, number> = {
      alta:  catData.sla_horas_alta,
      media: catData.sla_horas_media,
      baja:  catData.sla_horas_baja,
    };
    horasSla = mapaDb[prioridad];
  }

  const fecha_limite = calcularFechaLimiteHabiles(new Date(), horasSla);

  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true });

  const year  = new Date().getFullYear();
  const seq   = String((count ?? 0) + 1).padStart(4, '0');
  const codigo = `TK-${year}-${seq}`;

  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert({ codigo, creador_id: session.id, categoria, prioridad, titulo, descripcion, fecha_limite })
    .select()
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  await supabase.from('trazabilidad').insert({
    ticket_id:  ticket.id,
    autor_id:   session.id,
    tipo:       'comentario',
    contenido:  descripcion,
    es_interno: false,
  });

  (async () => {
    const { data: solicitante } = await supabase.from('usuarios').select('*').eq('id', session.id).single();
    const { data: agentes }    = await supabase.from('usuarios').select('*').eq('rol', 'agente').eq('activo', true);
    if (solicitante && agentes) {
      await notificarTicketCreado(ticket, solicitante, agentes).catch(() => {});
    }
  })();

  return new Response(JSON.stringify({ id: ticket.id, codigo: ticket.codigo }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
