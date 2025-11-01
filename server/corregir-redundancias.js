#!/usr/bin/env node
/**
 * Corrige redundancias en descripciones completas
 * (Elimina duplicación de ubicaciones como "en Calle X en Calle X")
 */

import { getDb } from './db.js';

async function corregirRedundancias() {
  const db = getDb();
  
  console.log('🔧 Corrigiendo redundancias en descripciones...\n');
  
  // Obtener todos los reportes
  const reportes = await new Promise((resolve, reject) => {
    db.all('SELECT id, tipo, descripcion FROM reportes ORDER BY id', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  let corregidos = 0;
  
  for (const reporte of reportes) {
    const { id, tipo, descripcion } = reporte;
    
    // Buscar patrones de redundancia como "en Calle X en Calle X"
    const redundanciaMatch = descripcion.match(/(\ben\s+(?:Calle|Av\.|Avenida|Plaza)[^.]+)\s+\1/i);
    
    if (redundanciaMatch) {
      // Eliminar la segunda ocurrencia
      const nuevaDescripcion = descripcion.replace(redundanciaMatch[0], redundanciaMatch[1]);
      
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE reportes SET descripcion = ? WHERE id = ?',
          [nuevaDescripcion, id],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      
      corregidos++;
      console.log(`✅ ID ${id} (${tipo}):`);
      console.log(`   Antes: "${descripcion.substring(0, 100)}..."`);
      console.log(`   Después: "${nuevaDescripcion.substring(0, 100)}..."`);
      console.log();
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`✅ Reportes corregidos: ${corregidos}`);
  console.log(`⏭️  Reportes sin redundancias: ${reportes.length - corregidos}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  db.close();
}

// Ejecutar
corregirRedundancias().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
