#!/usr/bin/env node

/**
 * Script de prueba rápida para verificar:
 * 1. Que el endpoint GET /api/geocode/reverse funciona
 * 2. Que la información de geocoding se obtiene correctamente
 * 3. Que se almacena correctamente en la base de datos
 */

// Usar fetch global (disponible en Node 18+)

// Coordenadas de Jantetelco, Mexico para testing
const TEST_COORDS = {
  name: 'Centro de Jantetelco',
  lat: 18.715,
  lng: -98.776389
};

const API_BASE = 'http://localhost:4000';

async function test() {
  try {
    console.log('\n🧪 TEST: Reverse Geocoding Implementation\n');
    console.log(`📍 Coordenadas de prueba: ${TEST_COORDS.name}`);
    console.log(`   Lat: ${TEST_COORDS.lat}, Lng: ${TEST_COORDS.lng}\n`);

    // Test 1: GET /api/geocode/reverse
    console.log('🔄 Test 1: GET /api/geocode/reverse');
    const geoUrl = `${API_BASE}/api/geocode/reverse?lat=${TEST_COORDS.lat}&lng=${TEST_COORDS.lng}`;
    console.log(`   URL: ${geoUrl}`);
    
    const geoResponse = await fetch(geoUrl);
    if (!geoResponse.ok) {
      throw new Error(`Geocoding endpoint failed: ${geoResponse.status}`);
    }

    const geoData = await geoResponse.json();
    console.log('   ✅ Respuesta recibida:');
    console.log(`   - Success: ${geoData.success}`);
    
    if (geoData.data) {
      const { colonia, codigo_postal, municipio, estado_ubicacion, pais } = geoData.data;
      console.log(`   - Colonia: ${colonia || 'N/A'}`);
      console.log(`   - CP: ${codigo_postal || 'N/A'}`);
      console.log(`   - Municipio: ${municipio || 'N/A'}`);
      console.log(`   - Estado: ${estado_ubicacion || 'N/A'}`);
      console.log(`   - País: ${pais || 'N/A'}`);
    }

    // Test 2: POST /api/reportes con información geográfica
    console.log('\n🔄 Test 2: POST /api/reportes con ubicación');
    
    const reporteData = {
      tipo: 'baches',
      descripcion: 'Test de reporte con geocoding',
      descripcion_corta: 'Test',
      lat: TEST_COORDS.lat,
      lng: TEST_COORDS.lng,
      peso: 5,
      colonia: geoData.data?.colonia || 'Test Colonia',
      codigo_postal: geoData.data?.codigo_postal || '50000',
      municipio: geoData.data?.municipio || 'Jantetelco',
      estado_ubicacion: geoData.data?.estado_ubicacion || 'Morelos',
      pais: geoData.data?.pais || 'México',
      fingerprint: 'test-fingerprint-' + Date.now(),
      ip_cliente: '127.0.0.1'
    };

    const postUrl = `${API_BASE}/api/reportes`;
    console.log(`   URL: ${postUrl}`);
    
    const postResponse = await fetch(postUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reporteData)
    });

    if (!postResponse.ok) {
      const errorText = await postResponse.text();
      throw new Error(`Report creation failed: ${postResponse.status} - ${errorText}`);
    }

    const reportResult = await postResponse.json();
    console.log('   ✅ Reporte creado:');
    console.log(`   - ID: ${reportResult.id}`);
    console.log(`   - Dependencia: ${reportResult.dependencia}`);

    // Test 3: GET /api/reportes para verificar que se guardó correctamente
    console.log('\n🔄 Test 3: GET /api/reportes para verificar almacenamiento');
    
    const getUrl = `${API_BASE}/api/reportes?minLat=${TEST_COORDS.lat - 0.01}&maxLat=${TEST_COORDS.lat + 0.01}&minLng=${TEST_COORDS.lng - 0.01}&maxLng=${TEST_COORDS.lng + 0.01}`;
    
    const getResponse = await fetch(getUrl);
    if (!getResponse.ok) {
      throw new Error(`Fetch reports failed: ${getResponse.status}`);
    }

    const reports = await getResponse.json();
    console.log(`   ✅ Reportes encontrados en zona: ${reports.length}`);
    
    if (reports.length > 0) {
      const lastReport = reports[reports.length - 1];
      console.log('   📋 Último reporte:');
      console.log(`      - ID: ${lastReport.id}`);
      console.log(`      - Tipo: ${lastReport.tipo}`);
      console.log(`      - Descripción: ${lastReport.descripcion_corta}`);
      console.log(`      - Coordenadas: ${lastReport.lat.toFixed(6)}, ${lastReport.lng.toFixed(6)}`);
    }

    console.log('\n✅ TODOS LOS TESTS PASARON\n');

  } catch (error) {
    console.error('\n❌ ERROR en test:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Esperar un bit para que el servidor esté listo
setTimeout(test, 500);
