# Playbook de Alertamiento para Mantenimiento

## Objetivos y Alcance

El objetivo del playbook es detectar con rapidez condiciones anómalas en la orquestación de mantenimiento (tareas `backup-db` y `tile-smoke`) y ofrecer pasos accionables para restaurar el servicio. Se aplica a despliegues que consumen las métricas emitidas por `scripts/maintenance.js` mediante archivo de texto o Pushgateway.

## Fuente de Métricas

Las métricas se emiten en formato Prometheus con las siguientes series:

- `citizen-reports_maintenance_status{env="<entorno>",region="<region>"}`
  - Valores: `0` (OK), `1` (DEGRADED), `2` (FAILED).
- `citizen-reports_maintenance_counts_totals{status="ok|degraded|failed"}`
  - Cantidad de pasos por estatus.
- `citizen-reports_maintenance_step_duration_milliseconds{step="backup-db|tile-smoke",status="ok|degraded|failed"}`
  - Duración de cada paso.

### Etiquetas comunes

Todas las series comparten etiquetas configurables vía `MAINTENANCE_METRICS_LABELS`, así como etiquetas derivadas de `MAINTENANCE_ENV` y `MAINTENANCE_REGION`. Agrega etiquetas adicionales (`service`, `job`, `cluster`) según convenga para segmentar alertas.

## Reglas de Alerta Sugeridas

> Nota: Ajusta las ventanas y `for` según la cadencia de ejecución del job (por ejemplo, cada hora).

```yaml
# Archivo: prometheus/alerts/maintenance-rules.yaml
groups:
  - name: maintenance.playbook
    rules:
      - alert: MaintenanceFailed
        expr: citizen-reports_maintenance_status{service="maintenance"} == 2
        for: 5m
        labels:
          severity: critical
          team: sre
        annotations:
          summary: "Job de mantenimiento falló"
          description: |
            El job terminó en estado FAILED.
            Último valor: {{ $value }}
            Entorno: {{ $labels.env }} · Región: {{ $labels.region }}
            Revisa el archivo de log comprimido y el tar de archivo frío.

      - alert: MaintenanceDegraded
        expr: citizen-reports_maintenance_status{service="maintenance"} == 1
        for: 15m
        labels:
          severity: warning
          team: sre
        annotations:
          summary: "Job de mantenimiento degradado"
          description: |
            Alguno de los pasos terminó en estado DEGRADED (generalmente el smoke test).
            Revisa métricas de `tile-smoke` y tráfico de mosaicos.

      - alert: MaintenanceDurationAnomaly
        expr: increase(citizen-reports_maintenance_step_duration_milliseconds{step="backup-db"}[1h]) > 3 * increase(avg_over_time(citizen-reports_maintenance_step_duration_milliseconds{step="backup-db"}[6h])[1h])
        for: 10m
        labels:
          severity: info
        annotations:
          summary: "Duración anómala en respaldo"
          description: |
            El paso backup-db tardó significativamente más de lo usual.
            Valida uso de disco y contención en la base de datos.
```

## Procedimientos ante Alertas

### 1. `MaintenanceFailed`

1. Recupera los artefactos generados:

    - Último respaldo en `BACKUP_DIR`.
    - Log comprimido (`--compress-log`).
    - Tar.gz de archivo frío (`--archive`).
    - Copia remota en S3/Azure si `--upload` o `MAINTENANCE_ARCHIVE_UPLOAD` están configurados.

1. Ejecuta una validación de restauración fuera de línea para confirmar integridad del respaldo:

  ```powershell
  npm run restore:validate -- --archive ./archives/ultimo.tgz
  ```

1. Confirma que el canal de notificaciones (Slack/Teams/email) haya recibido el POST de `--notify-webhook`. Si no hay alerta, revisa credenciales (`MAINTENANCE_NOTIFY_WEBHOOK`, `MAINTENANCE_NOTIFY_TOKEN`).

1. Revisa el log para determinar qué paso falló.

1. Si el fallo es en `backup-db`, ejecuta manualmente:

    ```powershell
    npm run backup:db
    ```

1. Si el fallo es en `tile-smoke`, ejecuta el smoke test con `--json` para inspeccionar detalles:

    ```powershell
    npm run smoke:tiles -- --json
    ```

1. Corrige la causa raíz (por ejemplo, revisar conectividad al servidor de mosaicos) y vuelve a lanzar el job:

    ```powershell
    npm run maintenance
    ```

1. Documenta la incidencia en el registro operativo.

### 2. `MaintenanceDegraded`

1. Identifica si el paso degradado es `tile-smoke` (lo más habitual).
1. Usa las coordenadas implicadas en el log JSON (`--log`) para reproducir la consulta.
1. Considera subir el nivel de severidad si persiste por más de 3 ejecuciones consecutivas.
1. Si el problema es transitorio (p.ej. CDN), programa un reintento manual y monitoriza durante 24 horas.

### 3. `MaintenanceDurationAnomaly`

1. Verifica si hay procesos concomitantes (vacuum, análisis) o contención en disco.
1. Chequea espacio libre y latencia de I/O en el servidor.
1. Evalúa ejecutar un `VACUUM` o migrar el respaldo a horario de menor carga.
1. Ajusta el umbral de alerta si la variación se vuelve sostenida y justificada.

## Escalamiento

- **Nivel 1 (On-call SRE):** Triaje inicial, ejecución de pasos del runbook, comunicación con stakeholders.
- **Nivel 2 (Ingeniería de Datos):** Intervención sobre esquema o procedimientos de respaldo.
- **Nivel 3 (Plataforma):** Problemas de infraestructura prolongados (almacenamiento, red, CDN).

Escala al siguiente nivel si la alerta permanece activa por más de 2 ciclos de mantenimiento o si el impacto afecta a usuarios finales.

## Validación Continua

- Programa simulacros trimestrales disparando alertas de prueba mediante `amtool` o reetiquetando métricas manualmente.
- Revisa trimestralmente que las rutas (`MAINTENANCE_*`) y etiquetas siguen vigentes tras cambios de infraestructura.
- Mantén este playbook bajo control de cambios; actualiza cuando se añadan nuevos pasos o métricas.
