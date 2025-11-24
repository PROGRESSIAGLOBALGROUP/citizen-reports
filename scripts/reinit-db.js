import { initDb } from '../server/db.js';
import { resolve } from 'path';

// Ensure we use the main DB
process.env.DB_PATH = resolve('server/data.db');

console.log('🔄 Ejecutando initDb para asegurar esquema y datos iniciales...');

try {
  await initDb();
  console.log('✅ initDb completado.');
  process.exit(0);
} catch (err) {
  console.error('❌ Error en initDb:', err);
  process.exit(1);
}
