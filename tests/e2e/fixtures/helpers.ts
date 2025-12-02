/**
 * E2E Test Helpers - Funciones auxiliares para tests
 * 
 * Proporciona helpers reutilizables para:
 * - Autenticación
 * - Creación de reportes
 * - Navegación
 * - Esperas y assertions
 */

import { Page, APIRequestContext, expect } from '@playwright/test';
import { 
  config, 
  Usuario, 
  Reporte, 
  AuthResult,
  ADMIN,
  SUPERVISOR_OBRAS,
  FUNC_OBRAS_1 
} from './data';

// ============================================================================
// AUTENTICACIÓN
// ============================================================================

/**
 * Login via API y retorna token + datos de usuario
 */
export async function loginAPI(
  request: APIRequestContext, 
  user: Usuario
): Promise<AuthResult> {
  const response = await request.post(`${config.apiUrl}/api/auth/login`, {
    data: {
      email: user.email,
      password: user.password
    }
  });
  
  if (!response.ok()) {
    const error = await response.text();
    throw new Error(`Login failed for ${user.email}: ${error}`);
  }
  
  return await response.json();
}

/**
 * Login en el frontend (UI)
 */
export async function loginUI(page: Page, user: Usuario): Promise<void> {
  // Esperar splash screen
  await page.goto(config.apiUrl);
  await page.waitForTimeout(config.splashWaitTime);
  
  // Clic en botón de login
  const loginButton = page.locator('button:has-text("Iniciar Sesión"), button:has-text("Acceso")');
  await loginButton.first().click();
  
  // Esperar modal
  await page.waitForSelector('[role="dialog"], .gp-modal', { timeout: 5000 });
  
  // Llenar formulario
  await page.fill('input[type="email"], input[name="email"], #login-email', user.email);
  await page.fill('input[type="password"], input[name="password"], #login-password', user.password);
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Esperar a que el modal cierre y redirija
  await page.waitForTimeout(1000);
}

/**
 * Verificar que el usuario está autenticado en el frontend
 */
export async function assertLoggedIn(page: Page, user: Usuario): Promise<void> {
  // Verificar que el nombre aparece en la UI
  const userInfo = page.locator(`text=${user.nombre}`).first();
  await expect(userInfo).toBeVisible({ timeout: 5000 });
}

/**
 * Logout en el frontend
 */
export async function logoutUI(page: Page): Promise<void> {
  // Buscar botón de logout o menú de usuario
  const logoutButton = page.locator('button:has-text("Cerrar Sesión"), button:has-text("Logout")');
  
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForTimeout(500);
  }
}

/**
 * Configurar token de autenticación en localStorage
 */
export async function setAuthToken(page: Page, token: string, user: Usuario): Promise<void> {
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('usuario', JSON.stringify(user));
  }, { token, user });
}

// ============================================================================
// CREACIÓN DE DATOS
// ============================================================================

/**
 * Crear un reporte via API
 */
export async function crearReporteAPI(
  request: APIRequestContext, 
  reporte: Partial<Reporte>,
  token?: string
): Promise<{ id: number; ok: boolean }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await request.post(`${config.apiUrl}/api/reportes`, {
    headers,
    data: {
      tipo: reporte.tipo || 'bache',
      descripcion: reporte.descripcion || 'Descripción de prueba',
      descripcion_corta: reporte.descripcion_corta || 'Prueba',
      lat: reporte.lat || 18.7095,
      lng: reporte.lng || -98.7792,
      colonia: reporte.colonia || 'Centro',
      codigo_postal: reporte.codigo_postal || '62935',
      municipio: reporte.municipio || 'Jantetelco',
      estado_ubicacion: reporte.estado_ubicacion || 'Morelos',
      peso: reporte.peso || 3,
      fingerprint: 'e2e-test-' + Date.now(),
      sesionId: 'e2e-session-' + Date.now(),
      userAgent: 'Playwright E2E Test'
    }
  });
  
  if (!response.ok()) {
    const error = await response.text();
    throw new Error(`Failed to create report: ${error}`);
  }
  
  return await response.json();
}

/**
 * Asignar funcionario a reporte via API
 */
export async function asignarFuncionarioAPI(
  request: APIRequestContext,
  reporteId: number,
  funcionarioId: number,
  token: string
): Promise<void> {
  const response = await request.post(
    `${config.apiUrl}/api/reportes/${reporteId}/asignaciones`,
    {
      headers: { 'Authorization': `Bearer ${token}` },
      data: { usuario_id: funcionarioId }
    }
  );
  
  if (!response.ok() && response.status() !== 409) { // 409 = ya asignado
    const error = await response.text();
    throw new Error(`Failed to assign: ${error}`);
  }
}

/**
 * Agregar nota de trabajo via API
 */
export async function agregarNotaAPI(
  request: APIRequestContext,
  reporteId: number,
  contenido: string,
  tipo: string,
  token: string
): Promise<{ id: number }> {
  const response = await request.post(
    `${config.apiUrl}/api/reportes/${reporteId}/notas-trabajo`,
    {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: { contenido, tipo }
    }
  );
  
  if (!response.ok()) {
    const error = await response.text();
    throw new Error(`Failed to add note: ${error}`);
  }
  
  return await response.json();
}

// ============================================================================
// NAVEGACIÓN
// ============================================================================

/**
 * Navegar al mapa principal
 */
export async function goToMap(page: Page): Promise<void> {
  await page.goto(config.apiUrl);
  await page.waitForTimeout(config.splashWaitTime);
}

/**
 * Navegar al panel de funcionario
 */
export async function goToPanel(page: Page): Promise<void> {
  await page.goto(`${config.apiUrl}/#panel`);
  await page.waitForTimeout(1000);
}

/**
 * Navegar al formulario de reporte
 */
export async function goToReportForm(page: Page): Promise<void> {
  await page.goto(`${config.apiUrl}/#reportar`);
  await page.waitForTimeout(1000);
}

/**
 * Navegar al panel de administración
 */
export async function goToAdmin(page: Page): Promise<void> {
  await page.goto(`${config.apiUrl}/#admin`);
  await page.waitForTimeout(1000);
}

/**
 * Navegar a ver un reporte específico
 */
export async function goToReporte(page: Page, reporteId: number): Promise<void> {
  await page.goto(`${config.apiUrl}/#reporte/${reporteId}`);
  await page.waitForTimeout(1000);
}

// ============================================================================
// ESPERAS Y ASSERTIONS
// ============================================================================

/**
 * Esperar a que el splash screen desaparezca
 */
export async function waitForSplash(page: Page): Promise<void> {
  await page.waitForTimeout(config.splashWaitTime);
}

/**
 * Esperar a que carguen los datos de la API
 */
export async function waitForApiLoad(page: Page, timeout = 5000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Verificar que no hay errores en la consola
 */
export async function assertNoConsoleErrors(page: Page): Promise<void> {
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  // Si hay errores críticos, fallar el test
  const criticalErrors = errors.filter(e => 
    !e.includes('favicon') && 
    !e.includes('manifest') &&
    !e.includes('_leaflet_pos')
  );
  
  if (criticalErrors.length > 0) {
    throw new Error(`Console errors found: ${criticalErrors.join(', ')}`);
  }
}

/**
 * Esperar a que un elemento esté visible con retry
 */
export async function waitForVisible(
  page: Page, 
  selector: string, 
  timeout = 10000
): Promise<void> {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Verificar que un toast/mensaje aparece
 */
export async function assertToastMessage(
  page: Page, 
  message: string
): Promise<void> {
  const toast = page.locator(`text=${message}`).first();
  await expect(toast).toBeVisible({ timeout: 5000 });
}

// ============================================================================
// LIMPIEZA
// ============================================================================

/**
 * Limpiar localStorage
 */
export async function clearStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Reset del estado de la página
 */
export async function resetPage(page: Page): Promise<void> {
  await clearStorage(page);
  await page.goto('/');
}

// ============================================================================
// VIEWPORTS RESPONSIVE
// ============================================================================

export const viewports = {
  mobile: { width: 375, height: 667 },      // iPhone SE
  mobileLarge: { width: 428, height: 926 }, // iPhone 14 Pro Max
  tablet: { width: 768, height: 1024 },     // iPad
  desktop: { width: 1280, height: 800 },    // Laptop
  largeDesktop: { width: 1920, height: 1080 } // Full HD
};

/**
 * Establecer viewport específico
 */
export async function setViewport(
  page: Page, 
  viewport: keyof typeof viewports
): Promise<void> {
  await page.setViewportSize(viewports[viewport]);
}

// ============================================================================
// EXPORT
// ============================================================================

export const helpers = {
  // Auth
  loginAPI,
  loginUI,
  assertLoggedIn,
  logoutUI,
  setAuthToken,
  
  // Data
  crearReporteAPI,
  asignarFuncionarioAPI,
  agregarNotaAPI,
  
  // Navigation
  goToMap,
  goToPanel,
  goToReportForm,
  goToAdmin,
  goToReporte,
  
  // Waits & Assertions
  waitForSplash,
  waitForApiLoad,
  assertNoConsoleErrors,
  waitForVisible,
  assertToastMessage,
  
  // Cleanup
  clearStorage,
  resetPage,
  
  // Viewport
  viewports,
  setViewport
};

export default helpers;
