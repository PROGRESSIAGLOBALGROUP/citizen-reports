# Copilot Instructions Update - November 10, 2025

## Summary

Updated `.github/copilot-instructions.md` with AI Coding Agent best practices distilled from 6+ months of citizen-reports production operations.

**Source:** Deep analysis of architecture, patterns, recent bugfixes, governance, and test infrastructure.

---

## What's In There Now

### 1. Executive Context (2 paragraphs)
- **Problem space:** Civic-tech municipal incident reporting
- **Tech stack clarity:** React 18 + Leaflet / Express 4 + SQLite / PM2 Ubuntu VPS
- **Feature scope:** Geolocation heatmaps, multi-role auth, audit trails, mobile-responsive

### 2. File Creation Protocol (New - Critical)
- **Authority:** `.meta/FILE_STRUCTURE_PROTOCOL.md`
- **Decision tree:** Before ANY file creation, identify type → check protocol → place correctly
- **Clear categorization:** Backend (server/), Frontend (client/), Tests (tests/), Docs (docs/), Scripts (scripts/), Governance (.meta/), GitHub (.github/)
- **Enforcement:** Pre-commit hooks validate structure

### 3. Critical Workflows (TDD-focused)
- **Development:** `.\start-dev.ps1` opens persistent windows with auto-restart
- **Testing:** `npm run test:all` (Lint + Jest + Vitest + Playwright) with SPA rebuild + e2e.db reset
- **Deployment:** `.\deploy.ps1 -Message "..."` automates build/copy/restart in 30 seconds
- **DB operations:** `npm run init` (idempotent), `backup:db`, `smoke:tiles`, `maintenance`

### 4. Architecture at a Glance
- **Visual data flow:** React SPA ↔ Express API ↔ SQLite (single Node process)
- **9 core tables:** reportes, usuarios, sesiones, tipos_reporte, categorias, dependencias, asignaciones, cierres_pendientes, historial_cambios
- **Indexes on:** location (lat/lng), tipo, estado, dependencia, token (all critical queries pre-optimized)

### 5. Authentication Pattern (Prod-tested)
- **Token-based with bcrypt hashing**
- **Test users with known passwords:** admin@jantetelco.gob.mx, supervisor.obras@, func.obras1@
- **localStorage key:** MUST be `auth_token` (NOT `token` - common bug)
- **Middleware stack:** `requiereAuth` → `requiereRol(['admin', 'supervisor'])` → handler

### 6. Project-Specific Patterns (Essential for AI agents)

**File Boundaries (Strictly Enforced)**
```
server/**    → Backend only
client/**    → Frontend only
tests/**     → Jest/Vitest/Playwright
ai/**        → Prompts & governance
scripts/**   → Operational tooling
docs/**      → Architecture, ADRs, API specs
```
Violation = immediate pre-commit block

**Database Access Pattern**
```javascript
import { getDb } from './db.js';  // ALWAYS use wrapper
const db = getDb();
db.all('SELECT...', [params], callback);
```
Never instantiate sqlite3.Database directly.

**Frontend State Management**
```javascript
const mapRef = useRef(null);  // Maps in useRef, NOT useState
useEffect(() => {
  if (!mapRef.current) {
    mapRef.current = L.map('map').setView([lat, lng], zoom);
  }
}, []);
```

**Hash-based Routing**
- `#reportar` → Form
- `#panel` → Dashboard (requires auth)
- `#admin` → Admin panel (requires admin role)
- `#reporte/{id}` → Detail view
- Default `#` → Interactive map

**Validation & Type Mapping**
```javascript
// Reusable functions (in server/app.js)
validarCoordenadas(lat, lng)  // [-90,90] x [-180,180]
normalizeTipos(raw)            // array or CSV → unique Set
isIsoDate(s)                   // YYYY-MM-DD validation

// Type→Department map (auth_middleware.js DEPENDENCIA_POR_TIPO)
// 38 variants, all types must map to one of 8 departments
'baches' → 'obras_publicas'
'agua' → 'agua_potable'
'seguridad' → 'seguridad_publica'
```

**Middleware Composition**
```javascript
app.post('/api/reportes/:id/asignaciones',
  requiereAuth,
  requiereRol(['admin', 'supervisor']),
  routeHandler);  // Always stack like this
```

### 7. Critical Bugfixes (Learn These)

**localStorage Key Bug (Oct 8)**
- ❌ `localStorage.getItem('token')`
- ✅ `localStorage.getItem('auth_token')`
- Impact: Silent auth failures

**Column Name Bug (Oct 8)**
- ❌ SQL: `tipos_reporte.slug` or property `tipo?.slug`
- ✅ Column: `tipo` in schema
- Impact: Type editing crashes, 500 errors

**Interdepartmental Bug (Oct 5)**
- ❌ `obtenerSupervisor(reporte.dependencia)`
- ✅ `obtenerSupervisor(req.usuario.dependencia)`
- Impact: "No supervisor found" on cross-dept closures

**Payload Size Bug (Oct 4)**
- ❌ Default 1MB limit too small for signatures + photos
- ✅ Express JSON limit: 5MB in app.js
- Impact: 413 Payload Too Large

### 8. Common Pitfalls (Do's & Don'ts)

**Don'ts:**
- Mix server/client imports
- Skip `npm run init` before testing
- Run E2E without fresh build
- Fetch external resources (violates CSP - use `/tiles/` proxy)
- Use `require()` (ESM only)
- Create files in root
- Instantiate `sqlite3.Database()` directly
- Use `useState` for Leaflet map

**Do's:**
- Use `getDb()` for ALL database operations
- Run `npm run test:all` before committing
- Add tests for new endpoints (unit + e2e)
- Reuse validation functions
- Check `docs/BUGFIX_*.md` for patterns
- Verify interdepartmental queries use `req.usuario.dependencia`
- Consult `server/schema.sql` before SQL
- Update `DEPENDENCIA_POR_TIPO` when adding types

### 9. TDD Workflow
```
Red → Write failing test
Green → Implement minimum code to pass
Refactor → Clean while keeping tests green
Validate → npm run test:all passes 100%
```

Three-tier tests:
- Backend (Jest): `tests/backend/` with temp SQLite DBs
- Frontend (Vitest): `tests/frontend/` with jsdom + mocked fetch
- E2E (Playwright): `tests/e2e/` with dedicated e2e.db

### 10. Architecture Decisions (ADRs)
- ADR-0001: Bootstrap architecture
- ADR-0006: Many-to-many report assignment system
- ADR-0009: Database-driven types & categories (not hardcoded)
- ADR-0010: Unified audit trail (historial_cambios table)

### 11. Production Deployment
- **VPS:** 145.79.0.77 (root user)
- **Paths:** `/root/citizen-reports/` (app) + `data.db` (SQLite)
- **Process:** PM2 (citizen-reports-app)
- **Auto-deploy:** GitHub webhook → deploy.sh → pm2 restart

### 12. Quality Gates
- Pre-commit: ESLint (no warnings) + Prettier
- Pre-merge: `npm run test:all` 100%
- Security: Prepared statements, input validation, bcrypt, token expiry, CORS/CSP, no PII logging

### 13. Help & Reference
- Architecture: `docs/architecture.md`
- API spec: `docs/api/openapi.yaml`
- Auth system: `docs/SISTEMA_AUTENTICACION.md`
- Database: `server/schema.sql`
- ADRs: `docs/adr/ADR-*.md`
- File structure: `.meta/FILE_STRUCTURE_PROTOCOL.md`
- Master index: `docs/INDEX.md`

### 14. Common Errors & Solutions (Troubleshooting Table)
- SQLITE_ERROR: no such table → `npm run init`
- 401 Unauthorized → use `auth_token` key
- Column not found → check `schema.sql`
- Supervisor not found → use `req.usuario.dependencia`
- E2E fails → rebuild SPA: `npm run build`
- Port in use → `.\stop-servers.ps1`
- Map undefined → use `useRef`, not `useState`

---

## Key Insights Incorporated

### From Codebase Analysis
1. **Strict file boundaries** - Discovered via 11 root-level doc violations corrected by `.meta/FILE_STRUCTURE_PROTOCOL.md`
2. **getDb() wrapper pattern** - Consistent across all `server/**` database access
3. **useRef for Leaflet maps** - Critical performance pattern in `client/src/App.jsx`
4. **Hash-based routing** - Simple vanilla approach, no router library overhead
5. **Validation function reuse** - `validarCoordenadas()`, `normalizeTipos()`, `isIsoDate()` used throughout
6. **DEPENDENCIA_POR_TIPO mapping** - 38 type variants mapped to 8 departments in `auth_middleware.js`

### From Recent Bugfixes
1. localStorage key (`token` vs `auth_token`) - Silent failure pattern
2. Column naming (`slug` vs `tipo`) - Schema mismatch pattern
3. Interdepartmental queries - Authorization boundary issue
4. Payload size limit - Real-world data sizing oversight
5. All documented in `docs/BUGFIX_*.md` files for learning

### From Governance
1. `.meta/FILE_STRUCTURE_PROTOCOL.md` - Prevents chaos, enforces structure
2. TDD philosophy in `docs/tdd_philosophy.md` - Red-Green-Refactor workflow
3. Pre-commit hooks via Husky - Lint + format enforcement
4. Test:all gate - 100% pass requirement before merge

### From Test Infrastructure
1. Three-tier separation: Jest (backend) + Vitest (frontend) + Playwright (e2e)
2. E2E uses dedicated `e2e.db` - Isolated dataset per run
3. Pre-E2E: rebuild SPA + init fresh DB - No test pollution
4. Mock pattern: fetch() mocking in Vitest, Supertest for API testing

### From Deployment
1. Single Node process serves API + SPA - No reverse proxy complexity
2. 30-second deployment via `deploy.ps1` - Build, copy, restart
3. GitHub webhook auto-deploy - `145.79.0.77:3000/webhook` triggers
4. Idempotent `npm run init` - Safe schema reset anytime

---

## What an AI Agent Should Know Immediately

1. **File placement** is ENFORCED - Check `.meta/FILE_STRUCTURE_PROTOCOL.md` before creating anything
2. **Never instantiate sqlite3.Database()** - Always use `getDb()` wrapper
3. **Auth token key is `auth_token`** - Not `token` (this breaks everything silently)
4. **Type column is `tipo`** - Not `slug` (crashes admin panel)
5. **For interdepartmental queries, use `req.usuario.dependencia`** - Not `reporte.dependencia`
6. **Leaflet maps go in useRef** - Not useState (prevents re-renders)
7. **Test:all must pass 100%** - Before any commit
8. **Run `npm run init` first** - Before dev/test (creates data.db)
9. **Reuse validation functions** - They're tested and consistent
10. **Check DEPENDENCIA_POR_TIPO** - Update it when adding report types

---

## Not Included (By Design)

- ❌ Generic advice ("write tests", "handle errors")
- ❌ Aspirational patterns (not yet implemented)
- ❌ Third-party library docs (use npm docs)
- ❌ Business logic specifics (beyond architectural patterns)
- ❌ UI component APIs (use component files as reference)

---

## How to Use This File

1. **First time in codebase?** Read top-to-bottom in 15 minutes
2. **Adding a feature?** Jump to "PROJECT-SPECIFIC PATTERNS" section
3. **Debugging?** Check "COMMON PITFALLS" and "COMMON ERRORS & SOLUTIONS"
4. **Creating a file?** Follow "FILE CREATION PROTOCOL" step-by-step
5. **Deploying?** Use commands in "CRITICAL WORKFLOWS"
6. **Uncertain?** Check referenced docs: `server/schema.sql`, `.meta/FILE_STRUCTURE_PROTOCOL.md`, `docs/BUGFIX_*.md`

---

## Future Updates

Next review cycle (January 31, 2026):
- New bugfixes to document
- Additional ADRs to reference
- Test infrastructure improvements
- Deployment process refinements
- Governance updates

---

**Status:** ✅ ACTIVE  
**Version:** 2.0 (Nov 10, 2025)  
**Authority:** GitHub Copilot / AI Agent Instructions  
**Validation:** Pre-commit hooks + ESLint + npm run test:all

---

