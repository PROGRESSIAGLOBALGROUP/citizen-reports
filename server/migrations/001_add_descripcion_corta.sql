-- Migración: Agregar columna descripcion_corta
-- Fecha: 2025-10-01
-- Propósito: Separar descripción pública (corta) de descripción completa (funcionarios)

-- 1. Agregar columna descripcion_corta (nullable inicialmente)
ALTER TABLE reportes ADD COLUMN descripcion_corta TEXT;

-- 2. Generar descripciones cortas automáticas para registros existentes
--    Usa los primeros 100 caracteres de la descripción original
UPDATE reportes 
SET descripcion_corta = CASE 
  WHEN length(descripcion) <= 100 THEN descripcion
  ELSE substr(descripcion, 1, 100) || '...'
END
WHERE descripcion_corta IS NULL;

-- 3. Crear índice para búsquedas rápidas (opcional pero recomendado)
CREATE INDEX IF NOT EXISTS idx_reportes_descripcion_corta ON reportes(descripcion_corta);
