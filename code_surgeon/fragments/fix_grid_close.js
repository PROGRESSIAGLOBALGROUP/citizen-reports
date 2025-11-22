    db.all(sql, [cell, cell, cell, cell, ...params], (err, rows) => {
      db.close((closeErr) => {
        if (closeErr) console.error('❌ Error closing DB:', closeErr.message);
      });
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json(rows || []);
    });
