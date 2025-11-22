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
      res.json(rows || []);
    });
