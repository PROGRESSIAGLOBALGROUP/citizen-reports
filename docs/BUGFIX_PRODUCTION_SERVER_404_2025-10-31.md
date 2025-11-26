# BUGFIX: Production Server 404 Error - Wrong Entry Point

**Date:** October 31, 2025  
**Severity:** 🔴 **CRITICAL** - All authenticated endpoints fail  
**Status:** ROOT CAUSE IDENTIFIED

---

## Problem Description

### Symptom
- Production server at `http://145.79.0.77:4000` returns **404 errors** for all authenticated endpoints
- **Affected endpoints:**
  - `/api/reportes/mis-reportes` (get assigned reports) ❌
  - `/api/reportes/cierres-pendientes` (get pending closures) ❌
  - `/api/auth/login` (authentication) ❌
  - All other authenticated routes ❌

- **Working endpoints (public only):**
  - `/api/reportes` (GET all reports, no auth required) ✅
  - `/api/reportes/tipos` (GET types, no auth required) ✅

### Impact
- Admin panel completely broken (cannot load "Mis Reportes Asignados")
- No users can authenticate
- System is down for all authenticated operations

### Error Message
```
Failed to load resource: the server responded with a status of 404 (Not Found)
GET http://145.79.0.77:4000/api/reportes/mis-reportes
```

---

## Root Cause Analysis

### Investigation Timeline

**Step 1: Code Review**
- Verified `/api/reportes/mis-reportes` endpoint EXISTS in `server/reportes_auth_routes.js` ✅
- Verified endpoint is registered in `server/app.js` at line 97 ✅
- Verified route order is correct (specific routes BEFORE wildcards) ✅
- Frontend fetch syntax is correct (`Authorization: Bearer {token}` header) ✅

**Step 2: Entry Point Discovery** 🎯
- Checked `package.json`: `"start": "node server.js"` ✅
- Reviewed `server/server.js`: Correctly imports `createApp()` from `app.js` ✅
- **Found:** File `server/production-server.js` exists and is a MINIMAL server

**Step 3: Comparison**

| File | Endpoints | Authentication | Status |
|------|-----------|----------------|--------|
| `server.js` | ✅ All (comprehensive) | ✅ Full auth system | **CORRECT** |
| `app.js` | ✅ All (comprehensive) | ✅ Full auth system | **CORRECT** |
| `production-server.js` | ❌ Only 3 basic endpoints | ❌ NO AUTH | **WRONG** |

**Key Finding:**
```
production-server.js only has:
❌ GET /api/reportes (list all, no auth)
❌ POST /api/reportes (create, no auth)
❌ GET /api/reportes/tipos (list types, no auth)

Missing:
❌ /api/reportes/mis-reportes
❌ /api/reportes/cierres-pendientes
❌ /api/auth/login
❌ /api/usuarios/* (user management)
❌ /api/admin/* (all admin routes)
❌ ALL authenticated endpoints
```

### Conclusion

**THE PRODUCTION SERVER IS RUNNING `production-server.js` INSTEAD OF `server.js`**

Someone (manually or via script) is executing:
```bash
node production-server.js  # ❌ WRONG - minimal server
```

Instead of:
```bash
node server.js  # ✅ CORRECT - full server with auth
```

Or via npm:
```bash
npm start  # ✅ Uses server.js (correct)
```

---

## Solution

### Option 1: Use Correct Entry Point (RECOMMENDED)

**Kill the current process and restart with correct server:**

```bash
# SSH to production server
ssh user@145.79.0.77

# Stop current process
pkill -f "node production-server.js"  # or use PM2

# Start with CORRECT entry point
cd /path/to/citizen-reports/server
npm start  # Runs: node server.js

# OR if using PM2:
pm2 start server.js --name "citizen-reports"
```

**Verification:**
```bash
# Server should print:
# ✅ Servidor production en http://localhost:4000

# Then test endpoint
curl -X GET "http://145.79.0.77:4000/api/reportes/mis-reportes" \
  -H "Authorization: Bearer {valid_token}"
# Should return: [...assigned reports] (not 404)
```

### Option 2: Update Production Server File (If deliberate)

If `production-server.js` was created intentionally as a "minimal" deployment, it needs to be updated to include authenticated endpoints. But this is NOT recommended - use `server.js` instead.

---

## Technical Details

### Why This Happened

1. **Multiple Server Files:** Project has both
   - `server/server.js` - Main entry point (✅ correct)
   - `server/production-server.js` - Minimal version (❌ wrong)

2. **Manual Deployment:** Likely someone ran production-server manually during deployment/testing

3. **No Enforcement:** `package.json` is correct, but someone bypassed it

### Why `production-server.js` Is Wrong

**File location:** `c:\PROYECTOS\citizen-reports\server\production-server.js`

**Missing critical features:**
- ❌ No authentication middleware
- ❌ No `configurarRutasReportes()` (missing ALL report management endpoints)
- ❌ No `configurarRutasAuth()` (missing login/logout)
- ❌ No user management endpoints
- ❌ No admin endpoints
- ❌ Only 66 lines vs 395 lines in `app.js`

**What it does have:**
- ✅ Basic `/api/reportes` GET/POST (public)
- ✅ Basic `/api/reportes/tipos` (public)
- ✅ SPA static file serving
- ✅ That's it

### Why `server.js` Is Correct

**File location:** `c:\PROYECTOS\citizen-reports\server\server.js`

**Imports full application:**
```javascript
import { createApp } from './app.js';
const app = createApp();
```

**`app.js` includes:**
- ✅ All authentication routes
- ✅ All report management routes (authenticated)
- ✅ User management (admin)
- ✅ Categories/types management (admin)
- ✅ Departments management (admin)
- ✅ Proper middleware stack (helmet, cors, compression, morgan)
- ✅ CSP compliance
- ✅ Proper error handling

---

## Verification Checklist

After deploying fix:

- [ ] Server process is running `server.js` not `production-server.js`
- [ ] Server logs show: `✅ Servidor production en http://localhost:4000`
- [ ] Endpoint `/api/reportes/mis-reportes` returns 200 (not 404)
- [ ] Admin can login and access panel
- [ ] "Mis Reportes Asignados" tab loads without error
- [ ] All authenticated endpoints working

### Test Command

```bash
# Get current user's assigned reports
curl -X GET "http://145.79.0.77:4000/api/reportes/mis-reportes" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json"

# Expected response (array of reports):
# [{"id":1,"tipo":"bache","descripcion":"...","estado":"nuevo",...}]

# NOT expected:
# {"error": "Cannot GET /api/reportes/mis-reportes"}
```

---

## Prevention

### For Future Deployments

1. **Always use `npm start`** (respects package.json)
   ```bash
   cd server && npm start
   ```

2. **Never execute production-server.js directly**
   ```bash
   # ❌ DON'T:
   node production-server.js
   
   # ✅ DO:
   node server.js
   # OR
   npm start
   ```

3. **Use PM2 with ecosystem file** (recommended)
   ```bash
   pm2 start ecosystem.config.js --env production
   ```

4. **Document in deployment guide** what the correct entry point is

---

## Files Involved

- **Entry point (CORRECT):** `server/server.js`
- **Application definition:** `server/app.js`
- **Authenticated routes:** `server/reportes_auth_routes.js`
- **Minimal version (WRONG):** `server/production-server.js`
- **Configuration:** `server/package.json`

---

## Next Steps

1. ✅ **Identified root cause:** Wrong server file being executed
2. ⏳ **NEXT:** SSH to 145.79.0.77 and kill `production-server` process
3. ⏳ **NEXT:** Start correct process: `cd server && npm start`
4. ⏳ **NEXT:** Test endpoints via curl/browser
5. ⏳ **NEXT:** Verify admin panel works
6. ⏳ **NEXT:** Add PM2 restart configuration to prevent recurrence

---

## Escalation Notes

- **Severity:** CRITICAL - Production is down
- **Root Cause:** Operator error (wrong server file)
- **Fix Time:** 2-5 minutes (restart server)
- **Impact:** Zero data loss, immediate service recovery
- **Prevention:** Document correct deployment procedure
