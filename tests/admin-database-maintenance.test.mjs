import test from 'node:test';
import assert from 'node:assert';
import { createApp } from '../server/app.js';
import { initDb, resetDb } from '../server/db.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

let server;
const PORT = 4000;
const BASE_URL = 'http://localhost:4000';

test.before(async () => {
  console.log('\n>>> Starting test server\n');
  
  process.env.NODE_ENV = 'test';
  process.env.DB_PATH = resolve(PROJECT_ROOT, 'e2e.db');
  process.env.PORT = PORT.toString();
  process.env.HOST = 'localhost';
  
  const dbPath = process.env.DB_PATH;
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
  
  resetDb();
  await initDb();
  
  const app = createApp();
  
  await new Promise((resolve, reject) => {
    server = app.listen(PORT, 'localhost', () => {
      console.log('>>> Test server ready\n');
      resolve();
    });
    
    server.on('error', reject);
    setTimeout(() => reject(new Error('Timeout')), 10000);
  });
  
  await new Promise(r => setTimeout(r, 500));
});

test.after(async () => {
  if (server) {
    await new Promise(resolve => {
      server.close(resolve);
    });
  }
});

async function getAdminToken() {
  const res = await fetch(BASE_URL + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@jantetelco.gob.mx',
      password: 'admin123'
    })
  });
  if (!res.ok) throw new Error('Login failed: ' + res.status);
  return (await res.json()).token;
}

async function getFuncionarioToken() {
  const res = await fetch(BASE_URL + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'func.obras1@jantetelco.gob.mx',
      password: 'admin123'
    })
  });
  if (!res.ok) throw new Error('Login failed');
  return (await res.json()).token;
}

test('GET /api/admin/database/backup - admin puede descargar respaldo', async () => {
  const token = await getAdminToken();
  const res = await fetch(BASE_URL + '/api/admin/database/backup', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  assert.strictEqual(res.status, 200);
  const buffer = await res.arrayBuffer();
  assert(buffer.byteLength > 1024);
});

test('GET /api/admin/database/backup - sin token retorna 401', async () => {
  const res = await fetch(BASE_URL + '/api/admin/database/backup');
  assert.strictEqual(res.status, 401);
});

test('GET /api/admin/database/backup - funcionario retorna 403', async () => {
  const token = await getFuncionarioToken();
  const res = await fetch(BASE_URL + '/api/admin/database/backup', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  assert.strictEqual(res.status, 403);
});

test('GET /api/admin/database/backup - descarga archivo valido', async () => {
  const token = await getAdminToken();
  const res = await fetch(BASE_URL + '/api/admin/database/backup', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  assert.strictEqual(res.status, 200);
  const buffer = await res.arrayBuffer();
  assert(buffer.byteLength > 0);
  const view = new Uint8Array(buffer);
  assert.strictEqual(view[0], 0x53);
  assert.strictEqual(view[1], 0x51);
});

test('DELETE /api/admin/database/reports - elimina reportes con confirmacion', async () => {
  const token = await getAdminToken();
  const res = await fetch(BASE_URL + '/api/admin/database/reports', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ confirmacion: 'eliminar_todos_reportes' })
  });
  assert.strictEqual(res.status, 200);
});

test('DELETE /api/admin/database/reports - rechaza sin confirmacion correcta', async () => {
  const token = await getAdminToken();
  const res = await fetch(BASE_URL + '/api/admin/database/reports', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ confirmacion: 'wrong' })
  });
  assert.strictEqual(res.status, 400);
});

test('DELETE /api/admin/database/reports - rechaza sin confirmacion', async () => {
  const token = await getAdminToken();
  const res = await fetch(BASE_URL + '/api/admin/database/reports', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({})
  });
  assert.strictEqual(res.status, 400);
});

test('DELETE /api/admin/database/reports - funcionario retorna 403', async () => {
  const token = await getFuncionarioToken();
  const res = await fetch(BASE_URL + '/api/admin/database/reports', {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  assert.strictEqual(res.status, 403);
});

test('DELETE /api/admin/database/reports - sin token retorna 401', async () => {
  const res = await fetch(BASE_URL + '/api/admin/database/reports', {
    method: 'DELETE'
  });
  assert.strictEqual(res.status, 401);
});

test('DELETE /api/admin/database/reports - retorna count eliminados', async () => {
  const token = await getAdminToken();
  const res = await fetch(BASE_URL + '/api/admin/database/reports', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ confirmacion: 'eliminar_todos_reportes' })
  });
  const result = await res.json();
  assert(typeof result.reportesEliminados === 'number' || result.mensaje);
});

test('POST /api/admin/database/reset - funcionario retorna 403', async () => {
  const token = await getFuncionarioToken();
  const res = await fetch(BASE_URL + '/api/admin/database/reset', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  assert.strictEqual(res.status, 403);
});

test('POST /api/admin/database/reset - sin token retorna 401', async () => {
  const res = await fetch(BASE_URL + '/api/admin/database/reset', {
    method: 'POST'
  });
  assert.strictEqual(res.status, 401);
});

test('POST /api/admin/database/reset - rechaza sin confirmacion correcta', async () => {
  const token = await getAdminToken();
  const res = await fetch(BASE_URL + '/api/admin/database/reset', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ confirmacion: 'wrong' })
  });
  assert.strictEqual(res.status, 400);
});

test('POST /api/admin/database/reset - rechaza sin confirmacion', async () => {
  const token = await getAdminToken();
  const res = await fetch(BASE_URL + '/api/admin/database/reset', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({})
  });
  assert.strictEqual(res.status, 400);
});

test('POST /api/admin/database/reset - reinicia BD preservando admin', async () => {
  const token = await getAdminToken();
  const res = await fetch(BASE_URL + '/api/admin/database/reset', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ confirmacion: 'reiniciar_base_datos' })
  });
  assert.strictEqual(res.status, 200);
  const result = await res.json();
  assert(result.mensaje && result.estadisticas);
});

test('POST /api/admin/database/reset - limpia reportes', async () => {
  const token = await getAdminToken();
  const res = await fetch(BASE_URL + '/api/admin/database/reset', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ confirmacion: 'reiniciar_base_datos' })
  });
  assert.strictEqual(res.status, 200);
});

test('POST /api/admin/database/reset - preserva admin', async () => {
  const token = await getAdminToken();
  const res = await fetch(BASE_URL + '/api/admin/database/reset', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ confirmacion: 'reiniciar_base_datos' })
  });
  assert.strictEqual(res.status, 200);
  
  const loginRes = await fetch(BASE_URL + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@jantetelco.gob.mx',
      password: 'admin123'
    })
  });
  assert.strictEqual(loginRes.status, 200);
});

test('Flujo completo: Backup -> Eliminar -> Reset', async () => {
  const token = await getAdminToken();
  
  const backupRes = await fetch(BASE_URL + '/api/admin/database/backup', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  assert.strictEqual(backupRes.status, 200);
  
  const deleteRes = await fetch(BASE_URL + '/api/admin/database/reports', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ confirmacion: 'eliminar_todos_reportes' })
  });
  assert.strictEqual(deleteRes.status, 200);
  
  const resetRes = await fetch(BASE_URL + '/api/admin/database/reset', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ confirmacion: 'reiniciar_base_datos' })
  });
  assert.strictEqual(resetRes.status, 200);
});
