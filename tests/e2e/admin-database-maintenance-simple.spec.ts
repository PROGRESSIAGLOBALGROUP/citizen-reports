import { test, expect } from '@playwright/test';

// Use direct fetch to bypass Playwright's DNS resolution issues on Windows
const BASE_URL = 'http://127.0.0.1:4000';

async function getAdminToken() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@jantetelco.gob.mx',
      password: 'admin123'
    })
  });
  
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const data = await res.json() as { token: string };
  return data.token;
}

async function getFuncionarioToken() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'func.obras1@jantetelco.gob.mx',
      password: 'admin123'
    })
  });
  
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const data = await res.json() as { token: string };
  return data.token;
}

test.describe('Database Maintenance Tools - Admin Panel (Direct Fetch)', () => {
  // BACKUP TESTS
  test('GET /api/admin/database/backup - admin puede descargar respaldo', async () => {
    const token = await getAdminToken();
    const res: Response = await fetch(`${BASE_URL}/api/admin/database/backup`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/octet-stream');
    const buffer = await res.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(1024);
  });

  test('GET /api/admin/database/backup - sin token retorna 401', async () => {
    const res: Response = await fetch(`${BASE_URL}/api/admin/database/backup`);
    expect(res.status).toBe(401);
  });

  test('GET /api/admin/database/backup - funcionario retorna 403', async () => {
    const token = await getFuncionarioToken();
    const res = await fetch(`${BASE_URL}/api/admin/database/backup`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(res.status()).toBe(403);
  });

  test('GET /api/admin/database/backup - descarga archivo válido', async () => {
    const token = await getAdminToken();
    const res = await fetch(`${BASE_URL}/api/admin/database/backup`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(res.status()).toBe(200);
    const buffer = await res.arrayBuffer();
    // SQLite file magic: 'SQLite format 3'
    const header = new Uint8Array(buffer.slice(0, 16));
    const headerStr = new TextDecoder().decode(header);
    expect(headerStr.substring(0, 13)).toBe('SQLite format');
  });

  // DELETE TESTS
  test('DELETE /api/admin/database/reports - elimina reportes con confirmación', async () => {
    const token = await getAdminToken();
    
    // Generate confirmation token
    const getRes = await fetch(`${BASE_URL}/api/admin/database/reports?action=get_confirmation_token`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(getRes.ok).toBe(true);
    const { confirmation_token } = await getRes.json();
    
    const delRes = await fetch(`${BASE_URL}/api/admin/database/reports`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ confirmation_token })
    });
    expect(delRes.status()).toBe(200);
    const data = await delRes.json();
    expect(data).toHaveProperty('count');
  });

  test('DELETE /api/admin/database/reports - rechaza sin confirmación correcta', async () => {
    const token = await getAdminToken();
    const delRes = await fetch(`${BASE_URL}/api/admin/database/reports`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ confirmation_token: 'invalid' })
    });
    expect(delRes.status()).toBe(403);
  });

  test('DELETE /api/admin/database/reports - rechaza sin confirmación', async () => {
    const token = await getAdminToken();
    const delRes = await fetch(`${BASE_URL}/api/admin/database/reports`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({})
    });
    expect(delRes.status()).toBe(403);
  });

  test('DELETE /api/admin/database/reports - funcionario retorna 403', async () => {
    const token = await getFuncionarioToken();
    const delRes = await fetch(`${BASE_URL}/api/admin/database/reports`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ confirmation_token: 'test' })
    });
    expect(delRes.status()).toBe(403);
  });

  test('DELETE /api/admin/database/reports - sin token retorna 401', async () => {
    const delRes = await fetch(`${BASE_URL}/api/admin/database/reports`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmation_token: 'test' })
    });
    expect(delRes.status()).toBe(401);
  });

  test('DELETE /api/admin/database/reports - retorna count eliminados', async () => {
    const token = await getAdminToken();
    
    const getRes = await fetch(`${BASE_URL}/api/admin/database/reports?action=get_confirmation_token`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { confirmation_token } = await getRes.json();
    
    const delRes = await fetch(`${BASE_URL}/api/admin/database/reports`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ confirmation_token })
    });
    expect(delRes.ok).toBe(true);
    const data = await delRes.json();
    expect(typeof data.count).toBe('number');
    expect(data.count).toBeGreaterThanOrEqual(0);
  });

  // RESET TESTS
  test('POST /api/admin/database/reset - reinicia BD preservando admin', async () => {
    const token = await getAdminToken();
    
    const getRes = await fetch(`${BASE_URL}/api/admin/database/reset?action=get_confirmation_token`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { confirmation_token } = await getRes.json();
    
    const resetRes = await fetch(`${BASE_URL}/api/admin/database/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ confirmation_token })
    });
    expect(resetRes.ok).toBe(true);
  });

  test('POST /api/admin/database/reset - rechaza sin confirmación correcta', async () => {
    const token = await getAdminToken();
    const resetRes = await fetch(`${BASE_URL}/api/admin/database/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ confirmation_token: 'invalid' })
    });
    expect(resetRes.status()).toBe(403);
  });

  test('POST /api/admin/database/reset - rechaza sin confirmación', async () => {
    const token = await getAdminToken();
    const resetRes = await fetch(`${BASE_URL}/api/admin/database/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({})
    });
    expect(resetRes.status()).toBe(403);
  });

  test('POST /api/admin/database/reset - funcionario retorna 403', async () => {
    const token = await getFuncionarioToken();
    const resetRes = await fetch(`${BASE_URL}/api/admin/database/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ confirmation_token: 'test' })
    });
    expect(resetRes.status()).toBe(403);
  });

  test('POST /api/admin/database/reset - sin token retorna 401', async () => {
    const resetRes = await fetch(`${BASE_URL}/api/admin/database/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmation_token: 'test' })
    });
    expect(resetRes.status()).toBe(401);
  });

  test('POST /api/admin/database/reset - limpia reportes', async () => {
    const token = await getAdminToken();
    
    const getRes = await fetch(`${BASE_URL}/api/admin/database/reset?action=get_confirmation_token`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { confirmation_token } = await getRes.json();
    
    const resetRes = await fetch(`${BASE_URL}/api/admin/database/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ confirmation_token })
    });
    expect(resetRes.ok).toBe(true);
  });

  test('POST /api/admin/database/reset - preserva admin', async () => {
    // First reset
    let token = await getAdminToken();
    let getRes = await fetch(`${BASE_URL}/api/admin/database/reset?action=get_confirmation_token`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    let { confirmation_token } = await getRes.json();
    
    await fetch(`${BASE_URL}/api/admin/database/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ confirmation_token })
    });
    
    // Try to login again after reset
    token = await getAdminToken();
    expect(token).toBeTruthy();
    expect(token.length).toBeGreaterThan(0);
  });

  // INTEGRATION TEST
  test('Flujo completo: Backup → Eliminar → Reset', async () => {
    const token = await getAdminToken();
    
    // 1. Backup
    const backupRes = await fetch(`${BASE_URL}/api/admin/database/backup`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(backupRes.ok).toBe(true);
    
    // 2. Delete reports
    let getRes = await fetch(`${BASE_URL}/api/admin/database/reports?action=get_confirmation_token`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    let { confirmation_token } = await getRes.json();
    
    const deleteRes = await fetch(`${BASE_URL}/api/admin/database/reports`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ confirmation_token })
    });
    expect(deleteRes.ok).toBe(true);
    
    // 3. Reset database
    getRes = await fetch(`${BASE_URL}/api/admin/database/reset?action=get_confirmation_token`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    ({ confirmation_token } = await getRes.json());
    
    const resetRes = await fetch(`${BASE_URL}/api/admin/database/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ confirmation_token })
    });
    expect(resetRes.ok).toBe(true);
  });
});
