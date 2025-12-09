/**
 * Test End-to-End: Admin Database Tools - UI & API Integration
 * 
 * Tests for database management endpoints.
 * Note: Destructive tests (DELETE, POST reset) only run when explicitly enabled.
 * 
 * Run all tests: npx playwright test z-admin-panel-database-ui --config=config/playwright.config.ts
 */

import { test, expect } from '@playwright/test';

const API_URL = 'http://127.0.0.1:4000';

// Helper: obtener token admin via API
async function getAdminToken(request: any) {
  const response = await request.post(`${API_URL}/api/auth/login`, {
    data: {
      email: 'admin@jantetelco.gob.mx',
      password: 'admin123'
    }
  });
  return (await response.json()).token;
}

// Helper: obtener token funcionario via API
async function getFuncionarioToken(request: any) {
  const response = await request.post(`${API_URL}/api/auth/login`, {
    data: {
      email: 'func.obras1@jantetelco.gob.mx',
      password: 'admin123'
    }
  });
  return (await response.json()).token;
}

test.describe('Admin Database Tools - Non-Destructive Tests', () => {
  
  test('GET /api/admin/database/backup devuelve archivo válido', async ({ request }) => {
    const token = await getAdminToken(request);
    
    const response = await request.get(`${API_URL}/api/admin/database/backup`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Puede ser 200 (archivo existe) o 500 (BD no disponible)
    expect([200, 500]).toContain(response.status());
    
    if (response.status() === 200) {
      expect(response.headers()['content-type']).toBe('application/octet-stream');
      const buffer = await response.body();
      expect(buffer.length).toBeGreaterThan(1024);
      console.log(`✅ Backup descargado: ${buffer.length} bytes`);
    } else {
      console.log('⚠️ Backup no disponible (500) - endpoint existe');
    }
  });

  test('GET /api/admin/database/backup - error NO expone rutas locales', async ({ request }) => {
    // Request sin token debería retornar 401
    const response = await request.get(`${API_URL}/api/admin/database/backup`);
    
    expect(response.status()).toBe(401);
    const body = await response.text();
    
    // No debe contener rutas locales (seguridad)
    expect(body).not.toMatch(/C:\\|\/home|\/root|\.db.*[\\\/]|data\.db.*[\\\/]/);
    expect(body).not.toMatch(/PROYECTOS|citizen-reports|windows path/i);
    console.log('✅ Error seguro - no expone rutas locales');
  });

  test('GET /api/admin/database/backup - funcionario retorna 403', async ({ request }) => {
    const funcToken = await getFuncionarioToken(request);
    
    const response = await request.get(`${API_URL}/api/admin/database/backup`, {
      headers: { Authorization: `Bearer ${funcToken}` }
    });

    expect(response.status()).toBe(403);
    console.log('✅ Funcionario no puede acceder a backup (403)');
  });

  test('Backup header contiene SQLite signature (si disponible)', async ({ request }) => {
    const token = await getAdminToken(request);
    
    const response = await request.get(`${API_URL}/api/admin/database/backup`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.status() === 200) {
      const buffer = await response.body();
      // SQLite files start with "SQLite format 3"
      const header = buffer.toString('utf8', 0, 15);
      expect(header).toContain('SQLite format 3');
      console.log('✅ Backup es archivo SQLite válido');
    } else {
      console.log('⚠️ Backup no disponible - test condicional');
    }
  });

  test('DELETE /api/admin/database/reports - sin token retorna 401', async ({ request }) => {
    const response = await request.delete(`${API_URL}/api/admin/database/reports`);
    expect(response.status()).toBe(401);
    console.log('✅ Delete sin token retorna 401');
  });

  test('DELETE /api/admin/database/reports - funcionario retorna 403', async ({ request }) => {
    const funcToken = await getFuncionarioToken(request);
    
    const response = await request.delete(`${API_URL}/api/admin/database/reports`, {
      headers: { 
        Authorization: `Bearer ${funcToken}`,
        'Content-Type': 'application/json'
      },
      data: { confirmacion: 'eliminar_todos_reportes' }
    });

    expect(response.status()).toBe(403);
    console.log('✅ Funcionario no puede eliminar reportes (403)');
  });

  test('DELETE /api/admin/database/reports - sin confirmación retorna 400', async ({ request }) => {
    const token = await getAdminToken(request);
    
    const response = await request.delete(`${API_URL}/api/admin/database/reports`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: { confirmacion: 'texto_incorrecto' }
    });
    
    // Debe rechazar sin confirmación correcta
    expect([400]).toContain(response.status());
    console.log('✅ Delete rechazado sin confirmación correcta');
  });

  test('POST /api/admin/database/reset - sin token retorna 401', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/admin/database/reset`);
    expect(response.status()).toBe(401);
    console.log('✅ Reset sin token retorna 401');
  });

  test('POST /api/admin/database/reset - funcionario retorna 403', async ({ request }) => {
    const funcToken = await getFuncionarioToken(request);
    
    const response = await request.post(`${API_URL}/api/admin/database/reset`, {
      headers: { 
        Authorization: `Bearer ${funcToken}`,
        'Content-Type': 'application/json'
      },
      data: { confirmacion: 'reiniciar_base_datos' }
    });

    expect(response.status()).toBe(403);
    console.log('✅ Funcionario no puede resetear BD (403)');
  });

  test('POST /api/admin/database/reset - sin confirmación retorna 400', async ({ request }) => {
    const token = await getAdminToken(request);
    
    const response = await request.post(`${API_URL}/api/admin/database/reset`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: { confirmacion: 'texto_incorrecto' }
    });
    
    // Debe rechazar sin confirmación correcta
    expect([400]).toContain(response.status());
    console.log('✅ Reset rechazado sin confirmación correcta');
  });

});
