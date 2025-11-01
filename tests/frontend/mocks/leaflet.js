import { vi } from 'vitest';

const fakeMap = {
  setView: vi.fn().mockReturnThis(),
  on: vi.fn(),
};

const fakeLayerGroup = {
  addTo: vi.fn().mockReturnThis(),
  clearLayers: vi.fn(),
};

const fakeHeatLayer = {
  addTo: vi.fn().mockReturnThis(),
};

const leaflet = {
  map: vi.fn(() => fakeMap),
  tileLayer: vi.fn(() => ({ addTo: vi.fn().mockReturnThis() })),
  layerGroup: vi.fn(() => fakeLayerGroup),
  heatLayer: vi.fn(() => fakeHeatLayer),
};

export default leaflet;
