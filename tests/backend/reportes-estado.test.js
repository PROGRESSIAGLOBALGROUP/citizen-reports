const request = require('supertest');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('API reportes - campo estado', () => {
  let app;
  let createApp;
  let getDb;
  let initDb;
  let tmpDir;
  let dbPath;

  beforeAll(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jantetelco-estado-'));
    dbPath = path.join(tmpDir, 'test.db');
    process.env.DB_PATH = dbPath;

    ({ initDb, getDb } = await import('../../server/db.js'));
    await initDb();
    ({ createApp } = await import('../../server/app.js'));
    app = createApp();

    // Crear un reporte de prueba
    const db = getDb();
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO reportes (tipo, descripcion, lat, lng, peso, dependencia, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['bache', 'Reporte de prueba', 19.4326, -99.1332, 1, 'obras_publicas', 'abierto'],
        (err) => (err ? reject(err) : resolve())
      );
    });
  });

  afterAll((done) => {
    const db = getDb();
    if (db) {
      db.close((err) => {
        if (err) console.error('Error cerrando DB:', err);
        setTimeout(() => {
          if (tmpDir) {
            try {
              fs.rmSync(tmpDir, { recursive: true, force: true });
            } catch (err) {
              console.error('Error eliminando tmpDir:', err);
            }
          }
          delete process.env.DB_PATH;
          done();
        }, 100);
      });
    } else {
      done();
    }
  });

  test('GET /api/reportes debe incluir campo estado', async () => {
    const res = await request(app).get('/api/reportes');
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    
    // Verificar que cada reporte tiene el campo estado
    res.body.forEach(reporte => {
      expect(reporte).toHaveProperty('estado');
      expect(typeof reporte.estado).toBe('string');
    });
  });

  test('GET /api/reportes con filtro debe incluir campo estado', async () => {
    const res = await request(app).get('/api/reportes?tipo=bache');
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    
    res.body.forEach(reporte => {
      expect(reporte).toHaveProperty('estado');
      expect(reporte.tipo).toBe('bache');
    });
  });
});
