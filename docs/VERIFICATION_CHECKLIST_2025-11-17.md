# TECHNICAL CHECKLIST - Frontend API Routes Bugfix Verification
## November 17, 2025

**Purpose:** Verification steps for QA and deployment teams  
**Related Doc:** `docs/BUGFIX_API_ENDPOINT_PATHS_2025-11-17.md`

---

## ✅ Pre-Deployment Verification

### 1. Code Changes Verification
```bash
# Verify exact changes made
git diff client/src/MapView.jsx
git diff client/src/VerReporte.jsx

# Expected output:
# - MapView.jsx: 1 line changed (line 38)
# - VerReporte.jsx: 6 lines changed (lines 142, 143, 190, 224, 267, 300, 342, 375)
# All changes: adding "/api" prefix to routes
```

### 2. Grep Search Verification
```bash
# Confirm no remaining broken routes in frontend
cd client/src
grep -r "API_BASE.*}/reportes[^/]" . || echo "✅ No broken routes found"

# Should output: No broken routes found
```

### 3. Pattern Compliance Check
```bash
# Verify other files already use correct patterns
grep -l "listarReportes\|/api/reportes" client/src/**/*.jsx

# Expected files with correct patterns:
# ✅ api.js (defines listarReportes helper)
# ✅ ImprovedMapView.jsx (uses helper)
# ✅ SimpleApp.jsx (uses helper)
# ✅ PanelFuncionario.jsx (uses /api/reportes)
# ✅ MapView.jsx (NOW FIXED)
# ✅ VerReporte.jsx (NOW FIXED)
```

---

## ✅ Build Verification

### 1. Frontend Build
```bash
cd client
npm install                           # Ensure dependencies
npm run build                         # Build SPA

# Expected output:
# dist/index.html (generated)
# dist/assets/index-*.js (generated, includes fixes)
# No errors or warnings
```

### 2. Backend Readiness
```bash
cd server
npm install                           # Ensure dependencies
npm run init                          # Initialize database

# Expected output:
# ✅ Database initialized from schema.sql
# ✅ All tables created
# ✅ Test data loaded (if using seed)
```

### 3. Full Test Suite
```bash
npm run test:all

# Expected output:
# ✅ Jest: 80/90 tests passing (same as before fix)
# ✅ Vitest: Frontend tests pass
# ✅ Playwright: E2E tests pass
# Duration: ~35 seconds
```

---

## ✅ Runtime Verification (Dev Environment)

### 1. Start Services
```bash
# Terminal 1: Start server
cd server
npm run dev                           # Starts on port 4000

# Terminal 2: Start client
cd client
npm run dev                           # Starts on port 5173

# Expected:
# ✅ Server running at http://localhost:4000
# ✅ Client running at http://localhost:5173
# ✅ API proxy working (VITE_API_URL=http://localhost:4000)
```

### 2. Browser DevTools Verification
```
1. Open http://localhost:5173
2. Open DevTools (F12) → Network tab
3. Look for reports requests:

✅ SHOULD SEE:
   GET /api/reportes?minLat=...&maxLat=...&minLng=...&maxLng=...&estado=abiertos
   Status: 200 OK
   Response: JSON array of reports

❌ SHOULD NOT SEE:
   GET /reportes?minLat=...maxLat=... (without & separators)
   Status: 500 Internal Server Error
```

### 3. Map Functionality Check
```
1. Page should load without errors
2. Map should display without errors in console
3. Click on map to create report
4. Verify request goes to /api/reportes (POST)
5. Verify response is 201 Created
6. Report appears on map
```

### 4. Report Details Verification
```
1. Click on a report marker on map
2. VerReporte modal should load without errors
3. DevTools Network tab should show:
   - GET /api/reportes/{id}                     (200 OK)
   - GET /api/reportes/{id}/asignaciones        (200 OK)
   - GET /api/reportes/{id}/historial           (200 OK)
4. Modal displays all information correctly
```

---

## ✅ Production Deployment Checklist

### Pre-Deployment
- [ ] All code changes reviewed
- [ ] All tests passing (`npm run test:all`)
- [ ] Client built (`npm run build`)
- [ ] Documentation updated (this file + CHANGELOG)
- [ ] No uncommitted changes in git

### Deployment Steps
```bash
# Option 1: Using deploy.ps1 (recommended)
cd /root/citizen-reports
.\deploy.ps1 -Message "Fix: Missing /api prefix in frontend routes"

# Option 2: Manual
git pull origin main
cd client && npm run build
scp -r client/dist/* root@145.79.0.77:/root/citizen-reports/server/dist/
ssh root@145.79.0.77 "cd /root/citizen-reports && npm install && pm2 restart citizen-reports-app"
```

### Post-Deployment Verification
```bash
# SSH into production server
ssh root@145.79.0.77

# Check app status
pm2 status citizen-reports-app

# Check logs
pm2 logs citizen-reports-app --lines 50

# Verify database
sqlite3 /root/citizen-reports/data.db "SELECT COUNT(*) FROM reportes;" 

# Test endpoint
curl http://localhost:4000/api/reportes?estado=abiertos

# Expected response: JSON array of open reports (HTTP 200)
```

---

## ✅ Browser Testing (QA Sign-Off)

### Smoke Test Scenarios

**Scenario 1: Map Load**
- [ ] Navigate to http://145.79.0.77/
- [ ] Map loads without errors
- [ ] Existing reports display as markers
- [ ] DevTools shows GET /api/reportes?... returning 200

**Scenario 2: Create Report**
- [ ] Click on map (or use "Reportar" button)
- [ ] Form modal opens
- [ ] Fill form (tipo, descripcion, coordinates)
- [ ] Click "Enviar"
- [ ] DevTools shows POST /api/reportes returning 201
- [ ] New marker appears on map

**Scenario 3: View Report Details**
- [ ] Click existing report marker
- [ ] Detail modal opens
- [ ] DevTools shows GET /api/reportes/{id} returning 200
- [ ] All report info displays (tipo, estado, ubicación, etc.)

**Scenario 4: Assignations (If logged in as Supervisor)**
- [ ] Click "Asignar" button
- [ ] Funcionario dropdown loads
- [ ] Select funcionario and assign
- [ ] DevTools shows POST /api/reportes/{id}/asignaciones returning 201
- [ ] Assignment appears in list

**Scenario 5: Closure Request (If logged in as Funcionario)**
- [ ] Navigate to report assigned to you
- [ ] Click "Solicitar Cierre" button
- [ ] Modal opens for closure confirmation
- [ ] Submit closure request
- [ ] DevTools shows POST /api/reportes/{id}/solicitar-cierre returning 200
- [ ] Workflow progresses correctly

---

## ✅ Monitoring Checklist

### Daily Verification (First Week After Deploy)
```bash
# Set up daily check:
# 1. Check PM2 logs for any 500 errors
#    pm2 logs citizen-reports-app | grep "500"
#    pm2 logs citizen-reports-app | grep "error"

# 2. Monitor database health
#    SELECT COUNT(*) FROM reportes;
#    SELECT COUNT(*) FROM usuarios;
#    SELECT COUNT(*) FROM sesiones;

# 3. Sample API calls
#    curl http://145.79.0.77/api/reportes?estado=abiertos
#    curl http://145.79.0.77/api/reportes/1
#    curl http://145.79.0.77/api/tipos-reporte

# 4. Check browser error tracking (if available)
#    Look for 500 errors in production logs
```

### Performance Baseline (For Reference)
```
Before Fix:
- Map load time: Blocked by 500 errors
- Report view: 500 errors
- Query time: N/A (blocked)

After Fix:
- Map load time: ~200ms + tile loading
- Report view: ~100ms API call + render
- Query time: ~50-100ms (depends on count)
```

---

## 🚨 Rollback Plan (If Issues Found)

```bash
# If problems occur in production, rollback:
cd /root/citizen-reports

# Revert to previous commit
git revert HEAD
cd client && npm run build
pm2 restart citizen-reports-app

# Or use PM2 to reload from backup
pm2 save
pm2 resurrect  # restores previous config
```

---

## 📞 Escalation Contacts

| Role | Action | Contact |
|------|--------|---------|
| QA Tester | Test fails on scenario X | Check DevTools for actual vs expected API calls |
| Developer | Tests failing | Review related bugfix doc: `BUGFIX_API_ENDPOINT_PATHS_2025-11-17.md` |
| DevOps | Deployment fails | Verify PM2 logs: `pm2 logs citizen-reports-app` |
| Support | Users report "offline" | Check if GET /api/reportes returning 200 in browser Network tab |

---

## ✅ Final Sign-Off

- [ ] Code review completed
- [ ] All tests passing (80/90 minimum)
- [ ] Local dev environment verified
- [ ] Production deployment completed
- [ ] Post-deployment verification passed
- [ ] No 500 errors in logs
- [ ] Users can create, view, and manage reports
- [ ] Map displays correctly with existing data

**Approved by:** ___________________  
**Date:** ___________________  
**Environment:** [ ] DEV  [ ] STAGING  [ ] PROD

---

**Document Version:** 1.0  
**Last Updated:** November 17, 2025  
**Related Files:**
- `docs/BUGFIX_API_ENDPOINT_PATHS_2025-11-17.md` - Technical details
- `docs/SESSION_SUMMARY_2025-11-17.md` - Session overview
- `CHANGELOG.md` - Release notes
