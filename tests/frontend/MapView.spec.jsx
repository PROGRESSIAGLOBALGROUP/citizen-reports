import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';

vi.mock('../../client/src/api.js', () => ({
	API_BASE: '',
	crearReporte: vi.fn(),
	listarReportes: vi.fn(),
	tiposReporte: vi.fn(),
	exportGeoJSON: vi.fn(),
	gridAggregates: vi.fn(),
}));

import MapView from '../../client/src/MapView.jsx';
import { WhiteLabelProvider } from '../../client/src/WhiteLabelContext.jsx';

let api;

describe('MapView UI', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		api = await import('../../client/src/api.js');
		api.listarReportes.mockResolvedValue([
			{ id: 1, tipo: 'incendio', descripcion: 'Prueba', lat: 19.4, lng: -99.1, peso: 1 },
		]);
		api.tiposReporte.mockResolvedValue(['incendio']);
		api.gridAggregates.mockResolvedValue([]);
	});

	it.skip('muestra formulario y carga datos iniciales', async () => {
		render(
			<WhiteLabelProvider>
				<MapView />
			</WhiteLabelProvider>
		);

		expect(
			screen.getByRole('heading', { level: 2, name: 'Nuevo reporte' })
		).toBeInTheDocument();

		await waitFor(() => expect(api.tiposReporte).toHaveBeenCalled());
		await waitFor(() => expect(api.listarReportes).toHaveBeenCalled());

		await screen.findByText('1 reportes cargados');
		const tipoChip = await screen.findByRole('checkbox', { name: 'incendio' });
		expect(tipoChip).toBeInTheDocument();
		expect(tipoChip).toBeChecked();
	});

	it.skip('permite alternar modo grid y refrescar datos', async () => {
		api.gridAggregates.mockResolvedValueOnce([
			{ lat: 19.43, lng: -99.13, peso: 5 },
			{ lat: 19.44, lng: -99.14, peso: 3 },
		]);

		render(
			<WhiteLabelProvider>
				<MapView />
			</WhiteLabelProvider>
		);			const gridToggle = await screen.findByRole('checkbox', {
			name: /agregar por celdas/i,
		});

			const user = userEvent.setup();
			await user.click(gridToggle);

		await waitFor(() => expect(api.gridAggregates).toHaveBeenCalled());
		await screen.findByText(/celdas agregadas/i, { selector: 'p' });
	});

	it.skip('cumple criterios básicos de accesibilidad', async () => {
		const { container } = render(
			<WhiteLabelProvider>
				<MapView />
			</WhiteLabelProvider>
		);
		await screen.findByRole('heading', { level: 2, name: 'Nuevo reporte' });
		const results = await axe(container, {
			rules: {
				'color-contrast': { enabled: false },
			},
		});
		expect(results).toHaveNoViolations();
	});
});