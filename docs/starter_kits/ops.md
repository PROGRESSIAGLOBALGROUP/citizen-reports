# Starter Kit — Operaciones

## Objetivos

- Desplegar y monitorear Jantetelco Heatmap en entornos productivos o staging.
- Asegurar backups de la base SQLite y recuperación rápida.
- Coordinar con desarrollo/QA para ventanas de mantenimiento.

## Preparación

1. **Infraestructura base**
   - Servidor Node.js 20.x (Linux recomendado)
   - Reverse proxy (Nginx/Traefik) con TLS
   - Ruta de almacenamiento persistente para `data.db` y logs

2. **Variables de entorno críticas**

   | Variable | Descripción | Default |
   |----------|-------------|---------|
   | `PORT` | Puerto HTTP para Express | `4000` |
   | `DB_PATH` | Ruta absoluta/relativa del SQLite productivo | `./data.db` |

3. **Dependencias de sistema**
   - `pm2`, `forever` o `systemd` para supervisar el proceso Node.
   - `sqlite3` CLI opcional para inspecciones rápidas.

## Flujo de despliegue

1. Obtener artefactos:
   - `client/dist` (resultado de `npm run build` en `client/`).
   - `server/` completo (incluyendo `schema.sql`).
2. Instalar dependencias en el host:

   ```bash
   npm install --production
   npm install --prefix server --production
   npm ci --prefix client --omit=dev
   ```

3. Inicializar base de datos (una sola vez por entorno):

   ```bash
   npm run init --prefix server
   ```

4. Levantar servicio con pm2:

   ```bash
   pm2 start server/server.js --name jantetelco --update-env
   pm2 save
   ```

5. Configurar reverse proxy apuntando a `http://127.0.0.1:4000` con HTTPS público.

## Monitoreo y mantenimiento

- **Logs**: revisar `pm2 logs jantetelco` y `/var/log/nginx/access.log`.
- **Backups**: copiar `data.db` antes de cambios mayores. Automatizar snapshots diarios.
- **Salud**: exponer `/api/reportes/tipos` como endpoint de health check.
- **Escalamiento**: si se requiere alta concurrencia, planificar migración a Postgres + despliegue multi instancia.

## Plan de contingencia

1. Restaurar último backup de `data.db`.
2. Reinstalar dependencias (`npm ci`) y reiniciar servicio con `pm2 restart jantetelco`.
3. Notificar a stakeholders mediante el canal definido.
4. Registrar incidente en el runbook y actualizar `docs/changelog.md` si hay acciones permanentes.

## Seguridad operativa

- Mantener TLS actualizado y usar headers seguros (CSP, HSTS) en el proxy.
- Limitar acceso SSH mediante claves y MFA.
- Configurar firewall para permitir solo tráfico 80/443 externamente.
- Rotar respaldos a almacenamiento cifrado.
