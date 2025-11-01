-- ============================================
-- MIGRACIÓN 002: Tabla de Dependencias
-- Fecha: 2025-10-09
-- UUID: c5f9e4d2-4e8d-11ef-9a4c-0242ac120004
-- ============================================

-- PASO 1: Crear tabla de dependencias
CREATE TABLE IF NOT EXISTS dependencias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,           -- Identificador técnico (obras_publicas, servicios_publicos, etc.)
  nombre TEXT NOT NULL,                 -- Nombre para mostrar (Obras Públicas, Servicios Públicos, etc.)
  descripcion TEXT,                     -- Descripción de la dependencia
  icono TEXT NOT NULL DEFAULT '🏛️',   -- Emoji/icono representativo
  color TEXT NOT NULL DEFAULT '#6b7280', -- Color en hex para UI
  responsable TEXT,                     -- Nombre del responsable/director
  telefono TEXT,                        -- Teléfono de contacto
  email TEXT,                           -- Email institucional
  direccion TEXT,                       -- Dirección física
  orden INTEGER NOT NULL DEFAULT 0,     -- Orden de visualización
  activo INTEGER NOT NULL DEFAULT 1,    -- 1=activo, 0=inactivo
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

-- PASO 2: Poblar con dependencias existentes
INSERT INTO dependencias (slug, nombre, icono, color, orden, activo) VALUES
('administracion', 'Administración', '🏛️', '#6366f1', 1, 1),
('obras_publicas', 'Obras Públicas', '🏗️', '#f59e0b', 2, 1),
('servicios_publicos', 'Servicios Públicos', '💡', '#10b981', 3, 1),
('agua_potable', 'Agua Potable', '💧', '#3b82f6', 4, 1),
('seguridad_publica', 'Seguridad Pública', '🚔', '#ef4444', 5, 1),
('parques_jardines', 'Parques y Jardines', '🌳', '#22c55e', 6, 1),
('medio_ambiente', 'Medio Ambiente', '🌿', '#84cc16', 7, 1),
('salud', 'Salud', '🏥', '#ec4899', 8, 1);

-- PASO 3: Crear índices
CREATE INDEX IF NOT EXISTS idx_dependencias_slug ON dependencias(slug);
CREATE INDEX IF NOT EXISTS idx_dependencias_activo ON dependencias(activo);
CREATE INDEX IF NOT EXISTS idx_dependencias_orden ON dependencias(orden);

-- PASO 4: Nota sobre foreign keys
-- NO podemos agregar FK a tablas existentes en SQLite
-- La validación se hará en código backend
-- Las nuevas tablas ya usarán FK

-- PASO 5: Registrar migración en historial
INSERT INTO historial_cambios (usuario_id, entidad, entidad_id, tipo_cambio, valor_nuevo, razon)
VALUES (1, 'sistema', 0, 'migracion', '{"script": "002_dependencias_tabla.sql"}', 'Creación de tabla dependencias');
