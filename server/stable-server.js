// Servidor funcional sin logs repetitivos - Versión estable
import express from 'express';
import cors from 'cors';
import { getDb } from './db.js';

const app = express();
const PORT = 4000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.static('../client/dist'));

// Log inicial solamente
console.log('🚀 Servidor citizen-reports iniciando...');

// Funciones auxiliares
function validarCoordenadas(lat, lng) {
  const a = Number(lat);
  const o = Number(lng);
  return !Number.isNaN(a) && !Number.isNaN(o) && a >= -90 && a <= 90 && o >= -180 && o <= 180;
}

// Endpoints principales
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Servidor citizen-reports funcionando correctamente'
  });
});

app.get('/api/reportes', (req, res) => {
  const db = getDb();
  const sql = 'SELECT id, tipo, descripcion, descripcion_corta, lat, lng, peso, creado_en FROM reportes ORDER BY creado_en DESC LIMIT 50';
  
  db.all(sql, [], (err, rows) => {
    db.close();
    if (err) {
      console.error('❌ Error DB:', err);
      return res.status(500).json({ error: 'Error de base de datos' });
    }
    res.json(rows || []);
  });
});

app.post('/api/reportes', (req, res) => {
  const { tipo, descripcion = '', descripcionCorta = '', lat, lng, peso = 1 } = req.body;
  
  if (!tipo || !validarCoordenadas(lat, lng)) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }
  
  const db = getDb();
  const stmt = 'INSERT INTO reportes(tipo, descripcion, descripcion_corta, lat, lng, peso) VALUES (?,?,?,?,?,?)';
  
  db.run(stmt, [tipo, descripcion, descripcionCorta || descripcion, Number(lat), Number(lng), Math.max(1, Number(peso) || 1)], function (err) {
    db.close();
    if (err) {
      console.error('❌ Error insertando:', err);
      return res.status(500).json({ error: 'Error de base de datos' });
    }
    res.json({ ok: true, id: this.lastID });
  });
});

app.get('/api/reportes/tipos', (req, res) => {
  const db = getDb();
  db.all('SELECT DISTINCT tipo FROM reportes ORDER BY tipo', [], (err, rows) => {
    db.close();
    if (err) {
      return res.status(500).json({ error: 'Error de base de datos' });
    }
    const tipos = rows?.map(r => r.tipo) || [];
    res.json(tipos);
  });
});

// Manejar todas las rutas SPA
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: '../client/dist' });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`✅ Servidor funcionando en http://localhost:${PORT}`);
  console.log('📡 Endpoints: /health, /api/reportes, /api/reportes/tipos');
  console.log('🌐 Frontend: http://localhost:4000');
  console.log('');
  // No más logs repetitivos - servidor silencioso después del inicio
});

server.on('error', (err) => {
  console.error('❌ Error del servidor:', err);
});

// Manejo limpio de cierre
process.on('SIGINT', () => {
  console.log('\n👋 Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

export { app };