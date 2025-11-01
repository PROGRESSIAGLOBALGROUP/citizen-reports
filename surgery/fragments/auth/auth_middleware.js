// Middleware de autenticación y autorización
import { getDb } from './db.js';

/**
 * Mapeo de tipos de reporte a dependencias
 */
export const DEPENDENCIA_POR_TIPO = {
  'baches': 'obras_publicas',
  'alumbrado': 'servicios_publicos',
  'seguridad': 'seguridad_publica',
  'limpieza': 'servicios_publicos',
  'agua': 'agua_potable',
  'parques': 'parques_jardines'
};

/**
 * Middleware: Verifica que el usuario esté autenticado
 */
export function requiereAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  
  const db = getDb();
  const sql = `
    SELECT s.id, s.usuario_id, s.expira_en, u.email, u.nombre, u.dependencia, u.rol, u.activo
    FROM sesiones s
    JOIN usuarios u ON s.usuario_id = u.id
    WHERE s.token = ? AND datetime(s.expira_en) > datetime('now')
  `;
  
  db.get(sql, [token], (err, sesion) => {
    if (err) {
      console.error('Error verificando token:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
    
    if (!sesion) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
    
    if (!sesion.activo) {
      return res.status(403).json({ error: 'Usuario desactivado' });
    }
    
    // Adjuntar usuario al request
    req.usuario = {
      id: sesion.usuario_id,
      email: sesion.email,
      nombre: sesion.nombre,
      dependencia: sesion.dependencia,
      rol: sesion.rol
    };
    
    next();
  });
}

/**
 * Middleware: Verifica que el usuario sea supervisor o admin
 */
export function requiereSupervisor(req, res, next) {
  if (!req.usuario) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  
  if (req.usuario.rol !== 'supervisor' && req.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Requiere rol de supervisor o administrador' });
  }
  
  next();
}

/**
 * Middleware: Verifica que el usuario sea admin
 */
export function requiereAdmin(req, res, next) {
  if (!req.usuario) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Requiere rol de administrador' });
  }
  
  next();
}

/**
 * Verifica si el usuario tiene acceso a un reporte específico
 */
export function verificarAccesoReporte(req, res, next) {
  const reporteId = req.params.id || req.body.reporte_id;
  
  if (!reporteId) {
    return res.status(400).json({ error: 'ID de reporte requerido' });
  }
  
  const db = getDb();
  const sql = `SELECT dependencia FROM reportes WHERE id = ?`;
  
  db.get(sql, [reporteId], (err, reporte) => {
    if (err) {
      console.error('Error verificando acceso:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
    
    if (!reporte) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }
    
    // Admin puede ver todo
    if (req.usuario.rol === 'admin') {
      return next();
    }
    
    // Los funcionarios solo pueden acceder a reportes de su dependencia
    if (req.usuario.dependencia !== reporte.dependencia) {
      return res.status(403).json({ error: 'No tienes acceso a reportes de esta dependencia' });
    }
    
    next();
  });
}

/**
 * Verifica si el usuario está asignado a un reporte específico
 */
export function verificarAsignacion(req, res, next) {
  const reporteId = req.params.id || req.body.reporte_id;
  
  if (!reporteId) {
    return res.status(400).json({ error: 'ID de reporte requerido' });
  }
  
  const db = getDb();
  
  // Admin puede cerrar cualquier reporte
  if (req.usuario.rol === 'admin') {
    return next();
  }
  
  const sql = `
    SELECT id FROM asignaciones 
    WHERE reporte_id = ? AND usuario_id = ?
  `;
  
  db.get(sql, [reporteId, req.usuario.id], (err, asignacion) => {
    if (err) {
      console.error('Error verificando asignación:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
    
    if (!asignacion) {
      return res.status(403).json({ error: 'No estás asignado a este reporte' });
    }
    
    next();
  });
}

/**
 * Obtiene el supervisor de una dependencia
 */
export function obtenerSupervisor(dependencia) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    const sql = `
      SELECT id FROM usuarios 
      WHERE dependencia = ? AND rol = 'supervisor' AND activo = 1
      LIMIT 1
    `;
    
    db.get(sql, [dependencia], (err, supervisor) => {
      if (err) return reject(err);
      resolve(supervisor?.id || null);
    });
  });
}
