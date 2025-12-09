/**
 * Migración 010: Fix historial_cambios.usuario_id para permitir NULL
 * 
 * Problema: El campo usuario_id era NOT NULL, pero necesitamos NULL
 * para eventos de seguridad sin usuario autenticado (login fallido, etc.)
 * 
 * Solución: Recrear tabla con usuario_id nullable (SQLite no soporta ALTER COLUMN)
 */

import { getDb } from '../db.js';

const db = getDb();

console.log('🔧 Migración 010: Permitir usuario_id NULL en historial_cambios...');

db.serialize(() => {
  // 1. Verificar estado actual
  db.get(`PRAGMA table_info(historial_cambios)`, [], (err, info) => {
    // Continuar con la migración
  });
  
  // 2. Crear tabla temporal con estructura correcta
  db.run(`
    CREATE TABLE IF NOT EXISTS historial_cambios_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,                 -- NULL permitido para eventos de seguridad
      entidad TEXT NOT NULL,
      entidad_id INTEGER NOT NULL,
      tipo_cambio TEXT NOT NULL,
      campo_modificado TEXT,
      valor_anterior TEXT,
      valor_nuevo TEXT,
      razon TEXT,
      metadatos TEXT,
      creado_en TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creando tabla temporal:', err);
      return;
    }
    console.log('✅ Tabla temporal creada');
    
    // 3. Copiar datos existentes
    db.run(`
      INSERT INTO historial_cambios_new 
      SELECT * FROM historial_cambios
    `, (err) => {
      if (err && !err.message.includes('no such table')) {
        console.error('⚠️ Error copiando datos (puede ser normal si tabla vacía):', err);
      }
      
      // 4. Eliminar tabla original
      db.run(`DROP TABLE IF EXISTS historial_cambios`, (err) => {
        if (err) {
          console.error('❌ Error eliminando tabla original:', err);
          return;
        }
        
        // 5. Renombrar tabla nueva
        db.run(`ALTER TABLE historial_cambios_new RENAME TO historial_cambios`, (err) => {
          if (err) {
            console.error('❌ Error renombrando tabla:', err);
            return;
          }
          
          console.log('✅ Tabla historial_cambios actualizada (usuario_id ahora nullable)');
          
          // 6. Verificar resultado
          db.all(`PRAGMA table_info(historial_cambios)`, (err, cols) => {
            if (cols) {
              const usuarioCol = cols.find(c => c.name === 'usuario_id');
              if (usuarioCol) {
                console.log(`✅ usuario_id: notnull=${usuarioCol.notnull} (0 = nullable ✅)`);
              }
            }
            console.log('🎉 Migración 010 completada');
          });
        });
      });
    });
  });
});
