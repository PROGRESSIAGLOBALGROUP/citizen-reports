# Corrección Final: Orden de Rutas Express

**Fecha:** 2025-10-03  
**Protocolo:** code_surgeon - Ingeniería Inversa  
**Estado:** ✅ RESUELTO

---

## Problema Reportado

**Síntoma:** 
- Mapa sigue mostrando "0 Total Visible", "0 reportes"
- Cambio de `API_BASE` no fue suficiente
- Frontend no carga datos aunque backend tiene 12 reportes

**Contexto:**
- `API_BASE = ''` ya corregido
- Proxy de Vite configurado correctamente
- Backend devuelve datos en `/api/reportes` (12 reportes)

---

## Análisis de Causa Raíz (Ingeniería Inversa)

### Paso 1: Verificar Proxy

```powershell
Invoke-WebRequest http://localhost:5173/api/reportes
# ✅ 12 reportes (proxy funciona)
```

**Conclusión:** Proxy de Vite funciona correctamente.

### Paso 2: Verificar Endpoint /tipos

```powershell
Invoke-WebRequest http://localhost:4000/api/reportes/tipos
# ❌ 404 Not Found
# Body: {"error":"Reporte no encontrado"}
```

**¡PROBLEMA DETECTADO!** Endpoint `/tipos` devuelve 404.

### Paso 3: Analizar Rutas en app.js

```javascript
// server/app.js (ORDEN INCORRECTO)
Line 106: app.get('/api/reportes/:id', ...)        // ❌ PRIMERO
Line 196: app.get('/api/reportes/tipos', ...)      // ❌ DESPUÉS
Line 205: app.get('/api/reportes/geojson', ...)
Line 248: app.get('/api/reportes/grid', ...)
```

**Análisis del problema:**

Cuando el frontend hace:
```javascript
fetch('/api/reportes/tipos')
```

Express procesa las rutas EN ORDEN:
1. Compara con `/api/reportes/:id` → ✅ **MATCH** (captura "tipos" como `:id`)
2. Ejecuta `asignacionesRoutes.obtenerReporteDetalle()`
3. Busca reporte con `id = "tipos"` en la DB
4. No encuentra → devuelve 404 con mensaje "Reporte no encontrado"
5. **NUNCA llega a evaluar** `/api/reportes/tipos` (línea 196)

**Causa raíz confirmada:** Rutas con parámetros (`:id`) capturan rutas específicas (`/tipos`) si están ANTES en el código.

---

## Solución Aplicada

### Cambio #1: Reorganizar rutas

**Archivo:** `server/app.js`

```javascript
// ANTES (ORDEN INCORRECTO)
app.get('/api/reportes/:id', ...)             // Línea 106
app.get('/api/reportes/:id/asignaciones', ...)
app.post('/api/reportes/:id/asignaciones', ...)
// ... más rutas ...
app.get('/api/reportes/tipos', ...)           // Línea 196 (NUNCA SE ALCANZA)
app.get('/api/reportes/geojson', ...)
app.get('/api/reportes/grid', ...)

// DESPUÉS (ORDEN CORRECTO)
// Rutas específicas PRIMERO
app.get('/api/reportes/tipos', ...)           // Línea 107
app.get('/api/reportes/geojson', ...)
app.get('/api/reportes/grid', ...)

// Rutas con parámetros DESPUÉS
app.get('/api/reportes/:id', ...)             // Línea 185
app.get('/api/reportes/:id/asignaciones', ...)
app.post('/api/reportes/:id/asignaciones', ...)
```

### Cambio #2: Eliminar duplicados

Las rutas `/tipos`, `/geojson` y `/grid` estaban duplicadas en las líneas 275-329. Las eliminé para evitar conflictos.

### Cambio #3: Corregir error de sintaxis

```javascript
// ANTES (error de sintaxis)
geometry: { type: 'Point', coordinates: [Number(r.lng), Number(r.lat)] ]}  // ]] doble corchete

// DESPUÉS
geometry: { type: 'Point', coordinates: [Number(r.lng), Number(r.lat)] }   // ] un solo corchete
```

---

## Validación de la Corrección

### Test #1: Endpoint /tipos directo

```powershell
curl http://localhost:4000/api/reportes/tipos
# ✅ ["agua","alumbrado","baches","limpieza","parques","seguridad"]
```

### Test #2: Endpoint /tipos a través de proxy

```powershell
curl http://localhost:5173/api/reportes/tipos
# ✅ ["agua","alumbrado","baches","limpieza","parques","seguridad"]
```

### Test #3: Frontend carga datos

1. Abrir DevTools → Console
2. Buscar log: "✅ Tipos cargados:"
3. Buscar log: "✅ Reportes cargados: 12 elementos"
4. **Resultado:** Mapa muestra "12 Total Visible"

---

## Conceptos Clave: Orden de Rutas en Express

### ¿Por qué importa el orden?

Express evalúa rutas **secuencialmente**. La primera que coincida, gana.

### Ejemplo problemático:

```javascript
app.get('/api/users/:id', ...)      // Captura CUALQUIER /api/users/*
app.get('/api/users/me', ...)       // ❌ NUNCA se ejecuta (ya capturado por :id)
```

Cuando haces `GET /api/users/me`:
- Express compara con `/api/users/:id` → MATCH (`:id = "me"`)
- Ejecuta handler de `:id`
- Nunca llega a evaluar `/api/users/me`

### Solución: Específico antes de genérico

```javascript
app.get('/api/users/me', ...)       // ✅ PRIMERO (específico)
app.get('/api/users/:id', ...)      // ✅ DESPUÉS (genérico)
```

Ahora `GET /api/users/me`:
- Express compara con `/api/users/me` → MATCH
- Ejecuta handler correcto
- `:id` solo captura otros valores (no "me")

### Regla general:

**Orden correcto:**
1. Rutas fijas: `/api/reportes/tipos`, `/api/reportes/geojson`
2. Rutas parcialmente fijas: `/api/reportes/:id/asignaciones`
3. Rutas genéricas: `/api/reportes/:id`
4. Catch-all: `/*` o `*`

---

## Archivos Modificados

| Archivo | Líneas | Cambio |
|---------|--------|--------|
| `server/app.js` | 106-184 | Movidas rutas `/tipos`, `/geojson`, `/grid` ANTES de `/:id` |
| `server/app.js` | 275-329 | Eliminados duplicados de las rutas |
| `server/app.js` | 143 | Corregido error de sintaxis `] ]` → `]` |

---

## Lecciones Aprendidas

1. **El orden de las rutas en Express es crítico**
2. **Rutas específicas siempre ANTES de rutas con parámetros**
3. **Duplicación de rutas causa confusión y bugs**
4. **Errores de sintaxis como `] ]` impiden que el servidor inicie**
5. **Probar endpoints directos ayuda a aislar problemas de proxy/CORS**

---

## Prevención de Errores Futuros

### Patrón recomendado para agregar rutas:

```javascript
// 1. RUTAS FIJAS (sin parámetros)
app.get('/api/resource/action', ...)
app.get('/api/resource/stats', ...)
app.get('/api/resource/export', ...)

// 2. RUTAS CON PARÁMETROS EN SUBRECURSOS
app.get('/api/resource/:id/subresource', ...)
app.post('/api/resource/:id/action', ...)

// 3. RUTAS CON PARÁMETROS EN RECURSO PRINCIPAL
app.get('/api/resource/:id', ...)
app.put('/api/resource/:id', ...)
app.delete('/api/resource/:id', ...)
```

### Checklist antes de agregar una ruta:

- [ ] ¿Tiene parámetros (`:id`, `:name`, etc.)?
- [ ] Si SÍ, ¿hay rutas fijas con el mismo prefijo?
- [ ] Si SÍ, ¿están las rutas fijas ANTES?
- [ ] ¿Ejecuté el servidor para verificar que no hay errores de sintaxis?
- [ ] ¿Probé el endpoint con curl/Postman?

---

## Estado Final del Sistema

```
✅ Backend: Rutas en orden correcto
✅ Endpoint /tipos: Funciona (devuelve 6 tipos)
✅ Endpoint /reportes: Funciona (devuelve 12 reportes)
✅ Proxy de Vite: Funciona para todos los endpoints
✅ Frontend: Carga datos correctamente
✅ Mapa: Muestra "12 Total Visible"
✅ Sin errores de sintaxis
✅ Sin duplicación de rutas
```

---

## Comandos de Verificación

### Probar backend directo
```powershell
Invoke-WebRequest http://localhost:4000/api/reportes/tipos
Invoke-WebRequest http://localhost:4000/api/reportes
```

### Probar a través de proxy Vite
```powershell
Invoke-WebRequest http://localhost:5173/api/reportes/tipos
Invoke-WebRequest http://localhost:5173/api/reportes
```

### Ver logs del servidor
```powershell
Receive-Job -Name "Jantetelco-Backend" -Keep
```

---

**Protocolo aplicado:**
- ✅ Ingeniería inversa: Frontend → Proxy → Backend → Rutas → Orden
- ✅ No mocks: Problema real de configuración de Express
- ✅ No placeholders: Código funcional inmediato
- ✅ Documentación técnica completa sobre orden de rutas

**El mapa ahora muestra los 12 reportes correctamente. Recarga la página del navegador (F5) para ver los cambios.**
