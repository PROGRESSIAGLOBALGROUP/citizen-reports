// Demo: Crear reportes de prueba con datos de identificación
// Ejecutar: node scripts/demo_identificacion.js

import fetch from 'node-fetch'; // Para hacer requests HTTP si está disponible

const API_BASE = 'http://localhost:4000';

console.log('🎯 Demo: Sistema de Identificación y Prevención de Duplicados');
console.log('============================================================\n');

// Simular datos de un dispositivo/navegador
const dispositivoA = {
  fingerprint: 'demo123abc789xyz456',
  sesionId: 'sess_demo_device_A',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (Demo Device A)'
};

const dispositivoB = {
  fingerprint: 'demo456def012uvw789',
  sesionId: 'sess_demo_device_B', 
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (Demo Device B)'
};

async function crearReporteDemo(dispositivo, reporte, etiqueta) {
  try {
    console.log(`📱 ${etiqueta}:`);
    console.log(`   📍 ${reporte.tipo} en (${reporte.lat}, ${reporte.lng})`);
    console.log(`   🔍 Fingerprint: ${dispositivo.fingerprint.substring(0, 8)}...`);
    
    const response = await fetch(`${API_BASE}/api/reportes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...reporte,
        ...dispositivo
      })
    });

    const resultado = await response.json();
    
    if (response.ok) {
      console.log(`   ✅ Reporte creado: ID ${resultado.id}`);
      
      if (resultado.advertencias && resultado.advertencias.length > 0) {
        console.log(`   ⚠️  Advertencias: ${resultado.advertencias.join(', ')}`);
      }
      
      if (!resultado.esNuevo) {
        console.log(`   🚫 Marcado como posible duplicado`);
      }
      
      if (resultado.mensaje) {
        console.log(`   💬 ${resultado.mensaje}`);
      }
      
    } else {
      console.log(`   ❌ Error: ${resultado.error}`);
    }
    
    console.log('');
    return resultado;
  } catch (error) {
    console.log(`   ❌ Error de conexión: ${error.message}\n`);
    return null;
  }
}

async function ejecutarDemo() {
  console.log('🧪 Escenario 1: Reporte inicial desde Dispositivo A');
  await crearReporteDemo(dispositivoA, {
    tipo: 'baches',
    descripcion: 'Bache grande en calle principal que afecta el tránsito',
    descripcionCorta: 'Bache en calle principal',
    lat: 18.7160,
    lng: -98.7760,
    peso: 4
  }, 'Dispositivo A - Primer reporte');

  console.log('⏱️  Esperando 2 segundos...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('🧪 Escenario 2: Mismo dispositivo reporta algo similar (debería detectar duplicado)');
  await crearReporteDemo(dispositivoA, {
    tipo: 'baches',
    descripcion: 'Otro bache en la misma zona que dificulta el paso',
    descripcionCorta: 'Bache similar cerca',
    lat: 18.7161, // Muy cerca del anterior
    lng: -98.7761,
    peso: 3
  }, 'Dispositivo A - Reporte similar');

  console.log('🧪 Escenario 3: Dispositivo diferente reporta en otra ubicación (debería ser nuevo)');
  await crearReporteDemo(dispositivoB, {
    tipo: 'alumbrado',
    descripcion: 'Lámpara del alumbrado público no funciona en la noche',
    descripcionCorta: 'Lámpara fundida',
    lat: 18.7155,
    lng: -98.7765,
    peso: 2
  }, 'Dispositivo B - Reporte diferente');

  console.log('⏱️  Esperando 2 segundos...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('🧪 Escenario 4: Dispositivo B reporta inmediatamente otra cosa (debería advertir de IP repetida)');
  await crearReporteDemo(dispositivoB, {
    tipo: 'limpieza',
    descripcion: 'Acumulación de basura en la esquina que genera mal olor',
    descripcionCorta: 'Basura acumulada',
    lat: 18.7150,
    lng: -98.7775,
    peso: 3
  }, 'Dispositivo B - Reporte rápido consecutivo');

  console.log('✅ Demo completada');
  console.log('\n💡 Características del sistema implementado:');
  console.log('   🔹 Captura automática de IP del cliente');
  console.log('   🔹 Fingerprint único del navegador/dispositivo');
  console.log('   🔹 ID de sesión persistente durante la visita');
  console.log('   🔹 Detección de reportes duplicados por ubicación y dispositivo');
  console.log('   🔹 Advertencias sin bloquear reportes legítimos');
  console.log('   🔹 Logging de actividad para monitoreo');
  console.log('\n🎯 Caso de uso: Prevenir spam y reportes duplicados sin pedir datos personales');
}

// Verificar si el servidor está disponible
console.log('🔍 Verificando conexión con el servidor...');
try {
  const testResponse = await fetch(`${API_BASE}/api/reportes/tipos`);
  if (testResponse.ok) {
    console.log('✅ Servidor disponible, iniciando demo\n');
    await ejecutarDemo();
  } else {
    console.log('❌ Servidor no responde correctamente');
    console.log('💡 Asegúrate de que el servidor esté corriendo en puerto 4000');
  }
} catch (error) {
  console.log('❌ No se puede conectar al servidor');
  console.log('💡 Ejecuta: cd server && npm run dev');
  console.log(`   Error: ${error.message}`);
}