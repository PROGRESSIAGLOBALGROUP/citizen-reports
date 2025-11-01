#!/usr/bin/env node
/**
 * Verificación final de las correcciones aplicadas
 */

import { getDb } from './db.js';

console.log('🔍 Verificación de correcciones aplicadas\n');

const db = getDb();

// 1. Verificar reclasificación
console.log('📋 1. RECLASIFICACIÓN DE REPORTES VIALES:');
console.log('─'.repeat(60));

db.all('SELECT id, tipo, descripcion FROM reportes WHERE id IN (3, 9)', [], (err, rows) => {
  if (err) {
    console.error('❌ Error:', err);
    db.close();
    return;
  }

  rows.forEach((r) => {
    const emoji = r.tipo === 'baches' ? '✅' : '❌';
    console.log(`${emoji} ID ${r.id} | Tipo: "${r.tipo}"`);
    console.log(`   Descripción: ${r.descripcion}`);
  });

  // 2. Verificar totales
  console.log('\n📊 2. ESTADÍSTICAS GENERALES:');
  console.log('─'.repeat(60));

  db.get('SELECT COUNT(*) as total FROM reportes', [], (countErr, countRow) => {
    if (!countErr) {
      console.log(`Total de reportes: ${countRow.total}`);
      
      const esperado = countRow.total >= 70;
      const emoji = esperado ? '✅' : '⚠️';
      console.log(`${emoji} Objetivo ~70 registros: ${esperado ? 'CUMPLIDO' : 'PENDIENTE'}`);
    }

    // 3. Distribución geográfica
    console.log('\n🗺️  3. DISTRIBUCIÓN GEOGRÁFICA:');
    console.log('─'.repeat(60));

    db.all(
      `SELECT 
        MIN(lat) as lat_min, 
        MAX(lat) as lat_max,
        MIN(lng) as lng_min,
        MAX(lng) as lng_max,
        COUNT(*) as total
      FROM reportes`,
      [],
      (geoErr, geoRows) => {
        if (!geoErr && geoRows[0]) {
          const geo = geoRows[0];
          console.log(`Latitud: ${geo.lat_min.toFixed(4)} a ${geo.lat_max.toFixed(4)}`);
          console.log(`Longitud: ${geo.lng_min.toFixed(4)} a ${geo.lng_max.toFixed(4)}`);
          console.log(`Total puntos: ${geo.total}`);
        }

        // 4. Distribución por tipo
        console.log('\n📊 4. DISTRIBUCIÓN POR TIPO:');
        console.log('─'.repeat(60));

        db.all(
          'SELECT tipo, COUNT(*) as count FROM reportes GROUP BY tipo ORDER BY count DESC',
          [],
          (distErr, distRows) => {
            if (!distErr && distRows) {
              let total = 0;
              distRows.forEach((d) => (total += d.count));

              distRows.forEach((d) => {
                const percentage = ((d.count / total) * 100).toFixed(1);
                const bar = '█'.repeat(Math.round(d.count / 2));
                console.log(`${d.tipo.padEnd(12)} : ${String(d.count).padStart(3)} (${percentage.padStart(5)}%) ${bar}`);
              });
            }

            console.log('\n' + '═'.repeat(60));
            console.log('✅ VERIFICACIÓN COMPLETADA');
            console.log('═'.repeat(60));

            db.close();
          }
        );
      }
    );
  });
});
