/**
 * Test: Verificar iconos en mapa
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbPath);

console.log('🧪 TEST: Iconos de mapa en VerReporte.jsx\n' + '='.repeat(70));

db.all(`SELECT tipo, nombre, icono, color FROM tipos_reporte ORDER BY tipo`, (err, tipos) => {
  if (err) {
    console.error('❌ Error:', err);
    db.close();
    return;
  }
  
  console.log(`\n✅ ${tipos.length} tipos de reporte:\n`);
  let sinIcono = 0;
  
  tipos.forEach(t => {
    const status = t.icono ? '✅' : '❌';
    console.log(`${status} ${t.tipo.padEnd(25)} | ${t.icono || 'SIN ICONO'} | ${t.nombre} | ${t.color}`);
    if (!t.icono) sinIcono++;
  });
  
  console.log(`\n📊 Resumen: ${tipos.length - sinIcono}/${tipos.length} con icono (${Math.round((tipos.length - sinIcono)/tipos.length*100)}%)`);
  
  if (sinIcono > 0) {
    console.log(`\n⚠️  ${sinIcono} tipo(s) sin icono. Ejecuta: node server/fix-iconos.js\n`);
    db.close();
    return;
  }
  
  // Test reportes
  console.log('\n' + '='.repeat(70));
  db.all(`
    SELECT r.id, r.tipo, r.lat, r.lng, t.icono, t.color, t.nombre as tipo_nombre
    FROM reportes r
    LEFT JOIN tipos_reporte t ON r.tipo = t.tipo
    ORDER BY r.id DESC LIMIT 5
  `, (err, reportes) => {
    if (err) {
      console.error('❌ Error:', err);
      db.close();
      return;
    }
    
    console.log(`\n✅ Últimos 5 reportes:\n`);
    reportes.forEach(r => {
      console.log(`${r.icono} Reporte #${r.id} - ${r.tipo_nombre} (${r.lat}, ${r.lng})`);
    });
    
    // Simular marcador
    const r = reportes[0];
    console.log('\n' + '='.repeat(70));
    console.log(`\n🗺️  HTML del marcador (Reporte #${r.id}):\n`);
    console.log(`<div style="
  background: linear-gradient(135deg, ${r.color} 0%, ${r.color}dd 100%);
  width: 44px; height: 44px; border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 4px 16px rgba(0,0,0,0.25);
  font-size: 22px;
">${r.icono}</div>`);
    
    console.log('\n✅ PRUEBAS COMPLETADAS\n');
    console.log('📝 Para probar en navegador:');
    console.log(`   http://localhost:5173/#reporte/${r.id}\n`);
    
    db.close();
  });
});
