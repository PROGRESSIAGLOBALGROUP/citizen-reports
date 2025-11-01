#!/usr/bin/env node
/**
 * Análisis de reportes con tipo='seguridad' para planificar consolidación
 * 
 * Propósito:
 * - Identificar cuántos reportes tienen tipo='seguridad'
 * - Analizar descripciones para sugerir reclasificación
 * - Generar reporte detallado sin modificar datos
 * 
 * Uso:
 *   node server/migrations/007-analizar-reportes-seguridad.js
 */

import { getDb } from '../db.js';

// Palabras clave para clasificación automática
const PALABRAS_DELITO = [
  'robo', 'asalto', 'vandalismo', 'droga', 'narcótico',
  'violencia', 'agresión', 'delincuencia', 'pandilla'
];

const PALABRAS_ACCIDENTE = [
  'choque', 'atropello', 'colisión', 'accidente', 'volcadura',
  'lesionado', 'herido', 'ambulancia', 'atención médica'
];

const PALABRAS_INSEGURIDAD = [
  'oscuro', 'patrulla', 'vigilancia', 'inseguridad', 'miedo',
  'sospechoso', 'iluminación', 'peligroso', 'zona roja'
];

/**
 * Sugiere clasificación basada en análisis de descripción
 */
function sugerirClasificacion(descripcion) {
  const desc = descripcion.toLowerCase();
  
  // Contar coincidencias por categoría
  const scoreDelito = PALABRAS_DELITO.filter(p => desc.includes(p)).length;
  const scoreAccidente = PALABRAS_ACCIDENTE.filter(p => desc.includes(p)).length;
  const scoreInseguridad = PALABRAS_INSEGURIDAD.filter(p => desc.includes(p)).length;
  
  // Determinar categoría con mayor score
  const maxScore = Math.max(scoreDelito, scoreAccidente, scoreInseguridad);
  
  if (maxScore === 0) {
    return { 
      sugerencia: 'inseguridad', 
      confianza: 'baja',
      razon: 'Sin palabras clave específicas, asume inseguridad general'
    };
  }
  
  if (scoreDelito === maxScore) {
    return { 
      sugerencia: 'delito', 
      confianza: scoreDelito >= 2 ? 'alta' : 'media',
      razon: `Palabras clave de delito: ${scoreDelito}`
    };
  }
  
  if (scoreAccidente === maxScore) {
    return { 
      sugerencia: 'accidente', 
      confianza: scoreAccidente >= 2 ? 'alta' : 'media',
      razon: `Palabras clave de accidente: ${scoreAccidente}`
    };
  }
  
  return { 
    sugerencia: 'inseguridad', 
    confianza: scoreInseguridad >= 2 ? 'alta' : 'media',
    razon: `Palabras clave de inseguridad: ${scoreInseguridad}`
  };
}

/**
 * Analiza todos los reportes con tipo='seguridad'
 */
function analizarReportes() {
  const db = getDb();
  
  console.log('📊 Análisis de Reportes con tipo="seguridad"\n');
  console.log('='.repeat(70));
  console.log('\n');
  
  // Consultar reportes
  db.all(
    `SELECT id, tipo, descripcion, descripcion_corta, lat, lng, estado, dependencia, creado_en
     FROM reportes 
     WHERE tipo = 'seguridad'
     ORDER BY creado_en DESC`,
    [],
    (err, reportes) => {
      if (err) {
        console.error('❌ Error al consultar reportes:', err.message);
        db.close();
        process.exit(1);
      }
      
      if (reportes.length === 0) {
        console.log('✅ No se encontraron reportes con tipo="seguridad"');
        console.log('   El sistema ya está usando tipos específicos (inseguridad, accidente, delito)');
        db.close();
        process.exit(0);
      }
      
      console.log(`📝 Encontrados ${reportes.length} reporte(s) con tipo="seguridad"\n`);
      
      // Estadísticas de clasificación
      const clasificacion = {
        delito: [],
        accidente: [],
        inseguridad: []
      };
      
      // Analizar cada reporte
      reportes.forEach((reporte, index) => {
        console.log(`\n${'─'.repeat(70)}`);
        console.log(`Reporte #${reporte.id}`);
        console.log(`${'─'.repeat(70)}`);
        console.log(`📅 Creado: ${new Date(reporte.creado_en).toLocaleDateString('es-MX')}`);
        console.log(`📍 Ubicación: (${reporte.lat}, ${reporte.lng})`);
        console.log(`🏛️  Dependencia: ${reporte.dependencia || 'No asignada'}`);
        console.log(`📊 Estado: ${reporte.estado}`);
        console.log(`\n📝 Descripción corta:`);
        console.log(`   "${reporte.descripcion_corta || 'N/A'}"`);
        console.log(`\n📖 Descripción completa:`);
        console.log(`   "${reporte.descripcion}"`);
        
        // Sugerir clasificación
        const analisis = sugerirClasificacion(reporte.descripcion);
        clasificacion[analisis.sugerencia].push(reporte.id);
        
        console.log(`\n💡 Sugerencia de clasificación:`);
        console.log(`   🎯 Tipo sugerido: ${analisis.sugerencia}`);
        console.log(`   🔍 Confianza: ${analisis.confianza}`);
        console.log(`   ℹ️  Razón: ${analisis.razon}`);
      });
      
      // Resumen final
      console.log(`\n\n${'='.repeat(70)}`);
      console.log('📊 RESUMEN DE CLASIFICACIÓN SUGERIDA');
      console.log(`${'='.repeat(70)}\n`);
      
      console.log(`🚔 delito: ${clasificacion.delito.length} reporte(s)`);
      if (clasificacion.delito.length > 0) {
        console.log(`   IDs: ${clasificacion.delito.join(', ')}`);
      }
      
      console.log(`\n🚗 accidente: ${clasificacion.accidente.length} reporte(s)`);
      if (clasificacion.accidente.length > 0) {
        console.log(`   IDs: ${clasificacion.accidente.join(', ')}`);
      }
      
      console.log(`\n🚨 inseguridad: ${clasificacion.inseguridad.length} reporte(s)`);
      if (clasificacion.inseguridad.length > 0) {
        console.log(`   IDs: ${clasificacion.inseguridad.join(', ')}`);
      }
      
      console.log(`\n${'='.repeat(70)}`);
      console.log('📋 PRÓXIMOS PASOS');
      console.log(`${'='.repeat(70)}\n`);
      
      console.log('1. Revisar manualmente las clasificaciones sugeridas');
      console.log('2. Ajustar si es necesario en el script de migración');
      console.log('3. Ejecutar: node server/migrations/007-migrar-reportes-seguridad.js');
      console.log('\n⚠️  IMPORTANTE: Se recomienda hacer backup antes de migrar:');
      console.log('   npm run backup:db\n');
      
      db.close();
    }
  );
}

// Ejecutar análisis
analizarReportes();
