// Verificar usuarios en la base de datos
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'data.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error al conectar a la base de datos:', err.message);
    process.exit(1);
  }
});

db.all('SELECT id, email, nombre, dependencia, rol FROM usuarios ORDER BY id', (err, rows) => {
  if (err) {
    console.error('❌ Error:', err.message);
  } else {
    console.log('\n📋 Usuarios en la base de datos:\n');
    rows.forEach(user => {
      console.log(`ID ${user.id}: ${user.nombre}`);
      console.log(`   📧 ${user.email}`);
      console.log(`   🏛️  ${user.dependencia}`);
      console.log(`   👤 ${user.rol}`);
      console.log('');
    });
  }
  db.close();
});
