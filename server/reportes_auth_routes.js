// Rutas para gestión de reportes autenticados
import { getDb } from './db.js';
import { 
  requiereAuth, 
  requiereSupervisor, 
  requiereRol,
  verificarAccesoReporte,
  verificarAsignacion,
  obtenerSupervisor,
  DEPENDENCIA_POR_TIPO
} from './auth_middleware.js';

// Helper para obtener IP del cliente
function obtenerIpCliente(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip ||
         'unknown';
}

/**
 * Configura las rutas de reportes autenticados
 */
export function configurarRutasReportes(app) {
  
  // GET /api/reportes/mis-reportes - Obtener reportes asignados al usuario
  // ✅ RUTA ESPECÍFICA - Debe estar ANTES que wildcards como /:id
  app.get('/api/reportes/mis-reportes', requiereAuth, (req, res) => {
    console.log(`[mis-reportes] Usuario ${req.usuario.id} (${req.usuario.email}) solicitando sus reportes asignados`);
    const db = getDb();
    const sql = `
      SELECT r.*, a.notas as notas_asignacion, a.creado_en as asignado_en
      FROM reportes r
      JOIN asignaciones a ON r.id = a.reporte_id
      WHERE a.usuario_id = ?
      ORDER BY r.creado_en DESC
    `;
    
    db.all(sql, [req.usuario.id], (err, reportes) => {
      if (err) {
        console.error('[mis-reportes] Error en query:', err);
        return res.status(500).json({ error: 'Error consultando base de datos', details: err.message });
      }
      
      console.log(`[mis-reportes] Retornando ${reportes.length} reportes`);
      res.json(reportes || []);
    });
  });
  
  // GET /api/reportes/:id/detalle - Obtener detalle completo de un reporte (con autenticación)
  app.get('/api/reportes/:id/detalle', requiereAuth, verificarAccesoReporte, (req, res) => {
    const db = getDb();
    const reporteId = req.params.id;
    
    const sql = `
      SELECT r.*,
             (SELECT json_group_array(json_object(
               'id', a.id,
               'usuario_id', a.usuario_id,
               'usuario_nombre', u.nombre,
               'usuario_email', u.email,
               'notas', a.notas,
               'asignado_en', a.creado_en
             ))
             FROM asignaciones a
             JOIN usuarios u ON a.usuario_id = u.id
             WHERE a.reporte_id = r.id) as asignaciones,
             (SELECT json_object(
               'id', cp.id,
               'funcionario_nombre', uf.nombre,
               'notas_cierre', cp.notas_cierre,
               'fecha_cierre', cp.fecha_cierre,
               'aprobado', cp.aprobado,
               'supervisor_nombre', us.nombre,
               'notas_supervisor', cp.notas_supervisor,
               'fecha_revision', cp.fecha_revision
             )
             FROM cierres_pendientes cp
             JOIN usuarios uf ON cp.funcionario_id = uf.id
             LEFT JOIN usuarios us ON cp.supervisor_id = us.id
             WHERE cp.reporte_id = r.id) as cierre_pendiente
      FROM reportes r
      WHERE r.id = ?
    `;
    
    db.get(sql, [reporteId], (err, reporte) => {
      if (err) {
        console.error('Error obteniendo detalle:', err);
        return res.status(500).json({ error: 'Error del servidor' });
      }
      
      if (!reporte) {
        return res.status(404).json({ error: 'Reporte no encontrado' });
      }
      
      // Parsear JSON
      try {
        reporte.asignaciones = reporte.asignaciones ? JSON.parse(reporte.asignaciones) : [];
        reporte.cierre_pendiente = reporte.cierre_pendiente ? JSON.parse(reporte.cierre_pendiente) : null;
      } catch (e) {
        reporte.asignaciones = [];
        reporte.cierre_pendiente = null;
      }
      
      res.json(reporte);
    });
  });
  
  // POST /api/reportes/:id/asignar - Asignar un reporte a un funcionario (solo supervisores)
  app.post('/api/reportes/:id/asignar', requiereAuth, requiereSupervisor, verificarAccesoReporte, (req, res) => {
    const reporteId = req.params.id;
    const { usuario_id, notas } = req.body;
    
    if (!usuario_id) {
      return res.status(400).json({ error: 'usuario_id requerido' });
    }
    
    const db = getDb();
    
    // Verificar que el funcionario existe y es de la misma dependencia
    const sqlUsuario = `SELECT id, dependencia FROM usuarios WHERE id = ? AND activo = 1`;
    
    db.get(sqlUsuario, [usuario_id], (err, usuario) => {
      if (err) {
        console.error('Error verificando usuario:', err);
        return res.status(500).json({ error: 'Error del servidor' });
      }
      
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      // Si no es admin, debe ser de la misma dependencia
      if (req.usuario.rol !== 'admin' && usuario.dependencia !== req.usuario.dependencia) {
        return res.status(403).json({ error: 'Solo puedes asignar funcionarios de tu dependencia' });
      }
      
      // Crear asignación
      const sqlAsignar = `
        INSERT OR IGNORE INTO asignaciones (reporte_id, usuario_id, asignado_por, notas)
        VALUES (?, ?, ?, ?)
      `;
      
      db.run(sqlAsignar, [reporteId, usuario_id, req.usuario.id, notas], function(err) {
        if (err) {
          console.error('Error asignando reporte:', err);
          return res.status(500).json({ error: 'Error del servidor' });
        }
        
        if (this.changes === 0) {
          return res.status(409).json({ error: 'El usuario ya está asignado a este reporte' });
        }
        
        // Actualizar estado del reporte
        const sqlUpdate = `UPDATE reportes SET estado = 'asignado' WHERE id = ? AND estado = 'abierto'`;
        db.run(sqlUpdate, [reporteId]);
        
        res.json({ 
          mensaje: 'Reporte asignado exitosamente',
          asignacion_id: this.lastID
        });
      });
    });
  });
  
  // POST /api/reportes/:id/solicitar-cierre - Funcionario solicita cerrar reporte
  app.post('/api/reportes/:id/solicitar-cierre', requiereAuth, verificarAsignacion, async (req, res) => {
    const reporteId = req.params.id;
    const { notas_cierre, firma_digital, evidencia_fotos } = req.body;
    
    if (!notas_cierre || !firma_digital) {
      return res.status(400).json({ error: 'notas_cierre y firma_digital son requeridos' });
    }
    
    const db = getDb();
    
    try {
      // Verificar que el reporte no esté ya cerrado o con cierre pendiente
      const sqlVerificar = `SELECT estado, dependencia FROM reportes WHERE id = ?`;
      
      const reporte = await new Promise((resolve, reject) => {
        db.get(sqlVerificar, [reporteId], (err, row) => {
          if (err) return reject(err);
          resolve(row);
        });
      });
      
      if (!reporte) {
        return res.status(404).json({ error: 'Reporte no encontrado' });
      }
      
      if (reporte.estado === 'cerrado') {
        return res.status(400).json({ error: 'El reporte ya está cerrado' });
      }
      
      if (reporte.estado === 'pendiente_cierre') {
        return res.status(400).json({ error: 'Ya existe una solicitud de cierre pendiente' });
      }
      
      // Obtener supervisor de la dependencia DEL FUNCIONARIO (no del reporte)
      // En asignaciones interdepartamentales, el funcionario notifica a SU supervisor
      const supervisorId = await obtenerSupervisor(req.usuario.dependencia);
      
      if (!supervisorId) {
        console.error(`No se encontró supervisor para la dependencia del funcionario: ${req.usuario.dependencia}`);
        return res.status(500).json({ error: 'No se encontró supervisor para esta dependencia' });
      }
      
      // Crear solicitud de cierre
      const sqlCierre = `
        INSERT INTO cierres_pendientes 
        (reporte_id, funcionario_id, notas_cierre, firma_digital, evidencia_fotos, supervisor_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const evidenciaJson = evidencia_fotos ? JSON.stringify(evidencia_fotos) : null;
      
      const cierreId = await new Promise((resolve, reject) => {
        db.run(sqlCierre, [reporteId, req.usuario.id, notas_cierre, firma_digital, evidenciaJson, supervisorId], function(err) {
          if (err) return reject(err);
          resolve(this.lastID);
        });
      });
      
      // Actualizar estado del reporte
      const sqlUpdate = `UPDATE reportes SET estado = 'pendiente_cierre' WHERE id = ?`;
      
      await new Promise((resolve, reject) => {
        db.run(sqlUpdate, [reporteId], (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
      
      res.json({ 
        mensaje: 'Solicitud de cierre enviada al supervisor',
        cierre_id: cierreId,
        supervisor_id: supervisorId
      });
      
    } catch (err) {
      console.error('Error en solicitar-cierre:', err);
      return res.status(500).json({ error: 'Error del servidor al procesar solicitud de cierre' });
    }
  });
  
  // GET /api/reportes/cierres-pendientes - Obtener cierres pendientes de aprobación (supervisores)
  // ✅ RUTA ESPECÍFICA - Debe estar ANTES que wildcards
  app.get('/api/reportes/cierres-pendientes', requiereAuth, requiereSupervisor, (req, res) => {
    console.log(`[cierres-pendientes] Usuario ${req.usuario.id} (${req.usuario.email}) solicitando cierres pendientes`);
    const db = getDb();
    
    // CORRECCIÓN: Filtrar por dependencia del FUNCIONARIO, no del reporte
    // En asignaciones interdepartamentales, el supervisor debe ver cierres de funcionarios de SU dependencia
    const whereClause = req.usuario.rol === 'admin' 
      ? 'WHERE cp.aprobado = 0'
      : 'WHERE uf.dependencia = ? AND cp.aprobado = 0';
    
    const sql = `
      SELECT cp.*, 
             r.tipo, r.descripcion, r.lat, r.lng, r.dependencia,
             uf.nombre as funcionario_nombre, uf.email as funcionario_email,
             uf.dependencia as funcionario_dependencia
      FROM cierres_pendientes cp
      JOIN reportes r ON cp.reporte_id = r.id
      JOIN usuarios uf ON cp.funcionario_id = uf.id
      ${whereClause}
      ORDER BY cp.fecha_cierre DESC
    `;
    
    const params = req.usuario.rol === 'admin' ? [] : [req.usuario.dependencia];
    
    db.all(sql, params, (err, cierres) => {
      if (err) {
        console.error('[cierres-pendientes] Error en query:', err);
        return res.status(500).json({ error: 'Error consultando base de datos', details: err.message });
      }
      
      // Parsear evidencia_fotos
      (cierres || []).forEach(cierre => {
        try {
          cierre.evidencia_fotos = cierre.evidencia_fotos ? JSON.parse(cierre.evidencia_fotos) : [];
        } catch (e) {
          console.warn(`[cierres-pendientes] Error parseando evidencia para cierre ${cierre.id}:`, e);
          cierre.evidencia_fotos = [];
        }
      });
      
      console.log(`[cierres-pendientes] Retornando ${cierres?.length || 0} cierres pendientes`);
      res.json(cierres || []);
    });
  });
  
  // POST /api/reportes/cierres/:id/aprobar - Aprobar cierre de reporte (supervisores)
  app.post('/api/reportes/cierres/:id/aprobar', requiereAuth, requiereSupervisor, (req, res) => {
    const cierreId = req.params.id;
    const { notas_supervisor } = req.body;
    
    const db = getDb();
    
    // Obtener información del cierre
    const sqlCierre = `
      SELECT cp.reporte_id, r.dependencia, uf.dependencia as funcionario_dependencia
      FROM cierres_pendientes cp
      JOIN reportes r ON cp.reporte_id = r.id
      JOIN usuarios uf ON cp.funcionario_id = uf.id
      WHERE cp.id = ? AND cp.aprobado = 0
    `;
    
    db.get(sqlCierre, [cierreId], (err, cierre) => {
      if (err) {
        console.error('Error obteniendo cierre:', err);
        return res.status(500).json({ error: 'Error del servidor' });
      }
      
      if (!cierre) {
        return res.status(404).json({ error: 'Cierre no encontrado o ya procesado' });
      }
      
      // DEBUG: Imprimir información de validación
      console.log('=== DEBUG APROBACIÓN ===');
      console.log('Usuario:', req.usuario.email, 'Rol:', req.usuario.rol, 'Dept:', req.usuario.dependencia);
      console.log('Cierre ID:', cierreId);
      console.log('Reporte dependencia:', cierre.dependencia);
      console.log('Funcionario dependencia:', cierre.funcionario_dependencia);
      console.log('Match?', req.usuario.dependencia === cierre.funcionario_dependencia);
      
      // Verificar que el supervisor es de la misma dependencia que el funcionario (si no es admin)
      if (req.usuario.rol !== 'admin' && req.usuario.dependencia !== cierre.funcionario_dependencia) {
        console.log('RECHAZADO: Dependencias no coinciden');
        return res.status(403).json({ error: 'Solo puedes aprobar cierres de tu dependencia' });
      }
      
      console.log('APROBADO: Continuando con actualización');
      
      // Aprobar cierre
      const sqlAprobar = `
        UPDATE cierres_pendientes 
        SET aprobado = 1, 
            notas_supervisor = ?,
            fecha_revision = datetime('now')
        WHERE id = ?
      `;
      
      db.run(sqlAprobar, [notas_supervisor, cierreId], function(err) {
        if (err) {
          console.error('Error aprobando cierre:', err);
          return res.status(500).json({ error: 'Error del servidor' });
        }
        
        // Actualizar estado del reporte a cerrado
        const sqlUpdate = `UPDATE reportes SET estado = 'cerrado' WHERE id = ?`;
        db.run(sqlUpdate, [cierre.reporte_id]);
        
        res.json({ mensaje: 'Cierre aprobado exitosamente' });
      });
    });
  });
  
  // POST /api/reportes/cierres/:id/rechazar - Rechazar cierre de reporte (supervisores)
  app.post('/api/reportes/cierres/:id/rechazar', requiereAuth, requiereSupervisor, (req, res) => {
    const cierreId = req.params.id;
    const { notas_supervisor } = req.body;
    
    if (!notas_supervisor) {
      return res.status(400).json({ error: 'notas_supervisor requeridas al rechazar' });
    }
    
    const db = getDb();
    
    // Obtener información del cierre
    const sqlCierre = `
      SELECT cp.reporte_id, r.dependencia, uf.dependencia as funcionario_dependencia
      FROM cierres_pendientes cp
      JOIN reportes r ON cp.reporte_id = r.id
      JOIN usuarios uf ON cp.funcionario_id = uf.id
      WHERE cp.id = ? AND cp.aprobado = 0
    `;
    
    db.get(sqlCierre, [cierreId], (err, cierre) => {
      if (err) {
        console.error('Error obteniendo cierre:', err);
        return res.status(500).json({ error: 'Error del servidor' });
      }
      
      if (!cierre) {
        return res.status(404).json({ error: 'Cierre no encontrado o ya procesado' });
      }
      
      // Verificar que el supervisor es de la misma dependencia que el funcionario (si no es admin)
      if (req.usuario.rol !== 'admin' && req.usuario.dependencia !== cierre.funcionario_dependencia) {
        return res.status(403).json({ error: 'Solo puedes rechazar cierres de tu dependencia' });
      }
      
      // Rechazar cierre
      const sqlRechazar = `
        UPDATE cierres_pendientes 
        SET aprobado = -1, 
            notas_supervisor = ?,
            fecha_revision = datetime('now')
        WHERE id = ?
      `;
      
      db.run(sqlRechazar, [notas_supervisor, cierreId], function(err) {
        if (err) {
          console.error('Error rechazando cierre:', err);
          return res.status(500).json({ error: 'Error del servidor' });
        }
        
        // Regresar reporte a estado asignado
        const sqlUpdate = `UPDATE reportes SET estado = 'asignado' WHERE id = ?`;
        db.run(sqlUpdate, [cierre.reporte_id]);
        
        res.json({ mensaje: 'Cierre rechazado. El funcionario debe corregir.' });
      });
    });
  });
  
  // POST /api/reportes/:id/reabrir - Reabrir reporte cerrado (solo admin)
  app.post('/api/reportes/:id/reabrir', requiereAuth, requiereRol(['admin']), (req, res) => {
    const reporteId = req.params.id;
    const { razon } = req.body;
    
    if (!razon || razon.trim().length < 10) {
      return res.status(400).json({ 
        error: 'Debe proporcionar una razón de al menos 10 caracteres para reabrir el reporte' 
      });
    }
    
    const db = getDb();
    
    // Verificar que el reporte existe y está cerrado
    db.get('SELECT id, estado, tipo, dependencia FROM reportes WHERE id = ?', [reporteId], (err, reporte) => {
      if (err) {
        console.error('Error obteniendo reporte:', err);
        return res.status(500).json({ error: 'Error del servidor' });
      }
      
      if (!reporte) {
        return res.status(404).json({ error: 'Reporte no encontrado' });
      }
      
      if (reporte.estado !== 'cerrado') {
        return res.status(400).json({ 
          error: `El reporte no está cerrado (estado actual: ${reporte.estado})` 
        });
      }
      
      // Cambiar estado a 'abierto' y registrar en historial
      db.run(
        'UPDATE reportes SET estado = ? WHERE id = ?',
        ['abierto', reporteId],
        function(err) {
          if (err) {
            console.error('Error reabriendo reporte:', err);
            return res.status(500).json({ error: 'Error del servidor' });
          }
          
          // Registrar en historial_cambios (ADR-0010)
          const sqlHistorial = `
            INSERT INTO historial_cambios (
              usuario_id, entidad, entidad_id, tipo_cambio, campo_modificado,
              valor_anterior, valor_nuevo, razon, metadatos
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          
          const metadatos = JSON.stringify({
            ip: obtenerIpCliente(req),
            user_agent: req.headers['user-agent'] || 'unknown',
            timestamp: new Date().toISOString()
          });
          
          db.run(
            sqlHistorial,
            [
              req.usuario.id,
              'reporte',
              reporteId,
              'reapertura',
              'estado',
              'cerrado',
              'abierto',
              razon.trim(),
              metadatos
            ],
            (errHistorial) => {
              if (errHistorial) {
                console.error('Error registrando en historial:', errHistorial);
                // No falla la operación, solo loguea el error
              }
              
              res.json({ 
                mensaje: 'Reporte reabierto exitosamente',
                reporte_id: reporteId,
                nuevo_estado: 'abierto'
              });
            }
          );
        }
      );
    });
  });
}
