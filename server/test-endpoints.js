// Test de endpoints problemáticos
import fetch from 'node-fetch';

async function testLogin() {
  console.log('\n🔐 Probando LOGIN...\n');
  
  try {
    const response = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'func.seguridad1@jantetelco.gob.mx',
        password: 'admin123'
      })
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Raw response:', text);
    
    if (text) {
      try {
        const data = JSON.parse(text);
        console.log('Parsed JSON:', data);
      } catch (e) {
        console.error('❌ Error parseando JSON:', e.message);
      }
    }
  } catch (error) {
    console.error('❌ Error en request:', error.message);
  }
}

async function testReportes() {
  console.log('\n📊 Probando GET /api/reportes...\n');
  
  try {
    const response = await fetch('http://localhost:4000/api/reportes');
    
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Total reportes:', data.length);
    console.log('Reportes:', data.map(r => ({
      id: r.id,
      tipo: r.tipo,
      dependencia: r.dependencia
    })));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function run() {
  await testLogin();
  await testReportes();
}

run();
