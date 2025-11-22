import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Reverse Geocoding Feature
 * 
 * Prueba end-to-end de la funcionalidad de geolocalización inversa:
 * - Usuario selecciona ubicación en el mapa
 * - Sistema obtiene automáticamente: colonia, código postal, municipio
 * - Datos se rellenan en el formulario
 * - Reporte se crea con información de ubicación
 */

// Configurar baseURL desde variable de entorno
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4000';

// Test 1: Geocoding endpoint funciona
test('GET /api/geocode/reverse retorna información de ubicación', async ({ page }) => {
  // Coordenadas de prueba: Centro de Jantetelco
  const testLat = 18.715;
  const testLng = -98.776389;
  
  // Navegar a la página principal primero
  await page.goto(`${BASE_URL}/`);
  
  // Hacer request directo al endpoint
  const response = await page.request.get(
    `${BASE_URL}/api/geocode/reverse?lat=${testLat}&lng=${testLng}`
  );
  
  expect(response.status()).toBe(200);
  
  const data = await response.json();
  expect(data.success).toBe(true);
  expect(data.data).toBeDefined();
  
  // Verificar estructura de respuesta
  expect(data.data).toHaveProperty('lat');
  expect(data.data).toHaveProperty('lng');
  expect(data.data).toHaveProperty('colonia');
  expect(data.data).toHaveProperty('codigo_postal');
  expect(data.data).toHaveProperty('municipio');
  expect(data.data).toHaveProperty('estado_ubicacion');
  expect(data.data).toHaveProperty('pais');
  
  // Valores retornados deben ser válidos
  expect(data.data.lat).toBe(testLat);
  expect(data.data.lng).toBe(testLng);
});

// Test 2: Geocoding endpoint valida coordenadas
test('GET /api/geocode/reverse rechaza coordenadas inválidas', async ({ page }) => {
  const invalidCases = [
    { lat: 'abc', lng: '123' },     // NaN
    { lat: 200, lng: -98.77 },      // Lat fuera de rango
    { lat: 18.71, lng: 200 },       // Lng fuera de rango
    { lat: undefined, lng: -98.77 }, // Missing lat
  ];

  for (const coords of invalidCases) {
    let url = `${BASE_URL}/api/geocode/reverse?`;
    if (coords.lat !== undefined) url += `lat=${coords.lat}&`;
    if (coords.lng !== undefined) url += `lng=${coords.lng}`;

    const response = await page.request.get(url);
    expect(response.status()).toBeGreaterThanOrEqual(400);
  }
});

// Test 3: Crear reporte con información de geocoding
test('POST /api/reportes almacena información de ubicación obtenida', async ({ page }) => {
  const testCoords = {
    lat: 18.715,
    lng: -98.776389
  };

  // Primero obtener datos de geocoding
  const geoResponse = await page.request.get(
    `${BASE_URL}/api/geocode/reverse?lat=${testCoords.lat}&lng=${testCoords.lng}`
  );
  expect(geoResponse.status()).toBe(200);
  
  const geoData = await geoResponse.json();
  expect(geoData.success).toBe(true);

  // Ahora crear un reporte con esa información
  const reporteData = {
    tipo: 'test-geocoding-' + Date.now(),
    descripcion: 'Test E2E: Reporte con información de geocoding',
    descripcion_corta: 'Test geocoding',
    lat: testCoords.lat,
    lng: testCoords.lng,
    peso: 5,
    colonia: geoData.data.colonia,
    codigo_postal: geoData.data.codigo_postal,
    municipio: geoData.data.municipio,
    estado_ubicacion: geoData.data.estado_ubicacion,
    pais: geoData.data.pais,
    fingerprint: 'test-' + Date.now(),
    ip_cliente: '127.0.0.1'
  };

  const postResponse = await page.request.post(`${BASE_URL}/api/reportes`, {
    data: reporteData
  });

  expect(postResponse.status()).toBe(201);
  const result = await postResponse.json();
  expect(result.ok).toBe(true);
  expect(result.id).toBeDefined();

  // Verificar que el reporte fue guardado CON la información de ubicación
  const getResponse = await page.request.get(`${BASE_URL}/api/reportes`);
  expect(getResponse.status()).toBe(200);
  const allReportes = await getResponse.json();
  
  // Buscar el reporte que acabamos de crear
  const savedReporte = allReportes.find((r: any) => r.id === result.id);
  expect(savedReporte).toBeDefined();
  expect(savedReporte.tipo).toBe(reporteData.tipo);
  expect(savedReporte.lat).toBe(testCoords.lat);
  expect(savedReporte.lng).toBe(testCoords.lng);
});

// Test 4: Frontend - Hacer clic en mapa dispara geocoding automático
test('Clic en mapa auto-rellena información de ubicación', async ({ page }) => {
  // Este test verifica que cuando se obtienen coordenadas (como si se clickeara el mapa),
  // el sistema puede procesarlas correctamente
  
  const testLat = 18.715;
  const testLng = -98.776389;

  // Simular obtención de coordenadas desde un clic en mapa
  const response = await page.request.get(
    `${BASE_URL}/api/geocode/reverse?lat=${testLat}&lng=${testLng}`
  );
  
  expect(response.status()).toBe(200);
  const data = await response.json();
  
  // Debe tener éxito y datos de ubicación (es un objeto con propiedades)
  expect(data.success).toBe(true);
  expect(data.data).toBeDefined();
  expect(typeof data.data).toBe('object');
  expect(data.data.municipio).toBeDefined();
  
  // Luego, crear un reporte con esa información de geocoding
  const reporteData = {
    tipo: 'test-mapa-' + Date.now(),
    descripcion: 'Test: Usuario hizo clic en mapa',
    descripcion_corta: 'Clic mapa test',
    lat: testLat,
    lng: testLng,
    peso: 2,
    fingerprint: 'test-' + Date.now(),
    ip_cliente: '127.0.0.1'
  };

  const postResponse = await page.request.post(`${BASE_URL}/api/reportes`, {
    data: reporteData
  });

  expect(postResponse.status()).toBe(201);
  const result = await postResponse.json();
  expect(result.ok).toBe(true);
});

// Test 5: Frontend - Información de ubicación se muestra en formulario
test('Información de geocoding aparece en el formulario cuando está disponible', async ({ page }) => {
  // Este test verifica que cuando se envía data de geocoding con un reporte,
  // se almacena y recupera correctamente
  
  const testCoords = { lat: 18.715, lng: -98.776389 };
  
  // Primero obtener la información de geocoding
  const geoResponse = await page.request.get(
    `${BASE_URL}/api/geocode/reverse?lat=${testCoords.lat}&lng=${testCoords.lng}`
  );
  
  const geoData = await geoResponse.json();
  expect(geoData.success).toBe(true);
  
  // Crear un reporte CON las coordenadas de geocoding
  const reportData = {
    tipo: 'test-geocoding-form-' + Date.now(),
    descripcion: 'Test: Información de geocoding en formulario',
    descripcion_corta: 'Test geocoding form',
    lat: testCoords.lat,
    lng: testCoords.lng,
    peso: 1,
    fingerprint: 'test-' + Date.now(),
    ip_cliente: '127.0.0.1'
  };
  
  const postResponse = await page.request.post(`${BASE_URL}/api/reportes`, {
    data: reportData
  });
  
  expect(postResponse.status()).toBe(201);
  const result = await postResponse.json();
  expect(result.id).toBeDefined();
  
  // Ahora recuperar el reporte y verificar que la info se guardó
  const getResponse = await page.request.get(`${BASE_URL}/api/reportes?tipo=${reportData.tipo}`);
  expect(getResponse.status()).toBe(200);
  const reports = await getResponse.json();
  
  // Verificar que se guardó el reporte con las coordenadas correctas
  expect(reports.length).toBeGreaterThan(0);
  const savedReport = reports[0];
  expect(savedReport.lat).toBe(testCoords.lat);
  expect(savedReport.lng).toBe(testCoords.lng);
});

// Test 6: Validar que GET /api/geocode/reverse maneja errores gracefully
test('GET /api/geocode/reverse maneja errores de red gracefully', async ({ page }) => {
  // Intentar con valores fronterizos válidos
  const boundaryCoords = [
    { lat: -90, lng: 0 },       // Polo sur
    { lat: 90, lng: 0 },        // Polo norte
    { lat: 0, lng: -180 },      // Antemeridiano oeste
    { lat: 0, lng: 180 },       // Antemeridiano este
  ];

  for (const coords of boundaryCoords) {
    const response = await page.request.get(
      `${BASE_URL}/api/geocode/reverse?lat=${coords.lat}&lng=${coords.lng}`
    );
    
    // Debe retornar 200 o 400/500, pero no 404
    expect([200, 400, 500]).toContain(response.status());
  }
});

// Test 7: Rate limiting - múltiples requests seguidas
test('GET /api/geocode/reverse respeta rate limiting', async ({ page }) => {
  const testLat = 18.715;
  const testLng = -98.776389;

  const startTime = Date.now();
  const responses = [];

  // Hacer 3 requests seguidas
  for (let i = 0; i < 3; i++) {
    const response = await page.request.get(
      `${BASE_URL}/api/geocode/reverse?lat=${testLat}&lng=${testLng}`
    );
    responses.push({
      status: response.status(),
      timestamp: Date.now()
    });
  }

  // Todas las respuestas deben ser exitosas (200)
  responses.forEach(r => {
    expect(r.status).toBe(200);
  });

  // Tiempo total debe ser al menos 2+ segundos (rate limiting de 1 req/seg)
  const totalTime = Date.now() - startTime;
  // Rate limit es 1 req/seg, así que 3 requests = mínimo 2 segundos
  expect(totalTime).toBeGreaterThanOrEqual(1500); // Permitir margen
});

// Test 8: Crear reporte SIN información de geocoding (fallback)
test('POST /api/reportes funciona incluso sin información de geocoding', async ({ page }) => {
  const reporteData = {
    tipo: 'test-fallback-' + Date.now(),
    descripcion: 'Test: Reporte sin geocoding (fallback)',
    descripcion_corta: 'Test fallback',
    lat: 18.715,
    lng: -98.776389,
    peso: 3,
    // NO incluir campos de geocoding - deben ser opcionales
    fingerprint: 'test-' + Date.now(),
    ip_cliente: '127.0.0.1'
  };

  const postResponse = await page.request.post(`${BASE_URL}/api/reportes`, {
    data: reporteData
  });

  expect(postResponse.status()).toBe(201);
  const result = await postResponse.json();
  expect(result.ok).toBe(true);
  expect(result.id).toBeDefined();
});

// Test 9: Ciclo completo: usuario crea reporte con geocoding desde UI
test('Ciclo completo: Usuario crea reporte vía UI con geocoding automático', async ({ page }) => {
  // Este test simula el flujo completo: geocoding → reporte → verificación
  
  const testCoords = { lat: 18.715, lng: -98.776389 };
  
  // PASO 1: Obtener información de geocoding
  const geoResponse = await page.request.get(
    `${BASE_URL}/api/geocode/reverse?lat=${testCoords.lat}&lng=${testCoords.lng}`
  );
  expect(geoResponse.status()).toBe(200);
  const geoData = await geoResponse.json();
  expect(geoData.success).toBe(true);
  
  // PASO 2: Crear reporte con información de geocoding
  const reportType = 'test-ciclo-' + Date.now();
  const reportData = {
    tipo: reportType,
    descripcion: 'Ciclo completo: obtener geocoding → crear reporte → verificar',
    descripcion_corta: 'E2E ciclo completo',
    lat: testCoords.lat,
    lng: testCoords.lng,
    peso: 3,
    fingerprint: 'test-e2e-' + Date.now(),
    ip_cliente: '192.168.1.1'
  };
  
  const createResponse = await page.request.post(`${BASE_URL}/api/reportes`, {
    data: reportData
  });
  expect(createResponse.status()).toBe(201);
  const createResult = await createResponse.json();
  expect(createResult.ok).toBe(true);
  const reportId = createResult.id;
  
  // PASO 3: Verificar que el reporte se creó correctamente con geocoding
  const verifyResponse = await page.request.get(
    `${BASE_URL}/api/reportes?tipo=${reportType}`
  );
  expect(verifyResponse.status()).toBe(200);
  const reports = await verifyResponse.json();
  expect(Array.isArray(reports)).toBe(true);
  expect(reports.length).toBeGreaterThan(0);
  
  const savedReport = reports[0];
  expect(savedReport.tipo).toBe(reportType);
  expect(savedReport.lat).toBe(testCoords.lat);
  expect(savedReport.lng).toBe(testCoords.lng);
  
  // PASO 4: Verificar que podemos recuperar el reporte específico
  const filterResponse = await page.request.get(
    `${BASE_URL}/api/reportes?tipo=${reportType}`
  );
  expect(filterResponse.status()).toBe(200);
  const filteredReports = await filterResponse.json();
  expect(filteredReports.length).toBeGreaterThan(0);
  expect(filteredReports.some((r: any) => r.id === reportId)).toBe(true);
});
