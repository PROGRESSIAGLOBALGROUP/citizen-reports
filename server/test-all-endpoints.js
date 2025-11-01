import http from 'http';

const testEndpoint = (path, label) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path,
      method: 'GET',
    };

    console.log(`🔍 Probando ${label}...`);

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ path, label, data: parsed, success: true });
        } catch (err) {
          reject({ path, label, error: err.message, raw: data });
        }
      });
    });

    req.on('error', (err) => {
      reject({ path, label, error: err.message });
    });

    req.end();
  });
};

(async () => {
  try {
    // Test /api/reportes
    const reportes = await testEndpoint('/api/reportes', 'GET /api/reportes');
    console.log(`✅ Total reportes: ${reportes.data.length}`);
    
    // Test /api/reportes/geojson
    const geojson = await testEndpoint('/api/reportes/geojson', 'GET /api/reportes/geojson');
    console.log(`✅ GeoJSON features: ${geojson.data.features?.length || 0}`);
    
    // Test /api/reportes/tipos
    const tipos = await testEndpoint('/api/reportes/tipos', 'GET /api/reportes/tipos');
    console.log(`✅ Tipos disponibles: ${tipos.data.map(t => t.tipo).join(', ')}`);
    
    console.log('\n✅ Todos los endpoints funcionan correctamente!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
