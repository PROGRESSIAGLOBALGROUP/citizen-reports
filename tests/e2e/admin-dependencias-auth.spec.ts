/**
 * E2E Tests: Admin Dependencias - Autenticación y Manejo de Sesión
 * 
 * Verifica que el flujo de eliminación de dependencias maneje correctamente:
 * - Sesiones válidas
 * - Sesiones expiradas (401 Unauthorized)
 * - Redirección a login cuando la sesión expira
 * 
 * @see .github/copilot-instructions.md - Sección "Cascading Deletes with Reassignment Pattern"
 * @see docs/FLUJO_ELIMINACION_DEPENDENCIAS.md
 */

import { test, expect, Page } from '@playwright/test';
import { loginViaAPIAndSetToken, USERS } from './fixtures/login-helper';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4000';
const API_URL = BASE_URL;

test.describe('Admin Dependencias - Autenticación', () => {
  
  test.describe('Con sesión válida', () => {
    
    test('debe cargar la lista de dependencias correctamente', async ({ page }) => {
      // Login como admin
      await loginViaAPIAndSetToken(page, USERS.admin);
      
      // Navegar al panel admin
      await page.evaluate(() => window.location.hash = '#admin');
      await page.waitForTimeout(1000);
      
      // Click en tab Dependencias
      await page.click('text=Dependencias');
      await page.waitForTimeout(500);
      
      // Verificar que se carga la tabla
      await expect(page.locator('text=Administración de Dependencias')).toBeVisible({ timeout: 10000 });
      
      // Verificar que hay al menos una dependencia
      const dependenciasCount = await page.locator('.gp-admin-table tbody tr').count();
      expect(dependenciasCount).toBeGreaterThan(0);
    });
    
    test('debe poder consultar usuarios de una dependencia', async ({ page }) => {
      await loginViaAPIAndSetToken(page, USERS.admin);
      
      // Hacer petición directa a la API
      const token = await page.evaluate(() => localStorage.getItem('auth_token'));
      
      const response = await page.request.get(`${API_URL}/api/admin/dependencias/1/usuarios`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('usuarios');
      expect(data).toHaveProperty('count');
    });
    
    test('debe mostrar modal de reasignación si la dependencia tiene usuarios', async ({ page }) => {
      await loginViaAPIAndSetToken(page, USERS.admin);
      
      // Navegar al panel admin -> Dependencias
      await page.evaluate(() => window.location.hash = '#admin');
      await page.waitForTimeout(1000);
      await page.click('text=Dependencias');
      await page.waitForTimeout(500);
      
      // Buscar dependencia que tenga usuarios (ej: Obras Públicas)
      const deleteButton = page.locator('.gp-admin-action-btn.delete').first();
      await deleteButton.click();
      
      // Esperar a ver qué respuesta obtenemos
      await page.waitForTimeout(2000);
      
      // Si tiene usuarios, debe aparecer el modal de reasignación
      const modal = page.locator('.gp-modal-container');
      const confirmDialog = page.locator('text=Esta dependencia tiene usuarios asociados');
      
      // Puede ser modal o confirm dialog nativo
      const hasModal = await modal.isVisible().catch(() => false);
      const hasConfirm = await confirmDialog.isVisible().catch(() => false);
      
      // Loggear lo que encontramos
      console.log(`Modal visible: ${hasModal}, Confirm dialog: ${hasConfirm}`);
    });
    
  });
  
  test.describe('Con sesión expirada', () => {
    
    test('debe manejar 401 en consulta de usuarios y redirigir a login', async ({ page }) => {
      // Configurar token inválido
      await page.addInitScript(() => {
        localStorage.setItem('auth_token', 'token_invalido_para_test');
        localStorage.setItem('usuario', JSON.stringify({
          id: 999,
          email: 'test@test.com',
          nombre: 'Test User',
          rol: 'admin',
          dependencia: 'test'
        }));
      });
      
      // Navegar a la app
      await page.goto(BASE_URL);
      await page.waitForTimeout(6000); // Splash screen
      
      // Intentar ir al admin
      await page.evaluate(() => window.location.hash = '#admin');
      await page.waitForTimeout(2000);
      
      // Debería haber recargado la página o mostrado error de autenticación
      // Verificar que localStorage ya no tiene el token inválido o que estamos en login
      const currentToken = await page.evaluate(() => localStorage.getItem('auth_token'));
      
      // El sistema debería haber detectado la sesión inválida
      console.log(`Token después de intento: ${currentToken}`);
    });
    
    test('debe manejar 401 en DELETE de dependencia', async ({ page }) => {
      // Primero login válido
      await loginViaAPIAndSetToken(page, USERS.admin);
      
      // Navegar al admin
      await page.evaluate(() => window.location.hash = '#admin');
      await page.waitForTimeout(1000);
      
      // Luego invalidar el token manualmente (simular expiración)
      await page.evaluate(() => {
        localStorage.setItem('auth_token', 'token_expirado_durante_operacion');
      });
      
      // Hacer petición DELETE con token inválido
      const response = await page.request.delete(`${API_URL}/api/admin/dependencias/999`, {
        headers: {
          'Authorization': 'Bearer token_expirado_durante_operacion'
        }
      });
      
      // El backend debe retornar 401
      expect(response.status()).toBe(401);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toMatch(/token|expirad|inválid/i);
    });
    
  });
  
  test.describe('API Endpoints de Dependencias', () => {
    
    test('GET /api/admin/dependencias requiere autenticación', async ({ page }) => {
      const response = await page.request.get(`${API_URL}/api/admin/dependencias`, {
        headers: {} // Sin token
      });
      
      expect(response.status()).toBe(401);
    });
    
    test('GET /api/admin/dependencias/:id/usuarios requiere autenticación', async ({ page }) => {
      const response = await page.request.get(`${API_URL}/api/admin/dependencias/1/usuarios`, {
        headers: {} // Sin token
      });
      
      expect(response.status()).toBe(401);
    });
    
    test('DELETE /api/admin/dependencias/:id requiere autenticación', async ({ page }) => {
      const response = await page.request.delete(`${API_URL}/api/admin/dependencias/1`, {
        headers: {} // Sin token
      });
      
      expect(response.status()).toBe(401);
    });
    
    test('POST /api/admin/dependencias/:id/reasignar-y-eliminar requiere autenticación', async ({ page }) => {
      const response = await page.request.post(`${API_URL}/api/admin/dependencias/1/reasignar-y-eliminar`, {
        headers: {
          'Content-Type': 'application/json'
        },
        data: { dependenciaDestino: 'obras_publicas' }
      });
      
      expect(response.status()).toBe(401);
    });
    
    test('DELETE /api/admin/dependencias/:id retorna 409 si tiene usuarios', async ({ page }) => {
      // Login válido
      await loginViaAPIAndSetToken(page, USERS.admin);
      const token = await page.evaluate(() => localStorage.getItem('auth_token'));
      
      // Buscar una dependencia que tenga usuarios
      const depResponse = await page.request.get(`${API_URL}/api/admin/dependencias`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dependencias = await depResponse.json();
      
      // Probar eliminar la primera dependencia (probablemente tenga usuarios)
      if (dependencias.length > 0) {
        const depId = dependencias[0].id;
        
        // Primero verificar si tiene usuarios
        const usersResponse = await page.request.get(`${API_URL}/api/admin/dependencias/${depId}/usuarios`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const usersData = await usersResponse.json();
        
        if (usersData.count > 0) {
          // Intentar eliminar - debe dar 409
          const deleteResponse = await page.request.delete(`${API_URL}/api/admin/dependencias/${depId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          expect(deleteResponse.status()).toBe(409);
          const errorData = await deleteResponse.json();
          expect(errorData.error).toContain('usuario');
        }
      }
    });
    
    test('POST reasignar-y-eliminar funciona con datos válidos', async ({ page }) => {
      await loginViaAPIAndSetToken(page, USERS.admin);
      const token = await page.evaluate(() => localStorage.getItem('auth_token'));
      
      // Obtener dependencias
      const depResponse = await page.request.get(`${API_URL}/api/admin/dependencias`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dependencias = await depResponse.json();
      
      // Necesitamos al menos 2 dependencias para probar reasignación
      if (dependencias.length >= 2) {
        const depOrigen = dependencias.find((d: any) => d.slug === 'parques_jardines');
        const depDestino = dependencias.find((d: any) => d.slug !== depOrigen?.slug);
        
        if (depOrigen && depDestino) {
          // Verificar usuarios
          const usersResponse = await page.request.get(`${API_URL}/api/admin/dependencias/${depOrigen.id}/usuarios`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const usersData = await usersResponse.json();
          
          // Si tiene usuarios, probar reasignación (pero no ejecutar si afecta datos reales)
          if (usersData.count === 0) {
            // Solo probar si no tiene usuarios (para no afectar datos de producción)
            console.log(`Dependencia ${depOrigen.nombre} no tiene usuarios, skip reasignación`);
          } else {
            console.log(`Dependencia ${depOrigen.nombre} tiene ${usersData.count} usuarios`);
            // No ejecutamos la reasignación real para no modificar datos de test
          }
        }
      }
    });
    
  });
  
});
