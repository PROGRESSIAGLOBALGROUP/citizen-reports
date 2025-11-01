import sqlite3 from './server/node_modules/sqlite3/lib/sqlite3.js';

const db = new sqlite3.Database('server/data.db');

console.log('\n📊 CATEGORÍAS:');
db.all('SELECT * FROM categorias ORDER BY orden', [], (err, rows) => {
  if (err) {
    console.error('❌ Error:', err);
  } else {
    rows.forEach(r => console.log(`  ${r.icono} ${r.nombre} (ID: ${r.id}, activo: ${r.activo})`));
  }
  
  console.log('\n📊 TIPOS DE REPORTE:');
  db.all('SELECT * FROM tipos_reporte ORDER BY categoria_id, orden', [], (err, rows) => {
    if (err) {
      console.error('❌ Error:', err);
    } else {
      rows.forEach(r => console.log(`  ${r.icono} ${r.nombre} (tipo: ${r.tipo}, cat_id: ${r.categoria_id}, activo: ${r.activo})`));
    }
    db.close();
  });
});
