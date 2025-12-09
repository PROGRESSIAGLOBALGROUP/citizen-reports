/**
 * 🚨 Rutas API para Sistema de Alertas - citizen-reports
 * 
 * Endpoints:
 * - GET  /api/alertas           → Listar alertas activas
 * - GET  /api/alertas/stats     → Estadísticas de alertas
 * - GET  /api/alertas/config    → Configuración actual
 * - PUT  /api/alertas/:id/resolver → Marcar alerta como resuelta
 * - POST /api/alertas/verificar → Ejecutar verificación manual
 * 
 * @module alertas-routes
 */

import { 
  obtenerAlertasActivas, 
  obtenerEstadisticasAlertas,
  obtenerConfiguracionAlertas,
  resolverAlerta,
  ejecutarVerificaciones,
  ALERT_TYPES,
  ALERT_SEVERITY
} from './alertas-automaticas.js';

/**
 * Configura las rutas de alertas
 * @param {Express} app - Instancia de Express
 * @param {Function} requiereAuth - Middleware de autenticación
 * @param {Function} requiereRol - Middleware de autorización por rol
 */
export function configurarRutasAlertas(app, requiereAuth, requiereRol) {
  
  /**
   * GET /api/alertas
   * Lista alertas activas (no resueltas)
   * 
   * Query params:
   * - dependencia: Filtrar por dependencia
   * - severidad: 'critical', 'warning', 'info'
   * - tipo: Tipo de alerta
   * 
   * Acceso: supervisor (su dependencia) o admin (todas)
   */
  app.get('/api/alertas', requiereAuth, requiereRol(['supervisor', 'admin']), async (req, res) => {
    try {
      const { dependencia, severidad, tipo } = req.query;
      
      // Supervisor solo ve su dependencia
      const filtros = {};
      if (req.usuario.rol === 'supervisor') {
        filtros.dependencia = req.usuario.dependencia;
      } else if (dependencia) {
        filtros.dependencia = dependencia;
      }
      
      if (severidad) filtros.severidad = severidad;
      if (tipo) filtros.tipo = tipo;
      
      const alertas = await obtenerAlertasActivas(filtros);
      
      res.json({
        ok: true,
        alertas,
        total: alertas.length,
        filtros
      });
    } catch (error) {
      console.error('[ALERTAS API] Error obteniendo alertas:', error);
      res.status(500).json({ error: 'Error obteniendo alertas' });
    }
  });
  
  /**
   * GET /api/alertas/stats
   * Estadísticas de alertas
   * 
   * Acceso: supervisor o admin
   */
  app.get('/api/alertas/stats', requiereAuth, requiereRol(['supervisor', 'admin']), async (req, res) => {
    try {
      const stats = await obtenerEstadisticasAlertas();
      
      res.json({
        ok: true,
        stats
      });
    } catch (error) {
      console.error('[ALERTAS API] Error obteniendo estadísticas:', error);
      res.status(500).json({ error: 'Error obteniendo estadísticas' });
    }
  });
  
  /**
   * GET /api/alertas/config
   * Configuración actual del sistema de alertas
   * 
   * Acceso: admin
   */
  app.get('/api/alertas/config', requiereAuth, requiereRol(['admin']), (req, res) => {
    try {
      const config = obtenerConfiguracionAlertas();
      
      res.json({
        ok: true,
        config,
        tipos_disponibles: ALERT_TYPES,
        severidades_disponibles: ALERT_SEVERITY
      });
    } catch (error) {
      console.error('[ALERTAS API] Error obteniendo configuración:', error);
      res.status(500).json({ error: 'Error obteniendo configuración' });
    }
  });
  
  /**
   * PUT /api/alertas/:id/resolver
   * Marca una alerta como resuelta
   * 
   * Acceso: supervisor (su dependencia) o admin
   */
  app.put('/api/alertas/:id/resolver', requiereAuth, requiereRol(['supervisor', 'admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const usuarioId = req.usuario.id;
      
      const exito = await resolverAlerta(parseInt(id), usuarioId);
      
      if (!exito) {
        return res.status(404).json({ error: 'Alerta no encontrada' });
      }
      
      res.json({
        ok: true,
        mensaje: 'Alerta marcada como resuelta'
      });
    } catch (error) {
      console.error('[ALERTAS API] Error resolviendo alerta:', error);
      res.status(500).json({ error: 'Error resolviendo alerta' });
    }
  });
  
  /**
   * POST /api/alertas/verificar
   * Ejecuta verificación manual de alertas
   * 
   * Acceso: admin
   */
  app.post('/api/alertas/verificar', requiereAuth, requiereRol(['admin']), async (req, res) => {
    try {
      console.log(`[ALERTAS API] Verificación manual iniciada por ${req.usuario.email}`);
      
      const alertas = await ejecutarVerificaciones();
      
      res.json({
        ok: true,
        mensaje: `Verificación completada: ${alertas.length} alertas detectadas`,
        alertas
      });
    } catch (error) {
      console.error('[ALERTAS API] Error en verificación:', error);
      res.status(500).json({ error: 'Error ejecutando verificación' });
    }
  });
  
  console.log('[ALERTAS] Rutas API configuradas');
}
