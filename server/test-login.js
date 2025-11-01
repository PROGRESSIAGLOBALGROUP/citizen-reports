// Test de login
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';

const { verbose } = sqlite3;
const db = new (verbose()).Database('./data.db');

console.log('🔍 Diagnóstico del Sistema de Autenticación\n');

// 1. Verificar usuarios
db.all('SELECT id, email, rol, activo FROM usuarios', (err, users) => {
  if (err) {
    console.log('❌ Error al leer usuarios:', err.message);
    return;
  }
  
  console.log('📋 Usuarios en la base de datos:');
  users.forEach(u => {
    console.log(`  ✓ ${u.email} (${u.rol}) - Activo: ${u.activo ? 'Sí' : 'No'}`);
  });
  console.log('');
  
  // 2. Probar login con admin
  const testEmail = 'admin@jantetelco.gob.mx';
  const testPassword = 'admin123';
  
  db.get('SELECT * FROM usuarios WHERE email = ?', [testEmail], async (err, user) => {
    if (err) {
      console.log('❌ Error al buscar usuario:', err.message);
      db.close();
      return;
    }
    
    if (!user) {
      console.log('❌ Usuario no encontrado:', testEmail);
      db.close();
      return;
    }
    
    console.log('✓ Usuario encontrado:', user.email);
    console.log('  - Nombre:', user.nombre);
    console.log('  - Rol:', user.rol);
    console.log('  - Hash en DB:', user.password_hash.substring(0, 20) + '...');
    console.log('');
    
    // 3. Verificar password
    console.log('🔐 Probando password "admin123"...');
    
    try {
      const isValid = await bcrypt.compare(testPassword, user.password_hash);
      
      if (isValid) {
        console.log('✅ Password correcto! El login debería funcionar.');
      } else {
        console.log('❌ Password incorrecto!');
        console.log('');
        console.log('🔧 Generando nuevo hash...');
        
        const newHash = await bcrypt.hash(testPassword, 10);
        console.log('Nuevo hash:', newHash);
        console.log('');
        console.log('💡 Ejecuta este SQL para corregir:');
        console.log(`UPDATE usuarios SET password_hash = '${newHash}' WHERE email = '${testEmail}';`);
      }
    } catch (error) {
      console.log('❌ Error al verificar password:', error.message);
    }
    
    db.close();
  });
});
