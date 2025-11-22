/**
 * Test: POST /api/reportes con campos de ubicación (colonia, código postal, municipio, estado)
 * Valida que el fix de db.close() permite que los datos se guarden correctamente
 */

import { test, expect } from '@playwright/test';

test.describe('POST /api/reportes - Crear reporte con ubicación', () => {
  test('debe crear reporte exitosamente con datos de ubicación', async ({ page }) => {
    // Crear reporte con todos los campos incluido ubicación
    const reporteData = {
      tipo: 'baches',
      descripcion: 'Reporte test con ubicación',
      descripcion_corta: 'Test ubicación',
      lat: 18.715,
      lng: -98.776389,
      peso: 1,
      fingerprint: 'test-fp-' + Date.now(),
      ip_cliente: '127.0.0.1',
      colonia: 'Santa Lucia',
      codigo_postal: '62935',
      municipio: 'Jantetelco',
      estado_ubicacion: 'Morelos'
    };

    const response = await page.request.post('http://localhost:4000/api/reportes', {
      data: reporteData
    });

    console.log('📤 Response status:', response.status());
    console.log('📦 Response body:', await response.json());

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('ok', true);
    expect(body).toHaveProperty('id');
    expect(body.id).toBeGreaterThan(0);

    console.log(`✅ Reporte creado exitosamente ID: ${body.id}`);
  });

  test('debe guardar colonia, código postal, municipio y estado correctamente', async ({ page }) => {
    const reporteData = {
      tipo: 'agua',
      descripcion: 'Fuga de agua',
      lat: 19.432600,
      lng: -99.133200,
      colonia: 'Centro',
      codigo_postal: '06060',
      municipio: 'Ciudad de México',
      estado_ubicacion: 'Ciudad de México'
    };

    // 1. Crear reporte
    const createResponse = await page.request.post('http://localhost:4000/api/reportes', {
      data: reporteData
    });

    expect(createResponse.status()).toBe(201);
    const createdReporte = await createResponse.json();
    const reporteId = createdReporte.id;

    console.log(`✅ Reporte creado ID: ${reporteId}`);

    // 2. Recuperar reporte
    const getResponse = await page.request.get(`http://localhost:4000/api/reportes`);
    expect(getResponse.status()).toBe(200);
    const reportes = await getResponse.json();

    // 3. Buscar nuestro reporte en la lista
    const miReporte = reportes.find(r => r.id === reporteId);
    expect(miReporte).toBeDefined();
    expect(miReporte.colonia).toBe('Centro');
    expect(miReporte.codigo_postal).toBe('06060');
    expect(miReporte.municipio).toBe('Ciudad de México');
    expect(miReporte.estado_ubicacion).toBe('Ciudad de México');

    console.log('📋 Reporte recuperado:', {
      colonia: miReporte.colonia,
      codigo_postal: miReporte.codigo_postal,
      municipio: miReporte.municipio,
      estado_ubicacion: miReporte.estado_ubicacion
    });

    console.log('✅ Todos los campos de ubicación guardados correctamente');
  });
});
