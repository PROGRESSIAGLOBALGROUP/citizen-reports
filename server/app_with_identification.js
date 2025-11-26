import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_TILE_HOSTS = ['a', 'b', 'c'];
const rawHosts = process.env.TILE_PROXY_HOSTS
  ? process.env.TILE_PROXY_HOSTS.split(',').map((h) => h.trim()).filter(Boolean)
  : [];

/**
 * Extrae la IP real del cliente considerando proxies y load balancers
 * @param {object} req - Request object de Express
 * @returns {string} IP del cliente
 */
function obtenerIpCliente(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip ||
         'unknown';
}

/**
 * Verifica si un reporte puede ser duplicado basado en criterios de similaridad
 * @param {object} db - Instancia de base de datos
 * @param {object} datos - Datos del nuevo reporte
 * @returns {Promise<object>} Resultado de la verificación
 */
function verificarPosibleDuplicado(db, datos) {
  return new Promise((resolve) => {
    const { lat, lng, tipo, fingerprint, ip_cliente } = datos;
    
    // Buscar reportes similares en las últimas 24 horas
    const sql = `
      SELECT id, tipo, lat, lng, creado_en, fingerprint, ip_cliente,
             ABS(lat - ?) + ABS(lng - ?) as distancia
      FROM reportes 
      WHERE datetime(creado_en) > datetime('now', '-24 hours')
        AND (
          (fingerprint = ? AND fingerprint IS NOT NULL) OR
          (ip_cliente = ? AND ip_cliente IS NOT NULL) OR
          (tipo = ? AND ABS(lat - ?) < 0.001 AND ABS(lng - ?) < 0.001)
        )
      ORDER BY distancia, datetime(creado_en) DESC
      LIMIT 5
    `;
    
    db.all(sql, [lat, lng, fingerprint, ip_cliente, tipo, lat, lng], (err, rows) => {
      if (err) {
        resolve({ esNuevo: true, advertencias: [] });
        return;
      }
      
      const advertencias = [];
      let esNuevo = true;
      
      if (rows && rows.length > 0) {
        rows.forEach(row => {
          const distancia = row.distancia;
          const tiempoMinutos = Math.round((Date.now() - new Date(row.creado_en).getTime()) / (1000 * 60));
          
          if (row.fingerprint === fingerprint && fingerprint) {
            advertencias.push(`Mismo dispositivo reportó hace ${tiempoMinutos} minutos`);
            if (tiempoMinutos < 5) esNuevo = false;
          }
          
          if (row.ip_cliente === ip_cliente && ip_cliente !== 'unknown') {
            advertencias.push(`Misma IP reportó hace ${tiempoMinutos} minutos`);
          }
          
          if (distancia < 0.001 && row.tipo === tipo) {
            advertencias.push(`Reporte similar muy cerca (${Math.round(distancia * 111000)}m)`);
            if (tiempoMinutos < 60) esNuevo = false;
          }
        });
      }
      
      resolve({ esNuevo, advertencias, reportesSimilares: rows?.length || 0 });
    });
  });
}
const normalizedHosts = (rawHosts.length ? rawHosts : DEFAULT_TILE_HOSTS).map((host) => {
  const trimmed = host.trim();
  const withoutSlashes = trimmed.replace(/^\/+/, '').replace(/\/+$/g, '');
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/g, '');
  }
  if (withoutSlashes.includes('.')) {
    return `https://${withoutSlashes}`;
  }
  return `https://${withoutSlashes}.tile.openstreetmap.org`;
});
const TILE_BASES = normalizedHosts.length ? normalizedHosts : DEFAULT_TILE_HOSTS.map((h) => `https://${h}.tile.openstreetmap.org`);
const FALLBACK_TILE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=',
  'base64'
);

function validarCoordenadas(lat, lng) {
  const a = Number(lat);
  const o = Number(lng);
  if (Number.isNaN(a) || Number.isNaN(o)) return false;
  if (a < -90 || a > 90) return false;
  if (o < -180 || o > 180) return false;
  return true;
}

function isIsoDate(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
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

function appendTipoCondition(conds, params, tipos) {
  if (!tipos || tipos.length === 0) return;
  if (tipos.length === 1) {
    conds.push('tipo = ?');
    params.push(tipos[0]);
  } else {
    conds.push(`tipo IN (${tipos.map(() => '?').join(',')})`);
    params.push(...tipos);
  }
}

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('combined'));
  app.use(compression());

  app.get('/tiles/:z/:x/:y.png', async (req, res) => {
    const { z, x, y } = req.params;
  const hostIndex = Math.abs((Number(x) + Number(y)) % TILE_BASES.length);
  const base = TILE_BASES[hostIndex];
  const tileUrl = `${base}/${z}/${x}/${y}.png`;

    res.setHeader('Content-Type', 'image/png');
    try {
      const response = await fetch(tileUrl, {
        headers: {
          'User-Agent': 'citizen-reports-Heatmap/1.0 (+https://localhost)' // etiquette per OSM tile terms
        }
      });

      if (!response.ok) {
        throw new Error(`Tile fetch failed with status ${response.status}`);
      }

      res.setHeader('Cache-Control', 'public, max-age=86400');
      const buffer = Buffer.from(await response.arrayBuffer());
      res.send(buffer);
    } catch (error) {
      console.error('Error al proxyar mosaico OSM', error);
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-Fallback-Tile', '1');
      res.status(200).send(FALLBACK_TILE);
    }
  });

  app.post('/api/reportes', async (req, res) => {
    const { tipo, descripcion = '', lat, lng, peso = 1, fingerprint, sesionId, userAgent } = req.body;
    
    console.log('🔍 DEBUG - Datos recibidos:', { tipo, lat, lng, fingerprint, sesionId });
    
    if (!tipo || !validarCoordenadas(lat, lng)) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    // Capturar datos de identificación
    const ip_cliente = obtenerIpCliente(req);
    const user_agent = userAgent || req.headers['user-agent'] || 'unknown';
    
    console.log('🔍 DEBUG - IP cliente:', ip_cliente, '| User agent:', user_agent.substring(0, 50));
    
    const db = getDb();
    
    try {
      // Verificar posibles duplicados
      const verificacion = await verificarPosibleDuplicado(db, {
        lat: Number(lat),
        lng: Number(lng),
        tipo,
        fingerprint,
        ip_cliente
      });
      
      // Si parece ser duplicado, devolver advertencia pero permitir continuar
      if (!verificacion.esNuevo) {
        console.log(`⚠️  Posible duplicado detectado: ${verificacion.advertencias.join(', ')}`);
      }
      
      // Insertar el reporte con datos de identificación usando promesa
      const insertarReporte = () => {
        return new Promise((resolve, reject) => {
          const stmt = `
            INSERT INTO reportes(
              tipo, descripcion, lat, lng, peso, 
              ip_cliente, user_agent, fingerprint, sesion_id
            ) VALUES (?,?,?,?,?,?,?,?,?)
          `;
          
          db.run(stmt, [
            tipo, 
            descripcion, 
            Number(lat), 
            Number(lng), 
            Math.max(1, Number(peso) || 1),
            ip_cliente,
            user_agent.substring(0, 500), // Limitar longitud
            fingerprint || null,
            sesionId || null
          ], function (err) {
            if (err) {
              reject(err);
            } else {
              resolve(this.lastID);
            }
          });
        });
      };
      
      const reporteId = await insertarReporte();
      db.close();
      
      const respuesta = {
        ok: true,
        id: reporteId,
        esNuevo: verificacion.esNuevo,
        advertencias: verificacion.advertencias
      };
      
      if (!verificacion.esNuevo) {
        respuesta.mensaje = 'Reporte guardado, pero detectamos reportes similares recientes';
      }
      
      console.log(`✅ Reporte ${reporteId} creado desde IP: ${ip_cliente}`);
      return res.json(respuesta);
      
    } catch (error) {
      db.close();
      console.error('Error en creación de reporte:', error);
      return res.status(500).json({ 
        error: 'Error interno del servidor',
        detalle: error.message 
      });
    }
  });

  app.get('/api/reportes', (req, res) => {
  const { minLat, maxLat, minLng, maxLng, from, to } = req.query;
  const tipos = normalizeTipos(req.query.tipo);
    const db = getDb();
    const conds = [];
    const params = [];
    if ([minLat, maxLat, minLng, maxLng].every((v) => v !== undefined)) {
      conds.push('lat BETWEEN ? AND ?');
      params.push(Number(minLat), Number(maxLat));
      conds.push('lng BETWEEN ? AND ?');
      params.push(Number(minLng), Number(maxLng));
    }
    appendTipoCondition(conds, params, tipos);
    if (from && isIsoDate(from)) {
      conds.push('date(creado_en) >= date(?)');
      params.push(from);
    }
    if (to && isIsoDate(to)) {
      conds.push('date(creado_en) <= date(?)');
      params.push(to);
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const sql = `SELECT id, tipo, descripcion, descripcion_corta, lat, lng, peso, creado_en FROM reportes ${where}`;
    db.all(sql, params, (err, rows) => {
      db.close();
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json(rows || []);
    });
  });

  app.get('/api/reportes/tipos', (req, res) => {
    const db = getDb();
    db.all('SELECT DISTINCT tipo FROM reportes ORDER BY tipo', [], (err, rows) => {
      db.close();
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json(rows.map((r) => r.tipo));
    });
  });

  app.get('/api/reportes/geojson', (req, res) => {
    const { from, to } = req.query;
    const tipos = normalizeTipos(req.query.tipo);
    const db = getDb();
    const conds = [];
    const params = [];
    appendTipoCondition(conds, params, tipos);
    if (from && isIsoDate(from)) {
      conds.push('date(creado_en) >= date(?)');
      params.push(from);
    }
    if (to && isIsoDate(to)) {
      conds.push('date(creado_en) <= date(?)');
      params.push(to);
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const sql = `SELECT id, tipo, descripcion, descripcion_corta, lat, lng, peso, creado_en FROM reportes ${where}`;
    db.all(sql, params, (err, rows) => {
      db.close();
      if (err) return res.status(500).json({ error: 'DB error' });
      const fc = {
        type: 'FeatureCollection',
        features: (rows || []).map((r) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [Number(r.lng), Number(r.lat)] },
          properties: {
            id: r.id,
            tipo: r.tipo,
            descripcion: r.descripcion,
            descripcion_corta: r.descripcion_corta,
            peso: r.peso,
            creado_en: r.creado_en,
          },
        })),
      };
      res.setHeader('Content-Type', 'application/geo+json');
      res.send(JSON.stringify(fc));
    });
  });

  app.get('/api/reportes/grid', (req, res) => {
    const cell = Math.max(0.001, Math.min(1, Number(req.query.cell) || 0.005));
    const { from, to } = req.query;
    const tipos = normalizeTipos(req.query.tipo);
    const db = getDb();
    const conds = [];
    const params = [];
    appendTipoCondition(conds, params, tipos);
    if (from && isIsoDate(from)) {
      conds.push('date(creado_en) >= date(?)');
      params.push(from);
    }
    if (to && isIsoDate(to)) {
      conds.push('date(creado_en) <= date(?)');
      params.push(to);
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const sql = `SELECT lat, lng, peso FROM reportes ${where}`;
    db.all(sql, params, (err, rows) => {
      db.close();
      if (err) return res.status(500).json({ error: 'DB error' });
      const bins = new Map();
      for (const r of rows || []) {
        const lat = Number(r.lat);
        const lng = Number(r.lng);
        const ky = `${Math.round(lat / cell) * cell}_${Math.round(lng / cell) * cell}`;
        const prev =
          bins.get(ky) || {
            lat: Math.round(lat / cell) * cell,
            lng: Math.round(lng / cell) * cell,
            peso: 0,
          };
        prev.peso += Math.max(1, Number(r.peso) || 1);
        bins.set(ky, prev);
      }
      res.json(Array.from(bins.values()));
    });
  });

  const distPath = path.resolve(__dirname, '../client/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  return app;
}

export default createApp;
