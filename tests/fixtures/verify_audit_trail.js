/**
 * Verificación rápida del Audit Trail - ADR-0010
 */

const sqlite3 = require('./server/node_modules/sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'data.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Verificando Audit Trail (ADR-0010)\n');
console.log('='.repeat(70));

// Query 1: Últimas 5 entradas de asignación/desasignación
const sql1 = `
  SELECT 
    h.id,
    h.tipo_cambio,
    h.campo_modificado,
    h.valor_anterior,
    h.valor_nuevo,
    h.razon,
    u.nombre as usuario_nombre,
    h.metadatos,
    h.creado_en
  FROM historial_cambios h
  JOIN usuarios u ON h.usuario_id = u.id
  WHERE h.tipo_cambio IN ('asignacion', 'desasignacion')
  ORDER BY h.creado_en DESC
  LIMIT 5
`;

db.all(sql1, [], (err, rows) => {
  if (err) {
    console.error('❌ Error:', err.message);
    db.close();
    return;
  }

  console.log(`\n📊 Últimas ${rows.length} entradas de asignación/desasignación:\n`);

  if (rows.length === 0) {
    console.log('⚠️  No hay entradas de asignación/desasignación en el audit trail');
  } else {
    rows.forEach((row, index) => {
      console.log(`${index + 1}. [${row.tipo_cambio.toUpperCase()}] Reporte ID: (ver campo_modificado)`);
      console.log(`   📝 Campo: ${row.campo_modificado}`);
      console.log(`   👤 Usuario: ${row.usuario_nombre}`);
      console.log(`   ⬅️  Valor anterior: ${row.valor_anterior || 'null'}`);
      console.log(`   ➡️  Valor nuevo: ${row.valor_nuevo || 'null'}`);
      console.log(`   💬 Razón: ${row.razon}`);
      console.log(`   🕒 Fecha: ${row.creado_en}`);
      
      if (row.metadatos) {
        try {
          const meta = JSON.parse(row.metadatos);
          console.log(`   🔍 Metadata:`);
          console.log(`      - IP: ${meta.ip || 'N/A'}`);
          console.log(`      - Dependencia: ${meta.dependencia || 'N/A'}`);
          console.log(`      - User-Agent: ${meta.user_agent ? meta.user_agent.substring(0, 50) + '...' : 'N/A'}`);
          if (meta.asignado_por_nombre) {
            console.log(`      - Asignado por: ${meta.asignado_por_nombre}`);
          }
        } catch (e) {
          console.log(`   🔍 Metadata: ${row.metadatos.substring(0, 50)}...`);
        }
      }
      console.log('');
    });
  }

  // Query 2: Estadísticas
  const sql2 = `
    SELECT 
      tipo_cambio,
      COUNT(*) as total
    FROM historial_cambios
    WHERE tipo_cambio IN ('asignacion', 'desasignacion')
    GROUP BY tipo_cambio
  `;

  db.all(sql2, [], (err2, stats) => {
    if (err2) {
      console.error('❌ Error en estadísticas:', err2.message);
    } else {
      console.log('='.repeat(70));
      console.log('📈 Estadísticas del Audit Trail:\n');
      stats.forEach(stat => {
        console.log(`   ${stat.tipo_cambio}: ${stat.total} entradas`);
      });
    }

    // Query 3: Verificar metadata
    const sql3 = `
      SELECT COUNT(*) as con_metadata
      FROM historial_cambios
      WHERE tipo_cambio = 'asignacion' AND metadatos IS NOT NULL
    `;

    db.get(sql3, [], (err3, result) => {
      if (err3) {
        console.error('❌ Error verificando metadata:', err3.message);
      } else {
        console.log(`   Asignaciones con metadata: ${result.con_metadata}`);
      }

      console.log('\n' + '='.repeat(70));
      console.log('✅ Verificación completada');
      
      db.close();
    });
  });
});
