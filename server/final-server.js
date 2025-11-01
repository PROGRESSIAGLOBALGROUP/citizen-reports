// Servidor Jantetelco - Versión Final Estable
import express from 'express';
import cors from 'cors';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 4000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4000'],
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

console.log('🚀 Iniciando servidor Jantetelco...');

// Funciones auxliares
function validarCoordenadas(lat, lng) {
  const a = Number(lat);
  const o = Number(lng);
  if (Number.isNaN(a) || Number.isNaN(o)) return false;
  if (a < -90 || a > 90) return false;
  if (o < -180 || o > 180) return false;
  return true;
}

function obtenerIpCliente(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip ||
         'unknown';
}

/**
 * Verifica si un reporte es potencialmente duplicado según reglas de negocio estrictas
 * REGLA: Solo se considera duplicado si es el MISMO dispositivo, MISMO tipo Y MISMA ubicación (±10m)
 */
function verificarPosibleDuplicado(db, datos) {
  return new Promise((resolve) => {
    const { lat, lng, tipo, fingerprint } = datos;
    
    // Si no hay fingerprint, no podemos verificar duplicados por dispositivo
    if (!fingerprint) {
      resolve({ esNuevo: true, advertencias: [] });
      return;
    }
    
    // Buscar reportes del MISMO dispositivo (fingerprint) en las últimas 24 horas
    // Solo considera duplicado si es: MISMO tipo + ubicación muy cercana (±10 metros ≈ 0.0001 grados)
    const sql = `
      SELECT id, tipo, lat, lng, creado_en,
             ABS(lat - ?) + ABS(lng - ?) as distancia
      FROM reportes 
      WHERE datetime(creado_en) > datetime('now', '-24 hours')
        AND fingerprint = ?
        AND fingerprint IS NOT NULL
        AND tipo = ?
        AND ABS(lat - ?) < 0.0001
        AND ABS(lng - ?) < 0.0001
      ORDER BY datetime(creado_en) DESC
      LIMIT 1
    `;
    
    db.all(sql, [lat, lng, fingerprint, tipo, lat, lng], (err, rows) => {
      if (err) {
        console.error('Error verificando duplicados:', err);
        resolve({ esNuevo: true, advertencias: [] });
        return;
      }
      
      const advertencias = [];
      let esNuevo = true;
      
      if (rows && rows.length > 0) {
        const reporte = rows[0];
        const tiempoMinutos = Math.round((Date.now() - new Date(reporte.creado_en).getTime()) / (1000 * 60));
        const distanciaMetros = Math.round(reporte.distancia * 111000); // Aproximación: 1 grado ≈ 111km
        
        // Solo marcar como duplicado si es muy reciente (menos de 5 minutos)
        if (tiempoMinutos < 5) {
          esNuevo = false;
          advertencias.push(`Reporte idéntico (mismo tipo y ubicación) hace ${tiempoMinutos} ${tiempoMinutos === 1 ? 'minuto' : 'minutos'}`);
        } else {
          // Solo advertir, pero permitir el reporte
          advertencias.push(`Reportaste un ${tipo} similar en esta ubicación hace ${tiempoMinutos} minutos`);
        }
      }
      
      resolve({ 
        esNuevo, 
        advertencias, 
        reportesSimilares: rows?.length || 0 
      });
    });
  });
}

// Rutas API
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    servidor: 'Jantetelco API',
    version: '2.0.0'
  });
});

app.get('/api/reportes', (req, res) => {
  const db = getDb();
  const sql = 'SELECT id, tipo, descripcion, descripcion_corta, lat, lng, peso, creado_en FROM reportes ORDER BY id DESC LIMIT 100';
  
  db.all(sql, [], (err, rows) => {
    db.close();
    if (err) {
      console.error('Error DB:', err);
      return res.status(500).json({ error: 'Error de base de datos' });
    }
    res.json(rows || []);
  });
});

app.post('/api/reportes', async (req, res) => {
  const { tipo, descripcion = '', descripcionCorta = '', lat, lng, peso = 1, fingerprint, userAgent, ipCliente: ipClienteParam, sesionId } = req.body;
  
  if (!tipo || !validarCoordenadas(lat, lng)) {
    return res.status(400).json({ error: 'Datos inválidos: falta tipo o coordenadas incorrectas' });
  }
  
  const db = getDb();
  const ipCliente = ipClienteParam || obtenerIpCliente(req);
  
  try {
    // Verificar duplicados con reglas de negocio estrictas
    const verificacion = await verificarPosibleDuplicado(db, { lat: Number(lat), lng: Number(lng), tipo, fingerprint, ipCliente });
    
    // Insertar el reporte con datos de identificación
    const stmt = `INSERT INTO reportes(tipo, descripcion, descripcion_corta, lat, lng, peso, ip_cliente, user_agent, fingerprint, sesion_id) 
                  VALUES (?,?,?,?,?,?,?,?,?,?)`;
    
    db.run(stmt, [
      tipo, 
      descripcion, 
      descripcionCorta || descripcion, 
      Number(lat), 
      Number(lng), 
      Math.max(1, Number(peso) || 1),
      ipCliente,
      userAgent || null,
      fingerprint || null,
      sesionId || null
    ], function (err) {
      db.close();
      if (err) {
        console.error('Error insertando reporte:', err);
        return res.status(500).json({ error: 'Error de base de datos' });
      }
      res.json({ 
        ok: true, 
        id: this.lastID, 
        esNuevo: verificacion.esNuevo,
        advertencias: verificacion.advertencias
      });
    });
  } catch (error) {
    db.close();
    console.error('Error procesando reporte:', error);
    res.status(500).json({ error: 'Error procesando reporte' });
  }
});

app.get('/api/reportes/tipos', (req, res) => {
  const db = getDb();
  db.all('SELECT DISTINCT tipo FROM reportes ORDER BY tipo', [], (err, rows) => {
    db.close();
    if (err) {
      console.error('Error obteniendo tipos:', err);
      return res.status(500).json({ error: 'Error de base de datos' });
    }
    const tipos = rows?.map(r => r.tipo) || [];
    res.json(tipos);
  });
});

// Servir SPA para todas las rutas no-API
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`✅ Servidor Jantetelco funcionando en http://localhost:${PORT}`);
  console.log('📡 API disponible en: /api/reportes, /api/reportes/tipos');
  console.log('🏥 Health check: /health');
  console.log('🌐 App web: http://localhost:4000');
  console.log('');
  console.log('👀 Servidor listo para recibir requests...');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Puerto ${PORT} ya está en uso`);
    process.exit(1);
  } else {
    console.error('❌ Error del servidor:', err);
  }
});

// No manejar SIGINT para evitar cierre automático
console.log('🛡️ Servidor configurado para mantenerse activo...');