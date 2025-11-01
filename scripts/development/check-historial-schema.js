import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./server/data.db');

db.get('SELECT sql FROM sqlite_master WHERE type="table" AND name="historial_cambios"', [], (err, row) => {
  if (err) {
    console.error('❌ Error:', err);
  } else if (row) {
    console.log('📊 Schema de historial_cambios:\n');
    console.log(row.sql);
  } else {
    console.log('❌ Tabla historial_cambios no existe');
  }
  db.close();
});
