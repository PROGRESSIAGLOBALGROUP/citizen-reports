    db.all(sql, params, (err, rows) => {
      if (err) {
        db.close((closeErr) => {
          if (closeErr) console.error('❌ Error closing DB:', closeErr.message);
        });
        return res.status(500).json({ error: 'DB error' });
      }
      db.close((closeErr) => {
        if (closeErr) console.error('❌ Error closing DB:', closeErr.message);
      });
      const fc = {
        type: 'FeatureCollection',
        features: (rows || []).map((r) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [Number(r.lng), Number(r.lat)] },
          properties: {
            id: r.id,
            tipo: r.tipo,
            descripcion: r.descripcion,
            descripcion_corta: r.descripcion_corta,
            peso: r.peso,
            creado_en: r.creado_en,
          },
        })),
      };
      res.setHeader('Content-Type', 'application/geo+json');
      res.send(JSON.stringify(fc));
    });
