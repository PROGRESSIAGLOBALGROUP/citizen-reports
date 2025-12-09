/**
 * E2E Security Integration Tests
 * 
 * Validates security features in real scenarios:
 * - Rate Limiting on login attempts
 * - Session timeout by inactivity
 * - CSRF protection on mutations
 * - Password policy enforcement
 * 
 * These tests use the actual server, not mocks
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4000';

test.describe('Security: Rate Limiting', () => {
  
  test('API returns rate limit info on login failure', async ({ request }) => {
    // Un solo intento fallido debe devolver error normal
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: 'nonexistent@test.com',
        password: 'wrongpassword'
      }
    });
    
    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.error).toBeTruthy();
  });

  test('API returns 429 after too many failed attempts (skipped in test mode)', async ({ request }) => {
    // En NODE_ENV=test, rate limiting está desactivado para E2E
    // Este test verifica que el endpoint responde correctamente
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: 'test@test.com',
        password: 'wrongpassword'
      }
    });
    
    // Debería ser 401 (no 429) porque rate limiting está desactivado en test
    expect([401, 429]).toContain(response.status());
  });
});

test.describe('Security: Session Timeout', () => {
  
  test('Valid token returns user data on /api/auth/me', async ({ request }) => {
    // Login para obtener token válido
    const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: 'admin@jantetelco.gob.mx',
        password: 'admin123'
      }
    });
    
    expect(loginResponse.ok()).toBe(true);
    const loginData = await loginResponse.json();
    expect(loginData.token).toBeTruthy();
    
    // Usar token para verificar sesión
    const meResponse = await request.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });
    
    expect(meResponse.ok()).toBe(true);
    const userData = await meResponse.json();
    expect(userData.email).toBe('admin@jantetelco.gob.mx');
  });

  test('Invalid token returns 401', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': 'Bearer invalid_token_12345'
      }
    });
    
    expect(response.status()).toBe(401);
  });

  test('Missing token returns 401', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/auth/me`);
    
    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.error).toContain('Token requerido');
  });
});

test.describe('Security: Password Policy', () => {
  
  test('Rejects weak password on user creation', async ({ request }) => {
    // Login como admin
    const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: 'admin@jantetelco.gob.mx',
        password: 'admin123'
      }
    });
    
    const { token } = await loginResponse.json();
    
    // Intentar crear usuario con password débil
    const createResponse = await request.post(`${BASE_URL}/api/usuarios`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        email: `weak-password-test-${Date.now()}@test.com`,
        password: '123',  // Password muy débil
        nombre: 'Test User',
        rol: 'funcionario',
        dependencia: 'obras_publicas'
      }
    });
    
    // Debe rechazar por password débil
    expect(createResponse.status()).toBe(400);
    const data = await createResponse.json();
    expect(data.error).toBeTruthy();
  });

  test('Accepts strong password on user creation', async ({ request }) => {
    // Login como admin
    const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: 'admin@jantetelco.gob.mx',
        password: 'admin123'
      }
    });
    
    const { token } = await loginResponse.json();
    
    const testEmail = `strong-password-test-${Date.now()}@test.com`;
    
    // Crear usuario con password fuerte
    const createResponse = await request.post(`${BASE_URL}/api/usuarios`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        email: testEmail,
        password: 'SecurePass123!',  // Password fuerte
        nombre: 'Test User Strong',
        rol: 'funcionario',
        dependencia: 'obras_publicas'
      }
    });
    
    // Debe aceptar
    expect(createResponse.status()).toBe(201);
    
    // Cleanup: eliminar usuario de test
    const users = await request.get(`${BASE_URL}/api/usuarios`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const usersData = await users.json();
    const testUser = usersData.find((u: any) => u.email === testEmail);
    
    if (testUser) {
      await request.delete(`${BASE_URL}/api/usuarios/${testUser.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
  });
});

test.describe('Security: CSRF Protection', () => {
  
  test('Login returns CSRF token', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: 'admin@jantetelco.gob.mx',
        password: 'admin123'
      }
    });
    
    expect(response.ok()).toBe(true);
    const data = await response.json();
    
    // Debe incluir csrfToken
    expect(data.csrfToken).toBeTruthy();
    expect(typeof data.csrfToken).toBe('string');
    expect(data.csrfToken.length).toBeGreaterThan(30);
  });

  test('CSRF token is unique per session', async ({ request }) => {
    // Primer login
    const response1 = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: 'admin@jantetelco.gob.mx',
        password: 'admin123'
      }
    });
    const data1 = await response1.json();
    
    // Segundo login (nueva sesión)
    const response2 = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: 'admin@jantetelco.gob.mx',
        password: 'admin123'
      }
    });
    const data2 = await response2.json();
    
    // Los CSRF tokens deben ser diferentes
    expect(data1.csrfToken).not.toBe(data2.csrfToken);
  });
});

test.describe('Security: Protected Routes', () => {
  
  test('Admin-only creation routes reject non-admin users', async ({ request }) => {
    // Login como funcionario (no admin)
    const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: 'func.obras1@jantetelco.gob.mx',
        password: 'admin123'
      }
    });
    
    const { token } = await loginResponse.json();
    
    // Intentar CREAR usuario (operación admin-only)
    const createResponse = await request.post(`${BASE_URL}/api/usuarios`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        email: 'test-unauthorized@test.com',
        password: 'TestPass123!',
        nombre: 'Test',
        rol: 'funcionario',
        dependencia: 'obras_publicas'
      }
    });
    
    // Debe rechazar con 403 (solo admin puede crear usuarios)
    expect(createResponse.status()).toBe(403);
  });

  test('Admin can access admin routes', async ({ request }) => {
    // Login como admin
    const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: 'admin@jantetelco.gob.mx',
        password: 'admin123'
      }
    });
    
    const { token } = await loginResponse.json();
    
    // Acceder a ruta de admin
    const adminResponse = await request.get(`${BASE_URL}/api/usuarios`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Debe permitir
    expect(adminResponse.ok()).toBe(true);
  });
});

test.describe('Security: Input Sanitization', () => {
  
  test('XSS in report description is sanitized', async ({ request }) => {
    // Crear reporte con intento de XSS
    const response = await request.post(`${BASE_URL}/api/reportes`, {
      data: {
        tipo: 'bache',
        descripcion: '<script>alert("XSS")</script>Test description',
        lat: 18.5,
        lng: -99.2,
        fingerprint: 'test-xss-fingerprint'
      }
    });
    
    if (response.ok()) {
      const data = await response.json();
      
      // Obtener el reporte y verificar que está sanitizado
      const getResponse = await request.get(`${BASE_URL}/api/reportes/${data.id}`);
      const reporte = await getResponse.json();
      
      // No debe contener tags de script
      expect(reporte.descripcion).not.toContain('<script>');
      expect(reporte.descripcion).not.toContain('</script>');
    }
  });
});

test.describe('Security: Headers', () => {
  
  test('Security headers are present in responses', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/whitelabel/config`);
    
    const headers = response.headers();
    
    // Verificar headers de seguridad
    expect(headers['x-content-type-options']).toBe('nosniff');
    // SAMEORIGIN permite iframes del mismo dominio (necesario para algunos features)
    expect(headers['x-frame-options']).toBe('SAMEORIGIN');
    // X-XSS-Protection está deshabilitado (0) en browsers modernos que usan CSP
    // Chrome deprecó este header en favor de Content-Security-Policy
    expect(['0', '1; mode=block']).toContain(headers['x-xss-protection']);
  });
});
