# Server Crash & Recovery - November 2, 2025

## Problem
Server crashed with error: **Cannot find module 'whitelabel-routes.js'**

**Root Cause:** Only `app.js` fue copiado al VPS, pero faltaban todos los otros archivos de rutas (`*-routes.js`)

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/root/app/server/whitelabel-routes.js'
```

## Solution
Copiar TODOS los archivos del servidor (`server/*.js`) al VPS, no solo `app.js`

### Files Deployed
- `app.js` (main app)
- `server.js` (entry point)
- `db.js` (database connection)
- `auth_middleware.js` (authentication)
- `auth_routes.js` (login/logout)
- `admin-routes.js` (admin panel)
- `usuarios-routes.js` (user management)
- `tipos-routes.js` (report types)
- `reportes_auth_routes.js` (report endpoints)
- `asignaciones-routes.js` (assignments)
- `dependencias-routes.js` (departments)
- `whitelabel-routes.js` (branding)
- Y 40+ otros archivos de utilidades y scripts

## Deployment Process
```bash
# 1. Copy all server JS files
scp -r C:\PROYECTOS\citizen-reports\server\*.js root@145.79.0.77:/root/app/server/

# 2. Restart PM2
ssh root@145.79.0.77 "pm2 restart app"

# 3. Verify status
ssh root@145.79.0.77 "pm2 status"
```

## Result
✅ Server online
✅ PID 259235
✅ Memory: 57.7MB
✅ All routes working

## Lesson Learned
Always sync ALL application files to production, not just the main ones. When deploying updates to production:

1. **Deploy the entire `/server` directory**, not individual files
2. **Verify all imports** work before restarting
3. **Check PM2 logs** for missing module errors

## Prevention Strategy
Create a deployment script that:
- Checks for missing imports before restart
- Deploys complete directories atomically
- Validates all required files exist before restart
- Has rollback capability

