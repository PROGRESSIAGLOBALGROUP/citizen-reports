#!/usr/bin/env node
/**
 * Auditoría y corrección masiva de descripciones problemáticas
 */

import { getDb } from './db.js';

console.log('🔍 Auditando todas las descripciones...\n');

const db = getDb();

// Buscar reportes con descripciones sospechosas
const problemPatterns = [
  'Detallada',
  'detallada', 
  'descripción',
  'N/A',
  'null',
  ''
];

const whereClause = problemPatterns.map(() => 'descripcion_corta LIKE ?').join(' OR ');
const params = problemPatterns.map(p => `%${p}%`);

db.all(`SELECT id, tipo, descripcion, descripcion_corta FROM reportes WHERE ${whereClause} OR descripcion_corta IS NULL`, params, (err, rows) => {
  if (err) {
    console.error('❌ Error:', err);
    db.close();
    return;
  }

  if (!rows || rows.length === 0) {
    console.log('✅ No se encontraron reportes con descripciones problemáticas');
    db.close();
    return;
  }

  console.log(`⚠️  Encontrados ${rows.length} reportes con descripciones problemáticas:\n`);

  rows.forEach((r, i) => {
    console.log(`${i + 1}. ID ${r.id} (${r.tipo}):`);
    console.log(`   descripcion_corta: "${r.descripcion_corta || 'NULL'}"`);
    console.log(`   descripcion: "${r.descripcion || 'NULL'}"`);
    console.log();
  });

  console.log('═'.repeat(70));
  console.log('💡 Recomendación:');
  console.log('   Estos reportes necesitan descripciones cortas apropiadas');
  console.log('   Pueden ser actualizados manualmente o con un script de corrección');

  db.close();
});
