// Servidor HTTP puro para diagnóstico
import http from 'http';
import { getDb } from './db.js';

const server = http.createServer((req, res) => {
  console.log(`📝 Request: ${req.method} ${req.url}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }
  
  if (req.method === 'GET' && req.url === '/test') {
    res.statusCode = 200;
    res.end(JSON.stringify({ 
      message: 'Servidor HTTP puro funcionando', 
      timestamp: new Date().toISOString() 
    }));
    return;
  }
  
  if (req.method === 'GET' && req.url === '/api/reportes') {
    const db = getDb();
    db.all('SELECT id, tipo, descripcion, lat, lng, peso, creado_en FROM reportes LIMIT 5', (err, rows) => {
      db.close();
      if (err) {
        console.error('DB Error:', err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'DB error' }));
        return;
      }
      res.statusCode = 200;
      res.end(JSON.stringify(rows || []));
    });
    return;
  }
  
  // 404 para otras rutas
  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 4000;

server.listen(PORT, () => {
  console.log(`🚀 Servidor HTTP puro en http://localhost:${PORT}`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

process.on('SIGINT', () => {
  console.log('\n👋 Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado');
    process.exit(0);
  });
});