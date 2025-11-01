/**
 * Script de aplicación de migración 002 - Dependencias
 * UUID: d7a1f5e3-4e8d-11ef-9a4c-0242ac120005
 * Timestamp: 2025-10-09T04:20:15.847Z
 */

import sqlite3 from 'sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DB_PATH || join(__dirname, 'data.db');

console.log('📦 Aplicando migración 002 - Tabla de dependencias...');
console.log('📁 Base de datos:', DB_PATH);
console.log('⏰ Timestamp:', new Date().toISOString());

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error conectando a DB:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado a la base de datos');
});

// Leer migración
const migrationSQL = readFileSync(
  join(__dirname, 'migrations', '002_dependencias_tabla.sql'),
  'utf8'
);

// Aplicar migración
db.exec(migrationSQL, (err) => {
  if (err) {
    console.error('❌ Error aplicando migración:', err.message);
    db.close();
    process.exit(1);
  }

  console.log('✅ Migración 002 aplicada exitosamente');
  
  // Verificar nueva estructura
  db.all("SELECT * FROM dependencias ORDER BY orden", (err, rows) => {
    if (err) {
      console.error('❌ Error verificando datos:', err.message);
    } else {
      console.log('\n📋 Dependencias creadas:');
      rows.forEach(dep => {
        console.log(`  ${dep.icono} ${dep.nombre} (${dep.slug}) - Orden: ${dep.orden}`);
      });
    }
    
    // Verificar estructura
    db.all("PRAGMA table_info(dependencias)", (err, columns) => {
      if (err) {
        console.error('❌ Error verificando estructura:', err.message);
      } else {
        console.log('\n📊 Estructura de tabla dependencias:');
        columns.forEach(col => {
          console.log(`  - ${col.name} (${col.type}${col.notnull ? ' NOT NULL' : ''}${col.dflt_value ? ` DEFAULT ${col.dflt_value}` : ''})`);
        });
      }
      
      db.close(() => {
        console.log('\n✅ Migración completada. Reinicia el servidor.');
      });
    });
  });
});
