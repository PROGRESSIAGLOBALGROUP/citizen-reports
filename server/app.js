import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { getDb } from './db.js';
import { configurarRutasAuth } from './auth_routes.js';
import { configurarRutasReportes } from './reportes_auth_routes.js';
import { DEPENDENCIA_POR_TIPO, requiereAuth, requiereRol } from './auth_middleware.js';
import * as usuariosRoutes from './usuarios-routes.js';
import * as asignacionesRoutes from './asignaciones-routes.js';
import * as tiposRoutes from './tipos-routes.js';
import * as adminRoutes from './admin-routes.js';
import * as dependenciasRoutes from './dependencias-routes.js';
import * as whitelabelRoutes from './whitelabel-routes.js';
import webhookRoutes from './webhook-routes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_TILE_HOSTS = ['a', 'b', 'c'];
const rawHosts = process.env.TILE_PROXY_HOSTS
  ? process.env.TILE_PROXY_HOSTS.split(',').map((h) => h.trim()).filter(Boolean)
  : [];

// Funciones de identificación con reglas de negocio correctas
function obtenerIpCliente(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip ||
         'unknown';
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

  // Trust proxy headers (Apache/Nginx está en frente)
  app.set('trust proxy', 1);

  // Helmet: Deshabilitado en producción detrás de proxy (Apache maneja seguridad)
  // Solo usar protección básica contra vulnerabilidades comunes
  app.use(helmet({
    contentSecurityPolicy: false,  // Deshabilitado - Vite genera inline scripts
    crossOriginEmbedderPolicy: false,  // Deshabilitado para proxy
    crossOriginOpenerPolicy: false,  // Deshabilitado para proxy
    crossOriginResourcePolicy: false  // Deshabilitado para CORS
  }));

  // CORS explícito: Permite requests desde el mismo origen
  app.use(cors({
    origin: function(origin, callback) {
      // Permitir:
      // 1. Requests sin origin (same-origin)
      // 2. Requests desde el mismo host (IP)
      // 3. Requests desde dominio en producción
      // 4. Localhost en desarrollo
      if (!origin || 
          origin.includes('localhost') || 
          origin.includes('127.0.0.1') || 
          origin.includes('145.79.0.77') ||
          origin.includes('reportes.progressiagroup.com')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.use(express.json({ limit: '5mb' }));
  app.use(morgan('combined'));
  app.use(compression());

  // Configurar rutas de autenticación
  configurarRutasAuth(app);
  configurarRutasReportes(app);

  // Rutas de gestión de usuarios (API REST)
  app.get('/api/usuarios', usuariosRoutes.listarUsuarios);
  app.get('/api/usuarios/:id', usuariosRoutes.obtenerUsuario);
  app.post('/api/usuarios', usuariosRoutes.crearUsuario);
  app.put('/api/usuarios/:id', usuariosRoutes.actualizarUsuario);
  app.delete('/api/usuarios/:id', usuariosRoutes.eliminarUsuario);
  app.get('/api/roles', usuariosRoutes.listarRoles);
  
  // Rutas de dependencias (públicas y admin)
  app.get('/api/dependencias', dependenciasRoutes.listarDependenciasPublico);
  app.get('/api/admin/dependencias', requiereAuth, requiereRol(['admin']), dependenciasRoutes.listarDependencias);
  app.get('/api/admin/dependencias/:id', requiereAuth, requiereRol(['admin']), dependenciasRoutes.obtenerDependencia);
  app.post('/api/admin/dependencias', requiereAuth, requiereRol(['admin']), dependenciasRoutes.crearDependencia);
  app.put('/api/admin/dependencias/:id', requiereAuth, requiereRol(['admin']), dependenciasRoutes.editarDependencia);
  app.delete('/api/admin/dependencias/:id', requiereAuth, requiereRol(['admin']), dependenciasRoutes.eliminarDependencia);
  app.patch('/api/admin/dependencias/:id/orden', requiereAuth, requiereRol(['admin']), dependenciasRoutes.actualizarOrdenDependencia);

  // IMPORTANTE: Rutas específicas ANTES de rutas con parámetros
  // Rutas de tipos y categorías (ADR-0009: dinámicas desde DB)
  app.get('/api/tipos', tiposRoutes.obtenerTiposActivos);
  app.get('/api/categorias', tiposRoutes.obtenerCategoriasConTipos);
  app.get('/api/categorias-con-tipos', tiposRoutes.obtenerCategoriasConTipos); // Alias para frontend
  
  // Rutas admin de categorías (requieren rol admin)
  app.post('/api/admin/categorias', requiereAuth, requiereRol(['admin']), adminRoutes.crearCategoria);
  app.put('/api/admin/categorias/:id', requiereAuth, requiereRol(['admin']), adminRoutes.editarCategoria);
  app.delete('/api/admin/categorias/:id', requiereAuth, requiereRol(['admin']), adminRoutes.eliminarCategoria);
  app.patch('/api/admin/categorias/:id/orden', requiereAuth, requiereRol(['admin']), adminRoutes.reordenarCategorias);
  
  // Rutas admin de tipos de reporte (requieren rol admin)
  app.post('/api/admin/tipos', requiereAuth, requiereRol(['admin']), adminRoutes.crearTipo);
  app.put('/api/admin/tipos/:id', requiereAuth, requiereRol(['admin']), adminRoutes.editarTipo);
  app.delete('/api/admin/tipos/:id', requiereAuth, requiereRol(['admin']), adminRoutes.eliminarTipo);
  
  // DEPRECATED (pero mantenido por compatibilidad): consulta desde tabla de tipos
  app.get('/api/reportes/tipos', (req, res) => {
    const db = getDb();
    db.all(
      'SELECT tipo FROM tipos_reporte WHERE activo = 1 ORDER BY orden, nombre',
      [],
      (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        res.json(rows.map((r) => r.tipo));
      }
    );
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
      if (err) {
        db.close();
        return res.status(500).json({ error: 'DB error' });
      }
      db.close();
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
    const sql = `SELECT CAST((lat / ?) AS INT) * ? AS clat, CAST((lng / ?) AS INT) * ? AS clng, SUM(peso) AS speso, COUNT(*) AS cnt FROM reportes ${where} GROUP BY clat, clng`;
    db.all(sql, [cell, cell, cell, cell, ...params], (err, rows) => {
      db.close();
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json(rows || []);
    });
  });

  // Rutas de asignaciones y detalle de reportes (CON parámetros - van después)
  app.get('/api/reportes/:id', asignacionesRoutes.obtenerReporteDetalle);
  app.get('/api/reportes/:id/asignaciones', requiereAuth, asignacionesRoutes.listarAsignaciones);
  app.post('/api/reportes/:id/asignaciones', requiereAuth, requiereRol(['admin', 'supervisor']), asignacionesRoutes.crearAsignacion);
  app.delete('/api/reportes/:id/asignaciones/:usuarioId', requiereAuth, requiereRol(['admin', 'supervisor']), asignacionesRoutes.eliminarAsignacion);
  app.put('/api/reportes/:id/notas', requiereAuth, asignacionesRoutes.actualizarNotas);
  app.get('/api/reportes/:id/notas-draft', requiereAuth, asignacionesRoutes.obtenerNotasDraft);
  app.post('/api/reportes/:id/notas-draft', requiereAuth, asignacionesRoutes.guardarNotasDraft);
  
  // Rutas de reasignación interdepartamental y audit trail
  // DEPRECATED (ADR-0010): /reasignar será removido el 2026-04-04. Usar /asignaciones en su lugar.
  app.post('/api/reportes/:id/reasignar', 
    requiereAuth, 
    requiereRol(['admin']),
    (req, res, next) => {
      // Deprecation headers (RFC 8594)
      res.set('Deprecation', 'true');
      res.set('Sunset', 'Sat, 04 Apr 2026 00:00:00 GMT');
      res.set('Link', '<https://github.com/jantetelco/docs/adr/ADR-0010>; rel="deprecation"');
      next();
    },
    asignacionesRoutes.reasignarReporte
  );
  app.get('/api/reportes/:id/historial', requiereAuth, asignacionesRoutes.obtenerHistorial);

  app.get('/tiles/:z/:x/:y.png', async (req, res) => {
    const { z, x, y } = req.params;
  const hostIndex = Math.abs((Number(x) + Number(y)) % TILE_BASES.length);
  const base = TILE_BASES[hostIndex];
  const tileUrl = `${base}/${z}/${x}/${y}.png`;

    res.setHeader('Content-Type', 'image/png');
    try {
      const response = await fetch(tileUrl, {
        headers: {
          'User-Agent': 'Jantetelco-Heatmap/1.0 (+https://localhost)' // etiquette per OSM tile terms
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

  app.post('/api/reportes', (req, res) => {
    const { tipo, descripcion = '', descripcion_corta, lat, lng, peso = 1, fingerprint, ip_cliente } = req.body;
    if (!tipo || !validarCoordenadas(lat, lng)) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }
    
    // Asignar dependencia automáticamente según el tipo
    const dependencia = DEPENDENCIA_POR_TIPO[tipo] || 'administracion';
    
    // Si no se proporciona descripcion_corta, generarla automáticamente (primeros 100 chars)
    const descCorta = descripcion_corta || 
      (descripcion.length > 100 ? descripcion.substring(0, 100) + '...' : descripcion);
    
    const db = getDb();
    const stmt = `INSERT INTO reportes(tipo, descripcion, descripcion_corta, lat, lng, peso, dependencia, fingerprint, ip_cliente) VALUES (?,?,?,?,?,?,?,?,?)`;
    db.run(stmt, [tipo, descripcion, descCorta, lat, lng, Math.max(1, Number(peso) || 1), dependencia, fingerprint, ip_cliente], function (err) {
      db.close();
      if (err) return res.status(500).json({ error: 'DB error' });
      return res.json({ ok: true, id: this.lastID, dependencia });
    });
  });

  app.get('/api/reportes', (req, res) => {
  const { minLat, maxLat, minLng, maxLng, from, to, estado, dependencia } = req.query;
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
    // Filtro por estado
    if (estado) {
      if (estado === 'abiertos') {
        // Excluir reportes cerrados
        conds.push("estado != 'cerrado'");
      } else if (estado === 'cerrado') {
        conds.push("estado = 'cerrado'");
      } else {
        // Estado específico
        conds.push('estado = ?');
        params.push(estado);
      }
    }
    // Filtro por dependencia
    if (dependencia) {
      conds.push('dependencia = ?');
      params.push(dependencia);
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const sql = `SELECT id, tipo, descripcion, descripcion_corta, lat, lng, peso, dependencia, estado, creado_en FROM reportes ${where}`;
    db.all(sql, params, (err, rows) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'DB error' });
      }
      db.close();
      res.json(rows || []);
    });
  });

  // Rutas /tipos, /geojson y /grid ya están definidas arriba (líneas 107-184)
  // para evitar que Express capture "tipos" como un :id

  app.get('/api/reportes/grid-deprecated', (req, res) => {
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
      if (err) {
        db.close();
        return res.status(500).json({ error: 'DB error' });
      }
      db.close();
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

  // ========================
  // RUTAS WHITELABEL (ANTES del middleware 404)
  // ========================
  app.get('/api/whitelabel/config', whitelabelRoutes.obtenerConfigWhitelabel);
  app.post('/api/super-usuario/whitelabel/config', whitelabelRoutes.actualizarConfigWhitelabel);
  app.get('/api/super-usuario/stats', whitelabelRoutes.obtenerStatsSupeUsuario);

  // Webhook routes (GitHub auto-deploy)
  app.use('/api', webhookRoutes);

  // Middleware para manejar rutas API no encontradas (debe ir ANTES del catch-all)
  app.use('/api', (req, res, next) => {
    // Si llegamos aquí, significa que la ruta API no fue manejada por ningún router
    res.status(404).json({ error: `API endpoint not found: ${req.originalUrl}` });
  });

  const distPath = path.resolve(__dirname, '../client/dist');
  const fallbackPath = path.resolve(__dirname, '../client/index.html');
  const clientPath = path.resolve(__dirname, '../client');
  
  // Custom MIME type handler for JSX and other assets
  const getMimeType = (filePath) => {
    if (filePath.endsWith('.jsx') || filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
      return 'application/javascript; charset=utf-8';
    } else if (filePath.endsWith('.css')) {
      return 'text/css; charset=utf-8';
    } else if (filePath.endsWith('.json')) {
      return 'application/json; charset=utf-8';
    } else if (filePath.endsWith('.wasm')) {
      return 'application/wasm';
    } else if (filePath.endsWith('.svg')) {
      return 'image/svg+xml';
    } else if (filePath.endsWith('.png')) {
      return 'image/png';
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      return 'image/jpeg';
    } else if (filePath.endsWith('.gif')) {
      return 'image/gif';
    } else if (filePath.endsWith('.ico')) {
      return 'image/x-icon';
    } else if (filePath.endsWith('.html')) {
      return 'text/html; charset=utf-8';
    }
    return 'application/octet-stream';
  };

  // Static file server with correct MIME types
  const staticPath = fs.existsSync(distPath) ? distPath : clientPath;
  
  // Assets middleware: Set special headers
  app.use('/assets', (req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  });

  // Static file server middleware - serve real files with correct MIME types
  app.use((req, res, next) => {
    // Don't interfere with API routes
    if (req.path.startsWith('/api') || req.path.startsWith('/tiles')) {
      return next();
    }
    
    // Skip if path has no extension (likely a route, not a file)
    const hasExtension = /\.\w+$/.test(req.path);
    if (!hasExtension && req.path !== '/') {
      return next();
    }
    
    const filePath = path.join(staticPath, req.path === '/' ? 'index.html' : req.path);
    
    // Security: prevent directory traversal
    const relative = path.relative(staticPath, filePath);
    if (relative.startsWith('..')) {
      return next();
    }
    
    // Check if file exists and is a file (not directory)
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        res.setHeader('Content-Type', getMimeType(filePath));
        
        // HTML files (especially index.html) should never be cached
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        } else {
          // Assets with hash in filename can be cached long-term
          res.setHeader('Cache-Control', 'public, max-age=3600');
        }
        return res.sendFile(filePath);
      }
    }
    
    // File doesn't exist
    if (hasExtension) {
      // If it has an extension and doesn't exist, return 404
      return res.status(404).json({ error: 'File not found: ' + req.path });
    }
    
    // Otherwise pass to next handler
    next();
  });

  // Favicon handler - check dist first, then fallback
  app.get('/favicon.ico', (req, res) => {
    const faviconPath = path.join(distPath, 'favicon.ico');
    if (fs.existsSync(faviconPath)) {
      res.setHeader('Content-Type', 'image/x-icon');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.sendFile(faviconPath);
    }
    
    // Fallback: serve embedded favicon
    res.setHeader('Content-Type', 'image/x-icon');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    const icoBuffer = Buffer.from([
      0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x10, 0x10, 0x00, 0x00, 0x01, 0x00, 0x18, 0x00,
      0x30, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x10, 0x00,
      0x00, 0x00, 0x20, 0x00, 0x00, 0x00, 0x01, 0x00, 0x18, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);
    res.end(icoBuffer);
  });

  // Root path
  app.get('/', (req, res) => {
    const indexPath = path.join(staticPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(indexPath);
    } else {
      res.status(200).json({ message: 'Jantetelco API activo', status: 'ok' });
    }
  });
  
  // SPA catchall - serve index.html for unmatched client-side routes (no extension)
  app.get('*', (req, res) => {
    const indexPath = path.join(staticPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });
  // Error handler middleware (debe ser el último)
  app.use((err, req, res, next) => {
    console.error('❌ Error en request:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  });

  return app;
}

export default createApp;
