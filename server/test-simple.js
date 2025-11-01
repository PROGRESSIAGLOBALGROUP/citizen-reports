// Servidor de prueba simple para verificar funcionalidad básica
import express from 'express';
import { getDb } from './db.js';

const app = express();
app.use(express.json());

// Ruta de prueba básica
app.get('/test', (req, res) => {
  res.json({ message: 'Servidor funcionando', timestamp: new Date().toISOString() });
});

// Ruta para listar reportes (funcionalidad existente)
app.get('/api/reportes', (req, res) => {
  const db = getDb();
  db.all('SELECT id, tipo, descripcion, lat, lng, peso, creado_en FROM reportes LIMIT 10', (err, rows) => {
    db.close();
    if (err) {
      console.error('DB Error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
    res.json(rows || []);
  });
});

// Ruta para crear reporte (funcionalidad existente sin identificación)
app.post('/api/reportes', (req, res) => {
  const { tipo, descripcion = '', lat, lng, peso = 1 } = req.body;
  
  console.log('📝 Recibido reporte:', { tipo, lat, lng });
  
  if (!tipo || !lat || !lng) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }
  
  const db = getDb();
  const stmt = `INSERT INTO reportes(tipo, descripcion, lat, lng, peso) VALUES (?,?,?,?,?)`;
  
  db.run(stmt, [tipo, descripcion, Number(lat), Number(lng), Math.max(1, Number(peso) || 1)], function (err) {
    db.close();
    if (err) {
      console.error('Insert Error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
    console.log(`✅ Reporte ${this.lastID} creado`);
    return res.json({ ok: true, id: this.lastID });
  });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de prueba en http://localhost:${PORT}`);
  console.log(`📋 Rutas disponibles:`);
  console.log(`   GET  /test - Verificar funcionamiento`);
  console.log(`   GET  /api/reportes - Listar reportes`);
  console.log(`   POST /api/reportes - Crear reporte`);
});

// Manejar errores no capturados
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});