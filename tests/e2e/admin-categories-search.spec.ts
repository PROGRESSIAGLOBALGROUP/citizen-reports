/**
 * E2E Tests: Admin Categories Search Functionality
 * 
 * Validates the search/filter functionality in the Categories Admin Panel:
 * - Search filters both categories and types within categories
 * - Non-matching types are hidden when searching
 * - Empty state is shown when no results
 * - Clear search restores all categories
 * 
 * Note: These tests use the real server data, not mocks
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Categories Search Functionality', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate and login with real server
    await page.goto('http://127.0.0.1:4000/');
    
    // Perform login if needed
    const loginButton = page.getByRole('button', { name: '🔐 Iniciar Sesión' });
    if (await loginButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await loginButton.click();
      await page.getByPlaceholder('funcionario@jantetelco.gob.mx').fill('admin@jantetelco.gob.mx');
      await page.getByPlaceholder('••••••••').fill('admin123');
      await page.getByRole('button', { name: 'Iniciar Sesión', exact: true }).click();
    }

    // Wait for main navigation to load
    await page.waitForTimeout(1500);

    // Navigate to Admin Panel
    const adminButton = page.getByRole('button', { name: '⚙️ Administración' });
    await expect(adminButton).toBeVisible({ timeout: 15000 });
    await adminButton.click({ force: true });
    
    // Wait for admin panel tabs to render
    await page.waitForTimeout(1000);
    
    // Click Categorías tab - use text filter that's more resilient
    const categoriasTab = page.locator('button').filter({ hasText: /Categor/ });
    await expect(categoriasTab).toBeVisible({ timeout: 10000 });
    await categoriasTab.click({ force: true });
    
    // Wait for categories section to load
    await expect(page.getByRole('heading', { name: 'Gestión de Categorías' })).toBeVisible({ timeout: 10000 });
  });

  test('search input is visible and functional', async ({ page }) => {
    // Verify search input exists
    const searchInput = page.getByPlaceholder('Ej: Obras Públicas, Bache...');
    await expect(searchInput).toBeVisible();
    
    // Verify it accepts input
    await searchInput.fill('test');
    await expect(searchInput).toHaveValue('test');
    
    // Clear and verify
    await searchInput.clear();
    await expect(searchInput).toHaveValue('');
  });

  test('search filters categories and types correctly', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Ej: Obras Públicas, Bache...');
    
    // Search for "baches" (exists in real data)
    await searchInput.fill('baches');
    await page.waitForTimeout(300);
    
    // Should find "Baches" type under "Obras Públicas"
    await expect(page.getByText('Obras Públicas').first()).toBeVisible();
    await expect(page.getByText('Baches')).toBeVisible();
    
    // Other unrelated categories should not be visible
    await expect(page.getByText('Seguridad Pública')).not.toBeVisible();
  });

  test('search with no results shows empty state', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Ej: Obras Públicas, Bache...');
    
    // Search for something that doesn't exist
    await searchInput.fill('xyznonexistent123456789');
    await page.waitForTimeout(300);
    
    // Empty state should be visible
    await expect(page.getByText('No se encontraron resultados')).toBeVisible();
  });

  test('clearing search restores all categories', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Ej: Obras Públicas, Bache...');
    
    // Count initial visible category headers
    const initialCategories = await page.locator('[data-testid="categoria-header"], h1:has-text("Obras"), h1:has-text("Seguridad")').count();
    
    // Search and filter
    await searchInput.fill('baches');
    await page.waitForTimeout(300);
    
    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(300);
    
    // Should have same number or more categories visible
    await expect(page.getByText('Obras Públicas').first()).toBeVisible();
    await expect(page.getByText('Seguridad Pública')).toBeVisible();
  });

  test('search is case insensitive', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Ej: Obras Públicas, Bache...');
    
    // Search with uppercase
    await searchInput.fill('BACHES');
    await page.waitForTimeout(300);
    await expect(page.getByText('Baches')).toBeVisible();
    
    // Search with lowercase
    await searchInput.clear();
    await searchInput.fill('baches');
    await page.waitForTimeout(300);
    await expect(page.getByText('Baches')).toBeVisible();
  });

  test('partial search matches work', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Ej: Obras Públicas, Bache...');
    
    // Search for partial word
    await searchInput.fill('Bach');
    await page.waitForTimeout(300);
    
    // Should match "Baches"
    await expect(page.getByText('Baches')).toBeVisible();
  });

  test('tipo.tipo slug field displays correctly', async ({ page }) => {
    // The tipo slug should be visible in the types list
    // Based on real data, "baches" slug should appear
    await expect(page.getByText('baches')).toBeVisible();
  });
});
