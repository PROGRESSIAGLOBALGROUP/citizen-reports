/**
 * Tests para Heatmap Temporal API (US-T08)
 * Endpoint: GET /api/reportes/heatmap-temporal
 * 
 * Permite visualizar patrones temporales de reportes:
 * - Agregación por hora del día (0-23)
 * - Agregación por día de la semana (0-6)
 * - Agregación por fecha (YYYY-MM-DD)
 * - Agregación por mes (YYYY-MM)
 * - Matriz hora x día (heatmap 2D)
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Heatmap Temporal API', () => {
  let app;
  let initDb;
  let getDb;
  let createApp;
  let tmpDir;
  let dbPath;

  beforeAll(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'citizen-heatmap-'));
    dbPath = path.join(tmpDir, 'test.db');
    process.env.DB_PATH = dbPath;

    ({ initDb, getDb } = await import('../../server/db.js'));
    await initDb();
    ({ createApp } = await import('../../server/app.js'));
    app = createApp();
  });

  beforeEach(async () => {
    const db = getDb();
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM reportes', (err) => (err ? reject(err) : resolve()));
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
          try {
            if (tmpDir) {
              fs.rmSync(tmpDir, { recursive: true, force: true });
            }
          } catch (e) {
            // Ignore cleanup errors
          }
          done();
        }, 100);
      });
    } else {
      done();
    }
  });

  // Helper para insertar reportes de prueba
  const insertarReporte = (db, datos) => {
    const defaults = {
      tipo: 'bache',
      descripcion: 'Test',
      lat: 18.9,
      lng: -99.2,
      colonia: 'Centro',
      codigo_postal: '62000',
      municipio: 'Jantetelco',
      estado_ubicacion: 'Morelos',
      dependencia: 'Obras Públicas',
      peso: 1,
      creado_en: new Date().toISOString()
    };
    const r = { ...defaults, ...datos };
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO reportes (tipo, descripcion, lat, lng, colonia, codigo_postal, municipio, estado_ubicacion, dependencia, peso, creado_en) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [r.tipo, r.descripcion, r.lat, r.lng, r.colonia, r.codigo_postal, r.municipio, r.estado_ubicacion, r.dependencia, r.peso, r.creado_en],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  };

  describe('GET /api/reportes/heatmap-temporal', () => {
    test('debería retornar estructura correcta con metadata y data', async () => {
      const res = await request(app)
        .get('/api/reportes/heatmap-temporal')
        .expect(200);

      expect(res.body).toHaveProperty('metadata');
      expect(res.body).toHaveProperty('data');
      expect(res.body.metadata).toHaveProperty('agrupacion', 'hora');
      expect(res.body.metadata).toHaveProperty('filtros');
      expect(res.body.metadata).toHaveProperty('total_registros');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('debería agregar por hora por defecto', async () => {
      const db = getDb();
      // Insertar reportes a diferentes horas
      await insertarReporte(db, { creado_en: '2025-12-08T08:30:00.000Z' });
      await insertarReporte(db, { creado_en: '2025-12-08T08:45:00.000Z' });
      await insertarReporte(db, { creado_en: '2025-12-08T14:00:00.000Z' });

      const res = await request(app)
        .get('/api/reportes/heatmap-temporal')
        .expect(200);

      expect(res.body.metadata.agrupacion).toBe('hora');
      expect(res.body.data.length).toBeGreaterThan(0);
      
      // Debe haber agregación por hora 8 y hora 14
      const hora8 = res.body.data.find(d => d.periodo === 8);
      const hora14 = res.body.data.find(d => d.periodo === 14);
      expect(hora8?.cantidad).toBe(2);
      expect(hora14?.cantidad).toBe(1);
    });

    test('debería aceptar agrupación por día de semana', async () => {
      const db = getDb();
      // Lunes 2025-12-08
      await insertarReporte(db, { creado_en: '2025-12-08T10:00:00.000Z' });
      await insertarReporte(db, { creado_en: '2025-12-08T11:00:00.000Z' });
      // Martes 2025-12-09
      await insertarReporte(db, { creado_en: '2025-12-09T10:00:00.000Z' });

      const res = await request(app)
        .get('/api/reportes/heatmap-temporal?agrupacion=dia_semana')
        .expect(200);

      expect(res.body.metadata.agrupacion).toBe('dia_semana');
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('debería aceptar agrupación por fecha', async () => {
      const db = getDb();
      await insertarReporte(db, { creado_en: '2025-12-01T10:00:00.000Z' });
      await insertarReporte(db, { creado_en: '2025-12-01T11:00:00.000Z' });
      await insertarReporte(db, { creado_en: '2025-12-02T10:00:00.000Z' });

      const res = await request(app)
        .get('/api/reportes/heatmap-temporal?agrupacion=fecha')
        .expect(200);

      expect(res.body.metadata.agrupacion).toBe('fecha');
      const dic1 = res.body.data.find(d => d.periodo === '2025-12-01');
      expect(dic1?.cantidad).toBe(2);
    });

    test('debería aceptar agrupación por mes', async () => {
      const db = getDb();
      await insertarReporte(db, { creado_en: '2025-10-15T10:00:00.000Z' });
      await insertarReporte(db, { creado_en: '2025-11-15T10:00:00.000Z' });
      await insertarReporte(db, { creado_en: '2025-11-20T10:00:00.000Z' });

      const res = await request(app)
        .get('/api/reportes/heatmap-temporal?agrupacion=mes')
        .expect(200);

      expect(res.body.metadata.agrupacion).toBe('mes');
      const nov = res.body.data.find(d => d.periodo === '2025-11');
      expect(nov?.cantidad).toBe(2);
    });

    test('debería aceptar agrupación hora_dia para heatmap 2D', async () => {
      const res = await request(app)
        .get('/api/reportes/heatmap-temporal?agrupacion=hora_dia')
        .expect(200);

      expect(res.body.metadata.agrupacion).toBe('hora_dia');
    });

    test('debería rechazar agrupación inválida con 400', async () => {
      const res = await request(app)
        .get('/api/reportes/heatmap-temporal?agrupacion=invalida')
        .expect(400);

      expect(res.body).toHaveProperty('error', 'Agrupación inválida');
      expect(res.body).toHaveProperty('validas');
      expect(res.body.validas).toContain('hora');
      expect(res.body.validas).toContain('dia_semana');
      expect(res.body.validas).toContain('fecha');
      expect(res.body.validas).toContain('mes');
      expect(res.body.validas).toContain('hora_dia');
    });

    test('debería filtrar por rango de fechas', async () => {
      const db = getDb();
      await insertarReporte(db, { creado_en: '2025-11-15T10:00:00.000Z' });
      await insertarReporte(db, { creado_en: '2025-12-05T10:00:00.000Z' });
      await insertarReporte(db, { creado_en: '2025-12-06T10:00:00.000Z' });
      await insertarReporte(db, { creado_en: '2025-12-10T10:00:00.000Z' });

      const res = await request(app)
        .get('/api/reportes/heatmap-temporal?from=2025-12-01&to=2025-12-07')
        .expect(200);

      expect(res.body.metadata.filtros.from).toBe('2025-12-01');
      expect(res.body.metadata.filtros.to).toBe('2025-12-07');
      // Solo debe incluir los de diciembre 5 y 6
      const total = res.body.data.reduce((acc, d) => acc + d.cantidad, 0);
      expect(total).toBe(2);
    });

    test('debería filtrar por tipo de reporte', async () => {
      const db = getDb();
      await insertarReporte(db, { tipo: 'bache', creado_en: '2025-12-08T10:00:00.000Z' });
      await insertarReporte(db, { tipo: 'bache', creado_en: '2025-12-08T11:00:00.000Z' });
      await insertarReporte(db, { tipo: 'alumbrado', creado_en: '2025-12-08T10:00:00.000Z' });

      const res = await request(app)
        .get('/api/reportes/heatmap-temporal?tipo=bache')
        .expect(200);

      expect(res.body.metadata.filtros.tipos).toContain('bache');
      const total = res.body.data.reduce((acc, d) => acc + d.cantidad, 0);
      expect(total).toBe(2);
    });

    test('debería filtrar por dependencia', async () => {
      const db = getDb();
      await insertarReporte(db, { dependencia: 'Obras', creado_en: '2025-12-08T10:00:00.000Z' });
      await insertarReporte(db, { dependencia: 'Obras', creado_en: '2025-12-08T11:00:00.000Z' });
      await insertarReporte(db, { dependencia: 'Alumbrado', creado_en: '2025-12-08T10:00:00.000Z' });

      const res = await request(app)
        .get('/api/reportes/heatmap-temporal?dependencia=Obras')
        .expect(200);

      expect(res.body.metadata.filtros.dependencia).toBe('Obras');
      const total = res.body.data.reduce((acc, d) => acc + d.cantidad, 0);
      expect(total).toBe(2);
    });

    test('debería retornar array vacío si no hay datos', async () => {
      const res = await request(app)
        .get('/api/reportes/heatmap-temporal')
        .expect(200);

      expect(res.body.data).toEqual([]);
      expect(res.body.metadata.total_registros).toBe(0);
    });

    test('debería combinar múltiples filtros', async () => {
      const db = getDb();
      // Este debe pasar todos los filtros
      await insertarReporte(db, { 
        tipo: 'bache', 
        dependencia: 'Obras', 
        creado_en: '2025-12-05T09:00:00.000Z' 
      });
      // Este no pasa el filtro de tipo
      await insertarReporte(db, { 
        tipo: 'alumbrado', 
        dependencia: 'Obras', 
        creado_en: '2025-12-05T09:00:00.000Z' 
      });
      // Este no pasa el filtro de dependencia
      await insertarReporte(db, { 
        tipo: 'bache', 
        dependencia: 'Agua', 
        creado_en: '2025-12-05T09:00:00.000Z' 
      });
      // Este no pasa el filtro de fecha
      await insertarReporte(db, { 
        tipo: 'bache', 
        dependencia: 'Obras', 
        creado_en: '2025-11-01T09:00:00.000Z' 
      });

      const res = await request(app)
        .get('/api/reportes/heatmap-temporal?agrupacion=hora&tipo=bache&from=2025-12-01&dependencia=Obras')
        .expect(200);

      expect(res.body.metadata.agrupacion).toBe('hora');
      expect(res.body.metadata.filtros.tipos).toContain('bache');
      expect(res.body.metadata.filtros.from).toBe('2025-12-01');
      expect(res.body.metadata.filtros.dependencia).toBe('Obras');
      
      const total = res.body.data.reduce((acc, d) => acc + d.cantidad, 0);
      expect(total).toBe(1);
    });
  });

  describe('Casos de uso típicos', () => {
    test('Dashboard: identificar horas pico', async () => {
      const db = getDb();
      // Simular patrón típico: más reportes en mañana y tarde
      for (let i = 0; i < 5; i++) {
        await insertarReporte(db, { creado_en: `2025-12-08T08:${10 + i}:00.000Z` });
      }
      for (let i = 0; i < 8; i++) {
        await insertarReporte(db, { creado_en: `2025-12-08T09:${10 + i}:00.000Z` });
      }
      for (let i = 0; i < 3; i++) {
        await insertarReporte(db, { creado_en: `2025-12-08T14:${10 + i}:00.000Z` });
      }

      const res = await request(app)
        .get('/api/reportes/heatmap-temporal?agrupacion=hora')
        .expect(200);

      // Hora 9 debería ser la hora pico
      const hora9 = res.body.data.find(d => d.periodo === 9);
      expect(hora9.cantidad).toBe(8);
    });

    test('Análisis: comparar actividad entre dependencias', async () => {
      const db = getDb();
      for (let i = 0; i < 10; i++) {
        await insertarReporte(db, { dependencia: 'Obras', creado_en: '2025-12-08T10:00:00.000Z' });
      }
      for (let i = 0; i < 5; i++) {
        await insertarReporte(db, { dependencia: 'Agua', creado_en: '2025-12-08T10:00:00.000Z' });
      }

      const resObras = await request(app)
        .get('/api/reportes/heatmap-temporal?dependencia=Obras')
        .expect(200);
      
      const resAgua = await request(app)
        .get('/api/reportes/heatmap-temporal?dependencia=Agua')
        .expect(200);

      const totalObras = resObras.body.data.reduce((acc, d) => acc + d.cantidad, 0);
      const totalAgua = resAgua.body.data.reduce((acc, d) => acc + d.cantidad, 0);
      
      expect(totalObras).toBe(10);
      expect(totalAgua).toBe(5);
    });
  });
});

