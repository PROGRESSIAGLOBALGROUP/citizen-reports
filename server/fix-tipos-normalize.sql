-- 🔥 FIX: Normalizar tipos_reporte para que coincidan con reportes reales
-- El problema: tipos_reporte tiene 'baches' pero reportes tienen 'bache'
-- Solución: Actualizar tipo único 'baches' → 'bache'

UPDATE tipos_reporte SET tipo = 'bache' WHERE tipo = 'baches';

-- Verificar actualización
SELECT 'Después de FIX:' as status;
SELECT tipo, nombre FROM tipos_reporte WHERE tipo IN ('bache', 'agua', 'alumbrado', 'basura', 'aseo', 'seguridad') ORDER BY tipo;
