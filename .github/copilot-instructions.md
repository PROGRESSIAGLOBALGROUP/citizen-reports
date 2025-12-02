# citizen-reports — AI Agent Instructions

> **Civic-tech heatmap platform** for municipal incident reporting (Mexico)  
> React 18 + Leaflet | Express 4 + SQLite | Docker on Ubuntu VPS

---

## 🚀 Quick Start

```powershell
# Option A: Automated (recommended)
.\start-dev.ps1  # Installs deps, inits DB, opens both servers

# Option B: Manual
cd server && npm install && npm run init && npm run dev  # :4000
cd client && npm install && npm run dev                   # :5173 → proxies /api to :4000

# Validate before commit (TDD: Red → Green → Refactor)
npm run test:all   # Lint + Jest + Vitest + Playwright — must pass 100%
```

---

## 🏗️ Architecture

```
client/          → React SPA (Leaflet heatmaps, hash routing: #panel, #admin, #reportar)
server/          → Express API (*-routes.js modular pattern), SQLite singleton
tests/           → backend/ (Jest), frontend/ (Vitest), e2e/ (Playwright)
config/          → jest.config.cjs, vitest.config.ts, playwright.config.ts
docs/adr/        → Architecture Decision Records (check before structural changes)
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
// E2E: page.evaluate(() => localStorage.getItem('auth_token'))
```
Middleware chain: `requiereAuth` → `requiereRol(['admin'])` → handler  
Test credentials: `admin@jantetelco.gob.mx` / `admin123`

### Roles Hierarchy
```
funcionario → Can view/work assigned reports ONLY within their own department
supervisor  → Can view ALL reports of their department + approve closures  
admin       → Full access: ALL reports from ALL departments, users, system
```

**⚠️ CRITICAL:** Funcionario/Supervisor can ONLY see reports from `req.usuario.dependencia`
```javascript
// Funcionario/Supervisor queries MUST filter by dependencia
WHERE dependencia = ?  -- req.usuario.dependencia

// Admin queries have NO dependencia filter (sees everything)
// Don't add WHERE dependencia for admin role
```

### Leaflet — Prevent re-renders
```javascript
const mapRef = useRef(null);       // ✅ DOM container
const mapInstance = useRef(null);  // ✅ L.map instance
// NEVER use useState for map instances — causes infinite re-renders
```

### WhiteLabel Multi-tenant
```javascript
import { useWhiteLabel } from './WhiteLabelContext.jsx';
const { config } = useWhiteLabel();  // ✅ municipio, colors, map center
// Config from: /api/whitelabel/config → whitelabel_config table
```

### API Routes — Modular pattern
New endpoints: create `server/{feature}-routes.js`, import in `server/app.js`
```javascript
// server/app.js
import * as featureRoutes from './feature-routes.js';
featureRoutes.configurarRutas(app);
```

### Report Types → Update `DEPENDENCIA_POR_TIPO`
Adding new report types requires updating the mapping in `server/auth_middleware.js`

### Input Validation
Use existing helpers in `server/app.js`:
- `validarCoordenadas(lat, lng)` — validates geo bounds (-90/90, -180/180)
- `normalizeTipos(raw)` — handles array/string/comma-separated types

### Geocoding — Rate limited
```javascript
import { reverseGeocode } from './geocoding-service.js';
// Uses Nominatim (OSM) — 1 req/sec limit enforced internally
// Returns: { colonia, codigo_postal, municipio, estado, pais }
```

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
res.status(404).json({ error: 'No encontrado' });
```

### Route Order Matters
```javascript
// ⚠️ Specific routes BEFORE parameterized routes
app.get('/api/reportes/tipos', ...);        // ✅ First
app.get('/api/reportes/mis-reportes', ...); // ✅ Second
app.get('/api/reportes/:id', ...);          // ✅ Last (catches all)
```

---

## 🧪 Test Structure

| Layer | Config | Command | Location |
|-------|--------|---------|----------|
| Backend (Jest) | `config/jest.config.cjs` | `npm run test:unit` | `tests/backend/*.test.js` |
| Frontend (Vitest) | `config/vitest.config.ts` | `npm run test:front` | `tests/frontend/*.spec.jsx` |
| E2E (Playwright) | `config/playwright.config.ts` | `npm run test:e2e` | `tests/e2e/*.spec.ts` |

### E2E Test Pattern
```typescript
// Login helper - wait 6s for splash screen
await page.goto('/');
await page.waitForTimeout(6000);
await page.click('button:has-text("Iniciar Sesión")');

// Get token in E2E
const token = await page.evaluate(() => localStorage.getItem('auth_token'));
```

### Responsive Viewports (E2E)
```typescript
const VIEWPORTS = {
  mobile:      { width: 375,  height: 667  },
  mobileLarge: { width: 428,  height: 926  },
  tablet:      { width: 768,  height: 1024 },
  desktop:     { width: 1280, height: 800  },
  largeDesktop:{ width: 1920, height: 1080 }
};
await page.setViewportSize(VIEWPORTS.mobile);
```

**E2E requires fresh build:** Run `cd client && npm run build` before `npm run test:e2e`

---

## ⚠️ Common Errors

| Symptom | Cause → Fix |
|---------|-------------|
| `SQLITE_ERROR: no such table` | DB not initialized → `cd server && npm run init` |
| `401 Unauthorized` on admin | Wrong key → use `localStorage.getItem('auth_token')` |
| `No se encontro supervisor` | Wrong dept → use `req.usuario.dependencia` not `reporte.dependencia` |
| E2E flaky/failing | Stale build → `cd client && npm run build` before E2E |
| `ERR_DLOPEN_FAILED` in Docker | Windows binaries → ensure `.dockerignore` has `**/node_modules` |
| Map infinite re-render | useState for map → use `useRef` for Leaflet instances |
| Geocoding timeout | Rate limit hit → service auto-throttles to 1 req/sec |
| Route not matching | Wrong order → specific routes before `/:id` wildcards |

---

## 📈 Performance & Database

### SQLite Optimizations (auto-configured in db.js)
```javascript
PRAGMA journal_mode = WAL;      // Write-Ahead Logging for concurrency
PRAGMA synchronous = NORMAL;    // Balance speed/safety
PRAGMA cache_size = 10000;      // 10MB cache
PRAGMA temp_store = MEMORY;     // Temp tables in RAM
```

### Indexes (defined in schema.sql)
```sql
idx_reportes_lat_lng       -- Geo queries
idx_reportes_tipo          -- Filter by type
idx_reportes_estado        -- Filter by status
idx_reportes_dependencia   -- Filter by department
idx_usuarios_email         -- Login lookup
idx_sesiones_token         -- Token validation
```

### Database Migrations
```powershell
# Apply migration (example)
node server/migrations/aplicar-migracion-002.js

# Migration files: server/migrations/*.sql
# Pattern: ALTER TABLE ... ADD COLUMN (idempotent with IF NOT EXISTS)
```

---

## 🐳 Docker Deployment

```powershell
# Build (MUST use --platform + --no-cache for cross-platform)
docker build --platform linux/amd64 --no-cache -t citizen-reports:latest .

# Deploy to production
docker save citizen-reports:latest -o "$env:TEMP\citizen-reports.tar"
scp "$env:TEMP\citizen-reports.tar" root@145.79.0.77:/tmp/
ssh root@145.79.0.77 "docker load -i /tmp/citizen-reports.tar && cd /root/citizen-reports && docker compose -f docker-compose.prod.yml up -d"
```

**Pre-flight:** Verify `.dockerignore` contains `**/node_modules`

---

## 🌍 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PATH` | `server/data.db` | SQLite database location (relative to CWD) |
| `PORT` | `4000` | Express server port |
| `VITE_API_URL` | `http://localhost:4000` | API target for Vite proxy |
| `NODE_ENV` | `development` | `production` enables static serving |

---

## 📁 File Placement

| Type | Location |
|------|----------|
| Backend routes | `server/*-routes.js` |
| React components | `client/src/*.jsx` |
| Tests | `tests/{backend,frontend,e2e}/` |
| Test configs | `config/` |
| Migrations | `server/migrations/*.sql` |
| Architecture docs | `docs/adr/ADR-*.md` |

**🚫 Root directory:** Only README.md, package.json, CHANGELOG.md, config files

---

## 🎯 Gotchas & Pro Tips

| Pattern | Rule |
|---------|------|
| **JSON columns** | Parse with try/catch: `JSON.parse(row.asignaciones) \|\| []` |
| **Tile failures** | Return 200 + transparent PNG fallback, NOT error |
| **Hash routing** | Navigate with `window.location.hash = '#panel'` |
| **Audit trail** | All changes → `historial_cambios` table with IP/user_agent |
| **Console logs** | Use emoji prefixes: `✅ ❌ 📨 📍 ⚠️` for quick scanning |
| **DB Path resolution** | `DB_PATH` relative to CWD, not `__dirname` |
| **Splash screen** | Wait 6s in E2E before interacting |
| **Deprecation headers** | RFC 8594: `Deprecation: true` + `Sunset` + `Link` |

---

## 📚 Key References

| Resource | Path |
|----------|------|
| **📋 User Stories** | `.github/USER_STORIES.md` |
| Database schema (9 tables) | `server/schema.sql` |
| DB singleton + init | `server/db.js` |
| Auth middleware + roles | `server/auth_middleware.js` |
| Main Express app | `server/app.js` |
| WhiteLabel context | `client/src/WhiteLabelContext.jsx` |
| Geocoding service | `server/geocoding-service.js` |
| Vite proxy config | `client/vite.config.js` |
| Architecture decisions | `docs/adr/ADR-*.md` |

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

| Gap | Prioridad | Story |
|-----|-----------|-------|
| ❌ Rate Limiting en login | 🔴 Crítica | US-SEC02 |
| ❌ Política de passwords | 🟡 Alta | US-SEC02 |
| ❌ Session timeout por inactividad | 🟡 Alta | US-SEC02 |
| ❌ Protección CSRF | 🟡 Alta | - |
| ⚠️ Sanitización XSS parcial | 🟡 Alta | US-SEC04 |
