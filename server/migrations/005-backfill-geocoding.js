/**
 * Migration: Backfill Geocoding Data
 * 
 * Este script actualiza reportes existentes que no tienen datos de geocoding
 * (colonia, código postal, municipio, estado) usando el servicio de Nominatim.
 * 
 * Uso:
 *   node migrations/005-backfill-geocoding.js
 *   node migrations/005-backfill-geocoding.js --dry-run  # Solo mostrar qué se actualizaría
 * 
 * Respeta rate limiting de Nominatim (1 request por segundo)
 */

import { getDb } from '../db.js';
import { reverseGeocode } from '../geocoding-service.js';

const DRY_RUN = process.argv.includes('--dry-run');
const DELAY_MS = 1100; // 1.1 segundos entre requests para respetar rate limit

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function backfillGeocodingData() {
  console.log('🌍 Iniciando backfill de datos de geocoding...');
  console.log(DRY_RUN ? '⚠️  MODO DRY-RUN: No se harán cambios' : '✏️  MODO REAL: Se actualizarán los registros');
  console.log('');

  const db = getDb();
  
  // Obtener reportes sin datos de municipio
  const reportesSinGeo = await new Promise((resolve, reject) => {
    db.all(
      `SELECT id, lat, lng, colonia, codigo_postal, municipio, estado_ubicacion 
       FROM reportes 
       WHERE (municipio IS NULL OR municipio = '') 
       ORDER BY id ASC`,
      [],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });

  console.log(`📊 Encontrados ${reportesSinGeo.length} reportes sin datos de geocoding`);
  console.log('');

  let actualizados = 0;
  let errores = 0;
  let sinDatos = 0;

  for (const reporte of reportesSinGeo) {
    console.log(`\n📍 Procesando reporte #${reporte.id} (${reporte.lat}, ${reporte.lng})...`);
    
    try {
      const result = await reverseGeocode(reporte.lat, reporte.lng);
      
      if (result.success && result.data) {
        const { colonia, codigo_postal, municipio, estado_ubicacion } = result.data;
        
        console.log(`   ✅ Datos obtenidos:`);
        console.log(`      Colonia: ${colonia || 'N/A'}`);
        console.log(`      CP: ${codigo_postal || 'N/A'}`);
        console.log(`      Municipio: ${municipio || 'N/A'}`);
        console.log(`      Estado: ${estado_ubicacion || 'N/A'}`);
        
        if (!DRY_RUN) {
          await new Promise((resolve, reject) => {
            db.run(
              `UPDATE reportes SET 
                colonia = COALESCE(?, colonia),
                codigo_postal = COALESCE(?, codigo_postal),
                municipio = COALESCE(?, municipio),
                estado_ubicacion = COALESCE(?, estado_ubicacion)
               WHERE id = ?`,
              [colonia, codigo_postal, municipio, estado_ubicacion, reporte.id],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
          console.log(`   💾 Reporte #${reporte.id} actualizado`);
        }
        
        actualizados++;
      } else {
        console.log(`   ⚠️ Sin datos para estas coordenadas: ${result.error || 'razón desconocida'}`);
        sinDatos++;
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      errores++;
    }
    
    // Respetar rate limit de Nominatim
    await sleep(DELAY_MS);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE MIGRACIÓN');
  console.log('='.repeat(60));
  console.log(`   Total procesados: ${reportesSinGeo.length}`);
  console.log(`   ✅ Actualizados: ${actualizados}`);
  console.log(`   ⚠️ Sin datos disponibles: ${sinDatos}`);
  console.log(`   ❌ Errores: ${errores}`);
  console.log('='.repeat(60));
  
  if (DRY_RUN) {
    console.log('\n💡 Para aplicar los cambios, ejecuta sin --dry-run');
  }
  
  process.exit(0);
}

backfillGeocodingData().catch(error => {
  console.error('❌ Error fatal en migración:', error);
  process.exit(1);
});
