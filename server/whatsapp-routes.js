/**
 * 📱 Rutas API para WhatsApp (Evolution-API)
 * citizen-reports
 * 
 * Endpoints:
 * - GET  /api/whatsapp/status     → Estado de conexión
 * - GET  /api/whatsapp/qr         → Obtener QR para conectar
 * - POST /api/whatsapp/send       → Enviar mensaje (admin)
 * - POST /api/whatsapp/test       → Enviar mensaje de prueba
 * 
 * @module whatsapp-routes
 */

import {
  verificarEstadoWhatsApp,
  obtenerQRCodeWhatsApp,
  enviarMensajeWhatsApp,
  enviarUbicacionWhatsApp,
  dispararWebhookN8n
} from './whatsapp-service.js';

/**
 * Configura las rutas de WhatsApp
 * @param {Express} app - Instancia de Express
 * @param {Function} requiereAuth - Middleware de autenticación
 * @param {Function} requiereRol - Middleware de autorización por rol
 */
export function configurarRutasWhatsApp(app, requiereAuth, requiereRol) {
  
  /**
   * GET /api/whatsapp/status
   * Estado de conexión de WhatsApp
   * 
   * Acceso: supervisor o admin
   */
  app.get('/api/whatsapp/status', requiereAuth, requiereRol(['supervisor', 'admin']), async (req, res) => {
    try {
      const estado = await verificarEstadoWhatsApp();
      res.json({
        ok: true,
        ...estado
      });
    } catch (error) {
      console.error('[WHATSAPP API] Error verificando estado:', error);
      res.status(500).json({ error: 'Error verificando estado de WhatsApp' });
    }
  });
  
  /**
   * GET /api/whatsapp/qr
   * Obtener QR code para conectar WhatsApp
   * 
   * Acceso: admin
   */
  app.get('/api/whatsapp/qr', requiereAuth, requiereRol(['admin']), async (req, res) => {
    try {
      const result = await obtenerQRCodeWhatsApp();
      
      if (result.connected) {
        return res.json({
          ok: true,
          connected: true,
          message: 'WhatsApp ya está conectado'
        });
      }
      
      if (result.qrcode) {
        return res.json({
          ok: true,
          connected: false,
          qrcode: result.qrcode,
          message: 'Escanea el código QR con tu WhatsApp'
        });
      }
      
      res.status(500).json({ 
        ok: false, 
        error: result.error || 'No se pudo obtener el código QR' 
      });
    } catch (error) {
      console.error('[WHATSAPP API] Error obteniendo QR:', error);
      res.status(500).json({ error: 'Error obteniendo código QR' });
    }
  });
  
  /**
   * POST /api/whatsapp/send
   * Enviar mensaje de WhatsApp
   * 
   * Body: { telefono, mensaje, ubicacion?: { lat, lng, nombre } }
   * 
   * Acceso: admin
   */
  app.post('/api/whatsapp/send', requiereAuth, requiereRol(['admin']), async (req, res) => {
    try {
      const { telefono, mensaje, ubicacion } = req.body;
      
      if (!telefono || !mensaje) {
        return res.status(400).json({ error: 'telefono y mensaje son requeridos' });
      }
      
      // Enviar mensaje de texto
      const result = await enviarMensajeWhatsApp(telefono, mensaje);
      
      if (!result.ok) {
        return res.status(400).json({
          ok: false,
          error: result.reason || 'Error enviando mensaje'
        });
      }
      
      // Si hay ubicación, enviarla también
      if (ubicacion && ubicacion.lat && ubicacion.lng) {
        await enviarUbicacionWhatsApp(
          telefono,
          ubicacion.lat,
          ubicacion.lng,
          ubicacion.nombre || 'Ubicación'
        );
      }
      
      res.json({
        ok: true,
        message: 'Mensaje enviado correctamente'
      });
    } catch (error) {
      console.error('[WHATSAPP API] Error enviando mensaje:', error);
      res.status(500).json({ error: 'Error enviando mensaje' });
    }
  });
  
  /**
   * POST /api/whatsapp/test
   * Enviar mensaje de prueba al admin
   * 
   * Acceso: admin
   */
  app.post('/api/whatsapp/test', requiereAuth, requiereRol(['admin']), async (req, res) => {
    try {
      const { telefono } = req.body;
      
      if (!telefono) {
        return res.status(400).json({ error: 'telefono es requerido' });
      }
      
      const mensajeTest = `🧪 *Mensaje de Prueba*\n\n` +
        `Este es un mensaje de prueba del sistema de reportes ciudadanos.\n\n` +
        `✅ WhatsApp está funcionando correctamente.\n` +
        `📅 ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}`;
      
      const result = await enviarMensajeWhatsApp(telefono, mensajeTest);
      
      if (result.ok) {
        res.json({
          ok: true,
          message: 'Mensaje de prueba enviado'
        });
      } else {
        res.status(400).json({
          ok: false,
          error: result.reason || 'Error enviando mensaje de prueba'
        });
      }
    } catch (error) {
      console.error('[WHATSAPP API] Error en test:', error);
      res.status(500).json({ error: 'Error enviando mensaje de prueba' });
    }
  });
  
  /**
   * POST /api/whatsapp/webhook
   * Webhook para recibir mensajes de WhatsApp (Evolution-API callback)
   * 
   * Acceso: público (validado por Evolution-API)
   */
  app.post('/api/whatsapp/webhook', async (req, res) => {
    try {
      const { event, data, instance } = req.body;
      
      console.log(`[WHATSAPP WEBHOOK] Evento: ${event}, Instancia: ${instance}`);
      
      // Procesar eventos relevantes
      switch (event) {
        case 'messages.upsert':
          // Nuevo mensaje recibido
          await procesarMensajeEntrante(data);
          break;
          
        case 'connection.update':
          // Cambio en estado de conexión
          console.log(`[WHATSAPP] Estado de conexión: ${data?.state}`);
          break;
          
        case 'qrcode.updated':
          // QR actualizado
          console.log('[WHATSAPP] QR code actualizado');
          break;
          
        default:
          // Otros eventos
          break;
      }
      
      // Reenviar a n8n para procesamiento avanzado
      await dispararWebhookN8n('whatsapp_' + event, { instance, data });
      
      res.json({ received: true });
    } catch (error) {
      console.error('[WHATSAPP WEBHOOK] Error:', error);
      res.status(500).json({ error: 'Error procesando webhook' });
    }
  });
  
  console.log('[WHATSAPP] ✅ Rutas API configuradas');
}

/**
 * Procesa un mensaje entrante de WhatsApp
 * @param {object} data - Datos del mensaje
 */
async function procesarMensajeEntrante(data) {
  if (!data?.message) return;
  
  const mensaje = data.message;
  const remitente = mensaje.key?.remoteJid?.replace('@s.whatsapp.net', '');
  const texto = mensaje.message?.conversation || 
                mensaje.message?.extendedTextMessage?.text || '';
  
  console.log(`[WHATSAPP] Mensaje de ${remitente}: ${texto.slice(0, 50)}...`);
  
  // Detectar comandos simples
  const textoLower = texto.toLowerCase().trim();
  
  if (textoLower === 'status' || textoLower === 'estado') {
    // Responder con estado del sistema
    const { getDb } = await import('./db.js');
    const db = getDb();
    
    return new Promise((resolve) => {
      db.get(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN estado = 'abierto' THEN 1 ELSE 0 END) as abiertos,
          SUM(CASE WHEN estado = 'cerrado' THEN 1 ELSE 0 END) as cerrados
        FROM reportes 
        WHERE date(creado_en) >= date('now', '-30 days')`,
        [],
        async (err, stats) => {
          if (!err && stats) {
            const { enviarMensajeWhatsApp } = await import('./whatsapp-service.js');
            await enviarMensajeWhatsApp(
              remitente,
              `📊 *Estadísticas (últimos 30 días)*\n\n` +
              `📋 Total reportes: ${stats.total}\n` +
              `📬 Abiertos: ${stats.abiertos}\n` +
              `✅ Cerrados: ${stats.cerrados}`
            );
          }
          resolve();
        }
      );
    });
  }
  
  if (textoLower === 'ayuda' || textoLower === 'help') {
    const { enviarMensajeWhatsApp } = await import('./whatsapp-service.js');
    await enviarMensajeWhatsApp(
      remitente,
      `ℹ️ *Comandos disponibles*\n\n` +
      `📊 *status* - Ver estadísticas\n` +
      `❓ *ayuda* - Ver este mensaje\n\n` +
      `Para crear un reporte, visita:\n` +
      `https://reportes.progressiagroup.com`
    );
  }
}
