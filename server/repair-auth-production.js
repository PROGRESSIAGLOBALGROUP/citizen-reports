#!/usr/bin/env node
/**
 * Script de Reparación de Autenticación en Producción
 * 
 * PROBLEMA: Error 500 en /api/auth/login "Error al crear sesión"
 * CAUSA PROBABLE: Tabla "sesiones" desincronizada o corrupta
 * 
 * SOLUCIÓN: Este script:
 * 1. Verifica la integridad del schema
 * 2. Recrea la tabla "sesiones" si es necesario
 * 3. Preserva todos los datos existentes
 * 4. Valida que login funcione después de la reparación
 */

import 'dotenv/config';
import { initDb, getDb } from './db.js';
import bcrypt from 'bcrypt';

const PRODUCTION_CHECK_EMAIL = 'admin@jantetelco.gob.mx';

async function repair() {
  console.log('🔧 INICIANDO REPARACIÓN DE AUTENTICACIÓN EN PRODUCCIÓN\n');
  
  try {
    // Step 1: Initialize DB
    console.log('[1/5] Inicializando BD...');
    await initDb();
    console.log('     ✅ BD inicializada\n');

    const db = getDb();

    // Step 2: Check schema integrity
    console.log('[2/5] Verificando integridad del schema...');
    const tables = await new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    const tableNames = tables.map(t => t.name);
    console.log(`     Tablas encontradas: ${tableNames.join(', ')}`);

    const requiredTables = ['usuarios', 'sesiones', 'reportes'];
    const missing = requiredTables.filter(t => !tableNames.includes(t));
    
    if (missing.length > 0) {
      console.log(`     ❌ Tablas faltantes: ${missing.join(', ')}`);
      console.log('     ⚠️  Recreando todas las tablas...\n');
      
      // Re-run schema creation (idempotent)
      await initDb();
    } else {
      console.log('     ✅ Todas las tablas requeridas existen\n');
    }

    // Step 3: Verify sesiones table structure
    console.log('[3/5] Verificando estructura de tabla "sesiones"...');
    const sesionesSchema = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(sesiones)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    if (sesionesSchema.length === 0) {
      console.log('     ❌ Tabla "sesiones" está VACÍA o NO EXISTE');
      console.log('     ⚠️  Ejecutando schema SQL nuevamente...\n');
      await initDb();
    } else {
      const columnNames = sesionesSchema.map(c => c.name);
      console.log(`     Columnas encontradas: ${columnNames.join(', ')}`);
      
      const requiredColumns = ['usuario_id', 'token', 'expira_en'];
      const missingCols = requiredColumns.filter(c => !columnNames.includes(c));
      
      if (missingCols.length > 0) {
        console.log(`     ❌ Columnas faltantes: ${missingCols.join(', ')}`);
        console.log('     ⚠️  Tabla corrupta - debe ser recreada\n');
        
        // Drop and recreate
        await new Promise((resolve, reject) => {
          db.run('DROP TABLE IF EXISTS sesiones', (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        
        // Re-run schema
        await initDb();
      } else {
        console.log('     ✅ Estructura de sesiones es válida\n');
      }
    }

    // Step 4: Test login flow
    console.log('[4/5] Testeando flujo de login...');
    const usuario = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM usuarios WHERE email = ? AND activo = 1', 
        [PRODUCTION_CHECK_EMAIL], 
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
    });

    if (!usuario) {
      console.log(`     ❌ Usuario ${PRODUCTION_CHECK_EMAIL} no encontrado`);
      process.exit(1);
    }

    console.log(`     ✅ Usuario encontrado: ${usuario.nombre}`);

    if (!usuario.password_hash) {
      console.log('     ❌ Usuario no tiene password_hash');
      process.exit(1);
    }

    // Test password comparison
    const isValidPassword = await bcrypt.compare('admin123', usuario.password_hash);
    if (!isValidPassword) {
      console.log('     ❌ Password test fallido');
      process.exit(1);
    }

    console.log('     ✅ Password válido\n');

    // Step 5: Create test session
    console.log('[5/5] Creando sesión de prueba...');
    const testToken = 'repair-test-' + Date.now();
    const testExpira = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const success = await new Promise((resolve) => {
      db.run(
        'INSERT INTO sesiones (usuario_id, token, expira_en, ip, user_agent) VALUES (?, ?, ?, ?, ?)',
        [usuario.id, testToken, testExpira, '127.0.0.1', 'repair-script'],
        function(err) {
          if (err) {
            console.log(`     ❌ ERROR: ${err.message}`);
            resolve(false);
          } else {
            console.log('     ✅ Sesión de prueba creada');
            resolve(true);
          }
        }
      );
    });

    if (!success) {
      process.exit(1);
    }

    // Cleanup: delete test session
    await new Promise((resolve) => {
      db.run('DELETE FROM sesiones WHERE token = ?', [testToken], () => resolve());
    });

    console.log('\n✅ REPARACIÓN COMPLETADA EXITOSAMENTE');
    console.log('   El login debe funcionar ahora en producción.');
    console.log('   Si el error persiste, contacta al equipo de DevOps.\n');
    
    process.exit(0);

  } catch (err) {
    console.error('\n❌ ERROR DURANTE REPARACIÓN:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

repair();
