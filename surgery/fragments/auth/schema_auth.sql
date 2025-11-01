-- Tabla de usuarios (funcionarios)
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  password_hash TEXT, -- NULL si usa solo Google OAuth
  dependencia TEXT NOT NULL, -- 'obras_publicas', 'alumbrado', 'seguridad', etc.
  rol TEXT NOT NULL DEFAULT 'funcionario', -- 'funcionario', 'supervisor', 'admin'
  firma_digital TEXT, -- Imagen base64 de la firma escaneada
  activo INTEGER NOT NULL DEFAULT 1,
  google_id TEXT UNIQUE, -- ID de Google OAuth
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tabla de sesiones
CREATE TABLE IF NOT EXISTS sesiones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expira_en TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de asignaciones de reportes
CREATE TABLE IF NOT EXISTS asignaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporte_id INTEGER NOT NULL,
  usuario_id INTEGER NOT NULL,
  asignado_por INTEGER, -- ID del supervisor que asignó
  notas TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (reporte_id) REFERENCES reportes(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (asignado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  UNIQUE(reporte_id, usuario_id)
);

-- Tabla de cierres de reportes (en espera de aprobación)
CREATE TABLE IF NOT EXISTS cierres_pendientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporte_id INTEGER UNIQUE NOT NULL,
  funcionario_id INTEGER NOT NULL,
  notas_cierre TEXT NOT NULL,
  firma_digital TEXT NOT NULL, -- Base64 de la firma al cerrar
  evidencia_fotos TEXT, -- JSON array de URLs/base64
  fecha_cierre TEXT NOT NULL DEFAULT (datetime('now')),
  supervisor_id INTEGER, -- Se asigna automáticamente según dependencia
  aprobado INTEGER DEFAULT 0, -- 0=pendiente, 1=aprobado, -1=rechazado
  notas_supervisor TEXT,
  fecha_revision TEXT,
  FOREIGN KEY (reporte_id) REFERENCES reportes(id) ON DELETE CASCADE,
  FOREIGN KEY (funcionario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (supervisor_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Agregar campos a tabla reportes existente
ALTER TABLE reportes ADD COLUMN estado TEXT NOT NULL DEFAULT 'abierto'; -- 'abierto', 'asignado', 'en_proceso', 'pendiente_cierre', 'cerrado'
ALTER TABLE reportes ADD COLUMN dependencia TEXT; -- Se asigna según tipo de reporte
ALTER TABLE reportes ADD COLUMN prioridad TEXT DEFAULT 'media'; -- 'baja', 'media', 'alta', 'urgente'
ALTER TABLE reportes ADD COLUMN fingerprint TEXT; -- Para identificación de dispositivo
ALTER TABLE reportes ADD COLUMN ip_cliente TEXT; -- Para registro de IP

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_dependencia ON usuarios(dependencia);
CREATE INDEX IF NOT EXISTS idx_sesiones_token ON sesiones(token);
CREATE INDEX IF NOT EXISTS idx_sesiones_expira ON sesiones(expira_en);
CREATE INDEX IF NOT EXISTS idx_asignaciones_reporte ON asignaciones(reporte_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_usuario ON asignaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_cierres_reporte ON cierres_pendientes(reporte_id);
CREATE INDEX IF NOT EXISTS idx_cierres_aprobado ON cierres_pendientes(aprobado);
CREATE INDEX IF NOT EXISTS idx_reportes_estado ON reportes(estado);
CREATE INDEX IF NOT EXISTS idx_reportes_dependencia ON reportes(dependencia);

-- Datos iniciales: usuarios de prueba (password: "admin123" - bcrypt hash)
INSERT OR IGNORE INTO usuarios (id, email, nombre, password_hash, dependencia, rol, activo) VALUES 
(1, 'admin@jantetelco.gob.mx', 'Administrador Sistema', '$2b$10$rHWQvQZ9vX3qF4YqXqJ0O.YwJ5Z0E8KxVZ2vQqWqZ9vX3qF4YqXqJ', 'administracion', 'admin', 1),
(2, 'supervisor.obras@jantetelco.gob.mx', 'Supervisor Obras Públicas', '$2b$10$rHWQvQZ9vX3qF4YqXqJ0O.YwJ5Z0E8KxVZ2vQqWqZ9vX3qF4YqXqJ', 'obras_publicas', 'supervisor', 1),
(3, 'func.obras1@jantetelco.gob.mx', 'Juan Pérez - Obras', '$2b$10$rHWQvQZ9vX3qF4YqXqJ0O.YwJ5Z0E8KxVZ2vQqWqZ9vX3qF4YqXqJ', 'obras_publicas', 'funcionario', 1);

-- Mapeo de tipos de reporte a dependencias
-- Este mapeo se usará en el backend para asignar automáticamente la dependencia
/*
MAPEO:
'baches' -> 'obras_publicas'
'alumbrado' -> 'servicios_publicos'
'seguridad' -> 'seguridad_publica'
'limpieza' -> 'servicios_publicos'
'agua' -> 'agua_potable'
'parques' -> 'parques_jardines'
*/
