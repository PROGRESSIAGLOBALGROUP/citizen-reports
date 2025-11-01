# Security & Privacy by Design

## Objetivos de protección

- **Confidencialidad:** Evitar la exposición de ubicaciones sensibles mediante agregación opcional por celdas y exportaciones controladas.
- **Integridad:** Validar y normalizar la entrada del usuario antes de almacenarla, preservando la calidad del dataset.
- **Disponibilidad:** Mantener el servicio ligero y sin dependencias externas críticas para facilitar la recuperación ante fallos.

## Controles implementados

- **Validación de coordenadas:** `server/server.js` rechaza latitudes/longitudes fuera de los rangos permitidos y asegura que el peso sea un entero ≥ 1.
- **Limpieza de entrada:** Express `json()` limita el tamaño del payload; los campos de texto se almacenan tal cual para análisis, pero deben sanitizarse al renderizarse en nuevos contextos.
- **Agregación por grid:** Endpoint `/api/reportes/grid` agrupa información sensible en celdas de tamaño configurable (valor mínimo 0.001°) para reportes públicos.
- **Hardening HTTP:** Helmet, CORS y compression están activados por defecto, reduciendo superficies de ataque comunes.
- **Logs prudentes:** Morgan registra metadatos de la solicitud sin incluir cuerpos; asegúrate de no incorporar PII en mensajes adicionales.

## Riesgos y mitigaciones

- **Inyección SQL:** Uso de parámetros preparados en SQLite minimiza la inyección; mantener esta práctica en futuras consultas.
- **Spam/DDoS:** Actualmente sin mitigación activa. Añadir `express-rate-limit` y un firewall/LB en producción.
- **Exposición de coordenadas exactas:** Promover el modo de grid para dashboards abiertos y documentar políticas de anonimización.
- **Exfiltración de base de datos:** Definir backups cifrados y ubicar `data.db` fuera de directorios públicos. Configurar permisos de sistema de archivos adecuados.

## Hoja de ruta de seguridad

1. Integrar rate limiting y bloqueo por dirección IP.
2. Añadir autenticación (JWT o API keys firmadas) para los endpoints de escritura y exportación.
3. Implementar auditoría de cambios (tabla `reportes_audit` o triggers de SQLite).
4. Automatizar análisis SAST/DAST en CI/CD.

## Privacidad operativa

- **Clasificación de datos:** Los reportes pueden contener ubicaciones personales; trátalos como datos sensibles de nivel medio.
- **Retención:** Definir un período máximo de retención y políticas de borrado bajo solicitud ciudadana.
- **Consentimiento:** Incluir términos visibles en la UI; registrar consentimiento si se amplían los campos recolectados.
- **Derechos ARCO:** Preparar endpoints o procesos manuales para rectificar/eliminar reportes si lo exige la normativa local.
