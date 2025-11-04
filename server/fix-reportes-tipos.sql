-- 🔥 FIX CRÍTICO: Normalizar tipos en tabla reportes
-- Problema: Algunos reportes tienen tipo='baches' (plural), otros tipo='bache' (singular)
-- Esto causa que filtros no funcionen porque types_reporte ahora tiene 'bache'

-- Normalizar todos los tipos singulares/estándar
UPDATE reportes SET tipo = 'bache' WHERE tipo IN ('baches', 'pavimento', 'banqueta');
UPDATE reportes SET tipo = 'agua' WHERE tipo IN ('agua_potable', 'falta_agua', 'fuga', 'fuga_agua', 'drenaje');
UPDATE reportes SET tipo = 'aseo' WHERE tipo IN ('limpieza', 'parques');
UPDATE reportes SET tipo = 'basura' WHERE tipo IN ('basura_acumulada', 'residuos');
UPDATE reportes SET tipo = 'seguridad' WHERE tipo IN ('inseguridad', 'delincuencia', 'violencia', 'accidente', 'semaforo');
UPDATE reportes SET tipo = 'transporte' WHERE tipo IN ('vial', 'señalizacion', 'semaforo_roto');
UPDATE reportes SET tipo = 'alumbrado' WHERE tipo IN ('iluminacion', 'lampara', 'poste', 'luz');
UPDATE reportes SET tipo = 'quema' WHERE tipo IN ('incendio', 'quema_basura');

-- Verificar resultado
SELECT tipo, COUNT(*) as count FROM reportes GROUP BY tipo ORDER BY tipo;
