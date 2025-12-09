/**
 * Servicio de Notificaciones SMS
 * Usa Twilio para envío de mensajes de texto
 * 
 * Variables de entorno requeridas:
 * - TWILIO_ACCOUNT_SID: Account SID de Twilio
 * - TWILIO_AUTH_TOKEN: Auth Token de Twilio
 * - TWILIO_PHONE_NUMBER: Número de teléfono de Twilio (formato +52...)
 * - SMS_ENABLED: 'true' para habilitar envío (false en desarrollo)
 */

import { getDb } from './db.js';

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const SMS_ENABLED = process.env.SMS_ENABLED === 'true';

// Lazy-load del cliente Twilio (solo si está configurado)
let twilioClient = null;

/**
 * Inicializa el cliente de Twilio si las credenciales están configuradas
 */
async function getTwilioClient() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return null;
  }
  
  if (!twilioClient) {
    try {
      // Dynamic import para evitar error si twilio no está instalado
      const twilio = await import('twilio');
      twilioClient = twilio.default(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      console.log('✅ Twilio client initialized');
    } catch (err) {
      console.warn('⚠️ Twilio module not installed. Run: npm install twilio');
      return null;
    }
  }
  
  return twilioClient;
}

/**
 * Verifica si el servicio SMS está habilitado y configurado
 */
export function isSmsEnabled() {
  return SMS_ENABLED && 
         TWILIO_ACCOUNT_SID && 
         TWILIO_AUTH_TOKEN && 
         TWILIO_PHONE_NUMBER;
}

// ═══════════════════════════════════════════════════════════════
// VALIDACIÓN DE NÚMEROS
// ═══════════════════════════════════════════════════════════════

/**
 * Normaliza un número de teléfono al formato E.164
 * Ejemplo: "55 1234 5678" → "+521512345678"
 * 
 * @param {string} telefono - Número de teléfono
 * @param {string} codigoPais - Código de país (default: '52' para México)
 * @returns {string|null} Número normalizado o null si es inválido
 */
export function normalizarTelefono(telefono, codigoPais = '52') {
  if (!telefono) return null;
  
  // Eliminar espacios, guiones, paréntesis
  let limpio = telefono.replace(/[\s\-\(\)\.]/g, '');
  
  // Si ya tiene formato E.164
  if (limpio.startsWith('+')) {
    return limpio.length >= 11 ? limpio : null;
  }
  
  // Si empieza con código de país sin +
  if (limpio.startsWith(codigoPais)) {
    return `+${limpio}`;
  }
  
  // Para México, agregar código de país
  // Número de 10 dígitos (celular mexicano)
  if (limpio.length === 10 && /^\d+$/.test(limpio)) {
    return `+${codigoPais}1${limpio}`; // +52 + 1 (celular) + número
  }
  
  // Número de 11 dígitos (ya tiene el 1)
  if (limpio.length === 11 && /^\d+$/.test(limpio) && limpio.startsWith('1')) {
    return `+${codigoPais}${limpio}`;
  }
  
  console.warn(`⚠️ Número de teléfono inválido: ${telefono}`);
  return null;
}

/**
 * Valida que un número de teléfono tenga formato correcto
 */
export function validarTelefono(telefono) {
  const normalizado = normalizarTelefono(telefono);
  return normalizado !== null;
}

// ═══════════════════════════════════════════════════════════════
// ENVÍO DE SMS
// ═══════════════════════════════════════════════════════════════

/**
 * Envía un SMS a un número de teléfono
 * 
 * @param {string} telefono - Número de teléfono destino
 * @param {string} mensaje - Texto del mensaje (max 160 chars recomendado)
 * @returns {Promise<{exitoso: boolean, sid?: string, error?: string}>}
 */
export async function enviarSms(telefono, mensaje) {
  // Validar configuración
  if (!isSmsEnabled()) {
    console.log('📱 SMS deshabilitado. Mensaje que se enviaría:', { telefono, mensaje });
    return { exitoso: false, error: 'SMS service not enabled' };
  }
  
  // Normalizar número
  const telefonoNormalizado = normalizarTelefono(telefono);
  if (!telefonoNormalizado) {
    return { exitoso: false, error: 'Invalid phone number format' };
  }
  
  // Obtener cliente Twilio
  const client = await getTwilioClient();
  if (!client) {
    return { exitoso: false, error: 'Twilio client not available' };
  }
  
  try {
    const result = await client.messages.create({
      body: mensaje,
      from: TWILIO_PHONE_NUMBER,
      to: telefonoNormalizado
    });
    
    console.log(`✅ SMS enviado a ${telefonoNormalizado}: SID=${result.sid}`);
    
    // Registrar en audit trail
    registrarSmsEnviado(telefonoNormalizado, mensaje, result.sid);
    
    return { 
      exitoso: true, 
      sid: result.sid,
      status: result.status 
    };
  } catch (error) {
    console.error(`❌ Error enviando SMS a ${telefonoNormalizado}:`, error.message);
    
    // Registrar error
    registrarSmsError(telefonoNormalizado, mensaje, error.message);
    
    return { 
      exitoso: false, 
      error: error.message,
      code: error.code
    };
  }
}

/**
 * Envía SMS a múltiples destinatarios
 * 
 * @param {string[]} telefonos - Array de números de teléfono
 * @param {string} mensaje - Texto del mensaje
 * @returns {Promise<{enviados: number, fallidos: number, resultados: Array}>}
 */
export async function enviarSmsMasivo(telefonos, mensaje) {
  if (!telefonos || telefonos.length === 0) {
    return { enviados: 0, fallidos: 0, resultados: [] };
  }
  
  const resultados = [];
  let enviados = 0;
  let fallidos = 0;
  
  // Enviar con delay entre cada mensaje (rate limiting de Twilio)
  for (const telefono of telefonos) {
    const resultado = await enviarSms(telefono, mensaje);
    resultados.push({ telefono, ...resultado });
    
    if (resultado.exitoso) {
      enviados++;
    } else {
      fallidos++;
    }
    
    // Pequeño delay para evitar rate limiting (100ms)
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return { enviados, fallidos, resultados };
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICACIONES POR EVENTO
// ═══════════════════════════════════════════════════════════════

/**
 * Notifica a supervisores de una dependencia sobre nuevo reporte via SMS
 * 
 * @param {string} dependencia - Nombre de la dependencia
 * @param {number} reporteId - ID del reporte
 * @param {string} tipoReporte - Tipo de reporte
 * @param {string} colonia - Colonia donde está el reporte
 * @returns {Promise<{enviados: number, total: number}>}
 */
export async function notificarNuevoReporteSms(dependencia, reporteId, tipoReporte, colonia = '') {
  if (!isSmsEnabled()) {
    return { enviados: 0, total: 0 };
  }
  
  const db = getDb();
  
  // Obtener supervisores de la dependencia con teléfono configurado
  const supervisores = await new Promise((resolve, reject) => {
    db.all(
      `SELECT id, nombre, telefono 
       FROM usuarios 
       WHERE dependencia = ? 
         AND rol IN ('supervisor', 'admin')
         AND activo = 1
         AND telefono IS NOT NULL
         AND telefono != ''`,
      [dependencia],
      (err, rows) => err ? reject(err) : resolve(rows || [])
    );
  });
  
  if (supervisores.length === 0) {
    return { enviados: 0, total: 0 };
  }
  
  // Construir mensaje (max 160 chars para SMS estándar)
  const ubicacion = colonia ? ` en ${colonia}` : '';
  const mensaje = `🆕 Nuevo reporte #${reporteId}: ${tipoReporte}${ubicacion}. Revisar en el sistema.`;
  
  // Enviar a todos los supervisores
  const telefonos = supervisores.map(s => s.telefono);
  const resultado = await enviarSmsMasivo(telefonos, mensaje);
  
  console.log(`📱 SMS nuevo reporte: ${resultado.enviados}/${resultado.fallidos + resultado.enviados} enviados a ${dependencia}`);
  
  return {
    enviados: resultado.enviados,
    total: supervisores.length
  };
}

/**
 * Notifica a un funcionario que fue asignado a un reporte
 * 
 * @param {number} funcionarioId - ID del funcionario
 * @param {number} reporteId - ID del reporte
 * @param {string} tipoReporte - Tipo de reporte
 * @returns {Promise<{exitoso: boolean}>}
 */
export async function notificarAsignacionSms(funcionarioId, reporteId, tipoReporte) {
  if (!isSmsEnabled()) {
    return { exitoso: false };
  }
  
  const db = getDb();
  
  // Obtener teléfono del funcionario
  const funcionario = await new Promise((resolve, reject) => {
    db.get(
      'SELECT id, nombre, telefono FROM usuarios WHERE id = ? AND telefono IS NOT NULL',
      [funcionarioId],
      (err, row) => err ? reject(err) : resolve(row)
    );
  });
  
  if (!funcionario || !funcionario.telefono) {
    return { exitoso: false };
  }
  
  const mensaje = `📋 Te asignaron reporte #${reporteId}: ${tipoReporte}. Revisa el sistema para más detalles.`;
  
  const resultado = await enviarSms(funcionario.telefono, mensaje);
  
  return { exitoso: resultado.exitoso };
}

/**
 * Notifica al funcionario sobre aprobación/rechazo de cierre
 * 
 * @param {number} funcionarioId - ID del funcionario
 * @param {number} reporteId - ID del reporte
 * @param {boolean} aprobado - Si fue aprobado o rechazado
 * @returns {Promise<{exitoso: boolean}>}
 */
export async function notificarResultadoCierreSms(funcionarioId, reporteId, aprobado) {
  if (!isSmsEnabled()) {
    return { exitoso: false };
  }
  
  const db = getDb();
  
  const funcionario = await new Promise((resolve, reject) => {
    db.get(
      'SELECT telefono FROM usuarios WHERE id = ? AND telefono IS NOT NULL',
      [funcionarioId],
      (err, row) => err ? reject(err) : resolve(row)
    );
  });
  
  if (!funcionario || !funcionario.telefono) {
    return { exitoso: false };
  }
  
  const estado = aprobado ? '✅ APROBADO' : '❌ RECHAZADO';
  const mensaje = `Reporte #${reporteId}: Cierre ${estado}. Revisa el sistema para detalles.`;
  
  const resultado = await enviarSms(funcionario.telefono, mensaje);
  
  return { exitoso: resultado.exitoso };
}

/**
 * Envía SMS al supervisor cuando hay cierre pendiente de aprobación
 * 
 * @param {string} dependencia - Dependencia del reporte
 * @param {number} reporteId - ID del reporte
 * @param {string} funcionarioNombre - Nombre del funcionario que solicita cierre
 * @returns {Promise<{enviados: number}>}
 */
export async function notificarCierrePendienteSms(dependencia, reporteId, funcionarioNombre) {
  if (!isSmsEnabled()) {
    return { enviados: 0 };
  }
  
  const db = getDb();
  
  // Obtener supervisores de la dependencia
  const supervisores = await new Promise((resolve, reject) => {
    db.all(
      `SELECT telefono FROM usuarios 
       WHERE dependencia = ? 
         AND rol = 'supervisor'
         AND activo = 1
         AND telefono IS NOT NULL`,
      [dependencia],
      (err, rows) => err ? reject(err) : resolve(rows || [])
    );
  });
  
  if (supervisores.length === 0) {
    return { enviados: 0 };
  }
  
  const mensaje = `⏳ ${funcionarioNombre} solicita cierre del reporte #${reporteId}. Pendiente de tu aprobación.`;
  
  const telefonos = supervisores.map(s => s.telefono);
  const resultado = await enviarSmsMasivo(telefonos, mensaje);
  
  return { enviados: resultado.enviados };
}

// ═══════════════════════════════════════════════════════════════
// AUDIT TRAIL
// ═══════════════════════════════════════════════════════════════

/**
 * Registra un SMS enviado exitosamente en el historial
 */
function registrarSmsEnviado(telefono, mensaje, sid) {
  const db = getDb();
  
  db.run(
    `INSERT INTO historial_cambios 
     (entidad, entidad_id, tipo_cambio, valor_nuevo, metadatos)
     VALUES ('sms', 0, 'envio_exitoso', ?, ?)`,
    [
      mensaje.substring(0, 100),
      JSON.stringify({ telefono: telefono.slice(-4), sid, timestamp: new Date().toISOString() })
    ],
    (err) => {
      if (err) console.error('Error registrando SMS en audit:', err.message);
    }
  );
}

/**
 * Registra un error de envío de SMS
 */
function registrarSmsError(telefono, mensaje, error) {
  const db = getDb();
  
  db.run(
    `INSERT INTO historial_cambios 
     (entidad, entidad_id, tipo_cambio, valor_nuevo, metadatos)
     VALUES ('sms', 0, 'envio_fallido', ?, ?)`,
    [
      mensaje.substring(0, 100),
      JSON.stringify({ telefono: telefono.slice(-4), error, timestamp: new Date().toISOString() })
    ],
    (err) => {
      if (err) console.error('Error registrando error SMS en audit:', err.message);
    }
  );
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
  isSmsEnabled,
  normalizarTelefono,
  validarTelefono,
  enviarSms,
  enviarSmsMasivo,
  notificarNuevoReporteSms,
  notificarAsignacionSms,
  notificarResultadoCierreSms,
  notificarCierrePendienteSms
};
