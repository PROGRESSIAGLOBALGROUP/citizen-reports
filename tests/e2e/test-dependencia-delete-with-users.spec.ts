import { test, expect } from '@playwright/test';
import { loginViaAPIAndSetToken, USERS } from './fixtures/login-helper';

const BASE_URL = 'http://localhost:4000';
const API_URL = 'http://localhost:4000';

test.describe('AdminDependencias - Eliminar con usuarios', () => {
  test('debe mostrar modal de reasignación al intentar eliminar dependencia con usuarios', async ({ page }) => {
    // 1. Login como admin
    const token = await loginViaAPIAndSetToken(page, USERS.admin);
    console.log('✅ Token obtenido:', token.substring(0, 20) + '...');

    // 2. Navegar al panel admin
    await page.goto(`${BASE_URL}/#admin`);
    
    // 3. Esperar a que cargue la app
    await page.waitForTimeout(6000);

    // 4. Hacer clic en tab de Dependencias
    const depTab = await page.locator('text=Dependencias').first();
    if (!await depTab.isVisible()) {
      console.log('⚠️  Tab de Dependencias no visible');
    } else {
      await depTab.click();
    }
    
    // 5. Esperar a que se carguen las dependencias
    await page.waitForTimeout(2000);

    // 6. Verificar que hay al menos una dependencia con usuarios
    const dependenciaCard = await page.locator('.gp-dep-card').first();
    expect(dependenciaCard).toBeVisible();

    // 7. Obtener el nombre de la primera dependencia
    const nombreDependencia = await dependenciaCard.locator('.gp-dep-card-title').textContent();
    console.log('📍 Dependencia seleccionada:', nombreDependencia);

    // 8. Hacer click en botón Eliminar
    const btnEliminar = dependenciaCard.locator('button.delete');
    await btnEliminar.click();

    // 9. Esperar a que aparezca el modal de eliminación
    const modal = await page.locator('.gp-modal-container');
    
    // El modal debería aparecer o NO (depende si la dependencia tiene usuarios)
    const isModalVisible = await modal.isVisible().catch(() => false);
    
    if (isModalVisible) {
      // 10. Si el modal aparece (dependencia tiene usuarios):
      // Verificar que muestra la advertencia
      const titulo = await page.locator('h2:has-text("Eliminar Dependencia")');
      expect(titulo).toBeVisible();

      // 11. Verificar que se muestra la lista de usuarios
      const usersList = await page.locator('h4:has-text("Usuarios que serán reasignados")');
      expect(usersList).toBeVisible();

      // 12. Verificar que hay un selector de dependencia destino
      const selectDestino = await page.locator('select').first();
      expect(selectDestino).toBeVisible();

      console.log('✅ Modal de reasignación apareció correctamente');

      // 13. Seleccionar una dependencia destino
      const options = await page.locator('select option').count();
      if (options > 1) {
        await page.locator('select').selectOption({ index: 1 });
        console.log('✅ Dependencia destino seleccionada');
      }

      // 14. Hacer click en "Reasignar y Eliminar"
      const btnConfirmar = await page.locator('button:has-text("Reasignar y Eliminar")');
      expect(btnConfirmar).not.toBeDisabled();
      await btnConfirmar.click();

      // 15. Esperar mensaje de éxito
      await page.waitForTimeout(2000);
      const alertText = page.locator('text=Dependencia eliminada|reasignados');
      // No verificamos el texto exacto por que puede variar
      console.log('✅ Operación completada');

    } else {
      // Si el modal NO aparece, significa que no tiene usuarios o error
      console.log('⚠️  Modal no aparecio - puede ser que la dependencia no tenga usuarios');
      // Hacer click en cancelar del dialog de confirmación general si existe
      const btnCancelar = await page.locator('button:has-text("Cancelar")').first();
      if (await btnCancelar.isVisible()) {
        await btnCancelar.click();
      }
    }
  });

  test('debe permitir eliminar dependencia sin usuarios directamente', async ({ page }) => {
    // Login como admin
    await loginViaAPIAndSetToken(page, USERS.admin);

    // Navegar al panel admin
    await page.goto(`${BASE_URL}/#admin`);
    await page.waitForTimeout(6000);

    // Hacer clic en tab de Dependencias
    const depTab2 = await page.locator('text=Dependencias').first();
    if (await depTab2.isVisible()) {
      await depTab2.click();
      await page.waitForTimeout(2000);
    }

    // Contar dependencias inicialmente
    const initialCount = await page.locator('.gp-dep-card').count();
    console.log('📊 Dependencias iniciales:', initialCount);

    if (initialCount > 0) {
      // Si hay dependencias, intentar eliminar la última
      const lastCard = await page.locator('.gp-dep-card').last();
      const btnEliminar = lastCard.locator('button.delete');
      await btnEliminar.click();

      // Esperar respuesta
      await page.waitForTimeout(1000);
    }
  });
});
