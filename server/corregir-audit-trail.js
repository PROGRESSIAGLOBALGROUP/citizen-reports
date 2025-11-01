/**
 * Script para corregir registros de audit trail con valores incorrectos
 * Específicamente para el reporte #12 que tiene valores como "asignaciones" y "s"
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data.db');

function getDb() {
  return new sqlite3.Database(DB_PATH);
}

async function corregirHistorial() {
  const db = getDb();

  console.log('🔍 Buscando registros de audit trail con valores incorrectos...\n');

  // Obtener todos los registros del reporte #12
  db.all(
    `SELECT h.*, u.nombre as usuario_nombre, r.tipo, r.descripcion
     FROM historial_cambios h
     LEFT JOIN usuarios u ON h.usuario_id = u.id
     LEFT JOIN reportes r ON h.reporte_id = r.id
     WHERE h.reporte_id = 12
     ORDER BY h.creado_en ASC`,
    [],
    async (err, registros) => {
      if (err) {
        console.error('❌ Error:', err);
        db.close();
        return;
      }

      console.log(`📊 Encontrados ${registros.length} registros para el reporte #12:\n`);

      // Analizar cada registro
      for (const reg of registros) {
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`ID: ${reg.id}`);
        console.log(`Tipo: ${reg.tipo_cambio}`);
        console.log(`Campo: ${reg.campo_modificado}`);
        console.log(`Anterior: "${reg.valor_anterior}"`);
        console.log(`Nuevo: "${reg.valor_nuevo}"`);
        console.log(`Razón: ${reg.razon}`);
        console.log(`Usuario: ${reg.usuario_nombre}`);
        console.log(`Fecha: ${reg.creado_en}`);

        // Detectar problemas
        const problemas = [];
        
        if (reg.campo_modificado === 'asignaciones') {
          problemas.push('⚠️  Campo "asignaciones" debería ser "funcionario_asignado"');
        }
        
        if (reg.valor_anterior && !isNaN(reg.valor_anterior) && reg.tipo_cambio === 'asignacion') {
          problemas.push('⚠️  Valor anterior es un ID numérico, debería ser nombre legible');
        }
        
        if (reg.valor_nuevo === 's' || reg.valor_nuevo === 'S') {
          problemas.push('🔴 Valor nuevo es "s" - dato corrupto');
        }
        
        if (reg.valor_nuevo && !isNaN(reg.valor_nuevo) && reg.valor_nuevo.length < 3) {
          problemas.push('⚠️  Valor nuevo parece ser un ID en lugar de nombre');
        }

        if (problemas.length > 0) {
          console.log('\n❌ Problemas detectados:');
          problemas.forEach(p => console.log(`   ${p}`));
        } else {
          console.log('\n✅ Registro OK');
        }
      }

      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
      console.log('📋 Resumen de Correcciones Recomendadas:\n');
      console.log('1. Los registros con valores incorrectos fueron creados con código antiguo');
      console.log('2. El código ya fue corregido para futuros registros');
      console.log('3. Opciones:');
      console.log('   a) Dejar los registros antiguos como están (histórico)');
      console.log('   b) Eliminar los registros incorrectos del reporte #12');
      console.log('   c) Intentar una reasignación nueva para generar historial correcto\n');

      // Preguntar si eliminar
      console.log('💡 Recomendación: Eliminar registros incorrectos y hacer nueva reasignación');
      console.log('   Comando sugerido:');
      console.log('   DELETE FROM historial_cambios WHERE reporte_id = 12;\n');

      db.close();
    }
  );
}

// Función adicional: Limpiar historial de reporte específico
async function limpiarHistorialReporte(reporteId) {
  const db = getDb();
  
  db.run(
    'DELETE FROM historial_cambios WHERE reporte_id = ?',
    [reporteId],
    function(err) {
      if (err) {
        console.error('❌ Error eliminando historial:', err);
      } else {
        console.log(`✅ Eliminados ${this.changes} registros del historial del reporte #${reporteId}`);
        console.log('💡 Ahora puedes hacer una nueva reasignación para generar historial correcto');
      }
      db.close();
    }
  );
}

// Ejecutar según argumentos
const args = process.argv.slice(2);

if (args.includes('--limpiar')) {
  const reporteId = args.find(arg => !arg.startsWith('--'));
  if (reporteId) {
    console.log(`🗑️  Limpiando historial del reporte #${reporteId}...\n`);
    limpiarHistorialReporte(parseInt(reporteId));
  } else {
    console.error('❌ Uso: node corregir-audit-trail.js --limpiar <reporte_id>');
  }
} else {
  corregirHistorial();
}
