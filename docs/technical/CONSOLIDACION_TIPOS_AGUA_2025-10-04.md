# Changelog: Consolidación de Tipos Relacionados con Agua

**Fecha:** 4 de octubre de 2025  
**Relacionado:** ADR-0008  
**Cambio:** Eliminación de tipo legacy "agua", corrección departamental, categorías visuales

---

## 📋 Resumen Ejecutivo

### Problema Identificado

Redundancia semántica y asignación departamental incorrecta en tipos relacionados con agua:

1. **Redundancia:** Tipo genérico "Agua y Drenaje" + tipos específicos "Falta de Agua" y "Fuga de Agua"
2. **Asignación Incorrecta:** Los tipos específicos iban a `servicios_publicos` en lugar de `agua_potable`
3. **Panel Vacío:** Cuando no hay reportes, no se mostraban las categorías en el panel izquierdo

### Solución Implementada

✅ **Eliminar tipo legacy "agua"** del dropdown (mantener solo en TIPOS_INFO para compatibilidad)  
✅ **Corregir asignación:** `falta_agua` y `fuga_agua` → `agua_potable` (especialistas)  
✅ **Categorías visuales:** Panel izquierdo organizado por departamento con tipos siempre visibles

---

## 🔄 Cambios en Código

### 1. Frontend: Tipos Principales (client/src/constants/tiposInfo.js)

#### ANTES (23 tipos en dropdown)

```javascript
export function getTiposPrincipales() {
  return [
    // ... otros tipos ...
    'alumbrado',
    'falta_agua',      // ❌ Agrupado con servicios públicos
    'fuga_agua',       // ❌ Agrupado con servicios públicos
    'basura',
    'limpieza',
    // ... otros tipos ...
    'agua',    // ❌ REDUNDANTE - tipo legacy genérico
    'parques'
  ];
}
```

#### DESPUÉS (21 tipos en dropdown)

```javascript
export function getTiposPrincipales() {
  return [
    // Obras Públicas
    'bache',
    'pavimento_danado',
    'banqueta_rota',
    'alcantarilla',
    
    // Servicios Públicos (mantenimiento general)
    'alumbrado',
    'basura',
    'limpieza',
    
    // Agua Potable (red hidráulica especializada)
    'falta_agua',  // ✅ Separado y claro
    'fuga_agua',   // ✅ Separado y claro
    
    // Seguridad Pública (tipos específicos)
    'inseguridad',
    'accidente',
    'delito',
    
    // Salud
    'plaga',
    'mascota_herida',
    'contaminacion',
    
    // Medio Ambiente
    'arbol_caido',
    'deforestacion',
    'quema',
    
    // Tipo legacy para compatibilidad
    'parques'
    // NOTAS:
    // - 'seguridad' removido → usar inseguridad, accidente o delito
    // - 'agua' removido → usar falta_agua o fuga_agua (específicos)
  ];
}
```

**Cambios:**
- ❌ Eliminado: `'agua'` (21 tipos ahora)
- ✅ Reorganizado: Tipos de agua agrupados bajo "Agua Potable"
- ✅ Comentarios explicativos para cada sección

---

### 2. Backend: Asignación Departamental (server/auth_middleware.js)

#### ANTES (Asignación INCORRECTA)

```javascript
export const DEPENDENCIA_POR_TIPO = {
  // Servicios Públicos
  'alumbrado': 'servicios_publicos',
  'falta_agua': 'servicios_publicos',    // ❌ INCORRECTO
  'fuga_agua': 'servicios_publicos',     // ❌ INCORRECTO
  'fugas_agua': 'servicios_publicos',    // ❌ INCORRECTO
  'basura': 'servicios_publicos',
  'limpieza': 'servicios_publicos',
  // ...
  'agua': 'agua_potable'  // Legacy
};
```

#### DESPUÉS (Asignación CORREGIDA)

```javascript
export const DEPENDENCIA_POR_TIPO = {
  // Servicios Públicos (mantenimiento general)
  'alumbrado': 'servicios_publicos',
  'basura': 'servicios_publicos',
  'limpieza': 'servicios_publicos',
  
  // Agua Potable (red hidráulica especializada)
  'falta_agua': 'agua_potable',      // ✅ CORREGIDO
  'fuga_agua': 'agua_potable',       // ✅ CORREGIDO
  'fugas_agua': 'agua_potable',      // ✅ CORREGIDO
  
  // ...otros tipos...
  
  // Tipos legacy (compatibilidad, NO en dropdown)
  'agua': 'agua_potable',  // DEPRECATED → usar falta_agua o fuga_agua
  'parques': 'parques_jardines',
  'seguridad': 'seguridad_publica'
};
```

**Cambios:**
- ✅ `falta_agua`, `fuga_agua`, `fugas_agua` → `agua_potable`
- ✅ Comentario actualizado: "DEPRECATED" para 'agua'
- ✅ Organización por categoría departamental

---

### 3. Frontend: Panel Izquierdo con Categorías (client/src/SimpleApp.jsx)

#### ANTES (Lista Plana)

```javascript
// Cargar tipos de la API (si no hay reportes, array vacío)
const [tiposData, reportesData] = await Promise.all([
  tiposReporte(),  // ❌ Devuelve [] si no hay reportes
  listarReportes()
]);

setTipos(tiposData);  // ❌ Panel vacío si no hay datos

// Renderizar lista plana sin categorías
{tipos.map((tipo) => {
  return <div>{tipo}</div>;  // Sin agrupación
})}
```

#### DESPUÉS (Categorías Siempre Visibles)

```javascript
// Si la API devuelve vacío, usar getTiposPrincipales()
const tiposFinales = tiposData.length > 0 ? tiposData : getTiposPrincipales();

setTipos(tiposFinales);  // ✅ Siempre hay tipos

// Renderizar con categorías organizadas
const categorias = [
  { nombre: '🛣️ Obras Públicas', tipos: ['bache', 'pavimento_danado', ...] },
  { nombre: '🔧 Servicios Públicos', tipos: ['alumbrado', 'basura', 'limpieza'] },
  { nombre: '💧 Agua Potable', tipos: ['falta_agua', 'fuga_agua'] },
  { nombre: '🚨 Seguridad Pública', tipos: ['inseguridad', 'accidente', 'delito'] },
  { nombre: '🏥 Salud', tipos: ['plaga', 'mascota_herida', 'contaminacion'] },
  { nombre: '🌳 Medio Ambiente', tipos: ['arbol_caido', 'deforestacion', 'quema'] },
  { nombre: '📦 Otros', tipos: ['parques'] }
];

{categorias.map((categoria) => {
  return (
    <div>
      <h4>{categoria.nombre}</h4>
      {categoria.tipos.map((tipo) => <TipoItem tipo={tipo} />)}
    </div>
  );
})}
```

**Cambios:**
- ✅ Fallback a `getTiposPrincipales()` si API devuelve vacío
- ✅ Categorías visuales con emojis
- ✅ Organización por departamento
- ✅ Panel NUNCA vacío (siempre muestra estructura)

---

## 📊 Análisis de Datos Históricos

### Script Ejecutado

```bash
node server/migrations/008-analizar-reportes-agua.js
```

### Resultado

```
📊 Análisis de Reportes con tipo="agua"
============================================================
✅ No se encontraron reportes con tipo="agua"
   El sistema ya está usando tipos específicos (falta_agua, fuga_agua)

✅ NO se requiere migración de datos
```

**Conclusión:** Base de datos LIMPIA, sin reportes legacy con `tipo='agua'`.

---

## 🎯 Impacto de los Cambios

### Comparación Antes/Después

| Aspecto | ANTES | DESPUÉS |
|---------|-------|---------|
| **Tipos en Dropdown** | 23 tipos | 21 tipos ✅ |
| **Redundancia Agua** | 3 tipos (agua, falta_agua, fuga_agua) | 2 tipos específicos ✅ |
| **Asignación falta_agua** | `servicios_publicos` ❌ | `agua_potable` ✅ |
| **Asignación fuga_agua** | `servicios_publicos` ❌ | `agua_potable` ✅ |
| **Panel sin reportes** | Vacío ❌ | Categorías visibles ✅ |
| **Organización visual** | Lista plana | Agrupado por departamento ✅ |
| **Claridad semántica** | Ambiguo (¿cuándo usar "agua"?) | Específico (falta vs fuga) ✅ |

### Beneficios

✅ **Ciudadano:**
- Ya NO se confunde entre "Agua y Drenaje" vs "Falta de Agua"
- Categorías visuales facilitan selección
- Panel siempre muestra opciones disponibles

✅ **Funcionarios:**
- Departamento `agua_potable` recibe reportes específicos (falta, fuga)
- Departamento `servicios_publicos` solo mantenimiento general (luz, basura, limpieza)
- Menos reportes mal asignados

✅ **Sistema:**
- 2 tipos menos (23 → 21)
- Semántica más clara y consistente
- Alineado con ADR-0007 (preferir tipos específicos)

---

## 🧪 Verificación y Testing

### Pasos de Verificación Manual

1. **Dropdown Actualizado:**
   ```
   ✅ Abrir http://localhost:5173/#reportar
   ✅ Verificar dropdown "Tipo de Reporte"
   ✅ Confirmar que NO aparece "Agua y Drenaje"
   ✅ Confirmar que SÍ aparecen "Falta de Agua" y "Fuga de Agua"
   ```

2. **Categorías en Panel:**
   ```
   ✅ Abrir http://localhost:5173/
   ✅ Verificar panel izquierdo muestra categorías:
      - 🛣️ Obras Públicas
      - 🔧 Servicios Públicos
      - 💧 Agua Potable (NUEVA CATEGORÍA)
      - 🚨 Seguridad Pública
      - 🏥 Salud
      - 🌳 Medio Ambiente
   ✅ Confirmar "Falta de Agua" y "Fuga de Agua" bajo "💧 Agua Potable"
   ```

3. **Asignación Departamental:**
   ```
   ✅ Crear reporte con tipo "Falta de Agua"
   ✅ Verificar en panel de funcionario que se asignó a departamento "agua_potable"
   ✅ Crear reporte con tipo "Fuga de Agua"
   ✅ Verificar asignación a "agua_potable"
   ```

### Tests Automatizados Sugeridos

```javascript
// tests/backend/tipos-agua.test.js
describe('ADR-0008: Consolidación tipos agua', () => {
  it('falta_agua debe asignarse a agua_potable', () => {
    const dep = DEPENDENCIA_POR_TIPO['falta_agua'];
    expect(dep).toBe('agua_potable');
  });
  
  it('fuga_agua debe asignarse a agua_potable', () => {
    const dep = DEPENDENCIA_POR_TIPO['fuga_agua'];
    expect(dep).toBe('agua_potable');
  });
  
  it('getTiposPrincipales NO debe incluir tipo agua', () => {
    const tipos = getTiposPrincipales();
    expect(tipos).not.toContain('agua');
  });
  
  it('getTiposPrincipales debe tener 21 tipos', () => {
    const tipos = getTiposPrincipales();
    expect(tipos.length).toBe(21);
  });
});
```

---

## 📚 Archivos Modificados

### Frontend
- ✅ `client/src/constants/tiposInfo.js` (getTiposPrincipales)
- ✅ `client/src/SimpleApp.jsx` (fallback + categorías visuales)

### Backend
- ✅ `server/auth_middleware.js` (DEPENDENCIA_POR_TIPO)

### Documentación
- ✅ `docs/adr/ADR-0008-consolidacion-tipos-agua.md` (nuevo)
- ✅ `docs/CONSOLIDACION_TIPOS_AGUA_2025-10-04.md` (este archivo)
- ⏳ `docs/GUIA_TIPOS_REPORTES_EJEMPLOS.md` (actualizar sección Agua)
- ⏳ `docs/TABLA_TIPOS_REPORTES_RESUMEN.md` (eliminar fila "Agua y Drenaje")

### Scripts
- ✅ `server/migrations/008-analizar-reportes-agua.js` (análisis)

---

## ⚠️ Consideraciones de Migración

### Compatibilidad con Datos Históricos

**Tipo legacy 'agua' SE MANTIENE en TIPOS_INFO:**

```javascript
export const TIPOS_INFO = {
  // ... tipos actuales ...
  
  // Tipos legacy (NO en dropdown, solo para datos históricos)
  'agua': { nombre: 'Agua y Drenaje', icono: '💧', color: '#3b82f6' }
};
```

**Razón:** Si en el futuro se restauran backups con reportes antiguos, el sistema podrá renderizarlos.

**Asignación legacy se mantiene:**

```javascript
export const DEPENDENCIA_POR_TIPO = {
  // ...
  'agua': 'agua_potable'  // DEPRECATED → usar falta_agua o fuga_agua
};
```

---

## 🔄 Próximos Pasos

### Tareas Pendientes

1. **Comunicación a Funcionarios:**
   - [ ] Informar a departamento `agua_potable` que recibirán más reportes
   - [ ] Explicar diferencia entre "Falta de Agua" (suministro) y "Fuga de Agua" (tubería)
   - [ ] Compartir ejemplos de cada tipo

2. **Actualización de Documentación:**
   - [ ] Actualizar `GUIA_TIPOS_REPORTES_EJEMPLOS.md`:
     - Agregar sección "💧 Agua Potable"
     - Ejemplos de "Falta de Agua" y "Fuga de Agua"
     - Explicar por qué "Agua y Drenaje" fue removido
   - [ ] Actualizar `TABLA_TIPOS_REPORTES_RESUMEN.md`:
     - Eliminar fila "Agua y Drenaje"
     - Agregar categoría "Agua Potable"

3. **Testing:**
   - [ ] Crear tests automatizados para asignación departamental
   - [ ] Test E2E: Crear reporte con tipo "Falta de Agua"
   - [ ] Test E2E: Verificar categorías en panel izquierdo

4. **Monitoreo Post-Despliegue:**
   - [ ] Verificar métricas de reportes mal clasificados
   - [ ] Feedback de ciudadanos sobre claridad de opciones
   - [ ] Tiempo promedio de selección de tipo

---

## 📝 Notas Finales

### Decisiones Clave

1. **¿Por qué eliminar "Agua y Drenaje"?**
   - Término vago e impreciso
   - Redundante con tipos específicos
   - Consistente con ADR-0007 (preferir específico sobre genérico)

2. **¿Por qué "agua_potable" en lugar de "servicios_publicos"?**
   - Especialización: Red hidráulica requiere conocimiento técnico específico
   - Responsabilidad: Departamento `agua_potable` es responsable de la red
   - Eficiencia: Reportes llegan directamente al equipo correcto

3. **¿Por qué categorías visuales en panel?**
   - UX mejorada: Ciudadano entiende estructura organizacional
   - Siempre visible: No depende de existencia de reportes
   - Escalable: Fácil agregar nuevas categorías en el futuro

---

**Última actualización:** 4 de octubre de 2025  
**Versión:** 1.0  
**Estado:** ✅ Implementado
