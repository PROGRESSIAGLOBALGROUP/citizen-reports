/**
 * Test de persistencia de datos geocoding
 * 
 * Valida que colonia y código postal se guarden y recuperen correctamente
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Geocoding - Persistencia en BD', () => {
  let initDb;
  let getDb;
  let tmpDir;
  let dbPath;

  beforeAll(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'geocoding-test-'));
    dbPath = path.join(tmpDir, 'test.db');
    process.env.DB_PATH = dbPath;

    ({ initDb, getDb } = await import('../../server/db.js'));
    await initDb();
    
    const { reverseGeocode: importedReverseGeocode } = await import('../../server/geocoding-service.js');
    global.reverseGeocode = importedReverseGeocode;
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
          } catch (err) {
            // Ignore EBUSY errors on Windows - files will be cleaned by OS
            if (err.code !== 'EBUSY') {
              console.error('Error cleaning up temp dir:', err);
            }
          }
          done();
        }, 500);
      });
    } else {
      done();
    }
  });
  
  test('debe guardar y recuperar colonia y código postal de citizen-reports', async () => {
    const db = getDb();
    const reverseGeocode = global.reverseGeocode;
    
    // 1. Obtener datos geocoding para citizen-reports
    const geoResult = await reverseGeocode(18.715, -98.776389);
    expect(geoResult.success).toBe(true);
    
    const { colonia, codigo_postal, municipio } = geoResult.data;
    console.log('🔍 Datos geocoding citizen-reports:', { colonia, codigo_postal, municipio });
    
    // 2. Insertar reporte con estos datos
    const result = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO reportes 
          (tipo, lat, lng, colonia, codigo_postal, municipio, estado_ubicacion, peso, estado) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['baches', 18.715, -98.776389, colonia || null, codigo_postal, municipio, 'Morelos', 1, 'abierto'],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
    
    const reporteId = result;
    console.log('📝 Reporte guardado con ID:', reporteId);
    
    // 3. Recuperar el reporte
    const reporte = await new Promise((resolve, reject) => {
      db.get(
        `SELECT id, colonia, codigo_postal, municipio FROM reportes WHERE id = ?`,
        [reporteId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    console.log('✅ Reporte recuperado:', reporte);
    
    // 4. Validar que los datos se recuperan correctamente
    expect(reporte).toBeDefined();
    expect(reporte.codigo_postal).toBe(codigo_postal);
    expect(reporte.municipio).toBe(municipio);
    
    // Limpiar
    await new Promise((resolve, reject) => {
      db.run(`DELETE FROM reportes WHERE id = ?`, [reporteId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }, 20000);

  test('debe guardar y recuperar datos de CDMX con colonia', async () => {
    const db = getDb();
    const reverseGeocode = global.reverseGeocode;
    
    // 1. Obtener datos geocoding para CDMX
    const geoResult = await reverseGeocode(19.432600, -99.133200);
    expect(geoResult.success).toBe(true);
    
    const { colonia, codigo_postal, municipio } = geoResult.data;
    console.log('🔍 Datos geocoding CDMX:', { colonia, codigo_postal, municipio });
    
    // Validar que hay colonia en CDMX
    expect(colonia).toBeTruthy();
    expect(codigo_postal).toBeTruthy();
    
    // 2. Insertar reporte
    const result = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO reportes 
          (tipo, lat, lng, colonia, codigo_postal, municipio, estado_ubicacion, peso, estado) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['baches', 19.432600, -99.133200, colonia, codigo_postal, municipio, 'Ciudad de México', 1, 'abierto'],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
    
    const reporteId = result;
    
    // 3. Recuperar
    const reporte = await new Promise((resolve, reject) => {
      db.get(
        `SELECT id, colonia, codigo_postal, municipio FROM reportes WHERE id = ?`,
        [reporteId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    console.log('✅ Reporte CDMX recuperado:', reporte);
    
    // 4. Validar
    expect(reporte.colonia).toBe('Centro');
    expect(reporte.codigo_postal).toBe('06060');  // Nominatim retorna 06060 para Centro CDMX
    
    // Limpiar
    await new Promise((resolve, reject) => {
      db.run(`DELETE FROM reportes WHERE id = ?`, [reporteId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }, 20000);

  test('debe listar reportes con códigos postales correctos', async () => {
    const db = getDb();
    const reverseGeocode = global.reverseGeocode;
    
    // 1. Insertar 2 reportes en diferentes ubicaciones
    const insertions = [];
    
    const jantetelcoGeo = await reverseGeocode(18.715, -98.776389);
    const cdmxGeo = await reverseGeocode(19.432600, -99.133200);
    
    // citizen-reports
    const janId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO reportes 
          (tipo, lat, lng, colonia, codigo_postal, municipio, estado_ubicacion, peso, estado) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['baches', 18.715, -98.776389, jantetelcoGeo.data.colonia || null, jantetelcoGeo.data.codigo_postal, 'citizen-reports', 'Morelos', 1, 'abierto'],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
    
    // CDMX
    const cdmxId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO reportes 
          (tipo, lat, lng, colonia, codigo_postal, municipio, estado_ubicacion, peso, estado) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['baches', 19.432600, -99.133200, cdmxGeo.data.colonia, cdmxGeo.data.codigo_postal, 'Ciudad de México', 'Ciudad de México', 1, 'abierto'],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
    
    // 2. Listar todos los reportes
    const reportes = await new Promise((resolve, reject) => {
      db.all(
        `SELECT id, municipio, codigo_postal, colonia FROM reportes WHERE id IN (?, ?)`,
        [janId, cdmxId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    console.log('📊 Reportes en BD:', reportes);
    
    // 3. Validar que ambos tienen código postal
    expect(reportes.length).toBe(2);
    
    const janReporte = reportes.find(r => r.id === janId);
    const cdmxReporte = reportes.find(r => r.id === cdmxId);
    
    expect(janReporte.codigo_postal).toBeTruthy(); // '62935'
    expect(cdmxReporte.codigo_postal).toBeTruthy(); // '06060'
    
    // CDMX debe tener colonia
    expect(cdmxReporte.colonia).toBeTruthy();
    
    // Limpiar
    await new Promise((resolve, reject) => {
      db.run(`DELETE FROM reportes WHERE id IN (?, ?)`, [janId, cdmxId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }, 25000);
});
