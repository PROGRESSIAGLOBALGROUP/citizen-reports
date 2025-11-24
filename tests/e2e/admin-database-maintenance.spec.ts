import { test, expect } from '@playwright/test';

// Use explicit IPv4 loopback to avoid Windows DNS resolution issues
const BASE_URL = 'http://127.0.0.1:4000';

// Helper para obtener token admin
async function getAdminToken(request: any) {
  const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
    data: {
      email: 'admin@jantetelco.gob.mx',
      password: 'admin123'
    }
  });
  
  if (loginResponse.status() !== 200) {
    throw new Error(`Login failed: ${loginResponse.status()}`);
  }
  
  const data = await loginResponse.json();
  return data.token;
}

// Helper para obtener token funcionario
async function getFuncionarioToken(request: any) {
  const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
    data: {
      email: 'func.obras1@jantetelco.gob.mx',
      password: 'admin123'
    }
  });
  
  if (loginResponse.status() !== 200) {
    throw new Error(`Login failed: ${loginResponse.status()}`);
  }
  
  const data = await loginResponse.json();
  return data.token;
}

test.describe('Database Maintenance Tools - Admin Panel', () => {
  // ============================================================================
  // BACKUP TESTS
  // ============================================================================
  test('GET /api/admin/database/backup - admin puede descargar respaldo', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    
    const response = await request.get(`${BASE_URL}/api/admin/database/backup`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('application/octet-stream');
    const buffer = await response.body();
    expect(buffer.length).toBeGreaterThan(1024);
  });

  test('GET /api/admin/database/backup - sin token retorna 401', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/admin/database/backup`);
    expect(response.status()).toBe(401);
  });

  test('GET /api/admin/database/backup - funcionario retorna 403', async ({ request }) => {
    const funcToken = await getFuncionarioToken(request);
    
    const response = await request.get(`${BASE_URL}/api/admin/database/backup`, {
      headers: { Authorization: `Bearer ${funcToken}` }
    });

    expect(response.status()).toBe(403);
  });

  test('GET /api/admin/database/backup - descarga archivo válido', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    
    const response = await request.get(`${BASE_URL}/api/admin/database/backup`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.status()).toBe(200);
    const buffer = await response.body();
    expect(buffer.length).toBeGreaterThan(1024);
  });

  // ============================================================================
  // DELETE REPORTS TESTS
  // ============================================================================
  test('DELETE /api/admin/database/reports - elimina reportes con confirmación', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    
    const deleteResponse = await request.delete(`${BASE_URL}/api/admin/database/reports`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      data: { confirmacion: 'eliminar_todos_reportes' }
    });

    expect(deleteResponse.status()).toBe(200);
    const deleteData = await deleteResponse.json();
    expect(deleteData.mensaje).toContain('✅');
  });

  test('DELETE /api/admin/database/reports - rechaza sin confirmación correcta', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    
    const response = await request.delete(`${BASE_URL}/api/admin/database/reports`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      data: { confirmacion: 'invalid' }
    });

    expect(response.status()).toBe(400);
  });

  test('DELETE /api/admin/database/reports - rechaza sin confirmación', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    
    const response = await request.delete(`${BASE_URL}/api/admin/database/reports`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      data: {}
    });

    expect(response.status()).toBe(400);
  });

  test('DELETE /api/admin/database/reports - funcionario retorna 403', async ({ request }) => {
    const funcToken = await getFuncionarioToken(request);
    
    const response = await request.delete(`${BASE_URL}/api/admin/database/reports`, {
      headers: {
        Authorization: `Bearer ${funcToken}`,
        'Content-Type': 'application/json'
      },
      data: { confirmacion: 'eliminar_todos_reportes' }
    });

    expect(response.status()).toBe(403);
  });

  test('DELETE /api/admin/database/reports - sin token retorna 401', async ({ request }) => {
    const response = await request.delete(`${BASE_URL}/api/admin/database/reports`, {
      data: { confirmacion: 'eliminar_todos_reportes' }
    });

    expect(response.status()).toBe(401);
  });

  test('DELETE /api/admin/database/reports - retorna count eliminados', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    
    const deleteResponse = await request.delete(`${BASE_URL}/api/admin/database/reports`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      data: { confirmacion: 'eliminar_todos_reportes' }
    });

    expect(deleteResponse.status()).toBe(200);
    const data = await deleteResponse.json();
    expect(data.reportesEliminados).toBeGreaterThanOrEqual(0);
  });

  // ============================================================================
  // RESET DATABASE TESTS
  // ============================================================================
  test('POST /api/admin/database/reset - reinicia BD preservando admin', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    
    const resetResponse = await request.post(`${BASE_URL}/api/admin/database/reset`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      data: { confirmacion: 'reiniciar_base_datos' }
    });

    expect(resetResponse.status()).toBe(200);
    const resetData = await resetResponse.json();
    expect(resetData.mensaje).toContain('✅');
    expect(resetData.estadisticas).toBeDefined();
  });

  test('POST /api/admin/database/reset - rechaza sin confirmación correcta', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    
    const response = await request.post(`${BASE_URL}/api/admin/database/reset`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      data: { confirmacion: 'invalid' }
    });

    expect(response.status()).toBe(400);
  });

  test('POST /api/admin/database/reset - rechaza sin confirmación', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    
    const response = await request.post(`${BASE_URL}/api/admin/database/reset`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      data: {}
    });

    expect(response.status()).toBe(400);
  });

  test('POST /api/admin/database/reset - funcionario retorna 403', async ({ request }) => {
    const funcToken = await getFuncionarioToken(request);
    
    const response = await request.post(`${BASE_URL}/api/admin/database/reset`, {
      headers: {
        Authorization: `Bearer ${funcToken}`,
        'Content-Type': 'application/json'
      },
      data: { confirmacion: 'reiniciar_base_datos' }
    });

    expect(response.status()).toBe(403);
  });

  test('POST /api/admin/database/reset - sin token retorna 401', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/admin/database/reset`, {
      data: { confirmacion: 'reiniciar_base_datos' }
    });

    expect(response.status()).toBe(401);
  });

  test('POST /api/admin/database/reset - limpia reportes', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    
    const resetResponse = await request.post(`${BASE_URL}/api/admin/database/reset`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      data: { confirmacion: 'reiniciar_base_datos' }
    });

    expect(resetResponse.status()).toBe(200);
    const resetData = await resetResponse.json();
    expect(resetData.estadisticas.reportesEliminados).toBeGreaterThanOrEqual(0);
  });

  test('POST /api/admin/database/reset - preserva admin', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    
    const resetResponse = await request.post(`${BASE_URL}/api/admin/database/reset`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      data: { confirmacion: 'reiniciar_base_datos' }
    });

    expect(resetResponse.status()).toBe(200);

    // Verify admin can still login
    const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: 'admin@jantetelco.gob.mx',
        password: 'admin123'
      }
    });

    expect(loginResponse.status()).toBe(200);
  });

  // ============================================================================
  // INTEGRATION TEST
  // ============================================================================
  test('Flujo completo: Backup → Eliminar → Reset', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    
    // 1. Backup
    const backupResponse = await request.get(`${BASE_URL}/api/admin/database/backup`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(backupResponse.status()).toBe(200);

    // 2. Delete
    const deleteResponse = await request.delete(`${BASE_URL}/api/admin/database/reports`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      data: { confirmacion: 'eliminar_todos_reportes' }
    });
    expect(deleteResponse.status()).toBe(200);

    // 3. Reset
    const resetResponse = await request.post(`${BASE_URL}/api/admin/database/reset`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      data: { confirmacion: 'reiniciar_base_datos' }
    });
    expect(resetResponse.status()).toBe(200);

    // 4. Verify admin still works
    const finalLoginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: 'admin@jantetelco.gob.mx',
        password: 'admin123'
      }
    });
    expect(finalLoginResponse.status()).toBe(200);
  });
});
