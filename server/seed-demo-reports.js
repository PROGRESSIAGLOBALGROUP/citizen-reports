#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.db');

// Coordenadas reales de citizen-reports, Morelos (centro: 18.7 - 18.8 N, -99.1 - -99.2 W)
const DEMO_REPORTS = [
  // Baches (zona norte)
  { tipo: 'bache', lat: 18.7254, lng: -99.1452, desc: 'Bache grande en Calle Principal, esquina con Benito Juárez', desc_corta: 'Bache Calle Principal', dependencia: 'obras_publicas' },
  { tipo: 'bache', lat: 18.7198, lng: -99.1498, desc: 'Bache en Av. Hidalgo, frente a mercado municipal', desc_corta: 'Bache Av. Hidalgo', dependencia: 'obras_publicas' },
  { tipo: 'bache', lat: 18.7312, lng: -99.1385, desc: 'Grietas y baches en Calle Morelos', desc_corta: 'Grietas Calle Morelos', dependencia: 'obras_publicas' },
  { tipo: 'bache', lat: 18.7145, lng: -99.1567, desc: 'Bache peligroso en Calle 5 de Mayo', desc_corta: 'Bache Calle 5 de Mayo', dependencia: 'obras_publicas' },
  
  // Alumbrado (zona centro y sur)
  { tipo: 'alumbrado', lat: 18.7215, lng: -99.1425, desc: 'Farola rota en plaza central', desc_corta: 'Farola rota Plaza', dependencia: 'servicios_publicos' },
  { tipo: 'alumbrado', lat: 18.7289, lng: -99.1598, desc: 'Poste de luz sin funcionar en Calle Zaragoza', desc_corta: 'Poste sin luz Zaragoza', dependencia: 'servicios_publicos' },
  { tipo: 'alumbrado', lat: 18.7078, lng: -99.1523, desc: 'Varias farolas sin luz en Parque recreativo', desc_corta: 'Farolas apagadas Parque', dependencia: 'servicios_publicos' },
  
  // Agua (zona este)
  { tipo: 'agua', lat: 18.7398, lng: -99.1258, desc: 'Fuga de agua en tubería principal, Calle Revolución', desc_corta: 'Fuga Calle Revolución', dependencia: 'agua_potable' },
  { tipo: 'agua', lat: 18.7125, lng: -99.1612, desc: 'Hidrante roto en Av. 16 de Septiembre', desc_corta: 'Hidrante roto Av. 16 Sep', dependencia: 'agua_potable' },
  { tipo: 'agua', lat: 18.7256, lng: -99.1745, desc: 'Acumulación de agua en peatonal cercano a escuela', desc_corta: 'Encharcamiento escuela', dependencia: 'agua_potable' },
  
  // Basura (zona oeste)
  { tipo: 'basura', lat: 18.7287, lng: -99.1189, desc: 'Basura acumulada en esquina de Calle Flores', desc_corta: 'Basura Calle Flores', dependencia: 'servicios_publicos' },
  { tipo: 'basura', lat: 18.7165, lng: -99.1421, desc: 'Contenedores llenos sin recolección', desc_corta: 'Contenedores llenos', dependencia: 'servicios_publicos' },
  
  // Seguridad (varias zonas)
  { tipo: 'seguridad', lat: 18.7340, lng: -99.1425, desc: 'Falta de vigilancia en parque central por las noches', desc_corta: 'Falta vigilancia parque', dependencia: 'seguridad_publica' },
  { tipo: 'seguridad', lat: 18.7089, lng: -99.1598, desc: 'Delincuencia en zona residencial', desc_corta: 'Delincuencia zona res.', dependencia: 'seguridad_publica' },
  
  // Transporte (varias zonas)
  { tipo: 'transporte', lat: 18.7223, lng: -99.1535, desc: 'Semáforo roto en intersección peligrosa', desc_corta: 'Semáforo roto', dependencia: 'transito' },
  { tipo: 'transporte', lat: 18.7341, lng: -99.1298, desc: 'Señalización vial confusa en rotonda', desc_corta: 'Señalización rotonda', dependencia: 'transito' },
  
  // Aseo (centro)
  { tipo: 'aseo', lat: 18.7206, lng: -99.1443, desc: 'Plaza central sucia y descuidada', desc_corta: 'Plaza sucia', dependencia: 'servicios_publicos' },
  { tipo: 'aseo', lat: 18.7412, lng: -99.1356, desc: 'Falta de limpieza en calles del norte', desc_corta: 'Calles sucias norte', dependencia: 'servicios_publicos' },
];

function seed() {
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('❌ Error abriendo DB:', err.message);
      process.exit(1);
    }

    console.log(`📥 Insertando ${DEMO_REPORTS.length} reportes de demo en ${DB_PATH}...`);

    // Primero verificar si ya hay reportes
    db.get('SELECT COUNT(*) as count FROM reportes', (err, row) => {
      if (err) {
        console.error('❌ Error verificando reportes:', err);
        db.close();
        process.exit(1);
      }

      if (row.count > 0) {
        console.log(`⚠️  Ya hay ${row.count} reportes en la BD. Limpiando...`);
        db.run('DELETE FROM reportes', (err) => {
          if (err) {
            console.error('❌ Error limpiando reportes:', err);
            db.close();
            process.exit(1);
          }
          insertReports();
        });
      } else {
        insertReports();
      }
    });

    function insertReports() {
      // Usar transacción para mayor velocidad
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          console.error('❌ Error iniciando transacción:', err);
          db.close();
          process.exit(1);
        }

        let inserted = 0;
        const stmt = db.prepare(`
          INSERT INTO reportes (tipo, descripcion, descripcion_corta, lat, lng, peso, estado, dependencia, prioridad)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        DEMO_REPORTS.forEach((report, idx) => {
          const randomPriority = ['baja', 'media', 'alta'][Math.floor(Math.random() * 3)];
          const randomEstado = ['nuevo', 'en_proceso', 'cerrado'][Math.floor(Math.random() * 3)];
          const randomPeso = [1, 1, 1, 2, 2, 3][Math.floor(Math.random() * 6)];

          stmt.run(
            [
              report.tipo,
              report.desc,
              report.desc_corta,
              report.lat,
              report.lng,
              randomPeso,
              randomEstado,
              report.dependencia,
              randomPriority,
            ],
            (err) => {
              if (err) {
                console.error(`❌ Error insertando reporte ${idx}:`, err);
              } else {
                inserted++;
              }
            }
          );
        });

        stmt.finalize((err) => {
          if (err) {
            console.error('❌ Error finalizando statement:', err);
            db.run('ROLLBACK', () => db.close());
            process.exit(1);
          }

          db.run('COMMIT', (err) => {
            if (err) {
              console.error('❌ Error en COMMIT:', err);
              db.close();
              process.exit(1);
            }

            // Verificar que se insertaron
            db.get('SELECT COUNT(*) as count FROM reportes', (err, row) => {
              if (err) {
                console.error('❌ Error verificando inserciones:', err);
              } else {
                console.log(`✅ ${row.count} reportes insertados exitosamente`);
                console.log('📍 Coordenadas centro citizen-reports: 18.7° N, -99.14° W');
                console.log('🎯 Próximo: http://localhost:4000');
              }
              db.close();
              process.exit(0);
            });
          });
        });
      });
    }
  });
}

seed();
