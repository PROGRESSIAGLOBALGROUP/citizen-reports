#!/usr/bin/env node
/**
 * Test server starter that explicitly binds to IPv4 loopback
 * This script bypasses Windows dual-stack IPv6 issues with Playwright
 */

import 'dotenv/config';
import { initDb, resetDb } from '../server/db.js';
import { createApp } from '../server/app.js';
import dns from 'dns';

// CRITICAL: Force IPv4 resolution globally
dns.setDefaultResultOrder('ipv4first');

const PORT = process.env.PORT || 4000;

// Wrap in async IIFE to handle async DB init
(async () => {
  try {
    // Handle DB initialization for E2E tests
    if (process.env.DB_PATH) {
      console.log(`📁 DB_PATH establecido: ${process.env.DB_PATH}`);
      resetDb();
      await initDb();
      console.log('✅ Database inicializada');
    }

    // Create the app
    console.log('📝 Creando aplicación...');
    const app = createApp();
    console.log('✅ Aplicación creada');

    // Create HTTP server and bind to IPv4 loopback ONLY
    console.log(`🔧 Intentando escuchar en puerto ${PORT} (IPv4 loopback only)...`);

    const httpServer = app.listen(PORT, '127.0.0.1', () => {
      const env = process.env.NODE_ENV || 'test';
      console.log(`✅ Servidor ${env} en http://127.0.0.1:${PORT}`);
      console.log('📡 Server está escuchando activamente en puerto', PORT);
      console.log('🔒 IPv4 loopback only - IPv6 disabled for E2E testing');
      
      // Verify the server is actually listening
      const addr = httpServer.address();
      if (addr) {
        console.log(`📋 Address family: ${addr.family}, Address: ${addr.address}, Port: ${addr.port}`);
      }
    });

    httpServer.on('error', (error) => {
      console.error('❌ Error del servidor:', error.message, error.code);
      if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ ERROR: Puerto ${PORT} ya está en uso`);
        console.error('   Soluciones:');
        console.error('   1. Kill existing process on port 4000');
        console.error('   2. Use: Get-NetTCPConnection -LocalPort 4000\n');
      }
      process.exit(1);
    });

    httpServer.on('listening', () => {
      console.log('✅ evento "listening" disparado');
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n⚠️  Recibido SIGINT, cerrando servidor...');
      httpServer.close(() => {
        console.log('✅ Servidor cerrado');
        process.exit(0);
      });
    });

    process.on('SIGTERM', () => {
      console.log('\n⚠️  Recibido SIGTERM, cerrando servidor...');
      httpServer.close(() => {
        console.log('✅ Servidor cerrado');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Error fatal al iniciar servidor:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('❌ Excepción no capturada:', error.message);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Rechazo no manejado:', reason);
  if (reason instanceof Error) {
    console.error(reason.stack);
  }
});
