import type { APIRoute } from 'astro';
import { enviarCorreoSoporte } from '../../lib/mailer';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { tipoFormulario } = body;

    if (tipoFormulario === 'documento') {
      const { nombre, correo, proceso, documento, tipoDocumento, comentarios } = body;

      if (!nombre || !correo || !proceso || !documento || !tipoDocumento) {
        return new Response(JSON.stringify({ error: 'Faltan campos obligatorios' }), { status: 400 });
      }

      const htmlContent = `
        <table cellpadding="0" cellspacing="0" style="width:100%;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin:20px 0;overflow:hidden;">
          <tr>
            <td style="padding:8px 12px;font-size:13px;color:#6b7280;font-weight:bold;white-space:nowrap;width:150px;">Tipo de Solicitud</td>
            <td style="padding:8px 12px;font-size:14px;color:#111827;">Actualización de Documentación SGC</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-size:13px;color:#6b7280;font-weight:bold;white-space:nowrap;">Proceso</td>
            <td style="padding:8px 12px;font-size:14px;color:#111827;">${proceso}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-size:13px;color:#6b7280;font-weight:bold;white-space:nowrap;">Documento</td>
            <td style="padding:8px 12px;font-size:14px;color:#111827;">${documento}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-size:13px;color:#6b7280;font-weight:bold;white-space:nowrap;">Tipo Documento</td>
            <td style="padding:8px 12px;font-size:14px;color:#111827;text-transform:capitalize;">${tipoDocumento}</td>
          </tr>
          ${comentarios ? `
          <tr>
            <td style="padding:8px 12px;font-size:13px;color:#6b7280;font-weight:bold;white-space:nowrap;vertical-align:top;padding-top:12px;">Cambios Sugeridos</td>
            <td style="padding:8px 12px;font-size:14px;color:#111827;white-space:pre-wrap;padding-top:12px;">${comentarios}</td>
          </tr>
          ` : ''}
        </table>
      `;

      await enviarCorreoSoporte({
        destinatario: 'gescalidad@concejomunicipalchia.gov.co',
        subject: `[SGC] Solicitud de Actualización: ${documento}`,
        solicitanteNombre: nombre,
        solicitanteCorreo: correo,
        htmlContent,
      });

    } else if (tipoFormulario === 'soporte') {
      const { nombre, correo, dependencia, tipoSoporte, asunto, descripcion } = body;

      if (!nombre || !correo || !dependencia || !tipoSoporte || !asunto || !descripcion) {
        return new Response(JSON.stringify({ error: 'Faltan campos obligatorios' }), { status: 400 });
      }

      const tipoSoporteLabels: Record<string, string> = {
        error: 'Reporte de error/fallo',
        mejora: 'Sugerencia de mejora',
        consulta: 'Consulta técnica',
        otro: 'Otro asunto',
      };

      const htmlContent = `
        <table cellpadding="0" cellspacing="0" style="width:100%;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin:20px 0;overflow:hidden;">
          <tr>
            <td style="padding:8px 12px;font-size:13px;color:#6b7280;font-weight:bold;white-space:nowrap;width:150px;">Tipo de Solicitud</td>
            <td style="padding:8px 12px;font-size:14px;color:#111827;">Soporte y Cambios en la Plataforma</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-size:13px;color:#6b7280;font-weight:bold;white-space:nowrap;">Área / Dependencia</td>
            <td style="padding:8px 12px;font-size:14px;color:#111827;">${dependencia}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-size:13px;color:#6b7280;font-weight:bold;white-space:nowrap;">Tipo de Soporte</td>
            <td style="padding:8px 12px;font-size:14px;color:#111827;">${tipoSoporteLabels[tipoSoporte] ?? tipoSoporte}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-size:13px;color:#6b7280;font-weight:bold;white-space:nowrap;">Asunto</td>
            <td style="padding:8px 12px;font-size:14px;color:#111827;">${asunto}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-size:13px;color:#6b7280;font-weight:bold;white-space:nowrap;vertical-align:top;padding-top:12px;">Descripción</td>
            <td style="padding:8px 12px;font-size:14px;color:#111827;white-space:pre-wrap;padding-top:12px;">${descripcion}</td>
          </tr>
        </table>
      `;

      await enviarCorreoSoporte({
        destinatario: 'jaiderd2005@gmail.com',
        subject: `[Soporte SGC] ${asunto}`,
        solicitanteNombre: nombre,
        solicitanteCorreo: correo,
        htmlContent,
      });

    } else {
      return new Response(JSON.stringify({ error: 'Tipo de formulario inválido' }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
