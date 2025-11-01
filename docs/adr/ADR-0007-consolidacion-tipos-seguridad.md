# ADR-0007: Consolidación de Tipos de Reportes de Seguridad

**Fecha:** 4 de octubre de 2025  
**Estado:** Propuesto  
**Decisores:** Equipo de desarrollo  
**Issue:** Redundancia entre "Seguridad Ciudadana" e "Inseguridad"

---

## Contexto

### Problema Identificado

El sistema actualmente tiene tipos de reportes redundantes en la categoría de seguridad:

| Tipo Actual | Nombre Display | Ícono | Color | Departamento Asignado |
|-------------|----------------|-------|-------|----------------------|
| `seguridad` | Seguridad Ciudadana | 🚔 | #ef4444 | `seguridad_publica` |
| `inseguridad` | Inseguridad | 🚨 | #ef4444 | `seguridad_publica` |
| `accidente` | Accidente | 🚗 | #dc2626 | `seguridad_publica` |
| `delito` | Delito | 🚔 | #b91c1c | `seguridad_publica` |

**Análisis:**
- `seguridad` e `inseguridad` son conceptualmente **opuestos** pero ambos se asignan al mismo departamento
- Ambos usan íconos similares (🚔 vs 🚨)
- Ambos tienen el mismo color base (rojo)
- **Confusión semántica:** ¿Qué significa reportar "seguridad"? ¿Una zona segura o un problema de seguridad?

### Investigación de Causa Raíz

#### 1. Origen del Tipo "seguridad" (Legacy)

En `server/schema.sql` líneas 93-99:
```sql
-- Datos de ejemplo para Jantetelco, Morelos
INSERT OR IGNORE INTO reportes (id, tipo, descripcion, lat, lng, peso, dependencia) VALUES 
(3, 'seguridad', 'Falta señalización en cruce peligroso', 18.7170, -98.7765, 4, 'seguridad_publica'),
(9, 'seguridad', 'Semáforo descompuesto en centro', 18.7130, -98.7775, 3, 'seguridad_publica');
```

**Problema:** Estos reportes se corrigieron posteriormente en `docs/changelog_2025-10-01.md`:
```md
### 1️⃣ Reclasificación de Reportes Viales
- ✅ **ID 3:** "Falta señalización en cruce peligroso" → `seguridad` a `baches`
- ✅ **ID 9:** "Semáforo descompuesto en centro" → `seguridad` a `baches`

**Justificación:** Señalización y semáforos son infraestructura vial (competencia de Obras Públicas), no Seguridad Ciudadana.
```

**Conclusión:** El tipo "seguridad" se usaba incorrectamente para problemas de infraestructura vial, no para problemas de seguridad ciudadana real.

#### 2. Tipos Específicos Introducidos (Actuales)

En `client/src/constants/tiposInfo.js` y `server/reasignacion-utils.js`:
```javascript
// Tipos específicos para seguridad pública
'inseguridad': 'seguridad_publica',
'accidente': 'seguridad_publica', 
'delito': 'seguridad_publica',
```

Estos tipos son **semánticamente claros**:
- `inseguridad`: Percepción de inseguridad, falta de vigilancia, zonas oscuras
- `accidente`: Accidentes viales o de tránsito
- `delito`: Robos, vandalismo, actividades delictivas

#### 3. Mapeo en `auth_middleware.js`

```javascript
export const DEPENDENCIA_POR_TIPO = {
  'baches': 'obras_publicas',
  'alumbrado': 'servicios_publicos',
  'seguridad': 'seguridad_publica',  // ← LEGACY
  'limpieza': 'servicios_publicos',
  'agua': 'agua_potable',
  'parques': 'parques_jardines'
};
```

**Observación:** El mapeo solo incluye 6 tipos legacy básicos, no los 23 tipos actuales.

---

## Análisis de Impacto

### Datos Existentes

Necesitamos verificar si existen reportes con `tipo='seguridad'` en producción:

```sql
SELECT COUNT(*) as total, tipo 
FROM reportes 
WHERE tipo IN ('seguridad', 'inseguridad', 'accidente', 'delito')
GROUP BY tipo;
```

**Si existen reportes con `tipo='seguridad'`:**
- ¿Son realmente problemas de seguridad ciudadana?
- ¿O son problemas de infraestructura mal categorizados?

### Usuarios Afectados

Funcionarios de `seguridad_publica`:
- Actualmente pueden ver reportes de tipos: `seguridad`, `inseguridad`, `accidente`, `delito`
- Después de consolidación: `inseguridad`, `accidente`, `delito`

---

## Propuesta de Decisión

### Opción 1: Eliminar "seguridad" y Migrar a Tipos Específicos (RECOMENDADA)

**Cambios:**

1. **Marcar "seguridad" como DEPRECATED:**
   ```javascript
   // client/src/constants/tiposInfo.js
   export const TIPOS_INFO = {
     // ... otros tipos ...
     
     // DEPRECATED: Usar tipos específicos (inseguridad, accidente, delito)
     'seguridad': { 
       nombre: 'Seguridad Ciudadana (Legacy)', 
       icono: '🚔', 
       color: '#ef4444',
       deprecated: true,
       sugerencia: 'Usa: inseguridad, accidente o delito'
     }
   };
   ```

2. **Eliminar "seguridad" de `getTiposPrincipales()`:**
   ```javascript
   export function getTiposPrincipales() {
     return [
       // ... otros tipos ...
       
       // Seguridad Pública (tipos específicos)
       'inseguridad',  // ✅ Percepción de inseguridad
       'accidente',    // ✅ Accidentes viales
       'delito',       // ✅ Robos, vandalismo
       // 'seguridad' ← REMOVIDO
     ];
   }
   ```

3. **Migrar reportes existentes con script:**
   ```javascript
   // server/migrations/007-consolidar-tipos-seguridad.js
   
   /**
    * Migración: Analiza reportes con tipo='seguridad' y los reclasifica
    * 
    * Estrategia:
    * - Si descripción contiene palabras clave de delito → 'delito'
    * - Si contiene palabras clave de accidente → 'accidente'  
    * - Por defecto → 'inseguridad'
    */
   
   const PALABRAS_DELITO = ['robo', 'asalto', 'vandalismo', 'droga'];
   const PALABRAS_ACCIDENTE = ['choque', 'atropello', 'colisión', 'accidente'];
   
   function clasificarReporte(descripcion) {
     const desc = descripcion.toLowerCase();
     
     if (PALABRAS_DELITO.some(palabra => desc.includes(palabra))) {
       return 'delito';
     }
     if (PALABRAS_ACCIDENTE.some(palabra => desc.includes(palabra))) {
       return 'accidente';
     }
     return 'inseguridad'; // Default
   }
   ```

4. **Actualizar `DEPENDENCIA_POR_TIPO` en `auth_middleware.js`:**
   ```javascript
   export const DEPENDENCIA_POR_TIPO = {
     // Obras Públicas
     'bache': 'obras_publicas',
     'baches': 'obras_publicas',
     'pavimento_danado': 'obras_publicas',
     'banqueta_rota': 'obras_publicas',
     'alcantarilla': 'obras_publicas',
     
     // Servicios Públicos
     'alumbrado': 'servicios_publicos',
     'falta_agua': 'servicios_publicos',
     'fuga_agua': 'servicios_publicos',
     'basura': 'servicios_publicos',
     'limpieza': 'servicios_publicos',
     
     // Seguridad Pública (tipos específicos)
     'inseguridad': 'seguridad_publica',
     'accidente': 'seguridad_publica',
     'accidentes': 'seguridad_publica', // Plural
     'delito': 'seguridad_publica',
     'delitos': 'seguridad_publica', // Plural
     
     // Legacy (mantener compatibilidad temporal)
     'seguridad': 'seguridad_publica', // DEPRECATED
     'agua': 'agua_potable',
     'parques': 'parques_jardines'
   };
   ```

5. **Agregar validación en backend:**
   ```javascript
   // server/app.js - Endpoint POST /api/reportes
   
   if (tipo === 'seguridad') {
     console.warn(`⚠️ Tipo 'seguridad' está deprecated. Reclasificando...`);
     tipo = 'inseguridad'; // Auto-reclasificar a tipo específico
   }
   ```

**Ventajas:**
- ✅ Elimina ambigüedad semántica
- ✅ Mantiene compatibilidad hacia atrás (deprecation suave)
- ✅ Migración automática de datos históricos
- ✅ Claridad para ciudadanos (saben exactamente qué reportar)

**Desventajas:**
- ⚠️ Requiere migración de datos
- ⚠️ Puede haber reportes mal clasificados inicialmente

---

### Opción 2: Renombrar "seguridad" a algo más específico

**Alternativa:**
```javascript
'seguridad': { nombre: 'Solicitud de Patrullaje', icono: '🚔', color: '#ef4444' }
```

**Ventajas:**
- ✅ No requiere migración de datos
- ✅ Nombre más claro

**Desventajas:**
- ❌ Sigue habiendo redundancia con "inseguridad"
- ❌ "Solicitud de patrullaje" es un caso de uso específico, no cubre todo

---

### Opción 3: Mantener ambos tipos con documentación clara

**Cambio mínimo:**
```javascript
'seguridad': { 
  nombre: 'Solicitud de Vigilancia', 
  icono: '🚔', 
  color: '#3b82f6',  // ← Cambiar color para diferenciar
  descripcion: 'Solicitar patrullaje o vigilancia en zona específica'
},
'inseguridad': { 
  nombre: 'Reporte de Inseguridad', 
  icono: '🚨', 
  color: '#ef4444',
  descripcion: 'Reportar percepción de inseguridad, zona oscura, vandalismo'
}
```

**Ventajas:**
- ✅ Sin migración de datos
- ✅ Cobertura de dos casos de uso distintos

**Desventajas:**
- ❌ Confusión persiste (usuario no sabe cuál elegir)
- ❌ Ambos terminan en el mismo departamento

---

## Decisión Recomendada

**Opción 1: Eliminar "seguridad" legacy y consolidar en tipos específicos**

### Razones:

1. **Claridad Semántica:**
   - `inseguridad` (percepción, prevención)
   - `accidente` (eventos de tránsito)
   - `delito` (actividades delictivas)
   
   Son tipos mutuamente excluyentes y claramente definidos.

2. **Elimina Ambigüedad:**
   - "Seguridad" es un término vago y confuso
   - Los tipos específicos guían mejor al ciudadano

3. **Datos Históricos:**
   - Los reportes históricos de `tipo='seguridad'` fueron mayormente reclasificados a `baches`
   - Solo quedan casos edge que deben analizarse manualmente

4. **Alineación con Operaciones:**
   - Los funcionarios de seguridad pública manejan casos específicos:
     * Vigilancia y patrullaje → `inseguridad`
     * Atención a accidentes → `accidente`
     * Investigación de delitos → `delito`

---

## Plan de Implementación

### Fase 1: Análisis de Datos (No Destructivo)

1. **Script de análisis:**
   ```bash
   node server/migrations/007-analizar-reportes-seguridad.js
   ```
   
   Output esperado:
   ```
   📊 Análisis de reportes con tipo='seguridad':
   
   Total: 5 reportes
   
   Clasificación sugerida:
   - 2 reportes → delito
   - 1 reporte → accidente
   - 2 reportes → inseguridad
   ```

2. **Revisión manual** de reportes ambiguos

### Fase 2: Migración de Datos

1. **Backup de base de datos:**
   ```bash
   npm run backup:db
   ```

2. **Ejecutar migración:**
   ```bash
   node server/migrations/007-consolidar-tipos-seguridad.js
   ```

3. **Verificar resultado:**
   ```sql
   SELECT COUNT(*) FROM reportes WHERE tipo = 'seguridad';
   -- Debe retornar 0
   ```

### Fase 3: Actualización de Código

1. **Eliminar "seguridad" de `getTiposPrincipales()`**
   - Archivo: `client/src/constants/tiposInfo.js`

2. **Actualizar `DEPENDENCIA_POR_TIPO`**
   - Archivo: `server/auth_middleware.js`
   - Agregar mapeos para todos los tipos actuales

3. **Agregar validación en POST /api/reportes**
   - Si `tipo === 'seguridad'` → auto-reclasificar a `inseguridad` con warning

### Fase 4: Testing

1. **Tests unitarios:**
   ```javascript
   describe('POST /api/reportes con tipo deprecated', () => {
     it('debe auto-reclasificar seguridad → inseguridad', async () => {
       const response = await request(app)
         .post('/api/reportes')
         .send({
           tipo: 'seguridad',  // ← Deprecated
           descripcion: 'Zona oscura sin vigilancia',
           lat: 18.715,
           lng: -98.776,
           peso: 3
         });
       
       expect(response.status).toBe(200);
       expect(response.body.tipo).toBe('inseguridad');  // ✅ Auto-reclasificado
       expect(response.body.advertencias).toContain('deprecated');
     });
   });
   ```

2. **Test E2E:**
   - Verificar que formulario NO muestre "Seguridad Ciudadana"
   - Verificar que reportes migrados aparezcan con ícono correcto

### Fase 5: Documentación

1. **Actualizar `docs/api/openapi.yaml`:**
   ```yaml
   tipo:
     type: string
     enum:
       - bache
       - alumbrado
       - inseguridad  # ✅ Específico
       - accidente    # ✅ Específico
       - delito       # ✅ Específico
       # 'seguridad' ← REMOVIDO
   ```

2. **Changelog:**
   - Documento `docs/changelog_2025-10-04.md`
   - Explicar consolidación y razones

3. **ADR (este documento):**
   - Marcar como "Aceptado" después de implementación

---

## Consecuencias

### Positivas

- ✅ **Claridad:** Ciudadanos saben exactamente qué tipo usar
- ✅ **Consistencia:** Elimina redundancia conceptual
- ✅ **Mantenibilidad:** Menos tipos = menos complejidad
- ✅ **Reportes más precisos:** Clasificación automática mejora

### Negativas

- ⚠️ **Requiere migración:** Puede haber errores en clasificación automática
- ⚠️ **Cambio de comportamiento:** Usuarios acostumbrados a "seguridad" deben adaptarse
- ⚠️ **Documentación:** Requiere comunicar cambio a funcionarios

### Riesgos Mitigados

- **Pérdida de datos:** Backup antes de migración
- **Clasificación incorrecta:** Revisión manual de casos ambiguos
- **Compatibilidad:** Deprecation suave permite transición gradual

---

## Alternativas Consideradas

1. **Mantener status quo:** Rechazada por confusión semántica
2. **Renombrar sin eliminar:** Insuficiente, sigue habiendo redundancia
3. **Eliminar todos y crear uno solo:** Muy genérico, pierde información

---

## Referencias

- [ADR-0006: Sistema de Asignación de Reportes](./ADR-0006-sistema-asignacion-reportes.md)
- [Changelog 2025-10-01](../changelog_2025-10-01.md) - Reclasificación de reportes viales
- [BUGFIX: Tipos Duplicados 2025-10-03](../BUGFIX_TIPOS_DUPLICADOS_2025-10-03.md)
- [Code Surgeon Best Practices](../../code_surgeon/BEST_PRACTICES.md)

---

## Aprobación

- [ ] Revisado por equipo técnico
- [ ] Aprobado por stakeholders municipales
- [ ] Comunicado a funcionarios de seguridad pública
- [ ] Implementado y verificado en QA
- [ ] Desplegado a producción

---

**Notas finales:**

Este ADR documenta la decisión de consolidar tipos de reportes de seguridad para eliminar redundancia y ambigüedad. La implementación debe hacerse con cuidado para no perder datos históricos y debe comunicarse claramente a todos los usuarios del sistema.
