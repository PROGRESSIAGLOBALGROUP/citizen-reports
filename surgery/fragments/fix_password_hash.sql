-- Usuarios de prueba (password: "admin123" para todos)
-- Hash bcrypt válido generado con: bcrypt.hash('admin123', 10)
INSERT OR IGNORE INTO usuarios (id, email, nombre, password_hash, dependencia, rol, activo) VALUES 
(1, 'admin@jantetelco.gob.mx', 'Administrador del Sistema', '$2b$10$IC/ygKAFm7Nz5tSK0g15mulnmQ/LzQSX3ZJYqpbgpTPCrPFLJvMba', 'administracion', 'admin', 1),
(2, 'supervisor.obras@jantetelco.gob.mx', 'Supervisor Obras Públicas', '$2b$10$IC/ygKAFm7Nz5tSK0g15mulnmQ/LzQSX3ZJYqpbgpTPCrPFLJvMba', 'obras_publicas', 'supervisor', 1),
(3, 'func.obras1@jantetelco.gob.mx', 'Juan Pérez - Obras', '$2b$10$IC/ygKAFm7Nz5tSK0g15mulnmQ/LzQSX3ZJYqpbgpTPCrPFLJvMba', 'obras_publicas', 'funcionario', 1),
(4, 'supervisor.servicios@jantetelco.gob.mx', 'Supervisora Servicios Públicos', '$2b$10$IC/ygKAFm7Nz5tSK0g15mulnmQ/LzQSX3ZJYqpbgpTPCrPFLJvMba', 'servicios_publicos', 'supervisor', 1),
(5, 'func.servicios1@jantetelco.gob.mx', 'María López - Servicios', '$2b$10$IC/ygKAFm7Nz5tSK0g15mulnmQ/LzQSX3ZJYqpbgpTPCrPFLJvMba', 'servicios_publicos', 'funcionario', 1);
