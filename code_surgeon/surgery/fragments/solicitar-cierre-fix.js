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
      
      // Obtener supervisor de la dependencia
      const supervisorId = await obtenerSupervisor(reporte.dependencia);
      
      if (!supervisorId) {
        console.error(`No se encontró supervisor para dependencia: ${reporte.dependencia}`);
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
