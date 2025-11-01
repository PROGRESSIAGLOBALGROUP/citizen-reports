/**
 * Verificar estado de la base de datos
 */

const sqlite3 = require('./server/node_modules/sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'data.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Verificando estado de la base de datos\n');
console.log('='.repeat(70));

// 1. Verificar categorías
db.all('SELECT * FROM categorias WHERE activo = 1 ORDER BY orden', [], (err, categorias) => {
  if (err) {
    console.error('❌ Error al leer categorías:', err.message);
  } else {
    console.log(`\n📂 CATEGORÍAS (${categorias.length} activas):`);
    if (categorias.length === 0) {
      console.log('   ⚠️  No hay categorías activas en la DB');
    } else {
      categorias.forEach(cat => {
        console.log(`   ${cat.id}. ${cat.nombre} (orden: ${cat.orden}, icono: ${cat.icono})`);
      });
    }
  }
  
  // 2. Verificar tipos de reporte
  db.all('SELECT * FROM tipos_reporte WHERE activo = 1 ORDER BY categoria_id, orden', [], (err2, tipos) => {
    if (err2) {
      console.error('❌ Error al leer tipos:', err2.message);
    } else {
      console.log(`\n📝 TIPOS DE REPORTE (${tipos.length} activos):`);
      if (tipos.length === 0) {
        console.log('   ⚠️  No hay tipos de reporte activos en la DB');
      } else {
        tipos.forEach(tipo => {
          console.log(`   ${tipo.id}. [Cat ${tipo.categoria_id}] ${tipo.nombre} (valor: "${tipo.valor}")`);
        });
      }
    }
    
    // 3. Verificar usuarios
    db.all('SELECT id, nombre, email, rol, dependencia, activo FROM usuarios', [], (err3, usuarios) => {
      if (err3) {
        console.error('❌ Error al leer usuarios:', err3.message);
      } else {
        console.log(`\n👤 USUARIOS (${usuarios.length} total):`);
        usuarios.forEach(u => {
          const estado = u.activo ? '✅' : '❌';
          console.log(`   ${estado} ${u.id}. ${u.nombre} (${u.email}) - ${u.rol} - ${u.dependencia}`);
        });
      }
      
      // 4. Verificar reportes
      db.all('SELECT COUNT(*) as total FROM reportes', [], (err4, result) => {
        if (err4) {
          console.error('❌ Error contando reportes:', err4.message);
        } else {
          console.log(`\n📊 REPORTES: ${result[0].total} total`);
        }
        
        // 5. Verificar estructura de tablas
        db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", [], (err5, tables) => {
          if (err5) {
            console.error('❌ Error listando tablas:', err5.message);
          } else {
            console.log(`\n🗄️  TABLAS EN DB (${tables.length}):`);
            tables.forEach(t => {
              console.log(`   - ${t.name}`);
            });
          }
          
          console.log('\n' + '='.repeat(70));
          console.log('✅ Verificación completada\n');
          
          db.close();
        });
      });
    });
  });
});
