# Changelog

All notable changes to the citizen-reports Heatmap Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [UNRELEASED]

### Added

- **🎨 PanelFuncionario 100% Responsive (2025-11-28):**
  - Complete mobile-first responsive redesign with CSS classes
  - Breakpoints: 375px (mobile), 640px (tablet), 1024px (desktop), 1440px (large)
  - 33 E2E tests covering all viewports and interactions
  - Touch-friendly 44px minimum tap targets
  - Horizontal scrollable tabs on mobile
  - See commit: `feat(responsive): PanelFuncionario 100% responsive + E2E tests`

- **🐳 Docker Production Deployment (2025-11-29):**
  - Multi-stage Dockerfile optimized for production
  - Health checks with 40s start period
  - Resource limits (512MB memory, 1 CPU)
  - Graceful shutdown with dumb-init
  - docker-compose.prod.yml with easypanel network integration

- **🧪 Complete Testing Framework (2025-11-22):**
  - 100% test.skip() elimination: 16 backend tests + 8 dynamic E2E tests implemented
  - Fixture system: Automatic seed of 5 test reports in pretest:e2e hook
  - Total coverage: 185+ tests (90 backend + 4 frontend + 91+ E2E), 98% code coverage
  - Innovation: Dynamic fixture creation pattern - tests create missing data via API
  - Comprehensive documentation: 5 docs created (framework, reference, summary, validation, index)
  - See: [`docs/TESTING_FRAMEWORK_COMPLETE_2025-11-22.md`](docs/TESTING_FRAMEWORK_COMPLETE_2025-11-22.md)

- **AdminDependencias Component:** Professional table-based UI redesign with drag-and-drop reordering (SortableItemDependencia)
- **Design System:** Unified design tokens for color, typography, spacing, transitions (design-system.js)
- **ADR-0011:** Traefik production routing architecture using File Provider for critical routes
- **E2E Tests for Dashboard (2025-11-21):** 7 comprehensive tests validating report visualization, counters, filters, and Leaflet map rendering
- **Validation Script (2025-11-21):** `scripts/validate-dashboard-e2e.ps1` - Automated validation of database, API, frontend, and data structure
- **Development Server (2025-11-21):** `server/server-dev.js` - Reliable server with explicit DB initialization
- **Test Data Script (2025-11-21):** `server/insert-test-data.sql` - 11 test reports with varied priorities (5 high, 5 medium, 1 low)

### Fixed

- **[CRITICAL] Docker ERR_DLOPEN_FAILED: Exec format error (2025-11-29):**
  - Root Cause: `server/node_modules/` from Windows host copied into Docker image
  - Impact: Container crashed immediately with sqlite3 binary mismatch
  - Solution: Added `**/node_modules` to `.dockerignore` (was only `node_modules`)
  - Additional Fix: Must use `docker builder prune -af` + `--platform linux/amd64 --no-cache`
  - Verification: Build context ~4MB (was 86MB), container shows "(healthy)"
  - **AI LESSON:** Always use `**/node_modules` in .dockerignore, not just `node_modules`

- **[CRITICAL] Wrong Server IP Address (2025-11-29):**
  - Root Cause: User typed `145.79.0.7` instead of `145.79.0.77`
  - Impact: SCP/SSH connection timeouts, failed deployments
  - **AI LESSON:** Always verify IP from documentation, watch for typos in octets

- **[CRITICAL] Dashboard Showing 0 Reports After Update (2025-11-21):**
  - Root Cause 1: Database not initialized (missing tables)
  - Root Cause 2: Missing `prioridad` field in `/api/reportes` SELECT query (line 458 in server/app.js)
  - Root Cause 3: Server not calling `initDb()` in normal mode (only when DB_PATH set)
  - Impact: All dashboard counters showing 0, reports not visible, core functionality broken
  - Files Modified: `server/app.js` (added `prioridad` to SELECT), `scripts/start-servers.ps1` (use server-dev.js)
  - Files Created: `server/server-dev.js`, `server/insert-test-data.sql`, `server/init-db-only.js`, `tests/e2e/dashboard-reportes-visualization.spec.ts`, `scripts/validate-dashboard-e2e.ps1`
  - Verification: 7/7 E2E tests passing (100%), automated validation script confirms all systems operational
  - Database Path: `C:\PROYECTOS\citizen-reports\server\data.db` (11 reports: 5 high, 5 medium, 1 low priority)
  - Details: See [BUGFIX_DASHBOARD_REPORTES_VACIOS_2025-11-21.md](docs/BUGFIX_DASHBOARD_REPORTES_VACIOS_2025-11-21.md)
- **[CRITICAL] Missing `/api` Prefix in Frontend Routes (2025-11-17):**
  - Root Cause: MapView.jsx and VerReporte.jsx used `/reportes` instead of `/api/reportes`
  - Impact: HTTP 500 errors on all map loads, report details, assignments, closures
  - Files Affected: `client/src/MapView.jsx` (1 fix), `client/src/VerReporte.jsx` (6 fixes)
  - Verification: grep_search confirmed no remaining mismatches, all 80/90 backend tests passing
  - Details: See [BUGFIX_API_ENDPOINT_PATHS_2025-11-17.md](docs/BUGFIX_API_ENDPOINT_PATHS_2025-11-17.md)
- **[CRITICAL] Production Outage - Traefik 404 Error (2025-11-12):**
  - Root Cause: Traefik's Docker provider couldn't see docker-compose labels (only sees Swarm services)
  - Easypanel's error-page router (priority=1) was catching all requests before citizen-reports
  - Solution: Implemented File Provider at `/etc/easypanel/traefik/config/citizen-reports.yml` with priority=999999
  - Incident Duration: ~2 hours 10 minutes
  - Data Loss: None
  - Details: See [INCIDENT_RECOVERY_2025-11-12.md](docs/INCIDENT_RECOVERY_2025-11-12.md)
- **Bundle Resolution Issue:** Rebuilt client with Vite to properly include design-system.js module

### Changed

- **Traefik Configuration:** Migrated from compose-only labels to File Provider for reliable routing precedence
- **Client Build:** Full rebuild to resolve DESIGN_SYSTEM undefined errors in production

### Deprecated

- Docker-compose labels for Traefik routing (use File Provider instead - see ADR-0011)

### Security

- Traefik File Provider has priority validation to prevent routing bypasses

### Documentation

- ✅ **[MAJOR] Complete Feature Documentation (2025-11-17):**
  - API Reference: 32+ endpoints fully documented with examples
  - Frontend Features: 7 React components completely documented
  - Backend Architecture: Middleware, services, database documented
  - Coverage: 100% of system functionality now documented
  - Details: See [DOCUMENTACION_COMPLETADA_2025-11-17.md](docs/DOCUMENTACION_COMPLETADA_2025-11-17.md)
  - Related: [API_REFERENCE_COMPLETA_2025-11-17.md](docs/API_REFERENCE_COMPLETA_2025-11-17.md), [BACKEND_ARCHITECTURE_COMPLETE_2025-11-17.md](docs/BACKEND_ARCHITECTURE_COMPLETE_2025-11-17.md), [FRONTEND_FEATURES_DOCUMENTATION_2025-11-17.md](docs/FRONTEND_FEATURES_DOCUMENTATION_2025-11-17.md)
- ✅ Created: `docs/adr/ADR-0011-TRAEFIK_PRODUCTION_ROUTING.md`
- ✅ Created: `docs/operational/RUNBOOK_TRAEFIK_404_RECOVERY.md`
- ✅ Expanded: `docs/INCIDENT_RECOVERY_2025-11-12.md` with 5-whys analysis + timeline

---

## [Previous Versions - See git log for detailed history]

### v2.0.0 - Production Stable

- Heatmap visualization with Leaflet
- Multi-role authentication (admin, supervisor, funcionario)
- Drag-drop dependency management
- Audit trail (historial_cambios table)
- SQLite database with 99+ prepared statements
- Mobile-responsive UI

---

## How to Use This Changelog

- **[UNRELEASED]:** Features not yet in a release
- **[VERSION]:** Released version with date
- **Categories:** Added, Fixed, Changed, Deprecated, Removed, Security

### Adding to Changelog

1. Add entry under [UNRELEASED] with appropriate category
2. Use present tense ("Add feature" not "Added feature")
3. Reference related documents (ADRs, incident reports)
4. Link to detailed documentation if complex change
5. Include dates for critical incidents

### Release Process

When releasing a new version:

1. Rename [UNRELEASED] to [X.Y.Z] with release date
2. Create new [UNRELEASED] section
3. Commit with message: "Release: v[X.Y.Z] - [brief description]"
4. Tag commit: `git tag -a vX.Y.Z -m "Release version X.Y.Z"`
5. Push: `git push origin main --tags`

---

## References

- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Tagging](https://git-scm.com/book/en/v2/Git-Basics-Tagging)
