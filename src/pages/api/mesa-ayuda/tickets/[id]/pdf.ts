import type { APIRoute } from 'astro';
import { getSession } from '../../../../../lib/auth';
import { supabase } from '../../../../../lib/supabase';

export const GET: APIRoute = async ({ cookies, params }) => {
  const session = await getSession(cookies);
  if (!session) return new Response('No autenticado', { status: 401 });
  if (session.rol !== 'auditor' && session.rol !== 'agente') {
    return new Response('Sin permiso', { status: 403 });
  }

  const { id } = params;

  const [{ data: ticket }, { data: trazabilidad }, { data: adjuntos }] = await Promise.all([
    supabase.from('tickets').select('*').eq('id', id).single(),
    supabase
      .from('trazabilidad')
      .select('*, autor:autor_id(nombre, cargo)')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('ticket_adjuntos')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true }),
  ]);

  if (!ticket) return new Response('Ticket no encontrado', { status: 404 });

  const [{ data: creador }, { data: agente }] = await Promise.all([
    supabase.from('usuarios').select('nombre, correo, cargo').eq('id', ticket.creador_id).single(),
    ticket.agente_id
      ? supabase.from('usuarios').select('nombre, cargo').eq('id', ticket.agente_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const fmt = (d: string) =>
    new Date(d).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'medium', timeStyle: 'short' });

  const estadoLabel: Record<string, string> = {
    abierto: 'Abierto', en_progreso: 'En Progreso', resuelto: 'Resuelto', cerrado: 'Cerrado',
  };

  const rows = (trazabilidad ?? []).map(e => `
    <tr>
      <td>${fmt(e.created_at)}</td>
      <td>${e.tipo.replace('_', ' ')}</td>
      <td>${(e.autor as any)?.nombre ?? 'Sistema'}</td>
      <td>${e.es_interno ? '<em>Nota interna</em>' : ''}</td>
      <td style="white-space:pre-wrap">${escHtml(e.contenido)}</td>
    </tr>`).join('');

  const adjuntosConUrl = await Promise.all(
    (adjuntos ?? []).map(async (adj) => {
      const { data: signed } = await supabase.storage
        .from('ticket-adjuntos')
        .createSignedUrl(adj.storage_path, 3600);
      return { ...adj, url: signed?.signedUrl ?? null };
    })
  );

  const htmlAdjuntos = adjuntosConUrl.map(adj => {
    if (adj.mime_type?.startsWith('image/')) {
      return `<div style="margin-bottom: 16px; page-break-inside: avoid;">
        <strong style="display:block; font-size:11px; color:#555; margin-bottom:4px">${escHtml(adj.nombre_original)}</strong>
        <img src="${adj.url}" style="max-width: 100%; border: 1px solid #e5e7eb; border-radius: 4px;" alt="Evidencia">
      </div>`;
    } else {
      return `<div style="margin-bottom: 8px; font-size: 11px;">
        📄 <a href="${adj.url}" target="_blank" style="color: #1d4ed8; text-decoration: none;">${escHtml(adj.nombre_original)}</a>
      </div>`;
    }
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Evidencia ${ticket.codigo}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; margin: 32px; }
  h1   { font-size: 18px; color: #1e3a5f; margin-bottom: 4px; }
  .sub { color: #666; font-size: 11px; margin-bottom: 24px; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 24px;
          border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; background: #f9fafb; }
  .meta dt { font-weight: bold; color: #555; font-size: 10px; text-transform: uppercase; }
  .meta dd { margin: 0 0 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th { background: #1e3a5f; color: #fff; padding: 6px 8px; text-align: left; font-size: 11px; }
  td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; font-size: 11px; }
  tr:nth-child(even) td { background: #f9fafb; }
  .footer { margin-top: 32px; font-size: 10px; color: #999; text-align: center; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: bold; }
  .badge-abierto    { background: #dbeafe; color: #1d4ed8; }
  .badge-en_progreso{ background: #fef9c3; color: #92400e; }
  .badge-resuelto   { background: #dcfce7; color: #15803d; }
  .badge-cerrado    { background: #f3f4f6; color: #6b7280; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
  <h1>Evidencia de Ticket — ${ticket.codigo}</h1>
  <p class="sub">Concejo Municipal de Chía · Sistema de Mesa de Ayuda · Generado: ${fmt(new Date().toISOString())}</p>

  <dl class="meta">
    <div><dt>Título</dt><dd>${escHtml(ticket.titulo)}</dd></div>
    <div><dt>Estado</dt><dd><span class="badge badge-${ticket.estado}">${estadoLabel[ticket.estado] ?? ticket.estado}</span></dd></div>
    <div><dt>Prioridad</dt><dd>${ticket.prioridad}</dd></div>
    <div><dt>Categoría</dt><dd>${ticket.categoria}</dd></div>
    <div><dt>Solicitante</dt><dd>${escHtml(creador?.nombre ?? '—')} ${creador?.correo ? `(${creador.correo})` : ''}</dd></div>
    <div><dt>Agente</dt><dd>${escHtml(agente?.nombre ?? 'Sin asignar')}</dd></div>
    <div><dt>Creado</dt><dd>${fmt(ticket.fecha_creacion)}</dd></div>
    <div><dt>Límite SLA</dt><dd>${fmt(ticket.fecha_limite)}</dd></div>
  </dl>

  ${ticket.descripcion ? `
  <strong style="font-size:11px;text-transform:uppercase;color:#555;">Descripción</strong>
  <p style="white-space:pre-wrap;border:1px solid #e5e7eb;border-radius:6px;padding:10px;background:#f9fafb;margin-top:6px">${escHtml(ticket.descripcion)}</p>
  ` : ''}

  <strong style="font-size:11px;text-transform:uppercase;color:#555;">Historial de actividad</strong>
  <table>
    <thead>
      <tr><th>Fecha</th><th>Tipo</th><th>Actor</th><th>Interno</th><th>Contenido</th></tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:#999">Sin actividad</td></tr>'}</tbody>
  </table>

  ${htmlAdjuntos ? `
  <strong style="font-size:11px;text-transform:uppercase;color:#555;display:block;margin-top:24px;margin-bottom:8px;">Evidencia Adjunta</strong>
  <div>${htmlAdjuntos}</div>
  ` : ''}

  <div class="footer">
    Documento generado automáticamente — Concejo Municipal de Chía · SGC 2026
  </div>

  <script>window.onload = () => window.print();<\/script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="evidencia-${ticket.codigo}.html"`,
    },
  });
};

function escHtml(s: string): string {
  return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
