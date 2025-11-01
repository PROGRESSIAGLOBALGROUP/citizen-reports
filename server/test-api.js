import http from 'http';

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/reportes',
  method: 'GET',
};

console.log('🔍 Probando GET /api/reportes...\n');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const reportes = JSON.parse(data);
      console.log(`✅ Total reportes en API: ${reportes.length}`);
      console.log('\n📋 Primeros 3 reportes:');
      reportes.slice(0, 3).forEach((r) => {
        console.log(`  - ID ${r.id}: ${r.tipo} en (${r.lat}, ${r.lng})`);
      });
    } catch (err) {
      console.error('❌ Error parsing JSON:', err.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Request error:', err.message);
});

req.end();
