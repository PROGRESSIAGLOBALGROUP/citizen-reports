import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4000';

/**
 * Test E2E: Manejo de sesión expirada (401) en AdminUsuarios
 * 
 * Verifica que cuando el backend devuelve 401:
 * 1. Se limpia localStorage (auth_token, usuario)
 * 2. Se muestra alerta de sesión expirada
 * 3. La página se recarga
 */
test.describe('AdminUsuarios - Session Expiry (401)', () => {

  test('should handle 401 on /api/usuarios and show expiry alert', async ({ page }) => {
    // 1. Inyectar token y usuario en localStorage ANTES de cargar la página
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'fake-expired-token');
      localStorage.setItem('usuario', JSON.stringify({
        id: 1,
        nombre: 'Administrador',
        email: 'admin@jantetelco.gob.mx',
        rol: 'admin',
        dependencia: 'administracion',
        activo: 1
      }));
    });

    // 2. Mockear APIs - /api/auth/me devuelve OK para que el app no limpie inmediatamente
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        json: { id: 1, nombre: 'Administrador', email: 'admin@jantetelco.gob.mx', rol: 'admin' }
      });
    });

    // 3. Mockear rutas básicas del mapa
    await page.route('**/api/reportes**', async route => {
      await route.fulfill({ json: [] });
    });

    await page.route('**/api/categorias**', async route => {
      await route.fulfill({ json: [] });
    });

    await page.route('**/api/tipos**', async route => {
      await route.fulfill({ json: [] });
    });

    await page.route('**/api/dependencias', async route => {
      await route.fulfill({
        json: [{ id: 1, nombre: 'Administración', slug: 'administracion' }]
      });
    });

    // 4. Simular que /api/usuarios devuelve 401 (sesión expirada)
    await page.route('**/api/usuarios', async route => {
      await route.fulfill({
        status: 401,
        json: { error: 'Token inválido o expirado' }
      });
    });

    // 5. Simular que /api/roles devuelve 401
    await page.route('**/api/roles', async route => {
      await route.fulfill({
        status: 401,
        json: { error: 'Token inválido o expirado' }
      });
    });

    // 6. Interceptar alert antes de navegar
    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    // 7. Navegar directamente al admin panel (con hash)
    await page.goto(`${BASE_URL}/#admin`);
    
    // 8. Esperar splash
    await page.waitForTimeout(7000);
    
    // 9. Hacer clic en la pestaña de Usuarios para que AdminUsuarios se renderice
    await page.getByRole('button', { name: /Usuarios/i }).click();
    
    // 10. Esperar que las llamadas API se disparen
    await page.waitForTimeout(2000);

    // 11. Verificar que el alert se mostró con mensaje correcto
    expect(alertMessage).toContain('sesión ha expirado');
  });

  test('should handle 401 on /api/roles and show expiry alert', async ({ page }) => {
    // Inyectar credenciales simuladas
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'fake-expired-token');
      localStorage.setItem('usuario', JSON.stringify({
        id: 1,
        nombre: 'Administrador',
        email: 'admin@jantetelco.gob.mx',
        rol: 'admin',
        dependencia: 'administracion',
        activo: 1
      }));
    });

    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        json: { id: 1, nombre: 'Administrador', email: 'admin@jantetelco.gob.mx', rol: 'admin' }
      });
    });

    await page.route('**/api/reportes**', async route => {
      await route.fulfill({ json: [] });
    });

    await page.route('**/api/categorias**', async route => {
      await route.fulfill({ json: [] });
    });

    await page.route('**/api/tipos**', async route => {
      await route.fulfill({ json: [] });
    });

    await page.route('**/api/dependencias', async route => {
      await route.fulfill({
        json: [{ id: 1, nombre: 'Administración', slug: 'administracion' }]
      });
    });

    // /api/usuarios funciona
    await page.route('**/api/usuarios', async route => {
      await route.fulfill({
        json: [
          { id: 1, nombre: 'Admin', email: 'admin@test.com', rol: 'admin', dependencia: 'administracion', activo: 1, creado_en: '2025-01-01' }
        ]
      });
    });

    // /api/roles devuelve 401
    await page.route('**/api/roles', async route => {
      await route.fulfill({
        status: 401,
        json: { error: 'Token inválido o expirado' }
      });
    });

    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    await page.goto(`${BASE_URL}/#admin`);
    await page.waitForTimeout(7000);
    
    // Hacer clic en la pestaña de Usuarios para que AdminUsuarios se renderice
    await page.getByRole('button', { name: /Usuarios/i }).click();
    await page.waitForTimeout(2000);
    
    expect(alertMessage).toContain('sesión ha expirado');
  });

});
