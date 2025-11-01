/**
 * Script: Desactivar categoría "Otros" (vacía)
 */

import { getDb } from '../db.js';

const db = getDb();

console.log('\n🗑️  Desactivando categoría "Otros" (vacía)...\n');

db.run(
  `UPDATE categorias 
   SET activo = 0, 
       actualizado_en = datetime('now')
   WHERE id = 7`,
  [],
  function(err) {
    if (err) {
      console.error('❌ Error:', err);
      db.close();
      process.exit(1);
    }
    
    console.log(`✅ Categoría "Otros" desactivada (${this.changes} cambio)`);
    
    // Verificar categorías activas
    db.all(
      `SELECT id, nombre, 
              (SELECT COUNT(*) FROM tipos_reporte WHERE categoria_id = categorias.id AND activo = 1) as tipos_count
       FROM categorias 
       WHERE activo = 1 
       ORDER BY orden`,
      [],
      (err, rows) => {
        db.close();
        
        if (err) {
          console.error('❌ Error:', err);
          process.exit(1);
        }
        
        console.log('\n📊 Categorías activas:');
        rows.forEach(cat => {
          console.log(`   ${cat.id}. ${cat.nombre} (${cat.tipos_count} tipos)`);
        });
        
        console.log('\n✅ Corrección completada\n');
        process.exit(0);
      }
    );
  }
);
