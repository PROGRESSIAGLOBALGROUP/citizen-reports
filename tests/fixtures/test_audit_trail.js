/**
 * Test Script: ADR-0010 Audit Trail Verification
 * 
 * Tests that assignment operations register correctly in historial_cambios
 */

const BASE_URL = 'http://localhost:4000';

async function login() {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@jantetelco.gob.mx',
      password: 'admin123'
    })
  });
  
  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.token;
}

async function createTestReport(token) {
  const response = await fetch(`${BASE_URL}/api/reportes`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      tipo: 'bache',
      descripcion: 'Test report for audit trail verification',
      lat: 18.6853,
      lng: -98.9356,
      peso: 1
    })
  });
  
  if (!response.ok) {
    throw new Error(`Create report failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.id;
}

async function assignReport(token, reportId, userId, razon) {
  console.log(`\n📝 Testing assignment (ADR-0010)...`);
  console.log(`   Reporte ID: ${reportId}, Usuario ID: ${userId}`);
  console.log(`   Razón: "${razon}"`);
  
  const response = await fetch(`${BASE_URL}/api/reportes/${reportId}/asignaciones`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      usuario_id: userId,
      notas: razon
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Assignment failed: ${response.statusText} - ${error}`);
  }
  
  const data = await response.json();
  console.log(`✅ Assignment created:`, data);
  return data;
}

async function getAuditTrail(token, reportId) {
  console.log(`\n🔍 Fetching audit trail for report ${reportId}...`);
  
  const response = await fetch(`${BASE_URL}/api/reportes/${reportId}/historial`, {
    headers: { 
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Get audit trail failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
}

async function deleteAssignment(token, reportId, userId) {
  console.log(`\n🗑️ Testing desasignación (ADR-0010)...`);
  console.log(`   Reporte ID: ${reportId}, Usuario ID: ${userId}`);
  
  const response = await fetch(`${BASE_URL}/api/reportes/${reportId}/asignaciones/${userId}`, {
    method: 'DELETE',
    headers: { 
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Delete assignment failed: ${response.statusText} - ${error}`);
  }
  
  const data = await response.json();
  console.log(`✅ Desasignación completed:`, data);
  return data;
}

async function main() {
  try {
    console.log('🚀 ADR-0010 Audit Trail Test\n');
    console.log('=' .repeat(60));
    
    // Step 1: Login
    console.log('\n1️⃣ Logging in as admin...');
    const token = await login();
    console.log('✅ Logged in successfully');
    
    // Step 2: Create test report
    console.log('\n2️⃣ Creating test report...');
    const reportId = await createTestReport(token);
    console.log(`✅ Test report created: ID ${reportId}`);
    
    // Step 3: Assign to funcionario (should create audit trail)
    console.log('\n3️⃣ Assigning report to funcionario...');
    await assignReport(token, reportId, 3, 'Test de audit trail - ADR-0010');
    
    // Wait a bit for database to commit
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Step 4: Get audit trail
    console.log('\n4️⃣ Fetching audit trail...');
    const auditTrail = await getAuditTrail(token, reportId);
    console.log(`✅ Audit trail has ${auditTrail.length} entries`);
    
    // Verify assignment was logged
    const asignacionEntry = auditTrail.find(entry => entry.tipo_cambio === 'asignacion');
    if (asignacionEntry) {
      console.log('\n✅ ¡ÉXITO! Asignación registrada en audit trail:');
      console.log(`   - Tipo: ${asignacionEntry.tipo_cambio}`);
      console.log(`   - Campo: ${asignacionEntry.campo_modificado}`);
      console.log(`   - Valor anterior: ${asignacionEntry.valor_anterior}`);
      console.log(`   - Valor nuevo: ${asignacionEntry.valor_nuevo}`);
      console.log(`   - Razón: ${asignacionEntry.razon}`);
      console.log(`   - Usuario: ${asignacionEntry.usuario_nombre}`);
      console.log(`   - Fecha: ${asignacionEntry.creado_en}`);
      
      if (asignacionEntry.metadatos) {
        const meta = JSON.parse(asignacionEntry.metadatos);
        console.log(`   - Metadata:`);
        console.log(`     * IP: ${meta.ip}`);
        console.log(`     * User-Agent: ${meta.user_agent}`);
        console.log(`     * Dependencia: ${meta.dependencia}`);
      }
    } else {
      console.error('\n❌ ERROR: No se encontró entrada de asignación en audit trail');
    }
    
    // Step 5: Test desasignación
    console.log('\n5️⃣ Testing desasignación...');
    await deleteAssignment(token, reportId, 3);
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Step 6: Get audit trail again
    console.log('\n6️⃣ Fetching audit trail after desasignación...');
    const auditTrail2 = await getAuditTrail(token, reportId);
    console.log(`✅ Audit trail now has ${auditTrail2.length} entries`);
    
    // Verify desasignación was logged
    const desasignacionEntry = auditTrail2.find(entry => entry.tipo_cambio === 'desasignacion');
    if (desasignacionEntry) {
      console.log('\n✅ ¡ÉXITO! Desasignación registrada en audit trail:');
      console.log(`   - Tipo: ${desasignacionEntry.tipo_cambio}`);
      console.log(`   - Campo: ${desasignacionEntry.campo_modificado}`);
      console.log(`   - Valor anterior: ${desasignacionEntry.valor_anterior}`);
      console.log(`   - Valor nuevo: ${desasignacionEntry.valor_nuevo}`);
      console.log(`   - Razón: ${desasignacionEntry.razon}`);
      console.log(`   - Usuario: ${desasignacionEntry.usuario_nombre}`);
      console.log(`   - Fecha: ${desasignacionEntry.creado_en}`);
    } else {
      console.error('\n❌ ERROR: No se encontró entrada de desasignación en audit trail');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ADR-0010 TEST COMPLETADO');
    console.log('\nVerificación:');
    console.log(`  ✓ Asignación registrada: ${!!asignacionEntry}`);
    console.log(`  ✓ Desasignación registrada: ${!!desasignacionEntry}`);
    console.log(`  ✓ Metadata incluida: ${!!asignacionEntry?.metadatos}`);
    console.log(`  ✓ Total entries: ${auditTrail2.length}`);
    
  } catch (error) {
    console.error('\n❌ Error durante test:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
