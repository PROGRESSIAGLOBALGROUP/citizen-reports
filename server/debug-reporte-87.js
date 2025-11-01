#!/usr/bin/env node
/**
 * Debug reporte ID 87 para verificar qué se guardó
 */

import { getDb } from './db.js';

const db = getDb();

db.get('SELECT id, tipo, descripcion, descripcion_corta FROM reportes WHERE id = 87', (err, row) => {
  if (err) {
    console.error('❌ Error:', err);
    db.close();
    process.exit(1);
  }
  
  if (!row) {
    console.log('⚠️  No existe reporte con ID 87');
    db.close();
    return;
  }
  
  console.log('\n📋 Reporte ID 87:');
  console.log('─'.repeat(80));
  console.log(`Tipo: ${row.tipo}`);
  console.log(`\n📱 descripcion_corta (debe aparecer en MAPA):`);
  console.log(`   "${row.descripcion_corta}"`);
  console.log(`\n📄 descripcion (debe aparecer solo a FUNCIONARIOS):`);
  console.log(`   "${row.descripcion}"`);
  console.log('─'.repeat(80));
  
  // Verificar si están intercambiadas
  if (row.descripcion_corta && row.descripcion_corta.includes('Detallada')) {
    console.log('\n🐛 BUG CONFIRMADO: descripcion_corta contiene texto de descripción detallada');
    console.log('   Se están guardando los campos intercambiados en la BD');
  }
  
  db.close();
});
