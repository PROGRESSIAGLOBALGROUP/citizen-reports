# Changelog

All notable changes to the Jantetelco Heatmap Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [UNRELEASED]

### Added
- **AdminDependencias Component:** Professional table-based UI redesign with drag-and-drop reordering (SortableItemDependencia)
- **Design System:** Unified design tokens for color, typography, spacing, transitions (design-system.js)
- **ADR-0011:** Traefik production routing architecture using File Provider for critical routes

### Fixed
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
