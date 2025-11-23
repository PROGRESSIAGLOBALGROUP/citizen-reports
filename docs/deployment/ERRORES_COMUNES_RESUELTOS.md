# Guía de Errores Comunes en Despliegue - Citizen Reports

**Última Actualización:** 23 de Noviembre, 2025  
**Versión:** 1.0  
**Tipo:** Troubleshooting Guide

---

## 🎯 Propósito

Este documento recopila TODOS los errores encontrados durante el desarrollo y despliegue de Citizen Reports, sus causas raíz exactas, y soluciones probadas en producción.

---

## 📋 Indice Rápido de Errores

| # | Error | Síntoma | Solución | Página |
|---|-------|---------|----------|--------|
| 1 | Volume Mount Shadowing | Frontend devuelve JSON | Copiar dist/ al host | [E1](#error-1) |
| 2 | Database Sync Error | 500 "Error al crear sesión" | Reinit DB + rebuild schema | [E2](#error-2) |
| 3 | Hardcoded Paths | Container no encuentra archivos | Usar rutas relativas Docker | [E3](#error-3) |
| 4 | Image Not Updated | Código antiguo en container | `--no-cache` + reload image | [E4](#error-4) |
| 5 | Path Escaping PowerShell | scp falla con wildcards | Usar doble comilla | [E5](#error-5) |
| 6 | Port Already in Use | EADDRINUSE 4000 | Matar proceso anterior | [E6](#error-6) |
| 7 | Payload Size Limit | 413 Error en closure | Aumentar json body limit | [E7](#error-7) |
| 8 | Token Key Mismatch | 401 en login | Usar 'auth_token' no 'token' | [E8](#error-8) |
| 9 | Column Name Wrong | 500 en admin panel | Verificar schema.sql | [E9](#error-9) |
| 10 | Interdepartmental Query | "No supervisor" error | Usar req.usuario.dependencia | [E10](#error-10) |

---

## Error 1: Frontend Devuelve JSON en Lugar de HTML {#error-1}

### 🔴 Síntoma

```bash
$ curl http://145.79.0.77:4000/
HTTP 200
{"message":"Citizen Reports API activo","status":"ok"}

# ❌ ESPERADO:
$ curl http://145.79.0.77:4000/
HTTP 200
<!DOCTYPE html>
<html>
  <head>...
```

### 🔍 Diagnóstico

**En el navegador:**
- Se ve solo JSON en lugar de la interfaz gráfica
- La aplicación no carga (pantalla en blanco)

**En los logs:**
```bash
ssh root@145.79.0.77 'docker service logs citizen-reports_citizen-reports --tail 20'
# Buscar por: "Sirviendo API fallback" o similar
```

### 🎯 Causas Raíz

1. **Volume Mount Shadowing** (MÁS COMÚN)
   - El contenedor monta `/root/citizen-reports/server:/app/server`
   - Esto REEMPLAZA `/app/server/dist/` que existe en la imagen
   - Si host no tiene `/root/citizen-reports/server/dist/index.html`, se carga fallback JSON

2. **Path Resolution Error**
   - app.js busca en `../client/dist` (path de desarrollo)
   - En container, eso resuelve a `/app/client/dist` que no existe
   - Debería buscar `./dist` (relativo a `/app/server`)

3. **Frontend No Compilado**
   - npm run build nunca ejecutado
   - dist/ folder no existe en host

### ✅ Solución Paso a Paso

**Paso 1: Verificar que dist/ existe en host**

```bash
ssh root@145.79.0.77 'ls -la /root/citizen-reports/server/dist/index.html'
# Si NO existe:
```

**Paso 2: Construir frontend localmente**

```powershell
cd c:\PROYECTOS\citizen-reports\client
npm run build
# Output: dist/ folder created with index.html, assets/, etc.
```

**Paso 3: Copiar dist/ al host**

```powershell
# CRITICAL: Copiar TODO el contenido de dist/
scp -r "c:\PROYECTOS\citizen-reports\client\dist\*" "root@145.79.0.77:/root/citizen-reports/server/dist/"

# Verificar
ssh root@145.79.0.77 'ls -la /root/citizen-reports/server/dist/ | head -10'
# Expected: index.html, assets/, favicon.ico
```

**Paso 4: Verificar app.js tiene path correcto**

```bash
# En local
grep -A 3 "const distPath" c:\PROYECTOS\citizen-reports\server\app.js

# Expected output:
# const distPathDocker = path.resolve(__dirname, './dist');
# const distPathDev = path.resolve(__dirname, '../client/dist');
# const distPath = fs.existsSync(distPathDocker) ? distPathDocker : distPathDev;
```

Si NO tiene eso, actualizar:

```javascript
// CORRECTO para Docker + desarrollo:
const distPathDocker = path.resolve(__dirname, './dist');        // Docker path
const distPathDev = path.resolve(__dirname, '../client/dist');   // Dev path
const distPath = fs.existsSync(distPathDocker) ? distPathDocker : distPathDev;
```

**Paso 5: Copiar app.js al host**

```powershell
scp "c:\PROYECTOS\citizen-reports\server\app.js" "root@145.79.0.77:/root/citizen-reports/server/app.js"
```

**Paso 6: Reiniciar container**

```bash
ssh root@145.79.0.77 'docker service update --force citizen-reports_citizen-reports'
# Esperar 10 segundos para reinicio
```

**Paso 7: Verificar**

```powershell
curl http://145.79.0.77:4000/ | Select-Object -First 1
# Expected: <!DOCTYPE html
```

### 📊 Tabla de Causas y Fixes

| Verificación | Comando | Si Falla | Fix |
|-------------|---------|---------|-----|
| dist/ en host | `ssh server 'ls /root/citizen-reports/server/dist/index.html'` | NOT FOUND | Copiar dist/ via scp |
| app.js path logic | `grep distPathDocker /root/.../app.js` | No match | Actualizar app.js |
| Frontend Content-Type | `curl -i http://server:4000/ \| grep Content-Type` | application/json | Reiniciar container |

### 🔗 Relacionado

- [Error 4: Image Not Updated](#error-4)
- [Volume Mount Shadowing - Conceptos](#critical-concepts)

---

## Error 2: Login Devuelve 500 "Error al crear sesión" {#error-2}

### 🔴 Síntoma

```bash
POST /api/auth/login
HTTP 500
{
  "error": "Error al crear sesión",
  "details": "table sesiones has no column X" OR "SQLITE_CANTOPEN"
}
```

### 🔍 Diagnóstico

**En el navegador:**
- Login form rechaza credenciales con 500
- No se crea sesión

**En los logs:**

```bash
ssh root@145.79.0.77 'docker service logs citizen-reports_citizen-reports --tail 30 | grep -i sesion'
```

### 🎯 Causas Raíz

1. **Table `sesiones` No Existe**
   - Schema.sql nunca ejecutado
   - Base de datos vacía o corrupta

2. **Columnas Faltantes**
   - Schema desactualizado
   - Incompatibilidad entre código y DB

3. **Database File Corrupted**
   - WAL lock files huérfanos
   - Interrupción durante inicialización

### ✅ Solución Paso a Paso

**Paso 1: Verificar database structure**

```bash
ssh root@145.79.0.77 'sqlite3 /root/citizen-reports/server/data.db ".tables"'
# Expected: reportes usuarios sesiones tipos_reporte dependencias etc.

# Si está vacío:
ssh root@145.79.0.77 'sqlite3 /root/citizen-reports/server/data.db ".schema" | head -20'
```

**Paso 2: Backup database (por si acaso)**

```bash
ssh root@145.79.0.77 'cp /root/citizen-reports/server/data.db /root/citizen-reports/backups/data.db.backup_ERROR_2'
```

**Paso 3: Reinitialize database**

```bash
# Opción A: Mantener datos (si ya hay datos importantes)
ssh root@145.79.0.77 'cd /root/citizen-reports/server && npm run init'

# Opción B: Reset completo (destruye todos los datos)
ssh root@145.79.0.77 'rm /root/citizen-reports/server/data.db && cd /root/citizen-reports/server && npm run init'
```

**Paso 4: Remover WAL files si existen**

```bash
ssh root@145.79.0.77 'rm /root/citizen-reports/server/data.db-shm /root/citizen-reports/server/data.db-wal 2>/dev/null; echo "Cleaned"'
```

**Paso 5: Verificar structure**

```bash
ssh root@145.79.0.77 'sqlite3 /root/citizen-reports/server/data.db "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"'
# Expected: asignaciones, categorias, cierres_pendientes, dependencias, historial_cambios, 
#           reportes, sesiones, tipos_reporte, usuarios
```

**Paso 6: Verificar sample data**

```bash
ssh root@145.79.0.77 'sqlite3 /root/citizen-reports/server/data.db "SELECT COUNT(*) FROM usuarios;"'
# Expected: 3 (admin, supervisor, funcionario)
```

**Paso 7: Test login**

```powershell
$body = @{email="admin@jantetelco.gob.mx"; password="admin123"} | ConvertTo-Json
Invoke-WebRequest -Uri "http://145.79.0.77:4000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
# Expected: HTTP 200 + token
```

### 🧹 Verificación completa

```bash
#!/bin/bash
echo "=== Database Integrity Check ==="

# Check structure
echo "1. Tables:"
sqlite3 /root/citizen-reports/server/data.db ".tables"

# Check users
echo ""
echo "2. Users count:"
sqlite3 /root/citizen-reports/server/data.db "SELECT COUNT(*) FROM usuarios;"

# Check sessions
echo ""
echo "3. Sessions structure:"
sqlite3 /root/citizen-reports/server/data.db ".schema sesiones"

# Check integrity
echo ""
echo "4. Database integrity:"
sqlite3 /root/citizen-reports/server/data.db "PRAGMA integrity_check;"
```

### ⚠️ Importante: npm run init

El comando `npm run init` es **IDEMPOTENT** - seguro ejecutar múltiples veces:

```bash
# SEGURO - se puede ejecutar 100 veces sin problemas
npm run init

# ¿Qué hace?
# 1. Lee schema.sql
# 2. Crea tablas si no existen
# 3. NO elimina datos existentes
# 4. NO falla si tablas ya existen

# Para reset destructivo:
rm data.db && npm run init
```

---

## Error 3: Hardcoded Paths - Container No Encuentra Archivos {#error-3}

### 🔴 Síntoma

```
Error: ENOENT: no such file or directory, open '/home/jantetelco/jantetelco/logs/...'
Or in database operations:
Cannot find module at hardcoded path
```

### 🎯 Causa Raíz

**Paths hardcodeados en código:**

```javascript
// ❌ MALO - no funciona en Docker:
const DB_PATH = "/home/jantetelco/jantetelco/data.db";
const LOG_PATH = "/home/jantetelco/jantetelco/logs";

// ✅ BUENO - dinámico:
const DB_PATH = process.env.DB_PATH || "./data.db";
const LOG_PATH = process.env.LOG_PATH || "./logs";
```

### ✅ Solución

**Buscar y reemplazar TODOS los paths hardcodeados:**

```bash
# Buscar en código
grep -r "/home/jantetelco" /root/citizen-reports/server/*.js
grep -r "C:\\Users\\" /root/citizen-reports/server/*.js

# Reemplazar con env vars o rutas relativas:
# /home/jantetelco/jantetelco/logs → process.env.LOG_PATH || './logs'
# C:\Users\Wilder\... → path.resolve(__dirname, './')
```

**En docker-compose.prod.yml:**

```yaml
environment:
  - DB_PATH=/app/server/data.db
  - LOG_PATH=/app/server/logs
  - NODE_ENV=production
```

**En archivo .env (local):**

```
DB_PATH=./server/data.db
LOG_PATH=./server/logs
```

---

## Error 4: Image Not Updated - Código Antiguo en Container {#error-4}

### 🔴 Síntoma

```bash
# Cambias app.js localmente
# Haces docker build
# Pero el container TODAVÍA corre código antiguo
```

### 🎯 Causas Raíz

1. **Docker Layer Caching**
   - Layers anteriores cacheadas
   - Cambios no se incluyen

2. **Swarm No Reloadea Image**
   - `docker build` crea imagen LOCAL
   - Server tiene imagen VIEJA cacheada
   - No automáticamente descarga versión nueva

3. **Volume Mount Shadows Image**
   - Host directory `/root/citizen-reports/server` reemplaza image files
   - Cambios en image irrelevantes si volume mount existe

### ✅ Solución

**Opción A: Rebuild sin cache + Transfer (RECOMENDADO)**

```bash
# 1. Local: Build sin cache
docker build -t citizen-reports:latest . --no-cache

# 2. Local: Save image
docker save citizen-reports:latest -o "$env:TEMP\citizen-reports.tar"

# 3. Transfer to server
scp "$env:TEMP\citizen-reports.tar" "root@145.79.0.77:/tmp/citizen-reports.tar"

# 4. Server: Load image
ssh root@145.79.0.77 'docker load -i /tmp/citizen-reports.tar'

# 5. Server: Force redeploy
ssh root@145.79.0.77 'docker service update --force citizen-reports_citizen-reports'
```

**Opción B: Update Host Files Directly (RÁPIDO)**

Si solo cambiaste app.js o pocos archivos:

```bash
# Copy modified file
scp "c:\PROYECTOS\citizen-reports\server\app.js" "root@145.79.0.77:/root/citizen-reports/server/app.js"

# Reinicia container (va a releer desde volume mount)
ssh root@145.79.0.77 'docker service update --force citizen-reports_citizen-reports'
```

### 🔍 Verificación

```bash
# Verify container has new code
ssh root@145.79.0.77 'docker exec $(docker ps -q | head -1) cat /app/server/app.js | grep "YOUR_NEW_CODE"'

# If not found, restart container
ssh root@145.79.0.77 'docker service update --force citizen-reports_citizen-reports'
```

### ⚠️ Clave

**Volume mount = host files > image files**

Por eso:
1. Cambios a image NO se verán si volume mount existe
2. Debes copiar archivos al host
3. Luego reiniciar container para releer

---

## Error 5: PowerShell scp Escaping Issues {#error-5}

### 🔴 Síntoma

```powershell
scp -r "c:\PROYECTOS\citizen-reports\client\dist\*" "root@145.79.0.77:/root/..."
# PowerShell: The term 'head' is not recognized as a name of a cmdlet...
# OR files not copied correctly
```

### 🎯 Causa Raíz

PowerShell expande `*` LOCALMENTE antes de enviar a SSH:

```powershell
# PowerShell ve: "c:\PROYECTOS\citizen-reports\client\dist\*"
# Y lo expande a: "c:\PROYECTOS\citizen-reports\client\dist\file1.js" "c:\PROYECTOS\...\file2.js" ...
# Envia cada archivo por separado (mal)

# SSH nunca ve el wildcard - solo archivos individuales
```

### ✅ Solución

**Opción 1: Usar punto (.) para copiar directorio completo**

```powershell
scp -r "c:\PROYECTOS\citizen-reports\client\dist\." "root@145.79.0.77:/root/citizen-reports/server/dist"
# El . copia contenido sin copiar el folder en sí
```

**Opción 2: Usar WSL/Git Bash en lugar de PowerShell**

```bash
# WSL
scp -r c:\\PROYECTOS\\citizen-reports\\client\\dist/* root@145.79.0.77:/root/citizen-reports/server/dist/
```

**Opción 3: Evitar wildcards - usar tar**

```powershell
# Local:
cd c:\PROYECTOS\citizen-reports\client
tar -czf "dist.tar.gz" dist/

# Transfer:
scp "dist.tar.gz" "root@145.79.0.77:/tmp/"

# Server:
ssh root@145.79.0.77 'cd /root/citizen-reports/server && tar -xzf /tmp/dist.tar.gz'
```

---

## Error 6: Port Already in Use - EADDRINUSE 4000 {#error-6}

### 🔴 Síntoma

```
Error: listen EADDRINUSE: address already in use :::4000
```

### 🎯 Causa Raíz

1. Container anterior aún corriendo
2. Otro proceso usando port
3. TIME_WAIT socket no liberado

### ✅ Solución

**Opción 1: Kill existing container**

```bash
ssh root@145.79.0.77 'docker service rm citizen-reports_citizen-reports'
sleep 5
ssh root@145.79.0.77 'docker stack deploy -c docker-compose.prod.yml citizen-reports'
```

**Opción 2: Force kill process**

```bash
ssh root@145.79.0.77 'lsof -i :4000 | awk "NR!=1 {print \$2}" | xargs kill -9'
sleep 2
ssh root@145.79.0.77 'docker service update --force citizen-reports_citizen-reports'
```

**Opción 3: Change port temporarily**

```yaml
# docker-compose.prod.yml
ports:
  - "4001:4000"  # Listen on 4001 instead
```

---

## Error 7: Payload Too Large - 413 {#error-7}

### 🔴 Síntoma

```
POST /api/reportes/.../cierre
HTTP 413 Payload Too Large
```

### 🎯 Causa Raíz

Closure request incluye:
- Firma base64 (~500KB)
- 3 fotos base64 (~300KB each = 900KB)
- Total ~1.4MB

Express default limit = 1MB → **413 error**

### ✅ Solución

**En server/app.js:**

```javascript
// BEFORE: app.use(express.json());

// AFTER:
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// VERIFICAR:
// limit: '5mb' acomoda fotos + firma + metadata
```

---

## Error 8: Login 401 - Token Key Mismatch {#error-8}

### 🔴 Síntoma

```
Frontend: POST /api/auth/login → HTTP 200, token en response
Frontend: POST /api/reportes → HTTP 401, "Unauthorized"

// En localStorage:
localStorage.getItem('token') → null
localStorage.getItem('auth_token') → null  (También nada)
```

### 🎯 Causa Raíz

**Frontend guarda con key ERRADA:**

```javascript
// ❌ MALO:
localStorage.setItem('token', loginResponse.token);

// ✅ BUENO:
localStorage.setItem('auth_token', loginResponse.token);
```

Todas las rutas esperan `auth_token`:

```javascript
// En middleware:
const token = req.headers.authorization?.split(' ')[1] || 
              req.cookies.auth_token;
```

### ✅ Solución

**Frontend (client/src/...)**

```javascript
// Login component:
const response = await fetch('/api/auth/login', {...});
const data = await response.json();
localStorage.setItem('auth_token', data.token);  // ✅ CORRECT KEY

// API calls:
const token = localStorage.getItem('auth_token');
const response = await fetch('/api/reportes', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## Error 9: Wrong Column Name - SQL 500 Error {#error-9}

### 🔴 Síntoma

```
POST /api/admin/tipos (update type)
HTTP 500
"no such column: slug"  OR  "table tipos_reporte has no column tipo"
```

### 🎯 Causa Raíz

**Schema.sql define `tipo` pero código usa `slug`:**

```sql
-- schema.sql actual:
CREATE TABLE tipos_reporte (
  id INTEGER PRIMARY KEY,
  tipo TEXT NOT NULL,       -- ← Column name is 'tipo'
  nombre TEXT,
  categoria_id INTEGER,
  dependencia TEXT
);
```

```javascript
// ❌ MALO - looking for 'slug':
const query = "SELECT slug FROM tipos_reporte WHERE id = ?";
const row = result.slug;

// ✅ BUENO - use actual 'tipo':
const query = "SELECT tipo FROM tipos_reporte WHERE id = ?";
const row = result.tipo;
```

### ✅ Solución

**Paso 1: Verify actual schema**

```bash
sqlite3 /root/citizen-reports/server/data.db ".schema tipos_reporte"
# Look for column names in output
```

**Paso 2: Update code to match schema**

```javascript
// In admin-routes.js or wherever tipos_reporte is used:
// Change all:
// .tipo_slug → .tipo
// SELECT slug → SELECT tipo
// WHERE slug = → WHERE tipo =
```

**Paso 3: Verify all references**

```bash
grep -r "slug" server/*.js | grep tipos_reporte
grep -r "tipos_reporte" server/*.js | head -20
```

**Paso 4: Test**

```bash
curl -X POST http://145.79.0.77:4000/api/admin/tipos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tipo":"bache","nombre":"Bache"}'
# Expected: HTTP 200
```

---

## Error 10: Interdepartmental Query - No Supervisor Found {#error-10}

### 🔴 Síntoma

```
POST /api/reportes/:id/solicitar-cierre
HTTP 500 or 404
"No se encontró supervisor en la dependencia"
```

Ocurre cuando:
- Funcionario en dependencia A
- Reporte en dependencia B
- Intenta cerrar reporte

### 🎯 Causa Raíz

**Código usa dependencia EQUIVOCADA para buscar supervisor:**

```javascript
// ❌ MALO:
const supervisor = obtenerSupervisor(reporte.dependencia);
// Si reporte es de A y funcionario de B, supervisor de B no existe

// ✅ BUENO:
const supervisor = obtenerSupervisor(req.usuario.dependencia);
// Usa dependencia del funcionario que hace la solicitud
```

### ✅ Solución

**En reportes-auth-routes.js o donde esté el código:**

```javascript
// SIEMPRE usar req.usuario.dependencia para queries interdepartmentales

// Ejemplo correcto:
app.post('/api/reportes/:id/solicitar-cierre', requiereAuth, (req, res) => {
  const { id } = req.params;
  const reporteId = parseInt(id);
  const usuarioDependencia = req.usuario.dependencia;  // ✅ Usar esto
  
  const db = getDb();
  
  // Get supervisor from FUNCIONARIO's department, not report's
  db.get(
    'SELECT id FROM usuarios WHERE rol = ? AND dependencia = ?',
    ['supervisor', usuarioDependencia],  // ✅ Correct
    (err, supervisor) => {
      // ...
    }
  );
});
```

---

## 📊 Matriz de Decisión Rápida

```
¿Cuál es mi problema?

├─ Frontend muestra JSON
│  └─ Error 1: Volume Mount Shadowing
│
├─ Login no funciona (500)
│  └─ Error 2: Database Sync
│
├─ Files not found (ENOENT)
│  └─ Error 3: Hardcoded Paths
│
├─ Code changes not appearing
│  └─ Error 4: Image Not Updated
│
├─ scp falla con wildcards
│  └─ Error 5: PowerShell Escaping
│
├─ Container no inicia (EADDRINUSE)
│  └─ Error 6: Port Already in Use
│
├─ Upload falla (413)
│  └─ Error 7: Payload Too Large
│
├─ Auth falla (401)
│  └─ Error 8: Token Key Mismatch
│
├─ SQL error (no such column)
│  └─ Error 9: Column Name Wrong
│
└─ Supervisor not found
   └─ Error 10: Interdepartmental Query
```

---

## ⚠️ Golden Rules

1. **Volume Mount Shadows Image**
   - Host files ALWAYS override image files
   - If you change image, ALSO copy to host

2. **Test Locally First**
   - `docker run --rm citizen-reports:latest` before transfer
   - Verify `curl http://localhost:9000/` returns HTML

3. **Always Backup DB**
   - Before any risky operation
   - `cp data.db data.db.backup_before_X`

4. **Use Environment Variables**
   - Never hardcode paths
   - `process.env.DB_PATH || './data.db'`

5. **Idempotent Operations**
   - `npm run init` safe to run N times
   - Schema migrations should be forward-compatible

6. **Force Updates**
   - `docker build --no-cache` (no cached layers)
   - `docker service update --force` (restart container)
   - Copy both image + host files

7. **Validate After Each Step**
   - Check HTTP 200 at each stage
   - Verify container logs: `docker service logs ...`
   - Test endpoints: curl or Postman

---

## 📞 Escalation Path

1. **Check logs first**
   ```bash
   docker service logs citizen-reports_citizen-reports --tail 100
   ```

2. **Verify files exist**
   ```bash
   ssh server 'ls -la /root/citizen-reports/server/{app.js,data.db,dist/index.html}'
   ```

3. **Test endpoints**
   ```bash
   curl http://145.79.0.77:4000/
   curl -X POST http://145.79.0.77:4000/api/auth/login ...
   ```

4. **Check database**
   ```bash
   sqlite3 /root/citizen-reports/server/data.db "SELECT count(*) FROM usuarios;"
   ```

5. **If still stuck**
   - Revert to last known good version
   - Restore database backup
   - Deploy from scratch

---

## 📚 Referencias Cruzadas

- **Volume Mount Details:** → Conceptos Críticos en DOCKER_SWARM_DEPLOYMENT_GUIDE.md
- **Database Schema:** → server/schema.sql
- **Authentication:** → docs/SISTEMA_AUTENTICACION.md
- **API Docs:** → docs/api/openapi.yaml

---

**Versión:** 1.0  
**Última Actualización:** 23 Noviembre 2025  
**Mantenedor:** DevOps Team  
**Estado:** VALIDATED IN PRODUCTION
