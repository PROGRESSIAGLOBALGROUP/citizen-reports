#!/usr/bin/env node
/**
 * Muestra ejemplos de descripciones corregidas para validación
 */

import { getDb } from './db.js';

async function mostrarEjemplos() {
  const db = getDb();
  
  console.log('📋 Ejemplos de descripciones después de estandarización:\n');
  
  // Obtener 5 ejemplos aleatorios de cada tipo
  const tipos = ['baches', 'alumbrado', 'agua', 'limpieza', 'seguridad', 'parques'];
  
  for (const tipo of tipos) {
    const reportes = await new Promise((resolve, reject) => {
      db.all(
        'SELECT id, tipo, descripcion_corta, descripcion FROM reportes WHERE tipo = ? LIMIT 2',
        [tipo],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    if (reportes.length > 0) {
      console.log(`\n🏷️  ${tipo.toUpperCase()}`);
      console.log('─'.repeat(80));
      
      for (const r of reportes) {
        console.log(`\n📍 ID ${r.id}:`);
        console.log(`   📱 Corta (mapa): "${r.descripcion_corta}"`);
        console.log(`   📄 Completa (funcionarios): "${r.descripcion}"`);
      }
    }
  }
  
  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('✅ Las descripciones ahora están correctamente separadas:');
  console.log('   • descripcion_corta → Para popups en mapa público (≤50 chars)');
  console.log('   • descripcion → Para panel de funcionarios (detallada)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  db.close();
}

// Ejecutar
mostrarEjemplos().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
