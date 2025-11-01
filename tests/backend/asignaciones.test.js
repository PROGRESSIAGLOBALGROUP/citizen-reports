/**
 * Tests para endpoints de asignaciones de reportes
 * Siguiendo TDD philosophy
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Asignaciones de Reportes API', () => {
  let app;
  let createApp;
  let getDb;
  let initDb;
  let tmpDir;
  let dbPath;

  beforeAll(async () => {
    // Crear directorio temporal para BD de prueba
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jantetelco-asignaciones-'));
    dbPath = path.join(tmpDir, 'test.db');
    process.env.DB_PATH = dbPath;

    // Importar módulos ESM dinámicamente
    ({ initDb, getDb } = await import('../../server/db.js'));
    await initDb();
    ({ createApp } = await import('../../server/app.js'));
    app = createApp();
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

  describe('GET /api/reportes/:id', () => {
    it('debe retornar detalles completos de un reporte', async () => {
      const response = await request(app)
        .get('/api/reportes/1')
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('tipo');
      expect(response.body).toHaveProperty('descripcion');
      expect(response.body).toHaveProperty('lat');
      expect(response.body).toHaveProperty('lng');
      expect(response.body).toHaveProperty('dependencia');
    });

    it('debe retornar 404 si el reporte no existe', async () => {
      await request(app)
        .get('/api/reportes/9999')
        .expect(404);
    });
  });

  describe('GET /api/reportes/:id/asignaciones', () => {
    it('debe retornar lista vacía si no hay asignaciones', async () => {
      const response = await request(app)
        .get('/api/reportes/1/asignaciones')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('debe retornar 404 si el reporte no existe', async () => {
      await request(app)
        .get('/api/reportes/9999/asignaciones')
        .expect(404);
    });
  });

  describe('POST /api/reportes/:id/asignaciones', () => {
    it('debe crear una asignación válida', async () => {
      const response = await request(app)
        .post('/api/reportes/1/asignaciones')
        .send({
          usuario_id: 3, // funcionario de obras públicas
          asignado_por: 2 // supervisor
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('reporte_id', 1);
      expect(response.body).toHaveProperty('usuario_id', 3);
    });

    it('debe fallar si falta usuario_id', async () => {
      await request(app)
        .post('/api/reportes/1/asignaciones')
        .send({ asignado_por: 2 })
        .expect(400);
    });

    it('debe prevenir asignaciones duplicadas', async () => {
      // Primera asignación
      await request(app)
        .post('/api/reportes/2/asignaciones')
        .send({ usuario_id: 3, asignado_por: 2 })
        .expect(201);

      // Intento de duplicado
      await request(app)
        .post('/api/reportes/2/asignaciones')
        .send({ usuario_id: 3, asignado_por: 2 })
        .expect(409); // Conflict
    });

    it('debe fallar si el reporte no existe', async () => {
      await request(app)
        .post('/api/reportes/9999/asignaciones')
        .send({ usuario_id: 3 })
        .expect(404);
    });

    it('debe fallar si el usuario no existe', async () => {
      await request(app)
        .post('/api/reportes/1/asignaciones')
        .send({ usuario_id: 9999 })
        .expect(404);
    });
  });

  describe('DELETE /api/reportes/:id/asignaciones/:usuarioId', () => {
    beforeEach(async () => {
      // Crear asignación de prueba
      await request(app)
        .post('/api/reportes/3/asignaciones')
        .send({ usuario_id: 5, asignado_por: 4 });
    });

    it('debe eliminar una asignación existente', async () => {
      await request(app)
        .delete('/api/reportes/3/asignaciones/5')
        .expect(200);

      // Verificar que ya no existe
      const response = await request(app)
        .get('/api/reportes/3/asignaciones')
        .expect(200);

      expect(response.body.find(a => a.usuario_id === 5)).toBeUndefined();
    });

    it('debe retornar 404 si la asignación no existe', async () => {
      await request(app)
        .delete('/api/reportes/3/asignaciones/9999')
        .expect(404);
    });
  });

  describe('PUT /api/reportes/:id/notas', () => {
    beforeEach(async () => {
      // Crear asignación de prueba
      await request(app)
        .post('/api/reportes/4/asignaciones')
        .send({ usuario_id: 3, asignado_por: 2 });
    });

    it('debe actualizar notas si el usuario está asignado', async () => {
      const response = await request(app)
        .put('/api/reportes/4/notas')
        .send({
          usuario_id: 3,
          notas: 'Revisé el sitio, se requiere material adicional'
        })
        .expect(200);

      expect(response.body).toHaveProperty('notas');
    });

    it('debe fallar si el usuario no está asignado', async () => {
      await request(app)
        .put('/api/reportes/4/notas')
        .send({
          usuario_id: 5, // no asignado
          notas: 'Intento de edición no autorizada'
        })
        .expect(403);
    });

    it('debe fallar si faltan notas', async () => {
      await request(app)
        .put('/api/reportes/4/notas')
        .send({ usuario_id: 3 })
        .expect(400);
    });

    it('debe fallar si las notas están vacías', async () => {
      await request(app)
        .put('/api/reportes/4/notas')
        .send({ usuario_id: 3, notas: '   ' })
        .expect(400);
    });
  });
});
