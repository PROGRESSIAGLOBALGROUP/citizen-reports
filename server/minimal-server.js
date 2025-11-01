// Servidor mínimo para validar funcionalidades existentes
import express from 'express';
import cors from 'cors';
import { getDb } from './db.js';

const app = express();
const PORT = 4000;

// Middleware básico
app.use(cors());
app.use(express.json());
app.use(express.static('../client/dist')); // Servir archivos estáticos

// Funciones auxiliares originales
function validarCoordenadas(lat, lng) {
  const a = Number(lat);
  const o = Number(lng);
  if (Number.isNaN(a) || Number.isNaN(o)) return false;
  if (a < -90 || a > 90) return false;
  if (o < -180 || o > 180) return false;
  return true;
}

function normalizeTipos(raw) {
  if (!raw) return [];
  const values = Array.isArray(raw) ? raw : String(raw).split(',');
  const unique = new Set();
  values.forEach((value) => {
    const trimmed = String(value).trim();
    if (trimmed) unique.add(trimmed);
  });
  return Array.from(unique);
}

// Ruta de prueba
app.get('/test', (req, res) => {
  console.log('✅ Test endpoint llamado');
  res.json({ 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    funcionalidades: [
      'GET /api/reportes - Listar reportes',
      'POST /api/reportes - Crear reporte',
      'GET /api/reportes/tipos - Tipos disponibles'
    ]
  });
});

// GET /api/reportes - Funcionalidad existente
app.get('/api/reportes', (req, res) => {
  console.log('📋 Listando reportes...');
  const db = getDb();
  
  const sql = 'SELECT id, tipo, descripcion, descripcion_corta, lat, lng, peso, creado_en FROM reportes ORDER BY creado_en DESC LIMIT 20';
  
  db.all(sql, [], (err, rows) => {
    db.close();
    if (err) {
      console.error('❌ Error DB:', err);
      return res.status(500).json({ error: 'Error de base de datos' });
    }
    console.log(`✅ Devolviendo ${rows?.length || 0} reportes`);
    res.json(rows || []);
  });
});

// POST /api/reportes - Funcionalidad existente SIN identificación (para probar que funciona)
app.post('/api/reportes', (req, res) => {
  const { tipo, descripcion = '', descripcionCorta = '', lat, lng, peso = 1 } = req.body;
  
  console.log('📝 Creando reporte:', { tipo, lat, lng });
  
  if (!tipo || !validarCoordenadas(lat, lng)) {
    console.log('❌ Datos inválidos');
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
    console.log(`✅ Reporte ${this.lastID} creado exitosamente`);
    return res.json({ ok: true, id: this.lastID });
  });
});

// GET /api/reportes/tipos - Funcionalidad existente
app.get('/api/reportes/tipos', (req, res) => {
  console.log('🏷️ Obteniendo tipos...');
  const db = getDb();
  
  db.all('SELECT DISTINCT tipo FROM reportes ORDER BY tipo', [], (err, rows) => {
    db.close();
    if (err) {
      console.error('❌ Error obteniendo tipos:', err);
      return res.status(500).json({ error: 'Error de base de datos' });
    }
    const tipos = rows?.map(r => r.tipo) || [];
    console.log(`✅ Tipos encontrados: ${tipos.join(', ')}`);
    res.json(tipos);
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor funcionando en http://localhost:${PORT}`);
  console.log('📋 Endpoints disponibles:');
  console.log('   GET  /test - Verificar funcionamiento');
  console.log('   GET  /api/reportes - Listar reportes');
  console.log('   POST /api/reportes - Crear reporte');
  console.log('   GET  /api/reportes/tipos - Tipos disponibles');
  console.log('');
  console.log('💡 Funcionalidades validadas: CRUD básico de reportes');
});

// Manejo de cierre limpio
process.on('SIGINT', () => {
  console.log('\n👋 Cerrando servidor...');
  process.exit(0);
});