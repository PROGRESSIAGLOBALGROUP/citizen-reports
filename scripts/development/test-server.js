import { createApp } from './server/app.js';

try {
  console.log('📝 Creando aplicación...');
  const app = createApp();
  console.log('✅ Aplicación creada exitosamente');
  
  const server = app.listen(4000, () => {
    console.log('✅ Servidor escuchando en puerto 4000');
  });
  
  server.on('error', (error) => {
    console.error('❌ Error del servidor:', error);
    process.exit(1);
  });
  
} catch (error) {
  console.error('❌ Error al crear la aplicación:', error);
  process.exit(1);
}
