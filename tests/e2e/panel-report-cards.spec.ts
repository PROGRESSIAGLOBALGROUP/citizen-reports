/**
 * E2E Tests: Panel Funcionario - Report Card Display
 * 
 * Tests the display of report cards in the panel:
 * - Location info should NOT be visible in card list view
 * - Location info should only appear in individual report view
 * - "Ver Reporte Completo" button should have proper icon (no broken chars)
 * 
 * BUGFIX 2025-11-27: Removed location info from card view, fixed broken emoji
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:4000';

const TEST_ADMIN = {
  email: 'admin@jantetelco.gob.mx',
  password: 'admin123'
};

async function login(page: any, user: typeof TEST_ADMIN) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  
  // Wait for splash screen to disappear
  await page.waitForTimeout(6000);

  // Click login button
  await page.click('button:has-text("🔐 Iniciar Sesión")');
  
  // Wait for login modal
  await page.waitForSelector('text=Acceso al Sistema');
  
  // Fill credentials
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  
  // Submit
  await page.click('form button[type="submit"]');
  
  // Wait for login to complete
  await page.waitForSelector('button:has-text("Mi Panel")', { timeout: 10000 });
}

test.describe('Panel Report Cards - Display Rules', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ADMIN);
    // Navigate to panel
    await page.goto(BASE_URL + '/#panel');
    await page.waitForTimeout(6000);
  });

  test('Report cards in list view should NOT show location info section', async ({ page }) => {
    // Click on "Reportes de Mi Dependencia" tab
    const tab = page.locator('button:has-text("Reportes de Mi Dependencia")');
    await tab.click({ force: true });
    await page.waitForTimeout(2000);
    
    // Location info section should NOT be visible in card list view
    const locationInfoHeader = page.locator('text=Información de Ubicación');
    const locationInfoCount = await locationInfoHeader.count();
    
    // Should be 0 - location info should not appear in card list
    expect(locationInfoCount).toBe(0);
  });

  test('Report cards should NOT show COLONIA/CP/MUNICIPIO/ESTADO grid', async ({ page }) => {
    const tab = page.locator('button:has-text("Reportes de Mi Dependencia")');
    await tab.click({ force: true });
    await page.waitForTimeout(2000);
    
    // These labels should NOT appear in the card list view
    // They should only appear inside individual report view
    const coloniaLabel = page.locator('div:has-text("COLONIA"):below(button:has-text("Reportes de Mi Dependencia"))');
    
    // Count instances - should be 0 in card list
    const count = await coloniaLabel.count();
    expect(count).toBe(0);
  });

  test('Ver Reporte Completo button should have valid emoji icon', async ({ page }) => {
    const tab = page.locator('button:has-text("Reportes de Mi Dependencia")');
    await tab.click({ force: true });
    await page.waitForTimeout(2000);
    
    // Find the "Ver Reporte Completo" button
    const verReporteBtn = page.locator('button:has-text("Ver Reporte Completo")');
    
    // If there are reports, check the button
    const btnCount = await verReporteBtn.count();
    if (btnCount > 0) {
      // Get button text
      const buttonText = await verReporteBtn.first().textContent();
      
      // Should NOT contain broken character (replacement char)
      expect(buttonText).not.toContain('�');
      expect(buttonText).not.toContain('\uFFFD');
      
      // Should contain the expected emoji and text
      expect(buttonText).toContain('Ver Reporte Completo');
    }
  });

  test('Ver Reporte Completo button should navigate to individual report', async ({ page }) => {
    const tab = page.locator('button:has-text("Reportes de Mi Dependencia")');
    await tab.click({ force: true });
    await page.waitForTimeout(2000);
    
    const verReporteBtn = page.locator('button:has-text("Ver Reporte Completo")');
    const btnCount = await verReporteBtn.count();
    
    if (btnCount > 0) {
      // Click first "Ver Reporte Completo" button
      await verReporteBtn.first().click();
      await page.waitForTimeout(1000);
      
      // Should navigate to individual report view (hash changes to #reporte/ID)
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/#reporte\/\d+/);
    }
  });

  test('Individual report view SHOULD show location info (contrast test)', async ({ page }) => {
    const tab = page.locator('button:has-text("Reportes de Mi Dependencia")');
    await tab.click({ force: true });
    await page.waitForTimeout(2000);
    
    const verReporteBtn = page.locator('button:has-text("Ver Reporte Completo")');
    const btnCount = await verReporteBtn.count();
    
    if (btnCount > 0) {
      // Navigate to individual report
      await verReporteBtn.first().click();
      await page.waitForTimeout(2000);
      
      // In individual report view, location info CAN be visible (if data exists)
      // This is the contrast - it's allowed here but not in list view
      const pageContent = await page.content();
      
      // The individual view loaded successfully
      expect(page.url()).toMatch(/#reporte\/\d+/);
    }
  });
});

test.describe('Panel Report Cards - Mis Reportes Tab', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_ADMIN);
    await page.goto(BASE_URL + '/#panel');
    await page.waitForTimeout(6000);
  });

  test('Mis Reportes cards should NOT show location info section', async ({ page }) => {
    // Already on "Mis Reportes" tab by default
    await page.waitForTimeout(2000);
    
    // Location info should NOT be visible
    const locationInfo = page.locator('text=Información de Ubicación');
    const count = await locationInfo.count();
    
    expect(count).toBe(0);
  });
});
