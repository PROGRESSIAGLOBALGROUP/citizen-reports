/**
 * Script de prueba para verificar que los iconos de tipos de reporte
 * se muestren correctamente en el mapa de VerReporte.jsx
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../data.db');
const db = new sqlite3.Database(dbPath);

console.log('🧪 TEST: Verificación de iconos de tipos de reporte en mapa\n');
console.log('=' .repeat(70));

// Test 1: Verificar que todos los tipos tienen iconos
console.log('\n📋 Test 1: Verificar que todos los tipos tienen iconos definidos');
db.all(`SELECT tipo, nombre, icono, color FROM tipos_reporte ORDER BY tipo`, (err, tipos) => {
  if (err) {
    console.error('❌ Error al consultar tipos:', err);
    return;
  }

  console.log(`✅ Encontrados ${tipos.length} tipos de reporte\n`);
  
  let sinIcono = 0;
  let sinColor = 0;
  
  tipos.forEach(tipo => {
    const statusIcono = tipo.icono ? '✅' : '❌';
    const statusColor = tipo.color ? '✅' : '⚠️';
    
    console.log(`${statusIcono} ${tipo.tipo.padEnd(25)} | ${tipo.icono || 'SIN ICONO'} | ${tipo.nombre}`);
    console.log(`   Color: ${statusColor} ${tipo.color || 'SIN COLOR (usará #6b7280)'}`);
    
    if (!tipo.icono) sinIcono++;
    if (!tipo.color) sinColor++;
  });
  
  console.log('\n📊 Resumen:');
  console.log(`   Total tipos: ${tipos.length}`);
  console.log(`   Con icono: ${tipos.length - sinIcono} (${Math.round((tipos.length - sinIcono) / tipos.length * 100)}%)`);
  console.log(`   Sin icono: ${sinIcono}`);
  console.log(`   Con color: ${tipos.length - sinColor} (${Math.round((tipos.length - sinColor) / tipos.length * 100)}%)`);
  console.log(`   Sin color: ${sinColor}`);
  
  if (sinIcono > 0) {
    console.log(`\n⚠️  ADVERTENCIA: ${sinIcono} tipo(s) sin icono. Se mostrará 📍 por defecto.`);
  }
  
  // Test 2: Verificar reportes existentes y sus iconos
  console.log('\n' + '='.repeat(70));
  console.log('\n📋 Test 2: Verificar reportes existentes y sus iconos');
  
  db.all(`
    SELECT 
      r.id,
      r.tipo,
      r.descripcion_corta,
      r.lat,
      r.lng,
      t.icono,
      t.color,
      t.nombre as tipo_nombre
    FROM reportes r
    LEFT JOIN tipos_reporte t ON r.tipo = t.tipo
    ORDER BY r.id DESC
    LIMIT 10
  `, (err, reportes) => {
    if (err) {
      console.error('❌ Error al consultar reportes:', err);
      db.close();
      return;
    }
    
    console.log(`✅ Últimos ${reportes.length} reportes:\n`);
    
    reportes.forEach(rep => {
      const status = rep.icono ? '✅' : '❌';
      console.log(`${status} Reporte #${rep.id} - ${rep.tipo}`);
      console.log(`   Icono: ${rep.icono || '❌ SIN ICONO'} | Color: ${rep.color || '⚠️ SIN COLOR'}`);
      console.log(`   Tipo: ${rep.tipo_nombre || rep.tipo}`);
      console.log(`   Ubicación: ${rep.lat}, ${rep.lng}`);
      console.log(`   Descripción: ${rep.descripcion_corta || 'Sin descripción'}\n`);
    });
    
    // Test 3: Simular carga del componente VerReporte
    console.log('='.repeat(70));
    console.log('\n📋 Test 3: Simular carga de datos en VerReporte.jsx');
    
    const reporteId = reportes[0]?.id;
    if (!reporteId) {
      console.log('❌ No hay reportes para probar');
      db.close();
      return;
    }
    
    db.get(`
      SELECT 
        r.*,
        t.icono,
        t.color,
        t.nombre as tipo_nombre
      FROM reportes r
      LEFT JOIN tipos_reporte t ON r.tipo = t.tipo
      WHERE r.id = ?
    `, [reporteId], (err, reporte) => {
      if (err) {
        console.error('❌ Error:', err);
        db.close();
        return;
      }
      
      console.log(`\n✅ Simulando carga de Reporte #${reporteId}:`);
      console.log(`\n📍 Datos que recibirá el componente:`);
      console.log(JSON.stringify({
        id: reporte.id,
        tipo: reporte.tipo,
        tipoInfo: {
          icono: reporte.icono || '📍',
          color: reporte.color || '#6b7280',
          nombre: reporte.tipo_nombre || reporte.tipo
        },
        descripcion_corta: reporte.descripcion_corta,
        lat: reporte.lat,
        lng: reporte.lng
      }, null, 2));
      
      console.log(`\n🗺️  HTML del marcador que se generará:`);
      const tipoInfo = {
        icono: reporte.icono || '📍',
        color: reporte.color || '#6b7280'
      };
      
      console.log(`
<div style="
  background: linear-gradient(135deg, ${tipoInfo.color} 0%, ${tipoInfo.color}dd 100%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 4px 16px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
">
  ${tipoInfo.icono}
</div>
      `);
      
      // Test 4: Verificar endpoint /tipos
      console.log('\n' + '='.repeat(70));
      console.log('\n📋 Test 4: Verificar que el endpoint /tipos devuelva iconos');
      
      db.all(`SELECT tipo, nombre, icono, color FROM tipos_reporte`, (err, tiposApi) => {
        if (err) {
          console.error('❌ Error:', err);
          db.close();
          return;
        }
        
        console.log(`\n✅ Respuesta simulada del endpoint GET /tipos:`);
        console.log(JSON.stringify(tiposApi.slice(0, 5), null, 2));
        console.log(`\n... (${tiposApi.length} tipos en total)`);
        
        // Test final
        console.log('\n' + '='.repeat(70));
        console.log('\n✅ PRUEBAS COMPLETADAS\n');
        
        const todosTienenIcono = tiposApi.every(t => t.icono);
        const todosTienenColor = tiposApi.every(t => t.color);
        
        if (todosTienenIcono && todosTienenColor) {
          console.log('✅ RESULTADO: Todos los tipos tienen icono y color configurados');
          console.log('✅ Los marcadores en el mapa deberían mostrarse correctamente');
        } else {
          console.log('⚠️  RESULTADO: Algunos tipos no tienen icono o color');
          console.log('⚠️  Se usarán valores por defecto (📍 y #6b7280)');
        }
        
        console.log('\n📝 Para probar en el navegador:');
        console.log('   1. Inicia el servidor: npm run dev (en /server)');
        console.log('   2. Inicia el cliente: npm run dev (en /client)');
        console.log('   3. Navega a un reporte: http://localhost:5173/#reporte/' + reporteId);
        console.log('   4. Verifica que el marcador muestre el icono: ' + (reporte.icono || '📍'));
        
        db.close();
      });
    });
  });
});
