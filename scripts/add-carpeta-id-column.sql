-- SQL migration to add carpeta_id to trazabilidad_evidencias if it wasn't added by the previous script
-- Execute this in the Supabase SQL editor.

ALTER TABLE trazabilidad_evidencias 
  ADD COLUMN IF NOT EXISTS carpeta_id UUID REFERENCES carpetas_evidencia(id) ON DELETE SET NULL;
