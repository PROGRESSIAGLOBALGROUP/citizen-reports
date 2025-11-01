// Script de diagnóstico: Verificar que app.js funciona
import { createApp } from './app.js';

console.log('🔍 Iniciando diagnóstico...');

try {
  console.log('✅ Importación de app.js exitosa');
  
  const app = createApp();
  console.log('✅ createApp() ejecutado sin errores');
  console.log('✅ Tipo de app:', typeof app);
  console.log('✅ App tiene listen:', typeof app.listen);
  
  console.log('\n✅ Diagnóstico completado sin errores');
  process.exit(0);
} catch (error) {
  console.error('❌ ERROR detectado:');
  console.error('   Mensaje:', error.message);
  console.error('   Stack:', error.stack);
  process.exit(1);
}
