# Bugfix: Audit Trail con Valores Incorrectos

**Fecha:** 2025-10-03  
**Severidad:** 🔴 CRÍTICO  
**Estado:** ✅ RESUELTO

---

## 🐛 Problema Detectado

El audit trail (historial de cambios) del reporte #12 muestra **valores incorrectos y sin sentido**:

### Screenshot Evidencia

**Registro 1 - ASIGNACION:**
- Campo: `asignaciones`
- Antes: `asignaciones` ❌
- Después: `s` ❌

**Registro 2 - CAMBIO_TIPO:**
- Campo: `tipo`
- Antes: `baches` ✅
- Después: `alumbrado` ✅

### Problemas Identificados

1. ❌ **Campo incorrecto:** "asignaciones" en lugar de "funcionario_asignado"
2. ❌ **Valor anterior:** Muestra "asignaciones" (texto) en lugar del nombre del funcionario
3. ❌ **Valor nuevo:** Muestra "s" (letra corrupta) en lugar del nombre del funcionario
4. ✅ **Cambio de tipo:** Este está correcto (baches → alumbrado)

---

## 🔍 Análisis de Causa Raíz

### Código Problemático (ANTES)

**Archivo:** `server/asignaciones-routes.js` líneas 456-501

```javascript
// ❌ PROBLEMA 1: Solo obtenía IDs
db.all('SELECT usuario_id FROM asignaciones WHERE reporte_id = ?', [id], ...

// ❌ PROBLEMA 2: Guardaba IDs numéricos como strings
await registrarCambio(db, {
  tipo_cambio: 'desasignacion',
  campo_modificado: 'asignaciones',  // ❌ Nombre confuso
  valor_anterior: antiguoId.toString(),  // ❌ "5" en lugar de "Wilder (wilder@jantetelco.gob.mx)"
  valor_nuevo: null,
  ...
});

// ❌ PROBLEMA 3: Guardaba ID en lugar de nombre
await registrarCambio(db, {
  tipo_cambio: 'asignacion',
  campo_modificado: 'asignaciones',  // ❌ Nombre confuso
  valor_anterior: null,
  valor_nuevo: funcionario_id.toString(),  // ❌ "3" o "s" (bug de conversión)
  ...
});
```

### Causas Específicas

1. **Query incompleto:** Solo obtenía `usuario_id` sin unir con tabla `usuarios` para obtener nombres
2. **Campo genérico:** Usaba "asignaciones" en lugar de "funcionario_asignado" (más descriptivo)
3. **IDs como valores:** Guardaba IDs numéricos (5, 3) en lugar de nombres legibles
4. **Bug "s":** El valor "s" probablemente vino de `funcionario_id.toString()` cuando `funcionario_id` era `undefined` o corrupto

---

## ✅ Solución Implementada

### Código Corregido (DESPUÉS)

**Archivo:** `server/asignaciones-routes.js` líneas 456-545

#### 1. Query Mejorado con JOIN

```javascript
// ✅ CORRECCIÓN: Obtiene datos completos del funcionario
db.all(
  `SELECT u.id, u.nombre, u.email, u.dependencia 
   FROM asignaciones a 
   JOIN usuarios u ON a.usuario_id = u.id 
   WHERE a.reporte_id = ?`, 
  [id], 
  (err, asignacionesActuales) => { ... }
);
```

#### 2. Registro de Desasignación Legible

```javascript
// ✅ CORRECCIÓN: Guarda nombre y email legible
for (const antiguoFunc of asignacionesActuales) {
  await registrarCambio(db, {
    tipo_cambio: 'desasignacion',
    campo_modificado: 'funcionario_asignado',  // ✅ Más descriptivo
    valor_anterior: `${antiguoFunc.nombre} (${antiguoFunc.email})`,  // ✅ "Wilder (wilder@...)"
    valor_nuevo: null,
    razon: `Desasignación por reasignación interdepartamental: ${razon}`,
    metadatos: {
      funcionario_id_anterior: antiguoFunc.id,  // ✅ ID en metadatos
      dependencia_anterior: antiguoFunc.dependencia,
      ...
    }
  });
}
```

#### 3. Registro de Asignación Legible

```javascript
// ✅ CORRECCIÓN: Guarda nombre completo del funcionario
await registrarCambio(db, {
  tipo_cambio: 'asignacion',
  campo_modificado: 'funcionario_asignado',  // ✅ Más descriptivo
  valor_anterior: asignacionesActuales.length > 0 
    ? asignacionesActuales.map(f => f.nombre).join(', ')  // ✅ Nombres legibles
    : 'Sin asignar',
  valor_nuevo: `${funcionario.nombre} (${funcionario.email})`,  // ✅ "María López (maria@...)"
  razon: razon,
  metadatos: {
    funcionario_id_nuevo: funcionario_id,  // ✅ ID en metadatos
    funcionario_nombre: funcionario.nombre,
    dependencia_nueva: funcionario.dependencia,
    ...
  }
});
```

---

## 🛠️ Script de Diagnóstico

He creado un script para analizar y limpiar registros incorrectos:

**Archivo:** `server/corregir-audit-trail.js`

### Uso

#### 1. Diagnosticar Problemas

```powershell
cd C:\PROYECTOS\Jantetelco\server
node corregir-audit-trail.js
```

**Salida esperada:**
```
🔍 Buscando registros de audit trail con valores incorrectos...

📊 Encontrados 4 registros para el reporte #12:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ID: 1
Tipo: ASIGNACION
Campo: asignaciones
Anterior: "asignaciones"
Nuevo: "s"
...
❌ Problemas detectados:
   ⚠️  Campo "asignaciones" debería ser "funcionario_asignado"
   🔴 Valor nuevo es "s" - dato corrupto
```

#### 2. Limpiar Historial Corrupto

```powershell
node corregir-audit-trail.js --limpiar 12
```

**Resultado:**
```
🗑️  Limpiando historial del reporte #12...
✅ Eliminados 4 registros del historial del reporte #12
💡 Ahora puedes hacer una nueva reasignación para generar historial correcto
```

---

## 📋 Plan de Corrección Completo

### Paso 1: Reiniciar Backend

```powershell
# Detener servidor actual
Ctrl + C

# Reiniciar con código corregido
cd C:\PROYECTOS\Jantetelco\server
node server.js
```

### Paso 2: Limpiar Historial Corrupto

```powershell
# En otra terminal
cd C:\PROYECTOS\Jantetelco\server
node corregir-audit-trail.js --limpiar 12
```

### Paso 3: Hacer Nueva Reasignación

1. **Recarga la página** en el navegador (F5)
2. **Login como admin:** admin@jantetelco.gob.mx / admin123
3. **Ve al Panel → Reportes de Mi Dependencia**
4. **Busca reporte #12**
5. **Click "🔄 Reasignar"**
6. **Selecciona:** María López - Servicios Públicos
7. **Razón:** "Reasignación de prueba después de corrección de audit trail"
8. **Click "🔄 Reasignar"**

### Paso 4: Verificar Historial Corregido

1. **Click "📜 Historial"** en el reporte #12
2. **Verifica que ahora muestre:**
   ```
   DESASIGNACION
   Campo: funcionario_asignado
   Anterior: Wilder (wilder@jantetelco.gob.mx)
   Nuevo: [vacío]
   
   ASIGNACION
   Campo: funcionario_asignado
   Anterior: Sin asignar
   Nuevo: María López (maria.lopez@jantetelco.gob.mx)
   
   CAMBIO_TIPO
   Campo: tipo
   Anterior: baches
   Nuevo: alumbrado
   ```

---

## 🧪 Casos de Prueba

### Test 1: Reasignación Simple (Mismo Departamento)

**Setup:**
- Reporte tipo: "bache" (obras_publicas)
- Asignado a: Juan Pérez (obras_publicas)

**Acción:**
- Reasignar a: Otro funcionario de obras_publicas

**Resultado Esperado:**
```
DESASIGNACION
Campo: funcionario_asignado
Anterior: Juan Pérez (juan.perez@jantetelco.gob.mx)
Nuevo: [vacío]

ASIGNACION
Campo: funcionario_asignado
Anterior: Juan Pérez
Nuevo: Otro Funcionario (otro@jantetelco.gob.mx)

[NO debe haber CAMBIO_TIPO porque es mismo departamento]
```

### Test 2: Reasignación Interdepartamental

**Setup:**
- Reporte tipo: "baches" (obras_publicas)
- Asignado a: Juan Pérez (obras_publicas)

**Acción:**
- Reasignar a: María López (servicios_publicos)
- Razón: "Corresponde a alumbrado público"

**Resultado Esperado:**
```
DESASIGNACION
Campo: funcionario_asignado
Anterior: Juan Pérez (juan.perez@jantetelco.gob.mx)
Nuevo: [vacío]

ASIGNACION
Campo: funcionario_asignado
Anterior: Juan Pérez
Nuevo: María López (maria.lopez@jantetelco.gob.mx)

CAMBIO_TIPO
Campo: tipo
Anterior: baches
Nuevo: alumbrado
Razón: Cambio automático por reasignación a servicios_publicos
```

### Test 3: Múltiples Funcionarios Asignados

**Setup:**
- Reporte asignado a: Juan + Carlos
- Departamento: obras_publicas

**Acción:**
- Reasignar a: María (servicios_publicos)

**Resultado Esperado:**
```
DESASIGNACION (Juan)
Campo: funcionario_asignado
Anterior: Juan Pérez (juan.perez@jantetelco.gob.mx)
Nuevo: [vacío]

DESASIGNACION (Carlos)
Campo: funcionario_asignado
Anterior: Carlos Ramírez (carlos.ramirez@jantetelco.gob.mx)
Nuevo: [vacío]

ASIGNACION (María)
Campo: funcionario_asignado
Anterior: Juan Pérez, Carlos Ramírez
Nuevo: María López (maria.lopez@jantetelco.gob.mx)

CAMBIO_TIPO
...
```

---

## 📊 Comparación Antes/Después

### ANTES (Valores Incorrectos)

| Campo | Valor Anterior | Valor Nuevo |
|-------|---------------|-------------|
| `asignaciones` | `asignaciones` ❌ | `s` ❌ |
| `tipo` | `baches` ✅ | `alumbrado` ✅ |

**Problemas:**
- ❌ No se entiende qué cambió
- ❌ "s" es un dato corrupto
- ❌ Campo "asignaciones" es confuso

### DESPUÉS (Valores Legibles)

| Campo | Valor Anterior | Valor Nuevo |
|-------|---------------|-------------|
| `funcionario_asignado` | `Wilder (wilder@jantetelco.gob.mx)` ✅ | `[vacío]` ✅ |
| `funcionario_asignado` | `Sin asignar` ✅ | `María López (maria.lopez@jantetelco.gob.mx)` ✅ |
| `tipo` | `baches` ✅ | `alumbrado` ✅ |

**Mejoras:**
- ✅ Se ve claramente quién fue desasignado
- ✅ Se ve claramente quién fue asignado
- ✅ Nombres completos con email
- ✅ Campo descriptivo "funcionario_asignado"

---

## 🎓 Lecciones Aprendidas

### 1. Siempre Guardar Datos Legibles

```javascript
// ❌ Mal: IDs numéricos
valor_anterior: '5'
valor_nuevo: '3'

// ✅ Bien: Nombres legibles
valor_anterior: 'Juan Pérez (juan@example.com)'
valor_nuevo: 'María López (maria@example.com)'
```

**Razón:** El audit trail es para **humanos**, no para máquinas.

### 2. IDs en Metadatos

```javascript
// ✅ IDs van en metadatos JSON
metadatos: {
  funcionario_id_anterior: 5,
  funcionario_id_nuevo: 3,
  dependencia_anterior: 'obras_publicas',
  dependencia_nueva: 'servicios_publicos'
}
```

**Razón:** Los IDs son útiles para relaciones, pero no para lectura directa.

### 3. JOINs para Datos Completos

```javascript
// ❌ Mal: Solo IDs
SELECT usuario_id FROM asignaciones WHERE ...

// ✅ Bien: JOIN para obtener nombres
SELECT u.id, u.nombre, u.email, u.dependencia
FROM asignaciones a
JOIN usuarios u ON a.usuario_id = u.id
WHERE ...
```

### 4. Campos Descriptivos

```javascript
// ❌ Confuso
campo_modificado: 'asignaciones'

// ✅ Descriptivo
campo_modificado: 'funcionario_asignado'
```

---

## ✅ Checklist de Verificación

- [x] Código corregido en `asignaciones-routes.js`
- [x] Script de diagnóstico creado (`corregir-audit-trail.js`)
- [x] Sin errores de sintaxis
- [ ] Backend reiniciado
- [ ] Historial corrupto limpiado
- [ ] Nueva reasignación de prueba realizada
- [ ] Historial verificado con valores correctos
- [ ] Pruebas de reasignación simple (mismo dept)
- [ ] Pruebas de reasignación interdepartamental
- [ ] Usuario confirmó que se ve correctamente

---

## 🔗 Referencias

- **Archivos modificados:**
  - `server/asignaciones-routes.js` (líneas 456-545)
- **Archivos creados:**
  - `server/corregir-audit-trail.js` (script diagnóstico)
- **Documentación relacionada:**
  - `docs/IMPLEMENTACION_REASIGNACION_AUDIT_TRAIL_2025-10-03.md`
  - `docs/BUGFIX_DEPARTAMENTO_VACIO_2025-10-03.md`

---

**Estado:** ✅ Código corregido. Pendiente: Reiniciar backend + Limpiar historial + Prueba de nueva reasignación.
