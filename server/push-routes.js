/**
 * 🔔 Rutas API de Notificaciones Push - citizen-reports
 * 
 * Endpoints:
 * - GET  /api/push/vapid-key     - Obtener clave pública VAPID
 * - POST /api/push/subscribe     - Registrar suscripción
 * - DELETE /api/push/unsubscribe - Eliminar suscripción
 * - POST /api/push/send          - Enviar notificación (admin)
 * - GET  /api/push/status        - Estado del servicio push
 */

import { 
  guardarSuscripcion, 
  eliminarSuscripcion, 
  notificarUsuario,
  notificarGrupo,
  getVapidPublicKey,
  isPushEnabled,
  NOTIFICATION_TYPES
} from './push-notifications.js';
import { requiereAuth, requiereRol } from './auth_middleware.js';

/**
 * Configura las rutas de push notifications
 * @param {Express} app - Instancia de Express
 */
export function configurarRutasPush(app) {
  
  // ═══════════════════════════════════════════════════════════════
  // GET /api/push/vapid-key - Obtener clave pública VAPID
  // ═══════════════════════════════════════════════════════════════
  app.get('/api/push/vapid-key', (req, res) => {
    const publicKey = getVapidPublicKey();
    
    if (!publicKey) {
      return res.status(503).json({ 
        error: 'Push notifications no configuradas',
        enabled: false 
      });
    }
    
    res.json({ 
      publicKey,
      enabled: true 
    });
  });
  
  // ═══════════════════════════════════════════════════════════════
  // GET /api/push/status - Estado del servicio push
  // ═══════════════════════════════════════════════════════════════
  app.get('/api/push/status', (req, res) => {
    res.json({
      enabled: isPushEnabled(),
      vapidConfigured: !!getVapidPublicKey(),
      notificationTypes: Object.keys(NOTIFICATION_TYPES)
    });
  });
  
  // ═══════════════════════════════════════════════════════════════
  // POST /api/push/subscribe - Registrar suscripción push
  // ═══════════════════════════════════════════════════════════════
  app.post('/api/push/subscribe', requiereAuth, async (req, res) => {
    try {
      const { subscription } = req.body;
      
      if (!subscription || !subscription.endpoint || !subscription.keys) {
        return res.status(400).json({ error: 'Suscripción inválida' });
      }
      
      if (!subscription.keys.p256dh || !subscription.keys.auth) {
        return res.status(400).json({ error: 'Claves de suscripción inválidas' });
      }
      
      const result = await guardarSuscripcion(req.usuario.id, subscription);
      
      console.log(`🔔 Push suscripción ${result.created ? 'creada' : 'actualizada'} para usuario ${req.usuario.id}`);
      
      res.status(result.created ? 201 : 200).json({
        ok: true,
        message: result.created ? 'Suscripción creada' : 'Suscripción actualizada',
        id: result.id
      });
      
    } catch (error) {
      console.error('❌ Error guardando suscripción push:', error);
      res.status(500).json({ error: 'Error guardando suscripción' });
    }
  });
  
  // ═══════════════════════════════════════════════════════════════
  // DELETE /api/push/unsubscribe - Eliminar suscripción push
  // ═══════════════════════════════════════════════════════════════
  app.delete('/api/push/unsubscribe', requiereAuth, async (req, res) => {
    try {
      const { endpoint } = req.body;
      
      if (!endpoint) {
        return res.status(400).json({ error: 'Endpoint requerido' });
      }
      
      const result = await eliminarSuscripcion(endpoint);
      
      console.log(`🔕 Push suscripción eliminada: ${result.deleted}`);
      
      res.json({
        ok: true,
        deleted: result.deleted
      });
      
    } catch (error) {
      console.error('❌ Error eliminando suscripción push:', error);
      res.status(500).json({ error: 'Error eliminando suscripción' });
    }
  });
  
  // ═══════════════════════════════════════════════════════════════
  // POST /api/push/send - Enviar notificación (solo admin)
  // ═══════════════════════════════════════════════════════════════
  app.post('/api/push/send', requiereAuth, requiereRol(['admin']), async (req, res) => {
    try {
      const { usuarioId, grupo, tipo, titulo, mensaje, url } = req.body;
      
      if (!tipo) {
        return res.status(400).json({ error: 'Tipo de notificación requerido' });
      }
      
      if (!titulo && !mensaje) {
        return res.status(400).json({ error: 'Título o mensaje requerido' });
      }
      
      const payload = {
        title: titulo,
        body: mensaje,
        url: url || '/'
      };
      
      let result;
      
      if (usuarioId) {
        // Enviar a usuario específico
        result = await notificarUsuario(usuarioId, tipo, payload);
      } else if (grupo) {
        // Enviar a grupo
        const filtros = {};
        if (grupo.rol) filtros.rol = grupo.rol;
        if (grupo.dependencia) filtros.dependencia = grupo.dependencia;
        
        result = await notificarGrupo(filtros, tipo, payload);
      } else {
        return res.status(400).json({ error: 'Especifica usuarioId o grupo' });
      }
      
      console.log(`📤 Push enviado: ${result.sent} exitosos, ${result.failed} fallidos`);
      
      res.json({
        ok: true,
        ...result
      });
      
    } catch (error) {
      console.error('❌ Error enviando notificación push:', error);
      res.status(500).json({ error: 'Error enviando notificación' });
    }
  });
  
  // ═══════════════════════════════════════════════════════════════
  // POST /api/push/test - Enviar notificación de prueba (solo admin)
  // ═══════════════════════════════════════════════════════════════
  app.post('/api/push/test', requiereAuth, requiereRol(['admin']), async (req, res) => {
    try {
      // Enviar notificación de prueba al admin que hace la solicitud
      const result = await notificarUsuario(
        req.usuario.id, 
        NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT,
        {
          title: '🔔 Prueba de Notificación',
          body: 'Las notificaciones push están funcionando correctamente',
          url: '/'
        }
      );
      
      res.json({
        ok: true,
        message: 'Notificación de prueba enviada',
        ...result
      });
      
    } catch (error) {
      console.error('❌ Error enviando notificación de prueba:', error);
      res.status(500).json({ error: 'Error enviando notificación de prueba' });
    }
  });
  
  console.log('✅ Rutas de Push Notifications configuradas');
}

export default { configurarRutasPush };
