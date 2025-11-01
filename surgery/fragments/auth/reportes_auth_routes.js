// Rutas para gestión de reportes autenticados
import { getDb } from './db.js';
import { 
  requiereAuth, 
  requiereSupervisor, 
  verificarAccesoReporte,
  verificarAsignacion,
  obtenerSupervisor,
  DEPENDENCIA_POR_TIPO
} from './auth_middleware.js';

/**
 * Configura las rutas de reportes autenticados
 */
export function configurarRutasReportes(app) {
  
  // GET /api/reportes/mis-reportes - Obtener reportes asignados al usuario
  app.get('/api/reportes/mis-reportes', requiereAuth, (req, res) => {
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
        console.error('Error obteniendo reportes:', err);
        return res.status(500).json({ error: 'Error del servidor' });
      }
      
      res.json(reportes);
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
  app.post('/api/reportes/:id/solicitar-cierre', requiereAuth, verificarAsignacion, (req, res) => {
    const reporteId = req.params.id;
    const { notas_cierre, firma_digital, evidencia_fotos } = req.body;
    
    if (!notas_cierre || !firma_digital) {
      return res.status(400).json({ error: 'notas_cierre y firma_digital son requeridos' });
    }
    
    const db = getDb();
    
    // Verificar que el reporte no esté ya cerrado o con cierre pendiente
    const sqlVerificar = `SELECT estado, dependencia FROM reportes WHERE id = ?`;
    
    db.get(sqlVerificar, [reporteId], async (err, reporte) => {
      if (err) {
        console.error('Error verificando reporte:', err);
        return res.status(500).json({ error: 'Error del servidor' });
      }
      
      if (!reporte) {
        return res.status(404).json({ error: 'Reporte no encontrado' });
      }
      
      if (reporte.estado === 'cerrado') {
        return res.status(400).json({ error: 'El reporte ya está cerrado' });
      }
      
      if (reporte.estado === 'pendiente_cierre') {
        return res.status(400).json({ error: 'Ya existe una solicitud de cierre pendiente' });
      }
      
      // Obtener supervisor de la dependencia
      let supervisorId;
      try {
        supervisorId = await obtenerSupervisor(reporte.dependencia);
      } catch (err) {
        console.error('Error obteniendo supervisor:', err);
        return res.status(500).json({ error: 'Error al obtener supervisor' });
      }
      
      // Crear solicitud de cierre
      const sqlCierre = `
        INSERT INTO cierres_pendientes 
        (reporte_id, funcionario_id, notas_cierre, firma_digital, evidencia_fotos, supervisor_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const evidenciaJson = evidencia_fotos ? JSON.stringify(evidencia_fotos) : null;
      
      db.run(sqlCierre, [reporteId, req.usuario.id, notas_cierre, firma_digital, evidenciaJson, supervisorId], function(err) {
        if (err) {
          console.error('Error creando solicitud de cierre:', err);
          return res.status(500).json({ error: 'Error del servidor' });
        }
        
        // Actualizar estado del reporte
        const sqlUpdate = `UPDATE reportes SET estado = 'pendiente_cierre' WHERE id = ?`;
        db.run(sqlUpdate, [reporteId]);
        
        res.json({ 
          mensaje: 'Solicitud de cierre enviada al supervisor',
          cierre_id: this.lastID,
          supervisor_id: supervisorId
        });
      });
    });
  });
  
  // GET /api/reportes/cierres-pendientes - Obtener cierres pendientes de aprobación (supervisores)
  app.get('/api/reportes/cierres-pendientes', requiereAuth, requiereSupervisor, (req, res) => {
    const db = getDb();
    
    // Si es admin, ve todos; si es supervisor, solo su dependencia
    const whereClause = req.usuario.rol === 'admin' 
      ? ''
      : 'WHERE r.dependencia = ?';
    
    const sql = `
      SELECT cp.*, 
             r.tipo, r.descripcion, r.lat, r.lng, r.dependencia,
             uf.nombre as funcionario_nombre, uf.email as funcionario_email
      FROM cierres_pendientes cp
      JOIN reportes r ON cp.reporte_id = r.id
      JOIN usuarios uf ON cp.funcionario_id = uf.id
      ${whereClause}
      AND cp.aprobado = 0
      ORDER BY cp.fecha_cierre DESC
    `;
    
    const params = req.usuario.rol === 'admin' ? [] : [req.usuario.dependencia];
    
    db.all(sql, params, (err, cierres) => {
      if (err) {
        console.error('Error obteniendo cierres pendientes:', err);
        return res.status(500).json({ error: 'Error del servidor' });
      }
      
      // Parsear evidencia_fotos
      cierres.forEach(cierre => {
        try {
          cierre.evidencia_fotos = cierre.evidencia_fotos ? JSON.parse(cierre.evidencia_fotos) : [];
        } catch (e) {
          cierre.evidencia_fotos = [];
        }
      });
      
      res.json(cierres);
    });
  });
  
  // POST /api/reportes/cierres/:id/aprobar - Aprobar cierre de reporte (supervisores)
  app.post('/api/reportes/cierres/:id/aprobar', requiereAuth, requiereSupervisor, (req, res) => {
    const cierreId = req.params.id;
    const { notas_supervisor } = req.body;
    
    const db = getDb();
    
    // Obtener información del cierre
    const sqlCierre = `
      SELECT cp.reporte_id, r.dependencia
      FROM cierres_pendientes cp
      JOIN reportes r ON cp.reporte_id = r.id
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
      
      // Verificar que el supervisor es de la misma dependencia (si no es admin)
      if (req.usuario.rol !== 'admin' && req.usuario.dependencia !== cierre.dependencia) {
        return res.status(403).json({ error: 'Solo puedes aprobar cierres de tu dependencia' });
      }
      
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
      SELECT cp.reporte_id, r.dependencia
      FROM cierres_pendientes cp
      JOIN reportes r ON cp.reporte_id = r.id
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
      
      // Verificar que el supervisor es de la misma dependencia (si no es admin)
      if (req.usuario.rol !== 'admin' && req.usuario.dependencia !== cierre.dependencia) {
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
}
