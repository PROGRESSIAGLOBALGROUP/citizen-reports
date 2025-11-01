/**
 * Script para aplicar migración 003: Audit Trail
 * Ejecutar: node server/migrations/aplicar-migracion-003.js
 */

import { getDb } from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function aplicarMigracion() {
  const db = getDb();

  console.log('\n🔄 Aplicando Migración 003: Audit Trail\n');

  try {
    // Leer archivo SQL
    const sqlPath = path.join(__dirname, '003-audit-trail.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Ejecutar migración
    await new Promise((resolve, reject) => {
      db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('✅ Tabla historial_cambios creada');
    console.log('✅ Índices creados');
    console.log('✅ Vista v_historial_completo creada');

    // Verificar que la tabla existe
    const tablaExiste = await new Promise((resolve, reject) => {
      db.get(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='historial_cambios'
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!tablaExiste) {
      throw new Error('La tabla historial_cambios no se creó correctamente');
    }

    // Contar registros (debe ser 0 en nueva instalación)
    const count = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as total FROM historial_cambios', (err, row) => {
        if (err) reject(err);
        else resolve(row.total);
      });
    });

    console.log(`\n📊 Registros actuales en historial_cambios: ${count}`);
    console.log('\n✅ Migración 003 aplicada exitosamente\n');

    db.close();
  } catch (error) {
    console.error('\n❌ Error aplicando migración:', error.message);
    db.close();
    process.exit(1);
  }
}

aplicarMigracion();
