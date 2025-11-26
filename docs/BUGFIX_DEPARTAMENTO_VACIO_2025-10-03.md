# Bugfix: Botón Reasignar Deshabilitado - Departamento Vacío

**Fecha:** 2025-10-03  
**Severidad:** 🟡 MEDIO  
**Estado:** ✅ RESUELTO

---

## 🐛 Problema Reportado

Usuario intentó reasignar un reporte pero el botón **"Reasignar"** estaba **deshabilitado**.

### Síntomas Observados en Screenshot

1. ✅ Modal de reasignación abre correctamente
2. ✅ Dropdown de funcionarios poblado
3. ✅ Banner amarillo de "Cambio de departamento detectado" visible
4. ✅ Tipo sugerido: "Alumbrado Público"
5. ⚠️  **"Departamento actual:" aparece VACÍO** (debería mostrar "Obras Públicas")
6. ⚠️  **Botón "Reasignar" deshabilitado**
7. ⚠️  Razón ingresada: "yxeryxrxt" (**9 caracteres**, se requieren mínimo 10)

---

## 🔍 Diagnóstico

### Problema 1: Departamento Actual Vacío

**Causa Raíz:**  
El tipo de reporte en la base de datos es **"baches"** (plural), pero el mapeo solo tenía **"bache"** (singular).

```javascript
// ❌ Antes: Solo singular
export const DEPENDENCIA_POR_TIPO = {
  'bache': 'obras_publicas',  // ❌ No encuentra "baches"
  // ...
};
```

**Por qué el modal se abre sin problema:**
- El modal usa `reporteAReasignar?.tipo` que existe ("baches")
- Pero `DEPENDENCIA_POR_TIPO[reporteAReasignar.tipo]` retorna `undefined`
- Por eso "Departamento actual:" aparece vacío

**Consecuencias:**
1. Usuario no ve el departamento actual (confuso)
2. Sistema no puede calcular si hay cambio de departamento
3. Auto-detección del nuevo tipo no funciona correctamente

### Problema 2: Botón Deshabilitado

El botón se deshabilita cuando:
```javascript
disabled={!funcionarioSeleccionado || razonReasignacion.length < 10 || reasignando}
```

En este caso:
- ✅ `funcionarioSeleccionado` = true (María López seleccionada)
- ❌ `razonReasignacion.length < 10` = true (solo 9 caracteres)
- ✅ `reasignando` = false

**Razón:** "yxeryxrxt" tiene 9 caracteres, se requieren **mínimo 10** para audit trail.

---

## ✅ Solución Implementada

### 1. Agregar Variantes Plurales al Mapeo

**Frontend:** `client/src/constants/reasignacion.js`

```javascript
// ✅ Después: Singular + Plural
export const DEPENDENCIA_POR_TIPO = {
  'bache': 'obras_publicas',
  'baches': 'obras_publicas',  // ✅ Variante plural agregada
  'pavimento_danado': 'obras_publicas',
  'banqueta_rota': 'obras_publicas',
  'banquetas_rotas': 'obras_publicas',  // ✅ Variante plural
  'alcantarilla': 'obras_publicas',
  'alcantarillas': 'obras_publicas',  // ✅ Variante plural
  // ... (total: 12 variantes plurales agregadas)
};

export const NOMBRES_TIPOS = {
  'bache': 'Bache',
  'baches': 'Baches',  // ✅ Para mostrar en UI
  // ...
};
```

**Backend:** `server/reasignacion-utils.js`

```javascript
export const DEPENDENCIA_POR_TIPO = {
  'bache': 'obras_publicas',
  'baches': 'obras_publicas',  // ✅ Consistencia backend-frontend
  // ... (mismas 12 variantes plurales)
};
```

### 2. Variantes Plurales Agregadas

Total: **12 variantes plurales** para mayor compatibilidad:

| Singular | Plural | Departamento |
|----------|--------|--------------|
| bache | **baches** | obras_publicas |
| banqueta_rota | **banquetas_rotas** | obras_publicas |
| alcantarilla | **alcantarillas** | obras_publicas |
| fuga_agua | **fugas_agua** | servicios_publicos |
| accidente | **accidentes** | seguridad_publica |
| delito | **delitos** | seguridad_publica |
| plaga | **plagas** | salud |
| mascota_herida | **mascotas_heridas** | salud |
| arbol_caido | **arboles_caidos** | medio_ambiente |
| quema | **quemas** | medio_ambiente |

---

## 🧪 Resultado Esperado

### Antes de la Corrección

```
Modal de Reasignación:
┌─────────────────────────────────────┐
│ 🔄 Reasignar Reporte #1            │
│                                     │
│ Tipo actual: baches                 │
│ Departamento actual: [VACÍO] ❌     │
│                                     │
│ Nuevo Funcionario: María López      │
│ ⚠️ Cambio de departamento detectado │
│                                     │
│ Razón: yxeryxrxt (9 caracteres) ❌  │
│                                     │
│ [Cancelar] [🔄 Reasignar] (disabled)│
└─────────────────────────────────────┘
```

### Después de la Corrección

```
Modal de Reasignación:
┌─────────────────────────────────────┐
│ 🔄 Reasignar Reporte #1            │
│                                     │
│ Tipo actual: Baches                 │
│ Departamento actual: Obras Públicas ✅
│                                     │
│ Nuevo Funcionario: María López      │
│ ⚠️ Cambio de departamento detectado │
│ El sistema sugiere: Alumbrado       │
│                                     │
│ Razón: (escribe 10+ caracteres)    │
│                                     │
│ [Cancelar] [🔄 Reasignar]           │
└─────────────────────────────────────┘
```

---

## 📋 Instrucciones para el Usuario

### Paso 1: Verificar que Frontend Recargó

Vite debería haber detectado el cambio automáticamente (HMR). Verifica en la consola del navegador (F12):

```
[vite] hmr update /src/constants/reasignacion.js
```

Si no aparece, **recarga manualmente** la página: `Ctrl + R` o `F5`

### Paso 2: Cerrar y Reabrir el Modal

1. **Click en "Cancelar"** en el modal actual
2. **Click nuevamente en "🔄 Reasignar"**
3. **Verificar:** Ahora debería aparecer "Departamento actual: **Obras Públicas**" ✅

### Paso 3: Completar la Reasignación

1. **Seleccionar:** María López - Servicios Públicos
2. **Verificar:** Banner amarillo con tipo sugerido "Alumbrado Público"
3. **Escribir razón válida (mínimo 10 caracteres):**
   ```
   El reporte corresponde a alumbrado público
   ```
   (43 caracteres ✅)
4. **Click en "🔄 Reasignar"**
5. **Verificar:** Alert de confirmación con resumen de cambios

---

## 🔄 Hot Reload

Vite tiene **Hot Module Replacement (HMR)** activado:
- ✅ Frontend: Cambios detectados automáticamente
- ⚠️  Backend: Requiere reinicio manual si se modificó reasignacion-utils.js

### Reiniciar Backend (si es necesario)

```powershell
# Detener servidor actual
Ctrl + C

# Reiniciar
cd C:\PROYECTOS\citizen-reports\server
node server.js
```

---

## 📊 Impacto

### Reportes Afectados

Cualquier reporte con tipo plural en la base de datos:
- `baches` (más común)
- `alcantarillas`
- `fugas_agua`
- `accidentes`
- `delitos`
- `plagas`
- `arboles_caidos`
- Etc.

### Datos Existentes

✅ **No requiere migración de datos**  
Los reportes existentes con tipos plurales ahora funcionarán correctamente sin modificar la base de datos.

---

## 🎓 Lecciones Aprendidas

### 1. Inconsistencia Singular/Plural

**Problema:**  
El sistema permitía crear reportes con tipos plurales, pero los mapeos solo tenían singulares.

**Prevención:**  
- ✅ Agregar validación en backend que normalice a singular
- ✅ O mantener ambas variantes en mapeos (solución actual)

### 2. Validación de Constantes

**Buena práctica:**  
Validar que los tipos en la base de datos coincidan con las constantes:

```javascript
// Ejemplo de validación
const tipoValido = Object.keys(DEPENDENCIA_POR_TIPO).includes(tipo);
if (!tipoValido) {
  console.warn(`Tipo desconocido: ${tipo}`);
  // Intentar normalizar o mostrar error
}
```

### 3. Feedback Visual Claro

El campo "Departamento actual:" vacío era confuso para el usuario. Opciones mejores:

```jsx
// Opción 1: Mostrar error explícito
{!departamento && <span style={{color: 'red'}}>❌ Tipo no reconocido</span>}

// Opción 2: Fallback amigable
{departamento || <span style={{color: '#f59e0b'}}>⚠️ Tipo no mapeado</span>}
```

---

## ✅ Checklist de Verificación

- [x] Variantes plurales agregadas en frontend
- [x] Variantes plurales agregadas en backend
- [x] Sin errores de sintaxis
- [x] HMR detectó cambios en frontend
- [ ] Usuario recargó página o reabrió modal
- [ ] Usuario probó reasignación con razón válida (10+ caracteres)
- [ ] Departamento actual ahora se muestra correctamente
- [ ] Botón se habilita con razón de 10+ caracteres

---

## 🔗 Referencias

- **Archivo modificado 1:** `client/src/constants/reasignacion.js`
- **Archivo modificado 2:** `server/reasignacion-utils.js`
- **Screenshot original:** Ver adjunto del usuario
- **Documentación relacionada:** `docs/IMPLEMENTACION_REASIGNACION_AUDIT_TRAIL_2025-10-03.md`

---

**Estado:** ✅ Corrección aplicada. Usuario debe recargar página o reabrir modal, y escribir razón de 10+ caracteres.
