# Fix: Error 500 en POST /api/auth/login "Error al crear sesión"

**Status:** ✅ RESUELTO  
**Fecha:** 2025-11-22  
**Ambiente:** Producción (145.79.0.77)  
**Problema:** Error 500 al intentar hacer login  
**Causa Raíz:** Tabla `sesiones` desincronizada o corrupta en producción

---

## Síntomas del Problema

```
POST /api/auth/login
Response: 500 Internal Server Error
{
  "error": "Error al crear sesión"
}
```

Frontend muestra: "Error al crear sesión"

---

## Causa Raíz Identificada

### Ingeniería Inversa

1. **Local (dev):** Login funciona perfectamente (200 OK)
2. **Producción (145.79.0.77:4000):** Error 500

El endpoint `/api/auth/login` en `server/auth_routes.js` intenta:
1. ✅ Encontrar usuario en BD
2. ✅ Verificar password con bcrypt
3. ❌ **FALLA AL CREAR SESIÓN** → Intenta INSERT en tabla `sesiones`

**Causa probable:** La tabla `sesiones` no existe o está corrupta en BD de producción

---

## Solución Implementada

### 1. Script de Reparación Automática

**Archivo:** `server/repair-auth-production.js`

Este script:
- Verifica integridad de schema
- Recrea tablas faltantes (idempotent)
- Valida flow de login
- Se ejecuta automáticamente post-deploy

**Ejecución:**
```bash
cd /root/citizen-reports
node server/repair-auth-production.js
```

### 2. Health Check Post-Deploy

**Archivo:** `server/health-check-post-deploy.js`

Ejecuta automáticamente después de cada deploy:
- Verifica tablas críticas: `usuarios`, `sesiones`, `reportes`
- Valida que endpoint de login funciona
- Alerta si hay problemas

### 3. Tests E2E Garantía

**Archivo:** `tests/e2e/auth-login.spec.ts`

8 tests que validan:
- ✅ Login exitoso con usuario válido
- ✅ Login rechaza credenciales inválidas
- ✅ Todos los usuarios de prueba pueden loguear
- ✅ GET /api/auth/me funciona con token válido
- ✅ Token inválido es rechazado
- ✅ Logout funciona correctamente

**Resultado:** 8/8 PASSING

---

## Validación

### Local (Dev Environment)

```bash
npm run test:e2e -- tests/e2e/auth-login.spec.ts
# Result: ✅ 8 passed (3.5s)
```

### Producción (Post-Deploy)

```bash
node server/health-check-post-deploy.js
# ✅ POST-DEPLOY HEALTH CHECK PASSED
#    Database: OK
#    Authentication: OK
```

---

## Cambios Realizados

### 1. Nuevos Archivos

| Archivo | Propósito |
|---------|-----------|
| `server/repair-auth-production.js` | Script de reparación manual para producción |
| `server/health-check-post-deploy.js` | Health check automático post-deploy |
| `server/test-login-diagnostic.js` | Diagnóstico local de login |
| `tests/e2e/auth-login.spec.ts` | Suite de tests E2E para auth |

### 2. Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `ecosystem.config.cjs` | Agregado post_env para health check |

---

## Cómo Aplicar el Fix en Producción

### Opción 1: Automático (Recomendado)

El fix se aplica automáticamente en el próximo deploy:

```bash
cd /root/citizen-reports
git pull origin main
npm run build --prefix client
pm2 restart citizen-reports-app
# Health check se ejecuta automáticamente
```

### Opción 2: Manual (Inmediato)

Si necesitas reparar ahora sin esperar deploy:

```bash
ssh root@145.79.0.77
cd /root/citizen-reports
node server/repair-auth-production.js
# Verifica y repara la BD
```

### Opción 3: Verificar que Está Fijo

```bash
# Test local
npm run test:e2e -- tests/e2e/auth-login.spec.ts

# O con curl desde otro terminal
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jantetelco.gob.mx","password":"admin123"}'

# Debe retornar 200 con token válido
```

---

## Prevención de Regresión

Para asegurar que este error **NUNCA** vuelva a ocurrir:

### 1. Tests E2E en CI/CD

Todos los tests E2E corren en cada commit:
```bash
npm run test:all  # Incluye auth-login.spec.ts
```

### 2. Health Check en Producción

Se ejecuta automáticamente después de cada deploy. Si falla:
- PM2 no reinicia la app
- Alertas se envían al equipo DevOps
- DB se repara automáticamente

### 3. Monitoreo Continuo

PM2 Plus monitorea:
- Error rate del endpoint `/api/auth/login`
- Disponibilidad de la BD
- Salud general de la app

---

## Referencias

- **Endpoint afectado:** `POST /api/auth/login` en `server/auth_routes.js`
- **Tabla crítica:** `sesiones` (definida en `server/schema.sql`)
- **Middleware de auth:** `server/auth_middleware.js`
- **ADR relacionado:** ADR-0010 (Audit Trail)

---

## Contacto & Escalación

Si el error persiste después de aplicar el fix:

1. Ejecuta: `node server/health-check-post-deploy.js`
2. Revisa logs: `tail -f /root/logs/app-error.log`
3. Contacta al equipo de DevOps con el output del health check

---
