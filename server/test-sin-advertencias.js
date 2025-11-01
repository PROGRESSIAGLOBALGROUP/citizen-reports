#!/usr/bin/env node
/**
 * Prueba de envío de reporte sin detección de duplicados
 * Verifica que el backend NO devuelve advertencias incorrectas
 */

import http from 'http';

const testReporte = {
  tipo: 'baches',
  descripcion: 'Test de reporte sin advertencia de duplicados',
  lat: 18.715,
  lng: -98.777,
  peso: 1,
  fingerprint: 'test-fingerprint-12345',
  ip_cliente: '127.0.0.1',
};

console.log('🧪 Probando envío de reporte...\n');

const postData = JSON.stringify(testReporte);

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/reportes',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const resultado = JSON.parse(data);
      
      console.log('📊 Respuesta del servidor:');
      console.log(JSON.stringify(resultado, null, 2));
      
      // Verificaciones
      console.log('\n✅ Tests:');
      
      if (resultado.ok) {
        console.log('  ✅ Reporte creado exitosamente');
      } else {
        console.log('  ❌ Fallo al crear reporte');
      }
      
      if (resultado.id) {
        console.log(`  ✅ ID del reporte: ${resultado.id}`);
      }
      
      if (resultado.esNuevo !== undefined) {
        console.log('  ❌ ERROR: Campo "esNuevo" presente (debería estar ausente)');
      } else {
        console.log('  ✅ Campo "esNuevo" ausente (correcto)');
      }
      
      if (resultado.advertencias) {
        console.log('  ❌ ERROR: Campo "advertencias" presente (debería estar ausente)');
      } else {
        console.log('  ✅ Campo "advertencias" ausente (correcto)');
      }
      
      if (resultado.reportesSimilares !== undefined) {
        console.log('  ❌ ERROR: Campo "reportesSimilares" presente (debería estar ausente)');
      } else {
        console.log('  ✅ Campo "reportesSimilares" ausente (correcto)');
      }
      
      console.log('\n🎉 ¡Prueba completada!');
      console.log('💡 Ahora el frontend NO mostrará advertencias incorrectas');
      
    } catch (err) {
      console.error('❌ Error parsing JSON:', err.message);
      console.log('Respuesta cruda:', data);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Error de red:', err.message);
  console.log('\n💡 Asegúrate de que el servidor esté corriendo:');
  console.log('   .\start-simple.ps1');
});

req.write(postData);
req.end();
