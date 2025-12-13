/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
/**
 * Test End-to-End: Bitácora de Notas de Trabajo con Trazabilidad Auditable
 * 
 * Valida que:
 * 1. Las notas son append-only (no se sobreescriben)
 * 2. Cada nota tiene timestamp inmutable
 * 3. El historial completo es visible
 * 4. Solo funcionarios asignados pueden agregar notas
 * 5. Las notas se registran en audit trail (historial_cambios)
 * 6. Los tipos de nota (observacion, avance, incidente, resolucion) funcionan
 * 7. No es posible eliminar notas (inmutabilidad)
 * 
 * Test Fixture Data:
 * - Usuario: func.obras1@jantetelco.gob.mx / admin123
 * - Rol: funcionario
 * - Departamento: obras_publicas
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:4000';

const TEST_FUNCIONARIO = {
  email: 'func.obras1@jantetelco.gob.mx',
  password: 'admin123',
  nombre: 'Juan Pérez',
  rol: 'funcionario',
  dependencia: 'obras_publicas'
};

test.describe('Bitácora de Notas de Trabajo - Trazabilidad Auditable', () => {
  
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
    reporteId = reportes[0].id;
    
    console.log(`✅ Setup completo - Reporte ID: ${reporteId}, Token: ${authToken.substring(0, 20)}...`);
  });

  test('Backend: Endpoint POST /api/reportes/:id/notas-trabajo crea nota correctamente', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/reportes/${reporteId}/notas-trabajo`, {
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        contenido: 'Test: Primera nota de observación en bitácora',
        tipo: 'observacion'
      }
    });

    expect(response.status()).toBe(201);
    const nota = await response.json();
    
    expect(nota).toHaveProperty('id');
    expect(nota).toHaveProperty('reporte_id', reporteId);
    expect(nota).toHaveProperty('contenido', 'Test: Primera nota de observación en bitácora');
    expect(nota).toHaveProperty('tipo', 'observacion');
    expect(nota).toHaveProperty('creado_en');
    expect(nota).toHaveProperty('usuario_nombre');
    
    console.log(`✅ Nota creada ID: ${nota.id}`);
  });

  test('Backend: Endpoint GET /api/reportes/:id/notas-trabajo retorna historial completo', async ({ request }) => {
    // Crear 3 notas de diferentes tipos
    const tiposNotas = ['observacion', 'avance', 'incidente'];
    
    for (const tipo of tiposNotas) {
      await request.post(`${API_URL}/api/reportes/${reporteId}/notas-trabajo`, {
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          contenido: `Test: Nota tipo ${tipo}`,
          tipo
        }
      });
    }

    // Obtener historial
    const response = await request.get(`${API_URL}/api/reportes/${reporteId}/notas-trabajo`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(response.ok()).toBeTruthy();
    const notas = await response.json();
    
    expect(Array.isArray(notas)).toBeTruthy();
    expect(notas.length).toBeGreaterThanOrEqual(3);
    
    // Verificar que están ordenadas cronológicamente (más reciente primero)
    if (notas.length > 1) {
      const primera = new Date(notas[0].creado_en);
      const segunda = new Date(notas[1].creado_en);
      expect(primera >= segunda).toBeTruthy();
    }
    
    console.log(`✅ Historial retorna ${notas.length} notas`);
  });

  test('Backend: Sistema es append-only (no permite actualizar/eliminar)', async ({ request }) => {
    // Intentar eliminar una nota (debe retornar 405 Method Not Allowed)
    const deleteResponse = await request.delete(`${API_URL}/api/reportes/${reporteId}/notas-trabajo/1`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(deleteResponse.status()).toBe(405);
    const error = await deleteResponse.json();
    expect(error.error).toContain('no permitida');
    expect(error.razon).toContain('ADR-0010');
    
    console.log('✅ Sistema inmutable confirmado (405 Method Not Allowed)');
  });

  test('Backend: Solo funcionarios asignados pueden agregar notas', async ({ request }) => {
    // Login como funcionario NO asignado
    const loginResponse = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'func.servicios1@jantetelco.gob.mx',
        password: 'admin123'
      }
    });
    
    const loginData = await loginResponse.json();
    const tokenNoAsignado = loginData.token;

    // Intentar crear nota sin estar asignado
    const response = await request.post(`${API_URL}/api/reportes/${reporteId}/notas-trabajo`, {
      headers: { 
        'Authorization': `Bearer ${tokenNoAsignado}`,
        'Content-Type': 'application/json'
      },
      data: {
        contenido: 'Intento de nota no autorizada',
        tipo: 'observacion'
      }
    });

    expect(response.status()).toBe(403);
    const error = await response.json();
    expect(error.error).toContain('No estás asignado a este reporte');
    
    console.log('✅ Autorización verificada (403 Forbidden)');
  });

  test('Backend: Validaciones de entrada funcionan correctamente', async ({ request }) => {
    // Contenido vacío
    let response = await request.post(`${API_URL}/api/reportes/${reporteId}/notas-trabajo`, {
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        contenido: '   ',
        tipo: 'observacion'
      }
    });
    expect(response.status()).toBe(400);

    // Tipo inválido
    response = await request.post(`${API_URL}/api/reportes/${reporteId}/notas-trabajo`, {
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        contenido: 'Test con tipo inválido',
        tipo: 'tipo_invalido'
      }
    });
    expect(response.status()).toBe(400);
    
    console.log('✅ Validaciones de entrada funcionan');
  });

  test('Frontend: Bitácora se muestra en vista de reporte completo', async ({ page }) => {
    // Login
    await page.goto(BASE_URL);
    await page.click('button:has-text("🔐 Iniciar Sesión")');
    await page.waitForSelector('text=Acceso al Sistema');
    await page.fill('input[type="email"]', TEST_FUNCIONARIO.email);
    await page.fill('input[type="password"]', TEST_FUNCIONARIO.password);
    await page.click('button:has-text("🔐 Iniciar Sesión")');
    await page.waitForSelector(`text=${TEST_FUNCIONARIO.nombre}`);

    // Ir al reporte completo
    await page.goto(`${BASE_URL}#reporte/${reporteId}`);
    await page.waitForTimeout(2000);

    // Verificar que la bitácora está visible
    await expect(page.locator('text=📋 Bitácora de Trabajo')).toBeVisible();
    await expect(page.locator('text=Sistema de trazabilidad auditable')).toBeVisible();
    
    console.log('✅ Bitácora visible en frontend');
  });

  test('Frontend: Selector de tipo de nota funciona', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('button:has-text("🔐 Iniciar Sesión")');
    await page.waitForSelector('text=Acceso al Sistema');
    await page.fill('input[type="email"]', TEST_FUNCIONARIO.email);
    await page.fill('input[type="password"]', TEST_FUNCIONARIO.password);
    await page.click('button:has-text("🔐 Iniciar Sesión")');
    await page.waitForSelector(`text=${TEST_FUNCIONARIO.nombre}`);
    await page.goto(`${BASE_URL}#reporte/${reporteId}`);
    await page.waitForTimeout(2000);

    // Verificar que el selector de tipo existe
    const selector = page.locator('select');
    await expect(selector).toBeVisible();
    
    // Verificar opciones
    const options = await selector.locator('option').allTextContents();
    expect(options).toContain('📝 Observación');
    expect(options).toContain('🔄 Avance de Trabajo');
    expect(options).toContain('⚠️ Incidente / Problema');
    expect(options).toContain('✅ Resolución');
    
    console.log('✅ Selector de tipo funcional');
  });

  test('Frontend: Agregar nota y verificar que aparece en historial', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('button:has-text("🔐 Iniciar Sesión")');
    await page.waitForSelector('text=Acceso al Sistema');
    await page.fill('input[type="email"]', TEST_FUNCIONARIO.email);
    await page.fill('input[type="password"]', TEST_FUNCIONARIO.password);
    await page.click('button:has-text("🔐 Iniciar Sesión")');
    await page.waitForSelector(`text=${TEST_FUNCIONARIO.nombre}`);
    await page.goto(`${BASE_URL}#reporte/${reporteId}`);
    await page.waitForTimeout(2000);

    // Obtener cantidad actual de notas
    const cantidadAntes = await page.locator('text=/\\d+ entr/').textContent();
    
    // Agregar nueva nota
    await page.selectOption('select', 'avance');
    await page.fill('textarea[placeholder*="Revisé el sitio"]', 'E2E Test: Nota de prueba automatizada desde Playwright');
    await page.click('button:has-text("Agregar a Bitácora")');
    
    // Esperar mensaje de éxito
    await expect(page.locator('text=✅ Nota agregada a la bitácora')).toBeVisible({ timeout: 5000 });
    
    // Verificar que aparece en el historial
    await page.waitForTimeout(1000);
    await expect(page.locator('text=E2E Test: Nota de prueba automatizada')).toBeVisible();
    
    // Verificar badge de tipo
    await expect(page.locator('text=🔄 AVANCE')).toBeVisible();
    
    // Screenshot
    await page.screenshot({ path: 'test-results/bitacora-notas-trabajo.png', fullPage: true });
    
    console.log('✅ Nota agregada y visible en historial');
  });

  test('Frontend: Historial muestra timestamps correctamente', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('button:has-text("🔐 Iniciar Sesión")');
    await page.waitForSelector('text=Acceso al Sistema');
    await page.fill('input[type="email"]', TEST_FUNCIONARIO.email);
    await page.fill('input[type="password"]', TEST_FUNCIONARIO.password);
    await page.click('button:has-text("🔐 Iniciar Sesión")');
    await page.waitForSelector(`text=${TEST_FUNCIONARIO.nombre}`);
    await page.goto(`${BASE_URL}#reporte/${reporteId}`);
    await page.waitForTimeout(2000);

    // Verificar que existen timestamps
    const timestamps = page.locator('text=/\\d{1,2} de \\w+ de \\d{4}/');
    const count = await timestamps.count();
    
    expect(count).toBeGreaterThan(0);
    console.log(`✅ ${count} timestamps visibles en historial`);
  });

  test('Frontend: Usuario no asignado ve mensaje de restricción', async ({ page }) => {
    // Login como funcionario NO asignado
    await page.goto(BASE_URL);
    await page.click('button:has-text("🔐 Iniciar Sesión")');
    await page.waitForSelector('text=Acceso al Sistema');
    await page.fill('input[type="email"]', 'func.servicios1@jantetelco.gob.mx');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("🔐 Iniciar Sesión")');
    await page.waitForTimeout(2000);

    // Ir al reporte (acceso público)
    await page.goto(`${BASE_URL}#reporte/${reporteId}`);
    await page.waitForTimeout(2000);

    // Verificar mensaje de restricción
    await expect(page.locator('text=Solo funcionarios asignados pueden agregar notas')).toBeVisible();
    
    // Verificar que NO hay formulario
    const textarea = page.locator('textarea[placeholder*="Revisé el sitio"]');
    await expect(textarea).not.toBeVisible();
    
    console.log('✅ Restricción de acceso funciona en frontend');
  });

  test('Integración: Nota registrada en audit trail (historial_cambios)', async ({ request }) => {
    // Crear nota
    const notaResponse = await request.post(`${API_URL}/api/reportes/${reporteId}/notas-trabajo`, {
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        contenido: 'Test audit trail: Verificando trazabilidad completa',
        tipo: 'resolucion'
      }
    });

    expect(notaResponse.status()).toBe(201);
    const nota = await notaResponse.json();

    // Esperar propagación
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verificar en historial de cambios
    const historialResponse = await request.get(`${API_URL}/api/reportes/${reporteId}/historial`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(historialResponse.ok()).toBeTruthy();
    const historial = await historialResponse.json();
    
    // Buscar entrada de nota_trabajo_agregada
    const entradaNota = historial.find((h: any) => 
      h.tipo_cambio === 'nota_trabajo_agregada' && 
      h.valor_nuevo?.includes('Test audit trail')
    );

    expect(entradaNota).toBeDefined();
    expect(entradaNota.campo_modificado).toBe('notas_trabajo');
    
    console.log('✅ Nota registrada en audit trail (ADR-0010)');
  });

});
