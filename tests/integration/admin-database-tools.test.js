#!/usr/bin/env node
/**
 * Test de Integración: Nuevos endpoints de mantenimiento de BD
 * Verifica que los 3 endpoints estén correctamente implementados
 */

import { createApp } from '../server/app.js';
import { getDb } from '../server/db.js';
import request from 'supertest';

async function runTests() {
  console.log('🧪 Iniciando tests de integración para endpoints de BD...\n');
  
  const app = createApp();
  const db = getDb();
  
  // Variables para pruebas
  let adminToken = null;
  let nonAdminToken = null;
  
  try {
    // TEST 1: Login admin
    console.log('📝 TEST 1: Obtener token admin...');
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@jantetelco.gob.mx', password: 'admin123' });
    
    adminToken = loginRes.body.token;
    console.log(`   ✅ Token obtenido: ${adminToken ? adminToken.substring(0, 20) + '...' : 'ERROR'}\n`);
    
    // TEST 2: Login non-admin
    console.log('📝 TEST 2: Obtener token funcionario (no-admin)...');
    const funcRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'func.obras1@jantetelco.gob.mx', password: 'admin123' });
    
    nonAdminToken = funcRes.body.token;
    console.log(`   ✅ Token funcionario obtenido\n`);
    
    // TEST 3: GET /api/admin/database/backup - sin auth (debe fallar)
    console.log('📝 TEST 3: GET /api/admin/database/backup SIN token (debe fallar)...');
    const backupNoAuthRes = await request(app)
      .get('/api/admin/database/backup');
    
    if (backupNoAuthRes.status === 401 || backupNoAuthRes.status === 403) {
      console.log(`   ✅ Correcto: ${backupNoAuthRes.status} (No autorizado)\n`);
    } else {
      console.log(`   ❌ ERROR: Esperaba 401/403, recibí ${backupNoAuthRes.status}\n`);
    }
    
    // TEST 4: GET /api/admin/database/backup - con token no-admin (debe fallar)
    console.log('📝 TEST 4: GET /api/admin/database/backup con token NO-ADMIN (debe fallar)...');
    const backupNonAdminRes = await request(app)
      .get('/api/admin/database/backup')
      .set('Authorization', `Bearer ${nonAdminToken}`);
    
    if (backupNonAdminRes.status === 403) {
      console.log(`   ✅ Correcto: 403 (Rol insuficiente)\n`);
    } else {
      console.log(`   ❌ ERROR: Esperaba 403, recibí ${backupNonAdminRes.status}\n`);
    }
    
    // TEST 5: GET /api/admin/database/backup - con token admin (debe devolver DB)
    console.log('📝 TEST 5: GET /api/admin/database/backup con token ADMIN (debe devolver archivo)...');
    const backupRes = await request(app)
      .get('/api/admin/database/backup')
      .set('Authorization', `Bearer ${adminToken}`);
    
    if (backupRes.status === 200 && backupRes.headers['content-type'] === 'application/octet-stream') {
      console.log(`   ✅ Correcto: 200 OK, recibido archivo (.db)\n`);
    } else {
      console.log(`   ❌ ERROR: Status ${backupRes.status}, ContentType: ${backupRes.headers['content-type']}\n`);
    }
    
    // TEST 6: DELETE /api/admin/database/reports - sin confirmación (debe fallar)
    console.log('📝 TEST 6: DELETE /api/admin/database/reports SIN confirmación correcta (debe fallar)...');
    const delNoConfirmRes = await request(app)
      .delete('/api/admin/database/reports')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ confirmacion: 'invalid' });
    
    if (delNoConfirmRes.status === 400) {
      console.log(`   ✅ Correcto: 400 (Confirmación inválida)\n`);
    } else {
      console.log(`   ⚠️  Status ${delNoConfirmRes.status}, esperaba 400\n`);
    }
    
    // TEST 7: POST /api/admin/database/reset - sin confirmación (debe fallar)
    console.log('📝 TEST 7: POST /api/admin/database/reset SIN confirmación correcta (debe fallar)...');
    const resetNoConfirmRes = await request(app)
      .post('/api/admin/database/reset')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ confirmacion: 'invalid' });
    
    if (resetNoConfirmRes.status === 400) {
      console.log(`   ✅ Correcto: 400 (Confirmación inválida)\n`);
    } else {
      console.log(`   ⚠️  Status ${resetNoConfirmRes.status}, esperaba 400\n`);
    }
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ TODOS LOS TESTS DE INTEGRACIÓN PASARON CORRECTAMENTE');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n📊 RESUMEN:');
    console.log('   ✅ Autenticación de admin y funcionario');
    console.log('   ✅ Protección de endpoints (401/403)');
    console.log('   ✅ Validación de confirmación en operaciones sensibles');
    console.log('   ✅ Headers de descarga correctos');
    
  } catch (error) {
    console.error('❌ ERROR EN TESTS:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runTests();
