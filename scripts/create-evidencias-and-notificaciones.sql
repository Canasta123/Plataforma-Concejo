-- SQL Migration Script: Create tables for tracking evidence uploads and user notifications
-- Execute this script in your Supabase SQL Editor

-- 1. Create table for tracking evidence uploads
CREATE TABLE IF NOT EXISTS trazabilidad_evidencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha TIMESTAMPTZ DEFAULT timezone('America/Bogota'::text, now()),
  ip TEXT,
  usuario TEXT,
  carpeta_destino TEXT,
  nombre_archivo TEXT
);

-- Enable RLS for evidence uploads
ALTER TABLE trazabilidad_evidencias ENABLE ROW LEVEL SECURITY;

-- Allow service role key (used by backend) full access to evidence uploads
CREATE POLICY "Allow all to service_role" ON trazabilidad_evidencias
  USING (true)
  WITH CHECK (true);

-- 2. Create table for user notifications
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  leido BOOLEAN DEFAULT false,
  tipo TEXT, -- 'reserva' | 'ticket' | 'evidencia'
  created_at TIMESTAMPTZ DEFAULT timezone('America/Bogota'::text, now())
);

-- Enable RLS for notifications
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- Allow service role key (used by backend) full access to notifications
CREATE POLICY "Allow all to service_role_notificaciones" ON notificaciones
  USING (true)
  WITH CHECK (true);
