/**
 * Test para verificar que el estado del reporte cambia correctamente
 * cuando se eliminan todas las asignaciones
 */

import request from 'supertest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Estado del reporte tras desasignación', () => {
  let app;
  let createApp;
  let getDb;
  let initDb;
  let tmpDir;
  let dbPath;
  let authToken = 'test-token-' + Date.now();

  beforeAll(async () => {
    // Crear directorio temporal para BD de prueba
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jantetelco-test-'));
    dbPath = path.join(tmpDir, 'test-desasignacion.db');
    process.env.DB_PATH = dbPath;

    // Importar dinámicamente los módulos ESM
    const dbModule = await import('../../server/db.js');
    const appModule = await import('../../server/app.js');

    getDb = dbModule.getDb;
    createApp = appModule.createApp;
    initDb = dbModule.initDb;

    // Inicializar BD con esquema
    await initDb();
    app = createApp();

    // Insertar usuarios de prueba
    const db = getDb();
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO usuarios (email, password_hash, nombre, dependencia, rol, activo)
        VALUES 
          ('admin@test.com', '$2b$10$dummyhash', 'Admin Test', 'administracion', 'admin', 1),
          ('func1@test.com', '$2b$10$dummyhash', 'Funcionario 1', 'obras_publicas', 'funcionario', 1),
          ('func2@test.com', '$2b$10$dummyhash', 'Funcionario 2', 'obras_publicas', 'funcionario', 1)
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Crear una sesión para el usuario
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO sesiones (usuario_id, token, expira_en)
        VALUES (1, ?, datetime('now', '+24 hours'))
      `, [authToken], (err) => {
        if (err) reject(err);
        else resolve();
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
          if (fs.existsSync(tmpDir)) {
            try {
              fs.rmSync(tmpDir, { recursive: true, force: true });
            } catch (err) {
              if (err.code !== 'EBUSY') {
                console.warn(`No se pudo eliminar ${tmpDir}:`, err.message);
              }
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

  test('Estado cambia a "abierto" cuando se eliminan todas las asignaciones', async () => {
    const db = getDb();

    // 1. Crear reporte
    const reporteRes = await request(app)
      .post('/api/reportes')
      .send({
        tipo: 'bache',
        descripcion: 'Reporte de prueba',
        lat: 18.7,
        lng: -98.7
      });

    expect(reporteRes.status).toBe(201);
    const reporteId = reporteRes.body.id;

    // 2. Verificar estado inicial es "abierto"
    let reporte = await new Promise((resolve, reject) => {
      db.get('SELECT estado FROM reportes WHERE id = ?', [reporteId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    expect(reporte.estado).toBe('abierto');

    // 3. Asignar a dos funcionarios
    await request(app)
      .post(`/api/reportes/${reporteId}/asignaciones`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ usuario_id: 2, notas: 'Asignación 1' });

    await request(app)
      .post(`/api/reportes/${reporteId}/asignaciones`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ usuario_id: 3, notas: 'Asignación 2' });

    // 4. Cambiar manualmente el estado a "asignado" (simular comportamiento real)
    await new Promise((resolve, reject) => {
      db.run(`UPDATE reportes SET estado = 'asignado' WHERE id = ?`, [reporteId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 5. Verificar estado es "asignado"
    reporte = await new Promise((resolve, reject) => {
      db.get('SELECT estado FROM reportes WHERE id = ?', [reporteId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    expect(reporte.estado).toBe('asignado');

    // 6. Eliminar primera asignación
    const deleteRes1 = await request(app)
      .delete(`/api/reportes/${reporteId}/asignaciones/2`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(deleteRes1.status).toBe(200);

    // 7. Estado todavía debe ser "asignado" (aún hay un funcionario asignado)
    reporte = await new Promise((resolve, reject) => {
      db.get('SELECT estado FROM reportes WHERE id = ?', [reporteId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    expect(reporte.estado).toBe('asignado');

    // 8. Eliminar segunda asignación (última)
    const deleteRes2 = await request(app)
      .delete(`/api/reportes/${reporteId}/asignaciones/3`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(deleteRes2.status).toBe(200);
    expect(deleteRes2.body.estado_actualizado).toBe(true);

    // 9. Estado debe regresar a "abierto"
    reporte = await new Promise((resolve, reject) => {
      db.get('SELECT estado FROM reportes WHERE id = ?', [reporteId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    expect(reporte.estado).toBe('abierto');
  });

  test('Estado NO cambia si el reporte está en "pendiente_cierre"', async () => {
    const db = getDb();

    // 1. Crear reporte
    const reporteRes = await request(app)
      .post('/api/reportes')
      .send({
        tipo: 'bache',
        descripcion: 'Reporte con cierre pendiente',
        lat: 18.7,
        lng: -98.7
      });

    const reporteId = reporteRes.body.id;

    // 2. Asignar y cambiar estado a "pendiente_cierre"
    await request(app)
      .post(`/api/reportes/${reporteId}/asignaciones`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ usuario_id: 2, notas: 'Asignación' });

    await new Promise((resolve, reject) => {
      db.run(`UPDATE reportes SET estado = 'pendiente_cierre' WHERE id = ?`, [reporteId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 3. Eliminar asignación
    await request(app)
      .delete(`/api/reportes/${reporteId}/asignaciones/2`)
      .set('Authorization', `Bearer ${authToken}`);

    // 4. Estado debe seguir siendo "pendiente_cierre" (no regresa a "abierto")
    const reporte = await new Promise((resolve, reject) => {
      db.get('SELECT estado FROM reportes WHERE id = ?', [reporteId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    expect(reporte.estado).toBe('pendiente_cierre');
  });
});
