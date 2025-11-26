#!/usr/bin/env node
/**
 * Seed script para agregar datos de prueba a e2e.db
 * Crea reportes asignados a funcionarios para que los tests E2E no sean skipped
 */
import { getDb } from '../server/db.js';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function seedE2EReports() {
  const db = getDb();

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1. Crear reportes de prueba
      const reportes = [
        {
          tipo: 'baches',
          descripcion: 'Bache de prueba E2E - citizen-reports',
          lat: 18.7160,
          lng: -98.7760,
          peso: 4,
          estado: 'abierto',
          dependencia: 'obras_publicas',
          municipio: 'citizen-reports'
        },
        {
          tipo: 'baches',
          descripcion: 'Segundo bache para navegación',
          lat: 18.7140,
          lng: -98.7780,
          peso: 3,
          estado: 'asignado',
          dependencia: 'obras_publicas',
          municipio: 'citizen-reports'
        },
        {
          tipo: 'alumbrado',
          descripcion: 'Lámpara fundida - Prueba E2E',
          lat: 18.7155,
          lng: -98.7765,
          peso: 2,
          estado: 'abierto',
          dependencia: 'servicios_publicos',
          municipio: 'citizen-reports'
        },
        {
          tipo: 'agua',
          descripcion: 'Fuga de agua - Estado pendiente_cierre',
          lat: 18.7140,
          lng: -98.7770,
          peso: 4,
          estado: 'pendiente_cierre',
          dependencia: 'agua_potable',
          municipio: 'citizen-reports'
        },
        {
          tipo: 'limpieza',
          descripcion: 'Basura acumulada - Estado cerrado',
          lat: 18.7150,
          lng: -98.7775,
          peso: 3,
          estado: 'cerrado',
          dependencia: 'limpieza',
          municipio: 'citizen-reports'
        }
      ];

      // Insertar reportes
      reportes.forEach((reporte, idx) => {
        db.run(
          `INSERT INTO reportes 
            (tipo, descripcion, lat, lng, peso, estado, dependencia, municipio, creado_en)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
          [
            reporte.tipo,
            reporte.descripcion,
            reporte.lat,
            reporte.lng,
            reporte.peso,
            reporte.estado,
            reporte.dependencia,
            reporte.municipio
          ],
          function(err) {
            if (err) {
              console.error(`❌ Error al insertar reporte ${idx + 1}:`, err.message);
              reject(err);
            } else {
              console.log(
                `✅ Reporte ${idx + 1} insertado con ID: ${this.lastID}`
              );

              // Si es uno de los primeros 2, asignarlo al funcionario de prueba
              if (idx < 2) {
                const reporteId = this.lastID;
                db.run(
                  `INSERT INTO asignaciones (reporte_id, usuario_id)
                   SELECT ?, id FROM usuarios 
                   WHERE email = 'func.obras1@jantetelco.gob.mx'`,
                  [reporteId],
                  (err) => {
                    if (err) {
                      console.error(
                        `❌ Error al asignar reporte ${reporteId}:`,
                        err.message
                      );
                    } else {
                      console.log(
                        `✅ Reporte ${reporteId} asignado a func.obras1@jantetelco.gob.mx`
                      );
                    }
                  }
                );
              }
            }
          }
        );
      });

      // Callback cuando todas las operaciones terminen
      db.all(
        'SELECT COUNT(*) as count FROM reportes',
        (err, rows) => {
          if (err) {
            console.error('❌ Error verificando reportes:', err.message);
            reject(err);
          } else {
            console.log(
              `\n✅ Seed completado. Total reportes en BD: ${rows[0].count}`
            );
            resolve();
          }
        }
      );
    });
  });
}

// Ejecutar seed si se llama directamente
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedE2EReports()
    .then(() => {
      console.log('✅ E2E seed completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en seed E2E:', error);
      process.exit(1);
    });
}

export { seedE2EReports };
