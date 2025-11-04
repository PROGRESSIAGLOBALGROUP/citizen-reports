# 🚨 INCIDENT REPORT: Production Server Crash - November 4, 2025

**Date:** November 4, 2025, 16:30-16:35 UTC  
**Duration:** ~5 minutes  
**Status:** ✅ **RESOLVED**

---

## 📊 INCIDENT SUMMARY

**Issue:** Production server (145.79.0.77) was down  
**Root Cause:** Missing production dependencies in `package.json`  
**Impact:** Application not responding on port 4000  
**Resolution:** Updated package.json with required dependencies

---

## 🔍 INVESTIGATION TIMELINE

### Detection (16:30)
```
User Report: "El server de prod está caído"
```

### Diagnosis
1. SSH to server: `ssh root@145.79.0.77`
2. Check PM2 status: Shows services "online" but not responding
3. Check port 4000: NOT listening
4. Check port 3000: Webhook server listening (OK)
5. Check error logs: `/root/logs/app-error-1.log`

**Error Found:**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'dotenv'
```

### Root Cause Analysis

**Primary Issue:** `package.json` missing backend dependencies

**Original package.json dependencies:**
```json
{
  "dependencies": {
    "@aws-sdk/client-s3": "^3.649.0",
    "@azure/storage-blob": "^12.17.0",
    "tar": "^6.2.1"
  }
}
```

**Missing packages:**
- ❌ `dotenv` - Required by server.js line 1
- ❌ `sqlite3` - Required by db.js
- ❌ `express` - Web framework
- ❌ `helmet` - Security
- ❌ `cors` - Cross-origin
- ❌ `compression` - Gzip
- ❌ `morgan` - Logging
- ❌ `bcrypt` - Password hashing

### Why This Happened

When project was cloned to VPS and `npm install` ran from root `package.json`, it only installed the dependencies listed there. The root `package.json` is a workspace root and doesn't list all backend dependencies.

The backend dependencies are actually in `server/package.json` in a normal monorepo setup, but they were referenced from root `server/server.js` imports.

---

## ✅ RESOLUTION

### Fix Applied

Updated `/package.json` with complete backend dependencies:

```json
{
  "dependencies": {
    "@aws-sdk/client-s3": "^3.649.0",
    "@azure/storage-blob": "^12.17.0",
    "tar": "^6.2.1",
    "dotenv": "^16.4.5",
    "sqlite3": "^5.1.7",
    "express": "^4.18.2",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "compression": "^1.7.4",
    "morgan": "^1.10.0",
    "bcrypt": "^5.1.1"
  }
}
```

### Steps Taken

1. ✅ Identified missing dotenv package
2. ✅ Ran `npm install dotenv` (1 package added)
3. ✅ Attempted restart: Still crashed (found sqlite3 missing)
4. ✅ Updated package.json with all missing dependencies
5. ✅ Ran `npm install` (195 packages added, 1022 total)
6. ✅ Restarted citizen-reports-app with PM2
7. ✅ Verified app responding on port 4000
8. ✅ Verified webhook server responding on port 3000
9. ✅ Published fix to GitHub (commit 1e8a8fb)

### Verification

**Post-fix status:**
```
✅ citizen-reports-app (port 4000) - ONLINE, responding
✅ webhook-server (port 3000) - ONLINE, responding
✅ http://145.79.0.77:4000 - LIVE
✅ API endpoints working
```

---

## 📈 IMPACT ANALYSIS

**Service Downtime:** ~5 minutes  
**Users Affected:** Anyone accessing http://145.79.0.77:4000  
**Data Loss:** None (SQLite database intact)  
**Deployments:** None during outage

---

## 🛡️ PREVENTION MEASURES

### 1. **Root Cause Prevention** ✅
- Updated package.json with all required dependencies
- Will prevent this error on future `npm install`

### 2. **Early Detection** (For Future)
- Add health check script to deployment verification
- Check all required packages present after npm install
- Monitor port 4000 availability

### 3. **Documentation Update** 
- Add troubleshooting section for missing dependencies
- Document where each major dependency comes from

### 4. **CI/CD Enhancement** (Recommended)
- Add pre-deployment verification step:
  ```bash
  npm ls dotenv sqlite3 express || exit 1
  ```
- This would catch missing packages before deployment

---

## 🔧 TECHNICAL DETAILS

### Error Stack

**Original Error:**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'dotenv' 
  imported from /root/citizen-reports/server/server.js
  at packageResolve (node:internal/modules/esm/resolve:873:9)
  ...
```

**Server.js Import:**
```javascript
import 'dotenv/config';  // Line 1 - triggers dotenv loading
import { initDb } from './db.js';
import { createApp } from './app.js';
```

### Deployment Script Check

The deploy.sh script already includes:
```bash
npm install  # This should have caught it!
```

**Why it didn't:**
- `npm install` ran successfully
- But package.json was incomplete
- npm didn't error (it just installed what was listed)

---

## 📋 CHECKLIST FOR FUTURE PRODUCTION ISSUES

```
Server Down Detection:
□ SSH to server: ssh root@145.79.0.77
□ Check PM2 status: pm2 status
□ Check port: curl http://localhost:4000 (timeout = problem)
□ Check logs: tail -50 /root/logs/app-error-1.log
□ Check port listening: netstat -tlnp | grep 4000

Common Issues:
□ Missing packages? npm ls <package> OR npm install
□ Port in use? lsof -ti:4000 | xargs kill -9
□ Database locked? ps aux | grep sqlite
□ Memory? free -h
□ Disk? df -h

Recovery:
□ Fix issue
□ Test locally: npm start
□ Restart: pm2 restart all
□ Verify: curl http://localhost:4000
□ Monitor: pm2 logs
□ Commit: git add/commit/push
```

---

## 📞 ESCALATION NOTES

**If this happens again:**

1. Check `/root/logs/` for error details
2. Common issues:
   - Missing packages → `npm install`
   - Port conflict → `lsof -ti:4000 | xargs kill -9`
   - Database locked → check processes
   - Out of memory → `free -h`
   - Out of disk → `df -h`

3. Restart application:
   ```bash
   pm2 restart citizen-reports-app
   pm2 logs citizen-reports-app
   ```

4. If still down, check error log and search for package names

---

## 🎓 LESSONS LEARNED

1. **Monorepo Dependency Management:**
   - Root package.json must include all backend dependencies
   - Or use `npm install` from each workspace folder

2. **Pre-deployment Verification:**
   - Check all critical packages are present
   - Test npm install produces all required modules

3. **Logging Improvement:**
   - Had clear error logs, made debugging fast
   - PM2 logging + file logs very helpful

4. **Process Resilience:**
   - PM2 auto-restart helped confirm issue wasn't transient
   - But couldn't fix missing dependencies

---

## ✅ FINAL STATUS

**Production Environment:**
- ✅ Application: ONLINE at http://145.79.0.77:4000
- ✅ Webhook Server: ONLINE at http://145.79.0.77:3000
- ✅ Database: SQLite intact, operational
- ✅ All services: Responding correctly
- ✅ Fix: Committed to GitHub (commit 1e8a8fb)

**Ready for deployments:** YES ✅

---

**Incident Resolution Time:** 5 minutes  
**Status:** CLOSED  
**Date Fixed:** November 4, 2025, 16:35 UTC
