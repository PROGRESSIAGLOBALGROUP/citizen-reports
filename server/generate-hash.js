// Generar hash correcto para password "admin123"
import bcrypt from 'bcrypt';

const password = 'admin123';

console.log('🔐 Generando hash bcrypt para password: "admin123"\n');

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.log('❌ Error:', err.message);
    return;
  }
  
  console.log('✅ Hash generado:');
  console.log(hash);
  console.log('');
  console.log('📋 Usa este hash en schema.sql para todos los usuarios de prueba');
});
