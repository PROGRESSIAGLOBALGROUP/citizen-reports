#!/usr/bin/env node
/**
 * Debug: Verificar reporte ID 85 que muestra descripción incorrecta
 */

import { getDb } from './db.js';

console.log('🔍 Analizando Reporte ID 85\n');

const db = getDb();

db.get('SELECT * FROM reportes WHERE id = 85', [], (err, reporte) => {
  if (err) {
    console.error('❌ Error:', err);
    db.close();
    return;
  }

  if (!reporte) {
    console.log('⚠️  Reporte ID 85 no encontrado');
    db.close();
    return;
  }

  console.log('📋 Datos del Reporte ID 85:');
  console.log('─'.repeat(70));
  console.log(`ID: ${reporte.id}`);
  console.log(`Tipo: ${reporte.tipo}`);
  console.log(`Prioridad: ${reporte.prioridad || 'N/A'}`);
  console.log(`Peso: ${reporte.peso}`);
  console.log();
  console.log('❌ PROBLEMA IDENTIFICADO:');
  console.log(`descripcion_corta: "${reporte.descripcion_corta}"`);
  console.log(`descripcion (completa): "${reporte.descripcion}"`);
  console.log();

  if (reporte.descripcion_corta === 'Detallada') {
    console.log('🐛 BUG CONFIRMADO:');
    console.log('   • descripcion_corta contiene "Detallada" (incorrecto)');
    console.log('   • Debería contener una descripción breve del problema');
    console.log();
    console.log('📝 Este parece ser un error de datos en la migración');
  }

  // Verificar cuántos reportes tienen este problema
  db.all('SELECT id, tipo, descripcion_corta FROM reportes WHERE descripcion_corta = "Detallada" OR descripcion_corta LIKE "%detallada%"', [], (err2, rows) => {
    if (!err2 && rows && rows.length > 0) {
      console.log(`\n⚠️  Encontrados ${rows.length} reportes con descripción "Detallada":`);
      rows.forEach(r => {
        console.log(`   • ID ${r.id} (${r.tipo}): "${r.descripcion_corta}"`);
      });
    }
    
    db.close();
  });
});
