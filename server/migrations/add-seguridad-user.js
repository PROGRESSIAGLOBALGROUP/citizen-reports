// Migración: Agregar usuario de prueba para dependencia seguridad_publica
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'data.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error al conectar a la base de datos:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado a data.db');
});

// Password: "admin123" (mismo hash bcrypt que otros usuarios de prueba)
const sql = `
INSERT OR IGNORE INTO usuarios (id, email, nombre, password_hash, dependencia, rol, activo) VALUES 
(6, 'func.seguridad1@jantetelco.gob.mx', 'Carlos Ramírez - Seguridad', '$2b$10$IC/ygKAFm7Nz5tSK0g15mulnmQ/LzQSX3ZJYqpbgpTPCrPFLJvMba', 'seguridad_publica', 'funcionario', 1);
`;

db.run(sql, (err) => {
  if (err) {
    console.error('❌ Error al insertar usuario:', err.message);
    process.exit(1);
  }
  
  console.log('✅ Usuario agregado exitosamente');
  
  // Verificar que se insertó correctamente
  db.get('SELECT * FROM usuarios WHERE id = 6', (err, row) => {
    if (err) {
      console.error('❌ Error al verificar usuario:', err.message);
    } else if (row) {
      console.log('📋 Usuario insertado:');
      console.log(`   ID: ${row.id}`);
      console.log(`   Email: ${row.email}`);
      console.log(`   Nombre: ${row.nombre}`);
      console.log(`   Dependencia: ${row.dependencia}`);
      console.log(`   Rol: ${row.rol}`);
    } else {
      console.log('⚠️  El usuario ya existía (INSERT OR IGNORE)');
    }
    
    db.close();
  });
});
