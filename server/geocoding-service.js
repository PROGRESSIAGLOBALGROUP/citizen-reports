/**
 * Servicio de Geolocalización Inversa (Reverse Geocoding)
 * 
 * Usa Nominatim (OpenStreetMap) para obtener información de ubicación
 * a partir de coordenadas lat/lng
 * 
 * - SIN COSTO
 * - Respeta privacidad (no tracking)
 * - Cumple GDPR/LGPD
 * - Libre de anuncios
 * 
 * Campos extraídos:
 * - colonia (neighborhood, suburb, village)
 * - codigo_postal (postcode)
 * - municipio (city, town)
 * - estado (state, province)
 * - pais (country)
 */

import https from 'https';

/**
 * Rate limiting simple para respetar ToS de Nominatim
 * (máximo 1 req/segundo)
 */
let lastGeocodingTime = 0;
const GEO_RATE_LIMIT = 1100; // ms entre requests

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function respectRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastGeocodingTime;
  if (timeSinceLastRequest < GEO_RATE_LIMIT) {
    await delay(GEO_RATE_LIMIT - timeSinceLastRequest);
  }
  lastGeocodingTime = Date.now();
}

/**
 * Validar coordenadas
 */
function validarCoordenadas(lat, lng) {
  const a = Number(lat);
  const o = Number(lng);
  if (Number.isNaN(a) || Number.isNaN(o)) return false;
  if (a < -90 || a > 90) return false;
  if (o < -180 || o > 180) return false;
  return true;
}

/**
 * Hacer request HTTPS a Nominatim
 * 
 * @param {number} lat - Latitud
 * @param {number} lng - Longitud
 * @returns {Promise<Object>} - Datos de ubicación
 */
function nominatimRequest(lat, lng) {
  return new Promise((resolve, reject) => {
    // Nominatim reverse geocoding endpoint
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    
    // User-Agent requerido por Nominatim ToS
    const options = {
      headers: {
        'User-Agent': 'CitizenReportsAPI/1.0 (https://github.com/PROGRESSIAGLOBALGROUP/citizen-reports)'
      },
      timeout: 5000
    };
    
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('JSON parse error: ' + e.message));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Extraer información de ubicación de respuesta de Nominatim
 * 
 * @param {Object} nominatimData - Respuesta de Nominatim
 * @returns {Object} - Campos estructurados
 */
function extractAddressComponents(nominatimData) {
  const address = nominatimData.address || {};
  
  return {
    colonia: address.neighborhood || address.suburb || address.village || address.hamlet || null,
    codigo_postal: address.postcode || null,
    municipio: address.city || address.town || address.county || null,
    estado_ubicacion: address.state || address.province || null,
    pais: address.country || 'México'
  };
}

/**
 * Función principal: Reverse geocoding
 * 
 * @param {number} lat - Latitud
 * @param {number} lng - Longitud
 * @returns {Promise<Object>} - { success, data, error }
 */
export async function reverseGeocode(lat, lng) {
  try {
    // Validación de entrada
    if (!validarCoordenadas(lat, lng)) {
      return {
        success: false,
        error: 'Coordenadas inválidas'
      };
    }
    
    // Respetar rate limit de Nominatim (1 req/s)
    await respectRateLimit();
    
    // Request a Nominatim
    const nominatimData = await nominatimRequest(lat, lng);
    
    // Extraer componentes de dirección
    const addressComponents = extractAddressComponents(nominatimData);
    
    return {
      success: true,
      data: {
        lat,
        lng,
        ...addressComponents,
        // Datos crudos por si acaso
        _nominatim_raw: nominatimData
      }
    };
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return {
      success: false,
      error: 'Error en geolocalización: ' + error.message
    };
  }
}

/**
 * Validar que al menos colonia o código postal se hayan obtenido
 */
export function hasValidLocationData(data) {
  return data && (data.colonia || data.codigo_postal || data.municipio);
}
