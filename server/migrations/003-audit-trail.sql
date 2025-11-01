-- Migración 003: Sistema de Audit Trail y Trazabilidad
-- Fecha: 2025-10-03
-- Descripción: Agrega tabla historial_cambios para rastrear todos los cambios en reportes

-- Tabla principal de auditoría
CREATE TABLE IF NOT EXISTS historial_cambios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporte_id INTEGER NOT NULL,
  usuario_id INTEGER NOT NULL,
  tipo_cambio TEXT NOT NULL,  -- 'asignacion', 'reasignacion', 'cambio_tipo', 'cambio_estado', etc.
  campo_modificado TEXT,       -- Nombre del campo (tipo, estado, dependencia, etc.)
  valor_anterior TEXT,          -- Valor antes del cambio (JSON si es complejo)
  valor_nuevo TEXT,             -- Valor después del cambio (JSON si es complejo)
  razon TEXT,                   -- Motivo del cambio (proporcionado por usuario)
  metadatos TEXT,               -- JSON con info adicional (IP, user agent, etc.)
  creado_en TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (reporte_id) REFERENCES reportes(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_historial_reporte ON historial_cambios(reporte_id);
CREATE INDEX IF NOT EXISTS idx_historial_usuario ON historial_cambios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historial_fecha ON historial_cambios(creado_en);
CREATE INDEX IF NOT EXISTS idx_historial_tipo ON historial_cambios(tipo_cambio);

-- Vista para consultas rápidas con información de usuario
CREATE VIEW IF NOT EXISTS v_historial_completo AS
SELECT 
  h.*,
  u.nombre as usuario_nombre,
  u.email as usuario_email,
  u.rol as usuario_rol,
  u.dependencia as usuario_dependencia,
  r.tipo as reporte_tipo_actual,
  r.estado as reporte_estado_actual
FROM historial_cambios h
JOIN usuarios u ON h.usuario_id = u.id
JOIN reportes r ON h.reporte_id = r.id;
