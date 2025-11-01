/**
 * FRAGMENTO LIMPIO: POST /api/reportes sin detección de duplicados
 * 
 * Elimina completamente la lógica de verificación de duplicados
 * que causaba mensajes de advertencia incorrectos en el frontend
 */

app.post('/api/reportes', (req, res) => {
  const { tipo, descripcion = '', lat, lng, peso = 1, fingerprint, ip_cliente } = req.body;
  if (!tipo || !validarCoordenadas(lat, lng)) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }
  
  // Asignar dependencia automáticamente según el tipo
  const dependencia = DEPENDENCIA_POR_TIPO[tipo] || 'administracion';
  
  const db = getDb();
  const stmt = `INSERT INTO reportes(tipo, descripcion, lat, lng, peso, dependencia, fingerprint, ip_cliente) VALUES (?,?,?,?,?,?,?,?)`;
  db.run(stmt, [tipo, descripcion, lat, lng, Math.max(1, Number(peso) || 1), dependencia, fingerprint, ip_cliente], function (err) {
    db.close();
    if (err) return res.status(500).json({ error: 'DB error' });
    return res.json({ ok: true, id: this.lastID, dependencia });
  });
});
