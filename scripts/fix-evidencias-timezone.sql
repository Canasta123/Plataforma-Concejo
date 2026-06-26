-- SQL Migration Script: Corrige el error de diferencia horaria en el SGC y Mesa de Ayuda
-- Ejecuta este script en el SQL Editor de Supabase para ajustar los valores por defecto y corregir los datos históricos.

-- 1. Cambiar los valores por defecto para que almacenen la hora absoluta en UTC (now())
-- De esta forma la base de datos registra el instante real de la subida, y el navegador/aplicación lo renderiza con la zona es-CO de forma precisa.
ALTER TABLE carpetas_evidencia ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE trazabilidad_evidencias ALTER COLUMN fecha SET DEFAULT now();
ALTER TABLE notificaciones ALTER COLUMN created_at SET DEFAULT now();

-- 2. Corregir los registros históricos que se insertaron con 5 horas de retraso debido al bug
-- Nota: Solo ejecuta esta sección si ya tenías registros afectados creados recientemente.
UPDATE carpetas_evidencia 
  SET created_at = created_at + INTERVAL '5 hours';

UPDATE trazabilidad_evidencias 
  SET fecha = fecha + INTERVAL '5 hours';

UPDATE notificaciones 
  SET created_at = created_at + INTERVAL '5 hours';
