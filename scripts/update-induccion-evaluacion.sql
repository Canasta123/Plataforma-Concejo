-- SQL Migration Script: Update induction evaluation and activation columns
-- Execute this script in your Supabase SQL Editor

ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS induccion_habilitada BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS induccion_valoracion_sgc INTEGER CHECK (induccion_valoracion_sgc >= 1 AND induccion_valoracion_sgc <= 5),
ADD COLUMN IF NOT EXISTS induccion_valoracion_mesa INTEGER CHECK (induccion_valoracion_mesa >= 1 AND induccion_valoracion_mesa <= 5);
