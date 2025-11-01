#!/usr/bin/env node
// init-db.js - Inicializar BD desde schema.sql

import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'data.db');
const schemaPath = path.join(__dirname, 'schema.sql');

console.log(`📊 BD: ${dbPath}`);
console.log(`📄 Schema: ${schemaPath}`);

const schema = fs.readFileSync(schemaPath, 'utf-8');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error conectando BD:', err);
    process.exit(1);
  }
  console.log('✅ BD conectada');

  // Ejecutar schema
  db.exec(schema, (err) => {
    if (err) {
      console.error('❌ Error ejecutando schema:', err);
      process.exit(1);
    }
    console.log('✅ Schema inicializado');

    // Verificar tablas
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
      if (err) {
        console.error('❌ Error:', err);
        process.exit(1);
      }
      console.log('✅ Tablas creadas:');
      rows.forEach(r => console.log(`   - ${r.name}`));
      
      // Verificar datos
      db.get('SELECT COUNT(*) as count FROM reportes', (err, row) => {
        if (err) {
          console.error('❌ Error:', err);
          process.exit(1);
        }
        console.log(`✅ Reportes: ${row.count}`);
        db.close();
        console.log('✅ BD lista');
      });
    });
  });
});
