-- Eliminar tipos que ya no existen en reportes
DELETE FROM tipos_reporte WHERE tipo NOT IN (SELECT DISTINCT tipo FROM reportes)
  AND tipo NOT IN ('bache', 'agua', 'alumbrado', 'aseo', 'basura', 'seguridad', 'transporte', 'quema');

SELECT COUNT(*) as total_after FROM tipos_reporte WHERE activo = 1;
SELECT tipo FROM tipos_reporte WHERE activo = 1 ORDER BY tipo;
