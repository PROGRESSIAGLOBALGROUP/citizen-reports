# 🚀 DESPLIEGUE A PRODUCCIÓN - LOGIN BUGFIX (22 NOV 2025)

**Estado:** ✅ Listo para desplegar  
**Cambios:** Fix error 500 en POST /api/auth/login  
**Tests:** ✅ 8/8 E2E tests passing  
**Servidor:** http://145.79.0.77:4000

---

## 🎯 Resumen del Fix

**Problema:** POST /api/auth/login retorna error 500 "Error al crear sesión"  
**Causa Raíz:** Tabla `sesiones` missing o corrupted en BD de producción  
**Solución:** Idempotent schema repair + health checks post-deploy

### Archivos Desplegados

1. **server/repair-auth-production.js** (120 líneas)
   - Reparación automática de BD
   - Valida estructura de tabla sesiones
   - Intenta INSERT para confirmar funcionalidad

2. **server/health-check-post-deploy.js** (100 líneas)
   - Validación post-deploy automática
   - Ejecuta después de cada reinicio PM2
   - Detecta fallos temprano

3. **tests/e2e/auth-login.spec.ts** (230 líneas)
   - Suite E2E con 8 tests
   - Valida login flow completo
   - Cubre all test users (admin, supervisor, funcionario)

4. **ecosystem.config.cjs** (modificado)
   - Agregado post_env para health checks
   - Configuración de logs

5. **docs/BUGFIX_LOGIN_ERROR_500_2025-11-22.md**
   - Documentación completa del fix
   - Pasos de validación manual

---

## 🚀 DEPLOY INMEDIATO (Recomendado)

### Opción 1: Script Automático (PowerShell - Windows)

```powershell
cd c:\PROYECTOS\citizen-reports
.\deploy-to-prod-now.ps1 -ServerIP "145.79.0.77"
```

**Qué hace:**
1. ✅ Verifica conexión SSH
2. ✅ Pull código desde GitHub main
3. ✅ Reinicia PM2 citizen-reports-app
4. ✅ Ejecuta health check automático
5. ✅ Verifica API respondiendo (HTTP 200)

### Opción 2: Manual vía SSH

```bash
ssh root@145.79.0.77
cd /root/citizen-reports

# 1. Git pull
git pull origin main

# 2. Backup BD (opcional pero recomendado)
cp server/data.db backups/data.db.backup_$(date +%Y%m%d_%H%M%S)

# 3. Reiniciar aplicación
pm2 restart citizen-reports-app --update-env

# 4. Esperar y monitorear logs
sleep 3
pm2 logs citizen-reports-app

# 5. Ejecutar health check
node server/health-check-post-deploy.js
```

---

## ✅ VALIDACIÓN POST-DEPLOY

### Test Rápido (CLI)

```bash
# Desde tu máquina local
curl -X POST http://145.79.0.77:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@jantetelco.gob.mx",
    "password": "admin123"
  }'

# Debe retornar:
# {
#   "ok": true,
#   "token": "abc123...",  // 64 caracteres hex
#   "usuario": {...}
# }
```

### Test Completo (UI)

1. Navega a http://145.79.0.77
2. Click "Iniciar Sesión"
3. Entra: admin@jantetelco.gob.mx / admin123
4. Debe entrar al mapa sin errores

### Test de Todos los Roles

- ✅ Admin: `admin@jantetelco.gob.mx` / `admin123`
- ✅ Supervisor: `supervisor.obras@jantetelco.gob.mx` / `admin123`  
- ✅ Funcionario: `func.obras1@jantetelco.gob.mx` / `admin123`

---

## 🔧 EN CASO DE PROBLEMAS

### Si POST /api/auth/login sigue fallando:

1. **Verificar BD:**
```bash
node server/repair-auth-production.js
```

2. **Ver logs detallados:**
```bash
pm2 logs citizen-reports-app --lines 100
```

3. **Reiniciar PM2:**
```bash
pm2 restart citizen-reports-app
pm2 save
pm2 startup  # Si fue necesario recrear
```

4. **Último recurso - Reiniciar server:**
```bash
sudo reboot
# Esperarará auto-inicio de PM2 (ecosytem.config.cjs configurado)
```

---

## 📊 MONITOREO POST-DEPLOY

### Ver estado de aplicación:
```bash
pm2 status citizen-reports-app
```

### Ver logs en tiempo real:
```bash
pm2 logs citizen-reports-app --follow
```

### Ver métricas:
```bash
pm2 monit
```

### Health check continuo:
```bash
watch -n 5 'curl -s http://localhost:4000/api/health | jq'
```

---

## 📝 NOTAS IMPORTANTES

- ✅ **Downtime:** 0-2 segundos (reinicio PM2)
- ✅ **Datos:** NO se pierden (SQLite local)
- ✅ **Compatibilidad:** Backward compatible 100%
- ✅ **Rollback:** Si algo falla, checkout commit anterior y restart
- ⚠️ **Testing:** Fue probado localmente con 8/8 tests passing

---

## 📅 Timeline

- **22 Nov 2025 00:00** - Bugfix completado y testeado localmente
- **22 Nov 2025 00:15** - Push a GitHub main
- **22 Nov 2025 00:20** - Deploy a producción (THIS STEP)
- **22 Nov 2025 00:25** - Validación manual en UI

---

**Status:** 🟢 LISTO PARA DESPLEGAR  
**Autor:** GitHub Copilot Agent  
**Comando:** `.\deploy-to-prod-now.ps1`
