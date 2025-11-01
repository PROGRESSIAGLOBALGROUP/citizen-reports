// Verificar reportes de seguridad en la base de datos
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'data.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error al conectar a la base de datos:', err.message);
    process.exit(1);
  }
});

db.all("SELECT id, tipo, descripcion, dependencia FROM reportes WHERE tipo = 'seguridad'", (err, rows) => {
  if (err) {
    console.error('❌ Error:', err.message);
  } else {
    console.log('\n🚨 Reportes de seguridad:\n');
    rows.forEach(reporte => {
      console.log(`ID ${reporte.id}: ${reporte.descripcion}`);
      console.log(`   🏛️  Dependencia: ${reporte.dependencia}`);
      console.log('');
    });
    
    console.log('✅ Ahora puedes iniciar sesión con:');
    console.log('   📧 func.seguridad1@jantetelco.gob.mx');
    console.log('   🔑 admin123');
    console.log('\nY hacer clic en los reportes de seguridad para ver el botón "Ver Reporte"');
  }
  db.close();
});
