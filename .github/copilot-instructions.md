# Jantetelco Heatmap Platform - AI Coding Agent Instructions

**Last Updated:** November 4, 2025 | **Status:** Production Live | **Server:** http://145.79.0.77:4000

---

## EXECUTIVE CONTEXT (Read First!)

Civic-tech transparency platform for municipal incident reporting in Mexico. Citizens report urban issues (potholes, broken streetlights, etc.) to a geolocated heatmap; government staff manages closures and tracks progress.

- **Frontend:** React 18 + Leaflet heatmaps (Vite SPA)
- **Backend:** Express 4 + SQLite (single Node process)
- **Deployment:** PM2 on VPS at 145.79.0.77:4000 with GitHub webhook auto-deploy
- **Current:** Mobile-responsive, admin panels, auth system, audit trails

---

## FILE CREATION PROTOCOL (CRITICAL)

Before creating ANY file, follow this sequence:

1. Identify: file name, type, purpose
2. Consult: `.meta/FILE_STRUCTURE_PROTOCOL.md` (authority)
3. Verify: is location allowed?
4. Decide: where does it belong?
   - Documentation: /docs/
   - Governance: .meta/
   - Deployment: /docs/deployment/
   - Scripts: /scripts/
   - Code: /server/ or /client/
   - Tests: /tests/
5. Create: use full path (NEVER root unless approved)
6. Confirm: not in root unless explicitly allowed

Forbidden:
- NO files in root (except: README.md, package.json, LICENSE, ecosystem.config.cjs)
- NO multiple files without checking each one
- NO assuming location - ALWAYS consult protocol first

---

## CRITICAL WORKFLOWS

### Development Setup

```powershell
# Quick start (recommended - opens persistent windows)
.\start-dev.ps1

# Manual: Backend (API on port 4000)
cd server
npm install
npm run init              # Initialize SQLite from schema.sql
npm run dev

# Manual: Frontend (Vite on port 5173, proxies /api to :4000)
cd ../client
npm install
npm run dev
```

**Key:** npm run init is REQUIRED before first dev/test run - creates data.db

### Testing & Quality Gates

```powershell
npm run test:all        # Lint + Jest + Vitest + Playwright (rebuilds SPA, resets e2e.db)
npm run test:unit       # Jest backend only
npm run test:front      # Vitest frontend only
npm run test:e2e        # Playwright with isolated e2e.db
```

### Production Build and Deploy

```powershell
# Build frontend
cd client && npm run build    # Outputs to client/dist/

# Deploy to production (30 seconds)
scp -r client/dist/* root@145.79.0.77:/root/citizen-reports/server/dist/
ssh root@145.79.0.77 "cd /root/citizen-reports && pm2 restart citizen-reports-app"

# Or use automation script
.\deploy.ps1 -Message "Deployment message"

# Test production locally
.\start-prod.ps1 -Build      # Single Node process serves API + SPA on :4000
```

### Database Operations

```powershell
cd server && npm run init           # Initialize/reset schema (idempotent)
npm run backup:db                   # Backup to backups/data-TIMESTAMP.db
npm run smoke:tiles                 # Verify tile proxy health
npm run maintenance                 # Backup + smoke test + checks
```

---

## TECHNICAL ARCHITECTURE

### Key Components

```
┌──────────────┐         REST/JSON          ┌───────────────┐
│ React SPA    │  ───────────────────────▶ │ Express API    │
│  (Leaflet)   │    VITE proxy / fetch     │  + SQLite DB   │
└─────┬────────┘ ◀───────────────────────  └─────────┬──────┘
      │               Static assets (dist)            │
      └──────────────┬────────────────────────────────┘
                     │  Single Node process serves API + SPA
                     ▼
                SQLite data.db (reportes)
```

### Database Schema (Key Tables)

- `reportes` - citizen reports with geo coords (lat, lng), type, state
- `usuarios` - staff users with role (admin/supervisor/funcionario) and department
- `sesiones` - token-based auth with expiry
- `asignaciones` - many-to-many report assignments to funcionarios
- `cierres_pendientes` - closure workflow with supervisor approval
- `tipos_reporte` - dynamic report types (database-driven, not hardcoded)
- `categorias` - groupings for types
- `dependencias` - government departments
- `historial_cambios` - audit trail for all changes

### Authentication

Token-based with bcrypt. Test users (password: admin123):

| Email | Role | Department |
|-------|------|-----------|
| admin@jantetelco.gob.mx | admin | administracion |
| supervisor.obras@jantetelco.gob.mx | supervisor | obras_publicas |
| func.obras1@jantetelco.gob.mx | funcionario | obras_publicas |

Token stored as auth_token in localStorage (NOT token).

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

Hash-based routing: #reportar (form), #panel (dashboard), #admin (user admin), #reporte/ID (detail)

### API Validation Functions

Project-specific validation (reuse these):

```javascript
// Coordinate validation: lat [-90, 90], lng [-180, 180]
function validarCoordenadas(lat, lng) {
  const a = Number(lat), o = Number(lng);
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
  values.forEach(v => {
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

---

## COMMON PITFALLS TO AVOID

DO NOT:

- Mix server and client imports
- Skip npm run init before testing (causes "no such table" errors)
- Run E2E tests without fresh build
- Fetch external resources directly (violates CSP - use /tiles/ proxy)
- Use require() syntax (project uses ESM import/export only)
- Use localStorage.getItem('token') - correct key is 'auth_token'
- Use 'slug' column for tipos_reporte - correct column is 'tipo'
- Use reporte.dependencia for interdepartmental queries - use req.usuario.dependencia
- Manually edit files when code_surgeon workflow is available

DO:

- Use getDb() for all database operations
- Run npm run test:all before considering work complete
- Add tests for new endpoints (unit + e2e if UI-facing)
- Use validarCoordenadas(), normalizeTipos() for consistency
- Check docs/BUGFIX_*.md files for recent fixes
- Verify supervisor queries use req.usuario.dependencia not reporte.dependencia
- Check server/schema.sql for correct column names before writing SQL

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

- Frontend: Built SPA in /root/citizen-reports/server/dist/
- Backend: Express serving API + static SPA from single process
- Database: SQLite at /root/citizen-reports/data.db
- Process manager: PM2 (app: citizen-reports-app)
- Webhook: Separate webhook-server on port 3000 for GitHub auto-deploy

Deployment flow:

1. Developer pushes to GitHub main
2. GitHub sends webhook to 145.79.0.77:3000/webhook
3. Webhook server verifies signature, executes /root/deploy.sh
4. Deploy script: git pull, npm install, npm run build, pm2 restart
5. App reloads with new code

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
- **ADRs:** docs/adr/ADR-*.md
- **Scripts:** docs/technical/SCRIPTS_SERVIDORES.md
- **Deployment:** docs/deployment/DEPLOYMENT_PROCESS.md
- **File structure:** .meta/FILE_STRUCTURE_PROTOCOL.md
- **Master index:** docs/INDEX.md

---

## COMMON ERRORS & SOLUTIONS

| Error | Root Cause | Solution |
|-------|-----------|----------|
| SQLITE_ERROR: no such table | DB not initialized | cd server && npm run init |
| Cannot find module './db.js' | Wrong import in client | Move DB logic to server/, use API calls |
| 401 Unauthorized on admin | Wrong token key | Use localStorage.getItem('auth_token') |
| table tipos_reporte has no column slug | Wrong column name | Use 'tipo' column (check schema.sql) |
| No se encontro supervisor | Using reporte.dependencia | Use req.usuario.dependencia |
| E2E tests fail stale UI | Frontend not rebuilt | cd client && npm run build |
| Port 4000 already in use | Server still running | .\stop-servers.ps1 |
| TypeError: map.setView undefined | Leaflet map in state | Use useRef for map, not useState |
| ESLint warnings on commit | Pre-commit hook active | Run npm run lint:fix |

