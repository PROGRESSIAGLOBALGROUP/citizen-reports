#!/usr/bin/env node
import 'dotenv/config';
import { initDb, getDb } from './db.js';
import bcrypt from 'bcrypt';

const EMAIL = 'admin@jantetelco.gob.mx';
const PASSWORD = 'admin123';

console.log('🔍 Testeando login - Simulando exactamente lo que hace el endpoint\n');

initDb().then(() => {
  console.log('✅ BD inicializada\n');
  
  const db = getDb();
  
  // Step 1: Check if sesiones table exists
  db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='sesiones'", (err, rows) => {
    if (err || !rows?.length) {
      console.error('❌ TABLA SESIONES NO EXISTE - Esto causa error 500');
      process.exit(1);
    }
    console.log('✅ Tabla sesiones existe');
    
    // Step 2: Find user
    db.get('SELECT * FROM usuarios WHERE email = ? AND activo = 1', [EMAIL], async (err, usuario) => {
      if (err) {
        console.error('❌ DB error:', err.message);
        process.exit(1);
      }
      
      if (!usuario) {
        console.error('❌ Usuario no encontrado');
        process.exit(1);
      }
      
      console.log(`✅ Usuario encontrado: ${usuario.nombre}`);
      
      if (!usuario.password_hash) {
        console.error('❌ Usuario no tiene password_hash');
        process.exit(1);
      }
      
      // Step 3: Compare password
      const isValid = await bcrypt.compare(PASSWORD, usuario.password_hash);
      if (!isValid) {
        console.error('❌ Password incorrecto');
        process.exit(1);
      }
      
      console.log('✅ Password válido');
      
      // Step 4: Create session (THIS IS WHERE IT FAILS IN PRODUCTION)
      const token = 'test-' + Date.now();
      const expira = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      db.run(
        'INSERT INTO sesiones (usuario_id, token, expira_en, ip, user_agent) VALUES (?, ?, ?, ?, ?)',
        [usuario.id, token, expira, '127.0.0.1', 'test'],
        function(err) {
          if (err) {
            console.error('❌ ERROR AL CREAR SESION:', err.message);
            console.error('   ^^^ ESTE ES EL ERROR 500 EN PRODUCCION');
            process.exit(1);
          }
          
          console.log('✅ Sesión creada exitosamente');
          console.log(`✅ TODO FUNCIONA - El error debe estar en producción\n`);
          process.exit(0);
        }
      );
    });
  });
}).catch(err => {
  console.error('❌ Error inicializando BD:', err.message);
  process.exit(1);
});
