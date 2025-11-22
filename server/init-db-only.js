import 'dotenv/config';
import { initDb } from './db.js';

console.log('🔄 Inicializando BD...');
try {
  await initDb();
  console.log('✅ BD inicializada exitosamente');
  process.exit(0);
} catch (error) {
  console.error('❌ Error al inicializar BD:', error.message);
  process.exit(1);
}
