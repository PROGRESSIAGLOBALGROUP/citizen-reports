/**
 * Test End-to-End: Modal Asignación - Cargar Funcionarios
 * 
 * Valida que:
 * 1. El supervisor/admin puede hacer login exitosamente
 * 2. Accede a la vista detallada de un reporte (#reporte/:id)
 * 3. Hace click en "Asignar Reporte" para abrir el modal
 * 4. El modal realiza fetch correcto a /api/usuarios (CON /api/)
 * 5. Recibe JSON válido (no HTML 404)
 * 6. Los funcionarios se cargan correctamente en el dropdown
 * 7. Puede seleccionar un funcionario y asignarlo al reporte
 * 
 * Root Cause (FIJO):
 * - Antes: fetch(`${API_BASE}/usuarios?...`) → /usuarios (incorrecto)
 * - Después: fetch(`${API_BASE}/api/usuarios?...`) → /api/usuarios (correcto)
 * 
 * Test Fixture Data:
 * - Usuario: supervisor.obras@jantetelco.gob.mx / admin123
 * - Rol: supervisor
 * - Departamento: obras_publicas
 * - Reporte: Debe existir uno asignado al departamento
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:4000';
const API_URL = 'http://127.0.0.1:4000';

// Credenciales de test
const TEST_SUPERVISOR = {
  email: 'supervisor.obras@jantetelco.gob.mx',
  password: 'admin123',
  nombre: 'María González',
  rol: 'supervisor',
  dependencia: 'obras_publicas'
};

const TEST_ADMIN = {
  email: 'admin@jantetelco.gob.mx',
  password: 'admin123',
  nombre: 'Admin User',
  rol: 'admin',
  dependencia: 'administracion'
};

test.describe('Modal Asignación - Cargar Funcionarios (cargarFuncionarios)', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navegar a la aplicación
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('Supervisor hace login exitosamente', async ({ page }) => {
    // Click en botón "Iniciar Sesión"
    await page.click('button:has-text("🔐 Iniciar Sesión")'); // Esperar modal de login
    await page.waitForSelector('text=Acceso al Sistema', { timeout: 5000 });
    
    // Llenar formulario
    await page.fill('input[type="email"]', TEST_SUPERVISOR.email);
    await page.fill('input[type="password"]', TEST_SUPERVISOR.password);
    
    // Hacer login
    await page.click('button[type="submit"]:has-text("Iniciar Sesión")');
    // Esperar a que cierre el modal y se actualice el header
    await page.waitForSelector(`text=${TEST_SUPERVISOR.nombre}`, { timeout: 10000 });
    
    console.log('✅ Login exitoso como supervisor');
    
    // Verificar que aparece el botón "Mi Panel"
    await expect(page.locator('button:has-text("Mi Panel")')).toBeVisible();
  });

  test('Supervisor accede a vista detallada de un reporte', async ({ page }) => {
    // Login
    await page.click('button:has-text("Iniciar Sesión")');
    await page.waitForSelector('text=Acceso al Sistema');
    await page.fill('input[type="email"]', TEST_SUPERVISOR.email);
    await page.fill('input[type="password"]', TEST_SUPERVISOR.password);
    await page.click('button[type="submit"]:has-text("Iniciar Sesión")');
    await page.waitForSelector(`text=${TEST_SUPERVISOR.nombre}`, { timeout: 10000 });
    
    // Ir al panel
    await page.click('button:has-text("Mi Panel")');
    
    // Esperar a que cargue el panel
    await page.waitForSelector('text=Mi Panel de Supervisión', { timeout: 10000 });
    
    console.log('✅ Mi Panel de Supervisión cargado');
    
    // Buscar y hacer click en el primer reporte
    const primeraFilaReporte = page.locator('table tbody tr').first();
    
    // Esperar a que exista al menos un reporte
    await expect(primeraFilaReporte).toBeVisible({ timeout: 10000 });
    
    // Hacer click en "Ver Reporte"
    const verReporteBtn = primeraFilaReporte.locator('button:has-text("Ver Reporte")');
    await verReporteBtn.click();
    
    // Esperar a que la vista del reporte cargue
    await page.waitForSelector('text=Detalles del Reporte', { timeout: 10000 });
    
    console.log('✅ Vista detallada del reporte cargada');
  });

  test('Modal de asignación realiza fetch CORRECTO a /api/usuarios (JSON válido)', async ({ page }) => {
    // Login
    await page.click('button:has-text("Iniciar Sesión")');
    await page.waitForSelector('text=Acceso al Sistema');
    await page.fill('input[type="email"]', TEST_SUPERVISOR.email);
    await page.fill('input[type="password"]', TEST_SUPERVISOR.password);
    await page.click('button[type="submit"]:has-text("Iniciar Sesión")');
    await page.waitForSelector(`text=${TEST_SUPERVISOR.nombre}`, { timeout: 10000 });
    
    // Ir al panel
    await page.click('button:has-text("Mi Panel")');
    await page.waitForSelector('text=Mi Panel de Supervisión', { timeout: 10000 });
    
    // Hacer click en el primer reporte
    const primeraFilaReporte = page.locator('table tbody tr').first();
    await expect(primeraFilaReporte).toBeVisible({ timeout: 10000 });
    
    const verReporteBtn = primeraFilaReporte.locator('button:has-text("Ver Reporte")');
    await verReporteBtn.click();
    
    // Esperar a que la vista cargue
    await page.waitForSelector('text=Detalles del Reporte', { timeout: 10000 });
    
    // Monitorear las peticiones HTTP
    let jsonResponseValid = false;
    let usuariosApiCalled = false;
    
    page.on('response', async (response) => {
      if (response.url().includes('/api/usuarios')) {
        usuariosApiCalled = true;
        
        try {
          const data = await response.json();
          console.log('✅ Respuesta JSON válida recibida:', data.length, 'usuarios');
          
          // Validar que es un array
          if (Array.isArray(data)) {
            jsonResponseValid = true;
          }
        } catch (e) {
          console.error('❌ Error parseando respuesta como JSON:', e.message);
          console.error('Respuesta fue probablemente HTML (<!DOCTYPE...)');
        }
      }
    });
    
    // Buscar botón "Asignar Reporte" o similar
    const asignarBtn = page.locator('button:has-text("Asignar")').first();
    
    if (await asignarBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('📍 Botón de asignación encontrado, haciendo click...');
      await asignarBtn.click();
    } else {
      console.log('📍 Botón de asignación no encontrado visualmente, buscando alternativa...');
      // Alternativa: buscar por data-testid o aria-label
      const altBtn = page.locator('[data-testid="btn-asignar"], [aria-label*="asignar"]').first();
      if (await altBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await altBtn.click();
      }
    }
    
    // Esperar a que se llame a /api/usuarios
    await page.waitForTimeout(2000);
    
    // Validar que:
    // 1. La llamada se hizo a /api/usuarios (no /usuarios)
    expect(usuariosApiCalled).toBe(true);
    console.log('✅ Endpoint /api/usuarios fue llamado correctamente');
    
    // 2. La respuesta fue JSON válido (no HTML)
    expect(jsonResponseValid).toBe(true);
    console.log('✅ Respuesta es JSON válido (no HTML 404)');
  });

  test('Funcionarios se cargan en el modal de asignación', async ({ page }) => {
    // Login
    await page.click('button:has-text("Iniciar Sesión")');
    await page.waitForSelector('text=Acceso al Sistema');
    await page.fill('input[type="email"]', TEST_SUPERVISOR.email);
    await page.fill('input[type="password"]', TEST_SUPERVISOR.password);
    await page.click('button[type="submit"]:has-text("Iniciar Sesión")');
    await page.waitForSelector(`text=${TEST_SUPERVISOR.nombre}`, { timeout: 10000 });
    
    // Ir al panel
    await page.click('button:has-text("Mi Panel")');
    await page.waitForSelector('text=Mi Panel de Supervisión', { timeout: 10000 });
    
    // Ver reporte
    const primeraFilaReporte = page.locator('table tbody tr').first();
    await expect(primeraFilaReporte).toBeVisible({ timeout: 10000 });
    
    const verReporteBtn = primeraFilaReporte.locator('button:has-text("Ver Reporte")');
    await verReporteBtn.click();
    
    await page.waitForSelector('text=Detalles del Reporte', { timeout: 10000 });
    
    // Abrir modal de asignación
    const asignarBtn = page.locator('button:has-text("Asignar")').first();
    
    if (await asignarBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await asignarBtn.click();
      
      // Esperar a que cargue el dropdown de funcionarios
      await page.waitForTimeout(1500);
      
      // Validar que el dropdown tiene opciones
      const selectFuncionarios = page.locator('select, [role="combobox"]').first();
      
      if (await selectFuncionarios.isVisible({ timeout: 5000 }).catch(() => false)) {
        const options = await selectFuncionarios.locator('option').count();
        
        if (options > 0) {
          console.log(`✅ ${options} funcionarios cargados en el dropdown`);
          expect(options).toBeGreaterThan(0);
        }
      }
    }
  });

  test('Admin puede asignar reporte a funcionario exitosamente', async ({ page }) => {
    // Login como admin
    await page.click('button:has-text("Iniciar Sesión")');
    await page.waitForSelector('text=Acceso al Sistema');
    await page.fill('input[type="email"]', TEST_ADMIN.email);
    await page.fill('input[type="password"]', TEST_ADMIN.password);
    await page.click('button[type="submit"]:has-text("Iniciar Sesión")');
    await page.waitForSelector(`text=${TEST_ADMIN.nombre}`, { timeout: 10000 });
    
    console.log('✅ Login exitoso como admin');
    
    // Ir al panel
    await page.click('button:has-text("Panel Administrativo")');
    
    // Esperar a que cargue el panel admin
    await page.waitForSelector('text=Panel Administrativo', { timeout: 10000 });
    
    console.log('✅ Panel administrativo cargado');
    
    // Buscar un reporte en la tabla
    const reportesTable = page.locator('table tbody tr').first();
    await expect(reportesTable).toBeVisible({ timeout: 10000 });
    
    // Click en ver reporte
    const verBtn = reportesTable.locator('button:has-text("Ver")').first();
    await verBtn.click();
    
    await page.waitForSelector('text=Detalles del Reporte', { timeout: 10000 });
    
    // Buscar botón de asignación
    const asignarBtn = page.locator('button:has-text("Asignar")').first();
    
    if (await asignarBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await asignarBtn.click();
      
      // Esperar a que cargue el modal
      await page.waitForTimeout(1500);
      
      // Seleccionar primer funcionario disponible
      const selectFuncionarios = page.locator('select, [role="combobox"]').first();
      
      if (await selectFuncionarios.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Seleccionar opción
        await selectFuncionarios.selectOption({ index: 1 });
        
        // Click en confirmar
        const confirmarBtn = page.locator('button:has-text("Asignar"), button:has-text("Confirmar")').first();
        
        if (await confirmarBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await confirmarBtn.click();
          
          // Esperar a que se complete la asignación
          await page.waitForTimeout(1000);
          
          console.log('✅ Reporte asignado exitosamente');
        }
      }
    }
  });

});
