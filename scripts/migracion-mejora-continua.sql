-- ============================================================================
-- MÓDULO DE MEJORA CONTINUA Y ACCIONES CORRECTIVAS
-- SGC - Concejo Municipal de Chía
-- 
-- Script de migración para Supabase (PostgreSQL)
-- IMPORTANTE: Este script NO modifica ni elimina tablas existentes.
-- Solo agrega nuevas tablas y un campo adicional a la tabla 'usuarios'.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. ALTERACIÓN DE TABLA EXISTENTE: usuarios
--    Agregar campo para permiso de gestor de mejora continua
--    (similar a como funciona 'acceso_evidencias')
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS es_gestor_mejora boolean DEFAULT false;

COMMENT ON COLUMN usuarios.es_gestor_mejora IS 
  'Permite al usuario actuar como Gestor en el módulo de Mejora Continua (asignar hallazgos, evaluar eficacia, ver dashboard). El admin puede activar este permiso a cualquier usuario.';


-- ────────────────────────────────────────────────────────────────────────────
-- 2. TABLA: procesos_sgc
--    Catálogo de procesos del Sistema de Gestión de Calidad
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS procesos_sgc (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL UNIQUE,
  tipo text NOT NULL CHECK (tipo IN ('estrategico', 'misional', 'apoyo', 'evaluacion')),
  responsable text,
  descripcion text,
  activo boolean DEFAULT true,
  orden int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE procesos_sgc IS 'Catálogo de procesos del SGC del Concejo Municipal de Chía según el mapa de procesos oficial.';

-- Datos semilla: Procesos del SGC del Concejo Municipal de Chía
INSERT INTO procesos_sgc (nombre, tipo, orden, activo) VALUES
  ('Control Político', 'misional', 1, true),
  ('Proyectos de Acuerdo', 'misional', 2, true),
  ('Relacionamiento con la ciudadanía', 'misional', 3, true),
  ('Direccionamiento Estratégico y Comunicaciones', 'estrategico', 4, true),
  ('Gestión Jurídica y Contractual', 'apoyo', 5, true),
  ('Gestión Documental', 'apoyo', 6, true),
  ('Tecnologías de la Información', 'apoyo', 7, true),
  ('Sistema de Gestión de Calidad', 'apoyo', 8, true),
  ('DAF-Contabilidad', 'apoyo', 9, true),
  ('DAF-Tesorería', 'apoyo', 10, true),
  ('DAF-Almacén', 'apoyo', 11, true),
  ('DAF-Talento Humano y Bienestar', 'apoyo', 12, true),
  ('DAF- SG-SST', 'apoyo', 13, true),
  ('Evaluación Independiente', 'evaluacion', 14, true)
ON CONFLICT (nombre) DO UPDATE SET activo = true, orden = EXCLUDED.orden, tipo = EXCLUDED.tipo;


-- ────────────────────────────────────────────────────────────────────────────
-- 3. TABLA: hallazgos
--    Registro principal de hallazgos / no conformidades / oportunidades de mejora
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hallazgos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Identificación
  codigo text NOT NULL UNIQUE,
  titulo text NOT NULL,
  descripcion text NOT NULL,
  
  -- Clasificación (ISO 9001:2015 / SGC Concejo de Chía)
  tipo text NOT NULL CHECK (tipo IN (
    'no_conformidad_mayor',
    'no_conformidad_menor',
    'oportunidad_mejora',
    'producto_no_conforme',
    'correctiva',
    'mejora',
    'riesgo'
  )),
  
  -- Origen del hallazgo
  origen text NOT NULL DEFAULT 'autocontrol' CHECK (origen IN (
    'autocontrol',
    'auditoria',
    'indicador',
    'dofa',
    'pqrs',
    'otro'
  )),
  origen_referencia text,
  
  -- Asociaciones
  proceso_id uuid REFERENCES procesos_sgc(id) ON DELETE SET NULL,
  responsable_id uuid NOT NULL REFERENCES usuarios(id),
  creador_id uuid NOT NULL REFERENCES usuarios(id),
  
  -- Requisito incumplido
  requisito_incumplido text,
  
  -- Flujo de trabajo (5 etapas)
  etapa_actual int NOT NULL DEFAULT 1 CHECK (etapa_actual BETWEEN 1 AND 5),
  
  estado text NOT NULL DEFAULT 'abierto' CHECK (estado IN (
    'abierto',
    'en_tratamiento',
    'en_analisis',
    'en_plan_accion',
    'en_evaluacion',
    'cerrado_eficaz',
    'cerrado_no_eficaz',
    'reformulado'
  )),
  
  -- Control de reformulación
  intentos_reformulacion int DEFAULT 0,
  
  -- Fechas
  fecha_deteccion timestamptz DEFAULT now(),
  fecha_limite timestamptz,
  fecha_cierre timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE hallazgos IS 'Registro principal del módulo de Mejora Continua. Contiene hallazgos, no conformidades y oportunidades de mejora según ISO 9001:2015.';


-- ────────────────────────────────────────────────────────────────────────────
-- 4. TABLA: tratamientos_inmediatos
--    Etapa 2: Tareas de contención para mitigar el impacto inmediato
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tratamientos_inmediatos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hallazgo_id uuid NOT NULL REFERENCES hallazgos(id) ON DELETE CASCADE,
  descripcion text NOT NULL,
  responsable_id uuid NOT NULL REFERENCES usuarios(id),
  fecha_compromiso timestamptz NOT NULL,
  completada boolean DEFAULT false,
  fecha_completado timestamptz,
  evidencia_texto text,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE tratamientos_inmediatos IS 'Etapa 2: Tareas de contención inmediata para mitigar el impacto del hallazgo.';


-- ────────────────────────────────────────────────────────────────────────────
-- 5. TABLA: analisis_causas
--    Etapa 3: Análisis de causa raíz (Ishikawa 6M / 5 Porqués)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS analisis_causas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hallazgo_id uuid NOT NULL REFERENCES hallazgos(id) ON DELETE CASCADE,
  
  metodologia text NOT NULL CHECK (metodologia IN ('ishikawa', '5_porques')),
  
  -- datos_analisis almacena:
  -- Para Ishikawa: {
  --   "mano_de_obra": ["causa1", "causa2"],
  --   "maquinaria": ["causa1"],
  --   "metodos": ["causa1", "causa2", "causa3"],
  --   "materiales": [],
  --   "medicion": ["causa1"],
  --   "medio_ambiente": []
  -- }
  -- Para 5 Porqués: [
  --   {"pregunta": "¿Por qué ocurrió?", "respuesta": "Porque..."},
  --   {"pregunta": "¿Por qué ...?", "respuesta": "Porque..."},
  --   ...
  -- ]
  datos_analisis jsonb NOT NULL DEFAULT '{}',
  
  causa_raiz text,
  
  analista_id uuid NOT NULL REFERENCES usuarios(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE analisis_causas IS 'Etapa 3: Análisis de causa raíz usando Diagrama de Ishikawa (6M) o metodología de los 5 Porqués.';


-- ────────────────────────────────────────────────────────────────────────────
-- 6. TABLA: plan_accion_tareas
--    Etapa 4: Actividades del plan de acción correctiva/preventiva
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS plan_accion_tareas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hallazgo_id uuid NOT NULL REFERENCES hallazgos(id) ON DELETE CASCADE,
  actividad text NOT NULL,
  descripcion_detalle text,
  responsable_id uuid NOT NULL REFERENCES usuarios(id),
  fecha_inicio timestamptz,
  fecha_limite timestamptz NOT NULL,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN (
    'pendiente',
    'en_progreso',
    'completada',
    'vencida'
  )),
  porcentaje_avance int DEFAULT 0 CHECK (porcentaje_avance BETWEEN 0 AND 100),
  evidencia_texto text,
  fecha_completado timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE plan_accion_tareas IS 'Etapa 4: Actividades específicas del plan de acción con responsables, fechas y semaforización.';


-- ────────────────────────────────────────────────────────────────────────────
-- 7. TABLA: evaluaciones_eficacia
--    Etapa 5: Evaluación de eficacia y control de reformulación
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS evaluaciones_eficacia (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hallazgo_id uuid NOT NULL REFERENCES hallazgos(id) ON DELETE CASCADE,
  evaluador_id uuid NOT NULL REFERENCES usuarios(id),
  es_eficaz boolean NOT NULL,
  justificacion text NOT NULL,
  fecha_evaluacion timestamptz DEFAULT now(),
  accion_tomada text,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE evaluaciones_eficacia IS 'Etapa 5: Registro de evaluaciones de eficacia. Si no es eficaz, dispara reformulación o escalamiento.';


-- ────────────────────────────────────────────────────────────────────────────
-- 8. TABLA: hallazgo_adjuntos
--    Evidencias documentales asociadas al hallazgo (Supabase Storage)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hallazgo_adjuntos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hallazgo_id uuid NOT NULL REFERENCES hallazgos(id) ON DELETE CASCADE,
  etapa int NOT NULL CHECK (etapa BETWEEN 1 AND 5),
  referencia_id uuid,
  nombre_original text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  tamanio_bytes bigint,
  subido_por uuid REFERENCES usuarios(id),
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE hallazgo_adjuntos IS 'Archivos de evidencia asociados a hallazgos, almacenados en Supabase Storage (bucket hallazgo-adjuntos).';


-- ────────────────────────────────────────────────────────────────────────────
-- 9. TABLA: hallazgo_trazabilidad
--    Log completo de todos los eventos del ciclo de vida del hallazgo
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hallazgo_trazabilidad (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hallazgo_id uuid NOT NULL REFERENCES hallazgos(id) ON DELETE CASCADE,
  autor_id uuid REFERENCES usuarios(id),
  tipo text NOT NULL CHECK (tipo IN (
    'creacion',
    'cambio_etapa',
    'cambio_estado',
    'asignacion',
    'tratamiento',
    'analisis',
    'tarea_plan',
    'evaluacion',
    'reformulacion',
    'comentario',
    'adjunto'
  )),
  contenido text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE hallazgo_trazabilidad IS 'Trazabilidad completa de eventos del módulo de Mejora Continua para auditoría y seguimiento.';


-- ────────────────────────────────────────────────────────────────────────────
-- 10. TABLA: config_mejora
--     Parámetros configurables del módulo (solo admin)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS config_mejora (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clave text NOT NULL UNIQUE,
  valor text NOT NULL,
  descripcion text,
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE config_mejora IS 'Parámetros de configuración del módulo de Mejora Continua.';

-- Valores iniciales por defecto
INSERT INTO config_mejora (clave, valor, descripcion) VALUES
  ('min_porques', '3', 'Número mínimo de porqués requeridos en la metodología de los 5 Porqués antes de poder formular la causa raíz'),
  ('max_reformulaciones', '3', 'Número máximo de reformulaciones permitidas antes de generar alerta crítica al administrador'),
  ('dias_evaluacion_eficacia', '30', 'Días después de completar todas las tareas del plan de acción para solicitar evaluación de eficacia'),
  ('dias_alerta_vencimiento', '3', 'Días hábiles antes del vencimiento para mostrar alerta amarilla (semáforo)')
ON CONFLICT (clave) DO NOTHING;


-- ────────────────────────────────────────────────────────────────────────────
-- 11. ÍNDICES DE RENDIMIENTO
-- ────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_hallazgos_estado ON hallazgos(estado);
CREATE INDEX IF NOT EXISTS idx_hallazgos_tipo ON hallazgos(tipo);
CREATE INDEX IF NOT EXISTS idx_hallazgos_proceso ON hallazgos(proceso_id);
CREATE INDEX IF NOT EXISTS idx_hallazgos_responsable ON hallazgos(responsable_id);
CREATE INDEX IF NOT EXISTS idx_hallazgos_creador ON hallazgos(creador_id);
CREATE INDEX IF NOT EXISTS idx_hallazgos_etapa ON hallazgos(etapa_actual);
CREATE INDEX IF NOT EXISTS idx_hallazgos_fecha ON hallazgos(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tratamientos_hallazgo ON tratamientos_inmediatos(hallazgo_id);
CREATE INDEX IF NOT EXISTS idx_tratamientos_responsable ON tratamientos_inmediatos(responsable_id);

CREATE INDEX IF NOT EXISTS idx_analisis_hallazgo ON analisis_causas(hallazgo_id);

CREATE INDEX IF NOT EXISTS idx_plan_tareas_hallazgo ON plan_accion_tareas(hallazgo_id);
CREATE INDEX IF NOT EXISTS idx_plan_tareas_responsable ON plan_accion_tareas(responsable_id);
CREATE INDEX IF NOT EXISTS idx_plan_tareas_estado ON plan_accion_tareas(estado);

CREATE INDEX IF NOT EXISTS idx_evaluaciones_hallazgo ON evaluaciones_eficacia(hallazgo_id);

CREATE INDEX IF NOT EXISTS idx_adjuntos_hallazgo ON hallazgo_adjuntos(hallazgo_id);

CREATE INDEX IF NOT EXISTS idx_trazabilidad_mejora_hallazgo ON hallazgo_trazabilidad(hallazgo_id);
CREATE INDEX IF NOT EXISTS idx_trazabilidad_mejora_tipo ON hallazgo_trazabilidad(tipo);
CREATE INDEX IF NOT EXISTS idx_trazabilidad_mejora_fecha ON hallazgo_trazabilidad(created_at DESC);


-- ────────────────────────────────────────────────────────────────────────────
-- 12. BUCKET DE STORAGE PARA ADJUNTOS
-- ────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('hallazgo-adjuntos', 'hallazgo-adjuntos', false)
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- FIN DEL SCRIPT
-- 
-- Resumen de cambios:
--   ✅ 1 campo nuevo en tabla 'usuarios' (es_gestor_mejora)
--   ✅ 9 tablas nuevas creadas
--   ✅ 7 procesos SGC pre-cargados
--   ✅ 4 parámetros de configuración inicializados
--   ✅ 17 índices de rendimiento
--   ✅ 1 bucket de Storage
--   ❌ 0 tablas existentes modificadas o eliminadas
-- ============================================================================
