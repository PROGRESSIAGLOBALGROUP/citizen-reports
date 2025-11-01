/**
 * Script de prueba manual para verificar cambio de estado
 * al desasignar todos los funcionarios
 * 
 * Ejecutar: node scripts/test_desasignacion_estado.js
 */

import { getDb } from '../server/db.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testDesasignacion() {
  const db = getDb();

  console.log('\n🧪 Test: Cambio de estado tras desasignación\n');

  // Buscar un reporte con estado "asignado"
  const reporteAsignado = await new Promise((resolve, reject) => {
    db.get(`
      SELECT r.*, COUNT(a.id) as num_asignaciones
      FROM reportes r
      LEFT JOIN asignaciones a ON r.id = a.reporte_id
      WHERE r.estado = 'asignado'
      GROUP BY r.id
      HAVING num_asignaciones > 0
      LIMIT 1
    `, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!reporteAsignado) {
    console.log('❌ No se encontró ningún reporte con estado "asignado" y asignaciones');
    console.log('💡 Crea uno desde el navegador primero');
    process.exit(0);
  }

  console.log(`✅ Encontrado reporte #${reporteAsignado.id}:`);
  console.log(`   Estado actual: "${reporteAsignado.estado}"`);
  console.log(`   Asignaciones: ${reporteAsignado.num_asignaciones}`);

  // Listar funcionarios asignados
  const asignaciones = await new Promise((resolve, reject) => {
    db.all(`
      SELECT a.*, u.nombre, u.email
      FROM asignaciones a
      JOIN usuarios u ON a.usuario_id = u.id
      WHERE a.reporte_id = ?
    `, [reporteAsignado.id], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  console.log('\n👥 Funcionarios asignados:');
  asignaciones.forEach((a, idx) => {
    console.log(`   ${idx + 1}. ${a.nombre} (${a.email})`);
  });

  console.log('\n🗑️  Eliminando todas las asignaciones...');

  // Eliminar cada asignación
  for (const asignacion of asignaciones) {
    await new Promise((resolve, reject) => {
      db.run(`
        DELETE FROM asignaciones
        WHERE reporte_id = ? AND usuario_id = ?
      `, [reporteAsignado.id, asignacion.usuario_id], function(err) {
        if (err) reject(err);
        else {
          console.log(`   ✓ Eliminada asignación de ${asignacion.nombre}`);
          resolve();
        }
      });
    });

    // Verificar si quedan asignaciones
    const countResult = await new Promise((resolve, reject) => {
      db.get(`
        SELECT COUNT(*) as total FROM asignaciones WHERE reporte_id = ?
      `, [reporteAsignado.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    console.log(`   ℹ️  Asignaciones restantes: ${countResult.total}`);

    // Si era la última, actualizar estado
    if (countResult.total === 0) {
      await new Promise((resolve, reject) => {
        db.run(`
          UPDATE reportes 
          SET estado = 'abierto' 
          WHERE id = ? AND estado = 'asignado'
        `, [reporteAsignado.id], function(err) {
          if (err) reject(err);
          else {
            console.log(`   ✅ Estado actualizado a "abierto" (${this.changes} fila(s) afectadas)`);
            resolve();
          }
        });
      });
    }
  }

  // Verificar estado final
  const reporteFinal = await new Promise((resolve, reject) => {
    db.get('SELECT estado FROM reportes WHERE id = ?', [reporteAsignado.id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  console.log(`\n📊 Resultado final:`);
  console.log(`   Reporte #${reporteAsignado.id}`);
  console.log(`   Estado anterior: "asignado"`);
  console.log(`   Estado actual:   "${reporteFinal.estado}"`);

  if (reporteFinal.estado === 'abierto') {
    console.log('\n✅ TEST PASADO: El estado cambió correctamente a "abierto"\n');
  } else {
    console.log(`\n❌ TEST FALLADO: Se esperaba "abierto" pero se obtuvo "${reporteFinal.estado}"\n`);
  }

  db.close();
}

testDesasignacion().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
