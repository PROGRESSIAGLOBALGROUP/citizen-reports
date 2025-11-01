// Script de diagnóstico completo: Verificar servidor
import { createApp } from './app.js';

console.log('🔍 Diagnóstico completo del servidor\n');

try {
  console.log('1️⃣ Creando aplicación Express...');
  const app = createApp();
  console.log('   ✅ App creada correctamente\n');
  
  console.log('2️⃣ Configurando puerto...');
  const PORT = process.env.PORT || 4000;
  console.log(`   ✅ Puerto: ${PORT}\n`);
  
  console.log('3️⃣ Intentando iniciar servidor...');
  const server = app.listen(PORT, () => {
    console.log(`   ✅ Servidor escuchando en http://localhost:${PORT}`);
    console.log('\n✅ TODO FUNCIONA CORRECTAMENTE');
    console.log('   Presiona Ctrl+C para detener el servidor\n');
  });
  
  server.on('error', (error) => {
    console.error('\n❌ ERROR del servidor:', error.message);
    if (error.code === 'EADDRINUSE') {
      console.error(`   El puerto ${PORT} ya está en uso`);
      console.error('   Solución: Detén el proceso que usa ese puerto');
    }
    process.exit(1);
  });
  
} catch (error) {
  console.error('\n❌ ERROR CRÍTICO detectado:');
  console.error('   Mensaje:', error.message);
  console.error('   Archivo:', error.fileName || 'desconocido');
  console.error('   Línea:', error.lineNumber || 'desconocida');
  console.error('\n   Stack completo:');
  console.error(error.stack);
  process.exit(1);
}
