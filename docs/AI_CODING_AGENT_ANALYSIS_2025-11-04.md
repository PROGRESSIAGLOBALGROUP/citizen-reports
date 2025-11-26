# AI Agent Instructions Analysis & Update - Complete

**Date:** November 4, 2025  
**Status:** ✅ COMPLETE  
**File Updated:** `.github/copilot-instructions.md`

---

## Executive Summary

Successfully analyzed the citizen-reports codebase and **completely refreshed** `.github/copilot-instructions.md` to guide AI agents in productive development. The file now reflects the actual production system rather than aspirational business strategy.

### Key Metrics
- **Original size:** 1,753 lines
- **New size:** 379 lines (78% reduction)
- **Content focus:** Technical patterns & workflows (100%)
- **Removed:** Business strategy content (100%)
- **Test coverage:** All workflows verified against actual codebase

---

## What Was Discovered

### 1. Architecture Reality

The project runs as a **single Node.js process** in production:
- **Port 4000:** Serves both Express API + React SPA (from client/dist/)
- **Single SQLite database:** /root/citizen-reports/data.db
- **Development:** Separate Vite (5173) + Express (4000) for efficiency
- **Deployment:** PM2-managed with GitHub webhook auto-deploy

**Critical insight:** This differs from common patterns where frontend/backend are separate deployments.

### 2. Essential Workflows

Four critical workflows that AI agents must understand:

1. **Development Setup** - `.\start-dev.ps1` (opens persistent windows)
2. **Testing & QA** - `npm run test:all` (3-tier: Jest + Vitest + Playwright)
3. **Production Deploy** - `.\deploy.ps1` (30 seconds end-to-end)
4. **Database Ops** - `npm run init` (must run before first test)

**Critical lesson:** Skipping `npm run init` before testing causes immediate "no such table" failures.

### 3. Project-Specific Patterns

This codebase has unique patterns that differ from common practices:

| Pattern | Implementation | Why It Matters |
|---------|---|---|
| Database access | Always use `getDb()` wrapper | Direct sqlite3 instantiation breaks multi-request handling |
| Frontend state | Leaflet maps in `useRef`, not `useState` | Prevents map re-initialization on every render |
| Routing | Hash-based (#panel, #admin, #reportar) | Simple, offline-friendly, no build-time routing |
| Component library | None - vanilla React + unified-section-headers.js | Lightweight, easy to modify for white-label |
| API validation | Specific reusable functions | Coordinates must be validated, types normalized |

### 4. Critical Bugs & Lessons

Production issues provide essential guidance:

- **Oct 8:** Admin panel crashed because frontend used wrong localStorage key ('token' vs 'auth_token')
- **Oct 5:** Interdepartmental closure failed because code used wrong department (reporte.dependencia vs req.usuario.dependencia)
- **Oct 4:** File uploads failed because Express body limit was too small (1MB vs needed 5MB)

**Pattern:** All errors stem from not checking schema.sql or using actual user context correctly.

### 5. Architecture Decisions (ADRs)

Key structural decisions documented:

- **ADR-0001:** Bootstrap architecture
- **ADR-0006:** Many-to-many report assignment system (asignaciones table)
- **ADR-0009:** Database-driven types/categories (not hardcoded)
- **ADR-0010:** Unified audit trail (historial_cambios table)

**Implication:** Any structural changes must align with these decisions.

---

## What AI Agents Should Know

### DO
✅ Always use `getDb()` for database access  
✅ Check `.meta/FILE_STRUCTURE_PROTOCOL.md` before creating files  
✅ Run `npm run test:all` before marking work complete  
✅ Use `req.usuario.dependencia` for interdepartmental queries  
✅ Use `localStorage.getItem('auth_token')` (not 'token')  
✅ Verify column names in `server/schema.sql` before writing SQL  
✅ Store Leaflet map in `useRef` to prevent re-renders  

### DO NOT
❌ Mix server and client imports  
❌ Skip `npm run init` before testing  
❌ Use direct sqlite3.Database instantiation  
❌ Fetch external resources (use /tiles/ proxy)  
❌ Use `reporte.dependencia` for supervisor lookups  
❌ Run E2E tests without rebuilding frontend first  
❌ Assume column names - check schema.sql always  

---

## How This Helps AI Agents

### Immediate Productivity
- Clear workflow commands with expected outputs
- Architecture diagram explaining data flow
- Database schema overview with table relationships
- Test structure (3-tier: backend/frontend/e2e)

### Error Prevention
- Common Pitfalls section (20 specific DO/DON'T items)
- Recent Critical Bugfixes section (learn from Oct issues)
- Common Errors table (error → root cause → solution)

### Code Quality
- Validation functions (validarCoordenadas, normalizeTipos, isIsoDate)
- Authentication pattern with test credentials
- File boundary enforcement (server/ vs client/)
- Quality gates (ESLint, Prettier, 3-tier testing)

---

## File Structure & Content

### 1. Executive Context (7 lines)
Quick tech stack overview and current state

### 2. File Creation Protocol (20 lines)
CRITICAL: Where to put files before creating them

### 3. Critical Workflows (75 lines)
- Development setup
- Testing & quality gates
- Production build & deploy
- Database operations

### 4. Technical Architecture (50 lines)
- Component diagram
- Key database tables (8 tables listed)
- Authentication pattern with test users
- Token storage in localStorage

### 5. Project-Specific Patterns (80 lines)
- File boundaries (server/ vs client/)
- Database access (getDb wrapper)
- Frontend state (useRef for Leaflet)
- Hash-based routing
- API validation functions with code samples

### 6. Common Pitfalls (20 lines)
18 specific DO/DON'T items from production experience

### 7. Testing Approach (15 lines)
TDD workflow + 3-tier test structure

### 8. Recent Critical Bugfixes (20 lines)
3 production issues with root cause analysis

### 9. Architecture Decisions (10 lines)
4 ADRs with reference to docs/adr/

### 10. Deployment Architecture (15 lines)
Production setup (145.79.0.77) with deployment flow

### 11. Validation & QA (12 lines)
Pre-commit, pre-merge, security checklist

### 12. Help & Documentation (12 lines)
Key reference files and where to find them

### 13. Common Errors & Solutions (15 lines)
Quick reference table: Error → Root Cause → Solution

---

## Validation Checklist

✅ File location: `.github/copilot-instructions.md` (standard location)  
✅ Content verified against:
  - `server/app.js` (Express setup, routes, middleware)
  - `server/schema.sql` (8 tables, 40+ indexes)
  - `client/src/App.jsx` (hash routing, state management)
  - `client/src/main.jsx` (Vite entry point)
  - `package.json` (npm scripts: test:all, test:unit, test:front, test:e2e)

✅ Workflows tested:
  - `.\start-dev.ps1` (verified creates persistent shells)
  - `npm run test:all` (verified 3-tier structure)
  - `.\deploy.ps1` (verified build + SCP + restart flow)
  - `npm run init` (verified creates data.db from schema.sql)

✅ Bug references verified:
  - `docs/BUGFIX_EDICION_TIPOS_CRASH_2025-10-08.md` (admin panel issue)
  - `docs/BUGFIX_SUPERVISOR_VER_TODOS_REPORTES_2025-10-05.md` (interdepartmental issue)
  - Payload size issues referenced in schema.sql and app.js

✅ No aspirational content:
  - ❌ Business strategy removed
  - ❌ Financial projections removed
  - ❌ Fundraising guidance removed
  - ✅ These remain in docs/guides/ for human reference

---

## How to Use This Update

### For Developers
1. Reference `.github/copilot-instructions.md` when onboarding new AI agents
2. Use specific sections: "See CRITICAL WORKFLOWS for deployment"
3. Share error table for quick troubleshooting
4. Point to COMMON PITFALLS as code review checklist

### For Prompt Engineers
1. Load this file into AI system context/instructions
2. Reference specific patterns from PROJECT-SPECIFIC PATTERNS section
3. Use Common Errors table for training/evaluation
4. Link to docs/BUGFIX_*.md files for detailed learning

### For QA/DevOps
1. Use VALIDATION & QUALITY GATES section as pre-merge criteria
2. Reference COMMON ERRORS table for support tickets
3. Use DEPLOYMENT ARCHITECTURE for troubleshooting
4. Check HELP & DOCUMENTATION for reference files

### For Agents During Development
1. First: Read entire file (7 minutes)
2. When creating files: Consult FILE CREATION PROTOCOL
3. When coding: Reference PROJECT-SPECIFIC PATTERNS
4. When stuck: Check COMMON PITFALLS and COMMON ERRORS
5. When deploying: Follow CRITICAL WORKFLOWS section

---

## What's Next

### Recommended Future Updates
1. **Quarterly Review** - Update based on new patterns discovered
2. **After Incidents** - Add to RECENT CRITICAL BUGFIXES section
3. **Architecture Changes** - Update ADR list or TECHNICAL ARCHITECTURE
4. **New Workflows** - Add to CRITICAL WORKFLOWS section

### File Monitoring
- Review when major features ship
- Update when production incidents occur
- Refresh when new developers onboard
- Extend as project complexity grows

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Lines of instructions | 379 |
| Code examples | 12 |
| Common pitfalls documented | 18 |
| Workflows covered | 4 |
| Database tables explained | 8 |
| Architecture decisions referenced | 4 |
| Production bugs analyzed | 3 |
| Test frameworks covered | 4 (ESLint, Jest, Vitest, Playwright) |
| Common errors with solutions | 9 |

---

## Conclusion

The updated `.github/copilot-instructions.md` provides AI agents with **immediately actionable guidance** on how to develop productively in the citizen-reports codebase. By combining:

1. **Clear workflows** (what to run and when)
2. **Architecture understanding** (why things are structured this way)
3. **Project-specific patterns** (how THIS project differs from common practices)
4. **Real production lessons** (what went wrong and why)
5. **Quick reference tables** (error → solution)

...AI agents can now navigate the codebase confidently while learning from the team's accumulated experience.

**Result:** Faster onboarding, fewer mistakes, better code quality, and a living document that grows with the project.

