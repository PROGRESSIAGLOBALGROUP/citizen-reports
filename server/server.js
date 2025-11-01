import 'dotenv/config';
import { initDb } from './db.js';
import { createApp } from './app.js';

const PORT = process.env.PORT || 4000;

try {
  console.log('📝 Creando aplicación...');
  const app = createApp();
  console.log('✅ Aplicación creada');

  if (process.argv.includes('--init')) {
    await initDb();
    console.log('DB inicializada');
    process.exit(0);
  }

  const server = app.listen(PORT, () => {
    const env = process.env.NODE_ENV || 'production';
    console.log(`✅ Servidor ${env} en http://localhost:${PORT}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`\n❌ ERROR: Puerto ${PORT} ya está en uso`);
      console.error('   Soluciones:');
      console.error('   1. Ejecuta: .\\cleanup-port.ps1');
      console.error('   2. O manualmente: Get-NetTCPConnection -LocalPort 4000\n');
      process.exit(1);
    }
    console.error('❌ Error del servidor:', error);
    process.exit(1);
  });
} catch (error) {
  console.error('❌ Error fatal al iniciar servidor:', error);
  process.exit(1);
}