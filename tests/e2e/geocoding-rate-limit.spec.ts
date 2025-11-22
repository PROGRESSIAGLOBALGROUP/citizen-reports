/**
 * Test E2E: Geocoding Rate Limiting
 * 
 * Detecta si el problema es causado por rate limiting de Nominatim
 * o por falta de manejo de múltiples requests rápidas
 */

import { test, expect } from '@playwright/test';

test.describe('Geocoding - Rate Limiting & Multiple Requests', () => {
  // No beforeEach needed - these tests use page.request (API calls only)

  test('debe retornar código postal consistentemente en múltiples clicks', async ({ page }) => {
    // Este test hace 5 requests seguidas a Nominatim para Jantetelco
    // y verifica que SIEMPRE retorne el código postal
    
    const results = [];

    for (let i = 0; i < 5; i++) {
      console.log(`\n🔄 Intento ${i + 1}/5`);

      // Obtener respuesta directa del API
      const response = await page.request.get(
        'http://localhost:4000/api/geocode/reverse?lat=18.715&lng=-98.776389'
      );

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      console.log(`✅ Response ${i + 1}:`, data);

      results.push({
        attempt: i + 1,
        success: data.success,
        codigo_postal: data.data?.codigo_postal,
        municipio: data.data?.municipio,
        timestamp: new Date().toISOString()
      });

      // Esperar 1.2 segundos para respetar rate limit de Nominatim (1 req/sec)
      if (i < 4) {
        await page.waitForTimeout(1200);
      }
    }

    // Validar que TODOS los intentos retornen código postal
    console.log('\n📊 Resultados finales:', results);

    results.forEach((result, idx) => {
      expect(result.success).toBe(true);
      expect(result.codigo_postal).toBe('62935');
      expect(result.municipio).toBe('Jantetelco');
    });

    // Verificar que al menos 4 de 5 intentos tuvieron éxito
    const successCount = results.filter(r => r.success).length;
    console.log(`\n✅ ${successCount}/5 intentos exitosos`);
    expect(successCount).toBeGreaterThanOrEqual(4);
  });

  test('debe retornar colonia consistentemente para CDMX en múltiples clicks', async ({ page }) => {
    const results = [];

    for (let i = 0; i < 5; i++) {
      console.log(`\n🔄 Intento ${i + 1}/5`);

      const response = await page.request.get(
        'http://localhost:4000/api/geocode/reverse?lat=19.432600&lng=-99.133200'
      );

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      console.log(`✅ Response ${i + 1}:`, data);

      results.push({
        attempt: i + 1,
        success: data.success,
        colonia: data.data?.colonia,
        codigo_postal: data.data?.codigo_postal,
        timestamp: new Date().toISOString()
      });

      if (i < 4) {
        await page.waitForTimeout(1200);
      }
    }

    console.log('\n📊 Resultados finales:', results);

    results.forEach((result, idx) => {
      expect(result.success).toBe(true);
      expect(result.colonia).toBe('Centro');
      expect(result.codigo_postal).toBe('06000');
    });

    const successCount = results.filter(r => r.success).length;
    console.log(`\n✅ ${successCount}/5 intentos exitosos`);
    expect(successCount).toBeGreaterThanOrEqual(4);
  });
});
