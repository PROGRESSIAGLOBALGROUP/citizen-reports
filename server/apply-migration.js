/**
 * Aplicar migración de historial_cambios genérico
 * Ejecutar con: node apply-migration.js
 */

import sqlite3 from 'sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DB_PATH || join(__dirname, 'data.db');

console.log('📦 Aplicando migración de historial_cambios...');
console.log('📁 Base de datos:', DB_PATH);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error conectando a DB:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado a la base de datos');
});

// Leer migración
const migrationSQL = readFileSync(
  join(__dirname, 'migrations', '001_historial_cambios_generico.sql'),
  'utf8'
);

// Aplicar migración
db.exec(migrationSQL, (err) => {
  if (err) {
    console.error('❌ Error aplicando migración:', err.message);
    db.close();
    process.exit(1);
  }

  console.log('✅ Migración aplicada exitosamente');
  
  // Verificar nueva estructura
  db.all("PRAGMA table_info(historial_cambios)", (err, columns) => {
    if (err) {
      console.error('❌ Error verificando estructura:', err.message);
    } else {
      console.log('\n📋 Nueva estructura de historial_cambios:');
      columns.forEach(col => {
        console.log(`  - ${col.name} (${col.type}${col.notnull ? ' NOT NULL' : ''})`);
      });
    }
    
    db.close(() => {
      console.log('\n✅ Migración completada. Reinicia el servidor.');
    });
  });
});
