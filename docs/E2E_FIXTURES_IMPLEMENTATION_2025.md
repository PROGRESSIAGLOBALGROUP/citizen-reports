# E2E Test Fixtures System & Test Fixes

**Fecha:** 2025-12-01  
**Estado:** ✅ Fase 1 Completa | ⏳ Fase 2 Pendiente  
**Objetivo:** Crear sistema de fixtures E2E y corregir tests fallidos

## 📚 Documentos Relacionados

| Documento | Propósito |
|-----------|-----------|
| **[E2E_TESTS_PENDING_WORK.md](E2E_TESTS_PENDING_WORK.md)** | Trabajo pendiente detallado |
| **[../prompts/E2E_CONTINUE_WORK_PROMPT.md](../prompts/E2E_CONTINUE_WORK_PROMPT.md)** | Prompt para IA para continuar |

---

## 📊 Resumen de Resultados

| Métrica | Inicio | Actual | Cambio |
|---------|--------|--------|--------|
| Tests Pasando | 101 | **185** | +84 (+83%) |
| Tests Fallando | 172 | ~105 | -67 (-39%) |
| Total Tests | ~273 | ~290 | +17 |
| Pass Rate | 37% | **64%** | +27pp |
| Fixtures Tests | 0 | **10/10** | ✅ Completo |

---

## ✅ Cambios Realizados

### 1. Sistema de Fixtures (NUEVO)

**Archivos creados:**
- `tests/e2e/fixtures/data.ts` - Datos de usuarios y reportes sincronizados con e2e.db
- `tests/e2e/fixtures/helpers.ts` - Funciones de login, navegación y creación de datos
- `tests/e2e/fixtures/index.ts` - Exportaciones centralizadas
- `tests/e2e/flujo-completo-fixtures.spec.ts` - 10 tests de demostración

**Características:**
- 8 usuarios de test (admin, 2 supervisores, 5 funcionarios)
- Helpers de autenticación: loginAPI(), loginUI(), setAuthToken()
- Helpers de datos: crearReporteAPI(), asignarFuncionarioAPI(), agregarNotaAPI()
- Helpers de navegación: goToMap(), goToPanel(), goToReportForm()
- Todos usan URLs absolutas (http://127.0.0.1:4000)

### 2. Correcciones de Backend

**`server/security.js`:**
```javascript
// Rate limiter bypass para tests
if (process.env.NODE_ENV === 'test') return next();

// Eventos de seguridad sin usuario usan null (no 0)
usuario_id: null
```

**`server/schema.sql`:**
```sql
-- Password hash corregido (bcrypt válido)
'$2b$10$6N0BqeczPx2ORCzgEZrcaey7oSPQsFMPF2/It/0EjasxA56msOcxG'

-- historial_cambios.usuario_id ahora NULLABLE
usuario_id INTEGER,  -- Era NOT NULL, causaba FOREIGN KEY constraint
```

### 3. Correcciones de Configuración

**`config/playwright.config.ts`:**
```typescript
// DB_PATH corregido
DB_PATH: 'server/e2e.db',  // Era './e2e.db' (ruta incorrecta)
```

### 4. Correcciones de Selectores

| Selector Incorrecto | Selector Correcto | Archivos Afectados |
|---------------------|-------------------|-------------------|
| `localhost:5173` | `127.0.0.1:4000` | Todos |
| `localhost:4000` | `127.0.0.1:4000` | Todos |
| `.status()` | `.status` | Varios |
| `text=Inicia Sesión` | `text=Acceso al Sistema` | 20+ archivos |
| `button:has-text("Entrar")` | `button[type="submit"]:has-text("Iniciar Sesión")` | 3 archivos |
| `button:has-text("Iniciar Sesión")` (TopBar) | `button:has-text("🔐 Iniciar Sesión")` | 3 archivos |
| `text=Panel de Funcionario` | `text=Mi Panel de Reportes` | Varios |
| `📋 Mis Reportes Asignados` | `Mis Reportes` | Varios |
| `.panel-funcionario` | `.gp-container` | 1 archivo |
| `Juan Pérez` | `Juan Pérez - Obras` | 1 archivo |

### 5. Renombre de Tests Destructivos

Tests que resetean la BD renombrados con prefijo `z-` para ejecutarse al final:
- `z-admin-database-maintenance.spec.ts`
- `z-admin-database-maintenance-simple.spec.ts`
- `z-admin-panel-database-ui.spec.ts`

---

## 🔧 Tests Restantes por Corregir

Los ~109 tests que aún fallan principalmente tienen:

1. **Selectores CSS obsoletos** que no existen en la UI actual:
   - `.panel-filters-clear`
   - `.report-card-header`
   - Otros selectores de clases premium

2. **Flujos de navegación desactualizados** después de crear reportes vía API

3. **Esperas insuficientes** para elementos que cargan dinámicamente

---

## 📋 Cómo Usar los Fixtures

```typescript
import { TEST_USERS, loginAPI, crearReporteAPI } from './fixtures';

test('ejemplo con fixtures', async ({ page, request }) => {
  // Login vía API (rápido, sin UI)
  const auth = await loginAPI(request, TEST_USERS.funcionario);
  
  // Crear reporte programáticamente
  const reporte = await crearReporteAPI(request, auth.token, {
    tipo: 'bache',
    descripcion: 'Test',
    lat: 18.8,
    lng: -99.3
  });
  
  // Ahora hacer tests de UI con datos listos
  await page.goto(`http://127.0.0.1:4000/#reporte/${reporte.id}`);
  // ...
});
```

---

## 🚀 Comandos de Ejecución

```powershell
# Solo tests de fixtures (rápidos, ~17s)
npm run test:e2e -- --grep "fixtures"

# Todos los tests E2E
npm run test:e2e

# Tests específicos
npm run test:e2e -- funcionario-ver-reporte
```

---

## 📝 Próximos Pasos

1. **Actualizar selectores restantes** en archivos con muchos fallos:
   - `panel-funcionario-responsive.spec.ts` (33 tests)
   - `reportes-dependencia.spec.ts` (11 tests)
   
2. **Migrar tests existentes a usar fixtures** para mayor estabilidad

3. **Agregar data-testid** a componentes UI para selectores más estables
