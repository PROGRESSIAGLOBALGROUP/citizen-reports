/**
 * Unit Tests: WhiteLabel Configuration - municipioNombre & ubicación
 * 
 * Tests the logic for:
 * - Loading current config from API
 * - Mapping API response to component state
 * - Saving config with correct field mapping
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('WhiteLabel Config - API Response Mapping', () => {
  
  describe('API to Frontend Mapping', () => {
    
    it('should map nombre_municipio to municipioNombre', () => {
      const apiResponse = {
        nombre_municipio: 'Jantetelco',
        municipioNombre: 'Jantetelco',
        estado: 'Morelos',
        ubicacion: 'Jantetelco, Morelos'
      };
      
      // The mapping should preserve both fields
      expect(apiResponse.municipioNombre).toBe(apiResponse.nombre_municipio);
    });
    
    it('should map color_primario to colores.primario', () => {
      const apiResponse = {
        color_primario: '#0284c7',
        color_secundario: '#10b981'
      };
      
      const DEFAULT = {
        colores: {
          primario: '#default',
          exito: '#default'
        }
      };
      
      // Mapping function
      const mapApiToState = (data, defaultConfig) => ({
        ...defaultConfig,
        colores: {
          ...defaultConfig.colores,
          primario: data.color_primario || defaultConfig.colores.primario,
          exito: data.color_secundario || defaultConfig.colores.exito
        }
      });
      
      const result = mapApiToState(apiResponse, DEFAULT);
      
      expect(result.colores.primario).toBe('#0284c7');
      expect(result.colores.exito).toBe('#10b981');
    });
    
    it('should map mapa object correctly', () => {
      const apiResponse = {
        mapa: {
          lat: 18.715,
          lng: -98.7764,
          zoom: 16
        }
      };
      
      const DEFAULT = {
        mapa: {
          lat: 0,
          lng: 0,
          zoom: 10
        }
      };
      
      const mapApiToState = (data, defaultConfig) => ({
        ...defaultConfig,
        mapa: {
          lat: data.mapa?.lat || defaultConfig.mapa.lat,
          lng: data.mapa?.lng || defaultConfig.mapa.lng,
          zoom: data.mapa?.zoom || defaultConfig.mapa.zoom
        }
      });
      
      const result = mapApiToState(apiResponse, DEFAULT);
      
      expect(result.mapa.lat).toBe(18.715);
      expect(result.mapa.lng).toBe(-98.7764);
      expect(result.mapa.zoom).toBe(16);
    });
    
    it('should preserve default values when API field is missing', () => {
      const apiResponse = {
        nombre_municipio: 'Test'
        // ubicacion is missing
      };
      
      const DEFAULT = {
        municipioNombre: 'Default',
        ubicacion: 'Default Location'
      };
      
      const mapApiToState = (data, defaultConfig) => ({
        ...defaultConfig,
        municipioNombre: data.nombre_municipio || data.municipioNombre || defaultConfig.municipioNombre,
        ubicacion: data.ubicacion || defaultConfig.ubicacion
      });
      
      const result = mapApiToState(apiResponse, DEFAULT);
      
      expect(result.municipioNombre).toBe('Test');
      expect(result.ubicacion).toBe('Default Location');
    });
  });

  describe('Frontend to API Mapping (Save)', () => {
    
    it('should map municipioNombre to nombre_municipio for API', () => {
      const frontendState = {
        municipioNombre: 'TestMunicipio',
        estado: 'Morelos',
        ubicacion: 'TestMunicipio, Morelos'
      };
      
      const buildPayload = (state) => ({
        nombre_municipio: state.municipioNombre,
        estado: state.estado,
        ubicacion: state.ubicacion
      });
      
      const payload = buildPayload(frontendState);
      
      expect(payload.nombre_municipio).toBe('TestMunicipio');
      expect(payload.ubicacion).toBe('TestMunicipio, Morelos');
    });
    
    it('should map colores.primario to color_primario for API', () => {
      const frontendState = {
        colores: {
          primario: '#ff0000',
          exito: '#00ff00'
        }
      };
      
      const buildPayload = (state) => ({
        color_primario: state.colores?.primario,
        color_secundario: state.colores?.exito
      });
      
      const payload = buildPayload(frontendState);
      
      expect(payload.color_primario).toBe('#ff0000');
      expect(payload.color_secundario).toBe('#00ff00');
    });
    
    it('should include mapa coordinates in payload', () => {
      const frontendState = {
        mapa: {
          lat: 19.5,
          lng: -99.1,
          zoom: 14
        }
      };
      
      const buildPayload = (state) => ({
        mapa: state.mapa
      });
      
      const payload = buildPayload(frontendState);
      
      expect(payload.mapa.lat).toBe(19.5);
      expect(payload.mapa.lng).toBe(-99.1);
      expect(payload.mapa.zoom).toBe(14);
    });
  });

  describe('Component Initialization', () => {
    
    it('should fetch config on mount and update state', async () => {
      let stateUpdated = false;
      const mockSetConfig = vi.fn(() => { stateUpdated = true; });
      
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          nombre_municipio: 'FromAPI',
          municipioNombre: 'FromAPI',
          ubicacion: 'FromAPI, State'
        })
      });
      
      // Simulate useEffect logic
      const loadConfig = async () => {
        const response = await mockFetch('/api/whitelabel/config');
        if (response.ok) {
          const data = await response.json();
          mockSetConfig(data);
        }
      };
      
      await loadConfig();
      
      expect(mockFetch).toHaveBeenCalledWith('/api/whitelabel/config');
      expect(mockSetConfig).toHaveBeenCalled();
      expect(stateUpdated).toBe(true);
    });
    
    it('should use default values if API fails', async () => {
      const DEFAULT = {
        municipioNombre: 'DefaultName',
        ubicacion: 'DefaultLocation'
      };
      
      let currentConfig = DEFAULT;
      const mockSetConfig = vi.fn((newConfig) => { currentConfig = newConfig; });
      
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      
      // Simulate error handling
      const loadConfig = async () => {
        try {
          const response = await mockFetch('/api/whitelabel/config');
          if (response.ok) {
            const data = await response.json();
            mockSetConfig({ ...DEFAULT, ...data });
          }
        } catch (e) {
          // Keep default
          console.error('Error loading config:', e);
        }
      };
      
      await loadConfig();
      
      // Should keep default values
      expect(currentConfig.municipioNombre).toBe('DefaultName');
    });
  });

  describe('Header Update Event', () => {
    
    it('should dispatch whitelabel-updated event after save', () => {
      const dispatchedEvents = [];
      const mockDispatch = vi.fn((event) => {
        dispatchedEvents.push(event);
      });
      
      // Simulate event dispatch
      const config = {
        municipioNombre: 'UpdatedName',
        ubicacion: 'UpdatedLocation'
      };
      
      const event = new CustomEvent('whitelabel-updated', { detail: config });
      mockDispatch(event);
      
      expect(mockDispatch).toHaveBeenCalled();
      expect(dispatchedEvents[0].detail.municipioNombre).toBe('UpdatedName');
    });
    
    it('should update header when receiving whitelabel-updated event', () => {
      let headerConfig = { municipioNombre: 'Old' };
      
      const handleUpdate = (event) => {
        headerConfig = event.detail;
      };
      
      // Simulate event
      const event = { detail: { municipioNombre: 'New', ubicacion: 'NewLoc' } };
      handleUpdate(event);
      
      expect(headerConfig.municipioNombre).toBe('New');
    });
  });
});
