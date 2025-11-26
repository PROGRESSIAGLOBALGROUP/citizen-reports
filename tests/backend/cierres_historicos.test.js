import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const originalFetch = global.fetch;

describe('API Cierres Históricos', () => {
    let app;
    let initDb;
    let getDb;
    let createApp;
    let tmpDir;
    let dbPath;
    let adminToken = 'admin-token';
    let supervisorToken = 'supervisor-token';
    let funcionarioToken = 'funcionario-token';

    beforeAll(async () => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'citizen-reports-cierres-'));
        dbPath = path.join(tmpDir, 'test.db');
        process.env.DB_PATH = dbPath;

        ({ initDb, getDb } = await import('../../server/db.js'));
        await initDb();
        ({ createApp } = await import('../../server/app.js'));
        app = createApp();

        // Setup users and sessions
        const db = getDb();
        await new Promise((resolve, reject) => {
            db.serialize(() => {
                // Admin
                db.run(`INSERT INTO usuarios (id, email, nombre, password_hash, dependencia, rol) VALUES (100, 'admin@test.com', 'Admin', 'hash', 'administracion', 'admin')`);
                db.run(`INSERT INTO sesiones (usuario_id, token, expira_en) VALUES (100, '${adminToken}', datetime('now', '+1 day'))`);

                // Supervisor Obras
                db.run(`INSERT INTO usuarios (id, email, nombre, password_hash, dependencia, rol) VALUES (101, 'sup@obras.com', 'Sup Obras', 'hash', 'obras_publicas', 'supervisor')`);
                db.run(`INSERT INTO sesiones (usuario_id, token, expira_en) VALUES (101, '${supervisorToken}', datetime('now', '+1 day'))`);

                // Funcionario Obras
                db.run(`INSERT INTO usuarios (id, email, nombre, password_hash, dependencia, rol) VALUES (102, 'func@obras.com', 'Func Obras', 'hash', 'obras_publicas', 'funcionario')`);
                db.run(`INSERT INTO sesiones (usuario_id, token, expira_en) VALUES (102, '${funcionarioToken}', datetime('now', '+1 day'))`, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });
    });

    beforeEach(async () => {
        const db = getDb();
        await new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('DELETE FROM cierres_pendientes');
                db.run('DELETE FROM reportes', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });
    });

    afterAll((done) => {
        const db = getDb();
        if (db) {
            db.close((err) => {
                setTimeout(() => {
                    try {
                        if (tmpDir) {
                            fs.rmSync(tmpDir, { recursive: true, force: true });
                        }
                    } catch (err) {
                        console.error('Error removing tmpDir:', err);
                    }
                    delete process.env.DB_PATH;
                    global.fetch = originalFetch;
                    done();
                }, 200);
            });
        } else {
            done();
        }
    });

    test('debe filtrar cierres por estado (pendiente, aprobado, rechazado)', async () => {
        const db = getDb();
        
        // Create reports and closures
        await new Promise((resolve, reject) => {
            db.serialize(() => {
                // Report 1: Pending
                db.run(`INSERT INTO reportes (id, tipo, lat, lng, dependencia, estado) VALUES (1, 'baches', 1, 1, 'obras_publicas', 'pendiente_cierre')`);
                db.run(`INSERT INTO cierres_pendientes (reporte_id, funcionario_id, notas_cierre, firma_digital, aprobado, fecha_cierre) VALUES (1, 102, 'notas', 'firma', 0, '2023-01-01')`);

                // Report 2: Approved
                db.run(`INSERT INTO reportes (id, tipo, lat, lng, dependencia, estado) VALUES (2, 'baches', 1, 1, 'obras_publicas', 'cerrado')`);
                db.run(`INSERT INTO cierres_pendientes (reporte_id, funcionario_id, notas_cierre, firma_digital, aprobado, fecha_cierre) VALUES (2, 102, 'notas', 'firma', 1, '2023-01-02')`);

                // Report 3: Rejected
                db.run(`INSERT INTO reportes (id, tipo, lat, lng, dependencia, estado) VALUES (3, 'baches', 1, 1, 'obras_publicas', 'asignado')`);
                db.run(`INSERT INTO cierres_pendientes (reporte_id, funcionario_id, notas_cierre, firma_digital, aprobado, fecha_cierre) VALUES (3, 102, 'notas', 'firma', -1, '2023-01-03')`, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });

        // Test Pending (Default)
        let res = await request(app).get('/api/reportes/cierres-pendientes')
            .set('Authorization', `Bearer ${supervisorToken}`);
        expect(res.status).toBe(200);
        // Should only return pending by default if no params
        // But we are changing the API to support params. 
        // If I run this test NOW, it will fail because the API doesn't support params yet.
        // That's good (Red).
        
        // Test Approved
        res = await request(app).get('/api/reportes/cierres-pendientes')
            .query({ estado: 'aprobado' })
            .set('Authorization', `Bearer ${supervisorToken}`);
        
        // Currently this will return pending ones (ignoring param) or empty if logic is strict
        // We expect it to return the approved one after our changes.
        // For now, let's assert what we WANT.
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].aprobado).toBe(1);

        // Test Rejected
        res = await request(app).get('/api/reportes/cierres-pendientes')
            .query({ estado: 'rechazado' })
            .set('Authorization', `Bearer ${supervisorToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].aprobado).toBe(-1);
        
        // Test All
        res = await request(app).get('/api/reportes/cierres-pendientes')
            .query({ estado: 'todos' })
            .set('Authorization', `Bearer ${supervisorToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(3);
    });

    test('debe soportar paginación', async () => {
         const db = getDb();
         // Insert many closures
         await new Promise((resolve, reject) => {
             db.serialize(() => {
                 for(let i=10; i<20; i++) {
                     db.run(`INSERT INTO reportes (id, tipo, lat, lng, dependencia, estado) VALUES (${i}, 'baches', 1, 1, 'obras_publicas', 'cerrado')`);
                     db.run(`INSERT INTO cierres_pendientes (reporte_id, funcionario_id, notas_cierre, firma_digital, aprobado, fecha_cierre) VALUES (${i}, 102, 'notas', 'firma', 1, '2023-01-01')`);
                 }
                 // Wait for last one? db.serialize guarantees order, so we can just append a dummy query or use the last one if we can access it.
                 // Easier: just run a dummy query at the end.
                 db.run('SELECT 1', (err) => {
                     if (err) reject(err);
                     else resolve();
                 });
             });
         });

         const res = await request(app).get('/api/reportes/cierres-pendientes')
            .query({ estado: 'aprobado', limit: 5, offset: 0 })
            .set('Authorization', `Bearer ${supervisorToken}`);
         
         expect(res.status).toBe(200);
         expect(res.body).toHaveLength(5);
    });
});
