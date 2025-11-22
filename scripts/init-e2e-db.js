#!/usr/bin/env node
import { initDb, resetDb } from '../server/db.js';
import { seedE2EReports } from './seed-e2e-reports.js';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH ? resolve(process.env.DB_PATH) : resolve(__dirname, '../e2e.db');

try {
  console.log(`📝 Inicializando base de datos E2E en: ${dbPath}`);
  // CRITICAL: Primero establecer DB_PATH, luego resetear singleton
  process.env.DB_PATH = dbPath;
  resetDb();
  await initDb();
  console.log('✅ Schema inicializado');

  // Agregar datos de prueba
  console.log('📊 Agregando datos de prueba para E2E...');
  await seedE2EReports();
  
  console.log('✅ Base de datos E2E inicializada correctamente');
  process.exit(0);
} catch (error) {
  console.error('❌ Error al inicializar BD E2E:', error.message);
  process.exit(1);
}