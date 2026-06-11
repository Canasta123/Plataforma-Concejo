import ExcelJS from 'exceljs';

// ─── Paleta institucional ───────────────────────────────────────────────────
const BRAND_BLUE  = '3359A4';
const BRAND_RED   = 'E30D21';
const BRAND_GOLD  = 'FFD402';
const GRAY_LIGHT  = 'F3F4F6';
const GRAY_ALT    = 'E5E7EB';
const WHITE       = 'FFFFFF';

// ─── Helpers de estilo ─────────────────────────────────────────────────────
function headerStyle(wb: ExcelJS.Workbook): Partial<ExcelJS.Style> {
  return {
    font: { bold: true, color: { argb: 'FF' + WHITE }, size: 11 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + BRAND_BLUE } },
    border: {
      bottom: { style: 'thin', color: { argb: 'FF' + GRAY_ALT } },
    },
    alignment: { vertical: 'middle', wrapText: true },
  };
}

function altRowFill(rowIndex: number): ExcelJS.Fill {
  return {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF' + (rowIndex % 2 === 0 ? GRAY_LIGHT : WHITE) },
  };
}

function borderCell(): Partial<ExcelJS.Borders> {
  return {
    bottom: { style: 'hair', color: { argb: 'FF' + GRAY_ALT } },
    right:  { style: 'hair', color: { argb: 'FF' + GRAY_ALT } },
  };
}

// ─── Tipos de entrada ──────────────────────────────────────────────────────
interface TicketExport {
  id: string;
  codigo: string;
  titulo: string;
  categoria: string;
  prioridad: string;
  estado: string;
  descripcion: string;
  fecha_creacion: string;
  fecha_limite: string;
  fecha_cierre: string | null;
  creador?: { nombre: string; correo: string; cargo: string } | null;
  agente?:   { nombre: string; correo: string } | null;
  trazabilidad_count?: number;
  adjuntos_count?: number;
}

interface TrazabilidadExport {
  ticket_id: string;
  tipo: string;
  contenido: string;
  es_interno: boolean;
  created_at: string;
  autor?: { nombre: string } | null;
}

interface OpcionesExcel {
  incluirTrazabilidad: boolean;
  incluirInternos: boolean;
  filtrosAplicados: Record<string, unknown>;
  generadoPor: string;
}

// ─── Funciones auxiliares ──────────────────────────────────────────────────
function formatFecha(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'short', timeStyle: 'short' });
}

function tiempoResolucion(inicio: string, fin: string | null): string {
  if (!fin) return '—';
  const ms = new Date(fin).getTime() - new Date(inicio).getTime();
  const horas = Math.floor(ms / 3600000);
  const minutos = Math.floor((ms % 3600000) / 60000);
  return horas > 0 ? `${horas}h ${minutos}m` : `${minutos}m`;
}

function slaStatus(fechaLimite: string, fechaCierre: string | null): string {
  const limite = new Date(fechaLimite).getTime();
  const cierre = fechaCierre ? new Date(fechaCierre).getTime() : Date.now();
  return cierre <= limite ? 'Sí' : 'No';
}

function labelEstado(estado: string): string {
  return { abierto: 'Abierto', en_progreso: 'En progreso', resuelto: 'Resuelto', cerrado: 'Cerrado' }[estado] ?? estado;
}

function labelPrioridad(p: string): string {
  return { alta: 'Alta', media: 'Media', baja: 'Baja' }[p] ?? p;
}

function labelCategoria(c: string): string {
  return { hardware: 'Hardware', software: 'Software', redes: 'Redes', otro: 'Otro' }[c] ?? c;
}

// ─── Hoja 1: Tickets ──────────────────────────────────────────────────────
function agregarHojaTickets(wb: ExcelJS.Workbook, tickets: TicketExport[]) {
  const ws = wb.addWorksheet('Tickets');

  const headers = [
    'Código', 'Título', 'Categoría', 'Prioridad', 'Estado',
    'Solicitante', 'Correo solicitante', 'Cargo',
    'Agente asignado', 'Correo agente',
    'Fecha creación', 'Fecha límite SLA', 'Fecha cierre',
    'Tiempo resolución', 'SLA cumplido',
    '# Comentarios', '# Adjuntos',
  ];

  ws.columns = [
    { key: 'codigo',         width: 16 },
    { key: 'titulo',         width: 40 },
    { key: 'categoria',      width: 14 },
    { key: 'prioridad',      width: 12 },
    { key: 'estado',         width: 14 },
    { key: 'solicitante',    width: 22 },
    { key: 'correo_sol',     width: 28 },
    { key: 'cargo',          width: 22 },
    { key: 'agente',         width: 22 },
    { key: 'correo_agente',  width: 28 },
    { key: 'fecha_creacion', width: 18 },
    { key: 'fecha_limite',   width: 18 },
    { key: 'fecha_cierre',   width: 18 },
    { key: 'tiempo_res',     width: 16 },
    { key: 'sla',            width: 14 },
    { key: 'comentarios',    width: 14 },
    { key: 'adjuntos',       width: 12 },
  ];

  // Fila 1: encabezado
  const headerRow = ws.addRow(headers);
  headerRow.height = 28;
  headerRow.eachCell(cell => Object.assign(cell, headerStyle(wb)));

  // Freeze
  ws.views = [{ state: 'frozen', ySplit: 1 }];

  // Filas de datos
  tickets.forEach((t, i) => {
    const slaCumplido = slaStatus(t.fecha_limite, t.fecha_cierre);
    const row = ws.addRow([
      t.codigo,
      t.titulo,
      labelCategoria(t.categoria),
      labelPrioridad(t.prioridad),
      labelEstado(t.estado),
      t.creador?.nombre ?? '—',
      t.creador?.correo ?? '—',
      t.creador?.cargo  ?? '—',
      t.agente?.nombre  ?? '—',
      t.agente?.correo  ?? '—',
      formatFecha(t.fecha_creacion),
      formatFecha(t.fecha_limite),
      formatFecha(t.fecha_cierre),
      tiempoResolucion(t.fecha_creacion, t.fecha_cierre),
      slaCumplido,
      t.trazabilidad_count ?? 0,
      t.adjuntos_count ?? 0,
    ]);

    const isCerrado   = t.estado === 'cerrado';
    const isSlaVencido = slaCumplido === 'No';
    const isAltaPrioridad = t.prioridad === 'alta';

    const bgFill: ExcelJS.Fill = isCerrado
      ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }
      : isSlaVencido
        ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }
        : altRowFill(i);

    row.eachCell((cell, colIdx) => {
      cell.fill = bgFill;
      cell.border = borderCell();
      cell.alignment = { vertical: 'middle', wrapText: colIdx === 2 };
      if (isAltaPrioridad && colIdx === 4) {
        cell.font = { bold: true, color: { argb: 'FF' + BRAND_RED } };
      }
    });
  });
}

// ─── Hoja 2: Trazabilidad ─────────────────────────────────────────────────
function agregarHojaTrazabilidad(wb: ExcelJS.Workbook, trazabilidad: TrazabilidadExport[]) {
  const ws = wb.addWorksheet('Trazabilidad');

  ws.columns = [
    { key: 'ticket',    width: 16 },
    { key: 'tipo',      width: 18 },
    { key: 'autor',     width: 22 },
    { key: 'contenido', width: 60 },
    { key: 'interno',   width: 14 },
    { key: 'fecha',     width: 20 },
  ];

  const headers = ['Código ticket', 'Tipo de evento', 'Autor', 'Contenido', '¿Nota interna?', 'Fecha y hora'];
  const headerRow = ws.addRow(headers);
  headerRow.height = 28;
  headerRow.eachCell(cell => Object.assign(cell, headerStyle(wb)));
  ws.views = [{ state: 'frozen', ySplit: 1 }];

  const tipoLabel: Record<string, string> = {
    comentario:    'Comentario',
    respuesta:     'Respuesta pública',
    cambio_estado: 'Cambio de estado',
    asignacion:    'Asignación',
  };

  trazabilidad.forEach((tr, i) => {
    const row = ws.addRow([
      tr.ticket_id,
      tipoLabel[tr.tipo] ?? tr.tipo,
      tr.autor?.nombre ?? '—',
      tr.contenido,
      tr.es_interno ? 'Sí (interna)' : 'No',
      formatFecha(tr.created_at),
    ]);
    row.eachCell((cell, colIdx) => {
      cell.fill = altRowFill(i);
      cell.border = borderCell();
      cell.alignment = { vertical: 'top', wrapText: colIdx === 4 };
      if (tr.es_interno) cell.font = { italic: true, color: { argb: 'FF6B7280' } };
    });
  });
}

// ─── Hoja 3: Resumen ──────────────────────────────────────────────────────
function agregarHojaResumen(
  wb: ExcelJS.Workbook,
  tickets: TicketExport[],
  opciones: OpcionesExcel,
) {
  const ws = wb.addWorksheet('Resumen');
  ws.columns = [{ key: 'label', width: 32 }, { key: 'valor', width: 20 }];

  function seccion(titulo: string) {
    const row = ws.addRow([titulo]);
    row.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF' + BRAND_BLUE } };
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } };
    ws.addRow([]);
  }

  function dato(label: string, valor: string | number) {
    const row = ws.addRow([label, valor]);
    row.getCell(1).font = { bold: true };
  }

  // Filtros aplicados
  seccion('Filtros aplicados');
  const f = opciones.filtrosAplicados;
  dato('Generado por', opciones.generadoPor);
  dato('Fecha de generación', formatFecha(new Date().toISOString()));
  dato('Desde', String(f.desde ?? 'Sin límite'));
  dato('Hasta', String(f.hasta ?? 'Sin límite'));
  dato('Estados', (f.estados as string[])?.join(', ') || 'Todos');
  dato('Categorías', (f.categorias as string[])?.join(', ') || 'Todas');
  dato('Prioridades', (f.prioridades as string[])?.join(', ') || 'Todas');
  dato('Alcance', String(f.scope ?? 'todos'));
  ws.addRow([]);

  // Totales
  seccion('Totales generales');
  dato('Total de tickets', tickets.length);

  const porEstado: Record<string, number> = {};
  const porCategoria: Record<string, number> = {};
  const porPrioridad: Record<string, number> = {};
  let slaOk = 0;
  let resueltos = 0;
  let tiempoTotal = 0;

  tickets.forEach(t => {
    porEstado[t.estado] = (porEstado[t.estado] ?? 0) + 1;
    porCategoria[t.categoria] = (porCategoria[t.categoria] ?? 0) + 1;
    porPrioridad[t.prioridad] = (porPrioridad[t.prioridad] ?? 0) + 1;
    if (slaStatus(t.fecha_limite, t.fecha_cierre) === 'Sí') slaOk++;
    if (t.fecha_cierre) {
      resueltos++;
      tiempoTotal += new Date(t.fecha_cierre).getTime() - new Date(t.fecha_creacion).getTime();
    }
  });

  ws.addRow([]);
  seccion('Por estado');
  Object.entries(porEstado).forEach(([k, v]) => dato(labelEstado(k), v));

  ws.addRow([]);
  seccion('Por categoría');
  Object.entries(porCategoria).forEach(([k, v]) => dato(labelCategoria(k), v));

  ws.addRow([]);
  seccion('Por prioridad');
  Object.entries(porPrioridad).forEach(([k, v]) => dato(labelPrioridad(k), v));

  ws.addRow([]);
  seccion('Indicadores SLA');
  const tasaSla = tickets.length > 0 ? ((slaOk / tickets.length) * 100).toFixed(1) + '%' : '—';
  dato('Tickets con SLA cumplido', slaOk);
  dato('Tasa de cumplimiento SLA', tasaSla);
  const tiempoPromedio = resueltos > 0
    ? `${Math.floor(tiempoTotal / resueltos / 3600000)}h ${Math.floor((tiempoTotal / resueltos % 3600000) / 60000)}m`
    : '—';
  dato('Tiempo promedio de resolución', tiempoPromedio);
}

// ─── Exportación principal ────────────────────────────────────────────────
export async function generarLibroTickets(
  tickets: TicketExport[],
  trazabilidad: TrazabilidadExport[],
  opciones: OpcionesExcel,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator  = 'Mesa de Ayuda — Concejo de Chía';
  wb.created  = new Date();
  wb.modified = new Date();

  agregarHojaResumen(wb, tickets, opciones);
  agregarHojaTickets(wb, tickets);
  if (opciones.incluirTrazabilidad && trazabilidad.length > 0) {
    agregarHojaTrazabilidad(wb, trazabilidad);
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function generarLibroInducciones(
  usuarios: any[],
  generadoPor: string
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator  = 'Mesa de Ayuda — Concejo de Chía';
  wb.created  = new Date();
  wb.modified = new Date();

  // Hoja 1: Resumen de Despliegue
  const wsRes = wb.addWorksheet('Resumen de Despliegue');
  wsRes.columns = [{ key: 'label', width: 32 }, { key: 'valor', width: 24 }];
  
  const seccion = (titulo: string) => {
    const r = wsRes.addRow([titulo]);
    r.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF' + BRAND_BLUE } };
    r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } };
    wsRes.addRow([]);
  };

  const dato = (label: string, valor: string | number) => {
    const r = wsRes.addRow([label, valor]);
    r.getCell(1).font = { bold: true };
    r.getCell(2).alignment = { horizontal: 'left' };
  };

  seccion('Información del reporte');
  dato('Generado por', generadoPor);
  dato('Fecha de generación', formatFecha(new Date().toISOString()));
  wsRes.addRow([]);

  const total = usuarios.length;
  const completados = usuarios.filter(u => u.induccion_completada).length;
  const pendientes = total - completados;
  const porcentaje = total > 0 ? ((completados / total) * 100).toFixed(1) + '%' : '0%';

  const usuariosConSgc = usuarios.filter(u => u.induccion_completada && typeof u.induccion_valoracion_sgc === 'number');
  const promedioSgc = usuariosConSgc.length > 0 
    ? (usuariosConSgc.reduce((acc, u) => acc + u.induccion_valoracion_sgc, 0) / usuariosConSgc.length).toFixed(2) + ' / 5.0'
    : '—';

  const usuariosConMesa = usuarios.filter(u => u.induccion_completada && typeof u.induccion_valoracion_mesa === 'number');
  const promedioMesa = usuariosConMesa.length > 0 
    ? (usuariosConMesa.reduce((acc, u) => acc + u.induccion_valoracion_mesa, 0) / usuariosConMesa.length).toFixed(2) + ' / 5.0'
    : '—';

  seccion('Métricas de Despliegue');
  dato('Total usuarios', total);
  dato('Inducciones completadas', completados);
  dato('Inducciones pendientes', pendientes);
  dato('Porcentaje de avance', porcentaje);
  wsRes.addRow([]);
  seccion('Satisfacción de Plataformas');
  dato('Valoración prom. SGC', promedioSgc);
  dato('Valoración prom. Mesa de Ayuda', promedioMesa);

  // Hoja 2: Detalle de Inducciones
  const ws = wb.addWorksheet('Detalle de Usuarios');
  ws.columns = [
    { key: 'nombre',      width: 26 },
    { key: 'correo',      width: 28 },
    { key: 'cargo',       width: 24 },
    { key: 'rol',         width: 16 },
    { key: 'completado',  width: 14 },
    { key: 'fecha',       width: 20 },
    { key: 'sgc',         width: 14 },
    { key: 'mesa',        width: 14 },
    { key: 'capacitado',  width: 14 },
    { key: 'val_sgc',     width: 18 },
    { key: 'val_mesa',    width: 22 },
    { key: 'comentarios', width: 45 },
  ];

  const headers = [
    'Nombre completo', 'Correo', 'Cargo', 'Rol', '¿Completado?', 'Fecha y hora',
    'Marcador SGC', 'Marcador Mesa', 'Capacitación', 'Valoración SGC', 'Valoración Mesa', 'Comentarios y observaciones'
  ];

  const headerRow = ws.addRow(headers);
  headerRow.height = 28;
  headerRow.eachCell(cell => Object.assign(cell, headerStyle(wb)));
  ws.views = [{ state: 'frozen', ySplit: 1 }];

  usuarios.forEach((u, i) => {
    const completado = u.induccion_completada ? 'Sí' : 'No';
    const sgc = u.induccion_completada ? (u.induccion_sgc ? 'Sí' : 'No') : '—';
    const mesa = u.induccion_completada ? (u.induccion_mesa ? 'Sí' : 'No') : '—';
    const capacitacion = u.induccion_completada ? (u.induccion_capacitacion ? 'Sí' : 'No') : '—';
    const fecha = u.induccion_completada ? formatFecha(u.induccion_fecha) : '—';
    const valSgc = u.induccion_completada ? (u.induccion_valoracion_sgc ?? '—') : '—';
    const valMesa = u.induccion_completada ? (u.induccion_valoracion_mesa ?? '—') : '—';
    const comentarios = u.induccion_completada ? (u.induccion_comentarios ?? 'Sin comentarios') : '—';

    const row = ws.addRow([
      u.nombre,
      u.correo,
      u.cargo,
      u.rol.toUpperCase(),
      completado,
      fecha,
      sgc,
      mesa,
      capacitacion,
      valSgc,
      valMesa,
      comentarios
    ]);

    const isCompletado = u.induccion_completada;
    const bgFill: ExcelJS.Fill = isCompletado
      ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } } // bg-green-100
      : { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // bg-red-100

    row.eachCell((cell, colIdx) => {
      if (colIdx === 5) {
        cell.fill = bgFill;
        cell.font = { bold: true, color: { argb: isCompletado ? 'FF065F46' : 'FF991B1B' } };
      } else {
        cell.fill = altRowFill(i);
      }
      cell.border = borderCell();
      cell.alignment = { vertical: 'middle', wrapText: colIdx === 12 };
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
