import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./data.db', (err) => {
  if (err) {
    console.error('❌ Error abriendo DB:', err.message);
    process.exit(1);
  }
  
  console.log('✅ DB abierta');
  
  // Verificar tablas
  db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, tables) => {
    if (err) {
      console.error('❌ Error verificando tablas:', err.message);
      db.close();
      process.exit(1);
    }
    
    if (!tables || tables.length === 0) {
      console.error('❌ NO HAY TABLAS en la BD');
      db.close();
      process.exit(1);
    }
    
    console.log(`✅ ${tables.length} tablas encontradas:`);
    tables.forEach(t => console.log(`   - ${t.name}`));
    
    // Verificar si reportes tiene datos
    db.get('SELECT COUNT(*) as cnt FROM reportes', (err, row) => {
      if (err) {
        console.error('❌ Error verificando reportes:', err.message);
      } else {
        console.log(`✅ Reportes en BD: ${row.cnt}`);
      }
      
      db.close();
    });
  });
});
