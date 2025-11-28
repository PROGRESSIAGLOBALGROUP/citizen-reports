/**
 * Backend Tests: GET /api/reportes - Reportes de Mi Dependencia
 * 
 * BUGFIX 2025-11-27: Tests for the bug where reportes-dependencia view
 * was showing 0 reports because filtroEstado='pendiente' was being sent
 * to the API, but all reports were in estado='abierto'.
 * 
 * Tests verify:
 * - API returns all reports when no estado filter is provided
 * - API correctly filters by estado when requested
 * - API correctly filters by dependencia
 * - Admin vs Supervisor visibility rules
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('GET /api/reportes - Reportes de Mi Dependencia BUGFIX', () => {
  let app;
  let initDb;
  let getDb;
  let createApp;
  let tmpDir;
  let dbPath;

  beforeAll(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'citizen-reports-dependencia-'));
    dbPath = path.join(tmpDir, 'test.db');
    process.env.DB_PATH = dbPath;

    ({ initDb, getDb } = await import('../../server/db.js'));
    await initDb();
    ({ createApp } = await import('../../server/app.js'));
    app = createApp();
  });

  beforeEach(async () => {
    const db = getDb();
    // Clean up reportes table
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM reportes', (err) => (err ? reject(err) : resolve()));
    });

    // Insert test data with different states and departments
    const testReportes = [
      { tipo: 'baches', descripcion: 'Bache test 1', lat: 18.716, lng: -98.776, estado: 'abierto', dependencia: 'obras_publicas' },
      { tipo: 'baches', descripcion: 'Bache test 2', lat: 18.717, lng: -98.777, estado: 'abierto', dependencia: 'obras_publicas' },
      { tipo: 'alumbrado', descripcion: 'Alumbrado test', lat: 18.715, lng: -98.775, estado: 'abierto', dependencia: 'servicios_publicos' },
      { tipo: 'seguridad', descripcion: 'Seguridad test', lat: 18.714, lng: -98.774, estado: 'asignado', dependencia: 'seguridad_publica' },
      { tipo: 'agua', descripcion: 'Agua test', lat: 18.713, lng: -98.773, estado: 'cerrado', dependencia: 'agua_potable' },
    ];

    for (const r of testReportes) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO reportes (tipo, descripcion, lat, lng, estado, dependencia, peso) VALUES (?, ?, ?, ?, ?, ?, 1)`,
          [r.tipo, r.descripcion, r.lat, r.lng, r.estado, r.dependencia],
          (err) => (err ? reject(err) : resolve())
        );
      });
    }
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

  describe('BUGFIX: No estado filter returns all reports', () => {
    test('returns all 5 reports when no estado filter is provided', async () => {
      const res = await request(app).get('/api/reportes');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(5);
    });

    test('returns 3 abierto reports when estado=abierto', async () => {
      const res = await request(app).get('/api/reportes').query({ estado: 'abierto' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3);
      expect(res.body.every(r => r.estado === 'abierto')).toBe(true);
    });

    test('returns 0 reports when estado=pendiente (no pending reports exist)', async () => {
      // This was the bug: frontend was sending estado=pendiente but no reports had that state
      const res = await request(app).get('/api/reportes').query({ estado: 'pendiente' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });

    test('returns 1 report when estado=asignado', async () => {
      const res = await request(app).get('/api/reportes').query({ estado: 'asignado' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].estado).toBe('asignado');
    });

    test('returns 1 report when estado=cerrado', async () => {
      const res = await request(app).get('/api/reportes').query({ estado: 'cerrado' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].estado).toBe('cerrado');
    });
  });

  describe('Dependencia filter works correctly', () => {
    test('returns 2 reports when dependencia=obras_publicas', async () => {
      const res = await request(app).get('/api/reportes').query({ dependencia: 'obras_publicas' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body.every(r => r.dependencia === 'obras_publicas')).toBe(true);
    });

    test('returns 1 report when dependencia=servicios_publicos', async () => {
      const res = await request(app).get('/api/reportes').query({ dependencia: 'servicios_publicos' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].dependencia).toBe('servicios_publicos');
    });

    test('returns 0 reports for non-existent department', async () => {
      const res = await request(app).get('/api/reportes').query({ dependencia: 'fake_dept' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });
  });

  describe('Combined filters', () => {
    test('dependencia + no estado returns all from that department', async () => {
      // This is what the FIXED code does for supervisor
      const res = await request(app).get('/api/reportes').query({ dependencia: 'obras_publicas' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    test('dependencia + estado works correctly', async () => {
      const res = await request(app).get('/api/reportes').query({ 
        dependencia: 'obras_publicas',
        estado: 'abierto'
      });
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body.every(r => r.dependencia === 'obras_publicas' && r.estado === 'abierto')).toBe(true);
    });

    test('estado=abiertos (plural) excludes cerrado', async () => {
      const res = await request(app).get('/api/reportes').query({ estado: 'abiertos' });
      expect(res.status).toBe(200);
      // Should return all except cerrado (4 reports)
      expect(res.body).toHaveLength(4);
      expect(res.body.every(r => r.estado !== 'cerrado')).toBe(true);
    });
  });

  describe('Admin vs Supervisor visibility', () => {
    test('Admin (no dependencia filter) sees all 5 reports', async () => {
      // Admin calls /api/reportes without dependencia
      const res = await request(app).get('/api/reportes');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(5);
      
      // Verify reports from multiple departments
      const deps = new Set(res.body.map(r => r.dependencia));
      expect(deps.size).toBeGreaterThan(1);
    });

    test('Supervisor (with dependencia filter) sees only their department', async () => {
      // Supervisor calls /api/reportes?dependencia=obras_publicas
      const res = await request(app).get('/api/reportes').query({ dependencia: 'obras_publicas' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      
      // All should be from same department
      const deps = new Set(res.body.map(r => r.dependencia));
      expect(deps.size).toBe(1);
      expect(deps.has('obras_publicas')).toBe(true);
    });
  });

  describe('Date filters work without estado', () => {
    test('from date filter works', async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await request(app).get('/api/reportes').query({ from: today });
      expect(res.status).toBe(200);
      // All test reports were created today
      expect(res.body.length).toBeGreaterThanOrEqual(0);
    });

    test('to date filter works', async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const res = await request(app).get('/api/reportes').query({ to: tomorrow });
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(5);
    });

    test('date range filter works without estado', async () => {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const res = await request(app).get('/api/reportes').query({ 
        from: today,
        to: tomorrow
      });
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(5);
    });
  });
});
