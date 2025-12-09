/**
 * 📱 WhatsApp Service - Integración con Evolution-API
 * citizen-reports
 * 
 * Evolution-API es una solución self-hosted para WhatsApp
 * que permite enviar mensajes, crear chatbots, y webhooks.
 * 
 * Integración con n8n para automatizaciones avanzadas.
 * 
 * @module whatsapp-service
 * @see https://doc.evolution-api.com/
 */

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'citizen-reports';
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || '';
const WHATSAPP_ENABLED = process.env.WHATSAPP_ENABLED === 'true';

// ═══════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════

/**
 * Normaliza número de teléfono a formato WhatsApp (sin +, solo dígitos)
 * Ejemplo: +52 1 777 123 4567 → 5217771234567
 * @param {string} telefono - Número de teléfono
 * @returns {string} Número normalizado para WhatsApp
 */
export function normalizarTelefonoWhatsApp(telefono) {
  if (!telefono) return '';
  
  // Remover todo excepto dígitos
  let normalizado = telefono.replace(/\D/g, '');
  
  // Si empieza con 52 y tiene 12 dígitos (México con código país)
  if (normalizado.startsWith('52') && normalizado.length === 12) {
    return normalizado;
  }
  
  // Si tiene 10 dígitos (México sin código país), agregar 52
  if (normalizado.length === 10) {
    return `52${normalizado}`;
  }
  
  // Si tiene 11 dígitos y empieza con 1 (formato antiguo México móvil)
  if (normalizado.length === 11 && normalizado.startsWith('1')) {
    return `52${normalizado}`;
  }
  
  return normalizado;
}

/**
 * Valida si un número es válido para WhatsApp
 * @param {string} telefono - Número normalizado
 * @returns {boolean}
 */
export function esNumeroWhatsAppValido(telefono) {
  const normalizado = normalizarTelefonoWhatsApp(telefono);
  // Mínimo 10 dígitos, máximo 15 (estándar E.164)
  return normalizado.length >= 10 && normalizado.length <= 15;
}

// ═══════════════════════════════════════════════════════════════
// CLIENTE EVOLUTION-API
// ═══════════════════════════════════════════════════════════════

/**
 * Hace una petición a Evolution-API
 * @param {string} endpoint - Endpoint de la API (ej: /message/sendText)
 * @param {string} method - Método HTTP
 * @param {object} body - Cuerpo de la petición
 * @returns {Promise<object>} Respuesta de la API
 */
async function evolutionRequest(endpoint, method = 'POST', body = null) {
  if (!WHATSAPP_ENABLED) {
    console.log('[WHATSAPP] Deshabilitado. Mensaje no enviado.');
    return { ok: false, reason: 'disabled' };
  }
  
  if (!EVOLUTION_API_KEY) {
    console.warn('[WHATSAPP] EVOLUTION_API_KEY no configurada.');
    return { ok: false, reason: 'no_api_key' };
  }
  
  const url = `${EVOLUTION_API_URL}${endpoint}`;
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      console.error(`[WHATSAPP] Error ${response.status}:`, data);
      return { ok: false, status: response.status, error: data };
    }
    
    return { ok: true, data };
  } catch (error) {
    console.error('[WHATSAPP] Error de conexión:', error.message);
    return { ok: false, reason: 'connection_error', error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// FUNCIONES PRINCIPALES
// ═══════════════════════════════════════════════════════════════

/**
 * Envía un mensaje de texto por WhatsApp
 * @param {string} telefono - Número de teléfono destino
 * @param {string} mensaje - Mensaje a enviar
 * @param {object} options - Opciones adicionales
 * @returns {Promise<object>} Resultado del envío
 */
export async function enviarMensajeWhatsApp(telefono, mensaje, options = {}) {
  const numero = normalizarTelefonoWhatsApp(telefono);
  
  if (!esNumeroWhatsAppValido(numero)) {
    console.warn(`[WHATSAPP] Número inválido: ${telefono}`);
    return { ok: false, reason: 'invalid_number' };
  }
  
  console.log(`[WHATSAPP] Enviando mensaje a ${numero.slice(-4).padStart(numero.length, '*')}`);
  
  const body = {
    number: numero,
    text: mensaje,
    ...options
  };
  
  const result = await evolutionRequest(
    `/message/sendText/${EVOLUTION_INSTANCE}`,
    'POST',
    body
  );
  
  if (result.ok) {
    console.log(`[WHATSAPP] ✅ Mensaje enviado a ${numero.slice(-4).padStart(numero.length, '*')}`);
  }
  
  return result;
}

/**
 * Envía un mensaje con botones interactivos
 * @param {string} telefono - Número de teléfono destino
 * @param {string} titulo - Título del mensaje
 * @param {string} descripcion - Descripción/cuerpo del mensaje
 * @param {Array<{id: string, text: string}>} botones - Botones (máx 3)
 * @returns {Promise<object>} Resultado del envío
 */
export async function enviarMensajeConBotones(telefono, titulo, descripcion, botones) {
  const numero = normalizarTelefonoWhatsApp(telefono);
  
  if (!esNumeroWhatsAppValido(numero)) {
    return { ok: false, reason: 'invalid_number' };
  }
  
  // Evolution-API usa formato específico para botones
  const body = {
    number: numero,
    title: titulo,
    description: descripcion,
    buttons: botones.slice(0, 3).map((btn, idx) => ({
      type: 'reply',
      reply: {
        id: btn.id || `btn_${idx}`,
        title: btn.text.slice(0, 20) // Máximo 20 caracteres
      }
    }))
  };
  
  return evolutionRequest(
    `/message/sendButtons/${EVOLUTION_INSTANCE}`,
    'POST',
    body
  );
}

/**
 * Envía una imagen con caption
 * @param {string} telefono - Número de teléfono destino
 * @param {string} imageUrl - URL de la imagen (pública)
 * @param {string} caption - Texto debajo de la imagen
 * @returns {Promise<object>} Resultado del envío
 */
export async function enviarImagenWhatsApp(telefono, imageUrl, caption = '') {
  const numero = normalizarTelefonoWhatsApp(telefono);
  
  if (!esNumeroWhatsAppValido(numero)) {
    return { ok: false, reason: 'invalid_number' };
  }
  
  const body = {
    number: numero,
    mediatype: 'image',
    media: imageUrl,
    caption
  };
  
  return evolutionRequest(
    `/message/sendMedia/${EVOLUTION_INSTANCE}`,
    'POST',
    body
  );
}

/**
 * Envía ubicación por WhatsApp
 * @param {string} telefono - Número de teléfono destino
 * @param {number} lat - Latitud
 * @param {number} lng - Longitud
 * @param {string} nombre - Nombre del lugar
 * @param {string} direccion - Dirección del lugar
 * @returns {Promise<object>} Resultado del envío
 */
export async function enviarUbicacionWhatsApp(telefono, lat, lng, nombre = '', direccion = '') {
  const numero = normalizarTelefonoWhatsApp(telefono);
  
  if (!esNumeroWhatsAppValido(numero)) {
    return { ok: false, reason: 'invalid_number' };
  }
  
  const body = {
    number: numero,
    name: nombre || 'Ubicación del reporte',
    address: direccion || `${lat}, ${lng}`,
    latitude: lat,
    longitude: lng
  };
  
  return evolutionRequest(
    `/message/sendLocation/${EVOLUTION_INSTANCE}`,
    'POST',
    body
  );
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICACIONES DE NEGOCIO
// ═══════════════════════════════════════════════════════════════

/**
 * Notifica a supervisores sobre nuevo reporte vía WhatsApp
 * @param {string} dependencia - Nombre de la dependencia
 * @param {number} reporteId - ID del reporte
 * @param {string} tipo - Tipo de reporte
 * @param {string} colonia - Colonia donde ocurrió
 * @param {object} ubicacion - {lat, lng}
 */
export async function notificarNuevoReporteWhatsApp(dependencia, reporteId, tipo, colonia, ubicacion = null) {
  if (!WHATSAPP_ENABLED) return;
  
  // Obtener supervisores con WhatsApp habilitado
  const { getDb } = await import('./db.js');
  const db = getDb();
  
  return new Promise((resolve) => {
    db.all(
      `SELECT telefono, nombre FROM usuarios 
       WHERE dependencia = ? 
       AND rol = 'supervisor' 
       AND telefono IS NOT NULL 
       AND activo = 1`,
      [dependencia],
      async (err, supervisores) => {
        if (err || !supervisores?.length) {
          console.log(`[WHATSAPP] No hay supervisores con WhatsApp en ${dependencia}`);
          resolve({ ok: false, reason: 'no_supervisors' });
          return;
        }
        
        const mensaje = `🚨 *Nuevo Reporte #${reporteId}*\n\n` +
          `📋 *Tipo:* ${tipo}\n` +
          `📍 *Colonia:* ${colonia}\n` +
          `🏢 *Dependencia:* ${dependencia}\n\n` +
          `👉 Ver detalles en: https://reportes.progressiagroup.com/#ver-reporte/${reporteId}`;
        
        const resultados = [];
        for (const sup of supervisores) {
          const result = await enviarMensajeWhatsApp(sup.telefono, mensaje);
          resultados.push({ supervisor: sup.nombre, ...result });
          
          // Si tenemos ubicación, enviarla también
          if (ubicacion && result.ok) {
            await enviarUbicacionWhatsApp(
              sup.telefono, 
              ubicacion.lat, 
              ubicacion.lng,
              `Reporte #${reporteId}: ${tipo}`,
              colonia
            );
          }
        }
        
        resolve({ ok: true, enviados: resultados.length, resultados });
      }
    );
  });
}

/**
 * Notifica a funcionario sobre asignación de reporte
 * @param {number} funcionarioId - ID del funcionario
 * @param {number} reporteId - ID del reporte
 * @param {string} tipo - Tipo de reporte
 * @param {string} colonia - Colonia
 * @param {string} supervisorNombre - Nombre del supervisor que asignó
 */
export async function notificarAsignacionWhatsApp(funcionarioId, reporteId, tipo, colonia, supervisorNombre) {
  if (!WHATSAPP_ENABLED) return;
  
  const { getDb } = await import('./db.js');
  const db = getDb();
  
  return new Promise((resolve) => {
    db.get(
      `SELECT telefono, nombre FROM usuarios WHERE id = ? AND telefono IS NOT NULL`,
      [funcionarioId],
      async (err, funcionario) => {
        if (err || !funcionario?.telefono) {
          console.log(`[WHATSAPP] Funcionario ${funcionarioId} sin teléfono`);
          resolve({ ok: false, reason: 'no_phone' });
          return;
        }
        
        const mensaje = `📋 *Se te asignó un reporte*\n\n` +
          `🔢 *Reporte #${reporteId}*\n` +
          `📋 *Tipo:* ${tipo}\n` +
          `📍 *Colonia:* ${colonia}\n` +
          `👤 *Asignado por:* ${supervisorNombre}\n\n` +
          `👉 Ver detalles: https://reportes.progressiagroup.com/#ver-reporte/${reporteId}`;
        
        const result = await enviarMensajeWhatsApp(funcionario.telefono, mensaje);
        resolve(result);
      }
    );
  });
}

/**
 * Notifica resultado de cierre (aprobado/rechazado)
 * @param {number} funcionarioId - ID del funcionario
 * @param {number} reporteId - ID del reporte
 * @param {boolean} aprobado - Si fue aprobado o rechazado
 * @param {string} comentario - Comentario del supervisor (opcional)
 */
export async function notificarResultadoCierreWhatsApp(funcionarioId, reporteId, aprobado, comentario = '') {
  if (!WHATSAPP_ENABLED) return;
  
  const { getDb } = await import('./db.js');
  const db = getDb();
  
  return new Promise((resolve) => {
    db.get(
      `SELECT telefono, nombre FROM usuarios WHERE id = ? AND telefono IS NOT NULL`,
      [funcionarioId],
      async (err, funcionario) => {
        if (err || !funcionario?.telefono) {
          resolve({ ok: false, reason: 'no_phone' });
          return;
        }
        
        const emoji = aprobado ? '✅' : '❌';
        const estado = aprobado ? 'APROBADO' : 'RECHAZADO';
        
        let mensaje = `${emoji} *Cierre ${estado}*\n\n` +
          `🔢 *Reporte #${reporteId}*\n`;
        
        if (comentario) {
          mensaje += `💬 *Comentario:* ${comentario}\n`;
        }
        
        if (!aprobado) {
          mensaje += `\n⚠️ Por favor revisa las observaciones y vuelve a solicitar el cierre.`;
        }
        
        const result = await enviarMensajeWhatsApp(funcionario.telefono, mensaje);
        resolve(result);
      }
    );
  });
}

/**
 * Notifica a ciudadano sobre actualización de su reporte
 * @param {string} telefono - Teléfono del ciudadano
 * @param {number} reporteId - ID del reporte
 * @param {string} nuevoEstado - Nuevo estado del reporte
 * @param {string} mensaje - Mensaje personalizado (opcional)
 */
export async function notificarCiudadanoWhatsApp(telefono, reporteId, nuevoEstado, mensajePersonalizado = '') {
  if (!WHATSAPP_ENABLED) return;
  
  const estadoEmoji = {
    'abierto': '📋',
    'asignado': '👷',
    'en_proceso': '🔧',
    'cerrado': '✅'
  };
  
  const emoji = estadoEmoji[nuevoEstado] || '📋';
  
  const mensaje = mensajePersonalizado || (
    `${emoji} *Actualización de tu reporte #${reporteId}*\n\n` +
    `Estado: *${nuevoEstado.replace('_', ' ').toUpperCase()}*\n\n` +
    `Gracias por usar el sistema de reportes ciudadanos de Jantetelco.`
  );
  
  return enviarMensajeWhatsApp(telefono, mensaje);
}

// ═══════════════════════════════════════════════════════════════
// INTEGRACIÓN N8N
// ═══════════════════════════════════════════════════════════════

/**
 * Dispara un workflow de n8n vía webhook
 * @param {string} evento - Tipo de evento (nuevo_reporte, asignacion, cierre, etc)
 * @param {object} datos - Datos del evento
 */
export async function dispararWebhookN8n(evento, datos) {
  if (!N8N_WEBHOOK_URL) {
    console.log('[N8N] Webhook URL no configurada');
    return { ok: false, reason: 'no_webhook_url' };
  }
  
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        evento,
        timestamp: new Date().toISOString(),
        ...datos
      })
    });
    
    if (response.ok) {
      console.log(`[N8N] ✅ Webhook disparado: ${evento}`);
      return { ok: true };
    } else {
      console.error(`[N8N] Error ${response.status}`);
      return { ok: false, status: response.status };
    }
  } catch (error) {
    console.error('[N8N] Error de conexión:', error.message);
    return { ok: false, reason: 'connection_error' };
  }
}

// ═══════════════════════════════════════════════════════════════
// VERIFICACIÓN DE ESTADO
// ═══════════════════════════════════════════════════════════════

/**
 * Verifica el estado de la instancia de Evolution-API
 * @returns {Promise<object>} Estado de la instancia
 */
export async function verificarEstadoWhatsApp() {
  if (!WHATSAPP_ENABLED) {
    return { 
      enabled: false, 
      status: 'disabled',
      message: 'WhatsApp está deshabilitado en configuración'
    };
  }
  
  const result = await evolutionRequest(
    `/instance/connectionState/${EVOLUTION_INSTANCE}`,
    'GET'
  );
  
  if (result.ok) {
    const state = result.data?.instance?.state || 'unknown';
    return {
      enabled: true,
      status: state,
      connected: state === 'open',
      instance: EVOLUTION_INSTANCE,
      message: state === 'open' ? 'WhatsApp conectado y listo' : `Estado: ${state}`
    };
  }
  
  return {
    enabled: true,
    status: 'error',
    connected: false,
    error: result.error || result.reason
  };
}

/**
 * Obtiene el QR code para conectar WhatsApp (si está desconectado)
 * @returns {Promise<object>} QR code en base64 o estado
 */
export async function obtenerQRCodeWhatsApp() {
  if (!WHATSAPP_ENABLED) {
    return { ok: false, reason: 'disabled' };
  }
  
  // Primero verificar estado
  const estado = await verificarEstadoWhatsApp();
  if (estado.connected) {
    return { ok: true, connected: true, message: 'Ya está conectado' };
  }
  
  // Solicitar QR
  const result = await evolutionRequest(
    `/instance/connect/${EVOLUTION_INSTANCE}`,
    'GET'
  );
  
  if (result.ok && result.data?.qrcode) {
    return {
      ok: true,
      connected: false,
      qrcode: result.data.qrcode.base64,
      message: 'Escanea el QR con WhatsApp'
    };
  }
  
  return { ok: false, error: result.error || 'No se pudo obtener QR' };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
  // Utilidades
  normalizarTelefonoWhatsApp,
  esNumeroWhatsAppValido,
  
  // Mensajería
  enviarMensajeWhatsApp,
  enviarMensajeConBotones,
  enviarImagenWhatsApp,
  enviarUbicacionWhatsApp,
  
  // Notificaciones de negocio
  notificarNuevoReporteWhatsApp,
  notificarAsignacionWhatsApp,
  notificarResultadoCierreWhatsApp,
  notificarCiudadanoWhatsApp,
  
  // n8n
  dispararWebhookN8n,
  
  // Estado
  verificarEstadoWhatsApp,
  obtenerQRCodeWhatsApp
};

// Log de configuración
console.log(`[WHATSAPP] Módulo cargado. Enabled: ${WHATSAPP_ENABLED}, Instance: ${EVOLUTION_INSTANCE}`);
