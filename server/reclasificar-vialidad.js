#!/usr/bin/env node
/**
 * Reclasifica reportes de vialidad que estaban mal categorizados como seguridad
 * IDs a corregir:
 *   - ID 3: "Falta señalización en cruce peligroso" → seguridad → baches
 *   - ID 9: "Semáforo descompuesto en centro" → seguridad → baches
 */

import { getDb } from './db.js';

const RECLASIFICAR = [
  { id: 3, tipo_actual: 'seguridad', tipo_nuevo: 'baches', razon: 'Señalización vial' },
  { id: 9, tipo_actual: 'seguridad', tipo_nuevo: 'baches', razon: 'Semáforo (infraestructura vial)' },
];

console.log('🔧 Reclasificando reportes de vialidad...\n');

const db = getDb();

// Verificar estado actual
db.all('SELECT id, tipo, descripcion FROM reportes WHERE id IN (?, ?)', [3, 9], (err, rows) => {
  if (err) {
    console.error('❌ Error leyendo reportes:', err);
    db.close();
    process.exit(1);
  }

  console.log('📋 Estado ANTES de la reclasificación:');
  rows.forEach((r) => {
    console.log(`  ID ${r.id} | Tipo: "${r.tipo}" | ${r.descripcion.substring(0, 50)}...`);
  });

  // Aplicar reclasificación
  let completados = 0;
  RECLASIFICAR.forEach((item) => {
    db.run(
      'UPDATE reportes SET tipo = ? WHERE id = ? AND tipo = ?',
      [item.tipo_nuevo, item.id, item.tipo_actual],
      function (updateErr) {
        if (updateErr) {
          console.error(`❌ Error actualizando ID ${item.id}:`, updateErr);
          return;
        }

        if (this.changes === 0) {
          console.log(`⚠️  ID ${item.id}: Ya estaba como "${item.tipo_nuevo}" o no existe`);
        } else {
          console.log(`✅ ID ${item.id}: ${item.tipo_actual} → ${item.tipo_nuevo} (${item.razon})`);
        }

        completados++;
        if (completados === RECLASIFICAR.length) {
          // Verificar estado final
          db.all('SELECT id, tipo, descripcion FROM reportes WHERE id IN (?, ?)', [3, 9], (errFinal, rowsFinal) => {
            console.log('\n📋 Estado DESPUÉS de la reclasificación:');
            if (!errFinal && rowsFinal) {
              rowsFinal.forEach((r) => {
                console.log(`  ID ${r.id} | Tipo: "${r.tipo}" | ${r.descripcion.substring(0, 50)}...`);
              });
            }

            db.close();
            console.log('\n✅ Reclasificación completada');
          });
        }
      }
    );
  });
});
