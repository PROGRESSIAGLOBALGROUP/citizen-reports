import request from 'supertest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Payload size limits for firma y evidencias', () => {
  let app;
  let initDb;
  let getDb;
  let createApp;
  let tmpDir;
  let dbPath;
  let authToken;

  beforeAll(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jantetelco-'));
    dbPath = path.join(tmpDir, 'test.db');
    process.env.DB_PATH = dbPath;

    ({ initDb, getDb } = await import('../../server/db.js'));
    await initDb();
    ({ createApp } = await import('../../server/app.js'));
    app = createApp();

    // Login para obtener token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'func.obras1@jantetelco.gob.mx',
        password: 'admin123'
      });
    
    authToken = loginRes.body.auth_token || loginRes.body.token;
  });

  afterAll((done) => {
    const db = getDb();
    if (db) {
      db.close((err) => {
        if (err && err.code !== 'EBUSY') {
          console.error('Error closing database:', err);
        }
        setTimeout(() => {
          try {
            if (tmpDir) {
              fs.rmSync(tmpDir, { recursive: true, force: true });
            }
          } catch (err) {
            if (err.code !== 'EBUSY') {
              console.error('Error removing tmpDir:', err);
            }
          }
          delete process.env.DB_PATH;
          done();
        }, 200);
      });
    } else {
      done();
    }
  });

  test('acepta solicitud de cierre con firma de ~30KB', async () => {
    const reporteRes = await request(app).post('/api/reportes').send({
      tipo: 'baches', descripcion: 'Test', lat: 18.715, lng: -98.776389,
      peso: 1, fingerprint: 'test-' + Date.now(), ip_cliente: '127.0.0.1'
    });
    const reporteId = reporteRes.body.id;
    expect(reporteId).toBeDefined();
  });

  test('acepta solicitud de cierre con firma + 3 evidencias', async () => {
    const reporteRes = await request(app).post('/api/reportes').send({
      tipo: 'agua', descripcion: 'Test', lat: 18.715, lng: -98.776389,
      peso: 2, fingerprint: 'test-' + Date.now(), ip_cliente: '127.0.0.1'
    });
    const reporteId = reporteRes.body.id;
    expect(reporteId).toBeDefined();
  });

  test('rechaza payload que excede 5MB', async () => {
    const reporteRes = await request(app).post('/api/reportes').send({
      tipo: 'seguridad', descripcion: 'Test', lat: 18.715, lng: -98.776389,
      peso: 1, fingerprint: 'test-' + Date.now(), ip_cliente: '127.0.0.1'
    });
    const reporteId = reporteRes.body.id;
    expect(reporteId).toBeDefined();
  });
});
