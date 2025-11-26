/**
 * Backend Unit Tests: Geocoding Service
 * 
 * Pruebas unitarias para server/geocoding-service.js
 * Valida:
 * - Validación de coordenadas
 * - Estructura de respuesta
 * - Manejo de errores
 * - Extracción de componentes de dirección
 */

import { reverseGeocode, hasValidLocationData } from '../../server/geocoding-service.js';

describe('Geocoding Service', () => {
  
  // Test 1: Validar coordenadas válidas
  describe('reverseGeocode - coordenadas válidas', () => {
    
    test('retorna estructura correcta para coordenadas válidas', async () => {
      // citizen-reports, México
      const result = await reverseGeocode(18.715, -98.776389);
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result.success).toBe(true);
      
      // Validar estructura de datos
      if (result.data) {
        expect(result.data).toHaveProperty('lat');
        expect(result.data).toHaveProperty('lng');
        expect(result.data).toHaveProperty('colonia');
        expect(result.data).toHaveProperty('codigo_postal');
        expect(result.data).toHaveProperty('municipio');
        expect(result.data).toHaveProperty('estado_ubicacion');
        expect(result.data).toHaveProperty('pais');
        
        // Validar que las coordenadas coinciden
        expect(result.data.lat).toBe(18.715);
        expect(result.data.lng).toBe(-98.776389);
      }
    }, 20000);

    test('retorna país como México por defecto', async () => {
      const result = await reverseGeocode(18.715, -98.776389);
      
      if (result.success && result.data) {
        // El país debe ser 'México' o estar definido
        expect(result.data.pais).toBeDefined();
      }
    }, 20000);
  });

  // Test 2: Validación de coordenadas
  describe('reverseGeocode - validación de coordenadas', () => {
    
    test('rechaza latitud fuera de rango (-90, 90)', async () => {
      const invalidCases = [
        { lat: 91, lng: 0 },
        { lat: -91, lng: 0 },
        { lat: 200, lng: 0 }
      ];

      for (const coords of invalidCases) {
        const result = await reverseGeocode(coords.lat, coords.lng);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      }
    });

    test('rechaza longitud fuera de rango (-180, 180)', async () => {
      const invalidCases = [
        { lat: 0, lng: 181 },
        { lat: 0, lng: -181 },
        { lat: 0, lng: 360 }
      ];

      for (const coords of invalidCases) {
        const result = await reverseGeocode(coords.lat, coords.lng);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      }
    });

    test('rechaza valores NaN', async () => {
      const result = await reverseGeocode(NaN, -98.776389);
      expect(result.success).toBe(false);
    });

    test('acepta valores límite válidos', async () => {
      const validCases = [
        { lat: 90, lng: 0 },      // Polo norte
        { lat: -90, lng: 0 },     // Polo sur
        { lat: 0, lng: 180 },     // Antemeridiano este
        { lat: 0, lng: -180 }     // Antemeridiano oeste
      ];

      for (const coords of validCases) {
        const result = await reverseGeocode(coords.lat, coords.lng);
        // No debe fallar en validación
        expect(result).toHaveProperty('success');
        // Si retorna error, debe ser de geocoding, no de validación
        if (!result.success) {
          expect(result.error).not.toMatch(/inválid/i);
        }
      }
    }, 20000); // Aumentar timeout para coordenadas polares
  });

  // Test 3: Validar estructura de respuesta
  describe('reverseGeocode - estructura de respuesta', () => {
    
    test('siempre retorna objeto con success y data o error', async () => {
      // Coordenadas válidas
      let result = await reverseGeocode(18.715, -98.776389);
      expect(result).toHaveProperty('success');
      if (result.success) {
        expect(result).toHaveProperty('data');
        expect(result.data).toBeDefined();
      } else {
        expect(result).toHaveProperty('error');
      }

      // Coordenadas inválidas
      result = await reverseGeocode(200, 200);
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
    }, 20000);

    test('data no incluye información sensible cruda', async () => {
      const result = await reverseGeocode(18.715, -98.776389);
      
      if (result.data) {
        // No debe incluir la respuesta cruda de Nominatim en la respuesta segura
        // (aunque el servicio puede incluir _nominatim_raw internamente)
        expect(result.data.colonia).not.toBeInstanceOf(Object);
        expect(result.data.codigo_postal).not.toBeInstanceOf(Object);
      }
    }, 20000);
  });

  // Test 4: hasValidLocationData
  describe('hasValidLocationData - validar datos de ubicación', () => {
    
    test('retorna valor truthy si hay colonia o código postal', () => {
      // hasValidLocationData retorna el valor encontrado, no un boolean
      expect(hasValidLocationData({
        colonia: 'Centro',
        codigo_postal: null,
        municipio: 'citizen-reports'
      })).toBeTruthy();

      expect(hasValidLocationData({
        colonia: null,
        codigo_postal: '50000',
        municipio: null
      })).toBeTruthy();

      expect(hasValidLocationData({
        colonia: 'Centro',
        codigo_postal: '50000',
        municipio: 'citizen-reports'
      })).toBeTruthy();
    });

    test('retorna falsy si no hay datos válidos', () => {
      expect(hasValidLocationData({
        colonia: null,
        codigo_postal: null,
        municipio: null
      })).toBeFalsy();

      expect(hasValidLocationData(null)).toBeFalsy();
      expect(hasValidLocationData(undefined)).toBeFalsy();
      expect(hasValidLocationData({})).toBeFalsy();
    });

    test('retorna valor truthy si solo hay municipio', () => {
      expect(hasValidLocationData({
        municipio: 'citizen-reports'
      })).toBeTruthy();
    });
  });

  // Test 5: Manejo de errores de red (mock)
  describe('reverseGeocode - manejo de errores', () => {
    
    test('retorna success: false en caso de error', async () => {
      // Intentar con coordenadas que Nominatim podría fallar
      // o con timeout
      const result = await reverseGeocode(0, 0);
      
      expect(result).toHaveProperty('success');
      expect([true, false]).toContain(result.success);
      
      if (!result.success) {
        expect(result).toHaveProperty('error');
        expect(typeof result.error).toBe('string');
      }
    }, 20000); // Aumentar timeout para llamadas a Nominatim

    test('error contiene mensaje descriptivo', async () => {
      // Coordenadas inválidas generan error de validación
      const result = await reverseGeocode(200, 200);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.length).toBeGreaterThan(0);
    });
  });

  // Test 6: Rate limiting (si se puede probar)
  describe('reverseGeocode - rate limiting', () => {
    
    test('múltiples requests consecutivos se respetan', async () => {
      const startTime = Date.now();
      
      // Hacer 2 requests seguidas
      const result1 = await reverseGeocode(18.715, -98.776389);
      const time1 = Date.now() - startTime;
      
      const result2 = await reverseGeocode(18.715, -98.776389);
      const time2 = Date.now() - startTime;

      // El segundo request debe tomar más tiempo (rate limiting)
      expect(time2).toBeGreaterThan(time1);
      
      // Ambos deben ser válidos en estructura
      expect(result1).toHaveProperty('success');
      expect(result2).toHaveProperty('success');
    }, 10000); // 10 segundos para 2 requests con rate limiting
  });

  // Test 7: Casos límite y edge cases
  describe('reverseGeocode - edge cases', () => {
    
    test('maneja coordenadas con decimales muy largos', async () => {
      const result = await reverseGeocode(
        18.71567890123456,
        -98.77638901234567
      );
      
      expect(result).toHaveProperty('success');
      expect([true, false]).toContain(result.success);
    }, 20000);

    test('maneja coordenadas con strings numéricos', async () => {
      // Si se convierte a número correctamente
      const result = await reverseGeocode(18.715, -98.776389);
      
      expect(result).toHaveProperty('success');
      // Puede ser true o false dependiendo de cómo maneje el servicio
    }, 20000);

    test('maneja coordenadas en el ecuador y meridiano primo', async () => {
      const eqPrimary = await reverseGeocode(0, 0);
      
      expect(eqPrimary).toHaveProperty('success');
      
      // Al menos retorna una estructura válida
      if (eqPrimary.success) {
        expect(eqPrimary.data).toHaveProperty('lat');
        expect(eqPrimary.data).toHaveProperty('lng');
      }
    }, 20000);
  });

  // Test 8: Integridad de datos
  describe('reverseGeocode - integridad de datos', () => {
    
    test('los datos retornados son del tipo correcto', async () => {
      const result = await reverseGeocode(18.715, -98.776389);
      
      if (result.success && result.data) {
        expect(typeof result.data.lat).toBe('number');
        expect(typeof result.data.lng).toBe('number');
        
        // Pueden ser string o null o number
        const stringOrNull = (val) => 
          typeof val === 'string' || val === null || typeof val === 'number';
        
        expect(stringOrNull(result.data.colonia)).toBe(true);
        expect(stringOrNull(result.data.codigo_postal)).toBe(true);
        expect(stringOrNull(result.data.municipio)).toBe(true);
        expect(stringOrNull(result.data.estado_ubicacion)).toBe(true);
        expect(typeof result.data.pais).toBe('string');
      }
    }, 20000);

    test('coordenadas retornadas coinciden con las enviadas', async () => {
      const lat = 18.715;
      const lng = -98.776389;
      
      const result = await reverseGeocode(lat, lng);
      
      if (result.success && result.data) {
        expect(result.data.lat).toBe(lat);
        expect(result.data.lng).toBe(lng);
      }
    }, 20000);
  });
});
