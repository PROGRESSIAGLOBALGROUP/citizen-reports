-- Migración 006: Agregar campo telefono a usuarios
-- Para notificaciones SMS con Twilio
-- 
-- Aplicar con: sqlite3 server/data.db < server/migrations/006_usuarios_telefono.sql

-- Agregar columna telefono a usuarios (si no existe)
ALTER TABLE usuarios ADD COLUMN telefono TEXT;

-- Agregar columna sms_habilitado para opt-in/opt-out
ALTER TABLE usuarios ADD COLUMN sms_habilitado INTEGER DEFAULT 1;

-- Índice para búsqueda rápida de usuarios con teléfono
CREATE INDEX IF NOT EXISTS idx_usuarios_telefono ON usuarios(telefono) WHERE telefono IS NOT NULL;

-- Actualizar timestamp
-- (No hay columna updated_at en usuarios, pero si la hubiera sería aquí)
