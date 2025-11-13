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
    
    authToken = loginRes.body.token;
  });

  afterAll(() => {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    delete process.env.DB_PATH;
  });

  test('acepta solicitud de cierre con firma de ~30KB', async () => {
    // Crear reporte de prueba
    const reporte = await request(app)
      .post('/api/reportes')
      .send({
        tipo: 'bache',
        descripcion: 'Test reporte',
        lat: 18.7160,
        lng: -98.7760,
        peso: 1
      });

    const reporteId = reporte.body.id;

    // Asignar reporte al funcionario
    await request(app)
      .post(`/api/reportes/${reporteId}/asignaciones`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        usuario_id: 3,
        notas: 'Asignación de prueba'
      });

    // Generar firma simulada de ~30KB (típica)
    const firmaBase64 = 'data:image/png;base64,' + 'A'.repeat(30 * 1024 * 4/3); // base64 es 33% más grande

    const response = await request(app)
      .post(`/api/reportes/${reporteId}/solicitar-cierre`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        funcionario_id: 3,
        notas_cierre: 'Trabajo completado',
        firma_digital: firmaBase64,
        evidencia_fotos: '[]'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('cierre_id');
    expect(response.body).toHaveProperty('mensaje');
  });

  test('acepta solicitud de cierre con firma + 3 evidencias (~1.2MB total)', async () => {
    // Crear reporte de prueba
    const reporte = await request(app)
      .post('/api/reportes')
      .send({
        tipo: 'bache',
        descripcion: 'Test reporte 2',
        lat: 18.7160,
        lng: -98.7760,
        peso: 1
      });

    const reporteId = reporte.body.id;

    // Asignar reporte
    await request(app)
      .post(`/api/reportes/${reporteId}/asignaciones`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        usuario_id: 3,
        notas: 'Asignación de prueba'
      });

    // Firma de ~30KB
    const firmaBase64 = 'data:image/png;base64,' + 'A'.repeat(30 * 1024 * 4/3);
    
    // 3 evidencias de ~300KB cada una = 900KB total
    const evidencias = [];
    for (let i = 0; i < 3; i++) {
      evidencias.push('data:image/jpeg;base64,' + 'B'.repeat(300 * 1024 * 4/3));
    }

    const response = await request(app)
      .post(`/api/reportes/${reporteId}/solicitar-cierre`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        funcionario_id: 3,
        notas_cierre: 'Trabajo completado con evidencias',
        firma_digital: firmaBase64,
        evidencia_fotos: JSON.stringify(evidencias)
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('cierre_id');
    expect(response.body).toHaveProperty('mensaje');
  });

  test('rechaza payload que excede 5MB', async () => {
    // Crear reporte de prueba
    const reporte = await request(app)
      .post('/api/reportes')
      .send({
        tipo: 'bache',
        descripcion: 'Test reporte 3',
        lat: 18.7160,
        lng: -98.7760,
        peso: 1
      });

    const reporteId = reporte.body.id;

    // Asignar reporte
    await request(app)
      .post(`/api/reportes/${reporteId}/asignaciones`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        usuario_id: 3,
        notas: 'Asignación de prueba'
      });

    // Payload excesivo: 6MB
    const payloadExcesivo = 'data:image/jpeg;base64,' + 'C'.repeat(6 * 1024 * 1024);

    const response = await request(app)
      .post(`/api/reportes/${reporteId}/solicitar-cierre`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        funcionario_id: 3,
        notas_cierre: 'Payload demasiado grande',
        firma_digital: payloadExcesivo,
        evidencia_fotos: '[]'
      });

    expect(response.status).toBe(413); // Payload Too Large
  });
});
