/**
 * Script de migración para agregar campo telefono a usuarios
 * Ejecutar: node server/migrations/aplicar-migracion-006.js
 */

import { getDb } from '../db.js';

async function aplicarMigracion() {
  console.log('📱 Aplicando migración 006: Campo telefono para SMS...');
  
  const db = getDb();
  
  // Verificar si la columna ya existe
  const columnas = await new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(usuarios)", (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
  
  const tieneColumna = columnas.some(col => col.name === 'telefono');
  
  if (tieneColumna) {
    console.log('✅ Columna telefono ya existe en usuarios');
    return;
  }
  
  // Agregar columna telefono
  await new Promise((resolve, reject) => {
    db.run('ALTER TABLE usuarios ADD COLUMN telefono TEXT', (err) => {
      if (err && !err.message.includes('duplicate column')) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
  console.log('✅ Columna telefono agregada');
  
  // Agregar columna sms_habilitado
  await new Promise((resolve, reject) => {
    db.run('ALTER TABLE usuarios ADD COLUMN sms_habilitado INTEGER DEFAULT 1', (err) => {
      if (err && !err.message.includes('duplicate column')) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
  console.log('✅ Columna sms_habilitado agregada');
  
  // Crear índice
  await new Promise((resolve, reject) => {
    db.run(
      'CREATE INDEX IF NOT EXISTS idx_usuarios_telefono ON usuarios(telefono)',
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
  console.log('✅ Índice idx_usuarios_telefono creado');
  
  console.log('🎉 Migración 006 completada exitosamente');
}

aplicarMigracion()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error en migración:', err);
    process.exit(1);
  });
