import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import { getSession } from '../../../../lib/auth';
import ExcelJS from 'exceljs';

export const GET: APIRoute = async ({ cookies }) => {
  const session = await getSession(cookies);
  if (!session) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  // Only Admin or gestores de mejora can export
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('es_gestor_mejora')
    .eq('id', session.id)
    .single();

  const esGestor = session.rol === 'admin' || usuario?.es_gestor_mejora;

  if (!esGestor) {
    return new Response(JSON.stringify({ error: 'No autorizado para exportar' }), { status: 403 });
  }

  // Fetch hallazgos
  const { data: hallazgos, error } = await supabase
    .from('hallazgos')
    .select(`
      *,
      proceso:proceso_id(nombre),
      responsable:responsable_id(nombre, correo),
      creador:creador_id(nombre)
    `)
    .order('fecha_deteccion', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SGC Concejo Municipal de Chía';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Hallazgos');

  sheet.columns = [
    { header: 'Código', key: 'codigo', width: 15 },
    { header: 'Título', key: 'titulo', width: 40 },
    { header: 'Tipo', key: 'tipo', width: 20 },
    { header: 'Origen', key: 'origen', width: 20 },
    { header: 'Proceso', key: 'proceso', width: 25 },
    { header: 'Responsable', key: 'responsable', width: 25 },
    { header: 'Creador', key: 'creador', width: 20 },
    { header: 'Etapa Actual', key: 'etapa', width: 20 },
    { header: 'Estado', key: 'estado', width: 15 },
    { header: 'Intentos Reformulación', key: 'intentos', width: 15 },
    { header: 'Fecha Detección', key: 'fecha_deteccion', width: 15 },
    { header: 'Fecha Límite', key: 'fecha_limite', width: 15 },
    { header: 'Fecha Cierre', key: 'fecha_cierre', width: 15 }
  ];

  // Style Header
  sheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3359A4' }
    };
    cell.font = {
      color: { argb: 'FFFFFFFF' },
      bold: true
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

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

  const fmtDate = (d: string | null) => d ? new Date(d).toISOString().split('T')[0] : '';

  for (const h of (hallazgos || [])) {
    const row = sheet.addRow({
      codigo: h.codigo,
      titulo: h.titulo,
      tipo: formatTipo(h.tipo),
      origen: h.origen || 'N/A',
      proceso: (h.proceso as any)?.nombre || 'N/A',
      responsable: (h.responsable as any)?.nombre || 'Sin asignar',
      creador: (h.creador as any)?.nombre || 'Sistema',
      etapa: h.etapa_actual,
      estado: h.estado,
      intentos: h.intentos_reformulacion || 0,
      fecha_deteccion: fmtDate(h.fecha_deteccion),
      fecha_limite: fmtDate(h.fecha_limite),
      fecha_cierre: fmtDate(h.fecha_cierre)
    });

    // Simple cell borders for data rows
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      };
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
  }

  // Freeze top row
  sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  
  const fechaStr = new Date().toISOString().slice(0, 10);
  const filename = `hallazgos_mejora_continua_${fechaStr}.xlsx`;

  return new Response(buffer as ArrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
};
