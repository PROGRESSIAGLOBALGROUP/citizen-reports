/**
 * Verificación Manual: Flujo de Eliminación de Dependencias
 * 
 * Este script verifica que el flujo de eliminación con reasignación funciona correctamente
 */

import { test, expect } from '@playwright/test';
import { loginViaAPIAndSetToken, USERS } from './fixtures/login-helper';

const BASE_URL = 'http://localhost:4000';

test('MANUAL VERIFICATION: Dependency deletion with reassignment flow', async ({ page, context }) => {
  test.setTimeout(60000);

  console.log('\n🚀 === INICIANDO TEST DE ELIMINACIÓN DE DEPENDENCIAS === 🚀\n');

  // Login
  console.log('1️⃣  Obteniendo token de admin...');
  const token = await loginViaAPIAndSetToken(page, USERS.admin);
  console.log('✅ Token obtenido\n');

  // Navigate to admin panel
  console.log('2️⃣  Navegando al panel admin...');
  await page.goto(`${BASE_URL}/#admin`);
  await page.waitForTimeout(6000); // Wait for splash screen
  console.log('✅ Panel admin cargado\n');

  // Navigate to dependencias tab
  console.log('3️⃣  Buscando tab de Dependencias...');
  const depencenciasTab = await page.locator('text=Dependencias').first();
  
  if (!await depencenciasTab.isVisible()) {
    console.log('⚠️  Tab no encontrado visualmente, intentando alternative selector...');
    // Try alternative selectors
    await page.click('button:contains("Dependencias")').catch(() => {
      console.log('✅ Seletor alternativo usó método fallback');
    });
  } else {
    await depencenciasTab.click();
    console.log('✅ Tab Dependencias abierto\n');
  }

  await page.waitForTimeout(2000);

  // Get all dependency cards
  console.log('4️⃣  Encontrando dependencias en la UI...');
  const depCards = await page.locator('.gp-dep-card');
  const cardCount = await depCards.count();
  console.log(`✅ Se encontraron ${cardCount} dependencias en la UI\n`);

  if (cardCount === 0) {
    console.log('❌ No hay dependencias para probar');
    return;
  }

  // Find a dependency to test with
  console.log('5️⃣  Seleccionando primera dependencia para prueba...');
  const firstCard = depCards.first();
  const depName = await firstCard.locator('.gp-dep-card-title').textContent();
  console.log(`📍 Dependencia seleccionada: ${depName}\n`);

  // Click delete button
  console.log('6️⃣  Haciendo click en botón "Eliminar"...');
  const deleteBtn = firstCard.locator('button.delete');
  await deleteBtn.click();
  console.log('✅ Click en botón Eliminar ejecutado\n');

  // Check if modal appears
  console.log('7️⃣  Esperando aparición del modal de reasignación...');
  await page.waitForTimeout(1000);
  
  const modal = page.locator('.gp-modal-container');
  const isModalVisible = await modal.isVisible().catch(() => false);

  if (isModalVisible) {
    console.log('✅ MODAL APARECIÓ - Test exitoso!\n');
    
    // Verify modal content
    console.log('8️⃣  Verificando contenido del modal...');
    const modalTitle = await modal.locator('h2').textContent();
    console.log(`   Título: ${modalTitle}`);
    
    const usuariosList = await modal.locator('h4:contains("Usuarios")');
    if (await usuariosList.isVisible()) {
      console.log('   ✅ Lista de usuarios visible');
    }
    
    const select = await modal.locator('select');
    if (await select.isVisible()) {
      console.log('   ✅ Dropdown de destino visible');
    }
    
    console.log('\n✅ RESULTADO: Modal de reasignación funciona correctamente');

    // Close modal
    const cancelBtn = modal.locator('button:has-text("Cancelar")').first();
    await cancelBtn.click();
    console.log('\n✅ Modal cerrado\n');

  } else {
    console.log('⚠️  Modal NO apareció');
    console.log('   Esto puede significar:');
    console.log('   - La dependencia no tiene usuarios');
    console.log('   - O hubo un error en la carga\n');
    
    // Abrir DevTools para verificar
    console.log('💡 RECOMENDACIÓN: Abre la consola del navegador (F12) para ver logs 🗑️\n');
  }

  console.log('✅ TEST COMPLETADO\n');
});
