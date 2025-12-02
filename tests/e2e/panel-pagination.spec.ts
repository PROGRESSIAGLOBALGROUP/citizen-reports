/**
 * E2E Tests: Panel Funcionario - Pagination
 * 
 * Tests the pagination functionality across all tabs in Mi Panel.
 * 
 * IMPORTANT: These tests require a running server with test data.
 * Run with: npx playwright test tests/e2e/panel-pagination.spec.ts --config=config/playwright.config.ts
 */
import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4000';
const LIMIT = 10; // Must match PanelFuncionario.jsx LIMIT constant

const TEST_ADMIN = {
  email: 'admin@jantetelco.gob.mx',
  password: 'admin123'
};

const TEST_SUPERVISOR = {
  email: 'supervisor.obras@jantetelco.gob.mx',
  password: 'admin123'
};

/**
 * Helper: Login as a user using the actual UI flow
 */
async function loginAs(page: Page, user: { email: string; password: string }) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  
  // Wait for splash screen to finish (app has 5s splash)
  await page.waitForTimeout(6000);
  
  // Click "Iniciar Sesión" button to open login modal
  const loginButton = page.locator('button:has-text("Iniciar Sesión")');
  await expect(loginButton).toBeVisible({ timeout: 10000 });
  await loginButton.click();
  
  // Wait for modal and fill credentials
  await page.waitForSelector('#login-email', { timeout: 10000 });
  await page.fill('#login-email', user.email);
  await page.fill('#login-password', user.password);
  await page.click('button[type="submit"]:has-text("Iniciar Sesión")');
  
  // Wait for login to complete
  await page.waitForSelector('button:has-text("Administración"), button:has-text("Mi Panel")', { timeout: 15000 });
}

/**
 * Helper: Navigate to panel preserving login state
 */
async function goToPanel(page: Page) {
  await page.evaluate(() => { window.location.hash = '#panel'; });
  await page.waitForTimeout(1500);
  await page.waitForSelector('.gp-panel-header', { timeout: 10000 });
}

/**
 * Helper: Get pagination control state
 */
async function getPaginationState(page: Page) {
  const pagination = page.locator('.panel-pagination');
  
  // Wait for pagination to be visible (might take time after data loads)
  await expect(pagination).toBeVisible({ timeout: 8000 });
  
  const prevButton = pagination.locator('button').first();
  const nextButton = pagination.locator('button').last();
  const pageSpan = pagination.locator('span');
  
  const isPrevDisabled = await prevButton.isDisabled();
  const isNextDisabled = await nextButton.isDisabled();
  const pageText = await pageSpan.textContent();
  
  return {
    isPrevDisabled,
    isNextDisabled,
    pageText: pageText?.trim() || '',
    prevButton,
    nextButton
  };
}

/**
 * Helper: Count visible report cards
 */
async function countReportCards(page: Page): Promise<number> {
  await page.waitForTimeout(500);
  return await page.locator('.gp-report-card').count();
}

/**
 * Helper: Click on a tab by text
 */
async function clickTab(page: Page, tabText: string) {
  await page.click(`button.gp-tab:has-text("${tabText}")`);
  await page.waitForTimeout(1000);
}

// ============================================================================
// TEST SUITES
// ============================================================================

test.describe('Panel Pagination - Core Functionality', () => {
  
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
  });

  test('Pagination controls are visible on panel', async ({ page }) => {
    await loginAs(page, TEST_ADMIN);
    await goToPanel(page);
    
    const pagination = page.locator('.panel-pagination');
    await expect(pagination).toBeVisible();
    
    // Verify basic structure
    await expect(pagination.locator('button').first()).toBeVisible();
    await expect(pagination.locator('button').last()).toBeVisible();
    await expect(pagination.locator('span')).toContainText('Página');
  });

  test('First page has "Anterior" button disabled', async ({ page }) => {
    await loginAs(page, TEST_ADMIN);
    await goToPanel(page);
    
    const state = await getPaginationState(page);
    
    expect(state.isPrevDisabled).toBe(true);
    expect(state.pageText).toContain('Página 1');
  });

  test('Clicking "Siguiente" changes page number', async ({ page }) => {
    await loginAs(page, TEST_ADMIN);
    await goToPanel(page);
    
    const state = await getPaginationState(page);
    
    if (!state.isNextDisabled) {
      await state.nextButton.click();
      await page.waitForTimeout(1000);
      
      const newState = await getPaginationState(page);
      expect(newState.pageText).toContain('Página 2');
      expect(newState.isPrevDisabled).toBe(false);
    } else {
      console.log('⚠️ Only one page of data available - test skipped');
    }
  });

  test('Clicking "Anterior" goes back to previous page', async ({ page }) => {
    await loginAs(page, TEST_ADMIN);
    await goToPanel(page);
    
    const state = await getPaginationState(page);
    
    if (!state.isNextDisabled) {
      // Go to page 2
      await state.nextButton.click();
      await page.waitForTimeout(1000);
      
      // Verify we're on page 2
      let currentState = await getPaginationState(page);
      expect(currentState.pageText).toContain('Página 2');
      
      // Go back to page 1
      await currentState.prevButton.click();
      await page.waitForTimeout(1000);
      
      currentState = await getPaginationState(page);
      expect(currentState.pageText).toContain('Página 1');
      expect(currentState.isPrevDisabled).toBe(true);
    }
  });

  test('Page resets when switching tabs', async ({ page }) => {
    await loginAs(page, TEST_SUPERVISOR);
    await goToPanel(page);
    
    const initialState = await getPaginationState(page);
    
    // Try to go to page 2 on first tab
    if (!initialState.isNextDisabled) {
      await initialState.nextButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Switch to another tab
    await clickTab(page, '🔒 Mis Reportes Cerrados');
    
    // Page should reset to 1
    const newState = await getPaginationState(page);
    expect(newState.pageText).toContain('Página 1');
    expect(newState.isPrevDisabled).toBe(true);
  });
});

test.describe('Panel Pagination - Tab-Specific Behavior', () => {
  
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
  });

  test('Mis Reportes Asignados shows paginated results', async ({ page }) => {
    await loginAs(page, TEST_SUPERVISOR);
    await goToPanel(page);
    
    await clickTab(page, 'Mis Reportes');
    
    const cardCount = await countReportCards(page);
    const state = await getPaginationState(page);
    
    // Should show max LIMIT cards
    expect(cardCount).toBeLessThanOrEqual(LIMIT);
    console.log(`Mis Reportes: ${cardCount} cards on page 1`);
  });

  test('Reportes de Mi Dependencia pagination works correctly', async ({ page }) => {
    await loginAs(page, TEST_SUPERVISOR);
    await goToPanel(page);
    
    await clickTab(page, '🏢 Reportes de Mi Dependencia');
    
    const cardCount = await countReportCards(page);
    const state = await getPaginationState(page);
    
    expect(cardCount).toBeLessThanOrEqual(LIMIT);
    console.log(`🏢 Reportes Dependencia: ${cardCount} cards, next disabled: ${state.isNextDisabled}`);
    
    // If there's a next page, verify we can navigate
    if (!state.isNextDisabled) {
      const firstCardId = await page.locator('.gp-report-card .gp-report-id').first().textContent();
      
      await state.nextButton.click();
      await page.waitForTimeout(1000);
      
      const newFirstCardId = await page.locator('.gp-report-card .gp-report-id').first().textContent();
      
      // Different cards should appear
      expect(newFirstCardId).not.toBe(firstCardId);
      console.log(`✅ Page 1: ${firstCardId}, Page 2: ${newFirstCardId}`);
    }
  });

  test('Cierres Pendientes uses server-side pagination', async ({ page }) => {
    await loginAs(page, TEST_SUPERVISOR);
    await goToPanel(page);
    
    await clickTab(page, '✅ Cierres Pendientes');
    
    const cardCount = await countReportCards(page);
    const state = await getPaginationState(page);
    
    // Server pagination: if less than LIMIT, no next page
    if (cardCount < LIMIT) {
      expect(state.isNextDisabled).toBe(true);
    }
    
    console.log(`✅ Cierres Pendientes: ${cardCount} cards, next disabled: ${state.isNextDisabled}`);
  });
});

test.describe('Panel Pagination - Edge Cases', () => {
  
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
  });

  test('Handles empty data gracefully', async ({ page }) => {
    await loginAs(page, TEST_SUPERVISOR);
    await goToPanel(page);
    
    // Closed reports tab might be empty
    await clickTab(page, '🔒 Mis Reportes Cerrados');
    
    const cardCount = await countReportCards(page);
    const state = await getPaginationState(page);
    
    // With no data, both buttons should be disabled on page 1
    if (cardCount === 0) {
      expect(state.isPrevDisabled).toBe(true);
      expect(state.isNextDisabled).toBe(true);
      console.log('✅ Empty state handled correctly');
    }
  });

  test('Reports are limited per page across all tabs', async ({ page }) => {
    await loginAs(page, TEST_ADMIN);
    await goToPanel(page);
    
    const tabs = [
      'Mis Reportes',
      '🔒 Mis Reportes Cerrados',
      '🏢 Reportes de Mi Dependencia',
      '✅ Cierres Pendientes'
    ];
    
    for (const tab of tabs) {
      await clickTab(page, tab);
      const cardCount = await countReportCards(page);
      
      expect(cardCount).toBeLessThanOrEqual(LIMIT);
      console.log(`${tab}: ${cardCount} cards (max ${LIMIT})`);
    }
  });
});
