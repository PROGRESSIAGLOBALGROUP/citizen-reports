// Servidor de producción simplificado
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 4000;

// Middleware básico
app.use(compression());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del cliente
app.use(express.static(path.join(__dirname, '../client/dist')));

// Funciones auxiliares
function validarCoordenadas(lat, lng) {
  const a = Number(lat);
  const o = Number(lng);
  if (Number.isNaN(a) || Number.isNaN(o)) return false;
  if (a < -90 || a > 90) return false;
  if (o < -180 || o > 180) return false;
  return true;
}

// API Endpoints
app.get('/api/reportes', (req, res) => {
  const db = getDb();
  const sql = 'SELECT id, tipo, descripcion, descripcion_corta, lat, lng, peso, creado_en FROM reportes ORDER BY creado_en DESC';
  
  db.all(sql, [], (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: 'DB error' });
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
    if (err) return res.status(500).json({ error: 'DB error' });
    return res.json({ ok: true, id: this.lastID });
  });
});

app.get('/api/reportes/tipos', (req, res) => {
  const db = getDb();
  db.all('SELECT DISTINCT tipo FROM reportes ORDER BY tipo', [], (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: 'DB error' });
    const tipos = rows?.map(r => r.tipo) || [];
    res.json(tipos);
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Catch-all para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Iniciar servidor - SIN manejo de señales que puedan causar problemas
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor Jantetelco en http://localhost:${PORT}`);
});

// Solo manejar errores críticos
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Puerto ${PORT} en uso`);
  } else {
    console.error('❌ Error del servidor:', err);
  }
});

// Prevenir que el proceso se cierre automáticamente
process.stdin.resume();