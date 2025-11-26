# citizen-reports Workspace - Quick Start Guide

**Last Updated:** October 30, 2025 (Root Reorganization Complete ✅)

## 🎯 Current Status

- ✅ **Root Directory:** 100% Compliant (4 essential files only)
- ✅ **System:** Fully operational and organized
- ✅ **Files:** 22 files reorganized into semantic directories
- ✅ **Automation:** Compliance validation tools in place

---

## 📁 Updated File Structure

### Root Directory (Protected - 4 Files)
```
citizen-reports/
├── README.md              ← Project documentation
├── package.json          ← Dependencies
├── package-lock.json     ← Lock file
└── .gitignore           ← Git ignore rules
```

### Core Application Directories (Unchanged)
```
├── server/               ← Express API & database
├── client/              ← React SPA (Vite)
├── code_surgeon/        ← Code automation
├── backups/             ← Database backups
└── Citizen-reports/     ← Separate project
```

### Organized Directories (New Structure)
```
├── config/              ← Tool configurations
│   ├── jest.config.cjs
│   ├── playwright.config.ts
│   └── vitest.config.ts
│
├── docs/               ← Documentation & reports
│   ├── ROOT_PROTOCOL.md (NEW)
│   ├── architecture.md
│   ├── adr/
│   ├── root-analysis-report.json
│   └── ... (other docs)
│
├── scripts/            ← Automation & maintenance
│   ├── enforce-root-protocol.ps1 (NEW - Validator)
│   ├── auto-organize-simple.ps1 (NEW - Reorganizer)
│   ├── root-analyzer.ps1
│   ├── check-servers.ps1
│   ├── deployment/     ← Production scripts
│   └── ...
│
└── tests/             ← Testing
    ├── backend/
    ├── frontend/
    ├── e2e/
    └── fixtures/      ← Test files (NEW location)
        ├── test_audit_trail.js
        ├── test_endpoint.js
        └── ...
```

---

## 🚀 Quick Start Commands

### Development Setup
```powershell
cd C:\PROYECTOS\citizen-reports

# Initialize database (first time only)
cd server
npm install
npm run init

# Frontend setup
cd ..\client
npm install
npm run dev

# Backend setup (in another terminal)
cd server
npm run dev
```

### Validate Root Compliance
```powershell
# Check if root directory follows standards
pwsh -File scripts/enforce-root-protocol.ps1

# Expected output: ✅ STATUS: COMPLIANT
```

### Fix Violations (if new files added incorrectly to root)
```powershell
# Preview changes (dry-run)
pwsh -File scripts/auto-organize-simple.ps1 -DryRun

# Execute reorganization
pwsh -File scripts/auto-organize-simple.ps1
```

### Check Server Status
```powershell
pwsh -File scripts/check-servers.ps1
```

---

## 📚 Key Documentation

### New Documents (October 30, 2025)
| Document | Location | Purpose |
|----------|----------|---------|
| **ROOT_PROTOCOL.md** | `docs/ROOT_PROTOCOL.md` | Complete protocol & standards |
| **WORKSPACE_REORGANIZATION_FINAL_REPORT_2025-10-30.md** | `docs/` | Detailed reorganization report |
| **ROOT_REORGANIZATION_COMPLETE_2025-10-30.md** | `docs/` | Reorganization log & verification |

### Essential Documents
| Document | Location | Purpose |
|----------|----------|---------|
| **README.md** | Root | Project overview & setup |
| **architecture.md** | `docs/` | System architecture |
| **INICIO_RAPIDO.md** | `docs/` | Spanish quick start |
| **SISTEMA_AUTENTICACION.md** | `docs/` | Auth system guide |

---

## 🔍 New Automation Tools

### 1. enforce-root-protocol.ps1 (Validator)
**Location:** `scripts/enforce-root-protocol.ps1`

Validates that root directory follows world-class standards.

**Usage:**
```powershell
pwsh -File scripts/enforce-root-protocol.ps1
```

**Output:**
```
✅ PROTECTED FILES (4/4 present)
🟢 NO VIOLATIONS
✅ STATUS: COMPLIANT
```

### 2. auto-organize-simple.ps1 (Reorganizer)
**Location:** `scripts/auto-organize-simple.ps1`

Safely reorganizes files into correct directories.

**Usage:**
```powershell
# Preview (no changes)
pwsh -File scripts/auto-organize-simple.ps1 -DryRun

# Execute
pwsh -File scripts/auto-organize-simple.ps1

# With confirmation prompt
pwsh -File scripts/auto-organize-simple.ps1 -Confirm
```

### 3. root-analyzer.ps1 (Analyzer)
**Location:** `scripts/root-analyzer.ps1`

Intelligent file categorization and analysis.

**Usage:**
```powershell
pwsh -File scripts/root-analyzer.ps1 -Verbose
```

**Output:** JSON report with file categorization & confidence scores

---

## 📋 File Categorization Rules

### Protected (Stay in Root)
- README.md
- package.json
- package-lock.json
- .gitignore
- LICENSE (optional)

### Configuration Files → config/
- jest.config.*
- vitest.config.*
- playwright.config.*
- .eslintrc*
- .prettierrc*
- tsconfig.json

### Documentation → docs/
- *.md files (except README)
- *.txt files
- *.json reports
- API specs
- Architecture docs

### Tests → tests/fixtures/
- test_*.js files
- verify_*.js files
- *.spec.js files
- *.test.js files

### Scripts → scripts/
- *.ps1 files
- *.sh files
- Automation scripts
- Maintenance scripts

---

## ✅ System Status

### Currently Operational
✅ Backend API: `server/app.js`  
✅ Frontend SPA: `client/src/App.jsx`  
✅ Database: `server/data.db`  
✅ Config: `config/` folder  
✅ Tests: `tests/` folder  
✅ Documentation: `docs/` folder  

### Service Verification
```powershell
# Check all servers running
pwsh -File scripts/check-servers.ps1

# Validate compliance
pwsh -File scripts/enforce-root-protocol.ps1

# Run tests
npm run test:all
```

---

## 🔄 Maintenance Tasks

### Weekly
```powershell
# Validate root compliance
pwsh -File scripts/enforce-root-protocol.ps1
```

### Before Each Commit
```powershell
# Ensure no violations
pwsh -File scripts/enforce-root-protocol.ps1

# Preview if new files were added
pwsh -File scripts/auto-organize-simple.ps1 -DryRun
```

### Database Backup
```powershell
npm run backup:db
```

---

## 🐛 Troubleshooting

### Root directory compliance check fails?
```powershell
# Preview what needs to be fixed
pwsh -File scripts/auto-organize-simple.ps1 -DryRun

# Fix automatically
pwsh -File scripts/auto-organize-simple.ps1
```

### Can't find a file?
```powershell
# Analyze current structure
pwsh -File scripts/root-analyzer.ps1

# Output will show all files and their suggested locations
```

### Servers not running?
```powershell
# Check status
pwsh -File scripts/check-servers.ps1

# Start from appropriate terminal
cd server && npm run dev
cd client && npm run dev
```

---

## 📞 Key Contacts & Resources

**Workspace Protocol:** `docs/ROOT_PROTOCOL.md`  
**System Architecture:** `docs/architecture.md`  
**API Documentation:** `docs/api/openapi.yaml`  
**Test Guide:** `docs/GUIA_PRUEBA_*.md`  

---

## 🎯 Success Criteria

- ✅ Root directory has only 4 files
- ✅ All config files in config/
- ✅ All docs in docs/
- ✅ All tests in tests/
- ✅ All scripts in scripts/
- ✅ enforce-root-protocol.ps1 shows 0 violations
- ✅ System remains fully operational
- ✅ No broken import paths

**Current Status:** ✅ **ALL CRITERIA MET**

---

**Last Reorganization:** October 30, 2025  
**Files Moved:** 22/22 (100% success)  
**Compliance:** 100% ✅
