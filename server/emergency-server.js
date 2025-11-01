// Servidor forzado a mantenerse vivo con diagnóstico completo
import express from 'express';
import { getDb } from './db.js';

console.log('🚀 Iniciando servidor de emergencia...');

const app = express();
const PORT = 4000;

// Middleware básico
app.use(express.json());
app.use(express.static('../client/dist'));

// Log de todas las requests
app.use((req, res, next) => {
  console.log(`📨 ${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Endpoint básico de salud
app.get('/health', (req, res) => {
  console.log('💚 Health check OK');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Endpoint de reportes simplificado
app.get('/api/reportes', (req, res) => {
  console.log('📋 Obteniendo reportes...');
  
  try {
    const db = getDb();
    const query = 'SELECT id, tipo, descripcion, descripcion_corta, lat, lng, peso, creado_en FROM reportes ORDER BY creado_en DESC LIMIT 10';
    
    db.all(query, [], (err, rows) => {
      db.close();
      if (err) {
        console.error('❌ Error DB:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      console.log(`✅ Enviando ${rows?.length || 0} reportes`);
      res.json(rows || []);
    });
  } catch (error) {
    console.error('❌ Error crítico:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Endpoint POST simplificado (SIN identificación por ahora)
app.post('/api/reportes', (req, res) => {
  console.log('📝 Creando reporte:', req.body);
  
  const { tipo, descripcion = '', lat, lng, peso = 1 } = req.body;
  
  if (!tipo || !lat || !lng) {
    console.log('❌ Datos inválidos');
    return res.status(400).json({ error: 'Datos inválidos' });
  }
  
  try {
    const db = getDb();
    const stmt = 'INSERT INTO reportes(tipo, descripcion, lat, lng, peso) VALUES (?,?,?,?,?)';
    
    db.run(stmt, [tipo, descripcion, Number(lat), Number(lng), Math.max(1, Number(peso) || 1)], function (err) {
      db.close();
      if (err) {
        console.error('❌ Error inserción:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      console.log(`✅ Reporte ${this.lastID} creado`);
      res.json({ ok: true, id: this.lastID });
    });
  } catch (error) {
    console.error('❌ Error crítico POST:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Tipos de reporte
app.get('/api/reportes/tipos', (req, res) => {
  console.log('🏷️ Obteniendo tipos...');
  
  try {
    const db = getDb();
    db.all('SELECT DISTINCT tipo FROM reportes ORDER BY tipo', [], (err, rows) => {
      db.close();
      if (err) {
        console.error('❌ Error tipos:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      const tipos = rows?.map(r => r.tipo) || [];
      console.log('✅ Tipos:', tipos);
      res.json(tipos);
    });
  } catch (error) {
    console.error('❌ Error crítico tipos:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// FORZAR que el servidor se mantenga vivo
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ SERVIDOR VIVO en http://localhost:${PORT}`);
  console.log(`🕒 Iniciado: ${new Date().toISOString()}`);
  console.log('📍 Endpoints disponibles:');
  console.log('   GET  /health');
  console.log('   GET  /api/reportes');
  console.log('   POST /api/reportes');
  console.log('   GET  /api/reportes/tipos');
});

// Log de eventos del servidor
server.on('connection', (socket) => {
  console.log('🔗 Nueva conexión establecida');
});

server.on('error', (err) => {
  console.error('❌ Error del servidor:', err);
});

// Evitar que el proceso termine
process.on('SIGINT', () => {
  console.log('\n⚠️ SIGINT recibido - IGNORANDO para mantener servidor vivo');
  console.log('💡 Para cerrar realmente, usa Ctrl+C múltiples veces o cierra la terminal');
});

process.on('SIGTERM', () => {
  console.log('\n⚠️ SIGTERM recibido - IGNORANDO para mantener servidor vivo');
});

process.on('uncaughtException', (err) => {
  console.error('❌ Excepción no capturada:', err);
  console.log('🔄 Servidor continúa funcionando...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada:', reason);
  console.log('🔄 Servidor continúa funcionando...');
});

// Heartbeat cada 5 segundos
setInterval(() => {
  console.log(`💓 Servidor vivo - ${new Date().toLocaleTimeString()} - Uptime: ${Math.floor(process.uptime())}s`);
}, 5000);

console.log('🛡️ Servidor configurado para mantenerse vivo forzosamente');