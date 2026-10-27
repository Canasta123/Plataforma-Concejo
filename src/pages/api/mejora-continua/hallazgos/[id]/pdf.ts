import type { APIRoute } from 'astro';
import { getSession } from '../../../../../lib/auth';
import { supabase } from '../../../../../lib/supabase';

export const GET: APIRoute = async ({ cookies, params }) => {
  const session = await getSession(cookies);
  if (!session) return new Response('No autenticado', { status: 401 });

  const { id } = params;

  const { data: hallazgo, error: hallazgoError } = await supabase
    .from('hallazgos')
    .select(`
      *,
      proceso:proceso_id(nombre),
      responsable:responsable_id(nombre, cargo),
      creador:creador_id(nombre, cargo)
    `)
    .eq('id', id)
    .single();

  if (hallazgoError || !hallazgo) return new Response('Hallazgo no encontrado', { status: 404 });

  const [
    { data: tratamientos },
    { data: causas },
    { data: tareas },
    { data: evaluaciones },
    { data: trazabilidad }
  ] = await Promise.all([
    supabase.from('tratamientos_inmediatos').select('*, responsable:responsable_id(nombre)').eq('hallazgo_id', id).order('created_at'),
    supabase.from('analisis_causas').select('*, analista:analista_id(nombre)').eq('hallazgo_id', id).order('created_at'),
    supabase.from('plan_accion_tareas').select('*, responsable:responsable_id(nombre)').eq('hallazgo_id', id).order('fecha_limite'),
    supabase.from('evaluaciones_eficacia').select('*, evaluador:evaluador_id(nombre)').eq('hallazgo_id', id).order('fecha_evaluacion'),
    supabase.from('hallazgo_trazabilidad').select('*, autor:autor_id(nombre)').eq('hallazgo_id', id).order('created_at')
  ]);

  const fmt = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'medium' }) : '—';

  const formatTipo = (t: string) => {
    const tipos: Record<string, string> = {
      no_conformidad_mayor: 'No conformidad Mayor',
      no_conformidad_menor: 'No conformidad Menor',
      oportunidad_mejora: 'Oportunidad de Mejora',
      producto_no_conforme: 'Producto no Conforme',
      correctiva: 'No conformidad Mayor',
      mejora: 'Oportunidad de Mejora',
      riesgo: 'Acción sobre Riesgo'
    };
    return tipos[t] || t;
  };

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Informe ${hallazgo.codigo}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; color: #111; margin: 32px; line-height: 1.4; }
  .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #3359A4; padding-bottom: 12px; margin-bottom: 20px; }
  .header h1 { font-size: 16px; color: #3359A4; margin: 0; text-transform: uppercase; }
  .header p { color: #555; font-size: 10px; margin: 4px 0 0; }
  .brand-bar { height: 6px; background: linear-gradient(to right, #3359A4 50%, #FFD402 50%); margin-bottom: 24px; }
  
  .section-title { font-size: 12px; background: #3359A4; color: #fff; padding: 6px 10px; margin: 24px 0 12px; border-radius: 4px; font-weight: bold; text-transform: uppercase; }
  
  .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 16px; }
  .info-item { background: #f9fafb; border: 1px solid #e5e7eb; padding: 8px; border-radius: 4px; }
  .info-item dt { font-weight: bold; color: #3359A4; font-size: 9px; text-transform: uppercase; margin-bottom: 2px; }
  .info-item dd { margin: 0; font-size: 11px; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #f3f4f6; color: #3359A4; padding: 8px; text-align: left; font-size: 10px; border: 1px solid #e5e7eb; }
  td { padding: 8px; border: 1px solid #e5e7eb; vertical-align: top; font-size: 11px; }
  
  .desc-box { border: 1px solid #e5e7eb; padding: 12px; background: #fff; border-radius: 4px; white-space: pre-wrap; margin-bottom: 16px; }

  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px; page-break-inside: avoid; }
  .sig-line { border-top: 1px solid #3359A4; padding-top: 8px; text-align: center; }
  .sig-name { font-weight: bold; font-size: 12px; }
  .sig-role { color: #555; font-size: 10px; }

  @media print { 
    body { margin: 0; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
  <div class="brand-bar"></div>
  <div class="header">
    <div>
      <h1>INFORME DE HALLAZGO Y ACCIÓN CORRECTIVA / DE MEJORA</h1>
      <p>Concejo Municipal de Chía · Sistema de Gestión de Calidad</p>
    </div>
    <div style="text-align: right;">
      <p style="font-size: 12px; font-weight: bold; color: #3359A4;">${hallazgo.codigo}</p>
      <p>Fecha de emisión: ${fmt(new Date().toISOString())}</p>
    </div>
  </div>

  <div class="section-title">1. Información General del Hallazgo</div>
  <div class="grid-info">
    <div class="info-item"><dt>Código</dt><dd>${hallazgo.codigo}</dd></div>
    <div class="info-item"><dt>Tipo de Hallazgo</dt><dd>${formatTipo(hallazgo.tipo)}</dd></div>
    <div class="info-item"><dt>Estado Actual</dt><dd style="text-transform: capitalize;">${hallazgo.estado.replace(/_/g, ' ')}</dd></div>
    <div class="info-item"><dt>Proceso Afectado</dt><dd>${escHtml((hallazgo.proceso as any)?.nombre ?? '—')}</dd></div>
    <div class="info-item"><dt>Responsable Asignado</dt><dd>${escHtml((hallazgo.responsable as any)?.nombre ?? '—')} - ${(hallazgo.responsable as any)?.cargo ?? ''}</dd></div>
    <div class="info-item"><dt>Reportado Por</dt><dd>${escHtml((hallazgo.creador as any)?.nombre ?? '—')}</dd></div>
    <div class="info-item"><dt>Fecha de Detección</dt><dd>${fmt(hallazgo.fecha_deteccion)}</dd></div>
    <div class="info-item"><dt>Fecha Límite Cierre</dt><dd>${fmt(hallazgo.fecha_limite)}</dd></div>
    <div class="info-item"><dt>Requisito Incumplido</dt><dd>${escHtml(hallazgo.requisito_incumplido || 'N/A')}</dd></div>
    <div class="info-item"><dt>Origen</dt><dd>${escHtml(hallazgo.origen || 'N/A')}</dd></div>
  </div>

  <div class="section-title">2. Identificación y Descripción del Hallazgo</div>
  <div class="desc-box">
    <strong>Título:</strong> ${escHtml(hallazgo.titulo)}<br><br>
    <strong>Descripción detallada:</strong><br>${escHtml(hallazgo.descripcion)}
  </div>

  <div class="section-title">3. Tratamientos Inmediatos (Contención)</div>
  ${tratamientos && tratamientos.length > 0 ? `
    <table>
      <thead><tr><th>Fecha</th><th>Acción Realizada</th><th>Responsable</th></tr></thead>
      <tbody>
        ${tratamientos.map((t: any) => `
          <tr>
            <td>${fmt(t.created_at)}</td>
            <td>${escHtml(t.descripcion)}</td>
            <td>${escHtml(t.responsable?.nombre || '—')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '<p style="color:#666; font-style:italic;">No se han registrado tratamientos inmediatos.</p>'}

  <div class="section-title">4. Análisis de Causa Raíz</div>
  ${causas && causas.length > 0 ? `
    ${causas.map((c: any) => `
      <div class="desc-box" style="margin-bottom: 8px;">
        <div style="font-size:10px; color:#555; margin-bottom:4px;">Metodología: ${c.metodologia} | Analista: ${escHtml(c.analista?.nombre || '—')} | Fecha: ${fmt(c.created_at)}</div>
        ${escHtml(c.analisis_detallado)}
      </div>
    `).join('')}
  ` : '<p style="color:#666; font-style:italic;">No se ha registrado análisis de causas.</p>'}

  <div class="section-title">5. Plan de Acción</div>
  ${tareas && tareas.length > 0 ? `
    <table>
      <thead><tr><th>Actividad</th><th>Responsable</th><th>Fecha Límite</th><th>Estado</th></tr></thead>
      <tbody>
        ${tareas.map((t: any) => `
          <tr>
            <td>${escHtml(t.descripcion)}</td>
            <td>${escHtml(t.responsable?.nombre || '—')}</td>
            <td>${fmt(t.fecha_limite)}</td>
            <td><span style="text-transform: capitalize;">${t.estado}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '<p style="color:#666; font-style:italic;">No se ha definido un plan de acción.</p>'}

  <div class="section-title">6. Evaluación de Eficacia</div>
  ${evaluaciones && evaluaciones.length > 0 ? `
    ${evaluaciones.map((e: any) => `
      <div class="desc-box" style="margin-bottom: 8px;">
        <div style="font-size:10px; color:#555; margin-bottom:4px;">Evaluador: ${escHtml(e.evaluador?.nombre || '—')} | Fecha: ${fmt(e.fecha_evaluacion)} | Eficaz: ${e.es_eficaz ? 'Sí' : 'No'}</div>
        <strong>Comentarios:</strong><br>${escHtml(e.comentarios)}
      </div>
    `).join('')}
  ` : '<p style="color:#666; font-style:italic;">No se ha realizado evaluación de eficacia.</p>'}

  <div class="signatures">
    <div>
      <div class="sig-line">
        <div class="sig-name">${escHtml((hallazgo.responsable as any)?.nombre ?? 'Responsable')}</div>
        <div class="sig-role">Líder del Proceso / Responsable Asignado</div>
      </div>
    </div>
    <div>
      <div class="sig-line">
        <div class="sig-name">Gestión de Calidad</div>
        <div class="sig-role">Gestor de Mejora Continua</div>
      </div>
    </div>
  </div>

  <div style="margin-top: 40px; text-align: center; color: #999; font-size: 9px; border-top: 1px solid #eee; padding-top: 10px;">
    Sistema de Gestión de Calidad - Concejo Municipal de Chía<br>
    Documento generado electrónicamente el ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}
  </div>

  <script>
    window.onload = () => {
      setTimeout(() => window.print(), 500);
    };
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="hallazgo-${hallazgo.codigo}.html"`,
    },
  });
};

function escHtml(s: string): string {
  return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
