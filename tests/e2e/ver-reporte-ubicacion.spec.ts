/**
 * E2E Tests: VerReporte - Información Administrativa
 * 
 * Tests that the individual report view displays location data from the database:
 * - PAÍS, ESTADO, MUNICIPIO, COLONIA, CÓDIGO POSTAL fields
 * - Data should come from the API, not be hardcoded
 * 
 * BUGFIX 2025-11-27: SQL query was missing location fields (colonia, codigo_postal, 
 * municipio, estado_ubicacion, pais) in GET /api/reportes/:id endpoint
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
  await page.click('button[type="submit"]:has-text("Iniciar Sesión")');
  
  // Wait for login to complete
  await page.waitForSelector('button:has-text("Mi Panel")', { timeout: 10000 });
}

test.describe('VerReporte - Información Administrativa', () => {

  test('API /api/reportes/:id returns location fields', async ({ request }) => {
    // First, find a report with location data
    const reportesRes = await request.get(`${BASE_URL}/api/reportes`);
    expect(reportesRes.ok()).toBe(true);
    
    const reportes = await reportesRes.json();
    expect(reportes.length).toBeGreaterThan(0);
    
    // Find a report with location data
    const reporteConUbicacion = reportes.find((r: any) => 
      r.municipio || r.estado_ubicacion || r.codigo_postal
    );
    
    if (reporteConUbicacion) {
      // Fetch individual report
      const detalleRes = await request.get(`${BASE_URL}/api/reportes/${reporteConUbicacion.id}`);
      expect(detalleRes.ok()).toBe(true);
      
      const detalle = await detalleRes.json();
      
      // Verify location fields are present in response
      expect(detalle).toHaveProperty('colonia');
      expect(detalle).toHaveProperty('codigo_postal');
      expect(detalle).toHaveProperty('municipio');
      expect(detalle).toHaveProperty('estado_ubicacion');
      expect(detalle).toHaveProperty('pais');
      
      // Verify actual values match
      if (reporteConUbicacion.municipio) {
        expect(detalle.municipio).toBe(reporteConUbicacion.municipio);
      }
      if (reporteConUbicacion.estado_ubicacion) {
        expect(detalle.estado_ubicacion).toBe(reporteConUbicacion.estado_ubicacion);
      }
    }
  });

  test('Individual report view shows Información Administrativa section', async ({ page }) => {
    await login(page, TEST_ADMIN);
    
    // Navigate to panel and find a report
    await page.goto(BASE_URL + '/#panel');
    await page.waitForTimeout(6000);
    
    // Click on "Reportes de Mi Dependencia" tab
    const tab = page.locator('button:has-text("Reportes de Mi Dependencia")');
    await tab.click({ force: true });
    await page.waitForTimeout(2000);
    
    // Click "Ver Reporte Completo" if there are reports
    const verReporteBtn = page.locator('button:has-text("Ver Reporte Completo")');
    const btnCount = await verReporteBtn.count();
    
    if (btnCount > 0) {
      await verReporteBtn.first().click();
      await page.waitForTimeout(2000);
      
      // Verify we're in individual report view
      expect(page.url()).toMatch(/#reporte\/\d+/);
      
      // Verify "Información Administrativa" section exists
      const adminSection = page.locator('text=Información Administrativa');
      await expect(adminSection).toBeVisible({ timeout: 10000 });
    }
  });

  test('Información Administrativa shows PAÍS field with value', async ({ page }) => {
    await login(page, TEST_ADMIN);
    
    // Navigate directly to a report that has location data
    // First get a report ID via API
    const response = await page.request.get(`${BASE_URL}/api/reportes`);
    const reportes = await response.json();
    
    const reporteConUbicacion = reportes.find((r: any) => r.municipio || r.estado_ubicacion);
    
    if (reporteConUbicacion) {
      await page.goto(`${BASE_URL}/#reporte/${reporteConUbicacion.id}`);
      await page.waitForTimeout(3000);
      
      // Check for PAÍS label and value
      const paisLabel = page.locator('text=País');
      await expect(paisLabel).toBeVisible({ timeout: 10000 });
      
      // País should default to México
      const mexicoValue = page.locator('text=México');
      await expect(mexicoValue).toBeVisible();
    }
  });

  test('Información Administrativa shows real MUNICIPIO value from database', async ({ page }) => {
    await login(page, TEST_ADMIN);
    
    // Get a report with municipio data
    const response = await page.request.get(`${BASE_URL}/api/reportes`);
    const reportes = await response.json();
    
    const reporteConMunicipio = reportes.find((r: any) => r.municipio && r.municipio !== '—');
    
    if (reporteConMunicipio) {
      await page.goto(`${BASE_URL}/#reporte/${reporteConMunicipio.id}`);
      await page.waitForTimeout(5000);
      
      // Wait for Información Administrativa section to load
      const adminSection = page.locator('text=Información Administrativa');
      await expect(adminSection).toBeVisible({ timeout: 15000 });
      
      // The actual municipio value should appear somewhere in the page
      const pageContent = await page.content();
      expect(pageContent).toContain(reporteConMunicipio.municipio);
    }
  });

  test('Información Administrativa shows real ESTADO value from database', async ({ page }) => {
    await login(page, TEST_ADMIN);
    
    // Get a report with estado_ubicacion data
    const response = await page.request.get(`${BASE_URL}/api/reportes`);
    const reportes = await response.json();
    
    const reporteConEstado = reportes.find((r: any) => r.estado_ubicacion && r.estado_ubicacion !== '—');
    
    if (reporteConEstado) {
      await page.goto(`${BASE_URL}/#reporte/${reporteConEstado.id}`);
      await page.waitForTimeout(5000);
      
      // Wait for Información Administrativa section to load
      const adminSection = page.locator('text=Información Administrativa');
      await expect(adminSection).toBeVisible({ timeout: 15000 });
      
      // The actual estado value should appear somewhere in the page content
      const pageContent = await page.content();
      expect(pageContent).toContain(reporteConEstado.estado_ubicacion);
    }
  });

  test('Información Administrativa shows CÓDIGO POSTAL when available', async ({ page }) => {
    await login(page, TEST_ADMIN);
    
    // Get a report with codigo_postal
    const response = await page.request.get(`${BASE_URL}/api/reportes`);
    const reportes = await response.json();
    
    const reporteConCP = reportes.find((r: any) => r.codigo_postal && r.codigo_postal !== '—');
    
    if (reporteConCP) {
      await page.goto(`${BASE_URL}/#reporte/${reporteConCP.id}`);
      await page.waitForTimeout(3000);
      
      // CP or CÓDIGO POSTAL label should be visible
      const cpLabel = page.locator('text=/C[óo]digo Postal/i');
      await expect(cpLabel).toBeVisible({ timeout: 10000 });
      
      // The actual CP value should appear
      const cpValue = page.locator(`text=${reporteConCP.codigo_postal}`);
      await expect(cpValue).toBeVisible();
    }
  });
});

test.describe('Backend API - Location Fields', () => {
  
  test('GET /api/reportes/:id includes all location fields in response', async ({ request }) => {
    // Get list of reports
    const listRes = await request.get(`${BASE_URL}/api/reportes`);
    const reportes = await listRes.json();
    
    if (reportes.length > 0) {
      const firstId = reportes[0].id;
      
      // Get individual report
      const detailRes = await request.get(`${BASE_URL}/api/reportes/${firstId}`);
      expect(detailRes.ok()).toBe(true);
      
      const detail = await detailRes.json();
      
      // All location fields should be present (even if null)
      expect('colonia' in detail).toBe(true);
      expect('codigo_postal' in detail).toBe(true);
      expect('municipio' in detail).toBe(true);
      expect('estado_ubicacion' in detail).toBe(true);
      expect('pais' in detail).toBe(true);
    }
  });

  test('Location fields contain actual database values, not defaults', async ({ request }) => {
    // Find a report that has location data populated
    const listRes = await request.get(`${BASE_URL}/api/reportes`);
    const reportes = await listRes.json();
    
    // Find one with actual location data
    const withLocation = reportes.find((r: any) => 
      r.municipio || r.estado_ubicacion || r.codigo_postal
    );
    
    if (withLocation) {
      const detailRes = await request.get(`${BASE_URL}/api/reportes/${withLocation.id}`);
      const detail = await detailRes.json();
      
      // Values should match between list and detail views
      expect(detail.municipio).toBe(withLocation.municipio);
      expect(detail.estado_ubicacion).toBe(withLocation.estado_ubicacion);
      expect(detail.codigo_postal).toBe(withLocation.codigo_postal);
    }
  });
});
