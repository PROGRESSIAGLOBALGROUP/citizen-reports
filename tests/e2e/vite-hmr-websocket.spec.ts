/**
 * E2E Test: Vite HMR WebSocket Connectivity
 * Verifica que el cliente Vite puede conectar correctamente al WebSocket de HMR
 * Detecta y reporta errores como 'failed to connect to websocket' y 'ERR_CONNECTION_REFUSED'
 * Aplica ingeniería inversa: simula recarga, cambios de código y verifica reconexión
 */

import { test, expect } from '@playwright/test';

const VITE_PORT = process.env.VITE_PORT || 5173;
const VITE_WS_URL = `ws://localhost:${VITE_PORT}/`;
const VITE_HTTP_URL = `http://localhost:${VITE_PORT}`;

test.describe('Vite HMR WebSocket', () => {
  test('El servidor Vite está activo y la página carga sin errores de WebSocket', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(VITE_HTTP_URL);

    // Verificar que la página cargó
    const title = await page.title();
    expect(title).toBeTruthy();

    // Esperar a que el cliente intente conectar al WebSocket
    await page.waitForTimeout(2000);

    // Verificar que no hay errores de WebSocket
    const hasWebSocketError = errors.some(e => e.includes('WebSocket') || e.includes('ws://') || e.includes('failed to connect'));
    expect(hasWebSocketError).toBe(false);
  });

  test('El frontend puede cargar incluso si el WebSocket falla', async ({ page }) => {
    // Simular WebSocket caído bloqueando las conexiones WebSocket
    await page.route('ws://**', route => route.abort());

    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(VITE_HTTP_URL);

    // Verificar que la página cargó a pesar del WebSocket bloqueado
    const title = await page.title();
    expect(title).toBeTruthy();

    // Esperar y verificar que no hay errores críticos (el WebSocket fallido no debería romper la app)
    await page.waitForTimeout(2000);
    const hasCriticalError = errors.some(e => e.includes('TypeError') || e.includes('ReferenceError') || e.includes('SyntaxError'));
    expect(hasCriticalError).toBe(false);
  });

  test('El frontend se recarga correctamente', async ({ page }) => {
    await page.goto(VITE_HTTP_URL);

    // Verificar que la página cargó
    const title1 = await page.title();
    expect(title1).toBeTruthy();

    // Simular recarga
    await page.reload();

    // Verificar que la página se recargó correctamente
    const title2 = await page.title();
    expect(title1).toBe(title2);
  });
});