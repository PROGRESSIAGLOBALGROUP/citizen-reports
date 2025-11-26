PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS reportes (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo              TEXT NOT NULL,
  descripcion       TEXT,
  descripcion_corta TEXT,
  lat               REAL NOT NULL,
  lng               REAL NOT NULL,
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

-- Tabla de usuarios (funcionarios)
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
  asignado_por INTEGER,
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

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_dependencia ON usuarios(dependencia);
CREATE INDEX IF NOT EXISTS idx_sesiones_token ON sesiones(token);
CREATE INDEX IF NOT EXISTS idx_sesiones_expira ON sesiones(expira_en);
CREATE INDEX IF NOT EXISTS idx_asignaciones_reporte ON asignaciones(reporte_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_usuario ON asignaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_cierres_reporte ON cierres_pendientes(reporte_id);
CREATE INDEX IF NOT EXISTS idx_cierres_aprobado ON cierres_pendientes(aprobado);

-- Datos de ejemplo para citizen-reports, Morelos (coordenadas correctas)
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
(10, 'alumbrado', 'Poste inclinado por el viento', 'Poste inclinado', 18.7145, -98.7785, 4, 'servicios_publicos');

-- Usuarios de prueba (password: "admin123" para todos)
-- Hash bcrypt válido generado con: bcrypt.hash('admin123', 10)
INSERT OR IGNORE INTO usuarios (id, email, nombre, password_hash, dependencia, rol, activo) VALUES 
(1, 'admin@jantetelco.gob.mx', 'Administrador del Sistema', '$2b$10$IC/ygKAFm7Nz5tSK0g15mulnmQ/LzQSX3ZJYqpbgpTPCrPFLJvMba', 'administracion', 'admin', 1),
(2, 'supervisor.obras@jantetelco.gob.mx', 'Supervisor Obras Públicas', '$2b$10$IC/ygKAFm7Nz5tSK0g15mulnmQ/LzQSX3ZJYqpbgpTPCrPFLJvMba', 'obras_publicas', 'supervisor', 1),
(3, 'func.obras1@jantetelco.gob.mx', 'Juan Pérez - Obras', '$2b$10$IC/ygKAFm7Nz5tSK0g15mulnmQ/LzQSX3ZJYqpbgpTPCrPFLJvMba', 'obras_publicas', 'funcionario', 1),
(4, 'supervisor.servicios@jantetelco.gob.mx', 'Supervisora Servicios Públicos', '$2b$10$IC/ygKAFm7Nz5tSK0g15mulnmQ/LzQSX3ZJYqpbgpTPCrPFLJvMba', 'servicios_publicos', 'supervisor', 1),
(5, 'func.servicios1@jantetelco.gob.mx', 'María López - Servicios', '$2b$10$IC/ygKAFm7Nz5tSK0g15mulnmQ/LzQSX3ZJYqpbgpTPCrPFLJvMba', 'servicios_publicos', 'funcionario', 1),
(6, 'func.seguridad1@jantetelco.gob.mx', 'Carlos Ramírez - Seguridad', '$2b$10$IC/ygKAFm7Nz5tSK0g15mulnmQ/LzQSX3ZJYqpbgpTPCrPFLJvMba', 'seguridad_publica', 'funcionario', 1),
(7, 'supervisor.parques@jantetelco.gob.mx', 'Parkeador', '$2b$10$IC/ygKAFm7Nz5tSK0g15mulnmQ/LzQSX3ZJYqpbgpTPCrPFLJvMba', 'parques_jardines', 'supervisor', 1),
(8, 'func.parques1@jantetelco.gob.mx', 'Func. Parques', '$2b$10$IC/ygKAFm7Nz5tSK0g15mulnmQ/LzQSX3ZJYqpbgpTPCrPFLJvMba', 'parques_jardines', 'funcionario', 1);