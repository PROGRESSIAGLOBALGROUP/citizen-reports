/**
 * Tests para endpoints de asignaciones de reportes
 * Siguiendo TDD philosophy
 */

import request from 'supertest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { getDb } from '../../server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Asignaciones de Reportes API', () => {
  let app;
  let createApp;
  let getDb;
  let initDb;
  let tmpDir;
  let dbPath;
  let authToken;

  beforeAll(async () => {
    // Crear directorio temporal para BD de prueba
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'citizen-reports-asignaciones-'));
    dbPath = path.join(tmpDir, 'test.db');
    process.env.DB_PATH = dbPath;

    // Importar módulos ESM dinámicamente
    ({ initDb, getDb } = await import('../../server/db.js'));
    await initDb();
    ({ createApp } = await import('../../server/app.js'));
    app = createApp();

    // Obtener token de autenticación
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@jantetelco.gob.mx', password: 'admin123' });
    authToken = loginRes.body.token;
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
              // Ignore EBUSY errors on Windows - files will be cleaned by OS
              if (err.code !== 'EBUSY') {
                console.error('Error eliminando tmpDir:', err);
              }
            }
          }
          delete process.env.DB_PATH;
          done();
        }, 500);
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
    it('debe retornar lista de asignaciones para un reporte', async () => {
      const response = await request(app)
        .get('/api/reportes/1/asignaciones')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('debe retornar 404 si el reporte no existe', async () => {
      await request(app)
        .get('/api/reportes/9999/asignaciones')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/reportes/:id/asignaciones', () => {
    it('debe crear una asignación válida', async () => {
      const response = await request(app)
        .post('/api/reportes/10/asignaciones')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuario_id: 3, // funcionario de obras públicas
          asignado_por: 2 // supervisor
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('reporte_id', 10);
      expect(response.body).toHaveProperty('usuario_id', 3);
    });

    it('debe fallar si falta usuario_id', async () => {
      await request(app)
        .post('/api/reportes/10/asignaciones')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ asignado_por: 2 })
        .expect(400);
    });

    it('debe prevenir asignaciones duplicadas', async () => {
      // Primera asignación
      await request(app)
        .post('/api/reportes/11/asignaciones')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ usuario_id: 3, asignado_por: 2 })
        .expect(201);

      // Intento de duplicado
      await request(app)
        .post('/api/reportes/11/asignaciones')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ usuario_id: 3, asignado_por: 2 })
        .expect(409); // Conflict
    });

    it('debe fallar si el reporte no existe', async () => {
      await request(app)
        .post('/api/reportes/9999/asignaciones')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ usuario_id: 3 })
        .expect(404);
    });

    it('debe fallar si el usuario no existe', async () => {
      await request(app)
        .post('/api/reportes/10/asignaciones')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ usuario_id: 9999 })
        .expect(404);
    });
  });

  describe('DELETE /api/reportes/:id/asignaciones/:usuarioId', () => {
    it('debe retornar 404 si la asignación no existe', async () => {
      await request(app)
        .delete('/api/reportes/20/asignaciones/9999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/reportes/:id/notas', () => {
    it('debe fallar si el usuario no está asignado', async () => {
      await request(app)
        .put('/api/reportes/30/notas')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuario_id: 5, // no asignado
          notas: 'Intento de edición no autorizada'
        })
        .expect(403);
    });

    it('debe fallar si faltan notas', async () => {
      await request(app)
        .put('/api/reportes/30/notas')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ usuario_id: 3 })
        .expect(400);
    });

    it('debe fallar si las notas están vacías', async () => {
      await request(app)
        .put('/api/reportes/30/notas')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ usuario_id: 3, notas: '   ' })
        .expect(400);
    });
  });
});

afterAll((done) => {
  const db = getDb();
  if (db) {
    db.close((err) => {
      if (err && err.code !== 'EBUSY') {
        console.error('Error closing database:', err);
      }
      setTimeout(() => {
        done();
      }, 200);
    });
  } else {
    done();
  }
});
