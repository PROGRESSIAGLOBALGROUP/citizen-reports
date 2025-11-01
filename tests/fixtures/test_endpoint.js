// Test simple para verificar que el endpoint recibe los datos
// Ejecutar: node test_endpoint.js

import http from 'http';

const data = JSON.stringify({
  tipo: 'seguridad',
  descripcion: 'Test directo de endpoint',
  descripcionCorta: 'Test directo',
  lat: 18.716,
  lng: -98.776,
  peso: 1,
  fingerprint: 'direct_test_123',
  sesionId: 'sess_direct_001',
  userAgent: 'node-test-agent'
});

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/reportes',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🧪 Enviando test directo al endpoint...');
console.log('📤 Datos:', JSON.parse(data));

const req = http.request(options, (res) => {
  let result = '';
  
  res.on('data', (chunk) => {
    result += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📨 Respuesta del servidor:');
    console.log('Status:', res.statusCode);
    console.log('Body:', result);
    
    try {
      const parsed = JSON.parse(result);
      console.log('\n✅ Respuesta parseada:', parsed);
      
      if (parsed.esNuevo !== undefined) {
        console.log('🎯 Sistema de detección funcionando');
      } else {
        console.log('⚠️  Campos de verificación no presentes');
      }
    } catch (e) {
      console.log('❌ Error al parsear respuesta:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Error de conexión:', e.message);
});

req.write(data);
req.end();