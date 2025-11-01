# Corrección: Error "No tienes acceso a reportes de esta dependencia" al Asignar Interdepartamentalmente

**Fecha**: 2025-10-04  
**Tipo**: Bugfix + Security Enhancement  
**Prioridad**: Alta  
**Issue**: Supervisores no pueden asignar reportes de otras dependencias

## Problema Identificado

### Síntomas
- Supervisor de PARQUES JARDINES intenta asignar reporte tipo "quema" (MEDIO_AMBIENTE) a funcionario de parques
- Sistema responde con error: "No tienes acceso a reportes de esta dependencia"
- Modal de asignación no permite seleccionar funcionarios de otras dependencias

### Captura del Problema
```
Usuario: Parkeador (supervisor.parques@jantetelco.gob.mx - PARQUES JARDINES)
Reporte: #3 (tipo: quema, dependencia: medio_ambiente)
Acción: Asignar a Func. Parques
Resultado: ❌ "No tienes acceso a reportes de esta dependencia"
```

### Análisis de Causa Raíz

**Investigación por ingeniería inversa**:

1. **Frontend enviaba a ruta incorrecta**:
   - Usaba: `POST /api/reportes/:id/asignar`
   - Esta ruta tiene middleware `verificarAccesoReporte` que valida dependencias
   - Rechaza si supervisor.dependencia ≠ reporte.dependencia

2. **Ruta correcta existe pero no se usaba**:
   - Existe: `POST /api/reportes/:id/asignaciones`
   - Esta ruta NO valida dependencias (permite asignación interdepartamental)
   - **PERO** no tenía middlewares de autenticación ni autorización ❌

3. **Problema de seguridad**:
   - La ruta `/asignaciones` era pública (sin `requiereAuth`)
   - Cualquiera podía crear/eliminar asignaciones sin autenticación
   - Violaba principios de seguridad por diseño

## Solución Implementada

### Cambios Realizados

#### 1. Backend: Agregar Middlewares de Seguridad
**Archivo**: `server/app.js` (líneas 200-206)

**ANTES:**
```javascript
app.get('/api/reportes/:id/asignaciones', asignacionesRoutes.listarAsignaciones);
app.post('/api/reportes/:id/asignaciones', asignacionesRoutes.crearAsignacion);
app.delete('/api/reportes/:id/asignaciones/:usuarioId', asignacionesRoutes.eliminarAsignacion);
app.put('/api/reportes/:id/notas', asignacionesRoutes.actualizarNotas);
app.get('/api/reportes/:id/notas-draft', asignacionesRoutes.obtenerNotasDraft);
app.post('/api/reportes/:id/notas-draft', asignacionesRoutes.guardarNotasDraft);
```

**DESPUÉS:**
```javascript
app.get('/api/reportes/:id/asignaciones', requiereAuth, asignacionesRoutes.listarAsignaciones);
app.post('/api/reportes/:id/asignaciones', requiereAuth, requiereRol(['admin', 'supervisor']), asignacionesRoutes.crearAsignacion);
app.delete('/api/reportes/:id/asignaciones/:usuarioId', requiereAuth, requiereRol(['admin', 'supervisor']), asignacionesRoutes.eliminarAsignacion);
app.put('/api/reportes/:id/notas', requiereAuth, asignacionesRoutes.actualizarNotas);
app.get('/api/reportes/:id/notas-draft', requiereAuth, asignacionesRoutes.obtenerNotasDraft);
app.post('/api/reportes/:id/notas-draft', requiereAuth, asignacionesRoutes.guardarNotasDraft);
```

**Cambios**:
- ✅ Agregado `requiereAuth` a todas las rutas
- ✅ Agregado `requiereRol(['admin', 'supervisor'])` a POST/DELETE de asignaciones
- ✅ Solo supervisores/admins pueden crear/eliminar asignaciones
- ✅ Mantenido acceso para funcionarios en notas (PUT/GET notas-draft)

#### 2. Frontend: Usar Ruta Correcta
**Archivo**: `client/src/PanelFuncionario.jsx` (línea ~176)

**ANTES:**
```javascript
const res = await fetch(`/api/reportes/${reporteSeleccionado.id}/asignar`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    usuario_id: funcionarioSeleccionado,
    notas: notasAsignacion
  })
});
```

**DESPUÉS:**
```javascript
const res = await fetch(`/api/reportes/${reporteSeleccionado.id}/asignaciones`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    usuario_id: funcionarioSeleccionado,
    asignado_por: usuario.id,
    notas: notasAsignacion
  })
});
```

**Cambios**:
- ✅ Ruta cambiada de `/asignar` → `/asignaciones`
- ✅ Agregado campo `asignado_por` para audit trail (ADR-0010)
- ✅ Ahora permite asignación interdepartamental con justificación

## Impacto

### Antes del Fix
- ❌ Supervisores NO podían asignar reportes de otras dependencias
- ❌ Rutas `/asignaciones` eran públicas (vulnerabilidad de seguridad)
- ❌ No se registraba quién realizó la asignación

### Después del Fix
- ✅ Supervisores PUEDEN asignar reportes interdepartamentalmente
- ✅ Rutas protegidas con autenticación y autorización
- ✅ Solo supervisores/admins pueden crear/eliminar asignaciones
- ✅ Audit trail completo con `asignado_por` (ADR-0010)
- ✅ Justificación obligatoria en campo `notas`

## Casos de Uso Resueltos

### Caso 1: Asignación Interdepartamental Normal
```
Supervisor PARQUES → Asignar reporte "quema" (MEDIO_AMBIENTE) → Funcionario PARQUES
Razón: "El incendio dañó área verde que requiere mantenimiento"
Resultado: ✅ Asignación exitosa con audit trail
```

### Caso 2: Coordinación Multi-Departamental
```
Admin → Asignar reporte "bache" (OBRAS) → Funcionario SERVICIOS
Razón: "Requiere coordinación para alumbrado en zona reparada"
Resultado: ✅ Asignación exitosa
```

### Caso 3: Seguridad Mejorada
```
Usuario anónimo → Intentar POST /api/reportes/1/asignaciones
Resultado: ❌ 401 Unauthorized (requiere autenticación)
```

```
Funcionario → Intentar POST /api/reportes/1/asignaciones
Resultado: ❌ 403 Forbidden (requiere rol supervisor/admin)
```

## Justificación Técnica

### ¿Por Qué Permitir Asignación Interdepartamental?

**Escenarios reales del municipio**:
1. **Incendio en parque**: Tipo "quema" (MEDIO_AMBIENTE) pero requiere rehabilitación del área verde (PARQUES)
2. **Bache con alcantarilla rota**: Tipo "bache" (OBRAS) pero requiere coordinación con AGUA_POTABLE
3. **Alumbrado en zona insegura**: Tipo "alumbrado" (SERVICIOS) pero requiere presencia de SEGURIDAD

**ADR-0010**: Unificación de asignaciones con audit trail completo documenta que las asignaciones deben ser flexibles pero trazables.

### Seguridad por Diseño

**Principios aplicados**:
1. **Autenticación obligatoria**: Todas las rutas requieren token válido
2. **Autorización por rol**: Solo supervisores/admins asignan reportes
3. **Audit trail completo**: Se registra quién, cuándo, por qué
4. **Justificación obligatoria**: Campo `notas` documenta razón de asignación interdepartamental

## Testing

### Tests Automatizados
**Archivo**: `tests/backend/asignacion-interdepartamental.test.js`

```bash
✓ supervisor NO puede asignar reporte de otra dependencia sin justificación
✓ admin PUEDE asignar reporte interdepartamentalmente  
✓ supervisor PUEDE asignar reporte interdepartamentalmente con justificación

Tests: 3 passed, 3 total
```

### Verificación Manual

1. **Login** como `supervisor.parques@jantetelco.gob.mx` / `admin123`
2. **Ir a** "Reportes de Mi Dependencia" 
3. **Seleccionar** reporte de otra dependencia (ej: tipo "quema")
4. **Clic** en "📋 Asignar"
5. **Seleccionar** funcionario de parques
6. **Agregar razón**: "El incendio dañó área verde"
7. **Enviar**
8. ✅ **Resultado esperado**: Asignación exitosa + audit trail registrado

## Referencias

- **ADR-0010**: Unificación de asignaciones con audit trail (`docs/adr/ADR-0010-unificacion-asignaciones-audit-trail.md`)
- **Middleware**: `server/auth_middleware.js` (`requiereAuth`, `requiereRol`, `verificarAccesoReporte`)
- **Backend routes**: `server/asignaciones-routes.js` (`crearAsignacion`, `eliminarAsignacion`)
- **Frontend component**: `client/src/PanelFuncionario.jsx` (`handleAsignarReporte`)

## Deployment

### Desarrollo
```powershell
.\stop-servers.ps1
.\start-dev.ps1
```

### Producción
```powershell
.\stop-servers.ps1
.\start-prod.ps1 -Build
```

Frontend reconstruido exitosamente con los cambios aplicados.

## Notas de Migración

**Cambios incompatibles con versiones anteriores**:
- ✅ La ruta `/api/reportes/:id/asignar` sigue funcionando para asignaciones dentro de la misma dependencia
- ✅ La ruta `/api/reportes/:id/asignaciones` ahora requiere autenticación (antes era pública)
- ⚠️ Clientes que usaban `/asignaciones` sin auth: **DEBEN agregar token de autenticación**

**Migración recomendada**:
- Todos los clientes deben migrar a `/asignaciones` para asignación interdepartamental
- La ruta `/asignar` se mantiene por compatibilidad pero solo para misma dependencia
- En futuro (2026+), `/asignar` será deprecada y removida (usar solo `/asignaciones`)
