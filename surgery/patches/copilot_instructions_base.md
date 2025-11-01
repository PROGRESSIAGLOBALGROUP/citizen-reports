# Jantetelco Heatmap Platform - AI Coding Agent Instructions

## Project Overview
Civic-tech full-stack application: React+Leaflet SPA with Express+SQLite API for geo-referenced incident reports and heatmap visualization. Single-process deployment serves both API and static assets.

## Architecture & Structure
```
server/          # Express API + SQLite (single-process serves both API & SPA)
client/          # React SPA with Vite (proxies to server in dev)
tests/           # Jest (backend), Vitest (frontend), Playwright (e2e)
ai/              # Agent directives and governance rules
code_surgeon/    # Safe automated code editing toolkit
docs/            # ADRs, API specs, governance, operations guides
scripts/         # Maintenance, backups, tile monitoring
```

## Critical Workflows

### Development Setup
```powershell
# Backend: Express API on :4000
cd server && npm install && npm run init && npm run dev

# Frontend: Vite dev server on :5173 (proxies API calls)
cd client && npm install && npm run dev
```

### Testing & Quality Gates
```powershell
npm run test:all  # Runs lint + unit + frontend + e2e (rebuilds SPA, resets e2e.db)
npm run test:e2e  # Playwright with fresh e2e.db isolation
```

### Production Build
```powershell
cd client && npm run build      # Outputs to client/dist/
cd server && npm start          # Serves API + static files from single process
```

## Key Technical Patterns

### Database Access Layer
- All DB operations go through `server/db.js` `getDb()` function
- Uses SQLite with prepared statements and transaction handling
- Schema initialized via `npm run init` (idempotent)
- Single `reportes` table with geo indexes on `lat`, `lng`, `tipo`

### API Validation
- Strict coordinate validation: lat ∈ [-90,90], lng ∈ [-180,180]
- Input sanitization via Express middleware
- Peso (weight) defaults to 1, clamped to positive integers

### Frontend State Management
- Vanilla React with useState/useEffect - no external state libs
- Leaflet map instance managed in `useRef`
- Heat layer data fetched on demand with optional grid aggregation

### Testing Isolation
- E2E tests use dedicated `e2e.db` (reset before each run)
- Backend tests mock DB with in-memory SQLite
- Frontend tests use Vitest + Testing Library with jsdom

## Project-Specific Conventions

### File Routing (Strictly Enforced)
- `server/**` → backend only
- `client/**` → frontend only  
- `tests/**` → all test files
- `ai/**` → agent prompts/governance
- `scripts/ai/**` → AI automation tools

### API Endpoints Pattern
- RESTful: `/api/reportes` (CRUD), `/api/reportes/tipos`, `/api/reportes/geojson`
- Grid aggregation: `/api/reportes/grid?cellSize=0.01`
- Tile proxy: `/tiles/{z}/{x}/{y}.png` (CSP compliance)

### Code Surgery Workflow
- Use `code_surgeon/` toolkit for safe automated edits
- Fragment-only approach: AI generates **only** the code fragment to replace
- VSCode tasks: "surgery: splice by markers" and "surgery: watch jobs"
- Jobs go in `surgery/jobs/` using `prompts/JOB_TEMPLATE.json` format

### Quality Gates (90% backend, 80% frontend coverage)
- Husky + lint-staged enforce ESLint (no warnings) + Prettier on commits
- All tests must pass before merge
- E2E includes visual regression testing (screenshot comparisons)

## Integration Points

### Leaflet Configuration
- Heat layer uses `leaflet.heat` plugin with configurable gradients
- Tile proxy (`/tiles/`) cycles through OpenStreetMap CDN hosts
- Custom fallback tiles (1x1 PNG) when upstream fails

### Export Capabilities
- PNG: Uses `html-to-image` to capture map viewport
- GeoJSON: Server-side FeatureCollection generation for GIS tools

### Operational Scripts
- `npm run backup:db` → Creates timestamped SQLite snapshots
- `npm run smoke:tiles` → Health checks tile proxy endpoints
- `npm run maintenance` → Combined backup + smoke test + metrics export

## AI Agent Governance

### Mandatory Principles (from `ai/COPILOT/code_agent_directives.md`)
- **Privacy/Security/Legal/Resilience by Design**
- **Fail-safe without placeholders** - code must be immediately runnable
- **Lint-error free** - no ESLint warnings tolerated
- **No files outside routing rules** - respect server/client boundaries

### Development Workflow
1. **Tests first** (TDD): write test → implement minimum → refactor
2. **Architecture changes require ADRs** in `docs/adr/`
3. **Use code_surgeon for automated edits** - safer than direct file manipulation
4. **Validate with full test suite** before considering work complete

### Common Pitfalls to Avoid
- Don't mix server and client imports
- Always initialize DB with `npm run init` before testing
- E2E tests require fresh build (`npm run build` in client/)
- Respect CSP - external resources must go through `/tiles/` proxy
- SQLite connections must use `getDb()` wrapper for proper error handling

## Quick References
- **API docs**: `docs/api/openapi.yaml`
- **Architecture deep-dive**: `docs/architecture.md`
- **Testing philosophy**: `docs/tdd_philosophy.md`
- **Operations runbook**: README.md "Operations & maintenance" section