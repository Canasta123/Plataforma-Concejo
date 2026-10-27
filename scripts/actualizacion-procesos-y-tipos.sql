-- ============================================================================
-- SGC - Concejo Municipal de Chía
-- Actualización de Tipos de Hallazgo y Catálogo de Procesos Relacionados
-- ============================================================================

-- 1. Actualizar restricción CHECK de tipo de hallazgo en la tabla hallazgos
ALTER TABLE hallazgos DROP CONSTRAINT IF EXISTS hallazgos_tipo_check;

ALTER TABLE hallazgos ADD CONSTRAINT hallazgos_tipo_check CHECK (tipo IN (
  'no_conformidad_mayor',
  'no_conformidad_menor',
  'oportunidad_mejora',
  'producto_no_conforme',
  -- Compatibilidad con registros previos de prueba
  'correctiva',
  'mejora',
  'riesgo'
));

-- 2. Desactivar / Eliminar procesos antiguos que no estén en la nueva lista
-- Primero intentamos eliminar los que no tengan hallazgos asociados
DELETE FROM procesos_sgc 
WHERE nombre NOT IN (
  'Control Político',
  'Proyectos de Acuerdo',
  'Relacionamiento con la ciudadanía',
  'Direccionamiento Estratégico y Comunicaciones',
  'Gestión Jurídica y Contractual',
  'Gestión Documental',
  'Tecnologías de la Información',
  'Sistema de Gestión de Calidad',
  'DAF-Contabilidad',
  'DAF-Tesorería',
  'DAF-Almacén',
  'DAF-Talento Humano y Bienestar',
  'DAF- SG-SST',
  'Evaluación Independiente'
);

-- Si alguno no se pudo borrar porque ya tiene un hallazgo asignado, se marca como inactivo
UPDATE procesos_sgc 
SET activo = false 
WHERE nombre NOT IN (
  'Control Político',
  'Proyectos de Acuerdo',
  'Relacionamiento con la ciudadanía',
  'Direccionamiento Estratégico y Comunicaciones',
  'Gestión Jurídica y Contractual',
  'Gestión Documental',
  'Tecnologías de la Información',
  'Sistema de Gestión de Calidad',
  'DAF-Contabilidad',
  'DAF-Tesorería',
  'DAF-Almacén',
  'DAF-Talento Humano y Bienestar',
  'DAF- SG-SST',
  'Evaluación Independiente'
);

-- 3. Insertar / Actualizar los 14 procesos oficiales solicitados
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
ON CONFLICT (nombre) DO UPDATE SET 
  activo = true, 
  orden = EXCLUDED.orden, 
  tipo = EXCLUDED.tipo;
