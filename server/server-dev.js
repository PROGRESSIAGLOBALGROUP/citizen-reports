import { initDb } from './db.js';
import { createApp } from './app.js';

const PORT = process.env.PORT || 4000;

console.log('🔧 Inicializando base de datos...');
initDb()
  .then(() => {
    console.log('✅ Base de datos lista');
    console.log('📝 Creando aplicación...');
    const app = createApp();
    console.log('✅ Aplicación creada');
    
    console.log(`🔧 Iniciando servidor en puerto ${PORT}...`);
    const server = app.listen(PORT, '0.0.0.0', () => {
      const env = process.env.NODE_ENV || 'production';
      console.log(`✅ Servidor ${env} en http://0.0.0.0:${PORT}`);
    });
    
    server.on('error', (error) => {
      console.error('❌ Error del servidor:', error.message);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('❌ Error inicializando DB:', err.message);
    process.exit(1);
  });
