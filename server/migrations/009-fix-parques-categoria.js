/**
 * Script de corrección: Mover "Parques y Jardines" a Medio Ambiente
 * 
 * PROBLEMA:
 * - "Parques y Jardines" está en la categoría "Otros" (id=7)
 * - Debería estar en "Medio Ambiente" (id=6)
 * 
 * SOLUCIÓN:
 * - Actualizar categoria_id de 7 a 6
 * - Ajustar el orden dentro de Medio Ambiente
 */

import { getDb } from '../db.js';

async function corregirParquesCategoria() {
  const db = getDb();
  
  console.log('\n🔧 Corrección: Mover Parques y Jardines a Medio Ambiente\n');
  console.log('='.repeat(60));
  
  try {
    // 1. Verificar estado actual
    console.log('\n📊 Estado actual:');
    const estadoActual = await new Promise((resolve, reject) => {
      db.get(
        `SELECT t.tipo, t.nombre, t.categoria_id, c.nombre as categoria_nombre
         FROM tipos_reporte t
         INNER JOIN categorias c ON t.categoria_id = c.id
         WHERE t.tipo = 'parques'`,
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    if (!estadoActual) {
      console.log('❌ No se encontró el tipo "parques"');
      db.close();
      return;
    }
    
    console.log(`   Tipo: ${estadoActual.nombre}`);
    console.log(`   Categoría actual: ${estadoActual.categoria_nombre} (ID: ${estadoActual.categoria_id})`);
    
    // 2. Actualizar a Medio Ambiente
    console.log('\n🔄 Moviendo a Medio Ambiente...');
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE tipos_reporte 
         SET categoria_id = 6, 
             orden = 4,
             actualizado_en = datetime('now')
         WHERE tipo = 'parques'`,
        [],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
    
    console.log('✅ Tipo actualizado exitosamente');
    
    // 3. Verificar nuevo estado
    console.log('\n📊 Estado después de la corrección:');
    const estadoNuevo = await new Promise((resolve, reject) => {
      db.get(
        `SELECT t.tipo, t.nombre, t.categoria_id, c.nombre as categoria_nombre, t.orden
         FROM tipos_reporte t
         INNER JOIN categorias c ON t.categoria_id = c.id
         WHERE t.tipo = 'parques'`,
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    console.log(`   Tipo: ${estadoNuevo.nombre}`);
    console.log(`   Categoría nueva: ${estadoNuevo.categoria_nombre} (ID: ${estadoNuevo.categoria_id})`);
    console.log(`   Orden: ${estadoNuevo.orden}`);
    
    // 4. Mostrar todos los tipos de Medio Ambiente
    console.log('\n🌳 Tipos en Medio Ambiente:');
    const tiposMedioAmbiente = await new Promise((resolve, reject) => {
      db.all(
        `SELECT tipo, nombre, orden
         FROM tipos_reporte
         WHERE categoria_id = 6 AND activo = 1
         ORDER BY orden`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    tiposMedioAmbiente.forEach(t => {
      console.log(`   ${t.orden}. ${t.nombre} (${t.tipo})`);
    });
    
    // 5. Verificar si categoría "Otros" quedó vacía
    console.log('\n📦 Verificando categoría "Otros":');
    const tiposOtros = await new Promise((resolve, reject) => {
      db.all(
        `SELECT tipo, nombre
         FROM tipos_reporte
         WHERE categoria_id = 7 AND activo = 1`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    if (tiposOtros.length === 0) {
      console.log('   ⚠️  Categoría "Otros" ahora está vacía');
      console.log('   💡 Considera desactivarla o eliminarla');
    } else {
      console.log(`   ℹ️  Categoría "Otros" tiene ${tiposOtros.length} tipos activos`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Corrección completada exitosamente\n');
    
  } catch (error) {
    console.error('\n❌ Error durante la corrección:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Ejecutar
corregirParquesCategoria()
  .then(() => {
    console.log('✅ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
