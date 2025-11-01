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
