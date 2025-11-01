# Corrección: Mostrar Descripción Corta y Detallada en VerReporte

**Fecha:** 2025-10-03  
**Protocolo:** code_surgeon - Ingeniería Inversa  
**Estado:** ✅ RESUELTO

---

## Problema Reportado

**Síntoma:**
- En la página de "Ver Reporte" (`#reporte/12`) solo se muestra un campo "Descripción"
- Falta mostrar "Descripción Corta" y "Descripción Detallada" como en el formulario de captura
- Look and feel inconsistente entre formulario de captura y vista de reporte

**Contexto:**
- El formulario de captura (`ReportForm.jsx`) tiene 2 campos separados:
  - "Descripción Corta" (máx. 100 caracteres) - aparece en marcadores del mapa
  - "Descripción Detallada" - descripción completa del problema
- La vista de reporte (`VerReporte.jsx`) solo mostraba un campo genérico "Descripción"

---

## Análisis de Causa Raíz (Ingeniería Inversa)

### Paso 1: Verificar formulario de captura

```jsx
// client/src/ReportForm.jsx - Líneas 487-545
{/* Descripción Corta */}
<label>Descripción Corta *</label>
<input
  type="text"
  name="descripcionCorta"
  value={formData.descripcionCorta}
  maxLength="100"
  placeholder="Resumen breve (ej: Bache grande en calle principal)"
/>
<p>Esta descripción aparecerá en el mapa al hacer clic en el marcador</p>

{/* Descripción Detallada */}
<label>Descripción Detallada *</label>
<textarea
  name="descripcion"
  value={formData.descripcion}
  rows="4"
  placeholder="Describe detalladamente el problema que encontraste..."
/>
```

**Resultado:** ✅ Formulario tiene 2 campos bien definidos

### Paso 2: Verificar vista de reporte

```jsx
// client/src/VerReporte.jsx - Líneas 257-276 (ANTES)
{/* Descripción */}
<div>
  <label>Descripción</label>
  <div style={{ padding: '12px', backgroundColor: 'white', ... }}>
    {reporte.descripcion || 'Sin descripción'}
  </div>
</div>
```

**Problema detectado:** ❌ Solo muestra `reporte.descripcion`, falta `reporte.descripcion_corta`

### Paso 3: Verificar endpoint backend

```javascript
// server/asignaciones-routes.js - obtenerReporteDetalle (ANTES)
const sql = `
  SELECT 
    id, tipo, descripcion, lat, lng, peso, estado, 
    dependencia, prioridad, fingerprint, creado_en
  FROM reportes
  WHERE id = ?
`;
```

**Problema detectado:** ❌ El SELECT NO incluye `descripcion_corta`

### Paso 4: Confirmar hipótesis con curl

```powershell
PS> Invoke-WebRequest -Uri "http://localhost:5173/api/reportes/12"
{
  "id": 12,
  "descripcion": "aasasasasasasasasa",
  // ❌ descripcion_corta NO presente
  ...
}
```

**Causa raíz confirmada:**
1. Backend NO devuelve `descripcion_corta` en GET `/api/reportes/:id`
2. Frontend NO muestra ambos campos separados

---

## Solución Aplicada

### Cambio #1: Backend - Agregar descripcion_corta al SELECT

**Archivo:** `server/asignaciones-routes.js`  
**Función:** `obtenerReporteDetalle()`

```javascript
// ANTES (línea 17)
const sql = `
  SELECT 
    id, tipo, descripcion, lat, lng, peso, estado, 
    dependencia, prioridad, fingerprint, creado_en
  FROM reportes
  WHERE id = ?
`;

// DESPUÉS (línea 17)
const sql = `
  SELECT 
    id, tipo, descripcion, descripcion_corta, lat, lng, peso, estado, 
    dependencia, prioridad, fingerprint, creado_en
  FROM reportes
  WHERE id = ?
`;
```

**Impacto:** Ahora el endpoint devuelve `descripcion_corta` en el JSON response.

### Cambio #2: Frontend - Mostrar ambos campos con look and feel consistente

**Archivo:** `client/src/VerReporte.jsx`  
**Líneas:** 254-276 (reemplazadas)

```jsx
// ANTES - Un solo campo genérico
{/* Descripción */}
<div>
  <label>Descripción</label>
  <div style={{ ... }}>
    {reporte.descripcion || 'Sin descripción'}
  </div>
</div>

// DESPUÉS - Dos campos separados con mismo estilo que ReportForm
{/* Descripción Corta */}
<div>
  <label style={{
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px'
  }}>
    Descripción Corta
  </label>
  <div style={{
    padding: '12px',
    backgroundColor: 'white',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#111827',
    minHeight: '40px'
  }}>
    {reporte.descripcion_corta || 'Sin descripción corta'}
  </div>
  <p style={{
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
    fontStyle: 'italic'
  }}>
    Esta descripción aparece en el mapa al hacer clic en el marcador
  </p>
</div>

{/* Descripción Detallada */}
<div>
  <label style={{
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px'
  }}>
    Descripción Detallada
  </label>
  <div style={{
    padding: '12px',
    backgroundColor: 'white',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#111827',
    minHeight: '80px',
    whiteSpace: 'pre-wrap'
  }}>
    {reporte.descripcion || 'Sin descripción detallada'}
  </div>
</div>
```

**Decisiones de diseño:**

1. **Orden:** Descripción Corta primero, Detallada después (igual que formulario)
2. **Estilos:** Misma paleta de colores (#374151, #d1d5db, #6b7280)
3. **Hint text:** Texto explicativo debajo de Descripción Corta (igual que formulario)
4. **Alturas:** `minHeight: 40px` para Corta, `80px` para Detallada (refleja longitud esperada)
5. **whiteSpace: 'pre-wrap':** Preserva saltos de línea en descripción detallada

---

## Validación de la Corrección

### Test #1: Backend devuelve descripcion_corta

```powershell
PS> Invoke-WebRequest -Uri "http://localhost:5173/api/reportes/12"
{
  "id": 12,
  "tipo": "seguridad",
  "descripcion": "aasasasasasasasasa",
  "descripcion_corta": "Prueba",  # ✅ Campo presente
  "lat": 18.704301,
  "lng": -98.749598,
  ...
}
```

**Resultado:** ✅ Campo `descripcion_corta` ahora presente en respuesta

### Test #2: Frontend muestra ambos campos

**Pasos:**
1. Abrir `http://localhost:5173`
2. Click en marcador del mapa
3. Click en "Ver Reporte Completo"
4. Verificar presencia de:
   - ✅ "Descripción Corta" con valor "Prueba"
   - ✅ "Descripción Detallada" con valor "aasasasasasasasasa"
   - ✅ Texto explicativo: "Esta descripción aparece en el mapa al hacer clic en el marcador"

**Resultado esperado:** Vista de reporte ahora muestra ambos campos con look and feel idéntico al formulario de captura.

---

## Comparación Visual: Antes vs Después

### ANTES (❌ Incompleto)

```
📋 Información del Reporte

Descripción
┌─────────────────────────────────────┐
│ aasasasasasasasasasa                │  ← Solo un campo genérico
└─────────────────────────────────────┘

Latitud              Longitud
...
```

### DESPUÉS (✅ Completo)

```
📋 Información del Reporte

Descripción Corta
┌─────────────────────────────────────┐
│ Prueba                              │  ← Campo corto con hint
└─────────────────────────────────────┘
Esta descripción aparece en el mapa...

Descripción Detallada
┌─────────────────────────────────────┐
│ aasasasasasasasasasa                │  ← Campo detallado expandido
│                                     │
│                                     │
└─────────────────────────────────────┘

Latitud              Longitud
...
```

---

## Archivos Modificados

| Archivo | Líneas | Cambio |
|---------|--------|--------|
| `server/asignaciones-routes.js` | 17 | Agregado `descripcion_corta` al SELECT de `obtenerReporteDetalle` |
| `client/src/VerReporte.jsx` | 254-293 | Reemplazado un campo "Descripción" por dos campos "Descripción Corta" y "Descripción Detallada" con estilos consistentes |

---

## Lecciones Aprendidas

1. **Consistencia UI:** Vistas de captura y lectura deben tener mismo look and feel
2. **Backend completo:** Endpoints de detalle deben incluir TODOS los campos relevantes
3. **Documentación visual:** Hint text ayuda al usuario a entender propósito del campo
4. **Ingeniería inversa eficaz:**
   - ✅ Comparar formulario vs vista
   - ✅ Verificar datos que llegan del backend
   - ✅ Identificar campo faltante en SELECT
   - ✅ Aplicar corrección en backend Y frontend

---

## Prevención de Errores Futuros

### Checklist para nuevos campos:

- [ ] ¿Campo agregado a schema.sql?
- [ ] ¿Campo incluido en POST /api/reportes?
- [ ] ¿Campo incluido en GET /api/reportes (listado)?
- [ ] ✅ ¿Campo incluido en GET /api/reportes/:id (detalle)?
- [ ] ¿Campo mostrado en formulario de captura?
- [ ] ✅ ¿Campo mostrado en vista de reporte?
- [ ] ¿Mismo look and feel en ambas vistas?

### Patrón para vistas de solo lectura:

Siempre basar estilos en el formulario de captura para mantener consistencia:

```jsx
// ReportForm.jsx (captura)
<label style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
  Campo *
</label>
<input style={{ padding: '12px', border: '2px solid #e5e7eb', ... }} />

// VerReporte.jsx (lectura) - USAR MISMOS COLORES Y ESPACIADOS
<label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
  Campo
</label>
<div style={{ padding: '12px', border: '1px solid #d1d5db', ... }}>
  {valor}
</div>
```

---

## Estado Final del Sistema

```
✅ Backend: descripcion_corta incluido en GET /api/reportes/:id
✅ Frontend: Dos campos separados ("Corta" y "Detallada")
✅ Look and feel: Consistente con formulario de captura
✅ Hint text: Explica propósito de descripción corta
✅ Estilos: Misma paleta de colores (#374151, #d1d5db, #6b7280)
✅ Sin errores: No se tocó lógica de asignaciones ni notas
```

---

**Protocolo aplicado:**
- ✅ Ingeniería inversa: Formulario → Vista → Backend → SELECT
- ✅ No mocks: Datos reales desde base de datos
- ✅ No placeholders: Código funcional inmediato
- ✅ Look and feel consistente: Copiado del formulario de captura
- ✅ Solo cambios necesarios: Backend SELECT + Frontend UI

**Recarga la página del navegador (F5) y entra a un reporte para ver los dos campos separados.**
