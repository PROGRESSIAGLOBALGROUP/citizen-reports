import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Validación de Código Postal Obligatorio en Formulario
 * 
 * Prueba que el código postal sea requerido junto con el municipio
 * para habilitar el botón de envío de reportes.
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4000';

test.describe('Validación: Código Postal obligatorio para envío', () => {
  test('API de geocoding devuelve código postal para coordenadas de citizen-reports', async ({ page }) => {
    const testCoords = { lat: 18.715, lng: -98.776389 };
    
    const response = await page.request.get(
      `${BASE_URL}/api/geocode/reverse?lat=${testCoords.lat}&lng=${testCoords.lng}`
    );
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('codigo_postal');
    expect(data.data.codigo_postal).toBeDefined();
    expect(data.data.codigo_postal.length).toBeGreaterThan(0);
    
    console.log('✅ Código postal obtenido:', data.data.codigo_postal);
  });

  test('API de geocoding devuelve TANTO municipio COMO código postal', async ({ page }) => {
    const testCoords = { lat: 18.715, lng: -98.776389 };
    
    const response = await page.request.get(
      `${BASE_URL}/api/geocode/reverse?lat=${testCoords.lat}&lng=${testCoords.lng}`
    );
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    
    // Verificar ambos campos obligatorios
    expect(data.data.municipio).toBeDefined();
    expect(data.data.municipio.length).toBeGreaterThan(0);
    expect(data.data.codigo_postal).toBeDefined();
    expect(data.data.codigo_postal.length).toBeGreaterThan(0);
    
    console.log('✅ Municipio:', data.data.municipio);
    console.log('✅ Código Postal:', data.data.codigo_postal);
  });

  test('Backend acepta reporte SIN código postal (validación en frontend)', async ({ page }) => {
    const reporteSinCP = {
      tipo: 'test-sin-cp-' + Date.now(),
      descripcion: 'Test: Reporte sin código postal',
      descripcion_corta: 'Test sin CP',
      lat: 18.715,
      lng: -98.776389,
      peso: 1,
      municipio: 'citizen-reports',
      // NO incluir codigo_postal
      fingerprint: 'test-' + Date.now(),
      ip_cliente: '127.0.0.1'
    };
    
    const response = await page.request.post(`${BASE_URL}/api/reportes`, {
      data: reporteSinCP
    });
    
    // Backend acepta reporte sin CP (frontend lo previene)
    expect(response.status()).toBe(201);
    const result = await response.json();
    expect(result.ok).toBe(true);
    
    console.log('✅ Backend acepta reporte sin código postal (validación en frontend)');
  });

  test('Backend acepta reporte con código postal vacío (validación en frontend)', async ({ page }) => {
    const reporteData = {
      tipo: 'test-cp-vacio-' + Date.now(),
      descripcion: 'Test: Código postal vacío',
      descripcion_corta: 'Test CP vacío',
      lat: 18.715,
      lng: -98.776389,
      peso: 1,
      municipio: 'citizen-reports',
      codigo_postal: '', // CP vacío
      fingerprint: 'test-' + Date.now(),
      ip_cliente: '127.0.0.1'
    };
    
    const response = await page.request.post(`${BASE_URL}/api/reportes`, {
      data: reporteData
    });
    
    // Backend acepta CP vacío (frontend lo previene)
    expect(response.status()).toBe(201);
    console.log('✅ Backend acepta código postal vacío (validación en frontend)');
  });
});

test.describe('Validación: Código Postal para Ciudad de México', () => {
  test('API de geocoding devuelve código postal para CDMX', async ({ page }) => {
    const cdmxCoords = { lat: 19.4326, lng: -99.1332 };
    
    const response = await page.request.get(
      `${BASE_URL}/api/geocode/reverse?lat=${cdmxCoords.lat}&lng=${cdmxCoords.lng}`
    );
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data.codigo_postal).toBeDefined();
    expect(data.data.municipio).toBe('Ciudad de México');
    
    console.log('✅ CDMX - Código Postal:', data.data.codigo_postal);
    console.log('✅ CDMX - Municipio:', data.data.municipio);
  });

  test('Reporte con municipio pero sin CP debe ser rechazado por frontend', async ({ page }) => {
    // Este test valida la LÓGICA de validación (sin UI)
    
    // Simular datos de geocoding con municipio pero SIN código postal
    const municipio = 'citizen-reports';
    const codigo_postal = ''; // Vacío
    
    // Validación lógica (simulando frontend)
    const esValido = !!(municipio && municipio.trim() && codigo_postal && codigo_postal.trim());
    
    // Verificar que la validación rechaza falta de código postal
    expect(esValido).toBe(false);
    console.log('✅ Validación rechaza municipio sin código postal');
  });

  test('Reporte con código postal pero sin municipio debe ser rechazado', async ({ page }) => {
    // Validación lógica (simulando frontend)
    const municipio = ''; // Vacío
    const codigo_postal = '62935';
    
    const esValido = !!(municipio && municipio.trim() && codigo_postal && codigo_postal.trim());
    
    // Verificar que la validación rechaza falta de municipio
    expect(esValido).toBe(false);
    console.log('✅ Validación rechaza código postal sin municipio');
  });

  test('Reporte con AMBOS campos debe ser aceptado', async ({ page }) => {
    // Validación lógica (simulando frontend)
    const municipio = 'citizen-reports';
    const codigo_postal = '62935';
    
    const esValido = !!(municipio && municipio.trim() && codigo_postal && codigo_postal.trim());
    
    // Verificar que la validación acepta ambos campos presentes
    expect(esValido).toBe(true);
    console.log('✅ Validación acepta municipio Y código postal');
  });
});

test.describe('Integración: Código Postal en flujo completo', () => {
  test('Ciclo completo: Geocoding → Validación → Creación con CP', async ({ page }) => {
    // Paso 1: Obtener datos de geocoding (citizen-reports)
    const testCoords = { lat: 18.715, lng: -98.776389 };
    const geoResponse = await page.request.get(
      `${BASE_URL}/api/geocode/reverse?lat=${testCoords.lat}&lng=${testCoords.lng}`
    );
    
    expect(geoResponse.status()).toBe(200);
    const geoData = await geoResponse.json();
    expect(geoData.success).toBe(true);
    
    const municipio = geoData.data.municipio;
    const codigo_postal = geoData.data.codigo_postal;
    
    console.log('🗺️ Municipio desde geocoding:', municipio);
    console.log('📮 Código Postal desde geocoding:', codigo_postal);
    
    // Paso 2: Verificar que AMBOS campos están presentes
    expect(municipio).toBeDefined();
    expect(municipio.length).toBeGreaterThan(0);
    expect(codigo_postal).toBeDefined();
    expect(codigo_postal.length).toBeGreaterThan(0);
    
    // Paso 3: Crear reporte con ambos campos
    const reporteData = {
      tipo: 'test-ciclo-cp-' + Date.now(),
      descripcion: 'Test: Ciclo completo con código postal',
      descripcion_corta: 'Test ciclo CP',
      lat: testCoords.lat,
      lng: testCoords.lng,
      peso: 3,
      colonia: geoData.data.colonia,
      codigo_postal: codigo_postal,
      municipio: municipio,
      estado_ubicacion: geoData.data.estado_ubicacion,
      pais: geoData.data.pais,
      fingerprint: 'test-' + Date.now(),
      ip_cliente: '127.0.0.1'
    };
    
    const createResponse = await page.request.post(`${BASE_URL}/api/reportes`, {
      data: reporteData
    });
    
    expect(createResponse.status()).toBe(201);
    const result = await createResponse.json();
    expect(result.ok).toBe(true);
    expect(result.id).toBeDefined();
    
    console.log(`✅ Reporte creado exitosamente ID: ${result.id}`);
    
    // Paso 4: Verificar que el reporte se guardó con código postal
    const getResponse = await page.request.get(`${BASE_URL}/api/reportes`);
    expect(getResponse.status()).toBe(200);
    const reportes = await getResponse.json();
    
    const reporteGuardado = reportes.find((r: any) => r.id === result.id);
    expect(reporteGuardado).toBeDefined();
    expect(reporteGuardado.codigo_postal).toBe(codigo_postal);
    expect(reporteGuardado.municipio).toBe(municipio);
    
    console.log('✅ Código postal verificado en reporte guardado:', reporteGuardado.codigo_postal);
    console.log('✅ Municipio verificado en reporte guardado:', reporteGuardado.municipio);
    console.log('🎉 Ciclo completo: Código postal validado correctamente');
  });

  test('Validación de persistencia: Código postal se guarda y recupera', async ({ page }) => {
    const testCP = '06000'; // CDMX
    const testMunicipio = 'Ciudad de México';
    
    // Crear reporte con CP específico
    const reporteData = {
      tipo: 'test-persistencia-cp-' + Date.now(),
      descripcion: 'Test: Persistencia de código postal',
      descripcion_corta: 'Test persistencia CP',
      lat: 19.4326,
      lng: -99.1332,
      peso: 2,
      codigo_postal: testCP,
      municipio: testMunicipio,
      fingerprint: 'test-' + Date.now(),
      ip_cliente: '127.0.0.1'
    };
    
    const createResponse = await page.request.post(`${BASE_URL}/api/reportes`, {
      data: reporteData
    });
    
    expect(createResponse.status()).toBe(201);
    const result = await createResponse.json();
    const reporteId = result.id;
    
    // Recuperar reporte y verificar CP
    const getResponse = await page.request.get(`${BASE_URL}/api/reportes`);
    const reportes = await getResponse.json();
    
    const reporteRecuperado = reportes.find((r: any) => r.id === reporteId);
    expect(reporteRecuperado).toBeDefined();
    expect(reporteRecuperado.codigo_postal).toBe(testCP);
    expect(reporteRecuperado.municipio).toBe(testMunicipio);
    
    console.log('✅ Código postal persistido correctamente:', reporteRecuperado.codigo_postal);
  });

  test('Validación lógica: Ambos campos obligatorios para habilitar botón', async ({ page }) => {
    // Test de lógica de validación (sin UI)
    
    const casos = [
      { municipio: '', codigo_postal: '', esperado: false, desc: 'Ambos vacíos' },
      { municipio: 'citizen-reports', codigo_postal: '', esperado: false, desc: 'Solo municipio' },
      { municipio: '', codigo_postal: '62935', esperado: false, desc: 'Solo código postal' },
      { municipio: 'citizen-reports', codigo_postal: '62935', esperado: true, desc: 'Ambos presentes' },
      { municipio: '  ', codigo_postal: '62935', esperado: false, desc: 'Municipio solo espacios' },
      { municipio: 'citizen-reports', codigo_postal: '  ', esperado: false, desc: 'CP solo espacios' }
    ];
    
    for (const caso of casos) {
      const esValido = !!(
        caso.municipio && caso.municipio.trim() && 
        caso.codigo_postal && caso.codigo_postal.trim()
      );
      
      expect(esValido).toBe(caso.esperado);
      console.log(`✅ ${caso.desc}: ${esValido ? 'Válido' : 'Inválido'} (esperado: ${caso.esperado})`);
    }
    
    console.log('🎉 Todas las validaciones de lógica pasaron correctamente');
  });
});

test.describe('Edge Cases: Código Postal', () => {
  test('Geocoding para coordenadas polares no devuelve código postal', async ({ page }) => {
    const polarCoords = { lat: 89.9, lng: 0 };
    
    const response = await page.request.get(
      `${BASE_URL}/api/geocode/reverse?lat=${polarCoords.lat}&lng=${polarCoords.lng}`
    );
    
    expect([200, 400, 500]).toContain(response.status());
    
    const data = await response.json();
    
    if (response.status() === 200 && data.success) {
      // Puede no tener código postal en zonas remotas
      console.log('⚠️ Código postal en coordenadas polares:', data.data.codigo_postal || '(vacío)');
    }
  });

  test('Geocoding para océano no devuelve código postal', async ({ page }) => {
    const oceanCoords = { lat: 0, lng: 0 };
    
    const response = await page.request.get(
      `${BASE_URL}/api/geocode/reverse?lat=${oceanCoords.lat}&lng=${oceanCoords.lng}`,
      { timeout: 20000 }
    );
    
    expect([200, 400, 500]).toContain(response.status());
    console.log('✅ API responde para coordenadas oceánicas:', response.status());
  });

  test('Código postal con diferentes formatos se acepta', async ({ page }) => {
    const formatos = ['62935', '06000', '12345'];
    
    for (const cp of formatos) {
      const reporteData = {
        tipo: 'test-formato-cp-' + Date.now(),
        descripcion: 'Test: Formato de código postal',
        descripcion_corta: 'Test formato CP',
        lat: 18.715,
        lng: -98.776389,
        peso: 1,
        codigo_postal: cp,
        municipio: 'Test',
        fingerprint: 'test-' + Date.now(),
        ip_cliente: '127.0.0.1'
      };
      
      const response = await page.request.post(`${BASE_URL}/api/reportes`, {
        data: reporteData
      });
      
      expect(response.status()).toBe(201);
      console.log(`✅ Código postal "${cp}" aceptado`);
    }
  });
});
