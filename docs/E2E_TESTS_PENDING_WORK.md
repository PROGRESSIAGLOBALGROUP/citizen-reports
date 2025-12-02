# E2E Tests - Trabajo Pendiente

**Última actualización:** 2025-12-01  
**Estado del proyecto:** Fase 1 Completa (64% pass rate)

---

## 📋 Contexto

Se implementó un sistema de fixtures para tests E2E y se corrigieron múltiples problemas en los tests existentes. El trabajo está parcialmente completo.

### Lo que SÍ está funcionando:
- ✅ Sistema de fixtures (`tests/e2e/fixtures/`) - 10/10 tests pasan
- ✅ 185 tests E2E pasan de ~290 totales (64% pass rate)
- ✅ Autenticación y bypass de rate limiting en modo test
- ✅ Base de datos e2e.db con usuarios de prueba sincronizados

### Lo que NO está funcionando:
- ❌ ~105 tests fallan por selectores CSS desactualizados
- ❌ Algunos tests tienen problemas de timing/navegación

---

## 🔍 Análisis de Tests Fallidos

### Archivos con más fallos (prioridad alta):

| Archivo | Tests Fallando | Problema Principal |
|---------|----------------|-------------------|
| `panel-funcionario-responsive.spec.ts` | ~26 | Selectores CSS `.gp-filters-section`, `.gp-filter-clear` no existen |
| `reportes-dependencia.spec.ts` | ~10 | Timing de navegación, modal no cierra correctamente |
| `admin-categories-premium.spec.ts` | ~4 | Selectores de header premium |
| `solicitud-cierre-vista-completa.spec.ts` | ~5 | Flujo de cierre desactualizado |
| `funcionario-ver-reporte-completo.spec.ts` | ~7 | Nombre de usuario, timing de panel |

### Patrones de errores comunes:

1. **Selectores CSS inexistentes:**
   ```typescript
   // ❌ Clase que no existe en la UI actual
   page.locator('.gp-filters-section')
   page.locator('.gp-filter-clear')
   page.locator('.gp-reports-list')
   
   // ✅ Debería buscar las clases reales del componente
   ```

2. **Timeouts esperando elementos:**
   ```typescript
   // ❌ Timeout porque el elemento nunca aparece
   await page.waitForSelector('text=Panel de Funcionario', { timeout: 10000 });
   
   // ✅ Ya corregido a:
   await page.waitForSelector('text=Mi Panel de Reportes', { timeout: 10000 });
   ```

3. **Nombres de usuario no coinciden:**
   ```typescript
   // ❌ En tests
   nombre: 'Juan Pérez'
   
   // ✅ En e2e.db
   nombre: 'Juan Pérez - Obras'
   ```

---

## 🛠️ Trabajo Pendiente por Archivo

### 1. `panel-funcionario-responsive.spec.ts` (PRIORIDAD ALTA)

**Problema:** Usa clases CSS que no existen en `PanelFuncionario.jsx`

**Acción requerida:**
1. Revisar `client/src/PanelFuncionario.jsx` líneas 596-800
2. Identificar las clases CSS reales de:
   - Sección de filtros (¿existe?)
   - Botón "limpiar filtros" (¿existe?)
   - Grid/lista de reportes
   - Paginación
3. Actualizar selectores en el test o eliminar tests de features que no existen

**Clases que SÍ existen:**
- `.gobierno-premium` - contenedor raíz
- `.gp-container` - contenedor principal
- `.gp-panel-header` - header del panel
- `.gp-tabs` - contenedor de tabs
- `.gp-tab` - cada tab individual
- `.gp-empty-state` - estado vacío

### 2. `reportes-dependencia.spec.ts` (PRIORIDAD ALTA)

**Problema:** Navegación y timing

**Acción requerida:**
1. El helper `goToPanel()` navega a `/#panel` pero puede requerir re-autenticación
2. Algunos tests esperan modales que no se cierran
3. Verificar que los títulos de sección coincidan con UI real

### 3. `funcionario-ver-reporte-completo.spec.ts` (PRIORIDAD MEDIA)

**Problema:** Varios tests dependen de datos que pueden no existir

**Acción requerida:**
1. Usar fixtures API para crear reportes antes de cada test
2. Actualizar el nombre del funcionario a `Juan Pérez - Obras`
3. Verificar que el reporte esté asignado al funcionario correcto

### 4. `solicitud-cierre-vista-completa.spec.ts` (PRIORIDAD MEDIA)

**Problema:** Flujo de solicitud de cierre cambió

**Acción requerida:**
1. Revisar el flujo actual en `VerReporte.jsx`
2. Identificar los botones y modales correctos
3. Actualizar selectores y flujo del test

### 5. `admin-categories-*.spec.ts` (PRIORIDAD BAJA)

**Problema:** Selectores de UI admin

**Acción requerida:**
1. Revisar `AdminCategorias.jsx` y `AdminPanel.jsx`
2. Actualizar selectores de tabs y headers

---

## 📁 Archivos Clave de Referencia

### Para entender la UI actual:
```
client/src/
├── PanelFuncionario.jsx      # Panel principal - líneas 596-1499
├── VerReporte.jsx            # Vista de reporte individual
├── AdminCategorias.jsx       # Admin de categorías
├── AdminPanel.jsx            # Panel de administración
├── LoginModal.jsx            # Modal de login
└── ProfessionalTopBar.jsx    # Barra superior
```

### Para entender los tests:
```
tests/e2e/
├── fixtures/
│   ├── data.ts               # Usuarios y datos de prueba
│   ├── helpers.ts            # Funciones de login y API
│   └── index.ts              # Exportaciones
├── flujo-completo-fixtures.spec.ts  # ✅ 10/10 pasan - REFERENCIA
└── *.spec.ts                 # Otros tests
```

### CSS del panel:
```
client/src/gobierno-premium-panel.css  # Todas las clases .gp-*
```

---

## ✅ Checklist para Completar

### Fase 2A: Selectores CSS (Crítico)
- [ ] Auditar `PanelFuncionario.jsx` y extraer todas las clases CSS usadas
- [ ] Crear mapeo: selector-test → selector-real
- [ ] Actualizar `panel-funcionario-responsive.spec.ts`
- [ ] Verificar con `npx playwright test panel-funcionario-responsive`

### Fase 2B: Timing y Navegación
- [ ] Revisar helper `login()` en cada archivo
- [ ] Agregar waits explícitos donde sea necesario
- [ ] Usar `page.waitForLoadState('networkidle')` antes de interactuar

### Fase 2C: Datos de Prueba
- [ ] Verificar que tests usen fixtures API para crear datos
- [ ] Sincronizar nombres de usuarios en tests con `e2e.db`
- [ ] Agregar cleanup en `afterEach` si es necesario

### Fase 2D: Tests Específicos
- [ ] Arreglar `reportes-dependencia.spec.ts`
- [ ] Arreglar `funcionario-ver-reporte-completo.spec.ts`
- [ ] Arreglar `solicitud-cierre-vista-completa.spec.ts`
- [ ] Arreglar `admin-categories-*.spec.ts`

---

## 📊 Métricas Objetivo

| Fase | Pass Rate Esperado | Tests Pasando |
|------|-------------------|---------------|
| Fase 1 (Actual) | 64% | 185/290 |
| Fase 2A | 75% | ~218/290 |
| Fase 2B | 85% | ~246/290 |
| Fase 2C+D | 95%+ | ~275/290 |

---

## 🔧 Comandos Útiles

```powershell
# Ejecutar todos los tests
npm run test:e2e

# Solo tests de fixtures (rápido, 18s)
npx playwright test --config=config/playwright.config.ts flujo-completo-fixtures

# Tests específicos
npx playwright test --config=config/playwright.config.ts [nombre-archivo]

# Con debug visual
npx playwright test --config=config/playwright.config.ts [archivo] --headed --debug

# Ver reporte HTML
npx playwright show-report
```
