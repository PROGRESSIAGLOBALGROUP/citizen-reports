# Guía de Simulacros de Restauración

## Objetivo

Validar periódicamente la capacidad de restaurar la plataforma utilizando los respaldos generados por el orquestador de mantenimiento. El simulacro debe detectar con anticipación fallas de integridad, archivos corruptos, configuraciones caducas o dependencias faltantes.

## Frecuencia sugerida

- **Mensual** en entornos críticos (producción).
- **Trimestral** en entornos de respaldo o staging.
- Ejecución extraordinaria después de cambios mayores en infraestructura, versión de SQLite o pipeline de backups.

## Flujo recomendado

1. **Selecciona la fuente de respaldo**
   - URI remota (`s3://` o `azblob://`) almacenada en `MAINTENANCE_RESTORE_SOURCE`.
   - Archivo local `tar.gz` generado por `--archive`.
   - Último archivo `.db` en `BACKUP_DIR` si no existe archivo empaquetado.

2. **Ejecuta la validación automatizada**

   ```powershell
   npm run restore:validate -- --source s3://ops-backups/ultimo.tgz --run-tests
   ```

   Argumentos útiles:
   - `--skip-sqlite`: omite `PRAGMA integrity_check` si no hay binario `sqlite3` disponible.
   - `--test-script test:e2e`: dispara un script distinto tras la validación (por defecto `test:unit`).
   - `--backup-dir <ruta>`: apunta a un directorio alternativo si el respaldo no está en `./backups`.

3. **Revisa los resultados**
   - `integrity_check` debe devolver `ok`.
   - Las pruebas deben terminar con `exit 0`.
   - El log del job debe indicar ruta del archivo validado y cualquier advertencia.

4. **Documenta el simulacro**
   - Fecha de ejecución, responsable y duración.
   - Resultado (OK/Fail) y observaciones.
   - Acciones correctivas si hubo hallazgos (por ejemplo, renovar credenciales S3, ajustar retención).

## Automatización

- Agenda el script desde el mismo scheduler del mantenimiento (`Task Scheduler`, `cron`, `Azure Automation`) usando el comando anterior.
- Configura notificaciones en Prometheus/Alertmanager para alarmar si la ejecución devuelve exit code distinto de 0.
- Guarda los reportes en un bucket dedicado (`s3://ops-reports/restore-drills/`) para trazabilidad.
- Si usas `--notify-webhook`, verifica que el canal integre el resumen generado por el simulacro.

## Buenas prácticas adicionales

- Mantén actualizado el binario `sqlite3` en los servidores donde se ejecuta el simulacro.
- Replica el procedimiento en un entorno aislado antes de aplicarlo a producción para validar tiempos y permisos.
- Ensaya la descarga desde ambos proveedores (S3 y Azure Blob) cuando existan configuraciones multicloud.
- Ajusta `MAINTENANCE_S3_STORAGE_CLASS`/`MAINTENANCE_S3_SSE` y `MAINTENANCE_AZURE_BLOB_CONNECTION` según las políticas de la organización.
