# Disaster Recovery Playbook

Este procedimiento describe cómo restaurar la plataforma citizen-reports Heatmap a partir de un respaldo de SQLite.

## 1. Preparación previa

1. **Identifica el respaldo** que deseas restaurar. Los generados con `npm run backup:db` viven en `backups/` y siguen el patrón `data-YYYY-MM-DDTHH-MM-SS.db`.
2. **Comunica la ventana de mantenimiento** y coloca la aplicación en modo de sólo lectura o detén el servicio Node (`server/server.js`).
3. **Respaldo adicional opcional:** ejecuta `npm run backup:db` inmediatamente antes de comenzar para conservar el estado actual.

## 2. Restaurar la base de datos

1. Ubica el archivo SQLite en producción (`DB_PATH`, por defecto `server/data.db`).
2. Renómbralo o muévelo a un directorio seguro (por ejemplo `data.db.bak`).
3. Copia el respaldo elegido para que ocupe la ruta esperada por `DB_PATH`.
4. Asegúrate de que el archivo tenga permisos de lectura/escritura para el usuario que ejecuta Node.

## 3. Validación técnica

1. **Inspección rápida con `sqlite3`:**

   ```bash
   sqlite3 server/data.db "SELECT COUNT(*) FROM reportes;"
   ```

   Verifica que el conteo sea consistente con lo esperado.
2. **Pruebas automáticas:**

   ```powershell
   npm run test:unit
   npm run test:front
   ```

   Opcionalmente ejecuta `npm run test:e2e` si el entorno admite Playwright.
3. **Validación de respaldo:**

   ```powershell
   npm run restore:validate -- --archive ./archives/restore-latest.tgz --run-tests
   ```

   El helper admite fuentes locales (`--archive`), remotas (`--source s3://...` o `azblob://...`) o la última copia en `BACKUP_DIR`, ejecuta `PRAGMA integrity_check` y puede disparar pruebas adicionales con `--test-script`.
   Define `MAINTENANCE_RESTORE_SOURCE` si quieres reutilizar una URI remota sin pasar `--source` en cada ejecución.
   Para notificaciones automáticas, configura `--notify-webhook` o las variables `MAINTENANCE_NOTIFY_WEBHOOK`/`MAINTENANCE_NOTIFY_TOKEN`.
4. **Mantenimiento combinado:**

   ```powershell
   npm run maintenance -- --log ./logs/maintenance.log --json --metrics-file ./metrics/maintenance.prom --metrics-url http://pushgateway:9091/metrics/job/heatmap --retain-backups 7 --archive ./archives/restore-$(Get-Date -Format yyyyMMdd-HHmmss).tgz --upload s3://ops-backups/restore-$(Get-Date -Format yyyyMMdd-HHmmss).tgz
   # o en Windows Task Scheduler:
   powershell.exe -ExecutionPolicy Bypass -File scripts/maintenance.ps1 -Json -LogFile C:\Logs\maintenance.log -MetricsFile "C:\Metrics\maintenance.prom" -MetricsUrl "http://pushgateway:9091/metrics/job/heatmap" -RetainBackups 7 -ArchivePath "C:\Archives\restore-$(Get-Date -Format yyyyMMdd-HHmmss).tgz" -UploadUri "s3://ops-backups/restore-$(Get-Date -Format yyyyMMdd-HHmmss).tgz"
   ```

   El comando encadena el respaldo y el smoke-check, emite métricas (Prometheus Pushgateway), conserva solo los últimos respaldos, empaca artefactos críticos (`backups/`, logs comprimidos) en un tarball y lo sube automáticamente a almacenamiento frío remoto (S3 o Azure Blob).
   - Para S3, define `MAINTENANCE_ARCHIVE_UPLOAD=s3://bucket/prefix/archivo.tgz` y opcionalmente `MAINTENANCE_S3_REGION`, `MAINTENANCE_S3_STORAGE_CLASS`, `MAINTENANCE_S3_SSE` y `MAINTENANCE_S3_SSE_KMS_KEY_ID`.
   - Para Azure Blob, utiliza `MAINTENANCE_ARCHIVE_UPLOAD=azblob://contenedor/ruta/archivo.tgz` junto con `MAINTENANCE_AZURE_BLOB_CONNECTION` (o `AZURE_STORAGE_CONNECTION_STRING`) y, si deseas crear el contenedor automáticamente, `MAINTENANCE_AZURE_BLOB_ENSURE_CONTAINER=true`.
5. **Smoke de mosaicos:**

   ```powershell
   npm run smoke:tiles -- "http://localhost:4000/tiles/{z}/{x}/{y}.png"
   ```

   Ajusta la plantilla si usas un balanceador o dominio distinto y revisa que no aparezca la etiqueta `[fallback]`.
6. **Smoke manual:** inicia el servidor (`node server/server.js`) y abre `/` para confirmar que los datos aparecen en el mapa.

## 4. Reanudar operaciones

1. Reinicia el backend con la base restaurada (`npm run start --prefix server` o el proceso que uses en producción).
2. Habilita nuevamente el acceso de usuarios.
3. Monitorea los logs (`server/logs` o stdout) durante los primeros minutos.

## 5. Post-mortem y lecciones

- Documenta la causa del incidente y las acciones tomadas en `docs/changelog.md` o en la herramienta de seguimiento correspondiente.
- Ajusta la frecuencia de respaldos o automatizaciones si fue necesario.
- Repite un simulacro al menos una vez por trimestre para asegurar que el proceso se mantenga vigente.
