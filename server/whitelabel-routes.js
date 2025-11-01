import { getDb } from './db.js';

/**
 * GET /api/whitelabel/config
 * Obtiene configuración white label actual (pública - sin token requerido)
 */
export function obtenerConfigWhitelabel(req, res) {
  const db = getDb();
  
  db.get(
    'SELECT * FROM whitelabel_config WHERE activo = 1 LIMIT 1',
    (err, config) => {
      if (err) {
        console.error('❌ Error obtener whitelabel:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Si no existe config, retornar defaults
      if (!config) {
        return res.json({
          nombre_municipio: 'Jantetelco',
          mostrar_progressia: 1,
          mostrar_citizen_reports: 1,
          color_primario: '#1e40af',
          color_secundario: '#2563eb',
          logo_url: null,
          nombre_app: 'Citizen-Reports',
          lema: 'Transparencia Municipal'
        });
      }
      
      res.json({
        nombre_municipio: config.nombre_municipio,
        mostrar_progressia: config.mostrar_progressia,
        mostrar_citizen_reports: config.mostrar_citizen_reports,
        color_primario: config.color_primario,
        color_secundario: config.color_secundario,
        logo_url: config.logo_url,
        nombre_app: config.nombre_app,
        lema: config.lema
      });
    }
  );
}

/**
 * POST /api/super-usuario/whitelabel/config
 * Actualiza configuración white label (solo SUPER USUARIO)
 * Requiere token especial: 'X-Super-User-Token' header
 */
export function actualizarConfigWhitelabel(req, res) {
  const db = getDb();
  const superUserToken = req.headers['x-super-user-token'];
  
  // Validación del token super usuario
  if (!superUserToken || superUserToken !== process.env.SUPER_USER_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized: Invalid super user token' });
  }
  
  const {
    nombre_municipio,
    mostrar_progressia,
    mostrar_citizen_reports,
    color_primario,
    color_secundario,
    logo_url,
    nombre_app,
    lema
  } = req.body;
  
  // Validaciones básicas
  if (!nombre_municipio || nombre_municipio.trim().length === 0) {
    return res.status(400).json({ error: 'nombre_municipio is required' });
  }
  
  // Validar colores (formato hex)
  if (color_primario && !/^#[0-9A-F]{6}$/i.test(color_primario)) {
    return res.status(400).json({ error: 'Invalid color_primario format (use #RRGGBB)' });
  }
  
  if (color_secundario && !/^#[0-9A-F]{6}$/i.test(color_secundario)) {
    return res.status(400).json({ error: 'Invalid color_secundario format (use #RRGGBB)' });
  }
  
  // Obtener o crear configuración
  db.get(
    'SELECT id FROM whitelabel_config WHERE activo = 1 LIMIT 1',
    (err, existingConfig) => {
      if (err) {
        console.error('❌ Error checking existing config:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      const now = new Date().toISOString();
      
      if (existingConfig) {
        // Actualizar configuración existente
        db.run(
          `UPDATE whitelabel_config 
           SET nombre_municipio = ?, 
               mostrar_progressia = ?, 
               mostrar_citizen_reports = ?,
               color_primario = ?,
               color_secundario = ?,
               logo_url = ?,
               nombre_app = ?,
               lema = ?,
               actualizado_en = ?
           WHERE id = ?`,
          [
            nombre_municipio,
            mostrar_progressia ? 1 : 0,
            mostrar_citizen_reports ? 1 : 0,
            color_primario || '#1e40af',
            color_secundario || '#2563eb',
            logo_url || null,
            nombre_app || 'Citizen-Reports',
            lema || 'Transparencia Municipal',
            now,
            existingConfig.id
          ],
          (updateErr) => {
            if (updateErr) {
              console.error('❌ Error updating whitelabel:', updateErr);
              return res.status(500).json({ error: 'Database error' });
            }
            
            res.json({
              message: 'White label configuration updated',
              config: {
                nombre_municipio,
                mostrar_progressia: mostrar_progressia ? 1 : 0,
                mostrar_citizen_reports: mostrar_citizen_reports ? 1 : 0,
                color_primario: color_primario || '#1e40af',
                color_secundario: color_secundario || '#2563eb',
                logo_url,
                nombre_app: nombre_app || 'Citizen-Reports',
                lema: lema || 'Transparencia Municipal'
              }
            });
          }
        );
      } else {
        // Crear nueva configuración
        db.run(
          `INSERT INTO whitelabel_config 
           (nombre_municipio, mostrar_progressia, mostrar_citizen_reports, 
            color_primario, color_secundario, logo_url, nombre_app, lema, creado_en, actualizado_en)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            nombre_municipio,
            mostrar_progressia ? 1 : 0,
            mostrar_citizen_reports ? 1 : 0,
            color_primario || '#1e40af',
            color_secundario || '#2563eb',
            logo_url || null,
            nombre_app || 'Citizen-Reports',
            lema || 'Transparencia Municipal',
            now,
            now
          ],
          (insertErr) => {
            if (insertErr) {
              console.error('❌ Error creating whitelabel:', insertErr);
              return res.status(500).json({ error: 'Database error' });
            }
            
            res.status(201).json({
              message: 'White label configuration created',
              config: {
                nombre_municipio,
                mostrar_progressia: mostrar_progressia ? 1 : 0,
                mostrar_citizen_reports: mostrar_citizen_reports ? 1 : 0,
                color_primario: color_primario || '#1e40af',
                color_secundario: color_secundario || '#2563eb',
                logo_url,
                nombre_app: nombre_app || 'Citizen-Reports',
                lema: lema || 'Transparencia Municipal'
              }
            });
          }
        );
      }
    }
  );
}

/**
 * GET /api/super-usuario/stats
 * Dashboard de super usuario con estadísticas generales
 * Requiere token especial
 */
export function obtenerStatsSupeUsuario(req, res) {
  const db = getDb();
  const superUserToken = req.headers['x-super-user-token'];
  
  if (!superUserToken || superUserToken !== process.env.SUPER_USER_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized: Invalid super user token' });
  }
  
  // Obtener estadísticas generales
  db.all(
    `SELECT 
      (SELECT COUNT(*) FROM reportes) as total_reportes,
      (SELECT COUNT(*) FROM usuarios) as total_usuarios,
      (SELECT COUNT(*) FROM usuarios WHERE rol = 'admin') as total_admins,
      (SELECT COUNT(DISTINCT dependencia) FROM reportes) as dependencias_activas,
      (SELECT COUNT(*) FROM reportes WHERE estado IN ('nuevo', 'en_proceso')) as reportes_abiertos,
      (SELECT COUNT(*) FROM reportes WHERE estado = 'cerrado') as reportes_cerrados
    `,
    (err, stats) => {
      if (err) {
        console.error('❌ Error getting stats:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        timestamp: new Date().toISOString(),
        stats: stats[0] || {}
      });
    }
  );
}
