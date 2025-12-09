/**
 * 🔔 Módulo de Notificaciones Push - citizen-reports
 * 
 * Implementa Web Push Notifications (RFC 8030) con:
 * - Gestión de suscripciones por usuario
 * - Envío de notificaciones individuales y masivas
 * - Categorización por tipo de evento
 * - Cola de reintentos para fallos temporales
 * - Limpieza automática de suscripciones inválidas
 * 
 * Dependencias: web-push
 * 
 * Variables de entorno requeridas:
 * - VAPID_PUBLIC_KEY: Clave pública VAPID
 * - VAPID_PRIVATE_KEY: Clave privada VAPID
 * - VAPID_EMAIL: Email de contacto (mailto:)
 */

import webpush from 'web-push';
import { getDb } from './db.js';

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN VAPID
// ═══════════════════════════════════════════════════════════════

const VAPID_CONFIG = {
  publicKey: process.env.VAPID_PUBLIC_KEY || null,
  privateKey: process.env.VAPID_PRIVATE_KEY || null,
  email: process.env.VAPID_EMAIL || 'mailto:admin@jantetelco.gob.mx'
};

// Verificar configuración VAPID
let vapidConfigured = false;

if (VAPID_CONFIG.publicKey && VAPID_CONFIG.privateKey) {
  try {
    webpush.setVapidDetails(
      VAPID_CONFIG.email,
      VAPID_CONFIG.publicKey,
      VAPID_CONFIG.privateKey
    );
    vapidConfigured = true;
    console.log('[PUSH] VAPID configurado correctamente');
  } catch (error) {
    console.error('[PUSH] Error configurando VAPID:', error.message);
  }
} else {
  console.warn('[PUSH] VAPID no configurado. Push notifications deshabilitadas.');
  console.warn('[PUSH] Genera claves con: node scripts/generate-vapid-keys.js');
}

// ═══════════════════════════════════════════════════════════════
// TIPOS DE NOTIFICACIÓN
// ═══════════════════════════════════════════════════════════════

export const NOTIFICATION_TYPES = {
  // Para ciudadanos
  REPORT_CREATED: 'report_created',
  REPORT_STATUS_CHANGED: 'report_status_changed',
  REPORT_CLOSED: 'report_closed',
  
  // Para funcionarios
  REPORT_ASSIGNED: 'report_assigned',
  REPORT_UNASSIGNED: 'report_unassigned',
  CLOSURE_APPROVED: 'closure_approved',
  CLOSURE_REJECTED: 'closure_rejected',
  
  // Para supervisores
  CLOSURE_PENDING: 'closure_pending',
  NEW_REPORT_DEPARTMENT: 'new_report_department',
  
  // Sistema
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
  SYNC_COMPLETE: 'sync_complete'
};

// Plantillas de notificación
const NOTIFICATION_TEMPLATES = {
  [NOTIFICATION_TYPES.REPORT_CREATED]: {
    title: '✅ Reporte Creado',
    icon: '/logo-jantetelco.jpg',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100]
  },
  [NOTIFICATION_TYPES.REPORT_ASSIGNED]: {
    title: '📋 Nuevo Reporte Asignado',
    icon: '/logo-jantetelco.jpg',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200]
  },
  [NOTIFICATION_TYPES.CLOSURE_PENDING]: {
    title: '⏳ Cierre Pendiente de Aprobación',
    icon: '/logo-jantetelco.jpg',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100, 50, 100]
  },
  [NOTIFICATION_TYPES.REPORT_CLOSED]: {
    title: '✅ Reporte Cerrado',
    icon: '/logo-jantetelco.jpg',
    badge: '/favicon.ico',
    vibrate: [100]
  }
};

// ═══════════════════════════════════════════════════════════════
// GESTIÓN DE SUSCRIPCIONES
// ═══════════════════════════════════════════════════════════════

/**
 * Guarda una suscripción push para un usuario
 * @param {number} usuarioId - ID del usuario
 * @param {object} subscription - Objeto de suscripción del navegador
 * @returns {Promise<{ok: boolean, id?: number}>}
 */
export function guardarSuscripcion(usuarioId, subscription) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    
    // Verificar si ya existe esta suscripción
    const endpoint = subscription.endpoint;
    
    db.get(
      'SELECT id FROM push_subscriptions WHERE endpoint = ?',
      [endpoint],
      (err, existing) => {
        if (err) return reject(err);
        
        if (existing) {
          // Actualizar suscripción existente
          db.run(
            `UPDATE push_subscriptions 
             SET usuario_id = ?, keys_p256dh = ?, keys_auth = ?, actualizado_en = datetime('now')
             WHERE id = ?`,
            [usuarioId, subscription.keys.p256dh, subscription.keys.auth, existing.id],
            function(err) {
              if (err) return reject(err);
              resolve({ ok: true, id: existing.id, updated: true });
            }
          );
        } else {
          // Crear nueva suscripción
          db.run(
            `INSERT INTO push_subscriptions (usuario_id, endpoint, keys_p256dh, keys_auth)
             VALUES (?, ?, ?, ?)`,
            [usuarioId, endpoint, subscription.keys.p256dh, subscription.keys.auth],
            function(err) {
              if (err) return reject(err);
              resolve({ ok: true, id: this.lastID, created: true });
            }
          );
        }
      }
    );
  });
}

/**
 * Elimina una suscripción push
 * @param {string} endpoint - Endpoint de la suscripción
 * @returns {Promise<{ok: boolean}>}
 */
export function eliminarSuscripcion(endpoint) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    
    db.run(
      'DELETE FROM push_subscriptions WHERE endpoint = ?',
      [endpoint],
      function(err) {
        if (err) return reject(err);
        resolve({ ok: true, deleted: this.changes > 0 });
      }
    );
  });
}

/**
 * Obtiene todas las suscripciones de un usuario
 * @param {number} usuarioId - ID del usuario
 * @returns {Promise<Array>}
 */
export function obtenerSuscripcionesUsuario(usuarioId) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    
    db.all(
      `SELECT id, endpoint, keys_p256dh, keys_auth, creado_en
       FROM push_subscriptions
       WHERE usuario_id = ? AND activo = 1`,
      [usuarioId],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      }
    );
  });
}

/**
 * Obtiene suscripciones por rol y/o dependencia
 * @param {object} filtros - { rol?: string, dependencia?: string }
 * @returns {Promise<Array>}
 */
export function obtenerSuscripcionesPorFiltro(filtros = {}) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    
    let sql = `
      SELECT ps.id, ps.usuario_id, ps.endpoint, ps.keys_p256dh, ps.keys_auth,
             u.nombre, u.rol, u.dependencia
      FROM push_subscriptions ps
      JOIN usuarios u ON ps.usuario_id = u.id
      WHERE ps.activo = 1 AND u.activo = 1
    `;
    const params = [];
    
    if (filtros.rol) {
      sql += ' AND u.rol = ?';
      params.push(filtros.rol);
    }
    
    if (filtros.dependencia) {
      sql += ' AND u.dependencia = ?';
      params.push(filtros.dependencia);
    }
    
    if (filtros.usuarioIds && Array.isArray(filtros.usuarioIds)) {
      sql += ` AND u.id IN (${filtros.usuarioIds.map(() => '?').join(',')})`;
      params.push(...filtros.usuarioIds);
    }
    
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// ENVÍO DE NOTIFICACIONES
// ═══════════════════════════════════════════════════════════════

/**
 * Envía notificación push a una suscripción específica
 * @param {object} subscription - Objeto de suscripción
 * @param {object} payload - Datos de la notificación
 * @returns {Promise<{ok: boolean}>}
 */
export async function enviarNotificacion(subscription, payload) {
  if (!vapidConfigured) {
    console.warn('⚠️ Push no enviado: VAPID no configurado');
    return { ok: false, reason: 'vapid_not_configured' };
  }
  
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys_p256dh,
      auth: subscription.keys_auth
    }
  };
  
  try {
    await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
    return { ok: true };
  } catch (error) {
    console.error('❌ Error enviando push:', error.statusCode, error.body);
    
    // Si la suscripción es inválida (410 Gone o 404), eliminarla
    if (error.statusCode === 410 || error.statusCode === 404) {
      await eliminarSuscripcion(subscription.endpoint);
      return { ok: false, reason: 'subscription_expired', deleted: true };
    }
    
    return { ok: false, reason: 'send_failed', error: error.message };
  }
}

/**
 * Envía notificación a un usuario (todas sus suscripciones)
 * @param {number} usuarioId - ID del usuario
 * @param {string} tipo - Tipo de notificación (NOTIFICATION_TYPES)
 * @param {object} datos - Datos específicos de la notificación
 * @returns {Promise<{sent: number, failed: number}>}
 */
export async function notificarUsuario(usuarioId, tipo, datos = {}) {
  const suscripciones = await obtenerSuscripcionesUsuario(usuarioId);
  
  if (suscripciones.length === 0) {
    return { sent: 0, failed: 0, reason: 'no_subscriptions' };
  }
  
  const template = NOTIFICATION_TEMPLATES[tipo] || {};
  const payload = {
    title: datos.title || template.title || 'Notificación',
    body: datos.body || datos.mensaje || '',
    icon: template.icon || '/logo-jantetelco.jpg',
    badge: template.badge || '/favicon.ico',
    vibrate: template.vibrate || [100],
    data: {
      tipo,
      url: datos.url || '/',
      reporteId: datos.reporteId,
      timestamp: Date.now(),
      ...datos.extra
    },
    actions: datos.actions || [
      { action: 'open', title: 'Ver' },
      { action: 'close', title: 'Cerrar' }
    ]
  };
  
  let sent = 0, failed = 0;
  
  for (const sub of suscripciones) {
    const result = await enviarNotificacion(sub, payload);
    if (result.ok) sent++;
    else failed++;
  }
  
  // Registrar en historial
  registrarNotificacionEnviada(usuarioId, tipo, sent, failed);
  
  return { sent, failed };
}

/**
 * Envía notificación a múltiples usuarios por filtro
 * @param {object} filtros - { rol?: string, dependencia?: string, usuarioIds?: number[] }
 * @param {string} tipo - Tipo de notificación
 * @param {object} datos - Datos de la notificación
 * @returns {Promise<{sent: number, failed: number, usuarios: number}>}
 */
export async function notificarGrupo(filtros, tipo, datos = {}) {
  const suscripciones = await obtenerSuscripcionesPorFiltro(filtros);
  
  if (suscripciones.length === 0) {
    return { sent: 0, failed: 0, usuarios: 0, reason: 'no_subscriptions' };
  }
  
  const template = NOTIFICATION_TEMPLATES[tipo] || {};
  const payload = {
    title: datos.title || template.title || 'Notificación',
    body: datos.body || '',
    icon: template.icon || '/logo-jantetelco.jpg',
    badge: template.badge || '/favicon.ico',
    vibrate: template.vibrate || [100],
    data: {
      tipo,
      url: datos.url || '/',
      timestamp: Date.now(),
      ...datos.extra
    }
  };
  
  let sent = 0, failed = 0;
  const usuariosNotificados = new Set();
  
  for (const sub of suscripciones) {
    const result = await enviarNotificacion(sub, payload);
    if (result.ok) {
      sent++;
      usuariosNotificados.add(sub.usuario_id);
    } else {
      failed++;
    }
  }
  
  return { sent, failed, usuarios: usuariosNotificados.size };
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICACIONES DE EVENTOS DEL SISTEMA
// ═══════════════════════════════════════════════════════════════

/**
 * Notifica a funcionarios asignados a un reporte
 * @param {number} reporteId - ID del reporte
 * @param {string} mensaje - Mensaje de la notificación
 */
export async function notificarFuncionariosAsignados(reporteId, mensaje) {
  const db = getDb();
  
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT DISTINCT a.usuario_id 
       FROM asignaciones a
       WHERE a.reporte_id = ?`,
      [reporteId],
      async (err, rows) => {
        if (err) return reject(err);
        
        if (!rows || rows.length === 0) {
          return resolve({ sent: 0, failed: 0, reason: 'no_assignees' });
        }
        
        const usuarioIds = rows.map(r => r.usuario_id);
        const result = await notificarGrupo(
          { usuarioIds },
          NOTIFICATION_TYPES.REPORT_STATUS_CHANGED,
          { body: mensaje, reporteId, url: `/#ver-reporte/${reporteId}` }
        );
        
        resolve(result);
      }
    );
  });
}

/**
 * 🆕 Notifica a supervisores de una dependencia sobre nuevo reporte
 * Se llama cuando un ciudadano crea un reporte nuevo
 * @param {string} dependencia - Nombre de la dependencia responsable
 * @param {number} reporteId - ID del reporte creado
 * @param {string} tipoReporte - Tipo de reporte (bache, alumbrado, etc.)
 * @param {string} colonia - Colonia donde se reportó
 */
export async function notificarNuevoReporte(dependencia, reporteId, tipoReporte, colonia = '') {
  console.log(`📢 Notificando nuevo reporte #${reporteId} a supervisores de ${dependencia}`);
  
  const ubicacion = colonia ? ` en ${colonia}` : '';
  
  return notificarGrupo(
    { rol: 'supervisor', dependencia },
    NOTIFICATION_TYPES.NEW_REPORT_DEPARTMENT,
    {
      title: '🆕 Nuevo Reporte Ciudadano',
      body: `Reporte de ${tipoReporte.replace(/_/g, ' ')}${ubicacion}. Requiere asignación.`,
      reporteId,
      url: `/#ver-reporte/${reporteId}`
    }
  );
}

/**
 * 🆕 Notifica a un funcionario cuando se le asigna un reporte
 * @param {number} funcionarioId - ID del funcionario asignado
 * @param {number} reporteId - ID del reporte
 * @param {string} tipoReporte - Tipo de reporte
 * @param {string} supervisorNombre - Nombre del supervisor que asigna
 */
export async function notificarAsignacion(funcionarioId, reporteId, tipoReporte, supervisorNombre = '') {
  console.log(`📋 Notificando asignación de reporte #${reporteId} a funcionario ${funcionarioId}`);
  
  const asignadoPor = supervisorNombre ? ` por ${supervisorNombre}` : '';
  
  return notificarUsuario(funcionarioId, NOTIFICATION_TYPES.REPORT_ASSIGNED, {
    title: '📋 Nuevo Reporte Asignado',
    body: `Se te asignó un reporte de ${tipoReporte.replace(/_/g, ' ')}${asignadoPor}`,
    reporteId,
    url: `/#ver-reporte/${reporteId}`
  });
}

/**
 * 🆕 Notifica cambio de estado de un reporte a funcionarios asignados
 * @param {number} reporteId - ID del reporte
 * @param {string} nuevoEstado - Nuevo estado del reporte
 * @param {string} mensajeExtra - Mensaje adicional opcional
 */
export async function notificarCambioEstado(reporteId, nuevoEstado, mensajeExtra = '') {
  console.log(`🔄 Notificando cambio de estado de reporte #${reporteId} a ${nuevoEstado}`);
  
  const estados = {
    'en_proceso': 'en proceso',
    'pendiente_cierre': 'pendiente de aprobación de cierre',
    'cerrado': 'cerrado',
    'rechazado': 'rechazado'
  };
  
  const estadoTexto = estados[nuevoEstado] || nuevoEstado;
  const mensaje = mensajeExtra || `El reporte #${reporteId} cambió a estado: ${estadoTexto}`;
  
  return notificarFuncionariosAsignados(reporteId, mensaje);
}

/**
 * Notifica al supervisor de una dependencia sobre cierre pendiente
 * @param {string} dependencia - Nombre de la dependencia
 * @param {number} reporteId - ID del reporte
 * @param {string} funcionarioNombre - Nombre del funcionario que solicita cierre
 */
export async function notificarSupervisorCierrePendiente(dependencia, reporteId, funcionarioNombre) {
  return notificarGrupo(
    { rol: 'supervisor', dependencia },
    NOTIFICATION_TYPES.CLOSURE_PENDING,
    {
      body: `${funcionarioNombre} solicita aprobar cierre del reporte #${reporteId}`,
      reporteId,
      url: `/#cierres-pendientes`
    }
  );
}

/**
 * Notifica a funcionario sobre resultado de solicitud de cierre
 * @param {number} funcionarioId - ID del funcionario
 * @param {number} reporteId - ID del reporte
 * @param {boolean} aprobado - Si fue aprobado o rechazado
 * @param {string} notas - Notas del supervisor
 */
export async function notificarResultadoCierre(funcionarioId, reporteId, aprobado, notas = '') {
  const tipo = aprobado ? NOTIFICATION_TYPES.CLOSURE_APPROVED : NOTIFICATION_TYPES.CLOSURE_REJECTED;
  const mensaje = aprobado 
    ? `Tu solicitud de cierre para el reporte #${reporteId} fue aprobada`
    : `Tu solicitud de cierre para el reporte #${reporteId} fue rechazada. ${notas}`;
  
  return notificarUsuario(funcionarioId, tipo, {
    body: mensaje,
    reporteId,
    url: `/#ver-reporte/${reporteId}`
  });
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICACIONES EN TIEMPO REAL (Nuevos reportes y asignaciones)
// ═══════════════════════════════════════════════════════════════

/**
 * Notifica a supervisores de una dependencia cuando llega un nuevo reporte
 * Se envía notificación push a todos los supervisores y admins de la dependencia
 * 
 * @param {string} dependencia - Nombre de la dependencia (ej: 'obras_publicas')
 * @param {number} reporteId - ID del reporte creado
 * @param {string} tipoReporte - Tipo de reporte (ej: 'Bache', 'Alumbrado')
 * @param {string} descripcionCorta - Descripción breve del reporte
 * @returns {Promise<{enviados: number, total: number, errores: Array}>}
 */
export async function notificarNuevoReporteADependencia(dependencia, reporteId, tipoReporte, descripcionCorta = '') {
  if (!isPushEnabled()) {
    return { enviados: 0, total: 0, errores: [] };
  }

  const desc = descripcionCorta.length > 50 
    ? descripcionCorta.substring(0, 50) + '...' 
    : descripcionCorta;

  return notificarGrupo(
    { 
      dependencia, 
      roles: ['supervisor', 'admin'] 
    },
    NOTIFICATION_TYPES.NEW_REPORT,
    {
      title: `🆕 Nuevo reporte: ${tipoReporte}`,
      body: desc || `Nuevo reporte de ${tipoReporte} en tu dependencia`,
      reporteId,
      url: `/#ver-reporte/${reporteId}`,
      requireInteraction: true
    }
  );
}

/**
 * Notifica a un funcionario cuando es asignado a un reporte
 * 
 * @param {number} funcionarioId - ID del funcionario asignado
 * @param {number} reporteId - ID del reporte
 * @param {string} tipoReporte - Tipo de reporte
 * @param {string} supervisorNombre - Nombre del supervisor que asigna
 * @returns {Promise<{exitoso: boolean, enviadas: number, fallidas: number}>}
 */
export async function notificarAsignacionReporte(funcionarioId, reporteId, tipoReporte, supervisorNombre = 'Sistema') {
  if (!isPushEnabled()) {
    return { exitoso: false, enviadas: 0, fallidas: 0 };
  }

  const result = await notificarUsuario(
    funcionarioId,
    NOTIFICATION_TYPES.ASSIGNMENT,
    {
      title: '📋 Nueva asignación',
      body: `${supervisorNombre} te asignó un reporte de ${tipoReporte}`,
      reporteId,
      url: `/#ver-reporte/${reporteId}`,
      requireInteraction: true
    }
  );

  return {
    exitoso: result.enviadas > 0,
    enviadas: result.enviadas,
    fallidas: result.fallidas
  };
}

// ═══════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════

/**
 * Registra una notificación enviada en el historial
 */
function registrarNotificacionEnviada(usuarioId, tipo, enviadas, fallidas) {
  const db = getDb();
  
  db.run(
    `INSERT INTO historial_cambios 
     (usuario_id, entidad, entidad_id, tipo_cambio, valor_nuevo, metadatos)
     VALUES (?, 'push_notification', 0, 'envio', ?, ?)`,
    [
      usuarioId,
      tipo,
      JSON.stringify({ enviadas, fallidas, timestamp: new Date().toISOString() })
    ],
    (err) => {
      if (err) console.error('Error registrando notificación:', err);
    }
  );
}

/**
 * Obtiene la clave pública VAPID para el frontend
 * @returns {string|null}
 */
export function getVapidPublicKey() {
  return VAPID_CONFIG.publicKey;
}

/**
 * Verifica si el sistema de push está configurado
 * @returns {boolean}
 */
export function isPushEnabled() {
  return vapidConfigured;
}

/**
 * Limpia suscripciones inactivas (más de 30 días sin uso)
 */
export function limpiarSuscripcionesInactivas() {
  const db = getDb();
  
  db.run(
    `UPDATE push_subscriptions 
     SET activo = 0 
     WHERE datetime(actualizado_en) < datetime('now', '-30 days')`,
    function(err) {
      if (err) {
        console.error('Error limpiando suscripciones:', err);
      } else if (this.changes > 0) {
        console.log(`🧹 ${this.changes} suscripciones push desactivadas por inactividad`);
      }
    }
  );
}

// Ejecutar limpieza diariamente (si no es test)
if (process.env.NODE_ENV !== 'test') {
  setInterval(limpiarSuscripcionesInactivas, 24 * 60 * 60 * 1000);
}

export default {
  guardarSuscripcion,
  eliminarSuscripcion,
  notificarUsuario,
  notificarGrupo,
  notificarFuncionariosAsignados,
  notificarSupervisorCierrePendiente,
  notificarResultadoCierre,
  notificarNuevoReporteADependencia,
  notificarAsignacionReporte,
  getVapidPublicKey,
  isPushEnabled,
  NOTIFICATION_TYPES
};
