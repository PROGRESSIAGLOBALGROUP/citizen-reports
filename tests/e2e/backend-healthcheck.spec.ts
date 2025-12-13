/**
 * E2E Test: Backend Healthcheck & Connectivity
 * Verifica que el backend Express responde correctamente en /api/health
 * Si el backend está caído, el test debe fallar con error de conexión
 * Si responde, debe retornar status 200 y JSON con status: 'healthy'
 */

import { test, expect } from '@playwright/test';

const API_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4000';

// Healthcheck endpoint (debe estar implementado en server/app.js)
const HEALTH_ENDPOINT = `${API_URL}/api/health`;

test.describe('Backend Healthcheck', () => {
  test('El backend Express responde en /api/health', async ({ request }) => {
    let response;
    try {
      response = await request.get(HEALTH_ENDPOINT);
    } catch (err) {
      // Si hay error de conexión, reportar y fallar el test
      console.error('❌ Error de conexión al backend:', err);
      throw new Error('ERR_CONNECTION_REFUSED: El backend Express no está corriendo en ' + HEALTH_ENDPOINT);
    }
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('status', 'healthy');
  });
});
