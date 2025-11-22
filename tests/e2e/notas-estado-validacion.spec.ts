import { test, expect } from '@playwright/test';

test.describe('Validación de Notas por Estado', () => {
  const BASE_URL = 'http://localhost:5173';
  const API_URL = 'http://localhost:4000';
  
  test.beforeEach(async ({ page, context }) => {
    // Login como funcionario
    await page.goto(`${BASE_URL}#login`);
    await page.fill('input[type="email"]', 'func.obras1@jantetelco.gob.mx');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("Iniciar Sesión")');
    
    // Esperar a que se complete el login
    await page.waitForURL(`${BASE_URL}#`);
  });

  test('❌ NO permite agregar notas cuando reporte está en pendiente_cierre', async ({ page, request }) => {
    // Primero, verificar que el reporte #1 está en estado pendiente_cierre
    const response = await request.get(`${API_URL}/api/reportes/1/detalle`, {
      headers: {
        'Authorization': `Bearer ${await page.localeStorage.getItem('auth_token')}`
      }
    });
    
    const reporte = await response.json();
    expect(reporte.estado).toBe('pendiente_cierre');
    
    // Navegar a vista del reporte
    await page.goto(`${BASE_URL}#reporte/1`);
    await page.waitForSelector('h2:has-text("Bitácora de Trabajo")');
    
    // Verificar que campo de notas NO está disponible (muestra mensaje de advertencia)
    const advertencia = await page.locator('text=Reporte en revisión').isVisible();
    expect(advertencia).toBe(true);
    
    // Verificar que textarea está deshabilitada
    const textarea = page.locator('textarea[placeholder*="Escribe una nota"]');
    const isDisabled = await textarea.evaluate(el => (el as HTMLTextAreaElement).disabled);
    expect(isDisabled).toBe(true);
  });

  test('✅ Permite agregar notas cuando reporte está en estado abierto/asignado', async ({ page, request }) => {
    // Buscar un reporte que NO esté en pendiente_cierre
    let response = await request.get(`${API_URL}/api/reportes/mis-reportes`, {
      headers: {
        'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('auth_token'))}`
      }
    });
    
    let reportes = await response.json();
    let reporteValido = (reportes as any[]).find((r: any) => r.estado !== 'pendiente_cierre' && r.estado !== 'cerrado');
    
    if (!reporteValido) {
      console.log('⚠️ No hay reportes válidos, creando uno vía API...');
      const crearRes = await request.post(`${API_URL}/api/reportes`, {
        data: {
          tipo: 'baches',
          descripcion: 'Reporte para prueba de notas',
          lat: 18.7160,
          lng: -98.7760,
          peso: 4
        }
      });
      expect(crearRes.ok()).toBeTruthy();
      const nuevoReporte = await crearRes.json();
      reporteValido = nuevoReporte;
    }
    expect(reporteValido).toBeTruthy();
    
    // Navegar a vista del reporte
    await page.goto(`${BASE_URL}#reporte/${reporteValido.id}`);
    await page.waitForSelector('textarea[placeholder*="Escribe una nota"]');
    
    // Verificar que textarea está HABILITADO
    const textarea = page.locator('textarea[placeholder*="Escribe una nota"]');
    const isDisabled = await textarea.evaluate(el => (el as HTMLTextAreaElement).disabled);
    expect(isDisabled).toBe(false);
    
    // Agregar nota
    await textarea.fill('Test: Nota de trabajo válida');
    await page.click('button:has-text("Agregar Nota")');
    
    // Verificar que se agregó
    await expect(page.locator('text=Nota agregada exitosamente')).toBeVisible({ timeout: 5000 });
  });

  test('❌ Backend rechaza POST /notas-trabajo si estado = pendiente_cierre', async ({ request }) => {
    // Obtener token
    const loginRes = await request.post(`${API_URL}/api/login`, {
      data: {
        email: 'func.obras1@jantetelco.gob.mx',
        password: 'admin123'
      }
    });
    
    const { token } = await loginRes.json();
    
    // Intentar agregar nota a reporte en pendiente_cierre
    const addNoteRes = await request.post(`${API_URL}/api/reportes/1/notas-trabajo`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        contenido: 'Intento de agregar nota en estado inválido',
        tipo: 'observacion'
      }
    });
    
    // Debe rechazar con 409 Conflict
    expect(addNoteRes.status()).toBe(409);
    
    const error = await addNoteRes.json();
    expect(error.error).toContain('revisión de cierre');
  });

  test('✅ Backend rechaza POST /notas-trabajo si estado = cerrado', async ({ request }) => {
    // Obtener token
    const loginRes = await request.post(`${API_URL}/api/login`, {
      data: {
        email: 'admin@jantetelco.gob.mx',
        password: 'admin123'
      }
    });
    
    const { token } = await loginRes.json();
    
    // Primero, cerrar un reporte (si existe)
    // Para este test, buscaremos uno que ya esté cerrado
    let getRes = await request.get(`${API_URL}/api/reportes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    let reportes = await getRes.json();
    let reporteCerrado = reportes.find((r: any) => r.estado === 'cerrado');
    
    if (!reporteCerrado) {
      console.log('⚠️ No hay reportes cerrados, creando uno y cerrándolo...');
      const crearRes = await request.post(`${API_URL}/api/reportes`, {
        data: {
          tipo: 'baches',
          descripcion: 'Reporte para cerrar',
          lat: 18.7160,
          lng: -98.7760,
          peso: 4
        }
      });
      expect(crearRes.ok()).toBeTruthy();
      const nuevoReporte = await crearRes.json();
      
      // Cerrar el reporte
      const cerrarRes = await request.post(
        `${API_URL}/api/reportes/${nuevoReporte.id}/cerrar`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      expect(cerrarRes.ok() || cerrarRes.status() === 400).toBeTruthy();
      
      reporteCerrado = { id: nuevoReporte.id, estado: 'cerrado' };
    }
    expect(reporteCerrado).toBeTruthy();
    
    // Intentar agregar nota
    const addNoteRes = await request.post(`${API_URL}/api/reportes/${reporteCerrado.id}/notas-trabajo`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        contenido: 'Intento en reporte cerrado',
        tipo: 'observacion'
      }
    });
    
    // Debe rechazar con 409 Conflict
    expect(addNoteRes.status()).toBe(409);
    
    const error = await addNoteRes.json();
    expect(error.error).toContain('cerrado');
  });

  test('✅ Sección "Solicitar Cierre" visible cuando estado = pendiente_cierre', async ({ page, request }) => {
    // Verificar que reporte #1 está en pendiente_cierre
    const response = await request.get(`${API_URL}/api/reportes/1/detalle`, {
      headers: {
        'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('auth_token'))}`
      }
    });
    
    const reporte = await response.json();
    expect(reporte.estado).toBe('pendiente_cierre');
    
    // Navegar a vista
    await page.goto(`${BASE_URL}#reporte/1`);
    await page.waitForSelector('h2:has-text("Solicitar Cierre")');
    
    // Verificar que texto "Solicitud pendiente de revisión" está visible
    const badge = page.locator('text=Solicitud pendiente de revisión');
    await expect(badge).toBeVisible();
    
    // Botón "Completar Solicitud" NO debe estar visible
    const botonNuevo = page.locator('button:has-text("Completar Solicitud de Cierre")');
    expect(await botonNuevo.isVisible()).toBe(false);
  });

  test('✅ Botón "Completar Solicitud" deshabilitado cuando estado = pendiente_cierre', async ({ page, request }) => {
    // Navegar a reporte en pendiente_cierre
    await page.goto(`${BASE_URL}#reporte/1`);
    await page.waitForSelector('h2:has-text("Solicitar Cierre")');
    
    // Buscar el botón de completar solicitud
    const boton = page.locator('button:has-text("Completar Solicitud de Cierre")');
    
    // NO debe existir o debe estar oculto
    const isVisible = await boton.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });
});
