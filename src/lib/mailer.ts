import nodemailer from 'nodemailer';
import type { Ticket, Usuario } from './supabase';

function createTransport() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function getFrom(): string {
  const name  = process.env.SMTP_FROM_NAME  ?? 'Mesa de Ayuda — Concejo de Chía';
  const email = process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER;
  return `"${name}" <${email}>`;
}

const BASE_URL = process.env.SITE ?? 'http://30.30.30.120:3000';

function destinatario(usuario: Usuario): string {
  return usuario.correo_notificacion ?? usuario.correo;
}

function ticketUrl(id: string) {
  return `${BASE_URL}/mesa-ayuda/ticket/${id}`;
}

// ─── HTML Template ────────────────────────────────────────────────────────────
function htmlTemplate(content: string, action?: { label: string; url: string }): string {
  const btn = action ? `
    <table cellpadding="0" cellspacing="0" style="margin-top:28px;">
      <tr>
        <td style="background:#FFD402;border-radius:8px;">
          <a href="${action.url}" style="display:inline-block;padding:12px 28px;color:#111827;font-weight:bold;font-size:15px;text-decoration:none;">${action.label}</a>
        </td>
      </tr>
    </table>` : '';

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">
      <tr>
        <td style="background:#3359A4;padding:28px 36px;">
          <p style="margin:0 0 4px;color:#FFD402;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Concejo Municipal de Chía</p>
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:-0.3px;">Mesa de Ayuda</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:36px;">
          <div style="color:#374151;font-size:15px;line-height:1.7;">
            ${content}
          </div>
          ${btn}
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb;padding:18px 36px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">Este es un mensaje automático del sistema SGC-CMC. Por favor no respondas directamente a este correo.</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function badge(texto: string, color: string): string {
  return `<span style="display:inline-block;background:${color};color:#fff;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:bold;">${texto}</span>`;
}

function infoRow(label: string, valor: string): string {
  return `<tr>
    <td style="padding:8px 12px;font-size:13px;color:#6b7280;font-weight:bold;white-space:nowrap;">${label}</td>
    <td style="padding:8px 12px;font-size:14px;color:#111827;">${valor}</td>
  </tr>`;
}

function infoTable(rows: string): string {
  return `<table cellpadding="0" cellspacing="0" style="width:100%;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin:20px 0;overflow:hidden;">${rows}</table>`;
}

// ─── Tickets ──────────────────────────────────────────────────────────────────
export async function notificarTicketCreado(ticket: Ticket, solicitante: Usuario, agentes: Usuario[]) {
  const transport = createTransport();
  const FROM = getFrom();

  const rows = infoTable(
    infoRow('Código', ticket.codigo) +
    infoRow('Título', ticket.titulo) +
    infoRow('Categoría', ticket.categoria) +
    infoRow('Prioridad', ticket.prioridad.charAt(0).toUpperCase() + ticket.prioridad.slice(1)) +
    infoRow('Solicitante', solicitante.nombre)
  );

  const agenteHtml = htmlTemplate(
    `<p>Se ha radicado un nuevo ticket que requiere atención.</p>${rows}`,
    { label: 'Ver Ticket', url: `${BASE_URL}/mesa-ayuda/agente/ticket/${ticket.id}` }
  );

  const solicitanteHtml = htmlTemplate(
    `<p>Hola <strong>${solicitante.nombre}</strong>,</p>
     <p>Tu solicitud ha sido radicada exitosamente en el sistema.</p>${rows}
     <p>Te notificaremos cuando un agente tome acción sobre ella.</p>`,
    { label: 'Ver mi Solicitud', url: ticketUrl(ticket.id) }
  );

  const destinos = agentes.map(a => destinatario(a));
  if (destinos.length) {
    await transport.sendMail({ from: FROM, to: destinos.join(','), subject: `[${ticket.codigo}] Nuevo ticket: ${ticket.titulo}`, html: agenteHtml });
  }
  await transport.sendMail({ from: FROM, to: destinatario(solicitante), subject: `Tu solicitud fue radicada — ${ticket.codigo}`, html: solicitanteHtml });
}

export async function notificarAsignacion(ticket: Ticket, agente: Usuario) {
  const transport = createTransport();
  const html = htmlTemplate(
    `<p>Hola <strong>${agente.nombre}</strong>,</p>
     <p>Se te ha asignado el siguiente ticket:</p>
     ${infoTable(infoRow('Código', ticket.codigo) + infoRow('Título', ticket.titulo) + infoRow('Prioridad', ticket.prioridad))}`,
    { label: 'Abrir Ticket', url: `${BASE_URL}/mesa-ayuda/agente/ticket/${ticket.id}` }
  );
  await transport.sendMail({ from: getFrom(), to: destinatario(agente), subject: `[${ticket.codigo}] Ticket asignado a ti`, html });
}

export async function notificarCambioEstado(ticket: Ticket, solicitante: Usuario, estadoAnterior: string) {
  const transport = createTransport();
  const html = htmlTemplate(
    `<p>Hola <strong>${solicitante.nombre}</strong>,</p>
     <p>El estado de tu ticket ha cambiado.</p>
     ${infoTable(infoRow('Código', ticket.codigo) + infoRow('Antes', estadoAnterior) + infoRow('Ahora', ticket.estado))}`,
    { label: 'Ver Ticket', url: ticketUrl(ticket.id) }
  );
  await transport.sendMail({ from: getFrom(), to: destinatario(solicitante), subject: `[${ticket.codigo}] Estado actualizado: ${ticket.estado}`, html });
}

export async function notificarRespuesta(ticket: Ticket, solicitante: Usuario, respuesta: string) {
  const transport = createTransport();
  const html = htmlTemplate(
    `<p>Hola <strong>${solicitante.nombre}</strong>,</p>
     <p>El agente ha respondido tu ticket <strong>${ticket.codigo}</strong>:</p>
     <blockquote style="margin:16px 0;padding:12px 16px;background:#f3f4f6;border-left:4px solid #3359A4;border-radius:4px;font-style:italic;color:#374151;">${respuesta}</blockquote>`,
    { label: 'Ver Respuesta', url: ticketUrl(ticket.id) }
  );
  await transport.sendMail({ from: getFrom(), to: destinatario(solicitante), subject: `[${ticket.codigo}] Nueva respuesta del agente`, html });
}

export async function notificarSlaEnRiesgo(ticket: Ticket, agente: Usuario, auditores: Usuario[]) {
  const transport = createTransport();
  const html = htmlTemplate(
    `<p>⚠️ El siguiente ticket está próximo a superar su SLA:</p>
     ${infoTable(infoRow('Código', ticket.codigo) + infoRow('Título', ticket.titulo) + infoRow('Prioridad', ticket.prioridad) + infoRow('Vence', new Date(ticket.fecha_limite).toLocaleString('es-CO', { timeZone: 'America/Bogota' })))}`,
    { label: 'Atender Ahora', url: `${BASE_URL}/mesa-ayuda/agente/ticket/${ticket.id}` }
  );
  const destinos = [destinatario(agente), ...auditores.map(a => destinatario(a))];
  await transport.sendMail({ from: getFrom(), to: destinos.join(','), subject: `⚠️ SLA en riesgo — ${ticket.codigo}`, html });
}

export async function notificarPasswordReset(usuario: Pick<Usuario, 'nombre' | 'correo' | 'correo_notificacion'>, passwordTemporal: string) {
  const transport = createTransport();
  const html = htmlTemplate(
    `<p>Hola <strong>${usuario.nombre}</strong>,</p>
     <p>El administrador ha restablecido tu contraseña de acceso.</p>
     ${infoTable(infoRow('Correo', usuario.correo) + infoRow('Contraseña temporal', `<code style="font-family:monospace;font-size:16px;letter-spacing:1px;">${passwordTemporal}</code>`))}
     <p style="font-size:13px;color:#6b7280;">Inicia sesión con esta contraseña temporal.</p>`,
    { label: 'Iniciar Sesión', url: `${BASE_URL}/mesa-ayuda/login` }
  );
  await transport.sendMail({ from: getFrom(), to: usuario.correo_notificacion ?? usuario.correo, subject: 'Tu contraseña ha sido restablecida — Mesa de Ayuda', html });
}

export async function notificarUsuarioCreado(usuario: Pick<Usuario, 'nombre' | 'correo' | 'correo_notificacion'>, passwordInicial: string) {
  const transport = createTransport();
  const html = htmlTemplate(
    `<p>Hola <strong>${usuario.nombre}</strong>,</p>
     <p>Se ha creado tu cuenta de acceso a la <strong>Mesa de Ayuda del Concejo Municipal de Chía</strong>.</p>
     ${infoTable(infoRow('Correo', usuario.correo) + infoRow('Contraseña', `<code style="font-family:monospace;font-size:16px;letter-spacing:1px;">${passwordInicial}</code>`))}
     <p style="font-size:13px;color:#6b7280;">Guarda bien esta contraseña. Si tienes problemas para acceder, contacta al administrador del sistema.</p>`,
    { label: 'Acceder a la Mesa de Ayuda', url: `${BASE_URL}/mesa-ayuda/login` }
  );
  await transport.sendMail({ from: getFrom(), to: usuario.correo_notificacion ?? usuario.correo, subject: 'Tu cuenta en la Mesa de Ayuda ha sido creada — Concejo de Chía', html });
}

// ─── Reservas ─────────────────────────────────────────────────────────────────
function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', { timeZone: 'America/Bogota', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export async function notificarReservaSolicitada(
  reserva: { id: string; motivo: string; fecha_inicio: string; fecha_fin: string },
  solicitante: Usuario,
  recurso: { nombre: string },
  admins: Usuario[]
) {
  const transport = createTransport();
  const html = htmlTemplate(
    `<p>Se ha recibido una nueva solicitud de reserva que requiere aprobación.</p>
     ${infoTable(
       infoRow('Solicitante', solicitante.nombre) +
       infoRow('Recurso', recurso.nombre) +
       infoRow('Motivo', reserva.motivo) +
       infoRow('Inicio', formatFecha(reserva.fecha_inicio)) +
       infoRow('Fin', formatFecha(reserva.fecha_fin)) +
       infoRow('Estado', badge('Pendiente', '#f59e0b'))
     )}`,
    { label: 'Revisar Solicitud', url: `${BASE_URL}/mesa-ayuda/reservas` }
  );
  const destinos = admins.map(a => destinatario(a));
  if (destinos.length) {
    await transport.sendMail({ from: getFrom(), to: destinos.join(','), subject: `Nueva reserva pendiente — ${recurso.nombre}`, html });
  }
}

export async function notificarReservaAprobada(
  reserva: { id: string; motivo: string; fecha_inicio: string; fecha_fin: string; nota_admin?: string },
  solicitante: Usuario,
  recurso: { nombre: string },
  aprobadoPor: string
) {
  const transport = createTransport();
  const nota = reserva.nota_admin ? infoRow('Nota del administrador', reserva.nota_admin) : '';
  const html = htmlTemplate(
    `<p>Hola <strong>${solicitante.nombre}</strong>,</p>
     <p>¡Tu solicitud de reserva ha sido <strong style="color:#16a34a;">aprobada</strong>!</p>
     ${infoTable(
       infoRow('Recurso', recurso.nombre) +
       infoRow('Motivo', reserva.motivo) +
       infoRow('Inicio', formatFecha(reserva.fecha_inicio)) +
       infoRow('Fin', formatFecha(reserva.fecha_fin)) +
       infoRow('Aprobado por', aprobadoPor) +
       nota +
       infoRow('Estado', badge('Aprobada', '#16a34a'))
     )}
     <p style="font-size:13px;color:#6b7280;">Recuerda llegar a tiempo para recoger el recurso solicitado.</p>`,
    { label: 'Ver Reserva', url: `${BASE_URL}/mesa-ayuda/reservas` }
  );
  await transport.sendMail({ from: getFrom(), to: destinatario(solicitante), subject: `✅ Reserva aprobada — ${recurso.nombre}`, html });
}

export async function notificarReservaRechazada(
  reserva: { motivo: string; fecha_inicio: string; nota_admin?: string },
  solicitante: Usuario,
  recurso: { nombre: string }
) {
  const transport = createTransport();
  const nota = reserva.nota_admin ? infoRow('Motivo del rechazo', reserva.nota_admin) : '';
  const html = htmlTemplate(
    `<p>Hola <strong>${solicitante.nombre}</strong>,</p>
     <p>Tu solicitud de reserva ha sido <strong style="color:#dc2626;">rechazada</strong>.</p>
     ${infoTable(
       infoRow('Recurso', recurso.nombre) +
       infoRow('Motivo de tu solicitud', reserva.motivo) +
       infoRow('Fecha solicitada', formatFecha(reserva.fecha_inicio)) +
       nota +
       infoRow('Estado', badge('Rechazada', '#dc2626'))
     )}
     <p style="font-size:13px;color:#6b7280;">Puedes realizar una nueva solicitud para otra fecha o recurso.</p>`,
    { label: 'Nueva Reserva', url: `${BASE_URL}/mesa-ayuda/reservas` }
  );
  await transport.sendMail({ from: getFrom(), to: destinatario(solicitante), subject: `❌ Reserva rechazada — ${recurso.nombre}`, html });
}

export async function notificarReservaCancelada(
  reserva: { motivo: string; fecha_inicio: string; fecha_fin: string },
  solicitante: Usuario,
  recurso: { nombre: string },
  responsables: Usuario[]
) {
  const transport = createTransport();
  const html = htmlTemplate(
    `<p>El solicitante <strong>${solicitante.nombre}</strong> ha <strong style="color:#dc2626;">cancelado</strong> su reserva.</p>
     ${infoTable(
       infoRow('Recurso', recurso.nombre) +
       infoRow('Motivo', reserva.motivo) +
       infoRow('Inicio', formatFecha(reserva.fecha_inicio)) +
       infoRow('Fin', formatFecha(reserva.fecha_fin)) +
       infoRow('Estado', badge('Cancelada', '#6b7280'))
     )}`,
    { label: 'Ver Reservas', url: `${BASE_URL}/mesa-ayuda/reservas` }
  );
  const destinos = responsables.map(a => destinatario(a)).filter(Boolean);
  if (destinos.length) {
    await transport.sendMail({ from: getFrom(), to: destinos.join(','), subject: `🚫 Reserva cancelada — ${recurso.nombre}`, html });
  }
}


export async function enviarRecordatorioReserva(
  reserva: { motivo: string; fecha_inicio: string; fecha_fin: string },
  solicitante: Usuario,
  recurso: { nombre: string },
  admins: Usuario[]
) {
  const transport = createTransport();
  const FROM = getFrom();

  const cuerpo = infoTable(
    infoRow('Recurso', recurso.nombre) +
    infoRow('Motivo', reserva.motivo) +
    infoRow('Inicio', formatFecha(reserva.fecha_inicio)) +
    infoRow('Fin', formatFecha(reserva.fecha_fin))
  );

  const htmlSolicitante = htmlTemplate(
    `<p>Hola <strong>${solicitante.nombre}</strong>,</p>
     <p>🔔 Te recordamos que tienes una reserva en <strong>aproximadamente 1 hora</strong>.</p>${cuerpo}`,
    { label: 'Ver Reserva', url: `${BASE_URL}/mesa-ayuda/reservas` }
  );

  const htmlAdmin = htmlTemplate(
    `<p>🔔 Recordatorio: la siguiente reserva comienza en aproximadamente 1 hora.</p>
     ${infoTable(infoRow('Solicitante', solicitante.nombre) + infoRow('Recurso', recurso.nombre) + infoRow('Inicio', formatFecha(reserva.fecha_inicio)))}`,
    { label: 'Ver Reservas', url: `${BASE_URL}/mesa-ayuda/reservas` }
  );

  await transport.sendMail({ from: FROM, to: destinatario(solicitante), subject: `🔔 Recordatorio — Reserva de ${recurso.nombre} en 1 hora`, html: htmlSolicitante });

  const destinos = admins.map(a => destinatario(a)).filter(Boolean);
  if (destinos.length) {
    await transport.sendMail({ from: FROM, to: destinos.join(','), subject: `🔔 Recordatorio de reserva — ${recurso.nombre}`, html: htmlAdmin });
  }
}

export async function enviarCorreoSoporte({
  destinatario,
  subject,
  solicitanteNombre,
  solicitanteCorreo,
  htmlContent,
}: {
  destinatario: string;
  subject: string;
  solicitanteNombre: string;
  solicitanteCorreo: string;
  htmlContent: string;
}) {
  const transport = createTransport();
  const FROM = getFrom();

  const html = htmlTemplate(
    `<p>Se ha recibido una nueva solicitud desde la Plataforma SGC.</p>
     ${htmlContent}
     <p style="font-size:13px;color:#6b7280;margin-top:24px;border-top:1px solid #eee;padding-top:12px;">
       Remitente: <strong>${solicitanteNombre}</strong> (${solicitanteCorreo})
     </p>`,
  );

  await transport.sendMail({
    from: FROM,
    to: destinatario,
    replyTo: solicitanteCorreo,
    subject: subject,
    html: html,
  });
}
