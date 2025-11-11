#!/usr/bin/env node
/**
 * Production server wrapper that:
 * 1. Serves the Express API on /api
 * 2. Serves the React SPA from client/dist
 * 3. Handles SPA routing (all non-API requests go to index.html)
 */

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './db.js';
import { createApp } from './app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;
const DIST_PATH = path.join(__dirname, '../client/dist');

try {
  console.log('📝 Iniciando servidor de producción...');
  
  // Crear app Express básica
  const expressApp = express();

  // Middleware para parsear JSON
  expressApp.use(express.json({ limit: '5mb' }));
  expressApp.use(express.urlencoded({ limit: '5mb', extended: true }));

  // Servir archivos estáticos SPA
  expressApp.use(express.static(DIST_PATH));

  // Crear app de citizen-reports (rutas /api, /reportes, etc)
  const citizenReportsApp = createApp();

  // Montar rutas del API
  expressApp.use('/', citizenReportsApp);

  // Fallback para SPA: cualquier ruta que no sea API va a index.html
  expressApp.get('*', (req, res) => {
    // Si no es una ruta de API, servir index.html para SPA routing
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(DIST_PATH, 'index.html'));
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });

  const server = expressApp.listen(PORT, '0.0.0.0', () => {
    console.log('✅ Servidor de producción iniciado');
    console.log(`📍 API + SPA en http://0.0.0.0:${PORT}`);
    console.log(`📁 Sirviendo SPA desde: ${DIST_PATH}`);
    console.log(`🌐 Accede desde: https://reportes.progressiagroup.com`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`\n❌ ERROR: Puerto ${PORT} ya está en uso`);
      process.exit(1);
    }
    console.error('❌ Error del servidor:', error);
    process.exit(1);
  });

} catch (error) {
  console.error('❌ Error fatal:', error);
  process.exit(1);
}
