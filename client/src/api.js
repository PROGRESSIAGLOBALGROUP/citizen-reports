// Mock API para desarrollo cuando el servidor no funciona
const MOCK_DATA = [
  // Centro de citizen-reports - Concentración alta
  {id: 1, tipo: 'infraestructura', descripcion: 'Baches en calle principal', lat: 18.816667, lng: -98.966667, peso: 8, creado_en: '2025-09-27T10:00:00Z'},
  {id: 2, tipo: 'servicios', descripcion: 'Falta de alumbrado público', lat: 18.816700, lng: -98.966600, peso: 7, creado_en: '2025-09-27T10:15:00Z'},
  {id: 3, tipo: 'seguridad', descripcion: 'Zona poco transitada en la noche', lat: 18.816600, lng: -98.966700, peso: 9, creado_en: '2025-09-27T10:30:00Z'},
  {id: 4, tipo: 'infraestructura', descripcion: 'Banqueta dañada', lat: 18.816750, lng: -98.966550, peso: 6, creado_en: '2025-09-27T10:45:00Z'},
  {id: 5, tipo: 'servicios', descripcion: 'Recolección de basura irregular', lat: 18.816550, lng: -98.966750, peso: 8, creado_en: '2025-09-27T11:00:00Z'},
  
  // Zona norte de citizen-reports
  {id: 6, tipo: 'transporte', descripcion: 'Falta señalización vial', lat: 18.817200, lng: -98.966300, peso: 5, creado_en: '2025-09-27T11:15:00Z'},
  {id: 7, tipo: 'servicios', descripcion: 'Parque requiere mantenimiento', lat: 18.817100, lng: -98.966400, peso: 7, creado_en: '2025-09-27T11:30:00Z'},
  {id: 8, tipo: 'infraestructura', descripcion: 'Coladera sin tapa', lat: 18.817000, lng: -98.966500, peso: 9, creado_en: '2025-09-27T11:45:00Z'},
  
  // Zona sur de citizen-reports  
  {id: 9, tipo: 'seguridad', descripcion: 'Necesita cámara de vigilancia', lat: 18.816200, lng: -98.967000, peso: 6, creado_en: '2025-09-27T12:00:00Z'},
  {id: 10, tipo: 'transporte', descripcion: 'Tope en mal estado', lat: 18.816100, lng: -98.967100, peso: 5, creado_en: '2025-09-27T12:15:00Z'},
  
  // Zona este de citizen-reports
  {id: 11, tipo: 'infraestructura', descripcion: 'Pavimento en mal estado', lat: 18.816800, lng: -98.966200, peso: 7, creado_en: '2025-09-27T12:30:00Z'},
  {id: 12, tipo: 'servicios', descripcion: 'Falta de drenaje', lat: 18.816900, lng: -98.966100, peso: 8, creado_en: '2025-09-27T12:45:00Z'},
  
  // Zona oeste de citizen-reports
  {id: 13, tipo: 'seguridad', descripcion: 'Iluminación deficiente', lat: 18.816400, lng: -98.967200, peso: 6, creado_en: '2025-09-27T13:00:00Z'},
  {id: 14, tipo: 'transporte', descripcion: 'Semáforo descompuesto', lat: 18.816500, lng: -98.967100, peso: 9, creado_en: '2025-09-27T13:15:00Z'},
  
  // Puntos adicionales para mejor visualización
  {id: 15, tipo: 'infraestructura', descripcion: 'Calle sin pavimentar', lat: 18.816300, lng: -98.966800, peso: 5, creado_en: '2025-09-27T13:30:00Z'}
];

const MOCK_TIPOS = ['infraestructura', 'servicios', 'seguridad', 'transporte'];

// En desarrollo, usa ruta vacía para aprovechar el proxy de Vite (/api -> localhost:4000)
// En producción, el backend sirve el frontend, así que también funciona con ruta vacía
export const API_BASE = '';
const USE_MOCK = false;

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      if (value.length === 0) return;
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') {
          search.append(key, item);
        }
      });
      return;
    }
    if (value === '') return;
    search.append(key, value);
  });
  return search.toString();
}

async function mockFetch(url, options = {}) {
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const urlObj = new URL(url, 'http://localhost:4000');
  
  if (urlObj.pathname === '/api/reportes/tipos') {
    return {
      ok: true,
      json: async () => MOCK_TIPOS
    };
  }
  
  if (urlObj.pathname === '/api/reportes') {
    if (options.method === 'POST') {
      const newReporte = {
        id: Date.now(),
        ...JSON.parse(options.body),
        creado_en: new Date().toISOString()
      };
      MOCK_DATA.push(newReporte);
      return {
        ok: true,
        json: async () => newReporte
      };
    }
    
    // Filtrar por tipos si se especifican
    let filteredData = [...MOCK_DATA];
    const params = new URLSearchParams(urlObj.search);
    const tipos = params.getAll('tipo');
    
    if (tipos.length > 0) {
      filteredData = filteredData.filter(reporte => tipos.includes(reporte.tipo));
    }
    
    return {
      ok: true,
      json: async () => filteredData
    };
  }
  
  throw new Error(`Mock endpoint not found: ${urlObj.pathname}`);
}

async function apiCall(url, options = {}) {
  if (USE_MOCK) {
    console.log(`🔧 Usando mock para: ${url}`);
    return mockFetch(url, options);
  }
  
  // Intentar llamada real sin fallback automático
  console.log(`🌐 apiCall FETCH: ${url}`);
  const response = await fetch(url, options);
  console.log(`🌐 apiCall RESPONSE: ${url} → ${response.status}`);
  
  // Si falla, lanzar error en lugar de usar mock silenciosamente
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ API error ${response.status} para ${url}:`, errorText);
    throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
  }
  
  return response;
}

export async function crearReporte(data) {
  const r = await apiCall(`${API_BASE}/api/reportes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return r.json();
}

export async function listarReportes(params = {}) {
  const qs = buildQuery(params);
  const url = `${API_BASE}/api/reportes${qs ? '?' + qs : ''}`;
  console.log('📍 listarReportes CALL:', { url, params });
  const r = await apiCall(url);
  const data = await r.json();
  console.log('📍 listarReportes RESULT:', { count: data.length, data: data.slice(0, 2) });
  return data;
}

export async function tiposReporte() {
  const r = await apiCall(`${API_BASE}/api/tipos`);
  return r.json();
}

export async function exportGeoJSON(params = {}) {
  const qs = buildQuery(params);
  const r = await fetch(`${API_BASE}/api/reportes/geojson${qs ? '?' + qs : ''}`);
  if (!r.ok) throw new Error('Error al exportar GeoJSON');
  return r.blob();
}

export async function gridAggregates(params = {}) {
  const qs = buildQuery(params);
  const r = await fetch(`${API_BASE}/api/reportes/grid${qs ? '?' + qs : ''}`);
  if (!r.ok) throw new Error('Error al agrupar grid');
  return r.json();
}

/**
 * ADR-0009: Nuevas funciones para tipos y categorías dinámicas
 */

/**
 * Obtiene todos los tipos activos desde la base de datos
 * Soluciona: Panel vacío cuando no hay reportes
 * @returns {Promise<Array>} Lista de tipos con metadatos
 */
export async function obtenerTiposActivos() {
  const r = await apiCall(`${API_BASE}/api/tipos`);
  return r.json();
}

/**
 * Obtiene categorías con sus tipos anidados
 * Soluciona: Categorías hardcodeadas, permite collapse/expand
 * @returns {Promise<Array>} Lista de categorías con tipos anidados
 */
export async function obtenerCategoriasConTipos() {
  const r = await apiCall(`${API_BASE}/api/categorias-con-tipos`);
  return r.json();
}