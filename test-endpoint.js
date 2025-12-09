// Script para probar el endpoint de usuarios de dependencia

async function test() {
  try {
    // 1. Login
    const loginRes = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@jantetelco.gob.mx', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    console.log('✅ Login OK, token:', loginData.token.substring(0, 20) + '...');
    
    // 2. Consultar usuarios de dependencia 6 (Parques y Jardines)
    const usuariosRes = await fetch('http://localhost:4000/api/admin/dependencias/6/usuarios', {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    
    console.log('📡 Response status:', usuariosRes.status);
    
    const data = await usuariosRes.json();
    
    console.log('');
    console.log('=== RESPUESTA COMPLETA ===');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
    console.log('=== ANÁLISIS ===');
    console.log('typeof data:', typeof data);
    console.log('data.count:', data.count);
    console.log('typeof data.count:', typeof data.count);
    console.log('data.usuarios:', data.usuarios);
    console.log('data.usuarios?.length:', data.usuarios?.length);
    console.log('');
    console.log('=== VERIFICACIÓN ===');
    console.log('data.count > 0:', data.count > 0);
    console.log('cantidadUsuarios (con fallback):', data.count ?? data.usuarios?.length ?? 0);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

test();
