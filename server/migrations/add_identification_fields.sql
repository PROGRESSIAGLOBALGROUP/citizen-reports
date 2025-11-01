-- Migración: Agregar campos de identificación para prevenir duplicados
-- Ejecutar: sqlite3 data.db < server/migrations/add_identification_fields.sql

-- Agregar columnas de identificación
ALTER TABLE reportes ADD COLUMN ip_cliente TEXT;
ALTER TABLE reportes ADD COLUMN user_agent TEXT;
ALTER TABLE reportes ADD COLUMN fingerprint TEXT;
ALTER TABLE reportes ADD COLUMN sesion_id TEXT;

-- Crear índices para búsquedas rápidas de duplicados
CREATE INDEX IF NOT EXISTS idx_reportes_ip_cliente ON reportes(ip_cliente);
CREATE INDEX IF NOT EXISTS idx_reportes_fingerprint ON reportes(fingerprint);
CREATE INDEX IF NOT EXISTS idx_reportes_sesion_id ON reportes(sesion_id);

-- Índice compuesto para detección de duplicados por ubicación y dispositivo
CREATE INDEX IF NOT EXISTS idx_reportes_duplicados ON reportes(lat, lng, fingerprint, creado_en);