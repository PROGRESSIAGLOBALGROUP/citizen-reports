import { getDb } from '../server/db.js';
import { resolve } from 'path';

// Ensure we use the main DB
process.env.DB_PATH = resolve('server/data.db');

const db = getDb();
// Hash generado con: bcrypt.hash('admin123', 10)
const HASH = '$2b$10$6N0BqeczPx2ORCzgEZrcaey7oSPQsFMPF2/It/0EjasxA56msOcxG'; // admin123

console.log('🔄 Reseteando passwords a "admin123"...');

const sql = `UPDATE usuarios SET password_hash = ?`;

db.run(sql, [HASH], function(err) {
  if (err) {
    console.error('❌ Error actualizando passwords:', err.message);
    process.exit(1);
  }
  console.log(`✅ Passwords actualizados para ${this.changes} usuarios.`);
  process.exit(0);
});
