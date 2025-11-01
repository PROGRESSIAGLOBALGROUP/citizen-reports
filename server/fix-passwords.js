// Actualizar passwords directamente en la base de datos
import sqlite3 from 'sqlite3';

const { verbose } = sqlite3;
const db = new (verbose()).Database('./data.db');

const correctHash = '$2b$10$IC/ygKAFm7Nz5tSK0g15mulnmQ/LzQSX3ZJYqpbgpTPCrPFLJvMba';

console.log('🔧 Actualizando passwords de todos los usuarios...\n');

db.run('UPDATE usuarios SET password_hash = ?', [correctHash], function(err) {
  if (err) {
    console.log('❌ Error:', err.message);
    db.close();
    return;
  }
  
  console.log('✅ Actualizados', this.changes, 'usuarios');
  console.log('');
  console.log('📋 Todos los usuarios ahora tienen password: "admin123"');
  console.log('');
  
  // Verificar
  db.all('SELECT email, password_hash FROM usuarios', (err, rows) => {
    if (!err) {
      console.log('✓ Verificación:');
      rows.forEach(r => {
        const matches = r.password_hash === correctHash;
        console.log(`  ${matches ? '✅' : '❌'} ${r.email}`);
      });
    }
    db.close();
  });
});
