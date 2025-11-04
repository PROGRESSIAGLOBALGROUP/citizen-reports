-- Insertar tipos faltantes que existen en reportes
INSERT OR IGNORE INTO tipos_reporte (tipo, nombre, icono, color, categoria_id, dependencia, descripcion, orden)
VALUES 
  ('aseo', 'Aseo', '🧹', '#059669', 2, 'servicios_publicos', 'Limpieza y aseo público', 7),
  ('transporte', 'Transporte', '🚗', '#f59e0b', 4, 'transito', 'Problemas de transporte y movilidad', 8);

-- Verificar inserción
SELECT 'Tipos añadidos:' as status;
SELECT tipo, nombre FROM tipos_reporte WHERE tipo IN ('aseo', 'transporte');
