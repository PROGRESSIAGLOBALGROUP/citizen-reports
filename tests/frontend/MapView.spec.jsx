import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';

// Mock Leaflet
vi.mock('leaflet', () => {
	const mockMap = {
		setView: vi.fn().mockReturnThis(),
		getBounds: vi.fn().mockReturnValue({
			getSouth: () => 18.5,
			getNorth: () => 19.0,
			getWest: () => -99.0,
			getEast: () => -98.5
		}),
		on: vi.fn(),
		off: vi.fn(),
		remove: vi.fn(),
	};
	const mockLayerGroup = {
		addTo: vi.fn().mockReturnThis(),
		clearLayers: vi.fn(),
		addLayer: vi.fn(),
	};
	return {
		default: {
			map: vi.fn(() => mockMap),
			tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
			layerGroup: vi.fn(() => mockLayerGroup),
			circle: vi.fn(() => ({ bindPopup: vi.fn().mockReturnThis() })),
		},
		map: vi.fn(() => mockMap),
		tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
		layerGroup: vi.fn(() => mockLayerGroup),
		circle: vi.fn(() => ({ bindPopup: vi.fn().mockReturnThis() })),
	};
});

vi.mock('leaflet.heat', () => ({}));

vi.mock('html-to-image', () => ({
	toPng: vi.fn(),
}));

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

// Mock fetch global
global.fetch = vi.fn();

describe('MapView UI', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Mock fetch para reportes
		global.fetch.mockResolvedValue({
			ok: true,
			json: () => Promise.resolve([
				{ id: 1, tipo: 'baches', descripcion: 'Bache grande', lat: 18.715, lng: -98.776, peso: 5 },
				{ id: 2, tipo: 'alumbrado', descripcion: 'Luz fundida', lat: 18.716, lng: -98.777, peso: 3 },
			])
		});
	});

	it('renderiza el título del mapa de calor', async () => {
		render(
			<WhiteLabelProvider>
				<MapView />
			</WhiteLabelProvider>
		);

		// El componente actual tiene un h1 con "Mapa de calor de incidentes"
		expect(screen.getByRole('heading', { level: 1, name: /mapa de calor/i })).toBeInTheDocument();
	});

	it('muestra el contenedor del mapa', async () => {
		render(
			<WhiteLabelProvider>
				<MapView />
			</WhiteLabelProvider>
		);

		// Debe haber un elemento con id="map"
		const mapContainer = document.getElementById('map');
		expect(mapContainer).toBeInTheDocument();
	});

	it('muestra botón para actualizar mapa de calor', async () => {
		render(
			<WhiteLabelProvider>
				<MapView />
			</WhiteLabelProvider>
		);

		// Hay botones con texto "MOSTRAR CALOR" y "Actualizar Mapa de Calor"
		const buttons = screen.getAllByRole('button', { name: /calor/i });
		expect(buttons.length).toBeGreaterThan(0);
	});

	it('cumple criterios básicos de accesibilidad', async () => {
		const { container } = render(
			<WhiteLabelProvider>
				<MapView />
			</WhiteLabelProvider>
		);
		
		// Esperar a que se renderice
		await waitFor(() => {
			expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
		});
		
		const results = await axe(container, {
			rules: {
				'color-contrast': { enabled: false },
				'region': { enabled: false }, // El mapa puede no tener landmark
			},
		});
		expect(results).toHaveNoViolations();
	});
});