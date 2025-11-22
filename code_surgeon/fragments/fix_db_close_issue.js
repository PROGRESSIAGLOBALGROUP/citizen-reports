// FRAGMENT: Fix database connection closure timing issue
// Problem: db.close() called immediately after db.run() without waiting for callback completion
// Solution: Remove db.close() from POST endpoints - let connections persist

  app.post('/api/reportes', (req, res) => {
    const { tipo, descripcion = '', descripcion_corta, lat, lng, peso = 1, fingerprint, ip_cliente, colonia, codigo_postal, municipio, estado_ubicacion } = req.body;
    if (!tipo || !validarCoordenadas(lat, lng)) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }
    
    // Asignar dependencia automáticamente según el tipo
    const dependencia = DEPENDENCIA_POR_TIPO[tipo] || 'administracion';
    
    // Si no se proporciona descripcion_corta, generarla automáticamente (primeros 100 chars)
    const descCorta = descripcion_corta || 
      (descripcion.length > 100 ? descripcion.substring(0, 100) + '...' : descripcion);
    
    const db = getDb();
    const stmt = `INSERT INTO reportes(tipo, descripcion, descripcion_corta, lat, lng, peso, dependencia, fingerprint, ip_cliente, colonia, codigo_postal, municipio, estado_ubicacion) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    db.run(stmt, [tipo, descripcion, descCorta, lat, lng, Math.max(1, Number(peso) || 1), dependencia, fingerprint, ip_cliente, colonia || null, codigo_postal || null, municipio || null, estado_ubicacion || null], function (err) {
      if (err) {
        console.error('❌ DB Error on POST /api/reportes:', err.message);
        return res.status(500).json({ error: 'DB error: ' + err.message });
      }
      return res.status(201).json({ ok: true, id: this.lastID, dependencia });
    });
  });
