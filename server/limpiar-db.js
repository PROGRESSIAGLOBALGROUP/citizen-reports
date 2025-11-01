import sqlite3 from 'sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, 'data.db');

/**
 * Script para limpiar la base de datos manteniendo solo usuarios y sesiones
 * 
 * Elimina:
 * - Todos los reportes
 * - Todas las asignaciones
 * - Todos los cierres pendientes
 * - Todo el historial de cambios
 * 
 * Mantiene:
 * - Usuarios
 * - Sesiones activas
 */

async function limpiarDatabase() {
  console.log(`📂 Usando base de datos: ${DB_PATH}\n`);
  const db = new sqlite3.Database(DB_PATH);
  
  console.log('🧹 Iniciando limpieza de la base de datos...\n');
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Contar registros antes de eliminar
      db.get('SELECT COUNT(*) as total FROM reportes', (err, row) => {
        if (err) {
          console.error('❌ Error al contar reportes:', err.message);
          reject(err);
          return;
        }
        console.log(`📊 Reportes a eliminar: ${row.total}`);
      });
      
      db.get('SELECT COUNT(*) as total FROM asignaciones', (err, row) => {
        if (err) {
          console.error('❌ Error al contar asignaciones:', err.message);
          reject(err);
          return;
        }
        console.log(`📊 Asignaciones a eliminar: ${row.total}`);
      });
      
      db.get('SELECT COUNT(*) as total FROM cierres_pendientes', (err, row) => {
        if (err) {
          console.error('❌ Error al contar cierres pendientes:', err.message);
          reject(err);
          return;
        }
        console.log(`📊 Cierres pendientes a eliminar: ${row.total}`);
      });
      
      db.get('SELECT COUNT(*) as total FROM historial_cambios', (err, row) => {
        if (err) {
          // Si la tabla no existe, no es error
          if (!err.message.includes('no such table')) {
            console.error('❌ Error al contar historial:', err.message);
          }
        } else {
          console.log(`📊 Registros de historial a eliminar: ${row.total}`);
        }
      });
      
      db.get('SELECT COUNT(*) as total FROM usuarios', (err, row) => {
        if (err) {
          console.error('❌ Error al contar usuarios:', err.message);
          reject(err);
          return;
        }
        console.log(`✅ Usuarios a mantener: ${row.total}`);
      });
      
      db.get('SELECT COUNT(*) as total FROM sesiones', (err, row) => {
        if (err) {
          console.error('❌ Error al contar sesiones:', err.message);
          reject(err);
          return;
        }
        console.log(`✅ Sesiones a mantener: ${row.total}\n`);
      });
      
      console.log('🗑️  Eliminando datos...\n');
      
      // Eliminar en orden correcto (respetando foreign keys)
      
      // 1. Historial de cambios (si existe)
      db.run('DELETE FROM historial_cambios', (err) => {
        if (err && !err.message.includes('no such table')) {
          console.error('❌ Error al eliminar historial:', err.message);
        } else if (!err) {
          console.log('✅ Historial de cambios eliminado');
        }
      });
      
      // 2. Cierres pendientes
      db.run('DELETE FROM cierres_pendientes', (err) => {
        if (err) {
          console.error('❌ Error al eliminar cierres pendientes:', err.message);
          reject(err);
          return;
        }
        console.log('✅ Cierres pendientes eliminados');
      });
      
      // 3. Asignaciones
      db.run('DELETE FROM asignaciones', (err) => {
        if (err) {
          console.error('❌ Error al eliminar asignaciones:', err.message);
          reject(err);
          return;
        }
        console.log('✅ Asignaciones eliminadas');
      });
      
      // 4. Reportes (esto eliminará automáticamente sus dependencias por CASCADE)
      db.run('DELETE FROM reportes', (err) => {
        if (err) {
          console.error('❌ Error al eliminar reportes:', err.message);
          reject(err);
          return;
        }
        console.log('✅ Reportes eliminados');
      });
      
      // Resetear autoincrement
      db.run('DELETE FROM sqlite_sequence WHERE name IN (?, ?, ?, ?)', 
        ['reportes', 'asignaciones', 'cierres_pendientes', 'historial_cambios'], 
        (err) => {
          if (err) {
            console.error('❌ Error al resetear autoincrement:', err.message);
          } else {
            console.log('✅ Contadores de ID reseteados');
          }
      });
      
      // Verificar resultado final
      db.get('SELECT COUNT(*) as total FROM reportes', (err, row) => {
        if (err) {
          console.error('❌ Error al verificar reportes:', err.message);
          reject(err);
          return;
        }
        console.log(`\n📊 Verificación final:`);
        console.log(`   Reportes restantes: ${row.total}`);
      });
      
      db.get('SELECT COUNT(*) as total FROM usuarios', (err, row) => {
        if (err) {
          console.error('❌ Error al verificar usuarios:', err.message);
          reject(err);
          return;
        }
        console.log(`   Usuarios mantenidos: ${row.total}`);
      });
      
      db.get('SELECT COUNT(*) as total FROM sesiones', (err, row) => {
        if (err) {
          console.error('❌ Error al verificar sesiones:', err.message);
          reject(err);
          return;
        }
        console.log(`   Sesiones mantenidas: ${row.total}`);
        console.log('\n✅ Base de datos limpiada exitosamente');
        console.log('💡 Los usuarios pueden seguir iniciando sesión normalmente');
        resolve();
      });
    });
  });
}

// Ejecutar limpieza
limpiarDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error fatal durante la limpieza:', err);
    process.exit(1);
  });
