/**
 * Análisis de reportes con tipo='agua' (legacy)
 * Parte de ADR-0008: Consolidación de tipos relacionados con agua
 * 
 * Objetivo: Determinar si hay reportes con tipo='agua' que deban reclasificarse
 */

import { getDb } from '../db.js';

// Palabras clave para clasificación automática
const PALABRAS_FALTA_AGUA = [
  'no llega', 'sin agua', 'no hay agua', 'sin suministro', 
  'corte', 'suspendido', 'no tenemos', 'falta', 'sin servicio',
  'no sale', 'baja presión', 'presión baja'
];

const PALABRAS_FUGA_AGUA = [
  'fuga', 'tubería rota', 'tubo roto', 'derrame', 'se sale', 
  'goteo', 'desperdicio', 'perdida', 'escape', 'tirando agua',
  'charco', 'inundado por fuga'
];

const PALABRAS_ALCANTARILLA = [
  'drenaje', 'coladera', 'registro', 'tapa', 'inundación',
  'alcantarilla', 'aguas negras', 'desagüe', 'cloaca',
  'tapa de registro', 'pozo'
];

/**
 * Sugiere clasificación basada en palabras clave
 */
function sugerirClasificacion(descripcion) {
  if (!descripcion) return 'indeterminado';
  
  const desc = descripcion.toLowerCase();
  
  // Contar matches por categoría
  const scoresFalta = PALABRAS_FALTA_AGUA.filter(p => desc.includes(p)).length;
  const scoresFuga = PALABRAS_FUGA_AGUA.filter(p => desc.includes(p)).length;
  const scoresAlcantarilla = PALABRAS_ALCANTARILLA.filter(p => desc.includes(p)).length;
  
  // Determinar categoría con mayor score
  const maxScore = Math.max(scoresFalta, scoresFuga, scoresAlcantarilla);
  
  if (maxScore === 0) return 'indeterminado';
  if (scoresFuga === maxScore) return 'fuga_agua';
  if (scoresFalta === maxScore) return 'falta_agua';
  if (scoresAlcantarilla === maxScore) return 'alcantarilla';
  
  return 'indeterminado';
}

/**
 * Analiza todos los reportes con tipo='agua'
 */
async function analizarReportes() {
  const db = getDb();
  
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, tipo, descripcion, creado_en 
       FROM reportes 
       WHERE tipo = ? 
       ORDER BY creado_en DESC`,
      ['agua'],
      (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        console.log('\n📊 Análisis de Reportes con tipo="agua"\n');
        console.log('='.repeat(60));
        
        if (rows.length === 0) {
          console.log('✅ No se encontraron reportes con tipo="agua"');
          console.log('   El sistema ya está usando tipos específicos (falta_agua, fuga_agua)');
          console.log('\n✅ NO se requiere migración de datos\n');
          resolve([]);
          return;
        }
        
        console.log(`\n⚠️  Se encontraron ${rows.length} reporte(s) con tipo="agua"\n`);
        
        const clasificacion = {
          falta_agua: [],
          fuga_agua: [],
          alcantarilla: [],
          indeterminado: []
        };
        
        rows.forEach((row) => {
          const sugerencia = sugerirClasificacion(row.descripcion);
          clasificacion[sugerencia].push(row);
          
          console.log(`📍 Reporte #${row.id}`);
          console.log(`   Fecha: ${row.creado_en}`);
          console.log(`   Descripción: ${row.descripcion || '(sin descripción)'}`);
          console.log(`   ➜ Sugerencia: ${sugerencia}`);
          console.log('   ' + '-'.repeat(56));
        });
        
        console.log('\n📊 Resumen de Clasificación:\n');
        console.log(`   🔵 Falta de Agua:  ${clasificacion.falta_agua.length} reporte(s)`);
        console.log(`   💦 Fuga de Agua:   ${clasificacion.fuga_agua.length} reporte(s)`);
        console.log(`   🕳️  Alcantarilla:   ${clasificacion.alcantarilla.length} reporte(s)`);
        console.log(`   ❓ Indeterminado:  ${clasificacion.indeterminado.length} reporte(s)`);
        
        if (clasificacion.indeterminado.length > 0) {
          console.log('\n⚠️  ATENCIÓN: Hay reportes que requieren revisión manual\n');
          clasificacion.indeterminado.forEach((row) => {
            console.log(`   Reporte #${row.id}: "${row.descripcion}"`);
          });
        }
        
        console.log('\n📝 Script SQL de Migración:\n');
        console.log('-- Ejecutar SOLO después de revisión manual\n');
        
        ['falta_agua', 'fuga_agua', 'alcantarilla'].forEach((nuevoTipo) => {
          if (clasificacion[nuevoTipo].length > 0) {
            const ids = clasificacion[nuevoTipo].map(r => r.id).join(', ');
            console.log(`UPDATE reportes SET tipo = '${nuevoTipo}' WHERE id IN (${ids});`);
          }
        });
        
        console.log('\n' + '='.repeat(60) + '\n');
        
        resolve(clasificacion);
      }
    );
  });
}

// Ejecutar análisis
analizarReportes()
  .then(() => {
    console.log('✅ Análisis completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en análisis:', error);
    process.exit(1);
  });
