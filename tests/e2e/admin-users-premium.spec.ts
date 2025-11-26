import { test, expect } from '@playwright/test';

test.describe('Admin Users Premium UI', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('/api/auth/login', async route => {
      await route.fulfill({
        json: {
          token: 'mock-admin-token',
          usuario: {
            id: 1,
            nombre: 'Administrador',
            email: 'admin@jantetelco.gob.mx',
            rol: 'admin',
            dependencia: 'administracion',
            activo: 1
          }
        }
      });
    });

    await page.route('/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        json: { id: 1, nombre: 'Administrador', email: 'admin@jantetelco.gob.mx', rol: 'admin' }
      });
    });

    await page.route('/api/usuarios', async route => {
      await route.fulfill({
        json: [
          { id: 1, nombre: 'Admin User', email: 'admin@test.com', rol: 'admin', dependencia: 'administracion', activo: 1, creado_en: '2025-01-01' },
          { id: 2, nombre: 'Funcionario User', email: 'func@test.com', rol: 'funcionario', dependencia: 'obras_publicas', activo: 1, creado_en: '2025-01-02' },
          { id: 3, nombre: 'Inactive User', email: 'inactive@test.com', rol: 'funcionario', dependencia: 'agua_potable', activo: 0, creado_en: '2025-01-03' }
        ]
      });
    });

    await page.route('/api/dependencias', async route => {
      await route.fulfill({
        json: [
          { id: 1, nombre: 'Administración', slug: 'administracion' },
          { id: 2, nombre: 'Obras Públicas', slug: 'obras_publicas' },
          { id: 3, nombre: 'Agua Potable', slug: 'agua_potable' }
        ]
      });
    });

    await page.route('/api/roles', async route => {
      await route.fulfill({
        json: [
          { id: 'admin', nombre: 'Administrador' },
          { id: 'supervisor', nombre: 'Supervisor' },
          { id: 'funcionario', nombre: 'Funcionario' }
        ]
      });
    });

    // Perform UI Login
    await page.goto('/');
    await page.getByRole('button', { name: '🔐 Iniciar Sesión' }).click();
    await page.getByPlaceholder('funcionario@jantetelco.gob.mx').fill('admin@jantetelco.gob.mx');
    await page.getByPlaceholder('••••••••').fill('admin123');
    await page.getByRole('button', { name: 'Iniciar Sesión', exact: true }).click();
    
    // Wait for login to complete and navigate to Admin
    await expect(page.getByRole('button', { name: '⚙️ Administración' })).toBeVisible();
    await page.getByRole('button', { name: '⚙️ Administración' }).click();
    
    // Wait for Admin Panel to load
    await expect(page.getByRole('heading', { name: 'Administración de Usuarios' })).toBeVisible();
  });

  test('should display the premium header correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Administración de Usuarios' })).toBeVisible();
    await expect(page.getByText('Gestiona los funcionarios y supervisores del sistema')).toBeVisible();
  });

  test('should display user statistics', async ({ page }) => {
    await expect(page.getByText('📊 Total: 3')).toBeVisible();
    await expect(page.getByText('✅ Activos: 2')).toBeVisible();
  });

  test('should filter users by status', async ({ page }) => {
    // Initial state: 3 users
    await expect(page.locator('tr')).toHaveCount(4); // Header + 3 rows

    // Filter by 'Solo Activos'
    // The label is not associated with the select, so we use the first combobox
    await page.locator('select').first().selectOption('activos');
    await expect(page.locator('tr')).toHaveCount(3); // Header + 2 rows
    await expect(page.getByText('Inactive User')).not.toBeVisible();

    // Filter by 'Solo Inactivos'
    await page.locator('select').first().selectOption('inactivos');
    await expect(page.locator('tr')).toHaveCount(2); // Header + 1 row
    await expect(page.getByText('Inactive User')).toBeVisible();
  });

  test('should open new user modal with premium design', async ({ page }) => {
    await page.getByRole('button', { name: /Nuevo Usuario/i }).click();
    await expect(page.getByText('🚀 Crear Nuevo Usuario')).toBeVisible();
    await expect(page.getByText('Información Personal')).toBeVisible();
    await expect(page.getByText('Seguridad & Acceso')).toBeVisible();
    await expect(page.getByText('Rol & Permisos')).toBeVisible();
  });
});
