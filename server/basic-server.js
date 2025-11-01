// Servidor super básico para diagnóstico
import express from 'express';
import { getDb } from './db.js';

const app = express();
const PORT = 4000;

app.use(express.json());

console.log('🔍 Iniciando servidor básico...');

// Test básico sin BD
app.get('/ping', (req, res) => {
  console.log('🏓 Ping recibido');
  res.json({ message: 'pong', time: Date.now() });
});

// Test con BD
app.get('/db-test', (req, res) => {
  console.log('🗄️ Probando base de datos...');
  const db = getDb();
  db.get('SELECT COUNT(*) as count FROM reportes', (err, row) => {
    db.close();
    if (err) {
      console.error('❌ Error BD:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('✅ BD funciona:', row);
    res.json({ database: 'OK', reportes: row.count });
  });
});

// Reportes básicos
app.get('/api/reportes', (req, res) => {
  console.log('📋 Obteniendo reportes...');
  const db = getDb();
  db.all('SELECT * FROM reportes LIMIT 5', (err, rows) => {
    db.close();
    if (err) {
      console.error('❌ Error:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log(`✅ Reportes: ${rows.length}`);
    res.json(rows);
  });
});

const server = app.listen(PORT, () => {
  console.log(`✅ Servidor básico en puerto ${PORT}`);
  console.log('🔗 Prueba: http://localhost:4000/ping');
});

server.on('error', (err) => {
  console.error('❌ Error del servidor:', err);
});

// Log de todas las requests
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

console.log('🎯 Servidor configurado, esperando requests...');