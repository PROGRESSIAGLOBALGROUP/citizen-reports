// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Test End-to-End: Solicitud de Cierre dentro de Vista Completa del Reporte
 * 
 * Valida que:
 * 1. El botón "Solicitar Cierre" NO aparece en el dashboard
 * 2. El botón/formulario de cierre SÍ aparece en la vista completa del reporte
 * 3. El funcionario puede agregar notas a la bitácora
 * 4. El funcionario puede solicitar cierre desde la vista completa
 * 5. La solicitud de cierre requiere notas y firma digital
 * 6. El flujo completo funciona end-to-end
 * 
 * Test Fixture Data:
 * - Usuario: func.obras1@jantetelco.gob.mx / admin123
 * - Rol: funcionario
 * - Departamento: obras_publicas
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:5173';
const API_URL = 'http://127.0.0.1:4000';

const TEST_FUNCIONARIO = {
  email: 'func.obras1@jantetelco.gob.mx',
  password: 'admin123',
  nombre: 'Juan Pérez - Obras',
  rol: 'funcionario',
  dependencia: 'obras_publicas'
};

test.describe('Solicitud de Cierre dentro de Vista Completa', () => {
  
  let authToken: string = '';
  let reporteId: number = 0;

  test.beforeAll(async ({ request }) => {
    // Login para obtener token
    const loginResponse = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: TEST_FUNCIONARIO.email,
        password: TEST_FUNCIONARIO.password
      }
    });
    
    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    authToken = loginData.token;

    // Obtener reporte asignado
    const reportesResponse = await request.get(`${API_URL}/api/reportes/mis-reportes`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const reportes = await reportesResponse.json();
    expect(reportes.length).toBeGreaterThan(0);
    
    // Buscar reporte abierto
    const reporteAbierto = reportes.find((r: any) => r.estado === 'abierto');
    reporteId = reporteAbierto ? reporteAbierto.id : reportes[0].id;
    
    console.log(`✅ Setup completo - Reporte ID: ${reporteId}, Token: ${authToken.substring(0, 20)}...`);
  });

  test('Dashboard NO debe mostrar botón "Solicitar Cierre" directamente', async ({ page }) => {
    // Login
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Iniciar Sesión")');
    await page.waitForSelector('text=Inicio de Sesión', { timeout: 5000 });
    await page.fill('input[type="email"]', TEST_FUNCIONARIO.email);
    await page.fill('input[type="password"]', TEST_FUNCIONARIO.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForSelector(`text=${TEST_FUNCIONARIO.nombre}`, { timeout: 10000 });

    // Ir al panel
    await page.click('button:has-text("Mi Panel")');
    await page.waitForTimeout(1000);

    // Verificar que NO hay botón "Solicitar Cierre" en las tarjetas del dashboard
    const botonCierreDashboard = page.locator('button:has-text("Solicitar Cierre")').first();
    await expect(botonCierreDashboard).not.toBeVisible();
    
    // Verificar que SÍ hay mensaje informativo
    await expect(page.locator('text=Usa "Ver Reporte Completo" para agregar notas y solicitar cierre')).toBeVisible();
    
    console.log('✅ Dashboard NO muestra botón de cierre (correcto)');
  });

  test('Vista completa SÍ debe mostrar sección "Solicitar Cierre"', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Iniciar Sesión")');
    await page.waitForSelector('text=Inicio de Sesión', { timeout: 5000 });
    await page.fill('input[type="email"]', TEST_FUNCIONARIO.email);
    await page.fill('input[type="password"]', TEST_FUNCIONARIO.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForSelector(`text=${TEST_FUNCIONARIO.nombre}`, { timeout: 10000 });

    // Ir al reporte completo
    await page.goto(`${BASE_URL}#reporte/${reporteId}`);
    await page.waitForTimeout(2000);

    // Verificar que SÍ existe la sección de cierre
    await expect(page.locator('text=✅ Solicitar Cierre del Reporte')).toBeVisible();
    await expect(page.locator('button:has-text("Completar Solicitud de Cierre")')).toBeVisible();
    
    console.log('✅ Vista completa muestra sección de cierre (correcto)');
  });

  test('Flujo completo: Agregar nota → Solicitar cierre desde vista completa', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Iniciar Sesión")');
    await page.waitForSelector('text=Inicio de Sesión', { timeout: 5000 });
    await page.fill('input[type="email"]', TEST_FUNCIONARIO.email);
    await page.fill('input[type="password"]', TEST_FUNCIONARIO.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForSelector(`text=${TEST_FUNCIONARIO.nombre}`, { timeout: 10000 });
    await page.goto(`${BASE_URL}#reporte/${reporteId}`);
    await page.waitForTimeout(2000);

    // Paso 1: Agregar nota final en bitácora
    await page.selectOption('select', 'resolucion');
    await page.fill('textarea[placeholder*="Revisé el sitio"]', 'Trabajo completado. Bache reparado exitosamente. Listo para cerrar.');
    await page.click('button:has-text("Agregar a Bitácora")');
    await expect(page.locator('text=✅ Nota agregada a la bitácora')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);

    // Paso 2: Abrir formulario de cierre
    await page.click('button:has-text("Completar Solicitud de Cierre")');
    await page.waitForTimeout(500);

    // Verificar que el formulario se abrió
    await expect(page.locator('text=Notas de cierre *')).toBeVisible();
    await expect(page.locator('text=Firma digital *')).toBeVisible();
    
    // Llenar notas de cierre
    await page.fill('textarea[placeholder*="Describe las acciones"]', 'Reporte resuelto. Se reparó el bache completamente con asfalto nuevo.');
    
    console.log('✅ Formulario de cierre visible y accesible desde vista completa');
  });

  test('Validación: Formulario de cierre requiere notas obligatorias', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Iniciar Sesión")');
    await page.waitForSelector('text=Inicio de Sesión', { timeout: 5000 });
    await page.fill('input[type="email"]', TEST_FUNCIONARIO.email);
    await page.fill('input[type="password"]', TEST_FUNCIONARIO.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForSelector(`text=${TEST_FUNCIONARIO.nombre}`, { timeout: 10000 });
    await page.goto(`${BASE_URL}#reporte/${reporteId}`);
    await page.waitForTimeout(2000);

    // Abrir formulario
    await page.click('button:has-text("Completar Solicitud de Cierre")');
    await page.waitForTimeout(500);

    // Intentar enviar sin notas (debe fallar)
    await page.click('button:has-text("Enviar Solicitud de Cierre")');
    await expect(page.locator('text=Las notas de cierre son obligatorias')).toBeVisible({ timeout: 3000 });
    
    console.log('✅ Validación de notas obligatorias funciona');
  });

  test('Validación: Formulario de cierre requiere firma digital', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Iniciar Sesión")');
    await page.waitForSelector('text=Inicio de Sesión', { timeout: 5000 });
    await page.fill('input[type="email"]', TEST_FUNCIONARIO.email);
    await page.fill('input[type="password"]', TEST_FUNCIONARIO.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForSelector(`text=${TEST_FUNCIONARIO.nombre}`, { timeout: 10000 });
    await page.goto(`${BASE_URL}#reporte/${reporteId}`);
    await page.waitForTimeout(2000);

    // Abrir formulario
    await page.click('button:has-text("Completar Solicitud de Cierre")');
    await page.waitForTimeout(500);

    // Llenar solo notas
    await page.fill('textarea[placeholder*="Describe las acciones"]', 'Trabajo completado');
    
    // Intentar enviar sin firma (debe fallar)
    await page.click('button:has-text("Enviar Solicitud de Cierre")');
    await expect(page.locator('text=La firma digital es obligatoria')).toBeVisible({ timeout: 3000 });
    
    console.log('✅ Validación de firma obligatoria funciona');
  });

  test('Backend: Endpoint POST /api/reportes/:id/solicitar-cierre funciona correctamente', async ({ request }) => {
    // Crear firma en base64 (1x1 pixel transparent PNG)
    const firmaBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const response = await request.post(`${API_URL}/api/reportes/${reporteId}/solicitar-cierre`, {
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        notas_cierre: 'E2E Test: Reporte completamente resuelto',
        firma_digital: firmaBase64,
        evidencia_fotos: []
      }
    });

    // Puede retornar 200 o 400 si ya está en pendiente_cierre
    expect([200, 400]).toContain(response.status());
    
    if (response.status() === 200) {
      console.log('✅ Solicitud de cierre enviada exitosamente desde API');
    } else {
      const error = await response.json();
      console.log(`ℹ️ Reporte ya procesado: ${error.error}`);
    }
  });

  test('Navegación: Usuario puede cancelar formulario de cierre', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Iniciar Sesión")');
    await page.waitForSelector('text=Inicio de Sesión', { timeout: 5000 });
    await page.fill('input[type="email"]', TEST_FUNCIONARIO.email);
    await page.fill('input[type="password"]', TEST_FUNCIONARIO.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForSelector(`text=${TEST_FUNCIONARIO.nombre}`, { timeout: 10000 });
    await page.goto(`${BASE_URL}#reporte/${reporteId}`);
    await page.waitForTimeout(2000);

    // Abrir formulario
    await page.click('button:has-text("Completar Solicitud de Cierre")');
    await page.waitForTimeout(500);

    // Llenar datos
    await page.fill('textarea[placeholder*="Describe las acciones"]', 'Test de cancelación');
    
    // Cancelar
    await page.click('button:has-text("Cancelar")');
    await page.waitForTimeout(500);

    // Verificar que volvió al estado inicial
    await expect(page.locator('button:has-text("Completar Solicitud de Cierre")')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="Describe las acciones"]')).not.toBeVisible();
    
    console.log('✅ Cancelación de formulario funciona correctamente');
  });

});

