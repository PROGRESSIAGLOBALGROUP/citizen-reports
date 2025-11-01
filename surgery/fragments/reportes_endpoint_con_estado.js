  app.get('/api/reportes', (req, res) => {
  const { minLat, maxLat, minLng, maxLng, from, to } = req.query;
  const tipos = normalizeTipos(req.query.tipo);
    const db = getDb();
    const conds = [];
    const params = [];
    if ([minLat, maxLat, minLng, maxLng].every((v) => v !== undefined)) {
      conds.push('lat BETWEEN ? AND ?');
      params.push(Number(minLat), Number(maxLat));
      conds.push('lng BETWEEN ? AND ?');
      params.push(Number(minLng), Number(maxLng));
    }
    appendTipoCondition(conds, params, tipos);
    if (from && isIsoDate(from)) {
      conds.push('date(creado_en) >= date(?)');
      params.push(from);
    }
    if (to && isIsoDate(to)) {
      conds.push('date(creado_en) <= date(?)');
      params.push(to);
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const sql = `SELECT id, tipo, descripcion, descripcion_corta, lat, lng, peso, dependencia, estado, creado_en FROM reportes ${where}`;
    db.all(sql, params, (err, rows) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'DB error' });
      }
      db.close();
      res.json(rows || []);
    });
  });
