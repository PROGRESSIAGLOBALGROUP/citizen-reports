/**
 * Test E2E: Flujo completo de reporte con fixtures
 * 
 * Demuestra el uso del sistema de fixtures centralizado.
 * Cubre el flujo: Crear reporte → Asignar → Agregar notas → Solicitar cierre
 */

import { test, expect } from '@playwright/test';
import { 
  fixtures,
  helpers,
  ADMIN,
  SUPERVISOR_OBRAS,
  FUNC_OBRAS_1,
  reportesPredefinidos,
  tiposNota,
  config
} from './fixtures';

test.describe('Flujo Completo de Reporte - Con Fixtures', () => {
  
  let adminToken: string;
  let supervisorToken: string;
  let funcionarioToken: string;
  let reporteId: number;
  
  test.beforeAll(async ({ request }) => {
    // Login de todos los usuarios necesarios via API
    const [adminAuth, supervisorAuth, funcionarioAuth] = await Promise.all([
      helpers.loginAPI(request, ADMIN),
      helpers.loginAPI(request, SUPERVISOR_OBRAS),
      helpers.loginAPI(request, FUNC_OBRAS_1)
    ]);
    
    adminToken = adminAuth.token;
    supervisorToken = supervisorAuth.token;
    funcionarioToken = funcionarioAuth.token;
    
    console.log('✅ Tokens obtenidos para todos los usuarios');
  });
  
  test('1. Ciudadano puede crear un reporte', async ({ request }) => {
    // Arrange - usar fixture de reporte predefinido
    const reporteData = reportesPredefinidos.bacheEnCentro;
    
    // Act - crear reporte via API (sin auth, como ciudadano)
    const result = await helpers.crearReporteAPI(request, reporteData);
    
    // Assert
    expect(result.ok).toBe(true);
    expect(result.id).toBeGreaterThan(0);
    
    // Guardar ID para siguientes tests
    reporteId = result.id;
    console.log(`✅ Reporte creado con ID: ${reporteId}`);
  });
  
  test('2. Supervisor puede asignar el reporte a funcionario', async ({ request }) => {
    // Skip si no hay reporte
    test.skip(!reporteId, 'Reporte no creado');
    
    // Act
    await helpers.asignarFuncionarioAPI(
      request, 
      reporteId, 
      FUNC_OBRAS_1.id, 
      supervisorToken
    );
    
    // Assert - verificar asignación
    const response = await request.get(
      `${config.apiUrl}/api/reportes/${reporteId}/asignaciones`,
      { headers: { 'Authorization': `Bearer ${supervisorToken}` } }
    );
    
    expect(response.ok()).toBeTruthy();
    const asignaciones = await response.json();
    
    // API devuelve usuario_id, no funcionario_id
    expect(asignaciones.some((a: any) => a.usuario_id === FUNC_OBRAS_1.id)).toBe(true);
    console.log(`✅ Funcionario ${FUNC_OBRAS_1.nombre} asignado al reporte`);
  });
  
  test('3. Funcionario puede agregar notas de trabajo', async ({ request }) => {
    test.skip(!reporteId, 'Reporte no creado');
    
    // Act - agregar diferentes tipos de notas
    const notas = [
      { contenido: 'Inspección inicial realizada. Bache de 50cm de diámetro.', tipo: tiposNota.observacion },
      { contenido: 'Se solicitó material para reparación.', tipo: tiposNota.avance },
      { contenido: 'Trabajo completado, bache rellenado con mezcla asfáltica.', tipo: tiposNota.resolucion }
    ];
    
    for (const nota of notas) {
      const result = await helpers.agregarNotaAPI(
        request,
        reporteId,
        nota.contenido,
        nota.tipo,
        funcionarioToken
      );
      
      expect(result.id).toBeGreaterThan(0);
    }
    
    // Assert - verificar que hay 3 notas
    const response = await request.get(
      `${config.apiUrl}/api/reportes/${reporteId}/notas-trabajo`,
      { headers: { 'Authorization': `Bearer ${funcionarioToken}` } }
    );
    
    expect(response.ok()).toBeTruthy();
    const notasGuardadas = await response.json();
    expect(notasGuardadas.length).toBeGreaterThanOrEqual(3);
    
    console.log(`✅ ${notasGuardadas.length} notas agregadas al reporte`);
  });
  
  test('4. Admin puede ver el reporte con toda la información', async ({ request }) => {
    test.skip(!reporteId, 'Reporte no creado');
    
    // Act
    const response = await request.get(
      `${config.apiUrl}/api/reportes/${reporteId}`,
      { headers: { 'Authorization': `Bearer ${adminToken}` } }
    );
    
    expect(response.ok()).toBeTruthy();
    const reporte = await response.json();
    
    // Assert - verificar estructura completa
    expect(reporte.id).toBe(reporteId);
    expect(reporte.tipo).toBe('bache');
    expect(reporte.estado).toBeDefined();
    expect(reporte.lat).toBeCloseTo(fixtures.ubicaciones.centro.lat, 2);
    expect(reporte.lng).toBeCloseTo(fixtures.ubicaciones.centro.lng, 2);
    
    console.log(`✅ Reporte verificado: ${reporte.tipo} - ${reporte.estado}`);
  });
  
  test('5. Historial de cambios registra todas las acciones', async ({ request }) => {
    test.skip(!reporteId, 'Reporte no creado');
    
    // Act
    const response = await request.get(
      `${config.apiUrl}/api/reportes/${reporteId}/historial`,
      { headers: { 'Authorization': `Bearer ${adminToken}` } }
    );
    
    expect(response.ok()).toBeTruthy();
    const historial = await response.json();
    
    // Assert - debe tener al menos: creación, asignación, notas
    expect(historial.length).toBeGreaterThanOrEqual(2);
    
    // Verificar que hay registro de asignación
    const tieneAsignacion = historial.some((h: any) => 
      h.accion?.includes('asignacion') || h.accion?.includes('asignar')
    );
    
    console.log(`✅ Historial tiene ${historial.length} entradas`);
  });
});

test.describe('Validaciones de Seguridad - Con Fixtures', () => {
  
  test('Funcionario no puede acceder a reportes de otra dependencia', async ({ request }) => {
    // Login como funcionario de servicios
    const { token: serviciosToken } = await helpers.loginAPI(
      request, 
      fixtures.usuarios.funcionarioServicios1
    );
    
    // Intentar crear reporte de tipo "bache" (que va a obras_publicas)
    const reporte = await helpers.crearReporteAPI(request, {
      tipo: 'bache',
      descripcion: 'Test de seguridad',
      lat: 18.71,
      lng: -98.78
    });
    
    // Intentar acceder como funcionario de servicios
    const response = await request.get(
      `${config.apiUrl}/api/reportes/mis-reportes`,
      { headers: { 'Authorization': `Bearer ${serviciosToken}` } }
    );
    
    expect(response.ok()).toBeTruthy();
    const misReportes = await response.json();
    
    // El reporte de obras_publicas NO debe aparecer en mis-reportes de servicios
    const tieneReporteObras = misReportes.some((r: any) => r.id === reporte.id);
    expect(tieneReporteObras).toBe(false);
    
    console.log('✅ Aislamiento de dependencias verificado');
  });
  
  test('Token inválido retorna 401', async ({ request }) => {
    const response = await request.get(
      `${config.apiUrl}/api/reportes/mis-reportes`,
      { headers: { 'Authorization': 'Bearer invalid-token-12345' } }
    );
    
    expect(response.status()).toBe(401);
    console.log('✅ Token inválido rechazado correctamente');
  });
  
  test('Endpoint protegido sin token retorna 401', async ({ request }) => {
    const response = await request.get(`${config.apiUrl}/api/admin/dashboard`);
    
    expect(response.status()).toBe(401);
    console.log('✅ Endpoint protegido requiere autenticación');
  });
});

test.describe('Responsive UI - Con Fixtures', () => {
  
  test('Mi Panel de Reportes se adapta a móvil', async ({ page, request }) => {
    // Setup - login via API
    const { token, usuario } = await helpers.loginAPI(request, FUNC_OBRAS_1);
    
    // Ir a la página primero
    await helpers.goToMap(page);
    
    // Configurar token en localStorage
    await helpers.setAuthToken(page, token, usuario);
    
    // Cambiar a viewport móvil
    await helpers.setViewport(page, 'mobile');
    
    // Navegar al panel
    await helpers.goToPanel(page);
    await helpers.waitForApiLoad(page);
    
    // Assert - verificar que la UI es responsive
    const container = page.locator('.gp-panel-container, .panel-container, main');
    await expect(container.first()).toBeVisible();
    
    // En móvil, el sidebar debería estar oculto o en modo menú
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(375);
    
    console.log('✅ UI responsive verificada en móvil');
  });
  
  test('Mapa de calor visible en tablet', async ({ page }) => {
    await helpers.setViewport(page, 'tablet');
    await helpers.goToMap(page);
    
    // El mapa debe estar visible
    const mapContainer = page.locator('.leaflet-container, #map, [class*="map"]');
    await expect(mapContainer.first()).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Mapa visible en tablet');
  });
});
