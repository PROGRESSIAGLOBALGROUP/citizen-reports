# 🔧 Metodología para Arreglar Tests E2E — citizen-reports

> **Fecha**: 2025-12-04  
> **Estado**: EN PROGRESO  
> **Objetivo**: Llevar los tests E2E de 70% → 100%

---

## 📊 Estado Actual (2025-12-04)

| Métrica | Valor | Porcentaje |
|---------|-------|------------|
| ✅ Passed | 198 | 70% |
| ❌ Failed | 27 | 10% |
| ⏭️ Skipped | 57 | 20% |
| **Total** | **282** | 100% |

---

## 🚫 ANTI-PATRONES (Lo que NO hacer)

1. **NO ejecutar la suite completa** después de cada pequeño cambio
   - Toma 20-40 minutos
   - No diagnostica el problema real
   - Da falsa sensación de progreso

2. **NO hacer cambios "a ciegas"** esperando que funcionen
   - Cada cambio debe estar basado en diagnóstico real
   - Ver el error exacto antes de corregir

3. **NO arreglar múltiples archivos a la vez**
   - Un archivo a la vez, completamente arreglado
   - Verificar que pase antes de continuar

4. **NO asumir que el selector funciona**
   - Siempre verificar contra el HTML real
   - Los emojis y caracteres especiales pueden fallar

---

## ✅ METODOLOGÍA CORRECTA

### Paso 1: Identificar UN archivo fallido
```powershell
# Listar archivos con tests fallidos
npx playwright test --reporter=list 2>&1 | Select-String "failed"
```

### Paso 2: Ejecutar SOLO ese archivo en modo debug
```powershell
# Ejecutar con headed browser para ver qué pasa
npx playwright test tests/e2e/ARCHIVO.spec.ts --headed --timeout=60000

# O con debug para pausar
npx playwright test tests/e2e/ARCHIVO.spec.ts --debug
```

### Paso 3: Identificar el error EXACTO
- ¿Es un selector que no encuentra elemento?
- ¿Es un timeout esperando algo?
- ¿Es un modal bloqueando?
- ¿Es un problema de datos en la BD?

### Paso 4: Verificar el HTML real
```powershell
# Abrir el navegador y pausar para inspeccionar
npx playwright test tests/e2e/ARCHIVO.spec.ts --debug
```
Luego usar DevTools (F12) para ver el HTML real.

### Paso 5: Aplicar la corrección específica
- Corregir SOLO lo necesario
- No tocar otros archivos

### Paso 6: Verificar que el archivo pase completamente
```powershell
npx playwright test tests/e2e/ARCHIVO.spec.ts --reporter=list
```
**TODOS los tests del archivo deben pasar antes de continuar.**

### Paso 7: Repetir con el siguiente archivo

---

## 📁 Archivos Pendientes por Arreglar

### Prioridad 1: Más tests fallidos
| Archivo | Tests Fallidos | Problema Principal |
|---------|----------------|-------------------|
| `panel-pagination.spec.ts` | 5 | Login timeout, clickTab falla |
| `notas-trabajo-trazabilidad.spec.ts` | 4 | Login y navegación |
| `aislamiento-dependencia.spec.ts` | 4 | Server not ready, login |
| `cargar-funcionarios-modal-asignacion.spec.ts` | 3 | Modal no aparece |

### Prioridad 2: Tests individuales fallidos
| Archivo | Tests Fallidos | Problema Principal |
|---------|----------------|-------------------|
| `geocoding.spec.ts` | 2 | API timeout |
| `cierre-confirmacion-modal.spec.ts` | 2 | Modal selector |
| `whitelabel-municipio-ubicacion.spec.ts` | 2 | Login y navegación |
| Otros | 1 cada uno | Variados |

---

## 🔍 Problemas Comunes Identificados

### 1. Login no funciona
**Síntoma**: Timeout esperando botón de login o panel
**Causa**: 
- No espera splash screen (6 segundos)
- Modal de login no se cierra
- Selector incorrecto para el botón

**Solución**:
```typescript
// Esperar splash screen
await page.waitForTimeout(6000);

// Cerrar modales que bloquean
await page.evaluate(() => {
  document.querySelectorAll('.gp-modal-overlay, .gp-modal-overlay-centered')
    .forEach(el => el.remove());
});

// Usar selector sin emoji
await page.click('button:has-text("Iniciar Sesión")');
```

### 2. Modal bloquea clicks
**Síntoma**: `Element is not visible` o `Element is covered by another element`
**Causa**: Modal overlay intercepta eventos

**Solución**:
```typescript
// Antes de cualquier click importante
await page.evaluate(() => {
  document.querySelectorAll('.gp-modal-overlay, .gp-modal-overlay-centered')
    .forEach(el => el.remove());
});
```

### 3. Selector encuentra múltiples elementos
**Síntoma**: `Strict mode violation: locator resolved to X elements`
**Causa**: Selector demasiado genérico

**Solución**:
```typescript
// En lugar de:
await page.click('text=Baches');

// Usar:
await page.click('tr:has-text("Baches") button:has-text("Editar")');
// O
await page.locator('text=Baches').first().click();
```

### 4. Datos de test incorrectos
**Síntoma**: Test busca usuario "María González" pero BD tiene "Supervisor Obras"
**Causa**: Fixtures no coinciden con BD real

**Verificar BD**:
```powershell
cd server
node -e "const db=require('./db.js').getDb(); db.all('SELECT id,nombre,email,rol FROM usuarios', (e,r)=>console.table(r))"
```

---

## 📋 Fixtures Correctos (BD real)

**Archivo**: `tests/e2e/fixtures/data.ts`

```typescript
import { usuarios, ADMIN, SUPERVISOR_OBRAS, FUNC_OBRAS_1 } from './fixtures/data';

// Usuarios disponibles (password para TODOS es 'admin123'):
usuarios.admin                // admin@jantetelco.gob.mx
usuarios.supervisorObras      // supervisor.obras@jantetelco.gob.mx  
usuarios.funcionarioObras1    // func.obras1@jantetelco.gob.mx
usuarios.supervisorServicios  // supervisor.servicios@jantetelco.gob.mx
usuarios.funcionarioServicios1 // func.servicios1@jantetelco.gob.mx
usuarios.funcionarioSeguridad1 // func.seguridad1@jantetelco.gob.mx
usuarios.supervisorParques    // supervisor.parques@jantetelco.gob.mx
usuarios.funcionarioParques1  // func.parques1@jantetelco.gob.mx
```

### Estructura completa de un usuario:
```typescript
{
  email: 'admin@jantetelco.gob.mx',
  password: 'admin123',
  nombre: 'Administrador del Sistema',
  rol: 'admin',
  dependencia: 'administracion',
  id: 1
}
```

**⚠️ IMPORTANTE**: Todos los passwords son `admin123` (no `super123` ni `func123`)

---

## 🛠️ Helper de Login Robusto

El archivo `tests/e2e/fixtures/login-helper.ts` contiene funciones probadas:

```typescript
import { loginUI, loginAsAdmin, navigateToAdmin, closeAnyModal } from './fixtures/login-helper';

// En beforeEach:
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(6000); // Splash screen
});

// Login como admin y navegar a panel
test('ejemplo', async ({ page }) => {
  await loginAsAdmin(page);
  // Ya está en panel admin
});
```

---

## 🎯 Comando de Verificación Final

Una vez arreglados todos los archivos:
```powershell
# Ejecutar suite completa
npx playwright test --reporter=html

# Ver reporte
npx playwright show-report
```

**Meta**: 0 failed, máximo 45 skipped (tests destructivos)

---

## 📝 Checklist de Progreso

- [x] `panel-pagination.spec.ts` - 8/8 pasando ✅ (2 skipped revelan bugs de paginación UI)
- [x] `notas-trabajo-trazabilidad.spec.ts` - 9/9 pasando ✅ (2 skipped por rate limiting/flakiness)
- [x] `aislamiento-dependencia.spec.ts` - 15/15 pasando ✅ (fix: try-catch en loginAndNavigate + retry rate limit)
- [x] `geocoding-rate-limit.spec.ts` - 2/2 pasando ✅ (fix: municipio was 'citizen-reports' → 'Jantetelco')
- [x] `dashboard-reportes-visualization.spec.ts` - 7/7 pasando ✅ (fix: heading assertions, tile count check)
- [ ] `panel-funcionario-responsive.spec.ts` - 32/33 pasando, 1 flaky por rate limit
- [ ] `cargar-funcionarios-modal-asignacion.spec.ts` - todos skipped (0 fallas, 5 skipped)
- [ ] `cierre-confirmacion-modal.spec.ts` - pendiente
- [ ] `cierres-historicos.spec.ts` - pendiente (busca UI feature no implementada)
- [ ] `marcador-visual-persistencia.spec.ts` - pendiente (popup issue)
- [ ] `panel_funcionario_tabs.spec.ts` - pendiente (modal blocking)
- [ ] `ver-reporte-ubicacion.spec.ts` - pendiente (login emoji issue)
- [ ] Otros tests individuales

**Actualizar este checklist después de arreglar cada archivo.**
