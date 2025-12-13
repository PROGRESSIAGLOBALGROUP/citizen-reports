# citizen-reports — AI Coding Agent Instructions

> **Civic-tech heatmap platform** for municipal incident reporting  
> React 18 + Leaflet | Express 4 + SQLite | Docker Swarm

---

## 🚦 Quick Start

```powershell
.\start-dev.ps1              # Dev: installs deps, inits DB, starts both servers
.\start-prod.ps1 -Build      # Prod: build + serve on :4000
.\stop-servers.ps1           # Kill all dev processes
.\deploy.ps1                 # Deploy to 145.79.0.77 (30 sec)
```

**Tests:** `npm run test:unit` (Jest) | `npm run test:front` (Vitest) | `npm run test:e2e` (Playwright)

---

## 🏗️ Architecture

```
┌──────────────┐   Vite proxy /api   ┌───────────────┐
│ React SPA    │ ─────────────────▶  │ Express API   │
│ client/src/  │   fetch + JSON      │ server/app.js │
└──────────────┘ ◀─────────────────  └───────┬───────┘
                                             │ getDb()
                                    ┌────────▼────────┐
                                    │ SQLite data.db  │
                                    └─────────────────┘
```

- **Routes pattern:** `server/*-routes.js` → exports `configurarRutas(app)` or handlers
- **Route registration:** All in `server/app.js` via `configurarRutas*()` calls
- **NEVER** cross-import between `server/` and `client/`. ESM only.

---

## 🧩 Critical Patterns

### Database — ALWAYS singleton
```javascript
import { getDb } from './db.js';
const db = getDb();  // ✅ NEVER new sqlite3.Database() — breaks tests and leaks handles
```

### Auth — Token storage key
```javascript
localStorage.getItem('auth_token')  // ✅ NOT 'token' — causes silent 401s
```

### Auth chain for protected routes
```javascript
app.get('/api/admin/thing', requiereAuth, requiereRol(['admin']), handler);
// requiereAuth adds req.usuario { id, email, dependencia, rol }
```

### Role-based filtering (CRITICAL for funcionario/supervisor)
```javascript
// funcionario/supervisor: MUST filter by their department
const sql = 'SELECT * FROM reportes WHERE dependencia = ?';
db.all(sql, [req.usuario.dependencia], callback);  // ✅ Use req.usuario.dependencia

// admin: NO filter (sees everything)
db.all('SELECT * FROM reportes', [], callback);
```

### Report → Department mapping
```javascript
import { DEPENDENCIA_POR_TIPO } from './auth_middleware.js';
// Maps report types to departments: 'bache' → 'obras_publicas'
```

### Leaflet — Prevent re-renders
```javascript
const mapRef = useRef(null);       // ✅ DOM container
const mapInstance = useRef(null);  // ✅ L.map instance
// NEVER use useState for Leaflet — causes infinite re-renders
```

### API Route Order — Specific before parameterized
```javascript
app.get('/api/reportes/tipos', ...);        // ✅ Specific first
app.get('/api/reportes/mis-reportes', ...);
app.get('/api/reportes/:id', ...);          // ✅ Parameterized LAST
```

### Cascading Deletes (admin entities)
```javascript
// 1. Check dependents
GET  /api/admin/dependencias/:id/usuarios
// 2. Reassign + soft-delete
POST /api/admin/dependencias/:id/reasignar-y-eliminar
```

---

## 🛡️ Security Patterns

```javascript
// ✅ Always parameterized queries
db.get('SELECT * FROM usuarios WHERE email = ?', [email]);

// ❌ NEVER string interpolation — SQL injection risk
db.get(`SELECT * FROM usuarios WHERE email = '${email}'`);
```

- **Validation helpers:** `validarCoordenadas(lat, lng)`, `normalizeTipos(raw)` in `app.js`
- **API errors:** Always `res.status(4xx).json({ error: 'Message' })`
- **Rate limiting:** Auto-applied via `apiRateLimiter` middleware, bypassed in `NODE_ENV=test`
- **Sensitive fields encrypted:** See `SENSITIVE_FIELDS` in `security.js`

---

## 🧪 Testing

| Layer | Command | Location |
|-------|---------|----------|
| Backend | `npm run test:unit` | `tests/backend/*.test.js` |
| Frontend | `npm run test:front` | `tests/frontend/*.spec.jsx` |
| E2E | `npm run test:e2e` | `tests/e2e/*.spec.ts` |

### E2E — Required pattern for authentication
```typescript
import { loginViaAPIAndSetToken, USERS } from './fixtures/login-helper';
await loginViaAPIAndSetToken(page, USERS.admin);
await page.waitForTimeout(6000);  // REQUIRED: Wait for splash screen
```

### E2E — Pre-requisites
```powershell
cd client && npm run build   # MUST rebuild before E2E
npm run test:e2e             # Uses isolated e2e.db
```

---

## ⚠️ Common Errors

| Symptom | Fix |
|---------|-----|
| `SQLITE_ERROR: no such table` | `cd server && npm run init` |
| `401 Unauthorized` on admin | Use `'auth_token'` not `'token'` in localStorage |
| `No se encontro supervisor` | Use `req.usuario.dependencia` for queries |
| Map infinite re-render | Use `useRef` not `useState` for Leaflet |
| Route 404 but exists | Move specific routes before `/:id` params |
| E2E flaky/fails | Rebuild client: `cd client && npm run build` |
| Port 4000 busy | `.\stop-servers.ps1` or `npx kill-port 4000` |

---

## 📁 File Placement

| Type | Location | Naming |
|------|----------|--------|
| Backend routes | `server/` | `*-routes.js` |
| React components | `client/src/` | `*.jsx` |
| Backend tests | `tests/backend/` | `*.test.js` |
| Frontend tests | `tests/frontend/` | `*.spec.jsx` |
| E2E tests | `tests/e2e/` | `*.spec.ts` |
| Migrations | `server/migrations/` | `###-description.sql` |

---

## 📚 Key Files

| Purpose | Path |
|---------|------|
| DB schema | `server/schema.sql` |
| DB singleton | `server/db.js` |
| Main Express app | `server/app.js` |
| Auth middleware | `server/auth_middleware.js` |
| Security helpers | `server/security.js` |
| Type→Dept mapping | `DEPENDENCIA_POR_TIPO` in `auth_middleware.js` |
| WhiteLabel context | `client/src/WhiteLabelContext.jsx` |
| E2E login helper | `tests/e2e/fixtures/login-helper.ts` |
| Vite config + proxy | `client/vite.config.js` |

---

## 🔄 Adding New Features

### New API endpoint
1. Create `server/feature-routes.js` with handler functions
2. Export `configurarRutasFeature(app)` or individual handlers
3. Import and register in `server/app.js`
4. Add tests in `tests/backend/feature.test.js`

### New React component
1. Create `client/src/FeatureName.jsx`
2. Use `useWhiteLabel()` for theming if needed
3. Add tests in `tests/frontend/FeatureName.spec.jsx`

### New DB table
1. Add CREATE TABLE in `server/schema.sql`
2. Create migration in `server/migrations/###-description.sql`
3. Run `cd server && npm run init`
