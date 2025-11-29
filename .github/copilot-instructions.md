# citizen-reports Heatmap Platform - Copilot Instructions

**Last Updated:** November 29, 2025 | **Status:** Production Live | **Server:** http://145.79.0.77:4000

---

## EXECUTIVE CONTEXT

Civic-tech transparency platform for municipal incident reporting in Mexico. Citizens report urban issues (potholes, broken streetlights, etc.) to a geolocated heatmap; government staff manages incident resolution and tracks progress through role-based admin/supervisor/funcionario workflows.

**Tech Stack:** React 18 + Leaflet (frontend) | Express 4 + SQLite (backend) | Docker on Ubuntu VPS  
**Key Features:** Geolocation heatmaps, authentication, multi-department workflows, audit trails, responsive mobile design

---

## FILE CREATION PROTOCOL (CRITICAL)

**Authority:** `.meta/FILE_STRUCTURE_PROTOCOL.md` governs all file placement.

**Before creating ANY file:**

1. **Identify type:** Documentation? Script? Code? Config?
2. **Check protocol:** Does `.meta/FILE_STRUCTURE_PROTOCOL.md` allow this location?
3. **Place correctly:**
   - Code: `/server/` (backend) or `/client/` (frontend)
   - Tests: `/tests/`
   - Docs: `/docs/` + subdirectory (guides/, technical/, deployment/, adr/)
   - Scripts: `/scripts/`
   - Governance: `.meta/`
   - GitHub config: `.github/`

**Forbidden:** NO files in root except README.md, package.json, LICENSE, .gitignore, CHANGELOG.md

---

## CRITICAL WORKFLOWS

### Development (TDD Pattern - Test First!)

```powershell
# 1. Full environment startup (recommended)
.\start-dev.ps1                    # Opens persistent windows with auto-restart

# 2. Manual alternative
cd server && npm install && npm run init    # Initialize DB from schema.sql
npm run dev                                 # Starts on port 4000
# (in another terminal)
cd ../client && npm install && npm run dev  # Vite on port 5173, proxies /api to :4000

# 3. Write & validate (TDD workflow from docs/tdd_philosophy.md)
npm run test:all                   # Lint + Jest + Vitest + Playwright (rebuilds SPA, resets e2e.db)
# Only commit when test:all passes 100%
```

**Critical:** `npm run init` REQUIRED before first dev/test run—creates data.db from schema.sql

### Production Build & Deploy

```powershell
# Option 1: Docker Deploy (RECOMMENDED - Nov 2025+)
# Build image locally
docker build --platform linux/amd64 --no-cache -t citizen-reports:latest .

# Export and upload to server
docker save citizen-reports:latest -o "$env:TEMP\citizen-reports.tar"
scp "$env:TEMP\citizen-reports.tar" root@145.79.0.77:/tmp/citizen-reports.tar

# SSH to server and deploy
ssh root@145.79.0.77
docker load -i /tmp/citizen-reports.tar
cd /root/citizen-reports
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# Option 2: Legacy PM2 (deprecated)
.\deploy.ps1 -Message "Feature: your message"  # Builds, deploys, validates in 30s
```

**Production Stack:** Docker container with health checks, resource limits, and graceful shutdown

### Database Operations

```powershell
npm run init              # Initialize/reset schema (idempotent, safe)
npm run backup:db         # Backup to backups/data-TIMESTAMP.db
npm run smoke:tiles       # Verify tile proxy health
npm run maintenance       # Encapsulated: backup + smoke test + system checks
```

---

## ARCHITECTURE AT A GLANCE

### Components & Data Flow

```
┌─────────────────┐         REST/JSON      ┌──────────────────┐
│ React SPA       │ ◄─────────────────────► │ Express App      │
│ (Leaflet map)   │    VITE dev proxy      │ + auth + routes  │
└────────┬────────┘    or fetch() prod     └────────┬─────────┘
         │                                          │
         └──────────────┬───────────────────────────┘
                        │ Single Node process
                        ▼
                   SQLite: data.db
                (99 prepared statements)
```

**Key:** Frontend + backend are STRICTLY SEPARATED. No cross-imports (server/client).

### Database Schema (9 Core Tables)

| Table                | Purpose                              | Key Fields                                     |
| -------------------- | ------------------------------------ | ---------------------------------------------- |
| `reportes`           | Citizen reports                      | lat, lng, tipo, estado, peso (heatmap weight)  |
| `usuarios`           | Staff (admin/supervisor/funcionario) | email, rol, dependencia, password_hash         |
| `sesiones`           | Token-based auth                     | token (unique), expira_en, usuario_id          |
| `tipos_reporte`      | Dynamic report categories            | tipo (slug), nombre, categoria_id, dependencia |
| `categorias`         | Category groupings                   | nombre (Obras Públicas, Servicios, etc.)       |
| `dependencias`       | Municipal departments                | slug (obras_publicas, etc.), nombre, icono     |
| `asignaciones`       | Report → funcionario assignments     | reporte_id, usuario_id (many-to-many)          |
| `cierres_pendientes` | Closure workflow                     | reporte_id, supervisor_id, aprobado flag       |
| `historial_cambios`  | Unified audit trail (ADR-0010)       | entidad, tipo_cambio, valor_anterior/nuevo     |

**Indexes:** All critical queries indexed (location, tipo, estado, dependencia, token)

### Authentication Pattern

**Token-based with bcrypt hashing:**

- Test users (all password: `admin123`):
  - admin@jantetelco.gob.mx (role: admin, dept: administracion)
  - supervisor.obras@jantetelco.gob.mx (role: supervisor, dept: obras_publicas)
  - func.obras1@jantetelco.gob.mx (role: funcionario, dept: obras_publicas)

**Storage:** `localStorage.getItem('auth_token')` (NOT 'token'—common bug!)

**Middleware stack:** `requiereAuth → requiereRol(['admin', 'supervisor']) → route handler`

---

## PROJECT-SPECIFIC PATTERNS

### File Boundaries (STRICTLY Enforced)

- `server/**` - Backend only (Express, DB, validation)
- `client/**` - Frontend only (React, Leaflet, UI)
- `tests/backend/**` - Jest + Supertest tests
- `tests/frontend/**` - Vitest + Testing Library tests
- `tests/e2e/**` - Playwright tests
- `ai/**` - Agent prompts and governance
- `scripts/**` - Operational tooling
- `docs/**` - Architecture, ADRs, API specs

Violation example: importing server/db.js into client/src/App.jsx (NOT OK)

### Database Access Pattern

ALWAYS use getDb() wrapper:

```javascript
import { getDb } from './db.js';

const db = getDb();
db.all('SELECT * FROM reportes WHERE tipo = ?', [tipo], (err, rows) => {
  // Handle results
});
```

Never instantiate sqlite3.Database directly.

### Frontend State Management

Vanilla React - no Redux, no Context API. Leaflet map stored in useRef (NOT state) to prevent re-renders:

```javascript
const mapRef = useRef(null);
useEffect(() => {
  if (!mapRef.current) {
    mapRef.current = L.map('map').setView([lat, lng], zoom);
  }
}, []);
```

**Hash-based routing:** Views controlled by window.location.hash

- `#reportar` → Report creation form
- `#panel` → Funcionario dashboard (requires auth)
- `#admin` → Admin panel (requires admin role)
- `#reporte/{id}` → Detail view
- Default (`#`) → Interactive map

### API Validation & Type Mapping

**Reusable validation functions** (in server/app.js and auth_middleware.js):

```javascript
// Coordinate validation: lat [-90, 90], lng [-180, 180]
function validarCoordenadas(lat, lng) {
  const a = Number(lat),
    o = Number(lng);
  if (Number.isNaN(a) || Number.isNaN(o)) return false;
  if (a < -90 || a > 90) return false;
  if (o < -180 || o > 180) return false;
  return true;
}

// Type normalization (handles arrays or comma-separated)
function normalizeTipos(raw) {
  if (!raw) return [];
  const values = Array.isArray(raw) ? raw : String(raw).split(',');
  const unique = new Set();
  values.forEach((v) => {
    const trimmed = String(v).trim();
    if (trimmed) unique.add(trimmed);
  });
  return Array.from(unique);
}

// ISO date validation
function isIsoDate(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
```

**Type-to-Department Mapping:** In server/auth_middleware.js `DEPENDENCIA_POR_TIPO` object maps all 38 report type variants to departments (e.g., `'baches': 'obras_publicas'`, `'agua': 'agua_potable'`). Always update this when adding new types.

**Middleware Composition:** Stack `requiereAuth` + `requiereRol(['admin', 'supervisor'])` on protected routes:

```javascript
app.post(
  '/api/reportes/:id/asignaciones',
  requiereAuth,
  requiereRol(['admin', 'supervisor']),
  routeHandler
);
```

---

## COMMON PITFALLS TO AVOID

### Critical Bugs from Recent Incidents

**localStorage Key Bug (Oct 8 - Fixed)**

- ❌ WRONG: `localStorage.getItem('token')`
- ✅ RIGHT: `localStorage.getItem('auth_token')`
- Impact: All authenticated requests fail silently on frontend

**Column Name Bug (Oct 8 - Fixed)**

- ❌ WRONG: Query SQL `tipos_reporte.slug` or property `tipo?.slug`
- ✅ RIGHT: Use column `tipo` from schema: `tipos_reporte.tipo` or `tipo.tipo`
- Impact: Type editing crashes, 500 errors on admin panel

**Interdepartmental Query Bug (Oct 5 - Fixed)**

- ❌ WRONG: `obtenerSupervisor(reporte.dependencia)` when funcionario is from different dept
- ✅ RIGHT: Always use `obtenerSupervisor(req.usuario.dependencia)`
- Impact: "No se encontro supervisor" error on cross-dept closures

**Payload Size Bug (Oct 4 - Fixed)**

- ❌ WRONG: Sending signature + 3 photos (>960KB) with default 1MB limit
- ✅ RIGHT: Express JSON body limit set to 5MB in app.js
- Impact: 413 Payload Too Large errors on closure requests

### General Don'ts

- ❌ Mix server and client imports (violates architecture)
- ❌ Skip `npm run init` before testing (causes "no such table" errors)
- ❌ Run E2E without rebuild (stale UI, test failures)
- ❌ Fetch external resources directly (violates CSP - use `/tiles/` proxy instead)
- ❌ Use `require()` syntax (project is ESM-only: `import/export`)
- ❌ Create files in root (breaks `.meta/FILE_STRUCTURE_PROTOCOL.md`)
- ❌ Instantiate `sqlite3.Database()` directly (use `getDb()` wrapper)
- ❌ Use `useState` for Leaflet map (use `useRef` to prevent re-renders)

### General Do's

- ✅ Use `getDb()` for ALL database operations
- ✅ Run `npm run test:all` before marking work complete
- ✅ Add tests for new endpoints (unit + e2e if UI-facing)
- ✅ Reuse validation functions: `validarCoordenadas()`, `normalizeTipos()`, `isIsoDate()`
- ✅ Check `docs/BUGFIX_*.md` files for recent fixes & patterns
- ✅ Verify interdepartmental queries use `req.usuario.dependencia`
- ✅ Consult `server/schema.sql` before writing SQL
- ✅ Check `server/auth_middleware.js` `DEPENDENCIA_POR_TIPO` when adding report types

---

## TESTING APPROACH (TDD)

Workflow (from docs/tdd_philosophy.md):

1. **Red:** Write failing test describing desired behavior
2. **Green:** Implement minimum code to pass test
3. **Refactor:** Clean up while keeping tests green
4. **Validate:** npm run test:all before committing

Three-tier test separation:

1. **Backend (Jest):** tests/backend/ - uses temp SQLite DBs per suite
2. **Frontend (Vitest):** tests/frontend/ - jsdom + mocked fetch
3. **E2E (Playwright):** tests/e2e/ - uses dedicated e2e.db

---

## RECENT CRITICAL BUGFIXES (Learn From These!)

### Admin Panel Type Editing Crash (Oct 8)

Problem: Admin panel crashed when editing report types

Root causes:

- Frontend used localStorage.getItem('token') instead of 'auth_token' - all admin requests failed
- Backend used 'slug' column name but schema defines 'tipo' - SQL errors
- Wrong property mapping: tipo?.slug instead of tipo.tipo

Lesson: Always use 'auth_token' key, check schema column names, verify object property paths

### Interdepartmental Closure Bug (Oct 5)

Problem: "No se encontro supervisor" error when funcionario requested closure on interdepartmental assignments

Root cause: Code used obtenerSupervisor(reporte.dependencia) but should use obtenerSupervisor(req.usuario.dependencia)

Lesson: Use req.usuario.dependencia NOT reporte.dependencia for interdepartmental queries

### Payload Size Limit (Oct 4)

Problem: Closure requests with signatures + 3 photos failed (960KB exceeded 1MB limit)

Solution: Increased Express JSON body limit from 1MB to 5MB

Lesson: Consider real-world data sizes (signatures, photos, base64 encoding overhead)

---

## ARCHITECTURE DECISIONS (ADRs)

Key decisions documented in docs/adr/:

- ADR-0001: Bootstrap architecture
- ADR-0006: Many-to-many report assignment system
- ADR-0009: Database-driven types and categories (not hardcoded)
- ADR-0010: Unified audit trail (historial_cambios table)

Always check ADRs before proposing structural changes.

---

## DEPLOYMENT ARCHITECTURE

Production setup (145.79.0.77):

- **Container:** Docker with `docker-compose.prod.yml`
- **Image:** `citizen-reports:latest` (~93MB compressed)
- **Frontend:** Built SPA served from `/app/server/dist/`
- **Backend:** Express API on port 4000
- **Database:** SQLite at `/app/data/data.db` (mounted volume)
- **Health Check:** `curl http://localhost:4000/api/reportes?limit=1`
- **Network:** easypanel external network

Docker Deployment flow:

1. Build image locally with `--platform linux/amd64`
2. Export with `docker save` → tarball
3. SCP tarball to server `/tmp/`
4. SSH to server, `docker load`, `docker compose up -d`
5. Verify health: `docker ps` shows "(healthy)"

---

## DOCKER DEPLOYMENT CRITICAL ERRORS (Nov 2025)

### ERR_DLOPEN_FAILED: Exec format error (CRITICAL)

**Symptom:** Container starts but immediately exits with:

```
Error loading shared library node_sqlite3.node: Exec format error
code: 'ERR_DLOPEN_FAILED'
```

**Root Causes (3 combined failures):**

1. **Wrong IP address:** User provided `145.79.0.7` but correct is `145.79.0.77`
   - Always verify IP from documentation before SSH/SCP

2. **Missing `**/node_modules` in .dockerignore:\*\*
   - `.dockerignore` had `node_modules` (root only)
   - `server/node_modules/` from Windows host was copied into image
   - Windows-compiled sqlite3 binaries don't work on Linux
   - **FIX:** Add `**/node_modules` to `.dockerignore`

3. **Docker cache with wrong architecture:**
   - Docker Desktop may cache layers from wrong platform
   - **FIX:** Use `docker builder prune -af` then `--no-cache`

**Complete Solution:**

```powershell
# 1. Ensure .dockerignore has: **/node_modules
# 2. Clear Docker cache
docker builder prune -af

# 3. Build with explicit platform and no cache
docker build --platform linux/amd64 --no-cache -t citizen-reports:latest .

# 4. Verify context size is ~4MB (not 86MB)
# If context is large, node_modules are being included

# 5. Export, upload, deploy
docker save citizen-reports:latest -o "$env:TEMP\citizen-reports.tar"
scp "$env:TEMP\citizen-reports.tar" root@145.79.0.77:/tmp/
ssh root@145.79.0.77 "docker load -i /tmp/citizen-reports.tar && cd /root/citizen-reports && docker compose -f docker-compose.prod.yml down && docker compose -f docker-compose.prod.yml up -d"
```

**Verification:**

- `docker ps` should show "(healthy)" after 40s
- `curl http://localhost:4000/api/reportes?limit=1` should return JSON

---

## VALIDATION & QUALITY GATES

Pre-commit (Husky + lint-staged):

- ESLint (no warnings)
- Prettier auto-format

Pre-merge (CI/manual):

- npm run test:all must pass 100%

Security checklist before committing:

- Database queries use prepared statements (no string concatenation)
- All inputs validated (coordinates, dates, types)
- Authentication required for non-public endpoints
- Passwords hashed (bcrypt)
- Session tokens expire (24h default)
- CORS configured
- CSP headers set
- No PII in logs

---

## HELP & DOCUMENTATION

Key reference files:

- **Architecture:** docs/architecture.md
- **API docs:** docs/api/openapi.yaml
- **Auth system:** docs/SISTEMA_AUTENTICACION.md
- **Database schema:** server/schema.sql
- **ADRs:** docs/adr/ADR-\*.md
- **Scripts:** docs/technical/SCRIPTS_SERVIDORES.md
- **Deployment:** docs/deployment/DEPLOYMENT_PROCESS.md
- **File structure:** .meta/FILE_STRUCTURE_PROTOCOL.md
- **Master index:** docs/INDEX.md

---

## COMMON ERRORS & SOLUTIONS

| Error                                  | Root Cause                     | Solution                                                          |
| -------------------------------------- | ------------------------------ | ----------------------------------------------------------------- |
| SQLITE_ERROR: no such table            | DB not initialized             | cd server && npm run init                                         |
| Cannot find module './db.js'           | Wrong import in client         | Move DB logic to server/, use API calls                           |
| 401 Unauthorized on admin              | Wrong token key                | Use localStorage.getItem('auth_token')                            |
| table tipos_reporte has no column slug | Wrong column name              | Use 'tipo' column (check schema.sql)                              |
| No se encontro supervisor              | Using reporte.dependencia      | Use req.usuario.dependencia                                       |
| E2E tests fail stale UI                | Frontend not rebuilt           | cd client && npm run build                                        |
| Port 4000 already in use               | Server still running           | .\stop-servers.ps1                                                |
| TypeError: map.setView undefined       | Leaflet map in state           | Use useRef for map, not useState                                  |
| ESLint warnings on commit              | Pre-commit hook active         | Run npm run lint:fix                                              |
| ERR_DLOPEN_FAILED: Exec format error   | Windows node_modules in Docker | Add `**/node_modules` to .dockerignore, rebuild with `--no-cache` |
| Docker context size 86MB+              | Including node_modules         | Check .dockerignore has `**/node_modules`                         |
| SCP connection timeout                 | Wrong IP address               | Verify IP is 145.79.0.77 (not .7)                                 |
| Container exits immediately            | sqlite3 binary mismatch        | `docker builder prune -af` + `--platform linux/amd64 --no-cache`  |

---

## DOCKER BUILD CHECKLIST (MANDATORY)

Before every Docker deployment:

- [ ] Verify `.dockerignore` contains `**/node_modules`
- [ ] Check build context size is ~4MB (not 86MB+)
- [ ] Use `--platform linux/amd64` flag
- [ ] Use `--no-cache` after any dependency changes
- [ ] Verify server IP: `145.79.0.77` (NOT 145.79.0.7)
- [ ] After deploy, wait 40s then verify `docker ps` shows "(healthy)"
