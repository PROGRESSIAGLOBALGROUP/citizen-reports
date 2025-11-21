# Docker Volume Configuration Fix - 21 Nov 2025

**Fecha:** 2025-11-21  
**Severidad:** CRÍTICO  
**Estado:** ✅ RESUELTO  
**Duración total:** ~3 horas

---

## 📋 Resumen Ejecutivo

Durante el deployment de Docker Swarm a producción, se identificaron y corrigieron **tres problemas críticos** relacionados con volúmenes persistentes y configuración de rutas:

1. **Problema webhook-routes.js:** Archivo problemático en volumen causando EACCES permission errors
2. **Problema dist/ faltante:** Frontend no servido porque directorio compilado no estaba en volumen
3. **Problema rutas incorrectas:** app.js buscando frontend en `/app/client/dist/` en lugar de `/app/server/dist/`

**Impacto:** Servicio caído por 100% durante ~2 horas hasta resolución completa.

**Resultado final:** ✅ Servicio funcionando, frontend sirviendo correctamente desde <http://reportes.progressiagroup.com/>

---

## 🔍 Problema 1: webhook-routes.js Permission Error

### Síntoma

Contenedor fallaba 1 segundo después de iniciar con error:

```text
Error: EACCES: permission denied, mkdir '/home/jantetelco/jantetelco/logs'
    at Object.mkdirSync (node:fs:1372:26)
    at file:///app/server/webhook-routes.js:17:6
```

### Diagnóstico

1. **Imagen Docker correcta:** Verificado con `docker run --rm citizen-reports:latest ls /app/server/` - NO contenía webhook-routes.js
2. **Contenedor fallido tiene el archivo:** Logs mostraban que sí intentaba cargarlo
3. **Descubrimiento del volumen:** El servicio tenía volumen montado en `/app/server/` que sobreescribía todo el directorio

```bash
docker service inspect citizen-reports_citizen-reports --format "{{json .Spec.TaskTemplate.ContainerSpec.Mounts}}"
# Output: Source: citizen-reports_db_data, Target: /app/server
```

### Causa Raíz

El **volumen persistente** `citizen-reports_db_data` estaba montado en `/app/server/`, sobreescribiendo completamente el contenido de la imagen Docker. Este volumen contenía:

- ✅ Base de datos `data.db` (deseado)
- ✅ Backups antiguos (deseado)
- ❌ Código fuente viejo incluyendo `webhook-routes.js` (NO deseado)

El archivo `webhook-routes.js` (creado Nov 7) intentaba crear directorios en rutas hardcodeadas (`/home/jantetelco/jantetelco/logs`) sin permisos.

### Solución Implementada

**Paso 1: Eliminar archivo problemático del volumen**

```bash
ssh root@145.79.0.77 'rm -f /var/lib/docker/volumes/citizen-reports_db_data/_data/webhook-routes.js'
```

**Paso 2: Comentar import en app.js del volumen**

```bash
# Línea 19: import webhookRoutes from './webhook-routes.js';
# Línea 432: app.use('/api', webhookRoutes);

sed -i "19s/^/\/\/ /" /var/lib/docker/volumes/citizen-reports_db_data/_data/app.js
sed -i "432s/^/  \/\/ /" /var/lib/docker/volumes/citizen-reports_db_data/_data/app.js
```

**Resultado:**
- ✅ Contenedor inició sin errores EACCES
- ✅ Logs mostraron: "✅ Servidor production en http://0.0.0.0:4000"
- ✅ API respondió correctamente: `GET /api/reportes?limit=1 HTTP/1.1" 200`

---

## 🔍 Problema 2: Frontend No Servido (dist/ Faltante)

### Síntoma

Navegador mostraba solo JSON en lugar de HTML:

```json
{"message":"Jantetelco API activo","status":"ok"}
```

- **Content-Type:** `application/json` (esperado: `text/html`)
- **Content-Length:** 49 bytes (esperado: ~1.4KB del index.html)

### Diagnóstico

**Paso 1: Verificar dentro del contenedor**

```bash
docker exec $(docker ps -q -f name=citizen-reports) ls -la /app/server/dist/
# Output: No such file or directory
```

**Paso 2: Verificar en imagen Docker**

```bash
docker run --rm --entrypoint ls citizen-reports:latest /app/server/dist/
# Output: No such file or directory
```

**Conclusión:** El directorio `/app/server/dist/` (con frontend compilado) no existía ni en imagen ni en volumen.

### Causa Raíz

El **Dockerfile** copiaba el frontend compilado a `/app/server/dist/` (línea del Dockerfile):

```dockerfile
COPY --from=client-builder --chown=nodejs:nodejs /app/client/dist ./server/dist
```

PERO el **volumen** `citizen-reports_db_data` montado en `/app/server/` sobreescribía todo el directorio, incluyendo `dist/`. El volumen contenía archivos de servidor pero NO el directorio `dist/` con frontend.

### Solución Implementada

**Copiar frontend compilado al volumen:**

```bash
# Frontend ya compilado en servidor
ls -lah /root/citizen-reports/client/dist/
# Output: index.html, assets/, favicon.ico, logo-jantetelco.jpg

# Copiar al volumen
cp -r /root/citizen-reports/client/dist /var/lib/docker/volumes/citizen-reports_db_data/_data/

# Verificar
docker exec $(docker ps -q -f name=citizen-reports) ls -la /app/server/dist/
# Output:
# drwx---r-x 3 root root 4096 Nov 21 13:51 .
# -rw-r--r-- 1 root root 1427 Nov 21 13:51 index.html
# drwxr-xr-x 3 root root 4096 Nov 21 13:51 assets
```

**Archivos copiados:**
- `index.html` (1.4KB)
- `favicon.ico` (168 bytes)
- `logo-jantetelco.jpg` (48KB)
- `assets/index-DAh_hmoK.js` (613KB - JavaScript principal)
- `assets/index-dUYXLvY5.css` (24KB - estilos)
- `assets/leaflet-jBRwKcs2.js` (150KB - librería mapas)
- `assets/vendor-CRB3T2We.js` (142KB - dependencias)

---

## 🔍 Problema 3: Rutas Incorrectas en app.js

### Síntoma

A pesar de copiar `dist/` al volumen, el servicio SEGUÍA devolviendo JSON en lugar de HTML.

### Diagnóstico

**Inspección del código app.js (líneas 440-442):**

```javascript
const distPath = path.resolve(__dirname, '../client/dist');
const fallbackPath = path.resolve(__dirname, '../client/index.html');
const clientPath = path.resolve(__dirname, '../client');
```

**Con `__dirname = /app/server/` (línea 21):**

```javascript
const __dirname = dirname(fileURLToPath(import.meta.url));
```

**Rutas resultantes:**
- `distPath = /app/server/../client/dist` → `/app/client/dist` ❌ (NO existe)
- `clientPath = /app/server/../client` → `/app/client` ❌ (NO existe)

**Lógica en línea 471:**

```javascript
const staticPath = fs.existsSync(distPath) ? distPath : clientPath;
```

Como ninguna ruta existía, `staticPath` apuntaba a directorio inexistente.

**Lógica en línea 553 (app.get('/')):**

```javascript
app.get('/', (req, res) => {
  const indexPath = path.join(staticPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).json({ message: 'Jantetelco API activo', status: 'ok' }); // <-- Este se ejecutaba
  }
});
```

### Causa Raíz

El código asumía arquitectura de **desarrollo local** donde:
- Backend: `/app/server/`
- Frontend: `/app/client/dist/` (directorio hermano)

Pero en **producción con volumen montado**:
- Backend: `/app/server/` (sobreescrito por volumen)
- Frontend: `/app/server/dist/` (dentro del mismo directorio, dentro del volumen)

### Solución Implementada

**Corregir rutas en app.js del volumen:**

```bash
# Línea 440: ../client/dist → ./dist
sed -i "440s|../client/dist|./dist|" /var/lib/docker/volumes/citizen-reports_db_data/_data/app.js

# Línea 441: ../client/index.html → ./dist/index.html
sed -i "441s|../client/index.html|./dist/index.html|" /var/lib/docker/volumes/citizen-reports_db_data/_data/app.js

# Línea 442: ../client → ./dist
sed -i "442s|../client|./dist|" /var/lib/docker/volumes/citizen-reports_db_data/_data/app.js
```

**Resultado (líneas 440-442):**

```javascript
const distPath = path.resolve(__dirname, './dist');
const fallbackPath = path.resolve(__dirname, './dist/index.html');
const clientPath = path.resolve(__dirname, './dist');
```

**Con `__dirname = /app/server/`:**
- `distPath = /app/server/./dist` → `/app/server/dist/` ✅ (EXISTE)
- `staticPath = /app/server/dist/` ✅ (correcto)

**Paso 2: Reiniciar servicio**

```bash
docker service update --force --detach=true citizen-reports_citizen-reports
# Esperar 30s
docker service ps citizen-reports_citizen-reports
# Output: citizen-reports_citizen-reports.1 Running 53 seconds ago
```

### Validación Final

**Desde PowerShell local:**

```powershell
$response = Invoke-WebRequest -Uri "http://reportes.progressiagroup.com/" -UseBasicParsing
# Status: 200
# ContentType: text/html; charset=utf-8
# ContentLength: 1425
# Content: <!doctype html><html lang="es">...
```

✅ **ÉXITO:** Dominio público sirviendo HTML completo del frontend

---

## 📊 Resumen de Cambios en Volumen

### Archivos Eliminados

```
/var/lib/docker/volumes/citizen-reports_db_data/_data/
└── webhook-routes.js (eliminado)
```

### Archivos Modificados

```
/var/lib/docker/volumes/citizen-reports_db_data/_data/
└── app.js
    ├── Línea 19: // import webhookRoutes from './webhook-routes.js';
    ├── Línea 432: //   app.use('/api', webhookRoutes);
    ├── Línea 440: const distPath = path.resolve(__dirname, './dist');
    ├── Línea 441: const fallbackPath = path.resolve(__dirname, './dist/index.html');
    └── Línea 442: const clientPath = path.resolve(__dirname, './dist');
```

### Directorio Agregado

```
/var/lib/docker/volumes/citizen-reports_db_data/_data/
└── dist/
    ├── index.html (1.4KB)
    ├── favicon.ico (168B)
    ├── logo-jantetelco.jpg (48KB)
    └── assets/
        ├── index-DAh_hmoK.js (613KB)
        ├── index-dUYXLvY5.css (24KB)
        ├── leaflet-jBRwKcs2.js (150KB)
        ├── vendor-CRB3T2We.js (142KB)
        ├── manifest-D4WhTm8V.json (177B)
        └── PROGRESSIA/ (logos, íconos)
```

---

## 🎯 Estado Final del Sistema

### Servicio Docker Swarm

```bash
docker service ls --filter name=citizen-reports
# ID: oe80exwvvwkf
# NAME: citizen-reports_citizen-reports
# MODE: replicated
# REPLICAS: 1/1
# IMAGE: citizen-reports:latest
# PORTS: *:4000->4000/tcp
```

### Contenedor Activo

```bash
docker service ps citizen-reports_citizen-reports --format "{{.Name}} {{.CurrentState}}"
# citizen-reports_citizen-reports.1 Running 15 minutes ago
```

### Logs del Contenedor

```
📝 Creando aplicación...
✅ Aplicación creada
✅ Servidor production en http://0.0.0.0:4000
📡 Server está escuchando activamente en puerto 4000
127.0.0.1 - - [21/Nov/2025:14:10:33 +0000] "GET /api/reportes?limit=1 HTTP/1.1" 200 3336
201.119.237.38 - - [21/Nov/2025:14:11:02 +0000] "GET / HTTP/1.0" 200 1425
```

### Endpoints Validados

| Endpoint | Status | Content-Type | Descripción |
|----------|--------|--------------|-------------|
| `http://reportes.progressiagroup.com/` | 200 | text/html | ✅ Frontend SPA |
| `http://reportes.progressiagroup.com/api/reportes` | 200 | application/json | ✅ API funcionando |
| `http://reportes.progressiagroup.com/assets/index-DAh_hmoK.js` | 200 | application/javascript | ✅ Assets JS |
| `http://reportes.progressiagroup.com/assets/index-dUYXLvY5.css` | 200 | text/css | ✅ Assets CSS |

---

## 💡 Lecciones Aprendidas

### 1. Volúmenes Persistentes Sobreescriben Imagen

**Problema:** Asumimos que la imagen Docker contenía todo el código necesario, pero el volumen en `/app/server/` sobreescribía TODO.

**Lección:** Cuando se monta un volumen en un directorio, TODOS los archivos de la imagen en ese directorio se vuelven inaccesibles (incluso si están en la imagen).

**Best Practice:**
- Montar volúmenes en subdirectorios específicos (ej: `/app/server/data/` solo para DB)
- O sincronizar archivos necesarios al volumen después de cada build
- O usar volúmenes named solo para datos persistentes, NO para código

### 2. Código en Volúmenes = Gestión Manual

**Problema:** El archivo `app.js` en el volumen tenía código viejo (rutas incorrectas). Los builds de Docker no actualizaban código en volúmenes.

**Lección:** Si el código fuente está en un volumen persistente, los deploys de Docker NO lo actualizan automáticamente.

**Best Practice:**
- **Opción A (Recomendada):** NO poner código en volúmenes. Solo datos persistentes (DB, uploads, logs).
- **Opción B:** Script de deployment que sincroniza código del build al volumen.
- **Opción C:** Volume mounts más granulares:
  ```yaml
  volumes:
    - db_data:/app/server/data  # Solo DB
    - backups:/app/server/backups  # Solo backups
  # NO montar volumen en /app/server/ completo
  ```

### 3. Paths Relativos en Producción vs Desarrollo

**Problema:** Código asumía estructura de desarrollo (`../client/dist/`) diferente de producción (`./dist/`).

**Lección:** Paths hardcodeados causan problemas cuando la arquitectura cambia.

**Best Practice:**
- Usar variables de entorno: `FRONTEND_PATH=/app/server/dist`
- O detectar automáticamente con múltiples fallbacks:
  ```javascript
  const possiblePaths = [
    path.resolve(__dirname, './dist'),      // Producción con volumen
    path.resolve(__dirname, '../client/dist'), // Desarrollo
    path.resolve(__dirname, '../dist'),     // Build local
  ];
  const distPath = possiblePaths.find(p => fs.existsSync(p));
  ```

### 4. Validación de Endpoints Públicos

**Problema:** Asumir que servicio "Running" significa "funcionando correctamente".

**Lección:** Health checks internos (localhost:4000) pueden pasar mientras dominio público falla.

**Best Practice:**
- Validar siempre desde dominio público: `curl http://reportes.progressiagroup.com/`
- Health checks deben verificar contenido, no solo status code
- Incluir validaciones de Content-Type en tests E2E

---

## 🔧 Recomendaciones para Futuro

### Arquitectura de Volúmenes (Crítico)

**Cambio recomendado en `docker-compose.prod.yml`:**

```yaml
# ANTES (actual - problemático)
volumes:
  - db_data:/app/server  # Sobreescribe TODO el directorio

# DESPUÉS (recomendado - granular)
volumes:
  - db_data:/app/server/data        # Solo base de datos
  - db_backups:/app/server/backups  # Solo backups
  # NO montar en /app/server/ completo
```

**Beneficios:**
- ✅ Código en imagen Docker se respeta
- ✅ Deploys actualizan código automáticamente
- ✅ Solo datos persistentes en volúmenes
- ✅ Rollbacks funcionan correctamente

### Script de Sincronización (Temporal)

Mientras se mantiene arquitectura actual, crear script:

```bash
# scripts/sync-code-to-volume.sh
#!/bin/bash

VOLUME_PATH="/var/lib/docker/volumes/citizen-reports_db_data/_data"

# Sincronizar archivos JS del servidor (excepto data.db)
rsync -av --exclude='data.db' --exclude='*.db' --exclude='backups/' \
  /root/citizen-reports/server/ \
  $VOLUME_PATH/

# Sincronizar frontend compilado
rsync -av --delete \
  /root/citizen-reports/client/dist/ \
  $VOLUME_PATH/dist/

echo "✅ Código sincronizado al volumen"
```

Ejecutar después de cada `docker build`.

### Variables de Entorno

Agregar a `docker-compose.prod.yml`:

```yaml
environment:
  - NODE_ENV=production
  - FRONTEND_PATH=/app/server/dist  # Configurable
  - DB_PATH=/app/server/data/data.db
  - LOG_LEVEL=info
```

Modificar `app.js`:

```javascript
const distPath = process.env.FRONTEND_PATH || path.resolve(__dirname, './dist');
```

### Monitoring Post-Deploy

Agregar validaciones en `deploy-docker.ps1`:

```powershell
# Después de deployment
Write-Host "Validando frontend público..."
$response = Invoke-WebRequest -Uri "http://reportes.progressiagroup.com/" -UseBasicParsing
if ($response.Headers['Content-Type'] -notmatch 'text/html') {
    Write-Error "Frontend no está sirviendo HTML"
    exit 1
}
Write-Host "✅ Frontend validado"
```

---

## 📚 Referencias

- **Arquitectura completa:** `docs/BACKEND_ARCHITECTURE_COMPLETE_2025-11-17.md`
- **Guía Docker:** `docs/deployment/DOCKER_DEPLOYMENT.md`
- **Docker Compose:** `docker-compose.prod.yml`
- **Dockerfile:** `Dockerfile` (líneas 52-61: stage production)
- **Configuración servidor:** `server/app.js` (líneas 440-570: static file serving)

---

**Documento creado:** 2025-11-21 14:30 UTC  
**Autor:** PROGRESSIA Global Group  
**Versión:** 1.0.0  
**Próxima revisión:** Implementar arquitectura de volúmenes granulares
