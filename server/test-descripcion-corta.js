#!/usr/bin/env node
/**
 * Prueba: Verificar que API devuelve descripcion_corta
 */

import http from 'http';

console.log('🧪 Verificando descripcion_corta en API...\n');

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/reportes?id=84',
  method: 'GET',
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const reportes = JSON.parse(data);
      
      if (reportes.length === 0) {
        console.log('⚠️  No se encontró el reporte ID 84');
        console.log('   Probando con cualquier reporte...\n');
        
        // Probar con endpoint general
        testGeneral();
        return;
      }
      
      const reporte = reportes[0];
      
      console.log('📋 Reporte de prueba (ID 84 - "Agua y Drenaje"):');
      console.log(`   ID: ${reporte.id}`);
      console.log(`   Tipo: ${reporte.tipo}`);
      console.log(`   Descripción completa: "${reporte.descripcion}"`);
      console.log(`   Descripción corta: "${reporte.descripcion_corta || 'NO PRESENTE'}"`);
      
      console.log('\n✅ Verificaciones:');
      
      if (reporte.descripcion_corta !== undefined) {
        console.log('   ✅ Campo descripcion_corta presente en respuesta');
      } else {
        console.log('   ❌ Campo descripcion_corta NO presente');
      }
      
      if (reporte.descripcion_corta && reporte.descripcion_corta !== reporte.descripcion) {
        console.log('   ℹ️  Descripción corta es diferente a la completa (correcto)');
      } else {
        console.log('   ℹ️  Descripción corta es igual a la completa (registros dummy)');
      }
      
      console.log('\n📝 En el mapa se mostrará:');
      console.log(`   "${reporte.descripcion_corta || reporte.descripcion}"`);
      console.log('\n💡 La descripción completa solo se muestra a funcionarios en otra pantalla.');
      
    } catch (err) {
      console.error('❌ Error:', err.message);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Error de red:', err.message);
});

req.end();

function testGeneral() {
  const optionsGen = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/reportes',
    method: 'GET',
  };

  const reqGen = http.request(optionsGen, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const reportes = JSON.parse(data);
        
        if (reportes.length === 0) {
          console.log('❌ No hay reportes en la base de datos');
          return;
        }
        
        const reporte = reportes[0];
        
        console.log('📋 Primer reporte en DB:');
        console.log(`   ID: ${reporte.id}`);
        console.log(`   Tipo: ${reporte.tipo}`);
        console.log(`   Descripción: "${reporte.descripcion}"`);
        console.log(`   Descripción corta: "${reporte.descripcion_corta || 'NO PRESENTE'}"`);
        
        if (reporte.descripcion_corta !== undefined) {
          console.log('\n✅ Campo descripcion_corta presente en API');
          console.log('✅ El mapa mostrará solo la descripción corta en popups');
        } else {
          console.log('\n❌ Campo descripcion_corta NO presente');
        }
        
      } catch (err) {
        console.error('❌ Error:', err.message);
      }
    });
  });

  reqGen.on('error', (err) => {
    console.error('❌ Error de red:', err.message);
  });

  reqGen.end();
}
