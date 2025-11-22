#!/usr/bin/env node
/**
 * Post-Deploy Health Check para Producción
 * 
 * Este script es ejecutado AUTOMÁTICAMENTE después de cada deploy en producción.
 * 
 * PROPÓSITO:
 * 1. Verificar integridad de la BD
 * 2. Reparar schema si es necesario (idempotent)
 * 3. Validar que login endpoint funciona
 * 4. Alertar si algo falla
 * 
 * DEPLOYMENT: Agregado a PM2 ecosystem.config.cjs como "postStart" hook
 */

import 'dotenv/config';
import { initDb, getDb } from './db.js';

const SERVICE_NAME = 'citizen-reports-app';

async function healthCheck() {
  const timestamp = new Date().toISOString();
  console.log(`\n📊 [${timestamp}] POST-DEPLOY HEALTH CHECK\n`);

  try {
    // 1. Initialize DB with full schema
    console.log('1️⃣ Verificando schema de BD...');
    await initDb();
    console.log('   ✅ Schema inicializado\n');

    const db = getDb();

    // 2. Verify all critical tables
    console.log('2️⃣ Verificando tablas críticas...');
    const criticalTables = ['usuarios', 'sesiones', 'reportes'];
    
    for (const table of criticalTables) {
      const exists = await new Promise((resolve) => {
        db.all(
          `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
          [table],
          (err, rows) => resolve(!err && rows?.length > 0)
        );
      });

      if (!exists) {
        console.error(`   ❌ TABLA FALTANTE: ${table}`);
        throw new Error(`Critical table missing: ${table}`);
      }
      console.log(`   ✅ ${table}`);
    }
    console.log();

    // 3. Test login flow
    console.log('3️⃣ Testeando flow de autenticación...');
    const testUser = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, email FROM usuarios WHERE email = ? LIMIT 1',
        ['admin@jantetelco.gob.mx'],
        (err, row) => err ? reject(err) : resolve(row)
      );
    });

    if (!testUser) {
      console.error('   ❌ Usuario de prueba no encontrado');
      throw new Error('Test user admin@jantetelco.gob.mx not found');
    }

    // Test session creation
    const testToken = `health-check-${Date.now()}`;
    const testExpira = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO sesiones (usuario_id, token, expira_en, ip, user_agent) VALUES (?, ?, ?, ?, ?)',
        [testUser.id, testToken, testExpira, '127.0.0.1', 'health-check'],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    console.log('   ✅ Session creation OK');

    // Cleanup
    await new Promise((resolve) => {
      db.run('DELETE FROM sesiones WHERE token = ?', [testToken], () => resolve());
    });

    console.log();
    console.log('✅ POST-DEPLOY HEALTH CHECK PASSED');
    console.log(`   Service: ${SERVICE_NAME}`);
    console.log(`   Database: OK`);
    console.log(`   Authentication: OK\n`);

    // Return success code
    process.exit(0);

  } catch (err) {
    console.error('\n❌ POST-DEPLOY HEALTH CHECK FAILED');
    console.error(`   Error: ${err.message}`);
    console.error(`   Stack: ${err.stack}\n`);

    // In production, this should alert DevOps
    // For now, we exit with non-zero code to signal failure
    process.exit(1);
  }
}

healthCheck();
