# ANÁLISIS FINAL: Problema 404 en Servidor Remoto (145.79.0.77:4000)

**Fecha:** October 31, 2025  
**Diagnóstico:** Completado  
**Severidad:** 🔴 CRÍTICO

---

##  Hallazgos Confirmados

### Test de Endpoints

| Endpoint | Status | Content-Type | Problema |
|----------|--------|--------------|----------|
| `/api/reportes` | 200 | JSON | ✅ Funciona |
| `/api/reportes/` | 200 | JSON | ✅ Funciona |
| `/api/reportes/geojson` | 200 | JSON | ✅ Funciona |
| `/api/reportes/grid` | 200 | JSON | ✅ Funciona |
| `/api/reportes/tipos` | **SPA HTML** | text/html | ❌ Interceptado |
| `/api/reportes/mis-reportes` | **SPA HTML** | text/html | ❌ Interceptado |
| `/api/reportes/cierres-pendientes` | **SPA HTML** | text/html | ❌ Interceptado |
| `/api/auth/me` | 200 | HTML (SPA) | ❌ Interceptado (debería ser JSON con validación token) |
| `/api/auth/login` | **SPA HTML** | text/html | ❌ Interceptado |
| `/health` | 200 | JSON | ✅ Existe |

### Conclusión del Diagnóstico

**ROOT CAUSE:** Cuando Express no encuentra una ruta `/api/*` registrada, cae al catch-all route `app.get('*')` que sirve `index.html` (la SPA). El cliente recibe HTML cuando espera JSON, generando "404" de aplicación.

**EVIDENCIA:**
```bash
$ curl -s http://145.79.0.77:4000/api/reportes/tipos
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
...  # Esto es index.html, NO un error JSON 404
```

### Rutas Que Funcionan

- `GET /api/reportes` - Públicas, sin auth
- `GET /api/reportes/geojson` - Públicas
- `GET /api/reportes/grid` - Públicas
- `GET /health` - Diagnostico

### Rutas Que NO Funcionan (Interceptadas por SPA Catch-All)

- `GET /api/reportes/tipos` - No registrada, sirve SPA
- `GET /api/reportes/mis-reportes` - No registrada, sirve SPA
- `GET /api/reportes/cierres-pendientes` - No registrada, sirve SPA
- `POST /api/auth/login` - No registrada, sirve SPA
- `GET /api/auth/me` - Registrada pero retorna SPA (implica auth_routes.js no cargada)

---

## Causas Posibles

### Opción 1: **CÓDIGO REMOTO DIFERENTE** (Más Probable)

El archivo `app.js` o `server.js` en el servidor remoto es diferente al local. 

Evidencia:
- Solo 4 endpoints de reportes funcionan (`/api/reportes`, `/api/reportes/geojson`, `/api/reportes/grid`, `/api/health`)
- `/api/reportes/tipos` no funciona (está en `app.js` línea 134)
- `/api/auth/login` no funciona (está en `auth_routes.js`)
- `/api/auth/me` retorna SPA en lugar de JSON validado

**Explicación:** El código local tiene TODOS los endpoints. El código remoto tiene SOLO los básicos.

### Opción 2: **Compila Desactualizada**

La SPA (`client/dist/`) en el servidor NO fue compilada con los cambios recientes de backend.

**Impacto:** Frontend no coincide con backend, causando confusión.

### Opción 3: **Importación Faltante**

El archivo `app.js` remoto no tiene:
```javascript
import { configurarRutasReportes } from './reportes_auth_routes.js';
import { configurarRutasAuth } from './auth_routes.js';
```

O las funciones no se llaman correctamente.

---

## Pasos para Resolver

### URGENTE (Restaurar Servicio):

**Opción A: Verificar Versión Remota**

SSH al servidor y revisar:
```bash
# Ver si los archivos existen
ls -la /ruta/a/jantetelco/server/app.js
ls -la /ruta/a/jantetelco/server/reportes_auth_routes.js

# Ver qué se está ejecutando
ps aux | grep node

# Revisar logs del servidor
tail -100 /ruta/a/logs/server.log
```

**Opción B: Deploy Correcto**

```bash
# SSH a 145.79.0.77
cd /ruta/a/jantetelco

# Actualizar código desde repo
git pull origin main

# Compilar frontend
cd client && npm run build && cd ..

# Reinstalar dependencias
cd server && npm install

# Reiniciar proceso
pm2 restart citizen-reports
# O manualmente:
npm start
```

**Opción C: Sincronizar Código Local → Remoto**

```bash
# Si tienes acceso SSH, copiar archivos específicos
scp c:\\PROYECTOS\\Jantetelco\\server\\app.js user@145.79.0.77:/ruta/a/jantetelco/server/
scp c:\\PROYECTOS\\Jantetelco\\server\\reportes_auth_routes.js user@145.79.0.77:/ruta/a/jantetelco/server/
scp c:\\PROYECTOS\\Jantetelco\\server\\auth_routes.js user@145.79.0.77:/ruta/a/jantetelco/server/

# Reiniciar
ssh user@145.79.0.77 "cd /ruta/a/jantetelco && npm start"
```

---

## Validación Post-Fix

Una vez deployado, verificar:

```powershell
# Debería retornar JSON array con tipos
curl -s http://145.79.0.77:4000/api/reportes/tipos

# Debería retornar 401 (token inválido) o 200 (con token válido)
curl -s -H "Authorization: Bearer test" http://145.79.0.77:4000/api/reportes/mis-reportes

# Debería retornar 400 o JSON error (no HTML)
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}' \
  http://145.79.0.77:4000/api/auth/login
```

---

## Archivos Involucrados

**REMOTO (Probablemente desactualizado):**
- `/ruta/a/jantetelco/server/app.js` - Puede no tener todas las rutas
- `/ruta/a/jantetelco/server/reportes_auth_routes.js` - Puede faltante o desactualizado
- `/ruta/a/jantetelco/server/auth_routes.js` - Puede faltante o desactualizado
- `/ruta/a/jantetelco/client/dist/` - SPA compilada (puede estar desactualizada)

**LOCAL (Verificado OK):**
- `c:\PROYECTOS\Jantetelco\server\app.js` ✅ Tiene todas las rutas
- `c:\PROYECTOS\Jantetelco\server\reportes_auth_routes.js` ✅ Completo
- `c:\PROYECTOS\Jantetelco\server\auth_routes.js` ✅ Completo

---

## Impacto

**ESTÁ ROTO:**
- 🔴 Admin panel ("Mis Reportes Asignados")
- 🔴 Panel de funcionarios
- 🔴 Todas las operaciones autenticadas
- 🔴 Todas las rutas de tipos/categorías

**SÍ FUNCIONA:**
- 🟢 Mapa público (reportes, geojson, grid)
- 🟢 Health check

---

## Recomendaciones

1. **INMEDIATO:** SSH al servidor y verificar qué versión del código hay
2. **URGENTE:** Hacer deploy completo con `npm start` correcto
3. **IMPORTANTE:** Implementar sistema de deploys automatizado (CI/CD) para evitar versiones desincronizadas
4. **PREVENTIVO:** Añadir endpoint `/api/version` que retorne info del deployment

---

## Checklist de Validación

- [ ] SSH a servidor y revisar versión del código
- [ ] Verificar qué proceso Node está corriendo (ps aux | grep node)
- [ ] Hacer git pull de cambios recientes
- [ ] Compilar frontend: npm run build
- [ ] Reiniciar servidor: npm start o pm2 restart
- [ ] Probar /api/reportes/tipos retorna JSON (no HTML)
- [ ] Probar /api/reportes/mis-reportes retorna 401 o JSON
- [ ] Probar /api/auth/login retorna JSON error (no HTML)
- [ ] Verificar admin panel carga sin errores
- [ ] Verificar otros usuarios pueden autenticarse

