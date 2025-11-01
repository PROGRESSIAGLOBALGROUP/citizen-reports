#!/usr/bin/env node
/**
 * Corrige el reporte ID 87 que tiene descripcion_corta incorrecta
 */

import { getDb } from './db.js';

const db = getDb();

// Primero verificar el estado actual
db.get('SELECT id, descripcion, descripcion_corta FROM reportes WHERE id = 87', (err, row) => {
  if (err || !row) {
    console.error('❌ Error o reporte no encontrado');
    db.close();
    process.exit(1);
  }
  
  console.log('\n📋 Estado ANTES de la corrección:');
  console.log('─'.repeat(80));
  console.log(`descripcion: "${row.descripcion}"`);
  console.log(`descripcion_corta: "${row.descripcion_corta}"`);
  
  // Como ambos campos tienen "Esta es la Descripción Detallada",
  // vamos a deducir una descripción corta apropiada
  const nuevaDescCorta = "Bache en vialidad";
  const nuevaDescCompleta = row.descripcion; // Mantener la detallada
  
  db.run(
    'UPDATE reportes SET descripcion = ?, descripcion_corta = ? WHERE id = 87',
    [nuevaDescCompleta, nuevaDescCorta],
    function(updateErr) {
      if (updateErr) {
        console.error('❌ Error al actualizar:', updateErr);
        db.close();
        process.exit(1);
      }
      
      // Verificar la corrección
      db.get('SELECT id, descripcion, descripcion_corta FROM reportes WHERE id = 87', (err2, row2) => {
        console.log('\n✅ Estado DESPUÉS de la corrección:');
        console.log('─'.repeat(80));
        console.log(`descripcion: "${row2.descripcion}"`);
        console.log(`descripcion_corta: "${row2.descripcion_corta}"`);
        console.log('─'.repeat(80));
        console.log('\n💡 Ahora el mapa mostrará solo: "Bache en vialidad"');
        console.log('   Y el panel de funcionarios mostrará la descripción completa\n');
        
        db.close();
      });
    }
  );
});
