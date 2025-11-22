-- Schema completo con todas las tablas necesarias
-- Incluye: reportes, usuarios, sesiones, asignaciones, cierres_pendientes, categorias, tipos_reporte

PRAGMA foreign_keys = ON;

-- ==========================
-- TABLA DE REPORTES
-- ==========================
CREATE TABLE IF NOT EXISTS reportes (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo              TEXT NOT NULL,
  descripcion       TEXT,
  descripcion_corta TEXT,
  lat               REAL NOT NULL,
  lng               REAL NOT NULL,
  colonia           TEXT,
  codigo_postal     TEXT,
  municipio         TEXT,
  estado_ubicacion  TEXT,
  pais              TEXT DEFAULT 'México',
  peso              INTEGER NOT NULL DEFAULT 1,
  estado            TEXT NOT NULL DEFAULT 'abierto',
  dependencia       TEXT,
  prioridad         TEXT DEFAULT 'media',
  fingerprint       TEXT,
  ip_cliente        TEXT,
  creado_en         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reportes_lat_lng ON reportes(lat, lng);
CREATE INDEX IF NOT EXISTS idx_reportes_tipo ON reportes(tipo);
CREATE INDEX IF NOT EXISTS idx_reportes_estado ON reportes(estado);
CREATE INDEX IF NOT EXISTS idx_reportes_dependencia ON reportes(dependencia);

-- ==========================
-- TABLA DE USUARIOS
-- ==========================
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  password_hash TEXT,
  dependencia TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'funcionario',
  firma_digital TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  google_id TEXT UNIQUE,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ==========================
-- TABLA DE SESIONES
-- ==========================
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

-- ==========================
-- TABLA DE ASIGNACIONES
-- ==========================
CREATE TABLE IF NOT EXISTS asignaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporte_id INTEGER NOT NULL,
  usuario_id INTEGER NOT NULL,
  asignado_por INTEGER,
  notas TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (reporte_id) REFERENCES reportes(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (asignado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  UNIQUE(reporte_id, usuario_id)
);

-- ==========================
-- TABLA DE CIERRES PENDIENTES
-- ==========================
CREATE TABLE IF NOT EXISTS cierres_pendientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporte_id INTEGER UNIQUE NOT NULL,
  funcionario_id INTEGER NOT NULL,
  notas_cierre TEXT NOT NULL,
  firma_digital TEXT NOT NULL,
  evidencia_fotos TEXT,
  fecha_cierre TEXT NOT NULL DEFAULT (datetime('now')),
  supervisor_id INTEGER,
  aprobado INTEGER DEFAULT 0,
  notas_supervisor TEXT,
  fecha_revision TEXT,
  FOREIGN KEY (reporte_id) REFERENCES reportes(id) ON DELETE CASCADE,
  FOREIGN KEY (funcionario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (supervisor_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ==========================
-- TABLA DE CONFIGURACIÓN WHITE LABEL
-- ==========================
-- Permite que municipios pagantes oculten referencias a PROGRESSIA
CREATE TABLE IF NOT EXISTS whitelabel_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_municipio TEXT NOT NULL,
  mostrar_progressia INTEGER DEFAULT 1,
  mostrar_citizen_reports INTEGER DEFAULT 1,
  color_primario TEXT DEFAULT '#1e40af',
  color_secundario TEXT DEFAULT '#2563eb',
  logo_url TEXT,
  nombre_app TEXT DEFAULT 'Citizen-Reports',
  lema TEXT DEFAULT 'Transparencia Municipal',
  -- Coordenadas iniciales del mapa (dinámicas por municipio)
  mapa_lat REAL DEFAULT 18.7150,        -- Latitud (Centro de Jantetelco, Wikipedia: 18°42'54"N)
  mapa_lng REAL DEFAULT -98.7764,       -- Longitud (Centro de Jantetelco, Wikipedia: 98°46'35"W)
  mapa_zoom INTEGER DEFAULT 16,         -- Nivel de zoom inicial
  ubicacion TEXT DEFAULT 'Jantetelco, Morelos',  -- Nombre legible de la ubicación
  activo INTEGER DEFAULT 1,
  super_usuario_id INTEGER,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (super_usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_whitelabel_municipio ON whitelabel_config(nombre_municipio);

-- ==========================
-- TABLA DE HISTORIAL DE CAMBIOS (ADR-0010 Audit Trail - Genérico)
-- ==========================
-- Migrado a formato genérico para soportar audit trail de cualquier entidad
CREATE TABLE IF NOT EXISTS historial_cambios (
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

-- ==========================
-- TABLA DE DEPENDENCIAS (ADR-0009 + Migración 002)
-- ==========================
CREATE TABLE IF NOT EXISTS dependencias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  icono TEXT NOT NULL DEFAULT '🏛️',
  color TEXT NOT NULL DEFAULT '#6b7280',
  responsable TEXT,
  telefono TEXT,
  email TEXT,
  direccion TEXT,
  orden INTEGER NOT NULL DEFAULT 0,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ==========================
-- TABLA DE CATEGORÍAS (ADR-0009)
-- ==========================
CREATE TABLE IF NOT EXISTS categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT UNIQUE NOT NULL,
  icono TEXT NOT NULL,
  descripcion TEXT,
  orden INTEGER NOT NULL DEFAULT 0,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ==========================
-- TABLA DE TIPOS DE REPORTE (ADR-0009)
-- ==========================
CREATE TABLE IF NOT EXISTS tipos_reporte (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT UNIQUE NOT NULL,  -- Identificador técnico (slug)
  nombre TEXT NOT NULL,        -- Nombre para mostrar
  icono TEXT NOT NULL,
  color TEXT NOT NULL,
  categoria_id INTEGER NOT NULL,
  dependencia TEXT NOT NULL,
  descripcion TEXT,
  orden INTEGER NOT NULL DEFAULT 0,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
);

-- ==========================
-- TABLA DE NOTAS DE TRABAJO (Bitácora Auditable - Append-Only)
-- ==========================
-- Sistema de registro inmutable de notas de trabajo (no sobreescribe, solo append)
-- Cada entrada es un registro histórico con timestamp
-- Soporta trazabilidad completa según mejores prácticas de auditoría
CREATE TABLE IF NOT EXISTS notas_trabajo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporte_id INTEGER NOT NULL,
  usuario_id INTEGER NOT NULL,
  contenido TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'observacion',  -- 'observacion', 'avance', 'incidente', 'resolucion'
  metadatos TEXT,                             -- JSON con info adicional (ubicación, fotos, etc.)
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (reporte_id) REFERENCES reportes(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notas_trabajo_reporte ON notas_trabajo(reporte_id);
CREATE INDEX IF NOT EXISTS idx_notas_trabajo_usuario ON notas_trabajo(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notas_trabajo_fecha ON notas_trabajo(creado_en);
CREATE INDEX IF NOT EXISTS idx_notas_trabajo_tipo ON notas_trabajo(tipo);

-- ==========================
-- ÍNDICES
-- ==========================
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_dependencia ON usuarios(dependencia);
CREATE INDEX IF NOT EXISTS idx_sesiones_token ON sesiones(token);
CREATE INDEX IF NOT EXISTS idx_sesiones_expira ON sesiones(expira_en);
CREATE INDEX IF NOT EXISTS idx_asignaciones_reporte ON asignaciones(reporte_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_usuario ON asignaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_cierres_reporte ON cierres_pendientes(reporte_id);
CREATE INDEX IF NOT EXISTS idx_cierres_aprobado ON cierres_pendientes(aprobado);
CREATE INDEX IF NOT EXISTS idx_historial_entidad ON historial_cambios(entidad, entidad_id);
CREATE INDEX IF NOT EXISTS idx_historial_usuario ON historial_cambios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historial_fecha ON historial_cambios(creado_en);
CREATE INDEX IF NOT EXISTS idx_historial_tipo ON historial_cambios(tipo_cambio);
CREATE INDEX IF NOT EXISTS idx_tipos_categoria ON tipos_reporte(categoria_id);
CREATE INDEX IF NOT EXISTS idx_tipos_activo ON tipos_reporte(activo);
CREATE INDEX IF NOT EXISTS idx_categorias_activo ON categorias(activo);
CREATE INDEX IF NOT EXISTS idx_dependencias_slug ON dependencias(slug);
CREATE INDEX IF NOT EXISTS idx_dependencias_activo ON dependencias(activo);
CREATE INDEX IF NOT EXISTS idx_dependencias_orden ON dependencias(orden);

-- ==========================
-- DATOS INICIALES: DEPENDENCIAS
-- ==========================
INSERT OR IGNORE INTO dependencias (slug, nombre, icono, color, orden, activo) VALUES
('administracion', 'Administración', '🏛️', '#6366f1', 1, 1),
('obras_publicas', 'Obras Públicas', '🏗️', '#f59e0b', 2, 1),
('servicios_publicos', 'Servicios Públicos', '💡', '#10b981', 3, 1),
('agua_potable', 'Agua Potable', '💧', '#3b82f6', 4, 1),
('seguridad_publica', 'Seguridad Pública', '🚔', '#ef4444', 5, 1),
('parques_jardines', 'Parques y Jardines', '🌳', '#22c55e', 6, 1),
('medio_ambiente', 'Medio Ambiente', '🌿', '#84cc16', 7, 1),
('salud', 'Salud', '🏥', '#ec4899', 8, 1);

-- ==========================
-- DATOS INICIALES: CATEGORÍAS
-- ==========================
INSERT OR IGNORE INTO categorias (id, nombre, icono, descripcion, orden) VALUES
(1, 'Obras Públicas', '🛣️', 'Infraestructura vial y urbana', 1),
(2, 'Servicios Públicos', '🔧', 'Mantenimiento general y servicios urbanos', 2),
(3, 'Agua Potable', '💧', 'Red hidráulica y suministro de agua', 3),
(4, 'Seguridad Pública', '🚨', 'Seguridad ciudadana y orden público', 4),
(5, 'Salud', '🏥', 'Salud pública y control sanitario', 5),
(6, 'Medio Ambiente', '🌳', 'Conservación ambiental y áreas verdes', 6),
(7, 'Otros', '📦', 'Reportes misceláneos', 7);

-- ==========================
-- DATOS INICIALES: TIPOS DE REPORTE
-- ==========================

-- Obras Públicas
INSERT OR IGNORE INTO tipos_reporte (tipo, nombre, icono, color, categoria_id, dependencia, orden) VALUES
('baches', 'Baches', '🛣️', '#8b5cf6', 1, 'obras_publicas', 1),
('pavimento_danado', 'Pavimento Dañado', '🚧', '#7c3aed', 1, 'obras_publicas', 2),
('banqueta_rota', 'Banqueta Rota', '🚶', '#a855f7', 1, 'obras_publicas', 3),
('coladera', 'Coladera sin Tapa', '🕳️', '#9333ea', 1, 'obras_publicas', 4);

-- Servicios Públicos
INSERT OR IGNORE INTO tipos_reporte (tipo, nombre, icono, color, categoria_id, dependencia, orden) VALUES
('alumbrado', 'Alumbrado Público', '💡', '#f59e0b', 2, 'servicios_publicos', 1),
('basura', 'Basura', '🗑️', '#10b981', 2, 'servicios_publicos', 2),
('limpieza', 'Limpieza', '🧹', '#059669', 2, 'servicios_publicos', 3),
('parques', 'Parques y Jardines', '🌳', '#22c55e', 2, 'parques_jardines', 4);

-- Agua Potable
INSERT OR IGNORE INTO tipos_reporte (tipo, nombre, icono, color, categoria_id, dependencia, orden) VALUES
('agua', 'Falta de Agua', '💧', '#3b82f6', 3, 'agua_potable', 1),
('fuga_agua', 'Fuga de Agua', '💦', '#2563eb', 3, 'agua_potable', 2),
('drenaje', 'Drenaje', '🚰', '#1d4ed8', 3, 'agua_potable', 3);

-- Seguridad Pública
INSERT OR IGNORE INTO tipos_reporte (tipo, nombre, icono, color, categoria_id, dependencia, orden) VALUES
('seguridad', 'Inseguridad', '🚨', '#ef4444', 4, 'seguridad_publica', 1),
('accidente', 'Accidente', '🚗', '#dc2626', 4, 'seguridad_publica', 2),
('semaforo', 'Semáforo', '🚦', '#b91c1c', 4, 'seguridad_publica', 3),
('señalizacion', 'Señalización', '⚠️', '#f87171', 4, 'seguridad_publica', 4);

-- Salud
INSERT OR IGNORE INTO tipos_reporte (tipo, nombre, icono, color, categoria_id, dependencia, orden) VALUES
('plagas', 'Plagas', '🦟', '#84cc16', 5, 'salud', 1),
('animales', 'Animales Muertos', '🐕', '#65a30d', 5, 'salud', 2);

-- Medio Ambiente
INSERT OR IGNORE INTO tipos_reporte (tipo, nombre, icono, color, categoria_id, dependencia, orden) VALUES
('quema', 'Quema de Basura', '🔥', '#f97316', 6, 'medio_ambiente', 1),
('contaminacion', 'Contaminación', '☣️', '#ea580c', 6, 'medio_ambiente', 2),
('tala', 'Tala Ilegal', '🪓', '#c2410c', 6, 'medio_ambiente', 3);

-- Otros
INSERT OR IGNORE INTO tipos_reporte (tipo, nombre, icono, color, categoria_id, dependencia, orden) VALUES
('otro', 'Otro', '📦', '#6b7280', 7, 'servicios_publicos', 1);

-- ==========================
-- DATOS DE EJEMPLO: REPORTES
-- ==========================
INSERT OR IGNORE INTO reportes (id, tipo, descripcion, descripcion_corta, lat, lng, peso, dependencia) VALUES 
(1, 'baches', 'Bache en Av. Morelos frente al mercado', 'Bache en Av. Morelos', 18.7160, -98.7760, 4, 'obras_publicas'),
(2, 'alumbrado', 'Lámpara fundida en plaza principal', 'Lámpara fundida', 18.7155, -98.7765, 2, 'servicios_publicos'),
(3, 'seguridad', 'Falta señalización en cruce peligroso', 'Falta señalización', 18.7170, -98.7765, 4, 'seguridad_publica'),
(4, 'baches', 'Banqueta hundida en calle Hidalgo', 'Banqueta hundida', 18.7140, -98.7780, 3, 'obras_publicas'),
(5, 'limpieza', 'Basura acumulada en esquina céntrica', 'Basura acumulada', 18.7150, -98.7775, 3, 'servicios_publicos'),
(6, 'agua', 'Fuga de agua potable en calle principal', 'Fuga de agua', 18.7140, -98.7770, 4, 'agua_potable'),
(7, 'parques', 'Jardín municipal necesita mantenimiento', 'Jardín sin mantenimiento', 18.7155, -98.7755, 2, 'parques_jardines'),
(8, 'agua', 'Coladera sin tapa representa peligro', 'Coladera sin tapa', 18.7145, -98.7780, 3, 'agua_potable'),
(9, 'seguridad', 'Semáforo descompuesto en centro', 'Semáforo descompuesto', 18.7130, -98.7775, 3, 'seguridad_publica'),
(10, 'alumbrado', 'Poste inclinado por el viento', 'Poste inclinado', 18.7145, -98.7785, 4, 'servicios_publicos'),
(11, 'quema', 'Incendio forestal en el cerro de Jantetelco', 'Incendio forestal', 18.7200, -98.7800, 5, 'medio_ambiente');

-- ==========================
-- DATOS DE EJEMPLO: USUARIOS
-- ==========================
-- Todos con password: "admin123"
INSERT OR IGNORE INTO usuarios (id, email, nombre, password_hash, dependencia, rol, activo) VALUES 
(1, 'admin@jantetelco.gob.mx', 'Administrador del Sistema', '$2b$10$IC/ygKAFm7Nz5tSK0g15mulnmQ/LzQSX3ZJYqpbgpTPCrPFLJvMba', 'administracion', 'admin', 1),
(2, 'supervisor.obras@jantetelco.gob.mx', 'Supervisor Obras Públicas', '$2b$10$IC/ygKAFm7Nz5tSK0g15mulnmQ/LzQSX3ZJYqpbgpTPCrPFLJvMba', 'obras_publicas', 'supervisor', 1),
(3, 'func.obras1@jantetelco.gob.mx', 'Juan Pérez - Obras', '$2b$10$IC/ygKAFm7Nz5tSK0g15mulnmQ/LzQSX3ZJYqpbgpTPCrPFLJvMba', 'obras_publicas', 'funcionario', 1),
(4, 'supervisor.servicios@jantetelco.gob.mx', 'Supervisora Servicios Públicos', '$2b$10$IC/ygKAFm7Nz5tSK0g15mulnmQ/LzQSX3ZJYqpbgpTPCrPFLJvMba', 'servicios_publicos', 'supervisor', 1),
(5, 'func.servicios1@jantetelco.gob.mx', 'María López - Servicios', '$2b$10$IC/ygKAFm7Nz5tSK0g15mulnmQ/LzQSX3ZJYqpbgpTPCrPFLJvMba', 'servicios_publicos', 'funcionario', 1),
(6, 'func.seguridad1@jantetelco.gob.mx', 'Carlos Ramírez - Seguridad', '$2b$10$IC/ygKAFm7Nz5tSK0g15mulnmQ/LzQSX3ZJYqpbgpTPCrPFLJvMba', 'seguridad_publica', 'funcionario', 1),
(7, 'supervisor.parques@jantetelco.gob.mx', 'Parkeador', '$2b$10$IC/ygKAFm7Nz5tSK0g15mulnmQ/LzQSX3ZJYqpbgpTPCrPFLJvMba', 'parques_jardines', 'supervisor', 1),
(8, 'func.parques1@jantetelco.gob.mx', 'Func. Parques', '$2b$10$IC/ygKAFm7Nz5tSK0g15mulnmQ/LzQSX3ZJYqpbgpTPCrPFLJvMba', 'parques_jardines', 'funcionario', 1);

-- ==========================
-- DATOS DE EJEMPLO: ASIGNACIONES
-- ==========================
INSERT OR IGNORE INTO asignaciones (reporte_id, usuario_id, asignado_por, notas) VALUES 
(1, 3, 1, 'Reporte de bache asignado para revisión'),
(4, 3, 2, 'Banqueta requiere atención prioritaria'),
(2, 5, 1, 'Cambio de lámpara en plaza'),
(5, 5, 4, 'Limpieza de basura acumulada'),
(10, 5, 4, 'Revisar poste inclinado'),
(3, 6, 1, 'Instalación de señalización'),
(9, 6, 1, 'Reparación de semáforo'),
(7, 8, 7, 'Mantenimiento de jardín municipal'),
(11, 8, 1, 'Asignación interdepartamental: funcionario de parques atiende reporte de medio ambiente');
