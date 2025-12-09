/**
 * PLANTILLA DE TEST E2E CORRECTAMENTE ESTRUCTURADO
 * 
 * Este archivo sirve como referencia para la IA al arreglar tests.
 * Muestra los patrones correctos de:
 * - Imports
 * - Setup/Teardown
 * - Login
 * - Navegación
 * - Selectores
 * - Assertions
 */

import { test, expect } from '@playwright/test';
import { usuarios, ADMIN, SUPERVISOR_OBRAS } from './data';
import { loginUI, loginAsAdmin, navigateToAdmin, closeAnyModal } from './login-helper';

// ============================================================================
// CONFIGURACIÓN DEL TEST
// ============================================================================

test.describe('Ejemplo de Test E2E Bien Estructurado', () => {
  
  // -------------------------------------------------------------------------
  // BEFORE EACH: Setup común para todos los tests
  // -------------------------------------------------------------------------
  test.beforeEach(async ({ page }) => {
    // 1. Navegar a la app
    await page.goto('/');
    
    // 2. CRÍTICO: Esperar el splash screen (6 segundos)
    await page.waitForTimeout(6000);
    
    // 3. Opcional: Cerrar modales que puedan estar abiertos
    await closeAnyModal(page);
  });

  // -------------------------------------------------------------------------
  // TEST: Login como Admin
  // -------------------------------------------------------------------------
  test('Admin puede acceder al panel de administración', async ({ page }) => {
    // Usar el helper de login (ya maneja splash, modales, etc.)
    await loginAsAdmin(page);
    
    // Verificar que estamos en el panel admin
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
    // O verificar tabs del admin
    await expect(page.locator('button:has-text("Usuarios")')).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // TEST: Login como Supervisor
  // -------------------------------------------------------------------------
  test('Supervisor puede ver reportes de su dependencia', async ({ page }) => {
    // Login usando el helper genérico
    await loginUI(page, SUPERVISOR_OBRAS.email, SUPERVISOR_OBRAS.password);
    
    // Navegar al panel (el login ya debería llevarnos ahí)
    // Verificar título del panel de supervisor
    await expect(page.locator('text=Mi Panel de Supervisión')).toBeVisible({ timeout: 10000 });
  });

  // -------------------------------------------------------------------------
  // TEST: Navegación a tab específico
  // -------------------------------------------------------------------------
  test('Admin puede navegar a la pestaña de Categorías', async ({ page }) => {
    // Login
    await loginAsAdmin(page);
    
    // Cerrar cualquier modal antes de hacer click
    await closeAnyModal(page);
    
    // Click en tab de Categorías
    // IMPORTANTE: Usar selector específico para evitar ambigüedad
    await page.click('button.gp-tab:has-text("Categorías")');
    
    // Verificar que estamos en la sección correcta
    await expect(page.locator('h2:has-text("Gestión de Categorías")')).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // TEST: Interacción con formulario
  // -------------------------------------------------------------------------
  test('Admin puede crear una nueva categoría', async ({ page }) => {
    await loginAsAdmin(page);
    await closeAnyModal(page);
    
    // Navegar a categorías
    await page.click('button.gp-tab:has-text("Categorías")');
    await page.waitForTimeout(500); // Esperar animación de tab
    
    // Click en botón de nueva categoría
    await page.click('button:has-text("Nueva Categoría")');
    
    // Esperar modal
    await expect(page.locator('.gp-modal-overlay-centered')).toBeVisible();
    
    // Llenar formulario
    await page.fill('input[name="nombre"]', 'Categoría de Prueba');
    
    // Submit
    await page.click('button:has-text("Guardar")');
    
    // Verificar éxito
    await expect(page.locator('text=Categoría de Prueba')).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // TEST: Verificación de elementos en tabla
  // -------------------------------------------------------------------------
  test('La tabla de usuarios muestra datos correctos', async ({ page }) => {
    await loginAsAdmin(page);
    await closeAnyModal(page);
    
    // Navegar a usuarios
    await page.click('button.gp-tab:has-text("Usuarios")');
    
    // Verificar que la tabla tiene headers correctos
    await expect(page.locator('th:has-text("Email")')).toBeVisible();
    await expect(page.locator('th:has-text("Rol")')).toBeVisible();
    
    // Verificar que el admin aparece en la tabla
    // IMPORTANTE: Usar selector específico para evitar múltiples matches
    await expect(page.locator(`td:has-text("${ADMIN.email}")`)).toBeVisible();
  });

});

// ============================================================================
// PATRONES COMUNES QUE DEBEN EVITARSE
// ============================================================================

/*
❌ INCORRECTO - No esperar splash screen:
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // Falta: await page.waitForTimeout(6000);
});

❌ INCORRECTO - Selector con emoji que puede fallar:
await page.click('button:has-text("🔐 Iniciar Sesión")');
// CORRECTO:
await page.click('button:has-text("Iniciar Sesión")');

❌ INCORRECTO - Selector demasiado genérico:
await page.click('text=Editar');
// CORRECTO (más específico):
await page.click('tr:has-text("admin@jantetelco.gob.mx") button:has-text("Editar")');

❌ INCORRECTO - No cerrar modales antes de clicks:
await page.click('button.gp-tab:has-text("Categorías")');
// CORRECTO:
await closeAnyModal(page);
await page.click('button.gp-tab:has-text("Categorías")');

❌ INCORRECTO - Hardcoded passwords incorrectos:
const password = 'super123';
// CORRECTO (usar fixtures):
import { SUPERVISOR_OBRAS } from './data';
const password = SUPERVISOR_OBRAS.password; // 'admin123'

❌ INCORRECTO - Login duplicado:
test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page); // Login aquí
});
test('algo', async ({ page }) => {
  await loginAsAdmin(page); // ¡Duplicado! Ya está logueado
});
*/
