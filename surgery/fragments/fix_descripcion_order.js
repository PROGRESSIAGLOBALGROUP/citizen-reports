  app.post('/api/reportes', (req, res) => {
    const { tipo, descripcion = '', descripcion_corta, lat, lng, peso = 1, fingerprint, ip_cliente } = req.body;
    if (!tipo || !validarCoordenadas(lat, lng)) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }
    
    // Asignar dependencia automáticamente según el tipo
    const dependencia = DEPENDENCIA_POR_TIPO[tipo] || 'administracion';
    
    // CORRECCIÓN: descripcion_corta debe ser la corta (para mapa público)
    // descripcion debe ser la detallada (para funcionarios)
    const descCorta = descripcion_corta?.trim() || 
      (descripcion.length > 100 ? descripcion.substring(0, 100) + '...' : descripcion);
    
    const descCompleta = descripcion?.trim() || descCorta;
    
    const db = getDb();
    // CORRECCIÓN: Asegurar orden correcto: descripcion=larga, descripcion_corta=corta
    const stmt = `INSERT INTO reportes(tipo, descripcion, descripcion_corta, lat, lng, peso, dependencia, fingerprint, ip_cliente) VALUES (?,?,?,?,?,?,?,?,?)`;
    db.run(stmt, [tipo, descCompleta, descCorta, lat, lng, Math.max(1, Number(peso) || 1), dependencia, fingerprint, ip_cliente], function (err) {
      db.close();
      if (err) return res.status(500).json({ error: 'DB error' });
      return res.json({ ok: true, id: this.lastID, dependencia });
    });
  });
