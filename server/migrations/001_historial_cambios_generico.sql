-- Migración: Hacer historial_cambios genérico para soportar audit trail de cualquier entidad
-- Fecha: 2025-10-08
-- Razón: El código del admin necesita registrar cambios en categorías y tipos, no solo reportes

-- Paso 1: Crear tabla temporal con el nuevo esquema
CREATE TABLE IF NOT EXISTS historial_cambios_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  entidad TEXT NOT NULL,              -- 'reporte', 'tipo_reporte', 'categoria', 'usuario', etc.
  entidad_id INTEGER NOT NULL,        -- ID de la entidad modificada
  tipo_cambio TEXT NOT NULL,          -- 'creacion', 'edicion', 'eliminacion', 'asignacion', etc.
  campo_modificado TEXT,              -- Campo específico (opcional)
  valor_anterior TEXT,                -- Valor antes del cambio (JSON si es complejo)
  valor_nuevo TEXT,                   -- Valor después del cambio (JSON si es complejo)
  razon TEXT,                         -- Motivo del cambio
  metadatos TEXT,                     -- JSON con info adicional (IP, user agent, etc.)
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Paso 2: Copiar datos existentes (migrar reportes al nuevo formato)
INSERT INTO historial_cambios_new 
  (id, usuario_id, entidad, entidad_id, tipo_cambio, campo_modificado, valor_anterior, valor_nuevo, razon, metadatos, creado_en)
SELECT 
  id, 
  usuario_id, 
  'reporte' as entidad,
  reporte_id as entidad_id,
  tipo_cambio,
  campo_modificado,
  valor_anterior,
  valor_nuevo,
  razon,
  metadatos,
  creado_en
FROM historial_cambios;

-- Paso 3: Eliminar tabla antigua
DROP TABLE historial_cambios;

-- Paso 4: Renombrar tabla nueva
ALTER TABLE historial_cambios_new RENAME TO historial_cambios;

-- Paso 5: Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_historial_entidad ON historial_cambios(entidad, entidad_id);
CREATE INDEX IF NOT EXISTS idx_historial_usuario ON historial_cambios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historial_fecha ON historial_cambios(creado_en);
