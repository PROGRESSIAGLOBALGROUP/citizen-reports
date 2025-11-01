#!/usr/bin/env node
/**
 * Validación final: Verificar que NO aparecen advertencias incorrectas
 */

import http from 'http';

console.log('🔍 VALIDACIÓN FINAL - Corrección de Advertencias');
console.log('═'.repeat(70));
console.log();

// Test 1: Verificar respuesta del backend
console.log('1️⃣  Probando respuesta del backend...');

const testReporte = {
  tipo: 'limpieza',
  descripcion: 'Validación final del sistema',
  lat: 18.716,
  lng: -98.776,
  peso: 1,
  fingerprint: 'validation-test-fingerprint',
  ip_cliente: '127.0.0.1',
};

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
      
      let todoCorrecto = true;
      
      // Verificaciones críticas
      if (!resultado.ok) {
        console.log('   ❌ Reporte NO creado');
        todoCorrecto = false;
      } else {
        console.log('   ✅ Reporte creado exitosamente');
      }
      
      if (!resultado.id) {
        console.log('   ❌ ID no presente en respuesta');
        todoCorrecto = false;
      } else {
        console.log(`   ✅ ID asignado: ${resultado.id}`);
      }
      
      // Verificar que NO existen campos de duplicados
      if (resultado.esNuevo !== undefined) {
        console.log('   ❌ ERROR: Campo "esNuevo" presente');
        console.log('      → Frontend interpretará esto incorrectamente');
        todoCorrecto = false;
      } else {
        console.log('   ✅ Campo "esNuevo" ausente (correcto)');
      }
      
      if (resultado.advertencias !== undefined) {
        console.log('   ❌ ERROR: Campo "advertencias" presente');
        console.log('      → Se mostrarán advertencias incorrectas');
        todoCorrecto = false;
      } else {
        console.log('   ✅ Campo "advertencias" ausente (correcto)');
      }
      
      if (resultado.reportesSimilares !== undefined) {
        console.log('   ❌ ERROR: Campo "reportesSimilares" presente');
        todoCorrecto = false;
      } else {
        console.log('   ✅ Campo "reportesSimilares" ausente (correcto)');
      }
      
      console.log();
      console.log('2️⃣  Validando estructura de respuesta...');
      console.log('   Campos presentes:', Object.keys(resultado).join(', '));
      console.log('   Campos esperados: ok, id, dependencia');
      
      const camposEsperados = ['ok', 'id', 'dependencia'];
      const camposPresentes = Object.keys(resultado);
      const soloEsperados = camposPresentes.every((c) => camposEsperados.includes(c));
      
      if (soloEsperados && camposPresentes.length === 3) {
        console.log('   ✅ Estructura correcta');
      } else {
        console.log('   ⚠️  Campos adicionales o faltantes detectados');
        todoCorrecto = false;
      }
      
      console.log();
      console.log('═'.repeat(70));
      
      if (todoCorrecto) {
        console.log('🎉 ¡VALIDACIÓN EXITOSA!');
        console.log();
        console.log('✅ El sistema ahora funciona correctamente:');
        console.log('   • Backend envía respuesta limpia sin campos de duplicados');
        console.log('   • Frontend NO mostrará advertencias incorrectas');
        console.log('   • Mensaje será: "¡Reporte enviado exitosamente! ID: X"');
        console.log();
        console.log('📝 Siguiente paso:');
        console.log('   1. Abrir http://localhost:5173/#reportar');
        console.log('   2. Enviar un reporte de prueba');
        console.log('   3. Verificar que SOLO aparece mensaje de éxito');
        console.log('   4. NO debe aparecer: "Detectamos reportes similares..."');
      } else {
        console.log('⚠️  VALIDACIÓN FALLÓ');
        console.log('   Revisar errores arriba');
      }
      
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
