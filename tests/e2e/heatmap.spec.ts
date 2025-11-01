import { test, expect } from '@playwright/test';

test('permite registrar y visualizar un reporte', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 720 });
	await page.goto('/');

	const tileResponse = await page.waitForResponse((response) =>
		response.url().includes('/tiles/') && response.status() === 200
	);
	const tileHeaders = tileResponse.headers();
	expect(tileHeaders['content-type']).toContain('image/png');

	const heatCanvas = page.locator('#map canvas.leaflet-heatmap-layer');
	await expect(heatCanvas).toHaveCount(1, { timeout: 5000 });
	const box = await heatCanvas.boundingBox();
	expect(box?.width ?? 0).toBeGreaterThan(0);
	expect(box?.height ?? 0).toBeGreaterThan(0);

	await expect(page).toHaveScreenshot('heatmap-default.png', {
		animations: 'disabled',
		fullPage: true,
		maxDiffPixelRatio: 0.02
	});

	await expect(page.getByRole('heading', { level: 1, name: /Mapa de calor/i })).toBeVisible();

	const counter = page.locator('p.hint');
	await expect(counter).toBeVisible();
	await expect(counter).toHaveText(/reportes cargados/);

	const parseCount = async () => {
		const text = await counter.textContent();
		const match = text?.match(/\d+/);
		return match ? Number(match[0]) : 0;
	};

	const initialCount = await parseCount();
	const tipo = `alerta-${Date.now()}`;

		await page.getByLabel('Tipo', { exact: true }).fill(tipo);
		await page.getByLabel('Descripción').fill('Incidente de prueba E2E');
		await page.getByLabel('Lat', { exact: true }).fill('19.432600');
		await page.getByLabel('Lng', { exact: true }).fill('-99.133200');
	await page.getByLabel('Peso (intensidad)').fill('2');
	await page.getByRole('button', { name: 'Guardar' }).click();

	await expect.poll(parseCount, { timeout: 5000 }).toBeGreaterThan(initialCount);
	const filtroTipo = page.locator('select[aria-label="Filtrar por tipo"]');
	await expect(filtroTipo.locator(`option[value="${tipo}"]`)).toHaveCount(1);

	await page.getByRole('checkbox', { name: /agregar por celdas/i }).check();
	await expect(counter).toHaveText(/celdas agregadas/);
});