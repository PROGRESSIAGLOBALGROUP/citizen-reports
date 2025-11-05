# Copilot Instructions Update - November 4, 2025

## Summary

Updated `.github/copilot-instructions.md` to reflect the **current production state** of the Jantetelco platform. The file now accurately represents how AI agents should interact with this codebase.

**File Size:** 380 lines (reduced from 1753 by removing aspirational business planning content)  
**Focus:** Technical patterns, workflows, and project-specific conventions

---

## What Changed

### 1. Executive Context (Simplified)
- **Removed:** 600+ lines about business strategy, financial projections, red flags, green flags, survival strategies
- **Kept:** Core technical reality
- **Why:** AI agents need to code, not plan business strategy; business context still in docs/guides/ for humans

### 2. Workflows (Completely Refreshed)
- **Added:** All four critical development workflows in clear, action-oriented format
  - Development setup (start-dev.ps1 or manual)
  - Testing & quality gates (test:all, test:unit, test:front, test:e2e)
  - Production build & deploy (30-second automated deploy)
  - Database operations (init, backup, smoke tests)
- **Benefit:** AI agents can immediately understand "what's the normal way to do X?"

### 3. Architecture Section (Improved Clarity)
- **Kept:** Visual diagram of Frontend → API → SQLite
- **Added:** Specific table names and their purposes
- **Added:** Authentication pattern with test user credentials
- **Why:** Prevents guess-work when implementing features

### 4. Project-Specific Patterns (Expanded)
- **File Boundaries:** Strictly enforced server/ vs client/ separation
- **Database Pattern:** Always use getDb() wrapper (specific to this project)
- **Frontend State:** Leaflet maps in useRef, not useState (prevents re-renders)
- **Routing:** Hash-based with protected routes
- **Validation Functions:** Reusable helpers (validarCoordenadas, normalizeTipos, isIsoDate)

### 5. Common Pitfalls (Updated from Production Issues)
- **Added Oct 8 bug:** localStorage key must be 'auth_token' not 'token'
- **Added Oct 5 bug:** Use req.usuario.dependencia not reporte.dependencia
- **Added Oct 4 bug:** Express body limit considerations for files
- **All referenced:** docs/BUGFIX_*.md files for learning

### 6. Removed Content
- ❌ Business strategy sections (600+ lines)
- ❌ Financial projections (aspirational vs actual)
- ❌ Startup runway calculations
- ❌ Fundraising objection handlers
- ❌ Market TAM/SAM/SOM analysis
- ❌ These remain in `/docs/guides/` for humans to reference

---

## Key Additions for AI Agents

### 1. Clear Workflow Commands
```powershell
.\start-dev.ps1                  # How to develop
npm run test:all                 # How to validate
.\deploy.ps1 -Message "..."      # How to deploy
npm run init                      # How to reset DB
```

### 2. Architecture Quick Reference
- **Production:** Single Node.js process serves both API + SPA from 145.79.0.77:4000
- **Development:** Separate Vite proxy (5173) and Express backend (4000)
- **Deployment:** GitHub webhook auto-triggers deploy.sh on main push

### 3. Database-Specific Guidance
- Use `getDb()` wrapper (not direct sqlite3 instantiation)
- Schema lives in `server/schema.sql` (the source of truth)
- Critical columns: `tipo` (NOT `slug`), `auth_token` (NOT `token`)

### 4. Frontend-Specific Guidance
- Hash-based routing (#reportar, #panel, #admin, #reporte/{id})
- Leaflet maps in useRef to prevent unnecessary re-renders
- No Redux/Context API - vanilla React state only
- Vite SPA proxy in dev, static serving in production

### 5. Three-Tier Testing Pattern
- Backend tests: Jest + Supertest + temp SQLite
- Frontend tests: Vitest + React Testing Library + jsdom
- E2E tests: Playwright with isolated e2e.db

---

## What AI Agents Should Know

When working on this codebase, an AI agent should:

1. **ALWAYS check file structure protocol** before creating files (in `.meta/`)
2. **NEVER mix server/client imports** - strict file boundaries
3. **ALWAYS use getDb()** for database access
4. **NEVER skip npm run init** before first test run
5. **ALWAYS use req.usuario.dependencia** not reporte.dependencia
6. **ALWAYS use 'auth_token'** as localStorage key
7. **ALWAYS run npm run test:all** before marking work complete
8. **ALWAYS check schema.sql** for column names (not assumptions)

---

## How to Use This File

### For AI Agents
- Load this file into context when working on Jantetelco
- Refer to section numbers: "See CRITICAL WORKFLOWS section"
- Reference specific patterns: "This is a PROJECT-SPECIFIC PATTERN"
- Learn from bugfixes: "See RECENT CRITICAL BUGFIXES"

### For Humans Onboarding AI
- Paste into agent context/system prompt
- Point to specific sections for guidance
- Refer to table at end for quick error resolution

### For Code Review
- Use COMMON PITFALLS section as checklist
- Use VALIDATION & QUALITY GATES as pre-merge criteria
- Use COMMON ERRORS table for troubleshooting

---

## Structure & Length

**Total: 380 lines** organized as:
- Executive context (4 lines)
- File protocol (18 lines)
- Critical workflows (75 lines with examples)
- Technical architecture (50 lines with diagram)
- Project patterns (80 lines with code examples)
- Common pitfalls (20 lines DO/DO NOT)
- Testing approach (15 lines)
- Critical bugfixes (20 lines)
- Architecture decisions (10 lines)
- Deployment architecture (15 lines)
- Validation & QA (12 lines)
- Help & documentation (12 lines)
- Common errors table (15 lines)

**Goal:** Immediately actionable without requiring file exploration

---

## Future Updates

This file should be updated when:

1. **New critical workflows emerge** - Add to CRITICAL WORKFLOWS section
2. **New common pitfalls discovered** - Add to COMMON PITFALLS section
3. **Architecture decisions change** - Update ADR list or TECHNICAL ARCHITECTURE
4. **Production issues occur** - Add to RECENT CRITICAL BUGFIXES section
5. **File structure changes** - Update FILE CREATION PROTOCOL reference

**Update frequency:** Quarterly or after major incidents

---

## Validation

- ✅ File is .github/copilot-instructions.md (standard location)
- ✅ Content verified against actual codebase (schema.sql, app.js, App.jsx)
- ✅ Workflows tested locally (start-dev.ps1, npm run test:all, deploy.ps1)
- ✅ Bug references verified (docs/BUGFIX_*.md files exist)
- ✅ Architecture diagram matches reality (single Node process + SPA)
- ✅ No aspirational content (focused on actual patterns)

