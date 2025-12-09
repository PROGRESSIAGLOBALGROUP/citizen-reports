/**
 * 🚨 Sistema de Alertas Automáticas - citizen-reports
 * 
 * Detecta condiciones críticas y genera alertas:
 * - Umbral de reportes pendientes por dependencia
 * - Violaciones de SLA de asignación (>24h sin asignar)
 * - Violaciones de SLA de cierre (>72h sin cerrar)
 * - Anomalías (picos 2x sobre el promedio)
 * 
 * @module alertas-automaticas
 */

import { getDb } from './db.js';

// ============================================================
// CONFIGURACIÓN
// ============================================================

const CONFIG = {
  ENABLED: process.env.ALERTS_ENABLED !== 'false',
  THRESHOLD_PENDING_REPORTS: parseInt(process.env.ALERT_THRESHOLD_PENDING) || 10,
  SLA_HOURS_ASSIGN: parseInt(process.env.SLA_HOURS_ASSIGN) || 24,
  SLA_HOURS_CLOSE: parseInt(process.env.SLA_HOURS_CLOSE) || 72,
  ANOMALY_FACTOR: parseFloat(process.env.ALERT_ANOMALY_FACTOR) || 2.0,
  CHECK_INTERVAL_MINUTES: parseInt(process.env.ALERT_CHECK_INTERVAL) || 30
};

// Tipos de alertas
export const ALERT_TYPES = {
  UMBRAL_PENDIENTES: 'umbral_pendientes',
  SLA_ASIGNACION: 'sla_asignacion',
  SLA_CIERRE: 'sla_cierre',
  ANOMALIA: 'anomalia'
};

// Severidades
export const ALERT_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical'
};

// Timer para verificación periódica
let verificacionTimer = null;

// ============================================================
// FUNCIONES DE DETECCIÓN
// ============================================================

/**
 * Detecta dependencias con umbral de pendientes excedido
 * @returns {Promise<Array>} Lista de alertas generadas
 */
export async function detectarUmbralPendientes() {
  const db = getDb();
  const alertas = [];
  
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        dependencia,
        COUNT(*) as pendientes
      FROM reportes
      WHERE estado = 'pendiente'
      GROUP BY dependencia
      HAVING pendientes >= ?
    `;
    
    db.all(sql, [CONFIG.THRESHOLD_PENDING_REPORTS], async (err, rows) => {
      if (err) {
        console.error('[ALERTAS] Error detectando umbral pendientes:', err);
        return resolve([]);
      }
      
      for (const row of (rows || [])) {
        const alerta = {
          tipo: ALERT_TYPES.UMBRAL_PENDIENTES,
          severidad: row.pendientes >= CONFIG.THRESHOLD_PENDING_REPORTS * 2 
            ? ALERT_SEVERITY.CRITICAL 
            : ALERT_SEVERITY.WARNING,
          dependencia: row.dependencia,
          mensaje: `Dependencia ${row.dependencia} tiene ${row.pendientes} reportes pendientes (umbral: ${CONFIG.THRESHOLD_PENDING_REPORTS})`,
          datos: { pendientes: row.pendientes, umbral: CONFIG.THRESHOLD_PENDING_REPORTS }
        };
        
        await guardarAlerta(alerta);
        alertas.push(alerta);
      }
      
      resolve(alertas);
    });
  });
}

/**
 * Detecta reportes que exceden SLA de asignación (>24h sin asignar)
 * @returns {Promise<Array>} Lista de alertas generadas
 */
export async function detectarViolacionesSLAAsignacion() {
  const db = getDb();
  const alertas = [];
  
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        r.id,
        r.tipo,
        r.dependencia,
        r.creado_en,
        julianday('now') - julianday(r.creado_en) as dias_sin_asignar
      FROM reportes r
      WHERE r.estado = 'pendiente'
        AND (julianday('now') - julianday(r.creado_en)) * 24 > ?
    `;
    
    db.all(sql, [CONFIG.SLA_HOURS_ASSIGN], async (err, rows) => {
      if (err) {
        console.error('[ALERTAS] Error detectando SLA asignación:', err);
        return resolve([]);
      }
      
      for (const row of (rows || [])) {
        const horasSinAsignar = Math.round(row.dias_sin_asignar * 24);
        const alerta = {
          tipo: ALERT_TYPES.SLA_ASIGNACION,
          severidad: horasSinAsignar > CONFIG.SLA_HOURS_ASSIGN * 2 
            ? ALERT_SEVERITY.CRITICAL 
            : ALERT_SEVERITY.WARNING,
          dependencia: row.dependencia,
          reporte_id: row.id,
          mensaje: `Reporte #${row.id} sin asignar por ${horasSinAsignar}h (SLA: ${CONFIG.SLA_HOURS_ASSIGN}h)`,
          datos: { 
            reporte_id: row.id, 
            tipo: row.tipo, 
            horas_sin_asignar: horasSinAsignar,
            sla_horas: CONFIG.SLA_HOURS_ASSIGN
          }
        };
        
        await guardarAlerta(alerta);
        alertas.push(alerta);
      }
      
      resolve(alertas);
    });
  });
}

/**
 * Detecta reportes que exceden SLA de cierre (>72h en proceso)
 * @returns {Promise<Array>} Lista de alertas generadas
 */
export async function detectarViolacionesSLACierre() {
  const db = getDb();
  const alertas = [];
  
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        r.id,
        r.tipo,
        r.dependencia,
        r.creado_en,
        julianday('now') - julianday(r.creado_en) as dias_abierto
      FROM reportes r
      WHERE r.estado = 'en_proceso'
        AND (julianday('now') - julianday(r.creado_en)) * 24 > ?
    `;
    
    db.all(sql, [CONFIG.SLA_HOURS_CLOSE], async (err, rows) => {
      if (err) {
        console.error('[ALERTAS] Error detectando SLA cierre:', err);
        return resolve([]);
      }
      
      for (const row of (rows || [])) {
        const horasAbierto = Math.round(row.dias_abierto * 24);
        const alerta = {
          tipo: ALERT_TYPES.SLA_CIERRE,
          severidad: horasAbierto > CONFIG.SLA_HOURS_CLOSE * 2 
            ? ALERT_SEVERITY.CRITICAL 
            : ALERT_SEVERITY.WARNING,
          dependencia: row.dependencia,
          reporte_id: row.id,
          mensaje: `Reporte #${row.id} sin cerrar por ${horasAbierto}h (SLA: ${CONFIG.SLA_HOURS_CLOSE}h)`,
          datos: { 
            reporte_id: row.id, 
            tipo: row.tipo, 
            horas_abierto: horasAbierto,
            sla_horas: CONFIG.SLA_HOURS_CLOSE
          }
        };
        
        await guardarAlerta(alerta);
        alertas.push(alerta);
      }
      
      resolve(alertas);
    });
  });
}

/**
 * Detecta anomalías (picos inusuales de reportes)
 * @returns {Promise<Array>} Lista de alertas generadas
 */
export async function detectarAnomalias() {
  const db = getDb();
  const alertas = [];
  
  return new Promise((resolve, reject) => {
    // Promedio de reportes por día en últimos 30 días
    const sqlPromedio = `
      SELECT 
        dependencia,
        COUNT(*) * 1.0 / 30 as promedio_diario
      FROM reportes
      WHERE creado_en >= date('now', '-30 days')
      GROUP BY dependencia
    `;
    
    db.all(sqlPromedio, [], (err, promedios) => {
      if (err) {
        console.error('[ALERTAS] Error calculando promedios:', err);
        return resolve([]);
      }
      
      const promediosPorDependencia = {};
      for (const p of (promedios || [])) {
        promediosPorDependencia[p.dependencia] = p.promedio_diario;
      }
      
      // Reportes de hoy por dependencia
      const sqlHoy = `
        SELECT 
          dependencia,
          COUNT(*) as reportes_hoy
        FROM reportes
        WHERE date(creado_en) = date('now')
        GROUP BY dependencia
      `;
      
      db.all(sqlHoy, [], async (err2, hoy) => {
        if (err2) {
          console.error('[ALERTAS] Error obteniendo reportes de hoy:', err2);
          return resolve([]);
        }
        
        for (const row of (hoy || [])) {
          const promedio = promediosPorDependencia[row.dependencia] || 1;
          const factor = row.reportes_hoy / promedio;
          
          if (factor >= CONFIG.ANOMALY_FACTOR) {
            const alerta = {
              tipo: ALERT_TYPES.ANOMALIA,
              severidad: factor >= CONFIG.ANOMALY_FACTOR * 2 
                ? ALERT_SEVERITY.CRITICAL 
                : ALERT_SEVERITY.WARNING,
              dependencia: row.dependencia,
              mensaje: `Anomalía detectada: ${row.reportes_hoy} reportes hoy (${factor.toFixed(1)}x el promedio de ${promedio.toFixed(1)})`,
              datos: { 
                reportes_hoy: row.reportes_hoy, 
                promedio_diario: promedio,
                factor: factor.toFixed(2)
              }
            };
            
            await guardarAlerta(alerta);
            alertas.push(alerta);
          }
        }
        
        resolve(alertas);
      });
    });
  });
}

// ============================================================
// FUNCIONES DE PERSISTENCIA
// ============================================================

/**
 * Guarda una alerta en la base de datos (evita duplicados)
 * @param {Object} alerta - Datos de la alerta
 */
async function guardarAlerta(alerta) {
  const db = getDb();
  
  return new Promise((resolve, reject) => {
    // Verificar si ya existe una alerta similar activa
    const sqlCheck = `
      SELECT id FROM alertas 
      WHERE tipo = ? 
        AND dependencia = ? 
        AND resuelta = 0
        AND (reporte_id = ? OR (reporte_id IS NULL AND ? IS NULL))
        AND fecha_creacion >= datetime('now', '-24 hours')
    `;
    
    db.get(sqlCheck, [
      alerta.tipo, 
      alerta.dependencia, 
      alerta.reporte_id || null,
      alerta.reporte_id || null
    ], (err, existing) => {
      if (err) {
        console.error('[ALERTAS] Error verificando duplicados:', err);
        return resolve(false);
      }
      
      if (existing) {
        // Ya existe, no crear duplicado
        return resolve(false);
      }
      
      // Insertar nueva alerta
      const sqlInsert = `
        INSERT INTO alertas (tipo, severidad, dependencia, reporte_id, mensaje, datos, fecha_creacion)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `;
      
      db.run(sqlInsert, [
        alerta.tipo,
        alerta.severidad,
        alerta.dependencia,
        alerta.reporte_id || null,
        alerta.mensaje,
        JSON.stringify(alerta.datos || {})
      ], function(err2) {
        if (err2) {
          // La tabla podría no existir, crearla
          if (err2.message.includes('no such table')) {
            crearTablaAlertas().then(() => {
              guardarAlerta(alerta).then(resolve);
            });
            return;
          }
          console.error('[ALERTAS] Error guardando alerta:', err2);
          return resolve(false);
        }
        
        console.log(`[ALERTAS] ✅ Nueva alerta creada: ${alerta.tipo} - ${alerta.mensaje}`);
        resolve(true);
      });
    });
  });
}

/**
 * Crea la tabla de alertas si no existe
 */
async function crearTablaAlertas() {
  const db = getDb();
  
  return new Promise((resolve, reject) => {
    const sql = `
      CREATE TABLE IF NOT EXISTS alertas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT NOT NULL,
        severidad TEXT NOT NULL DEFAULT 'warning',
        dependencia TEXT,
        reporte_id INTEGER,
        mensaje TEXT NOT NULL,
        datos TEXT DEFAULT '{}',
        resuelta INTEGER DEFAULT 0,
        resuelta_por INTEGER,
        fecha_creacion TEXT DEFAULT (datetime('now')),
        fecha_resolucion TEXT,
        FOREIGN KEY (resuelta_por) REFERENCES usuarios(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_alertas_tipo ON alertas(tipo);
      CREATE INDEX IF NOT EXISTS idx_alertas_dependencia ON alertas(dependencia);
      CREATE INDEX IF NOT EXISTS idx_alertas_resuelta ON alertas(resuelta);
    `;
    
    db.exec(sql, (err) => {
      if (err) {
        console.error('[ALERTAS] Error creando tabla:', err);
        return reject(err);
      }
      console.log('[ALERTAS] ✅ Tabla alertas creada/verificada');
      resolve();
    });
  });
}

// ============================================================
// FUNCIONES PÚBLICAS
// ============================================================

/**
 * Obtiene alertas activas (no resueltas)
 * @param {Object} filtros - Filtros opcionales
 * @returns {Promise<Array>}
 */
export async function obtenerAlertasActivas(filtros = {}) {
  const db = getDb();
  
  return new Promise((resolve, reject) => {
    let sql = `
      SELECT 
        id, tipo, severidad, dependencia, reporte_id, 
        mensaje, datos, fecha_creacion
      FROM alertas 
      WHERE resuelta = 0
    `;
    
    const params = [];
    
    if (filtros.dependencia) {
      sql += ' AND dependencia = ?';
      params.push(filtros.dependencia);
    }
    
    if (filtros.severidad) {
      sql += ' AND severidad = ?';
      params.push(filtros.severidad);
    }
    
    if (filtros.tipo) {
      sql += ' AND tipo = ?';
      params.push(filtros.tipo);
    }
    
    sql += ' ORDER BY fecha_creacion DESC';
    
    db.all(sql, params, (err, rows) => {
      if (err) {
        if (err.message.includes('no such table')) {
          return resolve([]);
        }
        console.error('[ALERTAS] Error obteniendo alertas:', err);
        return resolve([]);
      }
      
      // Parsear JSON de datos
      const alertas = (rows || []).map(row => ({
        ...row,
        datos: JSON.parse(row.datos || '{}')
      }));
      
      resolve(alertas);
    });
  });
}

/**
 * Obtiene estadísticas de alertas
 * @returns {Promise<Object>}
 */
export async function obtenerEstadisticasAlertas() {
  const db = getDb();
  
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        COUNT(*) FILTER (WHERE resuelta = 0) as activas,
        COUNT(*) FILTER (WHERE resuelta = 0 AND severidad = 'critical') as criticas,
        COUNT(*) FILTER (WHERE resuelta = 0 AND severidad = 'warning') as advertencias,
        COUNT(*) FILTER (WHERE resuelta = 0 AND severidad = 'info') as informativas,
        COUNT(*) FILTER (WHERE resuelta = 1 AND fecha_resolucion >= datetime('now', '-24 hours')) as resueltas_24h,
        COUNT(*) as total
      FROM alertas
    `;
    
    db.get(sql, [], (err, row) => {
      if (err) {
        // Fallback para SQLite sin FILTER
        if (err.message.includes('FILTER')) {
          return obtenerEstadisticasAlertasFallback().then(resolve);
        }
        if (err.message.includes('no such table')) {
          return resolve({
            activas: 0,
            criticas: 0,
            advertencias: 0,
            informativas: 0,
            resueltas_24h: 0,
            total: 0
          });
        }
        console.error('[ALERTAS] Error obteniendo estadísticas:', err);
        return resolve({ activas: 0, criticas: 0, advertencias: 0 });
      }
      
      resolve(row || { activas: 0, criticas: 0, advertencias: 0 });
    });
  });
}

/**
 * Fallback para estadísticas sin FILTER clause
 */
async function obtenerEstadisticasAlertasFallback() {
  const db = getDb();
  
  return new Promise((resolve) => {
    const sqlActivas = `SELECT COUNT(*) as count FROM alertas WHERE resuelta = 0`;
    const sqlCriticas = `SELECT COUNT(*) as count FROM alertas WHERE resuelta = 0 AND severidad = 'critical'`;
    const sqlAdvertencias = `SELECT COUNT(*) as count FROM alertas WHERE resuelta = 0 AND severidad = 'warning'`;
    
    db.get(sqlActivas, [], (err, activas) => {
      db.get(sqlCriticas, [], (err2, criticas) => {
        db.get(sqlAdvertencias, [], (err3, advertencias) => {
          resolve({
            activas: activas?.count || 0,
            criticas: criticas?.count || 0,
            advertencias: advertencias?.count || 0,
            informativas: 0,
            resueltas_24h: 0,
            total: activas?.count || 0
          });
        });
      });
    });
  });
}

/**
 * Obtiene la configuración actual del sistema de alertas
 * @returns {Object}
 */
export function obtenerConfiguracionAlertas() {
  return {
    ENABLED: CONFIG.ENABLED,
    THRESHOLD_PENDING_REPORTS: CONFIG.THRESHOLD_PENDING_REPORTS,
    SLA_HOURS_ASSIGN: CONFIG.SLA_HOURS_ASSIGN,
    SLA_HOURS_CLOSE: CONFIG.SLA_HOURS_CLOSE,
    ANOMALY_FACTOR: CONFIG.ANOMALY_FACTOR,
    CHECK_INTERVAL_MINUTES: CONFIG.CHECK_INTERVAL_MINUTES
  };
}

/**
 * Marca una alerta como resuelta
 * @param {number} alertaId - ID de la alerta
 * @param {number} usuarioId - ID del usuario que resuelve
 * @returns {Promise<boolean>}
 */
export async function resolverAlerta(alertaId, usuarioId) {
  const db = getDb();
  
  return new Promise((resolve) => {
    const sql = `
      UPDATE alertas 
      SET resuelta = 1, 
          resuelta_por = ?, 
          fecha_resolucion = datetime('now')
      WHERE id = ? AND resuelta = 0
    `;
    
    db.run(sql, [usuarioId, alertaId], function(err) {
      if (err) {
        console.error('[ALERTAS] Error resolviendo alerta:', err);
        return resolve(false);
      }
      
      if (this.changes === 0) {
        return resolve(false);
      }
      
      console.log(`[ALERTAS] ✅ Alerta #${alertaId} resuelta por usuario #${usuarioId}`);
      resolve(true);
    });
  });
}

/**
 * Ejecuta todas las verificaciones de alertas
 * @returns {Promise<Array>} Todas las alertas detectadas
 */
export async function ejecutarVerificaciones() {
  if (!CONFIG.ENABLED) {
    console.log('[ALERTAS] Sistema deshabilitado');
    return [];
  }
  
  console.log('[ALERTAS] 🔍 Iniciando verificaciones...');
  
  const alertas = [];
  
  try {
    // Ejecutar detecciones en paralelo
    const [pendientes, slaAsign, slaCierre, anomalias] = await Promise.all([
      detectarUmbralPendientes(),
      detectarViolacionesSLAAsignacion(),
      detectarViolacionesSLACierre(),
      detectarAnomalias()
    ]);
    
    alertas.push(...pendientes, ...slaAsign, ...slaCierre, ...anomalias);
    
    console.log(`[ALERTAS] ✅ Verificación completada: ${alertas.length} alertas detectadas`);
    console.log(`  - Umbral pendientes: ${pendientes.length}`);
    console.log(`  - SLA asignación: ${slaAsign.length}`);
    console.log(`  - SLA cierre: ${slaCierre.length}`);
    console.log(`  - Anomalías: ${anomalias.length}`);
    
  } catch (error) {
    console.error('[ALERTAS] Error en verificaciones:', error);
  }
  
  return alertas;
}

/**
 * Inicia verificación periódica de alertas
 */
export function iniciarVerificacionPeriodica() {
  if (!CONFIG.ENABLED) {
    console.log('[ALERTAS] Sistema deshabilitado, no se inicia verificación periódica');
    return;
  }
  
  // Limpiar timer anterior si existe
  if (verificacionTimer) {
    clearInterval(verificacionTimer);
  }
  
  const intervaloMs = CONFIG.CHECK_INTERVAL_MINUTES * 60 * 1000;
  
  console.log(`[ALERTAS] ⏰ Verificación periódica iniciada (cada ${CONFIG.CHECK_INTERVAL_MINUTES} min)`);
  
  // Primera verificación después de 1 minuto
  setTimeout(() => {
    ejecutarVerificaciones().catch(console.error);
  }, 60000);
  
  // Verificaciones periódicas
  verificacionTimer = setInterval(() => {
    ejecutarVerificaciones().catch(console.error);
  }, intervaloMs);
}

/**
 * Detiene verificación periódica
 */
export function detenerVerificacionPeriodica() {
  if (verificacionTimer) {
    clearInterval(verificacionTimer);
    verificacionTimer = null;
    console.log('[ALERTAS] ⏹️ Verificación periódica detenida');
  }
}

console.log('[ALERTAS] ✅ Módulo alertas-automaticas cargado');
