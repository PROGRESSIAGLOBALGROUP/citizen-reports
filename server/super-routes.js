/**
 * 🔐 Super User Routes - Acceso de emergencia y herramientas avanzadas
 * citizen-reports
 * 
 * ⚠️ PELIGRO: Estas rutas permiten acceso directo a la base de datos.
 * Solo deben usarse en emergencias o desarrollo.
 * 
 * Endpoints:
 * - POST /api/super/query - Ejecutar SQL directo
 * - GET  /api/super/tables - Listar tablas de la BD
 * 
 * @module super-routes
 */

import { getDb } from './db.js';

// Token de super usuario (configurar en .env)
const SUPER_TOKEN = process.env.SUPER_USER_TOKEN || process.env.SUPER_TOKEN || '';

// Lista de comandos SQL destructivos que requieren confirmación extra
const DESTRUCTIVE_KEYWORDS = ['DELETE', 'DROP', 'TRUNCATE', 'UPDATE', 'ALTER', 'INSERT'];

// Timeout máximo para queries (30 segundos)
const QUERY_TIMEOUT = 30000;

/**
 * Middleware para validar token de super usuario
 */
export function validarSuperToken(req, res, next) {
  const token = req.headers['x-super-user-token'] || req.headers['x-super-token'];
  
  // Leer token dinámicamente (permite configuración en runtime para tests)
  const superToken = process.env.SUPER_USER_TOKEN || process.env.SUPER_TOKEN || '';
  
  if (!superToken) {
    return res.status(503).json({ 
      error: 'Super user token no configurado en el servidor',
      hint: 'Configura SUPER_USER_TOKEN en las variables de entorno'
    });
  }
  
  if (!token) {
    return res.status(401).json({ error: 'Token de super usuario requerido' });
  }
  
  if (token !== superToken) {
    console.warn(`[SUPER] Intento de acceso con token inválido desde ${req.ip}`);
    return res.status(403).json({ error: 'Token de super usuario inválido' });
  }
  
  // Log de acceso
  console.log(`[SUPER] ✅ Acceso autorizado desde ${req.ip}`);
  next();
}

/**
 * Ejecutar query SQL directamente
 * POST /api/super/query
 * Headers: X-Super-User-Token: <token>
 * Body: { sql: "SELECT * FROM ...", confirmacion?: "ejecutar_destructivo" }
 */
export function ejecutarQuery(req, res) {
  const { sql, confirmacion } = req.body;
  
  if (!sql || typeof sql !== 'string') {
    return res.status(400).json({ error: 'Query SQL requerida' });
  }
  
  const sqlTrimmed = sql.trim();
  const sqlUpper = sqlTrimmed.toUpperCase();
  
  // Detectar si es query destructiva
  const esDestructiva = DESTRUCTIVE_KEYWORDS.some(kw => sqlUpper.startsWith(kw));
  
  if (esDestructiva && confirmacion !== 'ejecutar_destructivo') {
    return res.status(400).json({ 
      error: 'Query destructiva detectada. Requiere confirmación.',
      hint: 'Agrega { confirmacion: "ejecutar_destructivo" } al body',
      destructive: true
    });
  }
  
  // Validar que no sea múltiples queries (prevenir SQL injection complejo)
  if (sqlTrimmed.includes(';') && sqlTrimmed.indexOf(';') < sqlTrimmed.length - 1) {
    return res.status(400).json({ 
      error: 'Solo se permite una query por ejecución',
      hint: 'Ejecuta cada query por separado'
    });
  }
  
  const db = getDb();
  const startTime = Date.now();
  
  // Log de la query
  console.log(`[SUPER] 📝 Ejecutando query: ${sqlTrimmed.substring(0, 100)}...`);
  
  // Determinar tipo de query
  const esSelect = sqlUpper.startsWith('SELECT') || sqlUpper.startsWith('PRAGMA');
  
  // Crear timeout
  const timeoutId = setTimeout(() => {
    console.error('[SUPER] ⏱️ Query timeout');
    res.status(408).json({ error: 'Query timeout (30s)' });
  }, QUERY_TIMEOUT);
  
  if (esSelect) {
    // Query de lectura
    db.all(sqlTrimmed, [], (err, rows) => {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      
      if (err) {
        console.error('[SUPER] ❌ Error en query:', err.message);
        registrarEnHistorial(db, req, sqlTrimmed, 'error', err.message);
        return res.status(400).json({ 
          error: 'Error ejecutando query',
          details: err.message,
          duration: `${duration}ms`
        });
      }
      
      registrarEnHistorial(db, req, sqlTrimmed, 'select', `${rows.length} filas`);
      
      res.json({
        ok: true,
        type: 'select',
        rowCount: rows.length,
        columns: rows.length > 0 ? Object.keys(rows[0]) : [],
        rows: rows.slice(0, 1000), // Limitar a 1000 filas
        truncated: rows.length > 1000,
        duration: `${duration}ms`
      });
    });
  } else {
    // Query de escritura
    db.run(sqlTrimmed, [], function(err) {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      
      if (err) {
        console.error('[SUPER] ❌ Error en query:', err.message);
        registrarEnHistorial(db, req, sqlTrimmed, 'error', err.message);
        return res.status(400).json({ 
          error: 'Error ejecutando query',
          details: err.message,
          duration: `${duration}ms`
        });
      }
      
      const resultado = `${this.changes} filas afectadas`;
      registrarEnHistorial(db, req, sqlTrimmed, 'write', resultado);
      
      res.json({
        ok: true,
        type: 'write',
        changes: this.changes,
        lastInsertRowid: this.lastID,
        duration: `${duration}ms`
      });
    });
  }
}

/**
 * Listar tablas de la base de datos
 * GET /api/super/tables
 */
export function listarTablas(req, res) {
  const db = getDb();
  
  db.all(
    `SELECT name, type FROM sqlite_master 
     WHERE type IN ('table', 'index', 'view') 
     AND name NOT LIKE 'sqlite_%'
     ORDER BY type, name`,
    [],
    (err, rows) => {
      if (err) {
        console.error('[SUPER] Error listando tablas:', err);
        return res.status(500).json({ error: 'Error al listar tablas' });
      }
      
      const tables = rows.filter(r => r.type === 'table').map(r => r.name);
      const indexes = rows.filter(r => r.type === 'index').map(r => r.name);
      const views = rows.filter(r => r.type === 'view').map(r => r.name);
      
      res.json({
        tables,
        indexes,
        views,
        total: {
          tables: tables.length,
          indexes: indexes.length,
          views: views.length
        }
      });
    }
  );
}

/**
 * Obtener esquema de una tabla
 * GET /api/super/schema/:table
 */
export function obtenerEsquemaTabla(req, res) {
  const { table } = req.params;
  const db = getDb();
  
  // Validar nombre de tabla (prevenir injection)
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
    return res.status(400).json({ error: 'Nombre de tabla inválido' });
  }
  
  db.all(`PRAGMA table_info(${table})`, [], (err, columns) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener esquema' });
    }
    
    if (columns.length === 0) {
      return res.status(404).json({ error: 'Tabla no encontrada' });
    }
    
    db.all(`PRAGMA foreign_key_list(${table})`, [], (err2, fkeys) => {
      db.all(`PRAGMA index_list(${table})`, [], (err3, indexes) => {
        res.json({
          table,
          columns: columns.map(c => ({
            name: c.name,
            type: c.type,
            nullable: c.notnull === 0,
            defaultValue: c.dflt_value,
            isPrimaryKey: c.pk === 1
          })),
          foreignKeys: fkeys || [],
          indexes: indexes || []
        });
      });
    });
  });
}

/**
 * Registrar query en historial para auditoría
 */
function registrarEnHistorial(db, req, sql, tipo, resultado) {
  const sqlResumen = sql.length > 200 ? sql.substring(0, 200) + '...' : sql;
  
  // Metadata con IP y user-agent (historial_cambios no tiene columnas separadas)
  const metadatos = JSON.stringify({
    ip: req.ip || req.connection?.remoteAddress,
    user_agent: req.get('user-agent'),
    sql: sqlResumen,
    resultado
  });
  
  db.run(
    `INSERT INTO historial_cambios 
     (usuario_id, entidad, entidad_id, tipo_cambio, valor_nuevo, razon, metadatos)
     VALUES (?, 'super_query', 0, ?, ?, ?, ?)`,
    [
      null, // Super user no tiene usuario_id
      `super_${tipo}`,
      JSON.stringify({ sql: sqlResumen, resultado }),
      'Ejecución de query via Super User Console',
      metadatos
    ],
    (err) => {
      if (err) {
        console.error('[SUPER] Error registrando en historial:', err);
      }
    }
  );
}

/**
 * Configurar rutas de super usuario
 */
export function configurarRutas(app) {
  // Todas las rutas requieren token de super usuario
  app.post('/api/super/query', validarSuperToken, ejecutarQuery);
  app.get('/api/super/tables', validarSuperToken, listarTablas);
  app.get('/api/super/schema/:table', validarSuperToken, obtenerEsquemaTabla);
  
  console.log('[SUPER] 🔐 Rutas de super usuario configuradas');
}

export default {
  validarSuperToken,
  ejecutarQuery,
  listarTablas,
  obtenerEsquemaTabla,
  configurarRutas
};
