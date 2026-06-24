-- SQL Migration Script: Create tables for tracking evidence uploads, dynamic folders, and user notifications
-- Execute this script in your Supabase SQL Editor

-- 1. Columna de acceso al módulo/consola de evidencias (por defecto desactivado para solicitantes/agentes comunes)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS acceso_evidencias BOOLEAN DEFAULT false;

-- Aseguramos que los administradores y auditores existentes tengan el acceso habilitado por defecto
UPDATE usuarios SET acceso_evidencias = true WHERE rol = 'admin' OR rol = 'auditor';

-- 2. Tabla de Carpetas Dinámicas
CREATE TABLE IF NOT EXISTS carpetas_evidencia (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT UNIQUE NOT NULL,
  icono TEXT DEFAULT 'fas fa-folder',
  color TEXT DEFAULT 'text-blue-600 bg-blue-50 border-blue-100',
  activa BOOLEAN DEFAULT true,               -- Borrado lógico (archivar)
  created_at TIMESTAMPTZ DEFAULT timezone('America/Bogota'::text, now()),
  created_by UUID REFERENCES usuarios(id)
);

-- Habilitar Seguridad RLS para carpetas_evidencia
ALTER TABLE carpetas_evidencia ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas anteriores si existen
DROP POLICY IF EXISTS "Lectura de carpetas activa para todos" ON carpetas_evidencia;
DROP POLICY IF EXISTS "Admin control total de carpetas" ON carpetas_evidencia;

-- Política RLS: Lectura pública de carpetas para todos los usuarios autenticados
CREATE POLICY "Lectura de carpetas activa para todos" ON carpetas_evidencia
  FOR SELECT USING (true);

-- Política RLS: Permitir creación, modificación y borrado lógico solo a administradores
CREATE POLICY "Admin control total de carpetas" ON carpetas_evidencia
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE usuarios.id = auth.uid() AND usuarios.rol = 'admin'
    )
  );

-- Insertar carpetas por defecto si no existen
INSERT INTO carpetas_evidencia (nombre, icono, color) VALUES
  ('Riesgos y oportunidades', 'fas fa-shield-halved', 'text-blue-600 bg-blue-50 border-blue-100'),
  ('Planes de Mejoramiento', 'fas fa-chart-line', 'text-emerald-600 bg-emerald-50 border-emerald-100'),
  ('Indicadores', 'fas fa-chart-bar', 'text-amber-600 bg-amber-50 border-amber-100'),
  ('Revisión por la Dirección', 'fas fa-users-cog', 'text-purple-600 bg-purple-50 border-purple-100'),
  ('Modelo Integrado de Planeación y Gestión 2025', 'fas fa-sitemap', 'text-indigo-600 bg-indigo-50 border-indigo-100'),
  ('Seguimiento Planes Institucionales', 'fas fa-list-check', 'text-cyan-600 bg-cyan-50 border-cyan-100'),
  ('SG-SST', 'fas fa-heart-pulse', 'text-rose-600 bg-rose-50 border-rose-100'),
  ('Empalme', 'fas fa-handshake', 'text-teal-600 bg-teal-50 border-teal-100')
ON CONFLICT (nombre) DO NOTHING;

-- 3. Tabla de Trazabilidad de Evidencias (con llave foránea a carpetas_evidencia)
CREATE TABLE IF NOT EXISTS trazabilidad_evidencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha TIMESTAMPTZ DEFAULT timezone('America/Bogota'::text, now()),
  ip TEXT,
  usuario TEXT,
  carpeta_destino TEXT,
  nombre_archivo TEXT,
  carpeta_id UUID REFERENCES carpetas_evidencia(id) ON DELETE SET NULL
);

-- Habilitar RLS para trazabilidad_evidencias
ALTER TABLE trazabilidad_evidencias ENABLE ROW LEVEL SECURITY;

-- Eliminar política anterior si existe
DROP POLICY IF EXISTS "Allow all to service_role" ON trazabilidad_evidencias;

-- Política RLS: Permitir operaciones desde el backend utilizando el rol de servicio
CREATE POLICY "Allow all to service_role" ON trazabilidad_evidencias
  USING (true)
  WITH CHECK (true);

-- 4. Tabla de Notificaciones Internas para el Panel de Control
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  leido BOOLEAN DEFAULT false,
  tipo TEXT, -- 'reserva' | 'ticket' | 'evidencia'
  created_at TIMESTAMPTZ DEFAULT timezone('America/Bogota'::text, now())
);

-- Habilitar RLS para notificaciones
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- Eliminar política anterior si existe
DROP POLICY IF EXISTS "Allow all to service_role_notificaciones" ON notificaciones;

-- Política RLS: Permitir operaciones completas de lectura y escritura al backend
CREATE POLICY "Allow all to service_role_notificaciones" ON notificaciones
  USING (true)
  WITH CHECK (true);
