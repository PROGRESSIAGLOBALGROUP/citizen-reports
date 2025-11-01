# Repo Bootstrap — TDD 100% IA Desatendida

Timestamp: 2025-09-27 15:10:08 GMT-6
UUID: 85e9924d-cbb1-4243-ae88-e8386a42991d

Este paquete contiene **documentación, prompts, plantillas, tests base, CI y scripts de guardado/edición segura**.
Preparado para que **GitHub Copilot Code Agent** en VS Code y **Claude Sonnet 4** generen y mantengan el desarrollo
**en automático**, con **TDD** y listo para **producción**.

## Pasos

1. Copia el contenido en la raíz del proyecto junto a `server/` y `client/`.
2. Abre VS Code y el archivo `ai/COPILOT/code_agent_directives.md`.
3. Ordena al Code Agent: *"Follow project directives"*.
4. Ejecuta:

```bash
npm run ai:bootstrap
npm run test:all
```

## Checklist de desarrollo

- Lee el [`README.md`](./README.md) para entender arquitectura, dependencias y flujos de despliegue.
- Ejecuta `npm run lint` y `npm run test:all` antes de enviar cualquier cambio.
- Actualiza `docs/changelog.md` con cada hito relevante.
- Tras clonar o actualizar dependencias, ejecuta `npm install` en la raíz para habilitar los hooks de Husky.

## Scripts clave

| Comando | Ubicación | Descripción |
|---------|-----------|-------------|
| `npm run ai:bootstrap` | raíz | Instala tooling común (ESLint, Jest, Vitest, Playwright, etc.). |
| `npm run test:unit` | raíz | Corre pruebas backend con Jest. |
| `npm run test:front` | raíz | Ejecuta pruebas de UI con Vitest. |
| `npm run test:all` | raíz | Ejecuta lint, unit, frontend y Playwright en secuencia (incluye build + init de `e2e.db`). |
| `npm run test:e2e` | raíz | Ejecuta Playwright; compila el cliente e inicializa SQLite automáticamente antes de lanzar el servidor. |
| `npm run test:e2e:ci` | raíz | Versión optimizada para CI (reporter line + artefactos). |
| `npm run smoke:tiles` | raíz | Valida mosaicos del proxy `/tiles`; acepta una plantilla opcional (`npm run smoke:tiles -- "https://tile.example.com/{z}/{x}/{y}.png"`). |
| `npm run maintenance` | raíz | Ejecuta respaldo + smoke; usa `node scripts/maintenance.js` (o `.ps1`) para métricas (`--metrics-file`/`--metrics-url`), etiquetas (`--metrics-labels`), retención (`--retain-backups`), compresión (`--compress-log`), empaquetado (`--archive`, `--archive-notes`), uploads fríos (`--upload`) y notificaciones (`--notify-webhook`, `--notify-token`). |
| `scripts/maintenance.ps1` | raíz | Wrapper para programar mantenimiento combinado; acepta `-SkipBackup`, `-SkipSmoke`, `-Template`, `-Coords`, `-Timeout`, `-Retries`, `-Delay`, `-Json`, `-LogFile`, `-CompressLog`, `-CompressLogPath`, `-MetricsFile`, `-MetricsUrl`, `-MetricsLabels`, `-RetainBackups`, `-BackupDir`, `-ArchivePath`, `-ArchiveNotes`, `-NotifyWebhook`, `-NotifyToken`, `-UploadUri`, `-FailFast`, `-DryRun`. |
| `npm run restore:validate` | raíz | Valida un archivo de respaldo (local, S3 o Azure Blob) descomprimiéndolo, corriendo `PRAGMA integrity_check` y opcionalmente disparando pruebas (`--run-tests`, `--test-script`). |
| `scripts/tile-smoke.ps1` | raíz | Wrapper para schedulers Windows; acepta `-Template`, `-Coords`, `-Timeout`, `-Retries`, `-Delay`, `-Json`, `-LogFile`. |
| `npm run dev` | `client/` | Levanta el SPA con Vite (hot module reload). |
| `npm run dev` | `server/` | Levanta Express en modo desarrollo. |
| `npm run seed` | `server/` | Inserta datos de ejemplo en la base SQLite (acepta `--reset` y `--from-file ./fixtures.json`). |
| `npm run backup:db` | raíz | Genera un respaldo con timestamp de la base SQLite (`DB_PATH`) en `./backups` o el directorio definido en `BACKUP_DIR`. Se puede automatizar con `scripts/backup-db.ps1` o un `cron` que ejecute el comando. |

### Variables de entorno operativas

- `MAINTENANCE_RESTORE_SOURCE`: URI (s3:// o azblob://) usada por `restore-validate` cuando no se provee `--source`.
- `MAINTENANCE_NOTIFY_WEBHOOK`: Endpoint HTTP que recibirá resumen JSON del job de mantenimiento.
- `MAINTENANCE_NOTIFY_TOKEN`: Token bearer opcional para el webhook.
- `MAINTENANCE_SERVICE`: Identificador de servicio que se añade al contexto de notificaciones.

## Documentación recomendada

- [Arquitectura](./docs/architecture.md): vista completa de componentes y flujos.
- [Security & Privacy](./docs/security_privacy.md): controles vigentes y hoja de ruta.
- [UX/UI](./docs/ux_ui_spec.md): lineamientos de experiencia y accesibilidad.
- [OpenAPI](./docs/api/openapi.yaml): especificación formal del backend.
- [Simulacros de restauración](./docs/operations/restore_drills.md): agenda y mejores prácticas para validar respaldos.
