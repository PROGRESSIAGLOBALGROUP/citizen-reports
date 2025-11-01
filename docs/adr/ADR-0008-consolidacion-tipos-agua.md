# ADR-0008: Consolidación de Tipos Relacionados con Agua

**Fecha:** 4 de octubre de 2025  
**Estado:** ✅ APROBADO  
**Contexto:** Post-consolidación de tipos de seguridad (ADR-0007)

---

## Contexto

Durante la revisión post-consolidación de tipos de seguridad, se detectó **redundancia semántica crítica** en los tipos relacionados con agua:

### Problema Identificado

```javascript
// Estado ACTUAL (CONFLICTIVO):
TIPOS_INFO = {
  'agua': { nombre: 'Agua y Drenaje', icono: '💧', color: '#3b82f6' },           // LEGACY
  'falta_agua': { nombre: 'Falta de Agua', icono: '💧', color: '#3b82f6' },      // Específico
  'fuga_agua': { nombre: 'Fuga de Agua', icono: '💦', color: '#2563eb' }         // Específico
}

// Mapeo de departamentos (INCONSISTENTE):
DEPENDENCIA_POR_TIPO = {
  'agua': 'agua_potable',                  // ✅ Correcto
  'falta_agua': 'servicios_publicos',      // ❌ INCORRECTO
  'fuga_agua': 'servicios_publicos'        // ❌ INCORRECTO
}
```

### Conflictos Semánticos

1. **"Agua y Drenaje"** es un término GENÉRICO que incluye:
   - Falta de agua (suministro)
   - Fuga de agua (desperdicio)
   - Problemas de drenaje (alcantarillas)

2. **"Falta de Agua"** y **"Fuga de Agua"** son ESPECÍFICOS:
   - Son subcategorías del tipo genérico
   - Ambos deberían ir al departamento `agua_potable` (NO `servicios_publicos`)
   - Tienen íconos similares (💧 vs 💦)

3. **Confusión del Ciudadano:**
   - ¿Cuándo usar "Agua y Drenaje" vs "Falta de Agua"?
   - ¿Por qué aparecen 3 opciones relacionadas con agua?
   - NO es claro que sean jerárquicos

4. **Asignación Departamental Incorrecta:**
   - `falta_agua` y `fuga_agua` van a `servicios_publicos` (mantenimiento general)
   - Deberían ir a `agua_potable` (especialistas en red hidráulica)

---

## Decisión

### **Opción Elegida: Consolidación Completa**

**ELIMINAR el tipo legacy "agua" y mantener SOLO los tipos específicos**

### Razones

1. **Claridad Semántica:**
   - "Falta de Agua" y "Fuga de Agua" son mutuamente excluyentes
   - NO hay ambigüedad en su significado
   - Cada uno tiene acción específica (reconectar vs reparar)

2. **Corrección Departamental:**
   - Ambos DEBEN ir a `agua_potable` (especialistas)
   - `servicios_publicos` es demasiado genérico

3. **Cobertura Completa:**
   - Falta de agua → Problemas de suministro
   - Fuga de agua → Problemas de tubería
   - Alcantarilla → Problemas de drenaje (ya existe como tipo separado)
   - NO se necesita tipo genérico "agua"

4. **Consistencia con ADR-0007:**
   - Se eliminó "Seguridad Ciudadana" por vago
   - Se prefieren tipos específicos sobre genéricos
   - Misma lógica aplica a "Agua y Drenaje"

---

## Implementación

### Fase 1: Análisis de Datos Históricos

```javascript
// Script: server/migrations/008-analizar-reportes-agua.js
// Verificar si hay reportes con tipo='agua' en la base de datos
```

### Fase 2: Reclasificación (si aplica)

Si existen reportes con `tipo='agua'`:

```javascript
// Reclasificar según palabras clave en descripción:
const keywords = {
  falta_agua: ['no llega', 'sin agua', 'no hay agua', 'sin suministro', 'corte', 'suspendido'],
  fuga_agua: ['fuga', 'tubería rota', 'derrame', 'se sale', 'goteo', 'desperdicio'],
  alcantarilla: ['drenaje', 'coladera', 'registro', 'tapa', 'inundación']
};
```

### Fase 3: Actualización de Código

**3.1 Eliminar "agua" de dropdown (tiposInfo.js):**

```javascript
// client/src/constants/tiposInfo.js

// ANTES (23 tipos):
export function getTiposPrincipales() {
  return [
    // ...otros tipos...
    'falta_agua',
    'fuga_agua',
    // ...
    'agua',    // ❌ LEGACY - ELIMINAR
    'parques'  // Mantener por ahora
  ];
}

// DESPUÉS (22 tipos):
export function getTiposPrincipales() {
  return [
    // ...otros tipos...
    'falta_agua',    // ✅ Específico y claro
    'fuga_agua',     // ✅ Específico y claro
    // ...
    'parques'  // Legacy (siguiente ADR)
    // NOTA: 'agua' removido - usar tipos específicos
  ];
}
```

**3.2 Corregir mapeo departamental (auth_middleware.js):**

```javascript
// server/auth_middleware.js

// ANTES (INCORRECTO):
export const DEPENDENCIA_POR_TIPO = {
  'alumbrado': 'servicios_publicos',
  'falta_agua': 'servicios_publicos',      // ❌ INCORRECTO
  'fuga_agua': 'servicios_publicos',       // ❌ INCORRECTO
  'fugas_agua': 'servicios_publicos',      // ❌ INCORRECTO
  'basura': 'servicios_publicos',
  'limpieza': 'servicios_publicos',
  // ...
  'agua': 'agua_potable'  // Legacy
};

// DESPUÉS (CORREGIDO):
export const DEPENDENCIA_POR_TIPO = {
  // Servicios Públicos (mantenimiento general)
  'alumbrado': 'servicios_publicos',
  'basura': 'servicios_publicos',
  'limpieza': 'servicios_publicos',
  
  // Agua Potable (especialistas en red hidráulica)
  'falta_agua': 'agua_potable',      // ✅ CORREGIDO
  'fuga_agua': 'agua_potable',       // ✅ CORREGIDO
  'fugas_agua': 'agua_potable',      // ✅ CORREGIDO
  
  // Legacy (compatibilidad, NO en dropdown)
  'agua': 'agua_potable'  // DEPRECATED → usar falta_agua o fuga_agua
};
```

**3.3 Mantener en TIPOS_INFO (compatibilidad):**

```javascript
// client/src/constants/tiposInfo.js
export const TIPOS_INFO = {
  // ... tipos actuales ...
  
  // Tipos legacy (NO en dropdown, solo para datos históricos)
  'agua': { nombre: 'Agua y Drenaje', icono: '💧', color: '#3b82f6' },  // DEPRECATED
  'parques': { nombre: 'Parques y Jardines', icono: '🌳', color: '#84cc16' }
};
```

### Fase 4: Actualización de Documentación

- `GUIA_TIPOS_REPORTES_EJEMPLOS.md`: Actualizar sección "Agua Potable"
- `TABLA_TIPOS_REPORTES_RESUMEN.md`: Eliminar fila "Agua y Drenaje"
- Changelog: Documentar cambio

### Fase 5: Testing

```javascript
// tests/backend/tipos-agua.test.js
describe('Consolidación tipos agua', () => {
  it('falta_agua debe asignarse a agua_potable', () => {
    const reporte = { tipo: 'falta_agua' };
    const dep = obtenerDependencia(reporte.tipo);
    expect(dep).toBe('agua_potable');
  });
  
  it('fuga_agua debe asignarse a agua_potable', () => {
    const reporte = { tipo: 'fuga_agua' };
    const dep = obtenerDependencia(reporte.tipo);
    expect(dep).toBe('agua_potable');
  });
  
  it('tipo agua legacy debe asignarse a agua_potable', () => {
    const reporte = { tipo: 'agua' };
    const dep = obtenerDependencia(reporte.tipo);
    expect(dep).toBe('agua_potable');
  });
});
```

---

## Consecuencias

### Positivas

✅ **Claridad Mejorada:**
- Ciudadano sabe exactamente qué tipo elegir
- "Falta de Agua" vs "Fuga de Agua" son autoexplicativos

✅ **Asignación Correcta:**
- Reportes de agua van al departamento especializado
- `servicios_publicos` solo para mantenimiento general

✅ **Consistencia Semántica:**
- Se mantiene patrón de tipos específicos sobre genéricos
- Alineado con ADR-0007 (consolidación seguridad)

✅ **Cobertura Completa:**
- Falta de agua: problemas de suministro
- Fuga de agua: problemas de tubería
- Alcantarilla: problemas de drenaje (tipo separado)

### Negativas

⚠️ **Migración de Datos:**
- Si existen reportes con `tipo='agua'`, requiere reclasificación
- Análisis manual de descripciones en casos ambiguos

⚠️ **Comunicación:**
- Funcionarios de `servicios_publicos` deben saber que ya NO reciben reportes de agua
- Funcionarios de `agua_potable` recibirán MÁS reportes

---

## Alternativas Consideradas

### Opción 2: Mantener "Agua y Drenaje" como Categoría Padre

**Descripción:**
- Dropdown muestra "Agua y Drenaje" como única opción
- Formulario secundario pregunta: "¿Qué tipo de problema?"
  - [ ] Falta de suministro
  - [ ] Fuga o tubería rota
  - [ ] Problema de drenaje

**Rechazada porque:**
- Agrega fricción al proceso de reporte
- Dos pasos en lugar de uno
- Ciudadano debe entender jerarquía

### Opción 3: Crear Departamento Único "Servicios Hidráulicos"

**Descripción:**
- Fusionar `agua_potable` y partes de `servicios_publicos`
- Todos los reportes de agua al nuevo departamento

**Rechazada porque:**
- Cambio organizacional del municipio (fuera de alcance)
- Requiere aprobación política
- No resuelve redundancia en tipos

---

## Métricas de Éxito

- ✅ Dropdown muestra 21 tipos (eliminado "Agua y Drenaje")
- ✅ `falta_agua` y `fuga_agua` se asignan a `agua_potable`
- ✅ 0 reportes con clasificación ambigua
- ✅ Tiempo promedio de selección de tipo < 5 segundos
- ✅ Tests de backend pasan con 100% cobertura

---

## Referencias

- **ADR-0007:** Consolidación de tipos de seguridad
- **Changelog:** `CONSOLIDACION_TIPOS_AGUA_2025-10-04.md`
- **Script de análisis:** `server/migrations/008-analizar-reportes-agua.js`
- **Tests:** `tests/backend/tipos-agua.test.js`

---

## Notas de Implementación

### Orden de Aplicación

1. Ejecutar script de análisis (`008-analizar-reportes-agua.js`)
2. Si hay datos históricos, reclasificar manualmente casos ambiguos
3. Actualizar `auth_middleware.js` (DEPENDENCIA_POR_TIPO)
4. Actualizar `tiposInfo.js` (getTiposPrincipales)
5. Actualizar documentación
6. Ejecutar tests
7. Desplegar
8. Comunicar cambios a funcionarios

### Rollback

Si se detectan problemas:

1. Revertir cambios en `getTiposPrincipales()` (agregar "agua")
2. Revertir cambios en `DEPENDENCIA_POR_TIPO` (volver a `servicios_publicos`)
3. Analizar feedback de usuarios
4. Reevaluar decisión

---

**Última actualización:** 4 de octubre de 2025  
**Próxima revisión:** 4 de noviembre de 2025 (1 mes de uso)
