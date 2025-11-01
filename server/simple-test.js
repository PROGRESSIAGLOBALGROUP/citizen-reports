#!/usr/bin/env node
// Servidor simple de prueba - sin dependencias complicadas

import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4000;
const app = express();

// Middleware
app.use(express.json());

// BD connection
const dbPath = path.join(__dirname, 'data.db');
console.log(`📊 Usando BD: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error conectando BD:', err);
    process.exit(1);
  }
  console.log('✅ BD conectada');
});

// Rutas de prueba
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// API de reportes (GET - listar)
app.get('/api/reportes', (req, res) => {
  db.all('SELECT * FROM reportes LIMIT 100', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// API de reportes (POST - crear nuevo)
app.post('/api/reportes', (req, res) => {
  const { tipo, descripcion, lat, lng, peso = 1 } = req.body;
  
  // Validación
  if (!tipo || !descripcion || lat === undefined || lng === undefined) {
    return res.status(400).json({ 
      error: 'Faltan campos: tipo, descripcion, lat, lng' 
    });
  }
  
  // Validar coordenadas (lat: -90 a 90, lng: -180 a 180)
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return res.status(400).json({ 
      error: 'Coordenadas inválidas' 
    });
  }
  
  // Buscar dependencia por tipo
  const dependenciaPorTipo = {
    'baches': 'obras_publicas',
    'pavimento_danado': 'obras_publicas',
    'banqueta_rota': 'obras_publicas',
    'coladera': 'obras_publicas',
    'alumbrado': 'servicios_publicos',
    'basura': 'servicios_publicos',
    'limpieza': 'servicios_publicos',
    'parques': 'parques_jardines',
    'agua': 'agua_potable',
    'fuga_agua': 'agua_potable',
    'drenaje': 'agua_potable',
    'seguridad': 'seguridad_publica',
    'accidente': 'seguridad_publica',
    'semaforo': 'seguridad_publica',
    'señalizacion': 'seguridad_publica',
    'plagas': 'salud',
    'animales': 'salud',
    'quema': 'medio_ambiente',
    'contaminacion': 'medio_ambiente',
    'tala': 'medio_ambiente',
    'otro': 'servicios_publicos'
  };
  
  const dependencia = dependenciaPorTipo[tipo] || 'servicios_publicos';
  
  // Insertar en BD
  db.run(
    `INSERT INTO reportes (tipo, descripcion, lat, lng, peso, dependencia, estado, creado_en)
     VALUES (?, ?, ?, ?, ?, ?, 'nuevo', datetime('now'))`,
    [tipo, descripcion, lat, lng, peso, dependencia],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Retornar el reporte creado
      res.status(201).json({
        id: this.lastID,
        tipo,
        descripcion,
        lat,
        lng,
        peso,
        dependencia,
        estado: 'nuevo',
        creado_en: new Date().toISOString()
      });
    }
  );
});

// API de tipos - retorna con nombre e icono
app.get('/api/tipos', (req, res) => {
  db.all(`
    SELECT 
      id, 
      tipo, 
      nombre,
      icono,
      descripcion,
      color,
      activo
    FROM tipos_reporte 
    WHERE activo = 1
  `, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Asegurarse que cada tipo tiene los campos necesarios
    const tiposConMetadata = (rows || []).map(t => ({
      id: t.id,
      tipo: t.tipo,
      nombre: t.nombre || t.tipo,  // fallback a tipo si no hay nombre
      icono: t.icono || '📍',       // fallback a pin si no hay icono
      descripcion: t.descripcion,
      color: t.color || '#6b7280',  // fallback a gris
      activo: t.activo
    }));
    
    res.json(tiposConMetadata);
  });
});

// API de categorías
app.get('/api/categorias', (req, res) => {
  db.all('SELECT id, nombre, descripcion FROM categorias WHERE activo = 1', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// API: Categorías CON tipos anidados (para ADR-0009 - dynamic types)
app.get('/api/categorias-con-tipos', (req, res) => {
  // 1. Obtener categorías
  db.all('SELECT id, nombre, descripcion, icono FROM categorias WHERE activo = 1 ORDER BY id', (err, categorias) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // 2. Para cada categoría, obtener sus tipos
    let categoriasConTipos = [];
    let pendientes = categorias.length;
    
    if (pendientes === 0) {
      return res.json([]);
    }
    
    categorias.forEach(cat => {
      db.all(
        'SELECT id, tipo, nombre, icono, color, dependencia, descripcion FROM tipos_reporte WHERE categoria_id = ? AND activo = 1 ORDER BY orden',
        [cat.id],
        (err, tipos) => {
          categoriasConTipos.push({
            id: cat.id,
            nombre: cat.nombre,
            descripcion: cat.descripcion,
            icono: cat.icono || '📦',
            color: '#6b7280',
            tipos: tipos || []
          });
          
          pendientes--;
          if (pendientes === 0) {
            // Todas las categorías están listas
            res.json(categoriasConTipos);
          }
        }
      );
    });
  });
});

// API: GeoJSON para exportar reportes
app.get('/api/reportes/geojson', (req, res) => {
  db.all('SELECT id, tipo, descripcion, lat, lng, peso, estado, creado_en FROM reportes', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const features = (rows || []).map(r => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [r.lng, r.lat] },
      properties: {
        id: r.id,
        tipo: r.tipo,
        descripcion: r.descripcion,
        peso: r.peso,
        estado: r.estado,
        creado_en: r.creado_en
      }
    }));
    
    res.json({
      type: 'FeatureCollection',
      features: features
    });
  });
});

// API: Grid agregado para heatmap (reduce datos para mapa)
app.get('/api/reportes/grid', (req, res) => {
  const cellSize = parseFloat(req.query.cellSize) || 0.01; // ~1km
  
  db.all(`
    SELECT 
      ROUND(lat / ?, ?) * ? as lat_cell,
      ROUND(lng / ?, ?) * ? as lng_cell,
      COUNT(*) as count,
      AVG(peso) as avg_peso
    FROM reportes
    GROUP BY lat_cell, lng_cell
  `, [cellSize, 4, cellSize, cellSize, 4, cellSize], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const cells = (rows || []).map(r => ({
      lat: r.lat_cell,
      lng: r.lng_cell,
      count: r.count,
      avg_peso: r.avg_peso
    }));
    
    res.json(cells);
  });
});

// ========== ADMIN ENDPOINTS ==========

// GET /api/admin/dependencias
app.get('/api/admin/dependencias', (req, res) => {
  db.all('SELECT id, nombre, descripcion FROM dependencias ORDER BY nombre', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// GET /api/admin/usuarios
app.get('/api/admin/usuarios', (req, res) => {
  db.all('SELECT id, nombre, email, dependencia, rol, activo FROM usuarios ORDER BY nombre', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// POST /api/admin/usuarios (crear)
app.post('/api/admin/usuarios', (req, res) => {
  const { nombre, email, dependencia, rol, activo = 1 } = req.body;
  
  if (!nombre || !email || !dependencia || !rol) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }
  
  db.run(
    'INSERT INTO usuarios (nombre, email, dependencia, rol, activo) VALUES (?, ?, ?, ?, ?)',
    [nombre, email, dependencia, rol, activo],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

// PUT /api/admin/usuarios/:id
app.put('/api/admin/usuarios/:id', (req, res) => {
  const { nombre, email, dependencia, rol, activo } = req.body;
  
  db.run(
    'UPDATE usuarios SET nombre=?, email=?, dependencia=?, rol=?, activo=? WHERE id=?',
    [nombre, email, dependencia, rol, activo, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

// DELETE /api/admin/usuarios/:id
app.delete('/api/admin/usuarios/:id', (req, res) => {
  db.run('DELETE FROM usuarios WHERE id=?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// GET /api/admin/categorias
app.get('/api/admin/categorias', (req, res) => {
  db.all('SELECT id, nombre, descripcion, icono, activo FROM categorias ORDER BY id', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// POST /api/admin/categorias
app.post('/api/admin/categorias', (req, res) => {
  const { nombre, descripcion, icono, activo = 1 } = req.body;
  
  if (!nombre) return res.status(400).json({ error: 'Falta nombre' });
  
  db.run(
    'INSERT INTO categorias (nombre, descripcion, icono, activo) VALUES (?, ?, ?, ?)',
    [nombre, descripcion, icono, activo],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

// PUT /api/admin/categorias/:id
app.put('/api/admin/categorias/:id', (req, res) => {
  const { nombre, descripcion, icono, activo } = req.body;
  
  db.run(
    'UPDATE categorias SET nombre=?, descripcion=?, icono=?, activo=? WHERE id=?',
    [nombre, descripcion, icono, activo, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

// DELETE /api/admin/categorias/:id
app.delete('/api/admin/categorias/:id', (req, res) => {
  db.run('DELETE FROM categorias WHERE id=?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// GET /api/admin/tipos
app.get('/api/admin/tipos', (req, res) => {
  db.all('SELECT id, tipo, nombre, icono, color, categoria_id, dependencia, descripcion FROM tipos_reporte ORDER BY categoria_id, orden', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// POST /api/admin/tipos
app.post('/api/admin/tipos', (req, res) => {
  const { tipo, nombre, icono, color, categoria_id, dependencia, descripcion } = req.body;
  
  if (!tipo || !nombre || !categoria_id) {
    return res.status(400).json({ error: 'Faltan campos: tipo, nombre, categoria_id' });
  }
  
  db.run(
    'INSERT INTO tipos_reporte (tipo, nombre, icono, color, categoria_id, dependencia, descripcion, activo) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
    [tipo, nombre, icono || '📍', color || '#6b7280', categoria_id, dependencia, descripcion],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

// PUT /api/admin/tipos/:id
app.put('/api/admin/tipos/:id', (req, res) => {
  const { tipo, nombre, icono, color, categoria_id, dependencia, descripcion } = req.body;
  
  db.run(
    'UPDATE tipos_reporte SET tipo=?, nombre=?, icono=?, color=?, categoria_id=?, dependencia=?, descripcion=? WHERE id=?',
    [tipo, nombre, icono, color, categoria_id, dependencia, descripcion, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

// DELETE /api/admin/tipos/:id
app.delete('/api/admin/tipos/:id', (req, res) => {
  db.run('DELETE FROM tipos_reporte WHERE id=?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// Auth login (temporal)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'admin@jantetelco.gob.mx' && password === 'admin123') {
    res.json({
      token: 'token-demo-' + Date.now(),
      usuario: {
        id: 1,
        email: 'admin@jantetelco.gob.mx',
        nombre: 'Admin',
        rol: 'admin',
        dependencia: 'administracion'
      }
    });
  } else {
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

// Auth me - verificar sesión actual
app.get('/api/auth/me', (req, res) => {
  // En demo, retornar usuario hardcoded
  res.json({
    id: 1,
    email: 'admin@jantetelco.gob.mx',
    nombre: 'Admin',
    rol: 'admin',
    dependencia: 'administracion'
  });
});

// Auth me (verificar sesión actual)
app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token && token.startsWith('token-demo-')) {
    res.json({
      usuario: {
        id: 1,
        email: 'admin@jantetelco.gob.mx',
        nombre: 'Admin',
        rol: 'admin',
        dependencia: 'administracion'
      }
    });
  } else {
    res.status(401).json({ error: 'No autenticado' });
  }
});

// Aliases para compatibilidad con frontend (sin prefijo /admin)
app.get('/api/usuarios', (req, res) => {
  db.all('SELECT id, nombre, email, dependencia, rol, activo FROM usuarios ORDER BY nombre', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.get('/api/dependencias', (req, res) => {
  db.all('SELECT id, nombre, descripcion FROM dependencias ORDER BY nombre', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.get('/api/roles', (req, res) => {
  const roles = [
    { id: 1, nombre: 'admin', descripcion: 'Administrador del sistema' },
    { id: 2, nombre: 'supervisor', descripcion: 'Supervisor de departamento' },
    { id: 3, nombre: 'funcionario', descripcion: 'Funcionario reportero' }
  ];
  res.json(roles);
});

// Auth logout
app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logout exitoso' });
});

// GET /api/usuarios (alias para compatibility)
app.get('/api/usuarios', (req, res) => {
  db.all('SELECT id, nombre, email, dependencia, rol, activo FROM usuarios ORDER BY nombre', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// GET /api/dependencias (alias para compatibility)
app.get('/api/dependencias', (req, res) => {
  db.all('SELECT id, nombre, descripcion FROM dependencias ORDER BY nombre', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// GET /api/roles - lista de roles disponibles
app.get('/api/roles', (req, res) => {
  res.json([
    { id: 'admin', nombre: 'Administrador', descripcion: 'Acceso completo al sistema' },
    { id: 'supervisor', nombre: 'Supervisor', descripcion: 'Supervisa departamento' },
    { id: 'funcionario', nombre: 'Funcionario', descripcion: 'Usuario operativo' },
    { id: 'ciudadano', nombre: 'Ciudadano', descripcion: 'Usuario público' }
  ]);
});

// Servir frontend estático
const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));

// Fallback a index.html para rutas del cliente (evitar * en express.get)
app.get(/^\/(?!api\/)/, (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, { maxAge: 0 });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor de prueba corriendo en http://localhost:${PORT}\n`);
  console.log('✅ Rutas disponibles:');
  console.log('   GET  /health');
  console.log('   GET  /api/reportes');
  console.log('   POST /api/reportes (crear)');
  console.log('   GET  /api/tipos');
  console.log('   GET  /api/categorias');
  console.log('   GET  /api/categorias-con-tipos');
  console.log('   GET  /api/reportes/geojson');
  console.log('   GET  /api/reportes/grid');
  console.log('   GET  /api/admin/dependencias');
  console.log('   GET  /api/admin/usuarios');
  console.log('   POST /api/admin/usuarios');
  console.log('   PUT  /api/admin/usuarios/:id');
  console.log('   DELETE /api/admin/usuarios/:id');
  console.log('   GET  /api/admin/categorias');
  console.log('   POST /api/admin/categorias');
  console.log('   PUT  /api/admin/categorias/:id');
  console.log('   DELETE /api/admin/categorias/:id');
  console.log('   GET  /api/admin/tipos');
  console.log('   POST /api/admin/tipos');
  console.log('   PUT  /api/admin/tipos/:id');
  console.log('   DELETE /api/admin/tipos/:id');
  console.log('   GET  /api/usuarios (compatibility alias)');
  console.log('   GET  /api/dependencias (compatibility alias)');
  console.log('   GET  /api/roles');
  console.log('   POST /api/auth/login');
  console.log('   GET  /api/auth/me');
  console.log('   POST /api/auth/logout');
  console.log('');
});