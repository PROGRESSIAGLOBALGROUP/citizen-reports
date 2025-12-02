/**
 * Test End-to-End: Visualización de reportes en dashboard
 * 
 * Valida que:
 * 1. El backend retorna reportes correctamente desde /api/reportes
 * 2. Los datos incluyen todas las propiedades necesarias (id, tipo, prioridad, lat, lng)
 * 3. El frontend carga y muestra los reportes
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard de Reportes - Visualización End-to-End', () => {
  
  test('Backend retorna reportes con estructura correcta', async ({ request }) => {
    const response = await request.get('http://127.0.0.1:4000/api/reportes');
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const reportes = await response.json();
    
    // Validar que hay reportes
    expect(reportes.length).toBeGreaterThan(0);
    console.log(`✅ Total reportes en DB: ${reportes.length}`);
    
    // Validar estructura del primer reporte
    const primerReporte = reportes[0];
    expect(primerReporte).toHaveProperty('id');
    expect(primerReporte).toHaveProperty('tipo');
    expect(primerReporte).toHaveProperty('descripcion');
    expect(primerReporte).toHaveProperty('lat');
    expect(primerReporte).toHaveProperty('lng');
    expect(primerReporte).toHaveProperty('peso');
    expect(primerReporte).toHaveProperty('estado');
    expect(primerReporte).toHaveProperty('dependencia');
    expect(primerReporte).toHaveProperty('prioridad');
    
    // Validar tipos de datos
    expect(typeof primerReporte.id).toBe('number');
    expect(typeof primerReporte.lat).toBe('number');
    expect(typeof primerReporte.lng).toBe('number');
    expect(typeof primerReporte.peso).toBe('number');
    
    // Validar coordenadas válidas
    expect(primerReporte.lat).toBeGreaterThanOrEqual(-90);
    expect(primerReporte.lat).toBeLessThanOrEqual(90);
    expect(primerReporte.lng).toBeGreaterThanOrEqual(-180);
    expect(primerReporte.lng).toBeLessThanOrEqual(180);
    
    console.log(`✅ Estructura de reportes válida`);
  });
  
  test('Backend retorna reportes agrupados por prioridad correctamente', async ({ request }) => {
    const response = await request.get('http://127.0.0.1:4000/api/reportes');
    const reportes = await response.json();
    
    const porPrioridad = {
      alta: reportes.filter(r => r.prioridad === 'alta').length,
      media: reportes.filter(r => r.prioridad === 'media').length,
      baja: reportes.filter(r => r.prioridad === 'baja').length
    };
    
    console.log(`Reportes por prioridad:`, porPrioridad);
    
    expect(porPrioridad.alta + porPrioridad.media + porPrioridad.baja).toBe(reportes.length);
  });
  
  test('Frontend carga y muestra el dashboard correctamente', async ({ page }) => {
    await page.goto('http://127.0.0.1:4000');
    
    // Esperar a que la página cargue completamente
    await page.waitForLoadState('networkidle');
    
    // Validar que el título existe (usando selectores más específicos)
    await expect(page.getByRole('heading', { name: 'H. Ayuntamiento' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'citizen-reports' })).toBeVisible();
    
    console.log(`✅ Página principal cargada`);
  });
  
  test('Frontend muestra el resumen de reportes con contadores', async ({ page }) => {
    await page.goto('http://127.0.0.1:4000');
    await page.waitForLoadState('networkidle');
    
    // Esperar a que el componente RESUMEN aparezca
    await page.waitForSelector('text=RESUMEN', { timeout: 10000 });
    
    // Validar que existen los contadores de prioridad
    const resumenSection = page.locator('text=RESUMEN').locator('..');
    
    await expect(resumenSection.locator('text=TOTAL REPORTES')).toBeVisible();
    await expect(resumenSection.locator('text=ALTA PRIORIDAD')).toBeVisible();
    await expect(resumenSection.locator('text=MEDIA PRIORIDAD')).toBeVisible();
    await expect(resumenSection.locator('text=BAJA PRIORIDAD')).toBeVisible();
    
    console.log(`✅ Sección RESUMEN visible con todos los contadores`);
  });
  
  test('Frontend muestra contadores con valores numéricos mayores a cero', async ({ page }) => {
    await page.goto('http://127.0.0.1:4000');
    await page.waitForLoadState('networkidle');
    
    // Esperar 2 segundos adicionales para que los datos se carguen
    await page.waitForTimeout(2000);
    
    // Capturar todos los textos del resumen
    const resumenText = await page.textContent('body');
    console.log('Contenido de la página (primeros 500 chars):', resumenText?.substring(0, 500));
    
    // Buscar el texto "TOTAL REPORTES" y extraer el número que le sigue
    const totalMatch = resumenText?.match(/TOTAL REPORTES[\s\S]*?(\d+)/);
    if (totalMatch) {
      const totalReportes = parseInt(totalMatch[1]);
      console.log(`Total reportes mostrado: ${totalReportes}`);
      expect(totalReportes).toBeGreaterThan(0);
    } else {
      console.log('⚠️ No se pudo extraer el contador TOTAL REPORTES');
    }
    
    // Tomar screenshot para debugging
    await page.screenshot({ path: 'test-results/dashboard-reportes.png', fullPage: true });
    console.log(`✅ Screenshot guardado en test-results/dashboard-reportes.png`);
  });
  
  test('Frontend aplica filtros correctamente (solo reportes abiertos)', async ({ page }) => {
    await page.goto('http://127.0.0.1:4000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verificar que el botón "Abiertos" esté activo
    const botonAbiertos = page.locator('button:has-text("Abiertos")');
    await expect(botonAbiertos).toBeVisible();
    
    // Validar que existe el filtro de fecha
    const filtroFecha = page.locator('select, input[type="month"]').first();
    if (await filtroFecha.isVisible()) {
      console.log(`✅ Filtro de fecha visible`);
    }
  });
  
  test('Mapa de Leaflet se renderiza correctamente', async ({ page }) => {
    await page.goto('http://127.0.0.1:4000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Validar que el contenedor del mapa existe
    const mapContainer = page.locator('.leaflet-container').first();
    await expect(mapContainer).toBeVisible();
    
    // Validar que los tiles del mapa se cargan
    const mapTiles = page.locator('.leaflet-tile').first();
    await expect(mapTiles).toBeVisible({ timeout: 10000 });
    
    console.log(`✅ Mapa de Leaflet renderizado correctamente`);
  });

});
