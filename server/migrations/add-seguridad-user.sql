-- Agregar usuario de prueba para dependencia seguridad_publica
-- Password: "admin123" (mismo hash bcrypt que otros usuarios de prueba)

INSERT OR IGNORE INTO usuarios (id, email, nombre, password_hash, dependencia, rol, activo) VALUES 
(6, 'func.seguridad1@jantetelco.gob.mx', 'Carlos Ramírez - Seguridad', '$2b$10$IC/ygKAFm7Nz5tSK0g15mulnmQ/LzQSX3ZJYqpbgpTPCrPFLJvMba', 'seguridad_publica', 'funcionario', 1);
