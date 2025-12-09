# citizen-reports — AI Agent Instructions

> **Civic-tech heatmap platform** for municipal incident reporting (Mexico)  
> React 18 + Leaflet | Express 4 + SQLite | Docker Swarm on Linux VPS

---

## 🚀 Quick Start

```powershell
# Option A: Automated (recommended)
.\start-dev.ps1  # Installs deps, inits DB, opens both servers

# Option B: Manual
cd server && npm install && npm run init && npm run dev  # :4000
cd client && npm install && npm run dev                   # :5173 → proxies /api to :4000

# Run tests before commit
npm run test:unit   # Backend (Jest) ~25s
npm run test:front  # Frontend (Vitest) ~5s
npm run test:e2e    # E2E (Playwright) - requires fresh client build
```

---

## 🏗️ Architecture

```
client/          → React SPA (Leaflet heatmaps, hash routing: #panel, #admin, #reportar)
server/          → Express API (*-routes.js modular pattern), SQLite singleton
tests/           → backend/ (Jest), frontend/ (Vitest), e2e/ (Playwright)
config/          → jest.config.cjs, vitest.config.ts, playwright.config.ts
```

**Data flow:** Frontend → Vite proxy `/api` → Express routes → `getDb()` singleton → SQLite

**⛔ NEVER** cross-import between `server/` and `client/`. ESM only (`import`/`export`).

---

## 🔑 Critical Patterns

### Database — Always use singleton
```javascript
import { getDb } from './db.js';
const db = getDb();  // ✅ NEVER instantiate sqlite3.Database directly
// db.close() is a no-op (singleton persists for app lifetime)
```

### Auth — Token key matters
```javascript
localStorage.getItem('auth_token')  // ✅ NOT 'token' — causes silent 401s
```
Middleware chain: `requiereAuth` → `requiereRol(['admin'])` → handler  
Test credentials: `admin@jantetelco.gob.mx` / `admin123`

### Roles & Dependencia Filtering
```
funcionario → Can view/work assigned reports ONLY within their own department
supervisor  → Can view ALL reports of their department + approve closures  
admin       → Full access: ALL reports from ALL departments
```

**⚠️ CRITICAL:** Funcionario/Supervisor queries MUST filter by `req.usuario.dependencia`:
```javascript
// Funcionario/Supervisor: filter by their department
WHERE dependencia = ?  -- req.usuario.dependencia

// Admin: NO dependencia filter (sees everything)
```

### Leaflet — Prevent re-renders
```javascript
const mapRef = useRef(null);       // ✅ DOM container
const mapInstance = useRef(null);  // ✅ L.map instance
// NEVER use useState for map instances — causes infinite re-renders
```

### API Routes — Modular pattern
New endpoints: create `server/{feature}-routes.js`, import in `server/app.js`:
```javascript
import * as featureRoutes from './feature-routes.js';
featureRoutes.configurarRutas(app);
```

### Route Order Matters
```javascript
// ⚠️ Specific routes BEFORE parameterized routes
app.get('/api/reportes/tipos', ...);        // ✅ First
app.get('/api/reportes/mis-reportes', ...); // ✅ Second
app.get('/api/reportes/:id', ...);          // ✅ Last (catches all)
```

### Cascading Deletes with Reassignment Pattern
```javascript
// When deleting an entity with dependencies, implement 2-endpoint pattern:

// 1. GET endpoint to check for dependent entities
app.get('/api/admin/entity/:id/dependents', (req, res) => {
  const db = getDb();
  db.all('SELECT * FROM dependent_table WHERE parent_id = ?', [req.params.id], (err, rows) => {
    res.json({ count: rows?.length || 0, rows });
  });
});

// 2. POST endpoint for reassignment + deletion
app.post('/api/admin/entity/:id/reassign-and-delete', (req, res) => {
  const { destinationId } = req.body;
  const db = getDb();
  
  // Reassign all dependents to new parent
  db.run('UPDATE dependent_table SET parent_id = ? WHERE parent_id = ?', 
    [destinationId, req.params.id]);
  
  // Then soft-delete the parent
  db.run('UPDATE entity SET activo = 0 WHERE id = ?', [req.params.id]);
  
  res.json({ mensaje: 'Entidad eliminada. N dependiente(s) reasignado(s).' });
});

// Frontend flow:
// 1. User clicks Delete
// 2. Check dependents via GET endpoint
// 3. If count > 0 → show modal with reassignment dropdown
// 4. On confirm → POST reassign-and-delete endpoint
```

**Real example:** `AdminDependencias.jsx` → Eliminar dependencia con usuarios asignados
- API: `GET /api/admin/dependencias/:id/usuarios` + `POST /api/admin/dependencias/:id/reasignar-y-eliminar`
- Frontend: Modal shows list of users, dropdown for destination department

---

## 🎨 WhiteLabel Multi-Tenant System

> **Esencial:** El sistema soporta configuración dinámica por municipio

### Uso en componentes React
```javascript
import { useWhiteLabel } from './WhiteLabelContext.jsx';

function MiComponente() {
  const { config, loading, recargarConfig } = useWhiteLabel();
  
  // config contiene: municipio, colores, coordenadas del mapa, logo, etc.
  const { nombre_municipio, color_primario, latitud_centro, longitud_centro, zoom_inicial } = config;
}
```

### Estructura de configuración
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `nombre_municipio` | string | Nombre del municipio (header, títulos) |
| `color_primario` | hex | Color principal del tema |
| `color_secundario` | hex | Color de acentos |
| `latitud_centro` | float | Centro del mapa (lat) |
| `longitud_centro` | float | Centro del mapa (lng) |
| `zoom_inicial` | int | Nivel de zoom inicial (12-16) |
| `logo_url` | string | URL del logo municipal |

### API Endpoints
```javascript
GET  /api/whitelabel/config     // Obtener config actual (público)
PUT  /api/whitelabel/config     // Actualizar config (requiere admin)
```

### Archivos clave
- `client/src/WhiteLabelContext.jsx` — Provider y hook
- `client/src/WhiteLabelConfig.jsx` — Lógica de carga
- `server/whitelabel-routes.js` — API endpoints

---

## 🔒 Security Patterns

### SQL Injection — Always parameterized
```javascript
db.get('SELECT * FROM usuarios WHERE email = ?', [email]);  // ✅
db.get(`SELECT * FROM usuarios WHERE email = '${email}'`);  // ❌ NEVER
```

### API Response Format
```javascript
// Success
res.status(201).json({ ok: true, id: this.lastID });
res.json(rows);  // Arrays for lists

// Errors (always include 'error' key)
res.status(400).json({ error: 'Datos inválidos' });
res.status(401).json({ error: 'Token requerido' });
res.status(403).json({ error: 'Acceso denegado' });
```

### Input Validation (use existing helpers in `server/app.js`)
- `validarCoordenadas(lat, lng)` — validates geo bounds (-90/90, -180/180)
- `normalizeTipos(raw)` — handles array/string/comma-separated types

---

## 🐳 Docker Production Deployment

> **Target:** Docker Swarm on Linux VPS (145.79.0.77)

### Build para producción (desde Windows)
```powershell
# Build cross-platform (OBLIGATORIO --platform para Linux target)
docker build --platform linux/amd64 --no-cache -t citizen-reports:latest .

# Exportar imagen
docker save citizen-reports:latest -o "$env:TEMP\citizen-reports.tar"

# Transferir a servidor
scp "$env:TEMP\citizen-reports.tar" root@145.79.0.77:/tmp/
```

### Deploy en servidor Linux
```bash
# Cargar imagen
docker load -i /tmp/citizen-reports.tar

# Deploy con Docker Compose/Swarm
cd /root/citizen-reports
docker compose -f docker-compose.prod.yml up -d

# Verificar health
docker ps --format "table {{.Names}}\t{{.Status}}"
curl -s http://localhost:4000/api/reportes?limit=1 | jq .
```

### Estructura docker-compose.prod.yml
```yaml
# Características clave:
- Health checks cada 30s
- Volumen persistente: /root/citizen-reports/data:/app/data
- Restart policy: on-failure (max 3 attempts)
- Resource limits: 256MB max heap
- Log rotation: 10MB max, 3 archivos
- Network: easypanel (para reverse proxy)
```

### Pre-flight checklist
- [ ] `.dockerignore` incluye `**/node_modules`
- [ ] `Dockerfile` usa multi-stage build
- [ ] `DB_PATH=/app/data/data.db` en producción
- [ ] Backup de data.db antes de deploy

---

## 🧪 Test Structure

| Layer | Config | Command | Location |
|-------|--------|---------|----------|
| Backend (Jest) | `config/jest.config.cjs` | `npm run test:unit` | `tests/backend/*.test.js` |
| Frontend (Vitest) | `config/vitest.config.ts` | `npm run test:front` | `tests/frontend/*.spec.jsx` |
| E2E (Playwright) | `config/playwright.config.ts` | `npm run test:e2e` | `tests/e2e/*.spec.ts` |

### E2E Test Pattern
```typescript
// Use login helper from tests/e2e/fixtures/login-helper.ts
import { loginViaAPIAndSetToken, USERS } from './fixtures/login-helper';
await loginViaAPIAndSetToken(page, USERS.admin);

// Wait 6s for splash screen before interacting
await page.waitForTimeout(6000);
```

**E2E requires fresh build:** Run `cd client && npm run build` before `npm run test:e2e`

---

## ⚠️ Common Errors

| Symptom | Fix |
|---------|-----|
| `SQLITE_ERROR: no such table` | `cd server && npm run init` |
| `401 Unauthorized` on admin | Use `localStorage.getItem('auth_token')` not `'token'` |
| `No se encontro supervisor` | Use `req.usuario.dependencia` not `reporte.dependencia` |
| E2E flaky/failing | `cd client && npm run build` before E2E |
| Map infinite re-render | Use `useRef` not `useState` for Leaflet instances |
| Route not matching | Specific routes before `/:id` wildcards |
| Docker `ERR_DLOPEN_FAILED` | Verify `.dockerignore` has `**/node_modules` |

---

## 📁 File Placement

| Type | Location |
|------|----------|
| Backend routes | `server/*-routes.js` |
| React components | `client/src/*.jsx` |
| Tests | `tests/{backend,frontend,e2e}/` |
| Test configs | `config/` |
| Migrations | `server/migrations/*.sql` |
| Docker configs | `docker-compose.prod.yml`, `Dockerfile` |

---

## 📚 Key References

| Resource | Path |
|----------|------|
| Database schema | `server/schema.sql` |
| DB singleton | `server/db.js` |
| Auth middleware + roles | `server/auth_middleware.js` |
| Security (rate limit, CSRF) | `server/security.js` |
| Main Express app | `server/app.js` |
| WhiteLabel context | `client/src/WhiteLabelContext.jsx` |
| WhiteLabel config | `client/src/WhiteLabelConfig.jsx` |
| E2E login helper | `tests/e2e/fixtures/login-helper.ts` |
| User Stories | `.github/USER_STORIES.md` |
| Docker production | `docker-compose.prod.yml` |

---

## 📋 User Stories Quick Reference

> **Documento completo:** [`.github/USER_STORIES.md`](USER_STORIES.md)

### Por Rol

| Rol | Stories | Descripción |
|-----|---------|-------------|
| Ciudadano | US-C01 a US-C06 | Mapa, crear reporte, ver detalle, login, logout, editar |
| Funcionario | US-F01 a US-F05 | Mis reportes, notas, evidencias, solicitar cierre |
| Supervisor | US-S01 a US-S06 | Reportes depto, asignar, aprobar cierres, historial |
| Admin | US-A01 a US-A06 | Usuarios, categorías, dependencias, whitelabel, BD |
| SuperUser | US-SU01-02 | Acceso emergencia, SQL directo |
| Técnicas | US-T01-04 | Tiles proxy, geocoding, GeoJSON, webhooks |
| Seguridad | US-SEC01-05 | Audit trail, auth, SQL injection, validación, roles |

### Gaps de Seguridad Críticos (Auditoría)

| Gap | Estado | Story |
|-----|--------|-------|
| ✅ Rate Limiting en login | Implementado | US-SEC02 |
| ✅ Política de passwords | Implementado | US-SEC02 |
| ✅ Session timeout por inactividad | Implementado (30 min) | US-SEC02 |
| ✅ Protección CSRF | Implementado | - |
| ✅ Sanitización XSS | Implementado | US-SEC04 |
| ✅ Rutas /api/usuarios protegidas | Corregido 2025-12-06 | US-SEC05 |

### Archivos de Seguridad

| Archivo | Contenido |
|---------|-----------|
| `server/security.js` | Rate limiting, cifrado E2E, CSRF, sanitización, session timeout |
| `server/auth_middleware.js` | requiereAuth, requiereRol, verificarSesionActiva |
| `client/src/secureFetch.js` | Helper fetch con auth + CSRF automático |
| `tests/e2e/security-integration.spec.ts` | 13 tests de seguridad E2E |

---

## 🚨 ERRORES CRÍTICOS A EVITAR (Lecciones Aprendidas)

### ❌ Error: Rutas sin middleware de autorización
```javascript
// ❌ MAL - Cualquiera puede acceder
app.post('/api/usuarios', usuariosRoutes.crearUsuario);

// ✅ BIEN - Solo admin autenticado
app.post('/api/usuarios', requiereAuth, requiereRol(['admin']), usuariosRoutes.crearUsuario);
```
**Siempre verificar** que las rutas sensibles tengan `requiereAuth` + `requiereRol()`.

### ❌ Error: Hash change race condition en tests E2E
```javascript
// ❌ MAL - El hash se ejecuta ANTES de que React lea localStorage
await page.goto('http://localhost:4000/#panel');
// React monta → hash handler ve #panel → pero usuario aún es null → limpia hash

// ✅ BIEN - Navegar SIN hash, esperar splash, LUEGO cambiar hash
await page.goto('http://localhost:4000');
await page.waitForTimeout(6000);  // Splash + React mount
await page.evaluate(() => window.location.hash = '#panel');
```

### ❌ Error: page.goto() después de localStorage pierde el contexto
```javascript
// ❌ MAL - goto puede resetear localStorage
await page.evaluate(() => localStorage.setItem('auth_token', token));
await page.goto('http://localhost:4000/#panel');  // localStorage se pierde!

// ✅ BIEN - Usar addInitScript ANTES de navegar
await page.addInitScript(({ token }) => {
  localStorage.setItem('auth_token', token);
}, { token });
await page.goto('http://localhost:4000');  // localStorage ya está configurado
```

### ❌ Error: storageState no resuelve splash screen de la app
El splash screen de 6 segundos es parte del flujo de la app React, NO del login. 
Incluso con storageState, el splash sigue apareciendo. El ahorro real es evitar 
el login UI (~3-4s), no el splash.

### ❌ Error: Ejecutar suite completa para validar cambios pequeños
```powershell
# ❌ MAL - Pierde 20+ minutos en suite completa
npm run test:e2e

# ✅ BIEN - Ejecutar solo los tests afectados
npx playwright test tests/e2e/security-integration.spec.ts --config=config/playwright.config.ts
```

### ❌ Error: No revisar resultados históricos antes de correr tests
Antes de ejecutar la suite completa, revisar el contexto de la conversación 
para ver qué tests ya pasaron/fallaron. Evita re-ejecutar innecesariamente.

---

## ⚡ Optimizaciones de Tests E2E (2025-12-06)

### Mejora de Rendimiento
| Métrica | Original | Optimizado | Mejora |
|---------|----------|------------|--------|
| Suite completa | 37.6 min | 17.8 min | **53%** |
| cierres-pendientes | 7.6 min | 2.9 min | **62%** |
| panel-funcionario-responsive | 5.5 min | 4.6 min | **16%** |

### Helper Optimizado: loginViaAPIAndSetToken
```typescript
// tests/e2e/fixtures/login-helper.ts
export async function loginViaAPIAndSetToken(page: Page, user: User): Promise<string> {
  // 1. Obtener token via API (sin UI)
  const response = await page.request.post(`${API_URL}/api/auth/login`, {
    data: { email: user.email, password: user.password }
  });
  const { token } = await response.json();
  
  // 2. Inyectar localStorage ANTES de cargar la app
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('usuario', JSON.stringify(user));
  }, { token, user });
  
  // 3. Navegar SIN hash (evita race condition)
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  
  // 4. Esperar splash screen (inevitable, ~6s)
  await page.waitForTimeout(6000);
  
  // 5. Ahora cambiar hash (usuario ya está en estado React)
  await page.evaluate(() => window.location.hash = '#panel');
  await page.waitForTimeout(500);
  
  return token;
}
```

### Usuarios de Test Predefinidos
```typescript
// tests/e2e/fixtures/login-helper.ts
export const USERS = {
  admin: { email: 'admin@jantetelco.gob.mx', password: 'admin123', rol: 'admin', ... },
  supervisorObras: { email: 'supervisor.obras@jantetelco.gob.mx', ... },
  funcionarioObras: { email: 'func.obras1@jantetelco.gob.mx', ... }
};
```
