#!/usr/bin/env node
/**
 * Corrección: Actualizar reporte ID 85 con descripción correcta
 */

import { getDb } from './db.js';

console.log('🔧 Corrigiendo Reporte ID 85\n');

const db = getDb();

// Generar una descripción adecuada para un reporte de alumbrado
const descripcionCompleta = 'Luminaria descompuesta necesita reparación en Av. Morelos';
const descripcionCorta = 'Luminaria descompuesta';

console.log('📝 Actualizando con:');
console.log(`   descripcion_corta: "${descripcionCorta}"`);
console.log(`   descripcion: "${descripcionCompleta}"`);
console.log();

db.run(
  'UPDATE reportes SET descripcion = ?, descripcion_corta = ? WHERE id = 85',
  [descripcionCompleta, descripcionCorta],
  function(err) {
    if (err) {
      console.error('❌ Error:', err);
      db.close();
      return;
    }

    if (this.changes === 0) {
      console.log('⚠️  No se actualizó ningún registro (ID 85 no existe)');
      db.close();
      return;
    }

    console.log('✅ Reporte ID 85 actualizado correctamente');
    console.log(`   Cambios aplicados: ${this.changes}`);
    
    // Verificar el cambio
    db.get('SELECT id, tipo, descripcion, descripcion_corta FROM reportes WHERE id = 85', [], (err2, row) => {
      if (!err2 && row) {
        console.log('\n📋 Estado después de la corrección:');
        console.log(`   ID: ${row.id}`);
        console.log(`   Tipo: ${row.tipo}`);
        console.log(`   Descripción corta (mapa): "${row.descripcion_corta}"`);
        console.log(`   Descripción completa (funcionarios): "${row.descripcion}"`);
        console.log();
        console.log('🎯 Ahora el popup del mapa mostrará:');
        console.log(`   "${row.descripcion_corta}"`);
      }
      db.close();
    });
  }
);
