import sqlite3 from './server/node_modules/sqlite3/lib/sqlite3.js';

const db = new sqlite3.Database('server/data.db');

db.all('SELECT name FROM sqlite_master WHERE type="table" ORDER BY name', [], (err, rows) => {
  if (err) {
    console.error('❌ Error:', err);
  } else {
    console.log('\n📊 Tablas en la base de datos:');
    console.log(rows.map(r => `  - ${r.name}`).join('\n'));
  }
  db.close();
});
