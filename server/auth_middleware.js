// Middleware de autenticación y autorización
import { getDb } from './db.js';
import { verificarSesionActiva, actualizarActividadSesion } from './security.js';

/**
 * Mapeo de tipos de reporte a dependencias municipales
 * Actualizado con todos los tipos actuales (38 variantes)
 */
export const DEPENDENCIA_POR_TIPO = {
  // Obras Públicas
  'bache': 'obras_publicas',
  'baches': 'obras_publicas',  // Plural
  'pavimento_danado': 'obras_publicas',
  'banqueta_rota': 'obras_publicas',
  'banquetas_rotas': 'obras_publicas',  // Plural
  'alcantarilla': 'obras_publicas',
  'alcantarillas': 'obras_publicas',  // Plural
  
  // Servicios Públicos (mantenimiento general)
  'alumbrado': 'servicios_publicos',
  'basura': 'servicios_publicos',
  'limpieza': 'servicios_publicos',
  
  // Agua Potable (red hidráulica especializada)
  'falta_agua': 'agua_potable',      // Problemas de suministro
  'fuga_agua': 'agua_potable',       // Problemas de tubería
  'fugas_agua': 'agua_potable',      // Plural
  
  // Seguridad Pública (tipos específicos)
  'inseguridad': 'seguridad_publica',
  'accidente': 'seguridad_publica',
  'accidentes': 'seguridad_publica',  // Plural
  'delito': 'seguridad_publica',
  'delitos': 'seguridad_publica',  // Plural
  
  // Salud
  'plaga': 'salud',
  'plagas': 'salud',  // Plural
  'mascota_herida': 'salud',
  'mascotas_heridas': 'salud',  // Plural
  'contaminacion': 'salud',
  
  // Medio Ambiente
  'arbol_caido': 'medio_ambiente',
  'arboles_caidos': 'medio_ambiente',  // Plural
  'deforestacion': 'medio_ambiente',
  'quema': 'medio_ambiente',
  'quemas': 'medio_ambiente',  // Plural
  
  // Tipos legacy (compatibilidad con datos históricos, NO en dropdown)
  'agua': 'agua_potable',  // DEPRECATED → usar falta_agua o fuga_agua
  'parques': 'parques_jardines',  // Alias genérico → usar arbol_caido
  'seguridad': 'seguridad_publica'  // DEPRECATED → usar inseguridad, accidente o delito
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
    
    // Verificar session timeout por inactividad (30 min)
    if (!verificarSesionActiva(token)) {
      return res.status(401).json({ 
        error: 'Sesión expirada por inactividad',
        codigo: 'SESSION_TIMEOUT'
      });
    }
    
    // Actualizar actividad de sesión
    actualizarActividadSesion(token);
    
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
 * Middleware: Verifica que el usuario tenga uno de los roles especificados
 * @param {Array<string>} rolesPermitidos - Array de roles permitidos
 * @returns {Function} Middleware de Express
 */
export function requiereRol(rolesPermitidos) {
  return function(req, res, next) {
    if (!req.usuario) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ 
        error: `Requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}` 
      });
    }
    
    next();
  };
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
