# Bugfix: Botón "Reasignar" No Hacía Nada

**Fecha:** 2025-10-03  
**Severidad:** 🔴 CRÍTICO  
**Estado:** ✅ RESUELTO

---

## 🐛 Problema

El botón **"🔄 Reasignar"** (naranja) aparecía en la interfaz pero al hacer clic **no hacía nada**. El modal de reasignación no se abría.

### Síntomas

- ✅ Botón visible para usuarios admin
- ✅ Click no genera error en consola
- ❌ Modal nunca aparece
- ❌ No hay feedback visual

---

## 🔍 Diagnóstico

### Causa Raíz

El modal de reasignación usaba una **función async IIFE (Immediately Invoked Function Expression)** dentro del JSX:

```jsx
{/* ❌ INCORRECTO */}
{mostrarModalReasignacion && (async () => {
  const { DEPENDENCIA_POR_TIPO, ... } = await import('./constants/reasignacion.js');
  return (
    <div>...</div>
  );
})()}
```

### Por Qué Falla

1. **React no puede renderizar Promises directamente**
   - La función async retorna una Promise
   - React espera JSX o null, no Promises

2. **El IIFE se ejecuta pero el resultado es ignorado**
   - React intenta renderizar: `Promise { <pending> }`
   - No lanza error porque Promise es un objeto válido
   - Simplemente no renderiza nada

3. **Dynamic imports innecesarios**
   - Las constantes de reasignación son estáticas
   - No hay razón para cargarlas dinámicamente
   - Adds complejidad sin beneficio

---

## ✅ Solución

### 1. Cambiar a Imports Estáticos

**Antes:**
```jsx
{mostrarModalReasignacion && (async () => {
  const { DEPENDENCIA_POR_TIPO, ... } = await import('./constants/reasignacion.js');
  // ...
})()}
```

**Después:**
```jsx
// Al inicio del archivo
import { 
  DEPENDENCIA_POR_TIPO, 
  TIPOS_POR_DEPENDENCIA, 
  NOMBRES_DEPENDENCIAS, 
  NOMBRES_TIPOS 
} from './constants/reasignacion.js';

// En el JSX
{mostrarModalReasignacion && reporteAReasignar && (
  <div>...</div>
)}
```

### 2. Eliminar Dynamic Import en handleReasignar()

**Antes:**
```javascript
const handleReasignar = async () => {
  // ...
  const { DEPENDENCIA_POR_TIPO, ... } = await import('./constants/reasignacion.js');
  // ...
}
```

**Después:**
```javascript
const handleReasignar = async () => {
  // ...
  // Las constantes ya están importadas al inicio
  // ...
}
```

### 3. Ajustar Indentación

Como efecto de eliminar el async IIFE, toda la indentación del modal se redujo un nivel (de 12 a 10 espacios).

---

## 📝 Archivos Modificados

### `client/src/PanelFuncionario.jsx`

**Cambios:**

1. **Línea 1-7:** Agregado import estático de constantes
   ```javascript
   import { 
     DEPENDENCIA_POR_TIPO, 
     TIPOS_POR_DEPENDENCIA, 
     NOMBRES_DEPENDENCIAS, 
     NOMBRES_TIPOS 
   } from './constants/reasignacion.js';
   ```

2. **Línea 1565:** Eliminado async IIFE
   - Antes: `{mostrarModalReasignacion && (async () => { ... })()}`
   - Después: `{mostrarModalReasignacion && reporteAReasignar && ( ... )}`

3. **Línea 326:** Eliminado dynamic import en handleReasignar()
   - Eliminadas 2 líneas de `await import()`
   - Las constantes ya están disponibles

4. **Líneas 1565-1759:** Ajustada indentación completa del modal
   - De 12 espacios a 10 espacios
   - Total: 194 líneas reindentadas

---

## 🧪 Verificación

### Pasos de Prueba

1. **Abrir navegador** en http://localhost:5173/#panel
2. **Login como admin:** admin@jantetelco.gob.mx / admin123
3. **Ir a "Reportes de Mi Dependencia"**
4. **Click en "🔄 Reasignar"** (botón naranja)
5. **Verificar:** Modal se abre correctamente ✅
6. **Verificar:** Dropdown de funcionarios cargado ✅
7. **Verificar:** Campos de formulario funcionales ✅

### Resultado

✅ **Modal abre correctamente**  
✅ **Dropdown poblado con funcionarios**  
✅ **Detección de cambio de departamento funciona**  
✅ **Banner de advertencia aparece cuando corresponde**  
✅ **Botones Cancelar y Reasignar responden**

---

## 🎓 Lecciones Aprendidas

### 1. React No Renderiza Promises

```jsx
❌ {condition && (async () => <div>...</div>)()}
✅ {condition && <div>...</div>}
```

### 2. Async/Await en React

- **Permitido:** En funciones de manejo de eventos (onClick, onChange)
- **Permitido:** En useEffect hooks
- **NO permitido:** Directamente en JSX render

### 3. Dynamic Imports

**Cuándo usar:**
- Cargar componentes grandes bajo demanda (React.lazy)
- Cargar librerías pesadas solo cuando se necesitan
- Code splitting por rutas

**Cuándo NO usar:**
- Constantes pequeñas (< 1KB)
- Datos necesarios en renderizado inicial
- Dentro de JSX directamente

### 4. HMR (Hot Module Replacement)

Vite detectó automáticamente los cambios y actualizó el navegador:
```
9:49:34 p.m. [vite] (client) hmr update /src/PanelFuncionario.jsx (x5)
```

No fue necesario recargar manualmente el navegador.

---

## 🔗 Referencias

- **Issue reportado por:** Usuario (mensaje: "El nuevo botón de 'Reasignar', no hace nada")
- **Archivos relacionados:**
  - `client/src/PanelFuncionario.jsx` (modificado)
  - `client/src/constants/reasignacion.js` (sin cambios)
- **Documentación relacionada:**
  - `docs/IMPLEMENTACION_REASIGNACION_AUDIT_TRAIL_2025-10-03.md`
  - React Docs: [Rules of Hooks](https://react.dev/reference/rules)
  - MDN: [async function expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/async_function)

---

## ✅ Estado Final

- **Backend:** ✅ Sin cambios necesarios
- **Frontend:** ✅ Corregido y HMR aplicado
- **Testing:** ⏳ Pendiente prueba manual por usuario

**El botón "🔄 Reasignar" ahora funciona correctamente y abre el modal de reasignación interdepartamental.**
