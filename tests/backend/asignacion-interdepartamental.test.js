const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');

describe('Asignación interdepartamental de reportes', () => {
  let app;
  let initDb;
  let getDb;
  let createApp;
  let tmpDir;
  let dbPath;
  let tokenSupervisorObras;
  let tokenAdmin;
  let funcionarioServiciosId;

  beforeAll(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jantetelco-'));
    dbPath = path.join(tmpDir, 'test.db');
    process.env.DB_PATH = dbPath;

    ({ initDb, getDb } = await import('../../server/db.js'));
    await initDb();
    ({ createApp } = await import('../../server/app.js'));
    app = createApp();

    // Login como supervisor de obras (existe en schema.sql)
    const loginObras = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'supervisor.obras@jantetelco.gob.mx',
        password: 'admin123'
      });
    
    tokenSupervisorObras = loginObras.body.token;

    // Login como admin
    const loginAdmin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@jantetelco.gob.mx',
        password: 'admin123'
      });
    
    tokenAdmin = loginAdmin.body.token;

    // Obtener funcionario de servicios para los tests
    const db = getDb();
    const funcionarioServicios = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM usuarios WHERE dependencia = ? AND rol = ? LIMIT 1', 
        ['servicios_publicos', 'funcionario'], 
        (err, row) => err ? reject(err) : resolve(row)
      );
    });
    funcionarioServiciosId = funcionarioServicios.id;
  });

  afterAll(() => {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    delete process.env.DB_PATH;
  });

  test('supervisor NO puede asignar reporte de otra dependencia usando ruta /asignar', async () => {
    // Crear reporte tipo "agua" (agua_potable) - diferente de obras_publicas
    const reporte = await request(app)
      .post('/api/reportes')
      .send({
        tipo: 'agua',
        descripcion: 'Fuga de agua en calle principal',
        lat: 18.7160,
        lng: -98.7760,
        peso: 1
      });

    const reporteId = reporte.body.id;

    // Intentar asignar usando ruta /asignar (debería fallar por verificarAccesoReporte)
    const response = await request(app)
      .post(`/api/reportes/${reporteId}/asignar`)
      .set('Authorization', `Bearer ${tokenSupervisorObras}`)
      .send({
        usuario_id: funcionarioServiciosId
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('No tienes acceso');
  });

  test('admin PUEDE asignar reporte interdepartamentalmente usando /asignaciones', async () => {
    // Crear reporte tipo "agua" (agua_potable)
    const reporte = await request(app)
      .post('/api/reportes')
      .send({
        tipo: 'agua',
        descripcion: 'Fuga requiere coordinación',
        lat: 18.7160,
        lng: -98.7760,
        peso: 1
      });

    const reporteId = reporte.body.id;

    // Admin puede asignar interdepartamentalmente usando /asignaciones
    const response = await request(app)
      .post(`/api/reportes/${reporteId}/asignaciones`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        usuario_id: funcionarioServiciosId,
        asignado_por: 1, // admin id
        notas: 'Coordinación especial interdepartamental'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });

  test('supervisor PUEDE asignar reporte interdepartamentalmente usando /asignaciones', async () => {
    // Crear reporte tipo "agua" (agua_potable) - diferente de obras_publicas
    const reporte = await request(app)
      .post('/api/reportes')
      .send({
        tipo: 'agua',
        descripcion: 'Fuga que requiere coordinación interdepartamental',
        lat: 18.7160,
        lng: -98.7760,
        peso: 1
      });

    const reporteId = reporte.body.id;

    // Supervisor de obras puede asignar a funcionario de servicios usando /asignaciones
    const response = await request(app)
      .post(`/api/reportes/${reporteId}/asignaciones`)
      .set('Authorization', `Bearer ${tokenSupervisorObras}`)
      .send({
        usuario_id: funcionarioServiciosId,
        asignado_por: 2, // supervisor obras id
        notas: 'Requiere coordinación interdepartamental entre obras y servicios'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
