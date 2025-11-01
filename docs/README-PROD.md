# MVP Heatmap — Producción (Build + Servido por Node/Express)

Timestamp: 2025-09-27 14:41:12 GMT-6
UUID: 90697a2a-519d-4463-b42d-43b2f873a466

## Pasos rápidos

1. Backend:

```bash
cd server
npm i
npm run init
```

1. Frontend (build):

```bash
cd ../client
npm i
npm run build
```

1. Servir todo desde server:

```bash
cd ../server
npm start   # http://localhost:4000
```

Variables opcionales: `PORT`, `DB_PATH`.

## Checklist previo a despliegue

- Ejecutar `npm run test:all` desde la raíz (lint + unit + front + e2e).
- Confirmar que `client/dist` está actualizado con la compilación más reciente.
- Verificar que `data.db` y la carpeta de logs cuentan con backups.
- Definir `.env` de producción (`PORT`, `DB_PATH`, variables adicionales de seguridad).

## Observabilidad y mantenimiento

- Monitorear logs HTTP (Morgan) y errores del proceso Node (`pm2`, `forever` o `systemd`).
- Configurar health check HTTP (`/api/reportes/tipos`) para el balanceador de carga.
- Programar respaldo periódico de `data.db` y rotación de archivos.

## Endurecimiento recomendado

- Habilitar HTTPS en el reverse proxy (Nginx/Cloudflare) con TLS moderno.
- Activar rate limiting (`express-rate-limit`) y cabeceras adicionales (Content-Security-Policy, Referrer-Policy).
- Si se expone públicamente, proteger `POST /api/reportes` con autenticación o validaciones anti-bot.
