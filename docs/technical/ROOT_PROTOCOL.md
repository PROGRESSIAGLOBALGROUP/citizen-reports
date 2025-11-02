# ROOT PROTOCOL - Workspace Organization Standards

**Effective Date:** October 30, 2025  
**Version:** 1.0  
**Status:** ENFORCED ✅

## Philosophy

> "A well-organized root directory is a well-organized mind." - Industry Best Practice

Root directories should be **clean and semantic**. Only files essential to the project should remain in the root. Everything else should be organized into appropriate subdirectories based on function.

**World-Class Standard:** Only **4 files** in root (README.md, package.json, package-lock.json, .gitignore)

---

## 📋 Protected Files (MUST Stay in Root)

| File | Purpose | Notes |
|------|---------|-------|
| `README.md` | Project documentation entry point | Only markdown file in root |
| `package.json` | NPM dependencies & scripts | **Required for npm** |
| `package-lock.json` | Dependency lock file | **Required for npm reproducibility** |
| `.gitignore` | Git ignore rules | **Required for version control** |
| `LICENSE` | Project license | Optional but recommended |

**Rule:** These files are **immutable** in root. Never move or delete them.

---

## 📁 Semantic Directory Structure

### `config/`
Configuration files for development tools and build processes.

**Files that belong here:**
- `.eslintrc.*` - ESLint configuration
- `.prettierrc.*` - Prettier configuration
- `.babelrc*` - Babel configuration
- `jest.config.*` - Jest testing configuration
- `vitest.config.*` - Vitest testing configuration
- `playwright.config.*` - Playwright E2E configuration
- `tsconfig.json` - TypeScript configuration
- `.editorconfig` - Editor configuration
- `webpack.config.*` - Webpack configuration

**Rule:** All tool configuration files → `config/`

**Example:**
```
config/
├── jest.config.cjs
├── playwright.config.ts
├── vitest.config.ts
└── .eslintrc.json
```

### `docs/`
All documentation, reports, and markdown files (except README.md).

**Files that belong here:**
- `.md` files (markdown documentation)
- `.txt` files (text reports, notes)
- `.json` files (report data, analysis results)
- Analysis reports
- Architecture documentation
- API specifications
- Decision records (ADRs)

**Rule:** All documentation and reports → `docs/`

**Example:**
```
docs/
├── architecture.md
├── API.md
├── adr/
│   ├── ADR-0001-bootstrap.md
│   └── ADR-0002-database.md
├── root-analysis-report.json
└── FINAL_STATUS_REPORT_2025-10-30.md
```

### `scripts/`
Development and maintenance scripts.

**Subdirectories:**
- `scripts/` - General purpose scripts
- `scripts/deployment/` - Production deployment scripts

**Files that belong here:**
- `*.ps1` files (PowerShell scripts)
- `*.sh` files (Shell scripts)
- Automation scripts (build, cleanup, analysis)
- Maintenance scripts

**Rule:** All `.ps1` and `.sh` files → `scripts/`

**Example:**
```
scripts/
├── check-servers.ps1
├── analyze-workspace.ps1
├── backup-db.ps1
├── deployment/
│   ├── deploy-prod.ps1
│   ├── deploy-staging.ps1
│   └── post-deploy-check.ps1
└── maintenance/
    ├── cleanup.ps1
    └── backup.sh
```

### `tests/`
Test files and test-related resources.

**Subdirectories:**
- `tests/backend/` - Backend unit tests
- `tests/frontend/` - Frontend unit tests
- `tests/e2e/` - End-to-end tests
- `tests/fixtures/` - Test data and fixtures

**Files that belong here:**
- `test_*.js` - Test files
- `verify_*.js` - Verification scripts
- `*.test.js` - Jest test files
- `*.spec.js` - Spec files

**Rule:** All test files → `tests/`

**Example:**
```
tests/
├── backend/
│   └── api.test.js
├── frontend/
│   └── components.test.jsx
├── e2e/
│   └── heatmap.spec.ts
└── fixtures/
    ├── test_audit_trail.js
    └── verify_db_state.js
```

---

## ⚠️ Forbidden Patterns (NEVER in Root)

These file patterns should **ALWAYS** be moved to appropriate directories:

| Pattern | Destination | Reason |
|---------|-------------|--------|
| `*.md$` (except README) | `docs/` | Documentation clutter |
| `*.txt$` | `docs/` | Report clutter |
| `*.json$` (except package.json) | `docs/` | Analysis clutter |
| `test_*.js` | `tests/fixtures/` | Test files |
| `verify_*.js` | `tests/fixtures/` | Verification scripts |
| `jest.config.*` | `config/` | Tool configuration |
| `vitest.config.*` | `config/` | Tool configuration |
| `playwright.config.*` | `config/` | Tool configuration |
| `.eslintrc*` | `config/` | Tool configuration |
| `.prettierrc*` | `config/` | Tool configuration |
| `*.ps1$` | `scripts/` | Script files |
| `*.sh$` | `scripts/` | Script files |
| `start-*` | `scripts/deployment/` | Deployment scripts |
| `stop-*` | `scripts/deployment/` | Deployment scripts |
| `deploy*` | `scripts/deployment/` | Deployment scripts |

---

## 🔍 Validation & Enforcement

### Automated Validation

**Check compliance anytime:**
```powershell
pwsh -File scripts/enforce-root-protocol.ps1
```

**Output:**
```
✅ PROTECTED FILES
✅ NO VIOLATIONS - Root directory compliant!
✅ STATUS: COMPLIANT
```

### Manual Enforcement

**Preview changes (dry-run):**
```powershell
pwsh -File scripts/auto-organize-simple.ps1 -DryRun
```

**Execute reorganization:**
```powershell
pwsh -File scripts/auto-organize-simple.ps1
```

### Scheduling

**Windows Task Scheduler** (recommended):
```powershell
# Run validation weekly
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 9am
$action = New-ScheduledTaskAction -Execute pwsh `
  -Argument "-ExecutionPolicy Bypass -File C:\path\to\scripts\enforce-root-protocol.ps1"
Register-ScheduledTask -TaskName "Workspace-Root-Validation" -Trigger $trigger -Action $action
```

---

## 📝 Guidelines for New Files

**When adding a new file to the project:**

1. **Identify the file type** (config, doc, test, script, etc.)
2. **Check semantic directory** for appropriate location
3. **Place in correct directory** (not root)
4. **Validate with** `pwsh -File scripts/enforce-root-protocol.ps1`

**Decision Tree:**

```
New File Created
    ↓
Is it README.md or package*.json or .gitignore?
    YES → Root ✓
    ↓ NO
Is it a config file (jest, prettier, eslint)?
    YES → config/ ✓
    ↓ NO
Is it documentation (.md, .txt, reports)?
    YES → docs/ ✓
    ↓ NO
Is it a test file (test_*, verify_*, *.spec)?
    YES → tests/fixtures/ ✓
    ↓ NO
Is it a script (.ps1, .sh)?
    YES → scripts/ ✓
    ↓ NO
Is it a deployment script (deploy, start, stop)?
    YES → scripts/deployment/ ✓
    ↓ NO
UNKNOWN → Ask team lead or place in closest match
```

---

## ✅ Verification Checklist

**Before committing new files:**

- [ ] File is NOT in root (if it shouldn't be)
- [ ] File is in semantic directory matching its function
- [ ] No config files in root
- [ ] No documentation in root (except README.md)
- [ ] No test files in root
- [ ] No scripts in root (except automation)
- [ ] Ran `enforce-root-protocol.ps1` - reports 0 violations
- [ ] No other team members' files were moved

**After moving/adding files:**
```powershell
# Always validate
pwsh -File scripts/enforce-root-protocol.ps1
```

Expected output: `✅ STATUS: COMPLIANT`

---

## 🚫 What NOT to Do

**❌ Anti-patterns to avoid:**

```powershell
# ❌ DON'T: Add test files to root
# test_myfeature.js in root - WRONG

# ✅ DO: Place in tests/
# tests/fixtures/test_myfeature.js - CORRECT

# ❌ DON'T: Add docs to root
# API_DOCUMENTATION.md in root - WRONG

# ✅ DO: Place in docs/
# docs/API_DOCUMENTATION.md - CORRECT

# ❌ DON'T: Add config to root
# webpack.config.js in root - WRONG

# ✅ DO: Place in config/
# config/webpack.config.js - CORRECT
```

---

## 📊 Current Structure

**Compliance Status:** ✅ **100%**

```
Root: 4 files
├── README.md
├── package.json
├── package-lock.json
└── .gitignore

Subdirectories: 7 organized folders
├── config/           (3 config files)
├── docs/            (5+ documentation files)
├── scripts/         (6+ scripts)
├── tests/           (6+ test files)
├── server/          (API + backend)
├── client/          (React SPA)
└── ... (other semantic folders)
```

---

## 🔗 Related Documents

- `ROOT_REORGANIZATION_COMPLETE_2025-10-30.md` - Detailed reorganization log
- `enforce-root-protocol.ps1` - Validation script
- `root-analyzer.ps1` - File analysis tool
- `auto-organize-simple.ps1` - Auto-reorganization tool

---

## 📞 Questions or Issues?

**To check root compliance:**
```powershell
pwsh -File scripts/enforce-root-protocol.ps1
```

**To preview required moves:**
```powershell
pwsh -File scripts/auto-organize-simple.ps1 -DryRun
```

**To fix violations automatically:**
```powershell
pwsh -File scripts/auto-organize-simple.ps1
```

---

**Last Updated:** October 30, 2025  
**Maintained By:** Workspace Automation Tools  
**Compliance Level:** ENFORCED ✅
