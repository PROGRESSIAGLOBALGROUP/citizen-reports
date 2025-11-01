import express from 'express';
import cors from 'cors';
import { getDb } from './db.js';

const app = express();
const PORT = 4000;

// Middleware básico
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Servidor funcionando', timestamp: new Date().toISOString() });
});

// Endpoint de reportes simplificado
app.get('/api/reportes', (req, res) => {
  const db = getDb();
  
  db.all('SELECT * FROM reportes', (err, rows) => {
    if (err) {
      console.error('Error en la consulta:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
      return;
    }
    
    console.log(`Devolviendo ${rows.length} reportes`);
    res.json(rows);
  });
  
  db.close();
});

// Endpoint de tipos
app.get('/api/reportes/tipos', (req, res) => {
  const db = getDb();
  
  db.all('SELECT DISTINCT tipo FROM reportes ORDER BY tipo', (err, rows) => {
    if (err) {
      console.error('Error en la consulta de tipos:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
      return;
    }
    
    const tipos = rows.map(row => row.tipo);
    console.log(`Devolviendo tipos:`, tipos);
    res.json(tipos);
  });
  
  db.close();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor de prueba ejecutándose en http://localhost:${PORT}`);
  console.log(`📊 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`🗃️ Reportes endpoint: http://localhost:${PORT}/api/reportes`);
});