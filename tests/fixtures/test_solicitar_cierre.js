/**
 * Test: Solicitar Cierre de Reporte
 * Prueba el endpoint corregido POST /api/reportes/:id/solicitar-cierre
 */

const BASE_URL = 'http://localhost:4000';

async function login(email, password) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.token;
}

async function getMisReportes(token) {
  const response = await fetch(`${BASE_URL}/api/reportes/mis-reportes`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    throw new Error(`Get mis reportes failed: ${response.statusText}`);
  }
  
  return await response.json();
}

async function solicitarCierre(token, reporteId) {
  console.log(`\n📝 Solicitando cierre para reporte ${reporteId}...`);
  
  const response = await fetch(`${BASE_URL}/api/reportes/${reporteId}/solicitar-cierre`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      notas_cierre: 'Prueba de cierre - Fix aplicado',
      firma_digital: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      evidencia_fotos: ['foto1.jpg', 'foto2.jpg']
    })
  });
  
  console.log(`   Status: ${response.status} ${response.statusText}`);
  console.log(`   Content-Type: ${response.headers.get('content-type')}`);
  
  const contentType = response.headers.get('content-type');
  
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    console.log(`   Response:`, data);
    return { ok: response.ok, data };
  } else {
    const text = await response.text();
    console.log(`   ❌ ERROR: Respuesta NO es JSON`);
    console.log(`   Texto recibido (primeros 200 chars):`, text.substring(0, 200));
    return { ok: false, error: 'Respuesta no es JSON', text };
  }
}

async function main() {
  try {
    console.log('🧪 Test: Solicitar Cierre de Reporte (Fix aplicado)\n');
    console.log('='.repeat(70));
    
    // Login como funcionario
    console.log('\n1️⃣ Login como funcionario...');
    const token = await login('func.obras1@jantetelco.gob.mx', 'admin123');
    console.log('✅ Login exitoso');
    
    // Obtener reportes asignados
    console.log('\n2️⃣ Obteniendo reportes asignados...');
    const reportes = await getMisReportes(token);
    console.log(`✅ Se encontraron ${reportes.length} reportes asignados`);
    
    if (reportes.length === 0) {
      console.log('\n⚠️  No hay reportes asignados para probar cierre');
      console.log('   Asigna manualmente un reporte al funcionario func.obras1@jantetelco.gob.mx');
      return;
    }
    
    // Buscar un reporte que no esté cerrado ni pendiente
    const reporteParaCerrar = reportes.find(r => 
      r.estado !== 'cerrado' && r.estado !== 'pendiente_cierre'
    );
    
    if (!reporteParaCerrar) {
      console.log('\n⚠️  Todos los reportes ya están cerrados o pendientes');
      console.log('   Crea o asigna un nuevo reporte para probar');
      return;
    }
    
    console.log(`\n3️⃣ Probando cierre de reporte #${reporteParaCerrar.id}`);
    console.log(`   Estado actual: ${reporteParaCerrar.estado}`);
    console.log(`   Tipo: ${reporteParaCerrar.tipo}`);
    
    // Intentar solicitar cierre
    const result = await solicitarCierre(token, reporteParaCerrar.id);
    
    console.log('\n' + '='.repeat(70));
    
    if (result.ok) {
      console.log('✅ ¡ÉXITO! Solicitud de cierre procesada correctamente');
      console.log(`   Cierre ID: ${result.data.cierre_id}`);
      console.log(`   Supervisor ID: ${result.data.supervisor_id}`);
      console.log(`   Mensaje: ${result.data.mensaje}`);
    } else {
      console.log('❌ ERROR: La solicitud falló');
      if (result.data) {
        console.log(`   Error: ${result.data.error}`);
      } else {
        console.log(`   Razón: ${result.error}`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error durante test:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
