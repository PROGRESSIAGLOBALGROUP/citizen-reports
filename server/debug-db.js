// Script para verificar reportes y usuarios en la base de datos
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'data.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
});

console.log('📊 ANÁLISIS DE BASE DE DATOS\n');

// Contar reportes
db.get('SELECT COUNT(*) as total FROM reportes', (err, row) => {
  if (err) {
    console.error('❌ Error contando reportes:', err.message);
  } else {
    console.log(`✅ Total de reportes: ${row.total}`);
  }
  
  // Listar reportes por tipo
  db.all('SELECT tipo, dependencia, COUNT(*) as count FROM reportes GROUP BY tipo, dependencia', (err, rows) => {
    if (err) {
      console.error('❌ Error:', err.message);
    } else {
      console.log('\n📋 Reportes por tipo y dependencia:');
      rows.forEach(r => {
        console.log(`   ${r.tipo} (${r.dependencia}): ${r.count}`);
      });
    }
    
    // Listar usuarios
    db.all('SELECT id, nombre, email, dependencia FROM usuarios ORDER BY id', (err, users) => {
      if (err) {
        console.error('❌ Error:', err.message);
      } else {
        console.log('\n👥 Usuarios en la base de datos:');
        users.forEach(u => {
          console.log(`   [${u.id}] ${u.nombre} (${u.dependencia})`);
          console.log(`       📧 ${u.email}`);
        });
      }
      
      db.close();
    });
  });
});
