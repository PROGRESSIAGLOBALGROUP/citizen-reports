  
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
              reporte_id, usuario_id, tipo_cambio, campo_modificado,
              valor_anterior, valor_nuevo, razon, metadatos
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `;
          
          const metadatos = JSON.stringify({
            ip: obtenerIpCliente(req),
            user_agent: req.headers['user-agent'] || 'unknown',
            timestamp: new Date().toISOString()
          });
          
          db.run(
            sqlHistorial,
            [
              reporteId,
              req.usuario.id,
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
