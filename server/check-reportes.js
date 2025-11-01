// Verificar reportes en la base de datos
import sqlite3 from 'sqlite3';

const { verbose } = sqlite3;
const db = new (verbose()).Database('./data.db');

console.log('🔍 Diagnóstico de Reportes\n');

db.all('SELECT id, tipo, lat, lng, descripcion, creado_en FROM reportes ORDER BY id', (err, rows) => {
  if (err) {
    console.log('❌ Error:', err.message);
    db.close();
    return;
  }
  
  console.log('📊 Total reportes en DB:', rows.length);
  console.log('');
  
  if (rows.length === 0) {
    console.log('⚠️  No hay reportes en la base de datos!');
  } else {
    console.log('📋 Lista de reportes:');
    console.log('─'.repeat(80));
    
    rows.forEach(r => {
      const lat = r.lat ? r.lat.toFixed(6) : 'NULL';
      const lng = r.lng ? r.lng.toFixed(6) : 'NULL';
      const desc = r.descripcion ? r.descripcion.substring(0, 40) : 'Sin descripción';
      
      console.log(`ID ${r.id} | ${r.tipo.padEnd(12)} | Lat: ${lat}, Lng: ${lng}`);
      console.log(`      ${desc}...`);
      console.log('');
    });
    
    // Verificar coordenadas válidas
    const invalidCoords = rows.filter(r => !r.lat || !r.lng || r.lat === 0 || r.lng === 0);
    if (invalidCoords.length > 0) {
      console.log('⚠️  Reportes con coordenadas inválidas:', invalidCoords.length);
      invalidCoords.forEach(r => {
        console.log(`  - ID ${r.id}: lat=${r.lat}, lng=${r.lng}`);
      });
    }
    
    // Resumen por tipo
    console.log('\n📊 Resumen por tipo:');
    const byType = {};
    rows.forEach(r => {
      byType[r.tipo] = (byType[r.tipo] || 0) + 1;
    });
    Object.entries(byType).forEach(([tipo, count]) => {
      console.log(`  ${tipo}: ${count} reportes`);
    });
  }
  
  db.close();
});
