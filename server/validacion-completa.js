#!/usr/bin/env node
/**
 * Script de validación completa post-cambios
 * Verifica que todas las correcciones se aplicaron correctamente
 */

import { getDb } from './db.js';
import http from 'http';

const TESTS = {
  passed: 0,
  failed: 0,
  tests: [],
};

function test(name, condition, actual, expected) {
  const pass = condition;
  TESTS.tests.push({ name, pass, actual, expected });
  if (pass) {
    TESTS.passed++;
    console.log(`✅ ${name}`);
  } else {
    TESTS.failed++;
    console.log(`❌ ${name}`);
    console.log(`   Esperado: ${expected}`);
    console.log(`   Actual: ${actual}`);
  }
}

console.log('🧪 Iniciando validación completa...\n');
console.log('═'.repeat(70));

// Test 1: Verificar total de registros
const db = getDb();

db.get('SELECT COUNT(*) as count FROM reportes', [], (err, row) => {
  if (err) {
    console.error('❌ Error de DB:', err);
    process.exit(1);
  }

  const total = row.count;
  test('Total de registros >= 70', total >= 70, total, '>=70');

  // Test 2: Verificar reclasificación ID 3
  db.get('SELECT tipo FROM reportes WHERE id = 3', [], (err3, row3) => {
    if (!err3 && row3) {
      test('ID 3 reclasificado a "baches"', row3.tipo === 'baches', row3.tipo, 'baches');
    }

    // Test 3: Verificar reclasificación ID 9
    db.get('SELECT tipo FROM reportes WHERE id = 9', [], (err9, row9) => {
      if (!err9 && row9) {
        test('ID 9 reclasificado a "baches"', row9.tipo === 'baches', row9.tipo, 'baches');
      }

      // Test 4: Verificar distribución de baches
      db.get('SELECT COUNT(*) as count FROM reportes WHERE tipo = ?', ['baches'], (errB, rowB) => {
        if (!errB && rowB) {
          test('Cantidad de baches >= 25', rowB.count >= 25, rowB.count, '>=25');
        }

        // Test 5: Verificar distribución geográfica
        db.get(
          'SELECT MAX(lat) - MIN(lat) as lat_range, MAX(lng) - MIN(lng) as lng_range FROM reportes',
          [],
          (errGeo, rowGeo) => {
            if (!errGeo && rowGeo) {
              const latRange = rowGeo.lat_range;
              const lngRange = rowGeo.lng_range;
              test('Rango latitud >= 0.02', latRange >= 0.02, latRange.toFixed(4), '>=0.02');
              test('Rango longitud >= 0.02', lngRange >= 0.02, lngRange.toFixed(4), '>=0.02');
            }

            // Test 6: Verificar API endpoint
            console.log('\n' + '═'.repeat(70));
            console.log('🌐 Verificando API...\n');

            const options = {
              hostname: 'localhost',
              port: 4000,
              path: '/api/reportes',
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
                  test('API devuelve >= 70 reportes', reportes.length >= 70, reportes.length, '>=70');
                  test('API status code 200', res.statusCode === 200, res.statusCode, 200);

                  // Verificar que IDs 3 y 9 son "baches"
                  const id3 = reportes.find((r) => r.id === 3);
                  const id9 = reportes.find((r) => r.id === 9);

                  if (id3) {
                    test('API: ID 3 tipo "baches"', id3.tipo === 'baches', id3.tipo, 'baches');
                  }
                  if (id9) {
                    test('API: ID 9 tipo "baches"', id9.tipo === 'baches', id9.tipo, 'baches');
                  }

                  // Test 7: Verificar GeoJSON
                  testGeoJSON();
                } catch (parseErr) {
                  console.error('❌ Error parsing API response:', parseErr.message);
                  printSummary();
                }
              });
            });

            req.on('error', (reqErr) => {
              console.error('❌ Error de red:', reqErr.message);
              printSummary();
            });

            req.end();
          }
        );
      });
    });
  });
});

function testGeoJSON() {
  const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/reportes/geojson',
    method: 'GET',
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const geojson = JSON.parse(data);
        test('GeoJSON tiene features >= 70', geojson.features.length >= 70, geojson.features.length, '>=70');
        test('GeoJSON type es FeatureCollection', geojson.type === 'FeatureCollection', geojson.type, 'FeatureCollection');
      } catch (parseErr) {
        console.error('❌ Error parsing GeoJSON:', parseErr.message);
      } finally {
        printSummary();
      }
    });
  });

  req.on('error', (reqErr) => {
    console.error('❌ Error de red GeoJSON:', reqErr.message);
    printSummary();
  });

  req.end();
}

function printSummary() {
  db.close();

  console.log('\n' + '═'.repeat(70));
  console.log('📊 RESUMEN DE VALIDACIÓN');
  console.log('═'.repeat(70));
  console.log(`✅ Tests pasados: ${TESTS.passed}`);
  console.log(`❌ Tests fallidos: ${TESTS.failed}`);
  console.log(`📊 Total: ${TESTS.tests.length}`);

  if (TESTS.failed === 0) {
    console.log('\n🎉 ¡TODAS LAS VALIDACIONES PASARON! 🎉');
    console.log('\n📝 Próximos pasos:');
    console.log('   1. Abrir http://localhost:5173 en el navegador');
    console.log('   2. Verificar que se muestran ~80 reportes');
    console.log('   3. Confirmar que "Semáforo" y "Señalización" están en "Baches"');
    console.log('   4. Revisar distribución geográfica en el mapa');
    process.exit(0);
  } else {
    console.log('\n⚠️  Algunos tests fallaron. Revisar arriba para detalles.');
    process.exit(1);
  }
}
