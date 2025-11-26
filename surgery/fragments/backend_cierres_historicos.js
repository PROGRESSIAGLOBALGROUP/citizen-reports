  // GET /api/reportes/cierres-pendientes - Obtener cierres pendientes de aprobación (supervisores)
  // ✅ RUTA ESPECÍFICA - Debe estar ANTES que wildcards
  app.get('/api/reportes/cierres-pendientes', requiereAuth, requiereSupervisor, (req, res) => {
    console.log(`[cierres-pendientes] Usuario ${req.usuario.id} (${req.usuario.email}) solicitando cierres`);
    const db = getDb();
    
    const { estado, fecha_inicio, fecha_fin, limit, offset } = req.query;
    
    // Construir filtros
    let whereConditions = [];
    let params = [];
    
    // 1. Filtro por dependencia (si no es admin)
    if (req.usuario.rol !== 'admin') {
      whereConditions.push('uf.dependencia = ?');
      params.push(req.usuario.dependencia);
    }
    
    // 2. Filtro por estado
    if (estado === 'aprobado') {
      whereConditions.push('cp.aprobado = 1');
    } else if (estado === 'rechazado') {
      whereConditions.push('cp.aprobado = -1');
    } else if (estado === 'todos') {
      // No filtrar por aprobado
    } else {
      // Default: pendientes
      whereConditions.push('cp.aprobado = 0');
    }
    
    // 3. Filtro por fecha
    if (fecha_inicio) {
      whereConditions.push('date(cp.fecha_cierre) >= date(?)');
      params.push(fecha_inicio);
    }
    if (fecha_fin) {
      whereConditions.push('date(cp.fecha_cierre) <= date(?)');
      params.push(fecha_fin);
    }
    
    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ') 
      : '';
      
    // Paginación
    const limitVal = parseInt(limit) || 50;
    const offsetVal = parseInt(offset) || 0;
    
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
      LIMIT ? OFFSET ?
    `;
    
    params.push(limitVal, offsetVal);
    
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
      
      console.log(`[cierres-pendientes] Retornando ${cierres?.length || 0} cierres`);
      res.json(cierres || []);
    });
  });