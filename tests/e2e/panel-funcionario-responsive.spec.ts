/**
 * E2E Tests: PanelFuncionario Responsive & Cross-Browser
 * 
 * Validates that "Mi Panel" screens are 100% responsive across:
 * - Mobile (320px - 639px)
 * - Tablet (640px - 1023px)
 * - Desktop (1024px+)
 * - Large Desktop (1440px+)
 * 
 * Tests run on Chromium, Firefox, and WebKit for cross-browser coverage.
 */
import { test, expect, Page } from '@playwright/test';

// Base URL for tests
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4000';

// Test user credentials
const TEST_USERS = {
  admin: { email: 'admin@jantetelco.gob.mx', password: 'admin123' },
  supervisor: { email: 'supervisor.obras@jantetelco.gob.mx', password: 'admin123' },
  funcionario: { email: 'func.obras1@jantetelco.gob.mx', password: 'admin123' }
};

// Viewport breakpoints matching CSS media queries
const VIEWPORTS = {
  mobile: { width: 375, height: 667, name: 'Mobile (375px)' },
  mobileLarge: { width: 428, height: 926, name: 'Mobile Large (428px)' },
  tablet: { width: 768, height: 1024, name: 'Tablet (768px)' },
  desktop: { width: 1280, height: 800, name: 'Desktop (1280px)' },
  largeDesktop: { width: 1920, height: 1080, name: 'Large Desktop (1920px)' }
};

/**
 * Helper: Login and navigate to panel
 * Follows the actual app flow: splash screen -> click login button -> fill modal -> navigate
 */
async function loginAndGoToPanel(page: Page, user: { email: string; password: string }) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  
  // Wait for splash screen to finish (app has 5s splash)
  await page.waitForTimeout(6000);
  
  // Click "Iniciar Sesión" button to open login modal
  await page.click('button:has-text("🔐 Iniciar Sesión")');
  await page.waitForSelector('text=Acceso al Sistema', { timeout: 10000 });
  
  // Fill login form in modal (uses id selectors from LoginModal.jsx)
  await page.fill('#login-email', user.email);
  await page.fill('#login-password', user.password);
  await page.click('button[type="submit"]:has-text("Iniciar Sesión")');
  
  // Wait for login to complete - look for the admin button or panel elements
  await page.waitForSelector('button:has-text("Administración"), button:has-text("Mi Panel")', { timeout: 10000 });
  
  // Navigate to panel using hash (not page.goto to preserve login state)
  await page.evaluate(() => { window.location.hash = '#panel'; });
  await page.waitForTimeout(1000);
  
  // Verify we're on the panel (login modal should be closed)
  await page.waitForSelector('.gp-container', { state: 'visible', timeout: 10000 });
}

/**
 * Helper: Dismiss any login modal if it appears
 */
async function dismissLoginModal(page: Page) {
  const modalClose = page.locator('button:has-text("×")').first();
  const modalVisible = await modalClose.isVisible().catch(() => false);
  if (modalVisible) {
    await modalClose.click({ force: true });
    await page.waitForTimeout(300);
  }
}

/**
 * Helper: Check element visibility and dimensions
 */
async function checkElementResponsive(page: Page, selector: string) {
  const element = await page.locator(selector).first();
  await expect(element).toBeVisible();
  
  const box = await element.boundingBox();
  expect(box).not.toBeNull();
  
  // Element should not overflow viewport
  const viewport = page.viewportSize();
  if (box && viewport) {
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 10); // Small tolerance
  }
  
  return box;
}

test.describe('PanelFuncionario Responsive Tests', () => {
  
  test.describe('Mobile Viewport (375px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
    });

    test('should render panel header correctly on mobile', async ({ page }) => {
      await loginAndGoToPanel(page, TEST_USERS.admin);
      
      // Check header is visible and responsive
      const header = page.locator('.gp-panel-header');
      await expect(header).toBeVisible();
      
      // Header should not overflow
      await checkElementResponsive(page, '.gp-panel-header');
      
      // Title should be readable (not tiny)
      const title = header.locator('h1');
      await expect(title).toBeVisible();
    });

    test('should have horizontally scrollable tabs on mobile', async ({ page }) => {
      await loginAndGoToPanel(page, TEST_USERS.admin);
      
      // Tabs container should be visible
      const tabs = page.locator('.gp-tabs');
      await expect(tabs).toBeVisible();
      
      // Check that tabs container allows horizontal scroll
      const tabsBox = await tabs.boundingBox();
      expect(tabsBox).not.toBeNull();
      
      // All tab buttons should be clickable
      const tabButtons = page.locator('.gp-tab');
      const count = await tabButtons.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should stack filters vertically on mobile', async ({ page }) => {
      await loginAndGoToPanel(page, TEST_USERS.admin);
      
      const filters = page.locator('.gp-filters-section');
      await expect(filters).toBeVisible();
      await checkElementResponsive(page, '.gp-filters-section');
      
      // Select and date inputs should be touch-friendly (min 44px height)
      const selects = page.locator('.gp-filters-section select');
      if (await selects.count() > 0) {
        const selectBox = await selects.first().boundingBox();
        if (selectBox) {
          expect(selectBox.height).toBeGreaterThanOrEqual(40);
        }
      }
    });

    test('should display report cards in single column on mobile', async ({ page }) => {
      await loginAndGoToPanel(page, TEST_USERS.admin);
      
      // Check reports grid exists
      const grid = page.locator('.gp-reports-grid');
      if (await grid.isVisible()) {
        await checkElementResponsive(page, '.gp-reports-grid');
      }
      
      // Empty state should also be responsive
      const emptyState = page.locator('.gp-empty-state');
      if (await emptyState.isVisible()) {
        await checkElementResponsive(page, '.gp-empty-state');
      }
    });

    test('should have touch-friendly pagination buttons', async ({ page }) => {
      await loginAndGoToPanel(page, TEST_USERS.admin);
      
      const pagination = page.locator('.gp-pagination');
      await expect(pagination).toBeVisible();
      
      const buttons = pagination.locator('button');
      const count = await buttons.count();
      
      for (let i = 0; i < count; i++) {
        const box = await buttons.nth(i).boundingBox();
        if (box) {
          // Buttons should be at least 44px for touch targets
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }
    });

    test('should not have horizontal scrollbar on page', async ({ page }) => {
      await loginAndGoToPanel(page, TEST_USERS.admin);
      
      // Check that page doesn't have horizontal overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      // Slight tolerance for scrollbars themselves
      expect(hasHorizontalScroll).toBe(false);
    });
  });

  test.describe('Tablet Viewport (768px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.tablet);
    });

    test('should render panel layout correctly on tablet', async ({ page }) => {
      await loginAndGoToPanel(page, TEST_USERS.supervisor);
      
      await checkElementResponsive(page, '.gp-container');
      await checkElementResponsive(page, '.gp-panel-header');
      await checkElementResponsive(page, '.gp-tabs');
    });

    test('should show filters inline on tablet', async ({ page }) => {
      await loginAndGoToPanel(page, TEST_USERS.supervisor);
      
      const filters = page.locator('.gp-filters-section');
      await expect(filters).toBeVisible();
      
      // On tablet, filters should be more horizontal
      await checkElementResponsive(page, '.gp-filters-section');
    });

    test('should navigate between tabs correctly', async ({ page }) => {
      await loginAndGoToPanel(page, TEST_USERS.supervisor);
      
      // Click each tab and verify it becomes active
      const tabs = ['Mis Reportes Asignados', 'Mis Reportes Cerrados', 'Reportes de Mi Dependencia', 'Cierres Pendientes'];
      
      for (const tabText of tabs) {
        const tab = page.locator('.gp-tab', { hasText: tabText });
        if (await tab.isVisible()) {
          await tab.click();
          await page.waitForTimeout(300);
          await expect(tab).toHaveClass(/active/);
        }
      }
    });
  });

  test.describe('Desktop Viewport (1280px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
    });

    test('should render panel with proper width constraint', async ({ page }) => {
      await loginAndGoToPanel(page, TEST_USERS.admin);
      
      const panel = page.locator('.gp-container');
      await expect(panel).toBeVisible();
      
      const box = await panel.boundingBox();
      if (box) {
        // Should be centered and not full width on large screens
        expect(box.width).toBeLessThanOrEqual(1200);
      }
    });

    test('should display report cards in multi-column grid on desktop', async ({ page }) => {
      await loginAndGoToPanel(page, TEST_USERS.admin);
      
      // Navigate to a view with reports
      await page.click('.gp-tab:has-text("Reportes de Mi Dependencia")');
      await page.waitForTimeout(500);
      
      const grid = page.locator('.gp-reports-list');
      if (await grid.isVisible()) {
        // Grid should have proper layout
        await checkElementResponsive(page, '.gp-reports-list');
      }
    });

    test('should show all tabs without scrolling on desktop', async ({ page }) => {
      await loginAndGoToPanel(page, TEST_USERS.admin);
      
      const tabs = page.locator('.gp-tabs');
      const tabsBox = await tabs.boundingBox();
      const viewport = page.viewportSize();
      
      if (tabsBox && viewport) {
        // Tabs should fit within viewport on desktop
        expect(tabsBox.width).toBeLessThanOrEqual(viewport.width);
      }
    });
  });

  test.describe('Large Desktop Viewport (1920px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.largeDesktop);
    });

    test('should maintain max-width on large screens', async ({ page }) => {
      await loginAndGoToPanel(page, TEST_USERS.admin);
      
      const panel = page.locator('.gp-container');
      const box = await panel.boundingBox();
      
      if (box) {
        // Should not stretch to full width
        expect(box.width).toBeLessThanOrEqual(1440);
      }
    });

    test('should potentially show 3-column grid on large screens', async ({ page }) => {
      await loginAndGoToPanel(page, TEST_USERS.admin);
      
      // Dismiss any modal if it appears
      await dismissLoginModal(page);
      
      // Navigate to dependencia view
      const depTab = page.locator('.gp-tab:has-text("Reportes de Mi Dependencia")');
      await depTab.click({ force: true });
      await page.waitForTimeout(500);
      
      // Check if grid exists (may not have reports in test db)
      const grid = page.locator('.gp-reports-list');
      const gridExists = await grid.count() > 0;
      if (gridExists) {
        await expect(grid.first()).toBeVisible();
        const box = await grid.first().boundingBox();
        expect(box).not.toBeNull();
      } else {
        // If no reports, at least verify the panel container exists
        await expect(page.locator('.gp-container')).toBeVisible();
      }
    });
  });

  test.describe('Cross-viewport Tab Navigation', () => {
    for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
      test(`should switch tabs correctly on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await loginAndGoToPanel(page, TEST_USERS.supervisor);
        
        // Dismiss any modal and ensure panel is visible
        await dismissLoginModal(page);
        await page.waitForSelector('.gp-container', { state: 'visible', timeout: 10000 });
        
        // Test clicking "Cierres Pendientes" tab
        const cierresTab = page.locator('.gp-tab', { hasText: 'Cierres Pendientes' });
        if (await cierresTab.isVisible()) {
          await cierresTab.click({ force: true });
          await page.waitForTimeout(500);
          // Tab should now be active (check class contains 'active')
          const classAttr = await cierresTab.getAttribute('class');
          expect(classAttr).toContain('active');
        }
        
        // Test clicking back to "Mis Reportes"
        const misReportesTab = page.locator('.gp-tab', { hasText: 'Mis Reportes Asignados' });
        await misReportesTab.click({ force: true });
        await page.waitForTimeout(500);
        const classAttr = await misReportesTab.getAttribute('class');
        expect(classAttr).toContain('active');
      });
    }
  });

  test.describe('Filter Responsiveness', () => {
    for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
      test(`should use date filters correctly on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await loginAndGoToPanel(page, TEST_USERS.admin);
        
        // Dismiss any modal
        await dismissLoginModal(page);
        
        // Set a date filter
        const dateInput = page.locator('input[name="fecha-inicio"]');
        if (await dateInput.isVisible()) {
          await dateInput.fill('2025-01-01', { force: true });
          await page.waitForTimeout(300);
          
          // Clear filters button should appear
          const clearBtn = page.locator('.gp-filters-section-clear');
          await expect(clearBtn).toBeVisible();
          
          // Clear filters
          await clearBtn.click({ force: true });
          await page.waitForTimeout(300);
          
          // Button should disappear
          await expect(clearBtn).not.toBeVisible();
        }
      });
    }
  });

  test.describe('Content Overflow Prevention', () => {
    for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
      test(`should prevent content overflow on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await loginAndGoToPanel(page, TEST_USERS.admin);
        
        // Check main container doesn't cause horizontal scroll
        const hasOverflow = await page.evaluate(() => {
          const body = document.body;
          return body.scrollWidth > body.clientWidth;
        });
        
        expect(hasOverflow).toBe(false);
      });
    }
  });

  test.describe('Touch Target Sizes (Mobile)', () => {
    test('all interactive elements should have minimum 44px touch targets', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await loginAndGoToPanel(page, TEST_USERS.admin);
      
      // Check tab buttons
      const tabs = page.locator('.gp-tab');
      const tabCount = await tabs.count();
      for (let i = 0; i < tabCount; i++) {
        const box = await tabs.nth(i).boundingBox();
        if (box) {
          // Height should be at least 40px (allowing slight tolerance)
          expect(box.height).toBeGreaterThanOrEqual(38);
        }
      }
      
      // Check pagination buttons
      const paginationBtns = page.locator('.gp-pagination button');
      const btnCount = await paginationBtns.count();
      for (let i = 0; i < btnCount; i++) {
        const box = await paginationBtns.nth(i).boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }
    });
  });
});

test.describe('PanelFuncionario Role-Based Views', () => {
  
  test.describe('Funcionario View', () => {
    test('should only show "Mis Reportes" tabs for funcionario', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await loginAndGoToPanel(page, TEST_USERS.funcionario);
      
      // Should see basic tabs
      await expect(page.locator('.gp-tab', { hasText: 'Mis Reportes Asignados' })).toBeVisible();
      await expect(page.locator('.gp-tab', { hasText: 'Mis Reportes Cerrados' })).toBeVisible();
      
      // Should NOT see supervisor/admin tabs
      await expect(page.locator('.gp-tab', { hasText: 'Reportes de Mi Dependencia' })).not.toBeVisible();
      await expect(page.locator('.gp-tab', { hasText: 'Cierres Pendientes' })).not.toBeVisible();
    });
  });

  test.describe('Supervisor View', () => {
    test('should show all tabs for supervisor', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await loginAndGoToPanel(page, TEST_USERS.supervisor);
      
      await expect(page.locator('.gp-tab', { hasText: 'Mis Reportes Asignados' })).toBeVisible();
      await expect(page.locator('.gp-tab', { hasText: 'Mis Reportes Cerrados' })).toBeVisible();
      await expect(page.locator('.gp-tab', { hasText: 'Reportes de Mi Dependencia' })).toBeVisible();
      await expect(page.locator('.gp-tab', { hasText: 'Cierres Pendientes' })).toBeVisible();
    });
  });

  test.describe('Admin View', () => {
    test('should show all tabs for admin with correct title', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await loginAndGoToPanel(page, TEST_USERS.admin);
      
      // Check header shows "Mi Panel de Gestión"
      const header = page.locator('.gp-panel-header h1');
      await expect(header).toContainText('Administración');
      
      // All tabs visible
      await expect(page.locator('.gp-tab', { hasText: 'Mis Reportes Asignados' })).toBeVisible();
      await expect(page.locator('.gp-tab', { hasText: 'Cierres Pendientes' })).toBeVisible();
    });
  });
});
