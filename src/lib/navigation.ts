export interface NavPage {
  ruta: string;
  titulo: string;
  seccion: string;
}

export const NAVIGATION: NavPage[] = [
  { ruta: '/', titulo: 'Portada', seccion: 'Inicio' },
  { ruta: '/procesos', titulo: 'Índice de Procesos', seccion: 'Inicio' },
  { ruta: '/estrategicos/direccionamiento', titulo: 'Caracterización', seccion: 'Direccionamiento Estratégico' },
  { ruta: '/estrategicos/direccionamiento-procedimientos', titulo: 'Procedimientos', seccion: 'Direccionamiento Estratégico' },
  { ruta: '/estrategicos/direccionamiento-comunicaciones', titulo: 'Comunicaciones', seccion: 'Direccionamiento Estratégico' },
  { ruta: '/estrategicos/direccionamiento-formatos', titulo: 'Formatos', seccion: 'Direccionamiento Estratégico' },
  { ruta: '/estrategicos/direccionamiento-manuales', titulo: 'Manuales y Guías', seccion: 'Direccionamiento Estratégico' },
  { ruta: '/estrategicos/calidad', titulo: 'Gestión de Calidad', seccion: 'Estratégicos' },
  { ruta: '/estrategicos/calidad-procedimientos', titulo: 'Procedimientos', seccion: 'Estratégicos' },
  { ruta: '/estrategicos/calidad-formatos', titulo: 'Formatos', seccion: 'Estratégicos' },
  { ruta: '/estrategicos/ciudadania', titulo: 'Relacionamiento con la Ciudadanía', seccion: 'Estratégicos' },
  { ruta: '/misionales/control-politico', titulo: 'Control Político', seccion: 'Misionales' },
  { ruta: '/misionales/control-politico-procedimientos', titulo: 'Procedimientos', seccion: 'Misionales' },
  { ruta: '/misionales/control-politico-formatos', titulo: 'Formatos', seccion: 'Misionales' },
  { ruta: '/misionales/proyectos-acuerdo', titulo: 'Proyectos de Acuerdo', seccion: 'Misionales' },
  { ruta: '/misionales/proyectos-acuerdo-procedimientos', titulo: 'Procedimientos', seccion: 'Misionales' },
  { ruta: '/misionales/proyectos-acuerdo-formatos', titulo: 'Formatos', seccion: 'Misionales' },
  { ruta: '/apoyo/juridica', titulo: 'Gestión Jurídica y Contractual', seccion: 'Apoyo' },
  { ruta: '/apoyo/juridica-procedimientos', titulo: 'Procedimientos Jurídicos', seccion: 'Apoyo' },
  { ruta: '/apoyo/juridica-contratos', titulo: 'Elaboración de Contratos', seccion: 'Apoyo' },
  { ruta: '/apoyo/juridica-formatos', titulo: 'Formatos Contractuales', seccion: 'Apoyo' },
  { ruta: '/apoyo/documental-ti', titulo: 'Gestión Documental y TI', seccion: 'Apoyo' },
  { ruta: '/apoyo/documental-ti-procedimientos', titulo: 'Procedimientos', seccion: 'Apoyo' },
  { ruta: '/apoyo/documental-ti-formatos', titulo: 'Formatos', seccion: 'Apoyo' },
  { ruta: '/apoyo/administrativa', titulo: 'Gestión Administrativa, Financiera y TH', seccion: 'Apoyo' },
  { ruta: '/apoyo/administrativa-procedimientos', titulo: 'Procedimientos: Almacén', seccion: 'Apoyo' },
  { ruta: '/apoyo/administrativa-rrhh', titulo: 'Procedimientos: Talento Humano', seccion: 'Apoyo' },
  { ruta: '/apoyo/administrativa-formatos', titulo: 'Formatos e Instrumentos', seccion: 'Apoyo' },
  { ruta: '/evaluacion/independiente', titulo: 'Evaluación Independiente', seccion: 'Evaluación' },
  { ruta: '/evaluacion/independiente-procedimientos', titulo: 'Procedimientos', seccion: 'Evaluación' },
  { ruta: '/evaluacion/independiente-formatos', titulo: 'Formatos y Guías', seccion: 'Evaluación' },
  { ruta: '/estadisticas', titulo: 'Estadísticas del SGC', seccion: 'Evaluación' },
  { ruta: '/agradecimiento', titulo: 'Cierre Institucional', seccion: 'Evaluación' },
];

export function getNavContext(rutaActual: string) {
  const idx = NAVIGATION.findIndex(p => p.ruta === rutaActual);
  if (idx === -1) return { prev: null, next: null, current: null, index: -1, total: NAVIGATION.length };
  return {
    prev: idx > 0 ? NAVIGATION[idx - 1] : null,
    next: idx < NAVIGATION.length - 1 ? NAVIGATION[idx + 1] : null,
    current: NAVIGATION[idx],
    index: idx,
    total: NAVIGATION.length,
  };
}

export function getBreadcrumb(rutaActual: string) {
  const current = NAVIGATION.find(p => p.ruta === rutaActual);
  if (!current) return [{ label: 'Inicio', href: '/' }];
  const crumbs: { label: string; href: string }[] = [{ label: 'Inicio', href: '/' }];
  if (rutaActual !== '/') crumbs.push({ label: 'Procesos', href: '/procesos' });
  if (current.seccion !== 'Inicio' && current.seccion !== 'Resumen' && current.seccion !== 'Cierre') {
    crumbs.push({ label: current.seccion, href: '#' });
  }
  if (rutaActual !== '/' && rutaActual !== '/procesos') {
    crumbs.push({ label: current.titulo, href: rutaActual });
  }
  return crumbs;
}
