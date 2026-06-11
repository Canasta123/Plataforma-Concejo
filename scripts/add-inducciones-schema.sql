-- SQL Migration Script: Add induction columns to usuarios table
-- Execute this script in your Supabase SQL Editor

ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS induccion_sgc BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS induccion_mesa BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS induccion_capacitacion BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS induccion_completada BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS induccion_fecha TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS induccion_comentarios TEXT;
