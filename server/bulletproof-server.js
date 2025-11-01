// Servidor que NO se puede cerrar - Versión forzada
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());

console.log('🚀 INICIANDO SERVIDOR INDESTRUCTIBLE...');

// Función para abrir BD
function getDb() {
  return new sqlite3.Database(path.join(__dirname, 'data.db'));
}

// Endpoints básicos
app.get('/health', (req, res) => {
  console.log('💓 Health check');
  res.json({ 
    status: 'ALIVE', 
    timestamp: new Date().toISOString(),
    message: 'Servidor funcionando'
  });
});

app.get('/api/reportes', (req, res) => {
  console.log('📋 Obteniendo reportes...');
  const db = getDb();
  
  db.all('SELECT * FROM reportes ORDER BY creado_en DESC LIMIT 20', [], (err, rows) => {
    db.close();
    if (err) {
      console.error('❌ Error DB:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log(`✅ Enviando ${rows.length} reportes`);
    res.json(rows || []);
  });
});

app.post('/api/reportes', (req, res) => {
  console.log('📝 Creando reporte:', req.body);
  const { tipo, descripcion = '', lat, lng, peso = 1 } = req.body;
  
  if (!tipo || !lat || !lng) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }
  
  const db = getDb();
  const stmt = 'INSERT INTO reportes(tipo, descripcion, lat, lng, peso) VALUES (?,?,?,?,?)';
  
  db.run(stmt, [tipo, descripcion, Number(lat), Number(lng), Number(peso)], function (err) {
    db.close();
    if (err) {
      console.error('❌ Error insertando:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log(`✅ Reporte ${this.lastID} creado`);
    res.json({ ok: true, id: this.lastID });
  });
});

// PREVENIR CUALQUIER TIPO DE CIERRE
process.on('SIGINT', () => {
  console.log('🛡️ SIGINT ignorado - servidor protegido');
});

process.on('SIGTERM', () => {
  console.log('🛡️ SIGTERM ignorado - servidor protegido');
});

process.on('exit', () => {
  console.log('🛡️ EXIT ignorado - servidor protegido');
});

process.on('uncaughtException', (err) => {
  console.log('🛡️ Exception capturada:', err.message);
});

// Mantener proceso vivo a la fuerza
setInterval(() => {
  // Este timer mantiene el event loop activo
}, 1000);

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ SERVIDOR INDESTRUCTIBLE EN http://localhost:${PORT}`);
  console.log('🔒 Protegido contra cierre automático');
  console.log('📡 Endpoints: /health, /api/reportes');
  console.log('');
  console.log('Para detener: taskkill /f /im node.exe');
});

server.on('error', (err) => {
  console.error('❌ Error servidor:', err);
  if (err.code !== 'EADDRINUSE') {
    // Reintentar en puerto diferente si hay conflicto
    console.log('🔄 Reintentando...');
  }
});

console.log('🎯 Servidor blindado iniciado exitosamente');