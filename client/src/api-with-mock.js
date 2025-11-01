// Mock API para desarrollo cuando el servidor no funciona
const MOCK_DATA = [
  {id: 1, tipo: 'infraestructura', descripcion: 'Baches en calle principal', lat: 18.8167, lng: -98.9667, peso: 3, creado_en: '2025-09-27T10:00:00Z'},
  {id: 2, tipo: 'servicios', descripcion: 'Falta de alumbrado público', lat: 18.8180, lng: -98.9650, peso: 2, creado_en: '2025-09-27T10:15:00Z'},
  {id: 3, tipo: 'seguridad', descripcion: 'Zona poco transitada en la noche', lat: 18.8150, lng: -98.9680, peso: 4, creado_en: '2025-09-27T10:30:00Z'},
  {id: 4, tipo: 'infraestructura', descripcion: 'Banqueta dañada', lat: 18.8190, lng: -98.9640, peso: 2, creado_en: '2025-09-27T10:45:00Z'},
  {id: 5, tipo: 'servicios', descripcion: 'Recolección de basura irregular', lat: 18.8140, lng: -98.9690, peso: 3, creado_en: '2025-09-27T11:00:00Z'},
  {id: 6, tipo: 'transporte', descripcion: 'Falta señalización vial', lat: 18.8200, lng: -98.9630, peso: 2, creado_en: '2025-09-27T11:15:00Z'},
  {id: 7, tipo: 'servicios', descripcion: 'Parque requiere mantenimiento', lat: 18.8160, lng: -98.9670, peso: 3, creado_en: '2025-09-27T11:30:00Z'},
  {id: 8, tipo: 'infraestructura', descripcion: 'Coladera sin tapa', lat: 18.8175, lng: -98.9655, peso: 4, creado_en: '2025-09-27T11:45:00Z'},
  {id: 9, tipo: 'seguridad', descripcion: 'Necesita cámara de vigilancia', lat: 18.8185, lng: -98.9645, peso: 3, creado_en: '2025-09-27T12:00:00Z'},
  {id: 10, tipo: 'transporte', descripcion: 'Tope en mal estado', lat: 18.8155, lng: -98.9685, peso: 2, creado_en: '2025-09-27T12:15:00Z'}
];

const MOCK_TIPOS = ['infraestructura', 'servicios', 'seguridad', 'transporte'];

export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/?$/, '');
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || API_BASE === '';

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
  
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      console.warn(`⚠️ API error ${response.status}, falling back to mock`);
      return mockFetch(url, options);
    }
    return response;
  } catch (error) {
    console.warn(`⚠️ Network error, falling back to mock:`, error.message);
    return mockFetch(url, options);
  }
}

export async function crearReporte(data) {
  const r = await apiCall(`${API_BASE}/api/reportes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return r.json();
}

export async function obtenerReportes(params = {}) {
  const query = buildQuery(params);
  const url = `${API_BASE}/api/reportes${query ? `?${query}` : ''}`;
  const r = await apiCall(url);
  return r.json();
}

export async function obtenerTipos() {
  const r = await apiCall(`${API_BASE}/api/reportes/tipos`);
  return r.json();
}