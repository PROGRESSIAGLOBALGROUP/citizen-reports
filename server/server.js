import 'dotenv/config';
import { initDb, resetDb } from './db.js';
import { createApp } from './app.js';

const PORT = process.env.PORT || 4000;

// CRITICAL: Si DB_PATH cambió (E2E mode), resetear singleton ANTES de crear app
if (process.env.DB_PATH) {
  console.log(`📁 DB_PATH establecido: ${process.env.DB_PATH}`);
  resetDb();
  initDb().catch(err => {
    console.error('❌ Error inicializando DB:', err.message);
    process.exit(1);
  });
}

// Capturar excepciones globales
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
  // No salir - solo loguear
  // process.exit(1);
});

try {
  console.log('📝 Creando aplicación...');
  const app = createApp();
  console.log('✅ Aplicación creada');

  console.log(`🔧 Intentando escuchar en puerto ${PORT}...`);
  const server = app.listen(PORT, '0.0.0.0', () => {
    const env = process.env.NODE_ENV || 'production';
    console.log(`✅ Servidor ${env} en http://0.0.0.0:${PORT}`);
    console.log('📡 Server está escuchando activamente en puerto', PORT);
  });

  server.on('error', (error) => {
    console.error('❌ Error del servidor:', error.message, error.code);
    if (error.code === 'EADDRINUSE') {
      console.error(`\n❌ ERROR: Puerto ${PORT} ya está en uso`);
      console.error('   Soluciones:');
      console.error('   1. Ejecuta: .\\cleanup-port.ps1');
      console.error('   2. O manualmente: Get-NetTCPConnection -LocalPort 4000\n');
    }
    process.exit(1);
  });

  server.on('listening', () => {
    console.log('✅ evento "listening" disparado');
  });

  server.on('close', () => {
    console.log('⚠️ evento "close" disparado');
  });

} catch (error) {
  console.error('❌ Error fatal al iniciar servidor:', error.message);
  console.error(error.stack);
  process.exit(1);
}
