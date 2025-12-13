import { test, expect } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:4000';
const API_URL = 'http://127.0.0.1:4000';

const TEST_SUPERVISOR = {
  email: 'supervisor.obras@jantetelco.gob.mx',
  password: 'admin123',
  nombre: 'Supervisor Obras Públicas',
  rol: 'supervisor',
  dependencia: 'obras_publicas'
};

test.describe('Historial de Cierres y Filtros', () => {
  
  test('Debe mostrar filtros y paginación en tab Cierres Pendientes', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    page.on('pageerror', err => console.log(`BROWSER ERROR: ${err.message}`));

    console.log('Navigating to login...');
    // Login
    await page.goto(BASE_URL);
    await page.click('button:has-text("🔐 Iniciar Sesión")');
    await page.fill('input[type="email"]', TEST_SUPERVISOR.email);
    await page.fill('input[type="password"]', TEST_SUPERVISOR.password);
    await page.locator('button[type="submit"]').click();
    console.log('Login submitted, waiting for dashboard...');
    
    // Wait for URL to change to #panel
    await page.waitForURL('**/#panel', { timeout: 10000 });
    console.log('URL changed to #panel');

    // Wait for any indication of success first
    await page.waitForLoadState('networkidle');
    
    // Try a more partial match or different selector if the full name fails due to encoding
    await page.waitForSelector(`text=Supervisor`, { timeout: 10000 });
    console.log('Dashboard loaded.');

    // Ir al panel
    await page.click('button:has-text("Mi Panel")');
    
    // Ir a tab Cierres Pendientes
    await page.click('button:has-text("Cierres Pendientes de Aprobación")');
    
    // Verificar filtros (que aún no existen)
    await page.waitForSelector('select[name="filtro-estado"]', { timeout: 10000 });
    await expect(page.locator('select[name="filtro-estado"]')).toBeVisible();
    await expect(page.locator('input[name="fecha-inicio"]')).toBeVisible();
    await expect(page.locator('input[name="fecha-fin"]')).toBeVisible();
    
    // Verificar paginación
    await expect(page.locator('button:has-text("Anterior")')).toBeVisible();
    await expect(page.locator('button:has-text("Siguiente")')).toBeVisible();
  });
});
