-- Insertar reportes de prueba
INSERT OR IGNORE INTO reportes (id, tipo, descripcion, descripcion_corta, lat, lng, peso, dependencia, prioridad) VALUES 
(1, 'baches', 'Bache en Av. Morelos frente al mercado', 'Bache en Av. Morelos', 18.7160, -98.7760, 4, 'obras_publicas', 'alta'),
(2, 'alumbrado', 'Lámpara fundida en plaza principal', 'Lámpara fundida', 18.7155, -98.7765, 2, 'servicios_publicos', 'media'),
(3, 'seguridad', 'Falta señalización en cruce peligroso', 'Falta señalización', 18.7170, -98.7765, 4, 'seguridad_publica', 'alta'),
(4, 'baches', 'Banqueta hundida en calle Hidalgo', 'Banqueta hundida', 18.7140, -98.7780, 3, 'obras_publicas', 'media'),
(5, 'limpieza', 'Basura acumulada en esquina céntrica', 'Basura acumulada', 18.7150, -98.7775, 3, 'servicios_publicos', 'media'),
(6, 'agua', 'Fuga de agua potable en calle principal', 'Fuga de agua', 18.7140, -98.7770, 4, 'agua_potable', 'alta'),
(7, 'parques', 'Jardín municipal necesita mantenimiento', 'Jardín sin mantenimiento', 18.7155, -98.7755, 2, 'parques_jardines', 'baja'),
(8, 'agua', 'Coladera sin tapa representa peligro', 'Coladera sin tapa', 18.7145, -98.7780, 3, 'agua_potable', 'media'),
(9, 'seguridad', 'Semáforo descompuesto en centro', 'Semáforo descompuesto', 18.7130, -98.7775, 3, 'seguridad_publica', 'media'),
(10, 'alumbrado', 'Poste inclinado por el viento', 'Poste inclinado', 18.7145, -98.7785, 4, 'servicios_publicos', 'alta'),
(11, 'quema', 'Incendio forestal en el cerro de citizen-reports', 'Incendio forestal', 18.7200, -98.7800, 5, 'medio_ambiente', 'alta');

-- Insertar asignaciones
INSERT OR IGNORE INTO asignaciones (reporte_id, usuario_id, asignado_por, notas) VALUES 
(1, 3, 1, 'Reporte de bache asignado para revisión'),
(4, 3, 2, 'Banqueta requiere atención prioritaria');
