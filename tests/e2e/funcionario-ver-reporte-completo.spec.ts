/**
 * Test End-to-End: Funcionario - Ver Reporte Completo
 * 
 * Valida que:
 * 1. El funcionario puede hacer login exitosamente
 * 2. Accede al Mi Panel de Reportes y ve sus reportes asignados
 * 3. Puede hacer click en "Ver Reporte Completo" 
 * 4. Navega correctamente a la vista detallada del reporte (#reporte/:id)
 * 5. La vista muestra toda la información completa del reporte
 * 6. El mapa de ubicación se renderiza correctamente
 * 7. El funcionario puede regresar al panel
 * 
 * Test Fixture Data:
 * - Usuario: func.obras1@jantetelco.gob.mx / admin123
 * - Rol: funcionario
 * - Departamento: obras_publicas
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:4000';
const API_URL = 'http://127.0.0.1:4000';

// Credenciales de test (deben existir en seed data)
const TEST_FUNCIONARIO = {
  email: 'func.obras1@jantetelco.gob.mx',
  password: 'admin123',
  nombre: 'Juan Pérez - Obras',  // Debe coincidir exactamente con e2e.db
  rol: 'funcionario',
  dependencia: 'obras_publicas'
};

test.describe('Funcionario - Ver Reporte Completo', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navegar a la aplicación
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('Funcionario hace login y accede al panel exitosamente', async ({ page }) => {
    // Click en botón "Iniciar Sesión"
    await page.click('button:has-text("🔐 Iniciar Sesión")'); // Esperar modal de login
    await page.waitForSelector('text=Acceso al Sistema', { timeout: 5000 });
    
    // Llenar formulario
    await page.fill('input[type="email"]', TEST_FUNCIONARIO.email);
    await page.fill('input[type="password"]', TEST_FUNCIONARIO.password);
    
    // Hacer login
    await page.click('button[type="submit"]:has-text("Iniciar Sesión")');
    
    // Esperar a que cierre el modal y se actualice el header
    await page.waitForSelector(`text=${TEST_FUNCIONARIO.nombre}`, { timeout: 10000 });
    
    console.log('✅ Login exitoso como funcionario');
    
    // Verificar que aparece el botón "Mi Panel"
    await expect(page.locator('button:has-text("Mi Panel")')).toBeVisible();
  });

  test('Funcionario navega a su panel y ve sus reportes asignados', async ({ page }) => {
    // Login
    await page.click('button:has-text("Iniciar Sesión")');
    await page.waitForSelector('text=Acceso al Sistema');
    await page.fill('input[type="email"]', TEST_FUNCIONARIO.email);
    await page.fill('input[type="password"]', TEST_FUNCIONARIO.password);
    await page.click('button[type="submit"]:has-text("Iniciar Sesión")');
    await page.waitForSelector(`text=${TEST_FUNCIONARIO.nombre}`, { timeout: 10000 });
    
    // Ir al panel
    await page.click('button:has-text("Mi Panel")');
    
    // Esperar a que cargue el panel
    await page.waitForSelector('text=Mi Panel de Reportes', { timeout: 10000 });
    
    console.log('✅ Mi Panel de Reportes cargado');
    
    // Verificar que está en la pestaña "Mis Reportes Asignados"
    const tabMisReportes = page.locator('button:has-text("Mis Reportes")');
    await expect(tabMisReportes).toBeVisible();
    
    // Esperar a que carguen los reportes (o mensaje de sin reportes)
    await page.waitForTimeout(2000);
    
    // Verificar que hay reportes o mensaje de vacío
    const hayReportes = await page.locator('text=Reporte #').count() > 0;
    const hayMensajeVacio = await page.locator('text=No tienes reportes asignados').isVisible();
    
    expect(hayReportes || hayMensajeVacio).toBeTruthy();
    
    if (hayReportes) {
      console.log('✅ Funcionario tiene reportes asignados');
    } else {
      console.log('⚠️ Funcionario no tiene reportes asignados (base de datos vacía)');
    }
  });

  test('Botón "Ver Reporte Completo" está visible y funcional', async ({ page }) => {
    // Login y navegar al panel
    await page.click('button:has-text("Iniciar Sesión")');
    await page.waitForSelector('text=Acceso al Sistema');
    await page.fill('input[type="email"]', TEST_FUNCIONARIO.email);
    await page.fill('input[type="password"]', TEST_FUNCIONARIO.password);
    await page.click('button[type="submit"]:has-text("Iniciar Sesión")');
    await page.waitForSelector(`text=${TEST_FUNCIONARIO.nombre}`, { timeout: 10000 });
    await page.click('button:has-text("Mi Panel")');
    await page.waitForSelector('text=Mi Panel de Reportes', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Verificar que existe al menos un reporte
    let cantidadReportes = await page.locator('text=Reporte #').count();
    
    if (cantidadReportes === 0) {
      console.log('⚠️ No hay reportes, creando uno vía API...');
      await page.request.post('http://127.0.0.1:4000/api/reportes', {
        data: {
          tipo: 'baches',
          descripcion: 'Reporte para prueba de botón',
          lat: 18.7160,
          lng: -98.7760,
          peso: 4
        }
      });
      await page.reload();
      await page.waitForSelector('text=Mi Panel de Reportes', { timeout: 10000 });
      await page.waitForTimeout(2000);
      cantidadReportes = await page.locator('text=Reporte #').count();
    }
    
    expect(cantidadReportes).toBeGreaterThan(0);
    
    // Verificar que el botón "Ver Reporte Completo" existe
    const botonVerCompleto = page.locator('button:has-text("🗺️ Ver Reporte Completo")').first();
    await expect(botonVerCompleto).toBeVisible();
    
    console.log('✅ Botón "Ver Reporte Completo" está visible');
    
    // Verificar que el botón tiene los estilos correctos (gradient azul)
    const backgroundColor = await botonVerCompleto.evaluate((btn) => {
      return window.getComputedStyle(btn).background;
    });
    
    expect(backgroundColor).toContain('rgb(59, 130, 246)'); // #3b82f6
    console.log('✅ Botón tiene el estilo correcto');
  });

  test('Click en "Ver Reporte Completo" navega a vista detallada', async ({ page }) => {
    // Login y navegar al panel
    await page.click('button:has-text("Iniciar Sesión")');
    await page.waitForSelector('text=Acceso al Sistema');
    await page.fill('input[type="email"]', TEST_FUNCIONARIO.email);
    await page.fill('input[type="password"]', TEST_FUNCIONARIO.password);
    await page.click('button[type="submit"]:has-text("Iniciar Sesión")');
    await page.waitForSelector(`text=${TEST_FUNCIONARIO.nombre}`, { timeout: 10000 });
    await page.click('button:has-text("Mi Panel")');
    await page.waitForSelector('text=Mi Panel de Reportes', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Esperar reportes o crear uno vía API si es necesario
    let cantidadReportes = await page.locator('text=Reporte #').count();
    
    if (cantidadReportes === 0) {
      console.log('⚠️ No hay reportes, creando uno vía API...');
      const crearReporte = await page.request.post('http://127.0.0.1:4000/api/reportes', {
        data: {
          tipo: 'baches',
          descripcion: 'Reporte de prueba E2E - creado dinámicamente',
          lat: 18.7160,
          lng: -98.7760,
          peso: 4
        }
      });
      expect(crearReporte.ok()).toBeTruthy();
      
      // Refrescar página para ver el reporte
      await page.reload();
      await page.waitForSelector('text=Mi Panel de Reportes', { timeout: 10000 });
      await page.waitForTimeout(2000);
      cantidadReportes = await page.locator('text=Reporte #').count();
    }

    // Debe haber al menos un reporte
    expect(cantidadReportes).toBeGreaterThan(0);
    
    // Extraer el ID del primer reporte
    const primerReporteTexto = await page.locator('text=Reporte #').first().textContent();
    const reporteIdMatch = primerReporteTexto?.match(/Reporte #(\d+)/);
    
    expect(reporteIdMatch).not.toBeNull();
    const reporteId = reporteIdMatch![1];
    
    console.log(`📝 Probando con reporte ID: ${reporteId}`);
    
    // Click en "Ver Reporte Completo"
    await page.locator('button:has-text("🗺️ Ver Reporte Completo")').first().click();
    
    // Esperar navegación
    await page.waitForTimeout(1500);
    
    // Verificar que el hash cambió a #reporte/:id
    const currentHash = await page.evaluate(() => window.location.hash);
    expect(currentHash).toBe(`#reporte/${reporteId}`);
    
    console.log(`✅ Navegación correcta a ${currentHash}`);
  });

  test('Vista detallada muestra toda la información del reporte', async ({ page }) => {
    // Login y navegar al panel
    await page.click('button:has-text("Iniciar Sesión")');
    await page.waitForSelector('text=Acceso al Sistema');
    await page.fill('input[type="email"]', TEST_FUNCIONARIO.email);
    await page.fill('input[type="password"]', TEST_FUNCIONARIO.password);
    await page.click('button[type="submit"]:has-text("Iniciar Sesión")');
    await page.waitForSelector(`text=${TEST_FUNCIONARIO.nombre}`, { timeout: 10000 });
    await page.click('button:has-text("Mi Panel")');
    await page.waitForSelector('text=Mi Panel de Reportes', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    let cantidadReportes = await page.locator('text=Reporte #').count();
    if (cantidadReportes === 0) {
      console.log('⚠️ No hay reportes, creando uno vía API...');
      await page.request.post('http://127.0.0.1:4000/api/reportes', {
        data: {
          tipo: 'baches',
          descripcion: 'Reporte para ver detalle completo',
          lat: 18.7160,
          lng: -98.7760,
          peso: 4
        }
      });
      await page.reload();
      await page.waitForSelector('text=Mi Panel de Reportes', { timeout: 10000 });
      await page.waitForTimeout(2000);
      cantidadReportes = await page.locator('text=Reporte #').count();
    }
    expect(cantidadReportes).toBeGreaterThan(0);
    
    // Click en "Ver Reporte Completo"
    await page.locator('button:has-text("🗺️ Ver Reporte Completo")').first().click();
    await page.waitForTimeout(2000);
    
    // Verificar elementos clave de la vista detallada
    
    // 1. Título del reporte
    await expect(page.locator('text=Reporte #')).toBeVisible();
    console.log('✅ Título del reporte visible');
    
    // 2. Descripción completa
    await expect(page.locator('text=📋 Información del Reporte')).toBeVisible();
    console.log('✅ Sección de información visible');
    
    // 3. Ubicación
    await expect(page.locator('text=Ubicación del Reporte')).toBeVisible();
    console.log('✅ Sección de ubicación visible');
    
    // 4. Mapa de Leaflet
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible({ timeout: 10000 });
    console.log('✅ Mapa de Leaflet renderizado');
    
    // 5. Botón "Volver"
    const botonVolver = page.locator('button:has-text("Volver")');
    await expect(botonVolver).toBeVisible();
    console.log('✅ Botón "Volver" visible');
    
    // Tomar screenshot
    await page.screenshot({ 
      path: 'test-results/funcionario-ver-reporte-completo.png', 
      fullPage: true 
    });
    console.log('✅ Screenshot guardado');
  });

  test('Funcionario puede regresar del reporte al panel', async ({ page }) => {
    // Login y navegar al panel
    await page.click('button:has-text("Iniciar Sesión")');
    await page.waitForSelector('text=Acceso al Sistema');
    await page.fill('input[type="email"]', TEST_FUNCIONARIO.email);
    await page.fill('input[type="password"]', TEST_FUNCIONARIO.password);
    await page.click('button[type="submit"]:has-text("Iniciar Sesión")');
    await page.waitForSelector(`text=${TEST_FUNCIONARIO.nombre}`, { timeout: 10000 });
    await page.click('button:has-text("Mi Panel")');
    await page.waitForSelector('text=Mi Panel de Reportes', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    let cantidadReportes = await page.locator('text=Reporte #').count();
    if (cantidadReportes === 0) {
      console.log('⚠️ No hay reportes, creando uno vía API...');
      await page.request.post('http://127.0.0.1:4000/api/reportes', {
        data: {
          tipo: 'baches',
          descripcion: 'Reporte para prueba de navegación',
          lat: 18.7160,
          lng: -98.7760,
          peso: 4
        }
      });
      await page.reload();
      await page.waitForSelector('text=Mi Panel de Reportes', { timeout: 10000 });
      await page.waitForTimeout(2000);
      cantidadReportes = await page.locator('text=Reporte #').count();
    }
    expect(cantidadReportes).toBeGreaterThan(0);
    
    // Ir al reporte completo
    await page.locator('button:has-text("🗺️ Ver Reporte Completo")').first().click();
    await page.waitForTimeout(2000);
    
    // Click en "Volver"
    await page.locator('button:has-text("Volver")').click();
    await page.waitForTimeout(1500);
    
    // Verificar que regresó a la vista del mapa (hash vacío)
    const currentHash = await page.evaluate(() => window.location.hash);
    expect(currentHash).toBe('');
    
    console.log('✅ Navegación de regreso exitosa al mapa principal');
    
    // Verificar que el mapa está visible
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible();
  });

  test('API endpoint /api/reportes/:id retorna datos completos del reporte', async ({ request }) => {
    // Primero obtener lista de reportes para tener un ID válido
    const reportesResponse = await request.get(`${API_URL}/api/reportes`);
    expect(reportesResponse.ok()).toBeTruthy();
    
    const reportes = await reportesResponse.json();
    expect(reportes.length).toBeGreaterThan(0);
    
    const primerReporteId = reportes[0].id;
    console.log(`📝 Probando endpoint con ID: ${primerReporteId}`);
    
    // Obtener detalle del reporte
    const detalleResponse = await request.get(`${API_URL}/api/reportes/${primerReporteId}`);
    expect(detalleResponse.ok()).toBeTruthy();
    expect(detalleResponse.status()).toBe(200);
    
    const reporte = await detalleResponse.json();
    
    // Validar estructura completa
    expect(reporte).toHaveProperty('id');
    expect(reporte).toHaveProperty('tipo');
    expect(reporte).toHaveProperty('descripcion');
    expect(reporte).toHaveProperty('lat');
    expect(reporte).toHaveProperty('lng');
    expect(reporte).toHaveProperty('peso');
    expect(reporte).toHaveProperty('estado');
    expect(reporte).toHaveProperty('dependencia');
    expect(reporte).toHaveProperty('creado_en');
    
    // Validar tipos de datos
    expect(typeof reporte.id).toBe('number');
    expect(typeof reporte.lat).toBe('number');
    expect(typeof reporte.lng).toBe('number');
    expect(typeof reporte.descripcion).toBe('string');
    
    console.log('✅ Endpoint retorna estructura completa del reporte');
  });

  test('Vista de reporte completo funciona sin autenticación (público)', async ({ page }) => {
    // Navegar directamente a un reporte sin login
    // Primero obtener un ID válido vía API
    let response = await page.request.get(`${API_URL}/api/reportes`);
    let reportes = await response.json();
    
    if (reportes.length === 0) {
      console.log('⚠️ No hay reportes, creando uno vía API...');
      await page.request.post(`${API_URL}/api/reportes`, {
        data: {
          tipo: 'baches',
          descripcion: 'Reporte público de prueba',
          lat: 18.7160,
          lng: -98.7760,
          peso: 4
        }
      });
      response = await page.request.get(`${API_URL}/api/reportes`);
      reportes = await response.json();
    }
    expect(reportes.length).toBeGreaterThan(0);
    
    const primerReporteId = reportes[0].id;
    
    // Navegar directamente al hash
    await page.goto(`${BASE_URL}#reporte/${primerReporteId}`);
    await page.waitForTimeout(3000);
    
    // Verificar que se muestra la vista (acceso público)
    await expect(page.locator('text=Reporte #')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Vista de reporte completo es accesible sin autenticación');
  });

  test('Múltiples reportes - verificar navegación entre reportes', async ({ page }) => {
    // Login y navegar al panel
    await page.click('button:has-text("Iniciar Sesión")');
    await page.waitForSelector('text=Acceso al Sistema');
    await page.fill('input[type="email"]', TEST_FUNCIONARIO.email);
    await page.fill('input[type="password"]', TEST_FUNCIONARIO.password);
    await page.click('button[type="submit"]:has-text("Iniciar Sesión")');
    await page.waitForSelector(`text=${TEST_FUNCIONARIO.nombre}`, { timeout: 10000 });
    await page.click('button:has-text("Mi Panel")');
    await page.waitForSelector('text=Mi Panel de Reportes', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    let cantidadReportes = await page.locator('button:has-text("🗺️ Ver Reporte Completo")').count();
    
    if (cantidadReportes < 2) {
      console.log(`⚠️ Solo hay ${cantidadReportes} reporte(s), creando otro vía API...`);
      await page.request.post('http://127.0.0.1:4000/api/reportes', {
        data: {
          tipo: 'alumbrado',
          descripcion: 'Segundo reporte para prueba de navegación',
          lat: 18.7145,
          lng: -98.7785,
          peso: 4
        }
      });
      await page.reload();
      await page.waitForSelector('text=Mi Panel de Reportes', { timeout: 10000 });
      await page.waitForTimeout(2000);
      cantidadReportes = await page.locator('button:has-text("🗺️ Ver Reporte Completo")').count();
    }
    expect(cantidadReportes).toBeGreaterThanOrEqual(2);
    
    console.log(`📋 Funcionario tiene ${cantidadReportes} reportes asignados`);
    
    // Ver primer reporte
    await page.locator('button:has-text("🗺️ Ver Reporte Completo")').first().click();
    await page.waitForTimeout(1500);
    const hash1 = await page.evaluate(() => window.location.hash);
    console.log(`✅ Navegó a: ${hash1}`);
    
    // Volver
    await page.locator('button:has-text("Volver")').click();
    await page.waitForTimeout(1000);
    
    // Ir al panel de nuevo
    await page.click('button:has-text("Mi Panel")');
    await page.waitForTimeout(1500);
    
    // Ver segundo reporte
    await page.locator('button:has-text("🗺️ Ver Reporte Completo")').nth(1).click();
    await page.waitForTimeout(1500);
    const hash2 = await page.evaluate(() => window.location.hash);
    console.log(`✅ Navegó a: ${hash2}`);
    
    // Verificar que son diferentes
    expect(hash1).not.toBe(hash2);
    console.log('✅ Navegación entre múltiples reportes funciona correctamente');
  });

});
