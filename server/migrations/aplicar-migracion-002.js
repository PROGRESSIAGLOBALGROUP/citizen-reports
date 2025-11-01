/**
 * Script para aplicar migración 002: Notas de funcionarios
 * Ejecutar: node server/migrations/aplicar-migracion-002.js
 */

import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data.db');
const MIGRATION_FILE = path.join(__dirname, '002-notas-funcionario.sql');

console.log('📦 Aplicando migración 002: Notas de funcionarios...');
console.log(`📁 Base de datos: ${DB_PATH}`);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error al conectar con la base de datos:', err);
    process.exit(1);
  }
});

const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');

db.exec(sql, (err) => {
  if (err) {
    console.error('❌ Error al ejecutar migración:', err);
    db.close();
    process.exit(1);
  }
  
  console.log('✅ Migración 002 aplicada exitosamente');
  console.log('📋 Tabla creada: notas_funcionario');
  
  db.close((err) => {
    if (err) {
      console.error('Error al cerrar conexión:', err);
    }
    process.exit(0);
  });
});
