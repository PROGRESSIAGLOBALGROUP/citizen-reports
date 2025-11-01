// Script de prueba para el sistema de identificación y prevención de duplicados
// Ejecutar: node scripts/test_identificacion.js

import { getDb } from '../server/db.js';

console.log('🔍 Probando sistema de identificación y detección de duplicados');
console.log('=====================================================\n');

const db = getDb();

// 1. Verificar las nuevas columnas
console.log('1️⃣ Verificando columnas de identificación:');
db.get("PRAGMA table_info(reportes)", (err, rows) => {
  if (err) {
    console.error('Error al obtener info de tabla:', err);
    return;
  }
  
  db.all("PRAGMA table_info(reportes)", (err, columns) => {
    if (err) {
      console.error('Error:', err);
      return;
    }
    
    console.log('📋 Columnas disponibles:');
    columns.forEach(col => {
      const isNew = ['ip_cliente', 'user_agent', 'fingerprint', 'sesion_id'].includes(col.name);
      console.log(`   ${isNew ? '🆕' : '  '} ${col.name} (${col.type})`);
    });
    
    // 2. Ver reportes recientes con datos de identificación
    console.log('\n2️⃣ Reportes con datos de identificación:');
    
    const sql = `
      SELECT id, tipo, lat, lng, creado_en, 
             ip_cliente, 
             SUBSTR(user_agent, 1, 30) as user_agent_corto,
             fingerprint, 
             sesion_id
      FROM reportes 
      WHERE ip_cliente IS NOT NULL OR fingerprint IS NOT NULL
      ORDER BY datetime(creado_en) DESC 
      LIMIT 5
    `;
    
    db.all(sql, (err, reportesConId) => {
      if (err) {
        console.error('Error al consultar reportes:', err);
        return;
      }
      
      if (reportesConId && reportesConId.length > 0) {
        console.log('📊 Reportes con identificación:');
        reportesConId.forEach(r => {
          console.log(`   🆔 ID: ${r.id} | IP: ${r.ip_cliente || 'N/A'} | Fingerprint: ${r.fingerprint ? r.fingerprint.substring(0, 8) + '...' : 'N/A'}`);
          console.log(`      📍 ${r.tipo} en (${r.lat}, ${r.lng}) - ${r.creado_en}`);
        });
      } else {
        console.log('   ℹ️  No hay reportes con datos de identificación aún');
        console.log('   💡 Crea un reporte desde el formulario para probar el sistema');
      }
      
      // 3. Estadísticas de identificación
      console.log('\n3️⃣ Estadísticas de identificación:');
      
      const statsQueries = [
        { label: 'Total reportes', sql: 'SELECT COUNT(*) as count FROM reportes' },
        { label: 'Con IP', sql: 'SELECT COUNT(*) as count FROM reportes WHERE ip_cliente IS NOT NULL' },
        { label: 'Con fingerprint', sql: 'SELECT COUNT(*) as count FROM reportes WHERE fingerprint IS NOT NULL' },
        { label: 'Con sesión ID', sql: 'SELECT COUNT(*) as count FROM reportes WHERE sesion_id IS NOT NULL' },
        { label: 'Últimas 24h', sql: "SELECT COUNT(*) as count FROM reportes WHERE datetime(creado_en) > datetime('now', '-24 hours')" }
      ];
      
      let completed = 0;
      const results = {};
      
      statsQueries.forEach(({ label, sql }) => {
        db.get(sql, (err, result) => {
          if (err) {
            console.error(`Error en ${label}:`, err);
          } else {
            results[label] = result.count;
          }
          
          completed++;
          if (completed === statsQueries.length) {
            console.log('📈 Estadísticas:');
            Object.entries(results).forEach(([label, count]) => {
              console.log(`   📊 ${label}: ${count}`);
            });
            
            console.log('\n✅ Prueba de identificación completada');
            console.log('\n💡 Para probar detección de duplicados:');
            console.log('   1. Ve a http://localhost:5173/#reportar');
            console.log('   2. Crea un reporte');
            console.log('   3. Inmediatamente crea otro similar');
            console.log('   4. Observa las advertencias en la respuesta');
            
            db.close();
          }
        });
      });
    });
  });
});