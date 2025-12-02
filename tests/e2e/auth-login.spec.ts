import { test, expect } from '@playwright/test';

test.describe('Authentication - Login Endpoint', () => {
  test('POST /api/auth/login - debe crear sesión exitosamente', async ({ request }) => {
    // Arrange
    const loginPayload = {
      email: 'admin@jantetelco.gob.mx',
      password: 'admin123'
    };

    // Act
    const response = await request.post('http://127.0.0.1:4000/api/auth/login', {
      data: loginPayload
    });

    // Assert
    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json).toHaveProperty('token');
    expect(json).toHaveProperty('expiraEn');
    expect(json).toHaveProperty('usuario');
    expect(json.usuario.email).toBe('admin@jantetelco.gob.mx');
    expect(json.usuario.rol).toBe('admin');
    expect(json.usuario.dependencia).toBe('administracion');
    expect(json.usuario.nombre).toBe('Administrador del Sistema');
    expect(json.usuario.tieneFirma).toBe(false);

    // Validate token format (32 bytes = 64 hex chars)
    expect(json.token).toMatch(/^[a-f0-9]{64}$/);

    // Validate expiraEn is ISO8601 and > now
    const expireTime = new Date(json.expiraEn);
    expect(expireTime.getTime()).toBeGreaterThan(Date.now());
  });

  test('POST /api/auth/login - password inválida retorna 401', async ({ request }) => {
    const response = await request.post('http://127.0.0.1:4000/api/auth/login', {
      data: {
        email: 'admin@jantetelco.gob.mx',
        password: 'wrongpassword'
      }
    });

    expect(response.status()).toBe(401);
    const json = await response.json();
    expect(json.error).toBe('Credenciales inválidas');
  });

  test('POST /api/auth/login - email no existente retorna 401', async ({ request }) => {
    const response = await request.post('http://127.0.0.1:4000/api/auth/login', {
      data: {
        email: 'noexiste@jantetelco.gob.mx',
        password: 'admin123'
      }
    });

    expect(response.status()).toBe(401);
    const json = await response.json();
    expect(json.error).toBe('Credenciales inválidas');
  });

  test('POST /api/auth/login - campos requeridos', async ({ request }) => {
    const response = await request.post('http://127.0.0.1:4000/api/auth/login', {
      data: {
        email: 'admin@jantetelco.gob.mx'
        // Missing password
      }
    });

    expect(response.status()).toBe(400);
    const json = await response.json();
    expect(json.error).toContain('Email y password requeridos');
  });

  test('POST /api/auth/login - todos los usuarios de prueba pueden loguear', async ({ request }) => {
    const testUsers = [
      { email: 'admin@jantetelco.gob.mx', rol: 'admin', dept: 'administracion' },
      { email: 'supervisor.obras@jantetelco.gob.mx', rol: 'supervisor', dept: 'obras_publicas' },
      { email: 'func.obras1@jantetelco.gob.mx', rol: 'funcionario', dept: 'obras_publicas' }
    ];

    for (const user of testUsers) {
      const response = await request.post('http://127.0.0.1:4000/api/auth/login', {
        data: {
          email: user.email,
          password: 'admin123'
        }
      });

      expect(response.status()).toBe(200, `Failed for user ${user.email}`);
      const json = await response.json();
      expect(json.usuario.rol).toBe(user.rol);
      expect(json.usuario.dependencia).toBe(user.dept);
      expect(json.token).toBeTruthy();
    }
  });

  test('GET /api/auth/me - debe retornar usuario autenticado', async ({ request }) => {
    // First, login
    const loginResponse = await request.post('http://127.0.0.1:4000/api/auth/login', {
      data: {
        email: 'admin@jantetelco.gob.mx',
        password: 'admin123'
      }
    });

    expect(loginResponse.status()).toBe(200);
    const loginData = await loginResponse.json();
    const token = loginData.token;

    // Then, use token to get /me
    const meResponse = await request.get('http://127.0.0.1:4000/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    expect(meResponse.status()).toBe(200);
    const meData = await meResponse.json();
    expect(meData.email).toBe('admin@jantetelco.gob.mx');
    expect(meData.rol).toBe('admin');
    expect(meData.nombre).toBe('Administrador del Sistema');
  });

  test('GET /api/auth/me - token inválido retorna 401', async ({ request }) => {
    const response = await request.get('http://127.0.0.1:4000/api/auth/me', {
      headers: {
        Authorization: 'Bearer invalid-token-12345'
      }
    });

    expect(response.status()).toBe(401);
    const json = await response.json();
    expect(json.error).toBe('Sesión inválida o expirada');
  });

  test('POST /api/auth/logout - debe cerrar sesión', async ({ request }) => {
    // Login first
    const loginResponse = await request.post('http://127.0.0.1:4000/api/auth/login', {
      data: {
        email: 'admin@jantetelco.gob.mx',
        password: 'admin123'
      }
    });

    const loginData = await loginResponse.json();
    const token = loginData.token;

    // Logout
    const logoutResponse = await request.post('http://127.0.0.1:4000/api/auth/logout', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    expect(logoutResponse.status()).toBe(200);
    const logoutData = await logoutResponse.json();
    expect(logoutData.mensaje).toBe('Sesión cerrada exitosamente');

    // Verify token is no longer valid
    const meResponse = await request.get('http://127.0.0.1:4000/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    expect(meResponse.status()).toBe(401);
  });
});
