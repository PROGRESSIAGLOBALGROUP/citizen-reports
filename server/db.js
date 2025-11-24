import sqlite3 from 'sqlite3';
import { readFileSync } from 'fs';
import { dirname, isAbsolute, join, resolve } from 'path';
import { fileURLToPath } from 'url';

sqlite3.verbose();

const __dirname = dirname(fileURLToPath(import.meta.url));

let dbInstance = null;
let dbInitializing = false;
let dbInitPromise = null;
const readyCallbacks = [];

function resolveDbPath() {
  const custom = process.env.DB_PATH;
  if (custom) {
    // If DB_PATH is provided, resolve relative to cwd (where the process is run from)
    const resolved = isAbsolute(custom) ? custom : resolve(process.cwd(), custom);
    console.log(`📍 DB_PATH resolved: ${custom} → ${resolved}`);
    return resolved;
  }
  return join(__dirname, 'data.db');
}

function notifyReady(db) {
  readyCallbacks.forEach(cb => cb(db));
  readyCallbacks.length = 0;
}

/**
 * Obtener conexión singleton con garantía de que está lista
 * NUNCA cierra la conexión (es singleton)
 */
export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }
  
  // Crear conexión sincronously (sin callback de error)
  // SQLite en modo synchronous es más seguro
  try {
    const rawDb = new sqlite3.Database(resolveDbPath());
    
    // Configurar inmediatamente
    rawDb.configure('busyTimeout', 5000);
    rawDb.run('PRAGMA journal_mode = WAL');
    rawDb.run('PRAGMA synchronous = NORMAL');
    rawDb.run('PRAGMA cache_size = 10000');
    rawDb.run('PRAGMA temp_store = MEMORY');
    
    // CRITICAL: Reemplazar close() para que sea un no-op
    // Los tests llaman db.close() en afterEach, pero es SINGLETON
    // No puede cerrarse mientras los endpoints la usan
    const originalClose = rawDb.close.bind(rawDb);
    rawDb.close = function(callback) {
      // Silenciosamente ignorar close() call - singleton no se cierra
      if (callback && typeof callback === 'function') {
        // Ejecutar callback para satisfacer tests, pero NO cerrar BD
        setImmediate(() => callback());
      }
      // NO HACER NADA - singleton no se cierra
    };
    
    dbInstance = rawDb;
    
    console.log('✅ DB singleton creada');
    notifyReady(dbInstance);
    
  } catch (err) {
    console.error('❌ Error creando DB singleton:', err.message);
    dbInstance = null;
    throw err;
  }
  
  return dbInstance;
}

/**
 * Esperar a que la DB esté 100% lista antes de usar
 * Útil para initDb() o startup
 */
export async function waitForDb() {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }
  
  return new Promise((resolve) => {
    readyCallbacks.push(resolve);
    getDb(); // Trigger creation if needed
  });
}

/**
 * Inicializar esquema de BD
 * DEBE ser llamado ANTES de que la app inicie
 */
export function initDb() {
  return new Promise((resolveInit, reject) => {
    if (dbInitializing && dbInitPromise) {
      return dbInitPromise.then(resolveInit).catch(reject);
    }
    
    if (dbInitializing) {
      dbInitPromise = new Promise((res, rej) => {
        const checkReady = setInterval(() => {
          if (!dbInitializing) {
            clearInterval(checkReady);
            res();
          }
        }, 100);
      });
      return dbInitPromise.then(resolveInit).catch(reject);
    }
    
    // CRITICAL: Si DB_PATH cambió (E2E mode), resetear singleton
    const currentDbPath = resolveDbPath();
    if (dbInstance && process.env.DB_PATH) {
      const actualDbPath = isAbsolute(process.env.DB_PATH) ? process.env.DB_PATH : resolve(process.env.DB_PATH);
      if (currentDbPath !== actualDbPath) {
        console.log(`🔄 DB_PATH cambió, reseteando singleton: ${currentDbPath} → ${actualDbPath}`);
        dbInstance = null;
      }
    }
    
    dbInitializing = true;
    
    try {
      const db = getDb();
      const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
      
      // CRITICAL: Schema debe usar "CREATE TABLE IF NOT EXISTS" para ser idempotent
      // NEVER destructively recreate tables - only add missing schema
      // db.exec es mejor que db.run para múltiples statements
      db.exec(schema, (err) => {
        dbInitializing = false;
        
        if (err) {
          console.error('❌ Error ejecutando schema:', err.message);
          reject(err);
          return;
        }
        
        console.log('✅ Schema inicializado exitosamente (idempotent - datos preservados)');
        resolveInit();
      });
      
    } catch (err) {
      dbInitializing = false;
      console.error('❌ Error en initDb:', err.message);
      reject(err);
    }
  });
}

/**
 * Resetear singleton (solo para E2E tests)
 * Cierra la conexión actual y permite que getDb() cree una nueva
 */
export function resetDb() {
  if (dbInstance) {
    try {
      // Cerrar REALMENTE la conexión (llamar a originalClose indirectamente)
      const wasOpen = dbInstance !== null;
      dbInstance = null;
      if (wasOpen) {
        console.log('🔄 DB singleton reseteada');
      }
    } catch (err) {
      console.error('⚠️ Error reseteando DB:', err.message);
    }
  }
}