/**
 * E2E Test Login Helper - Funciones robustas de autenticación
 * 
 * CRÍTICO: Este helper maneja correctamente:
 * - Splash screen de 5-6 segundos
 * - Selectores con emojis exactos
 * - Modal de login y su cierre
 * - Navegación post-login
 */

import { Page, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4000';
const SPLASH_WAIT = 6000;  // Splash screen duration

// Usuarios de prueba
export const USERS = {
  admin: {
    email: 'admin@jantetelco.gob.mx',
    password: 'admin123',
    nombre: 'Administrador del Sistema',
    rol: 'admin',
    dependencia: 'administracion'
  },
  supervisorObras: {
    email: 'supervisor.obras@jantetelco.gob.mx',
    password: 'admin123',
    nombre: 'Supervisor Obras Públicas',
    rol: 'supervisor',
    dependencia: 'obras_publicas'
  },
  funcionarioObras: {
    email: 'func.obras1@jantetelco.gob.mx',
    password: 'admin123',
    nombre: 'Juan Pérez - Obras',
    rol: 'funcionario',
    dependencia: 'obras_publicas'
  },
  supervisorServicios: {
    email: 'supervisor.servicios@jantetelco.gob.mx',
    password: 'admin123',
    nombre: 'Supervisora Servicios Públicos',
    rol: 'supervisor',
    dependencia: 'servicios_publicos'
  },
  funcionarioServicios: {
    email: 'func.servicios1@jantetelco.gob.mx',
    password: 'admin123',
    nombre: 'María López - Servicios',
    rol: 'funcionario',
    dependencia: 'servicios_publicos'
  },
  funcionarioSeguridad: {
    email: 'func.seguridad1@jantetelco.gob.mx',
    password: 'admin123',
    nombre: 'Carlos Ramírez - Seguridad',
    rol: 'funcionario',
    dependencia: 'seguridad_publica'
  },
  supervisorParques: {
    email: 'supervisor.parques@jantetelco.gob.mx',
    password: 'admin123',
    nombre: 'Parkeador',
    rol: 'supervisor',
    dependencia: 'parques_jardines'
  },
  funcionarioParques: {
    email: 'func.parques1@jantetelco.gob.mx',
    password: 'admin123',
    nombre: 'Func. Parques',
    rol: 'funcionario',
    dependencia: 'parques_jardines'
  }
};

export type User = typeof USERS.admin;

const API_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4000';

/**
 * Login via API con retry automático para rate limiting
 * Esta es la forma más robusta de autenticarse en tests E2E
 * Evita flakiness causado por rate limiting
 * 
 * @param page - Playwright page (para requests)
 * @param user - Usuario de prueba
 * @param maxRetries - Número máximo de reintentos (default: 3)
 * @returns Token de autenticación
 */
export async function loginViaAPI(
  page: Page, 
  user: User, 
  maxRetries = 3
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await page.request.post(`${API_URL}/api/auth/login`, {
      data: { email: user.email, password: user.password }
    });
    
    const data = await response.json();
    
    if (response.ok()) {
      console.log(`✅ Login API exitoso para ${user.email}`);
      return data.token;
    }
    
    // Manejar rate limiting
    if (data.codigo === 'API_RATE_LIMIT' && attempt < maxRetries) {
      const waitTime = data.reintentoEnMs || 10000;
      console.log(`⏳ Rate limit alcanzado, esperando ${waitTime}ms (intento ${attempt}/${maxRetries})...`);
      await page.waitForTimeout(waitTime + 1000);
      continue;
    }
    
    throw new Error(`Login API falló para ${user.email}: ${JSON.stringify(data)}`);
  }
  
  throw new Error(`Login API falló para ${user.email} después de ${maxRetries} intentos`);
}

/**
 * Login via API y configurar token directamente en localStorage
 * Método más robusto para tests que no necesitan probar login UI
 * 
 * ESTRATEGIA:
 * 1. Obtener token via API (sin cargar la app completa)
 * 2. Usar addInitScript para inyectar localStorage ANTES de que React monte
 * 3. Navegar a la app (sin hash, para evitar race condition)
 * 4. Esperar splash screen
 * 5. Luego cambiar hash a #panel (ahora usuario ya está en estado React)
 * 
 * @param page - Playwright page
 * @param user - Usuario de prueba
 */
export async function loginViaAPIAndSetToken(page: Page, user: User): Promise<string> {
  // Obtener token via API directamente (sin navegar primero)
  const response = await page.request.post(`${API_URL}/api/auth/login`, {
    data: { email: user.email, password: user.password }
  });
  
  if (!response.ok()) {
    const data = await response.json();
    throw new Error(`Login API falló para ${user.email}: ${JSON.stringify(data)}`);
  }
  
  const { token } = await response.json();
  console.log(`✅ Login API exitoso para ${user.email}`);
  
  // Inyectar localStorage ANTES de que la página cargue
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('usuario', JSON.stringify({
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      dependencia: user.dependencia
    }));
  }, { token, user });
  
  // Navegar a la app SIN hash (evita race condition con useEffect)
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  
  // Esperar splash screen (6s)
  await page.waitForTimeout(6000);
  
  // Ahora que React ya leyó localStorage y configuró usuario,
  // cambiar hash para navegar al panel
  await page.evaluate(() => {
    window.location.hash = '#panel';
  });
  
  // Pequeña espera para que el hash handler reaccione
  await page.waitForTimeout(500);
  
  console.log(`✅ Token configurado en localStorage para ${user.email}`);
  return token;
}

/**
 * Cerrar cualquier modal abierto
 */
export async function closeAnyModal(page: Page): Promise<void> {
  const overlay = page.locator('.gp-modal-overlay');
  if (await overlay.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Si aún existe, click en overlay
    if (await overlay.isVisible().catch(() => false)) {
      await overlay.click({ position: { x: 10, y: 10 }, force: true }).catch(() => {});
      await page.waitForTimeout(500);
    }
  }
}

/**
 * Login via UI con manejo completo de splash screen y modal
 * 
 * @param page - Playwright page
 * @param user - Usuario de prueba
 * @param options - Opciones adicionales
 */
export async function loginUI(
  page: Page, 
  user: User,
  options?: { skipSplash?: boolean; waitForPanel?: boolean }
): Promise<void> {
  // 1. Navegar a la app
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  
  // 2. Esperar splash screen (CRÍTICO)
  if (!options?.skipSplash) {
    await page.waitForTimeout(SPLASH_WAIT);
  }
  
  // 3. Verificar si ya estamos logueados
  const isLoggedIn = await page.locator(`text=${user.nombre}`).isVisible().catch(() => false);
  if (isLoggedIn) {
    console.log(`✅ Ya logueado como ${user.email}`);
    return;
  }
  
  // 4. Click en botón de login (sin emoji para cross-platform)
  const loginButton = page.locator('button:has-text("Iniciar Sesión")').first();
  await expect(loginButton).toBeVisible({ timeout: 10000 });
  await loginButton.click();
  
  // 5. Esperar modal de login
  await page.waitForSelector('text=Acceso al Sistema', { timeout: 10000 });
  
  // 6. Llenar credenciales
  await page.fill('#login-email', user.email);
  await page.fill('#login-password', user.password);
  
  // 7. Submit
  await page.click('button[type="submit"]:has-text("Iniciar Sesión")');
  
  // 8. Esperar cierre de modal - forzar cierre si persiste
  try {
    await page.waitForSelector('.gp-modal-overlay', { state: 'hidden', timeout: 5000 });
  } catch {
    // Modal persiste - intentar cerrarlo con ESC o click fuera
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Si aún existe, click en el overlay para cerrarlo
    const overlay = page.locator('.gp-modal-overlay');
    if (await overlay.isVisible().catch(() => false)) {
      await overlay.click({ position: { x: 10, y: 10 }, force: true }).catch(() => {});
      await page.waitForTimeout(500);
    }
  }
  
  // 9. Esperar a que la UI refleje el login
  await page.waitForTimeout(2000);
  
  // 10. Verificar login exitoso (sin emoji para cross-platform)
  if (options?.waitForPanel) {
    await expect(page.locator('button:has-text("Mi Panel")')).toBeVisible({ timeout: 10000 });
  }
  
  console.log(`✅ Login exitoso como ${user.email}`);
}

/**
 * Navegar al panel de funcionario/supervisor
 */
export async function navigateToPanel(page: Page): Promise<void> {
  // Usar hash navigation para preservar estado de login
  await page.evaluate(() => { window.location.hash = '#panel'; });
  await page.waitForTimeout(2000);
  
  // Verificar que el panel cargó
  await expect(page.locator('.gp-container')).toBeVisible({ timeout: 10000 });
  console.log('✅ Navegación a panel exitosa');
}

/**
 * Navegar al panel de administración (solo admin)
 */
export async function navigateToAdmin(page: Page): Promise<void> {
  // Primero cerrar cualquier modal que esté abierto
  await closeAnyModal(page);
  
  // Sin emoji para cross-platform
  const adminBtn = page.locator('button:has-text("Administración")').first();
  await expect(adminBtn).toBeVisible({ timeout: 10000 });
  await adminBtn.click();
  await page.waitForTimeout(2000);
  
  // Verificar que el admin panel cargó - buscar los tabs del panel
  await expect(page.locator('.gp-admin-tabs')).toBeVisible({ timeout: 10000 });
  console.log('✅ Navegación a admin exitosa');
}

/**
 * Login como admin y navegar a panel de administración
 */
export async function loginAsAdminAndGoToAdmin(page: Page): Promise<void> {
  await loginUI(page, USERS.admin, { waitForPanel: true });
  await navigateToAdmin(page);
}

/**
 * Login como supervisor y navegar al panel
 */
export async function loginAsSupervisorAndGoToPanel(page: Page): Promise<void> {
  await loginUI(page, USERS.supervisorObras, { waitForPanel: true });
  await navigateToPanel(page);
}

/**
 * Login como funcionario y navegar al panel
 */
export async function loginAsFuncionarioAndGoToPanel(page: Page): Promise<void> {
  await loginUI(page, USERS.funcionarioObras, { waitForPanel: true });
  await navigateToPanel(page);
}

/**
 * Configurar token de autenticación directamente en localStorage
 * Útil para tests que no necesitan probar el login UI
 */
export async function setAuthTokenDirectly(
  page: Page, 
  token: string, 
  user: User
): Promise<void> {
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('usuario', JSON.stringify({
      id: 1,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      dependencia: user.dependencia
    }));
  }, { token, user });
  
  // Recargar para que la app recoja el token
  await page.reload();
  await page.waitForTimeout(2000);
}

/**
 * Cerrar sesión
 */
export async function logout(page: Page): Promise<void> {
  const logoutBtn = page.locator('button:has-text("Cerrar")');
  if (await logoutBtn.isVisible().catch(() => false)) {
    await logoutBtn.click();
    await page.waitForTimeout(1000);
  } else {
    // Forzar logout via localStorage
    await page.evaluate(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('usuario');
    });
    await page.reload();
    await page.waitForTimeout(2000);
  }
  console.log('✅ Logout exitoso');
}

/**
 * Navegar a tab específica en panel
 */
export async function navigateToTab(page: Page, tabName: string): Promise<void> {
  const tab = page.locator(`button.gp-tab:has-text("${tabName}")`);
  await expect(tab).toBeVisible({ timeout: 10000 });
  await tab.click({ force: true });
  await page.waitForTimeout(1000);
}

// Export default para compatibilidad
export default {
  USERS,
  loginUI,
  loginViaAPI,
  loginViaAPIAndSetToken,
  navigateToPanel,
  navigateToAdmin,
  loginAsAdminAndGoToAdmin,
  loginAsSupervisorAndGoToPanel,
  loginAsFuncionarioAndGoToPanel,
  setAuthTokenDirectly,
  logout,
  navigateToTab,
  closeAnyModal
};
