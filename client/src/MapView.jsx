import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import { API_BASE, crearReporte, listarReportes, tiposReporte, exportGeoJSON, gridAggregates } from './api.js';
import { useWhiteLabel } from './WhiteLabelContext.jsx';
import * as htmlToImage from 'html-to-image';

export default function MapView() {
  const mapRef = useRef(null);
  const layerGroupRef = useRef(null);
  const containerRef = useRef(null);
  const { config } = useWhiteLabel(); // Obtener config del contexto WhiteLabel

  const [puntos, setPuntos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Función para cargar reportes desde la API
  const cargarReportesDelServidor = useCallback(async () => {
    try {
      console.log('📡 Cargando reportes desde API...');
      setCargando(true);
      
      // Obtener los bounds del mapa (Jantetelco)
      const bounds = mapRef.current.getBounds();
      const minLat = bounds.getSouth();
      const maxLat = bounds.getNorth();
      const minLng = bounds.getWest();
      const maxLng = bounds.getEast();
      
      const params = new URLSearchParams({
        minLat,
        maxLat,
        minLng,
        maxLng,
        estado: 'abiertos'
      });
      
      const response = await fetch(`${API_BASE}/reportes?${params}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const reportes = await response.json();
      console.log(`✅ Cargados ${reportes.length} reportes del servidor`);
      
      // Transformar reportes a formato de puntos para el mapa
      const puntosDatos = reportes.map(r => ({
        lat: r.lat,
        lng: r.lng,
        peso: r.peso || 1,
        desc: r.descripcion_corta || r.tipo,
        tipo: r.tipo,
        id: r.id
      }));
      
      return puntosDatos;
    } catch (error) {
      console.error('❌ Error cargando reportes:', error);
      return [];
    } finally {
      setCargando(false);
    }
  }, []);

  // Función para crear círculos de calor visibles
  const crearCirculosCalor = useCallback(async () => {
    if (!layerGroupRef.current || !mapRef.current) {
      alert('❌ Mapa no disponible');
      return;
    }
    
    console.log('🔥 Creando círculos de calor...');
    layerGroupRef.current.clearLayers();
    
    // Cargar reportes del servidor
    const reportesCargados = await cargarReportesDelServidor();
    
    if (reportesCargados.length === 0) {
      console.warn('⚠️ Sin reportes para mostrar');
      alert('⚠️ No hay reportes disponibles en esta zona');
      setPuntos([]);
      return;
    }
    
    // Crear círculos para cada reporte
    reportesCargados.forEach(punto => {
      // Colorear según tipo (puedes expandir esto)
      const colores = {
        'baches': '#FF0000',
        'alumbrado': '#FFD700',
        'seguridad': '#FF6347',
        'agua': '#1E90FF',
        'limpieza': '#228B22',
        'default': '#666666'
      };
      const color = colores[punto.tipo] || colores.default;
      
      const circle = L.circle([punto.lat, punto.lng], {
        color: color,
        fillColor: color,
        fillOpacity: 0.7,
        radius: 50 + (punto.peso * 8),
        weight: 3
      }).bindPopup(`<b>${punto.desc}</b><br>Tipo: ${punto.tipo}<br>Intensidad: ${punto.peso}`);
      
      layerGroupRef.current.addLayer(circle);
    });
    
    // Centrar en las coordenadas del municipio configuradas
    mapRef.current.setView([config?.mapa?.lat || 18.816667, config?.mapa?.lng || -98.966667], config?.mapa?.zoom || 13);
    setPuntos(reportesCargados);
    
    console.log(`✅ ${reportesCargados.length} círculos de calor creados`);
  }, [cargarReportesDelServidor]);

  // Inicializar mapa
  useEffect(() => {
    if (mapRef.current) return;
    
    // Usar coordenadas del contexto WhiteLabel o defaults
    const initialLat = config?.mapa?.lat || 18.816667;
    const initialLng = config?.mapa?.lng || -98.966667;
    const initialZoom = config?.mapa?.zoom || 16;
    
    console.log('🗺️ Inicializando mapa...', { lat: initialLat, lng: initialLng, zoom: initialZoom });
    const map = L.map('map').setView([initialLat, initialLng], initialZoom);
    mapRef.current = map;

    // Tiles de CartoDB
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap, © CARTO'
    }).addTo(map);

    // Grupo de capas
    layerGroupRef.current = L.layerGroup().addTo(map);
    
    // Aplicar círculos automáticamente después de 2 segundos
    setTimeout(() => {
      crearCirculosCalor();
    }, 2000);

  }, [crearCirculosCalor, config]);

  return (
    <div className="mapview" ref={containerRef}>
      <div className="top-bar">
        <div className="brand">
          <div className="eyebrow">OBSERVATORIO CIUDADANO • DATOS EN VIVO</div>
          <h1>Mapa de calor de incidentes</h1>
          <p>Monitorea reportes comunitarios de {config?.ubicacion || 'tu municipio'}.</p>
        </div>
        <div className="metrics">
          <div className="metric-card">
            <div className="metric-value">{puntos?.length || 0}</div>
            <div className="metric-label">PUNTOS</div>
            <div className="metric-description">visibles</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{config?.municipioNombre || 'Ubicación'}</div>
            <div className="metric-label">MUNICIPIO</div>
            <div className="metric-description">{config?.estado || 'Desconocido'}</div>
          </div>
          <button 
            className="btn btn-primary" 
            style={{marginLeft: '12px', fontSize: '0.7rem', padding: '4px 8px'}}
            onClick={crearCirculosCalor}>
            🔥 MOSTRAR CALOR
          </button>
        </div>
      </div>

      <div className="content">
        <div className="control-panel">
          <div className="section-block">
            <div className="eyebrow">INFORMACIÓN</div>
            <h2>Mapa de Calor</h2>
            <p>Este mapa muestra la concentración de incidentes en {config?.ubicacion || 'tu municipio'} usando círculos de colores.</p>
            
            <div style={{marginTop: '20px'}}>
              <button className="btn btn-primary" onClick={crearCirculosCalor} style={{width: '100%'}}>
                🔥 Actualizar Mapa de Calor
              </button>
            </div>
            
            <div style={{marginTop: '20px', padding: '12px', background: '#f0f9ff', borderRadius: '6px'}}>
              <h3 style={{margin: '0 0 8px 0', fontSize: '0.9rem'}}>Leyenda:</h3>
              <div style={{fontSize: '0.8rem', lineHeight: '1.4'}}>
                <div>🔴 Rojo: Intensidad Alta (9-10)</div>
                <div>🟠 Naranja: Intensidad Media (7-8)</div>
                <div>🟡 Amarillo: Intensidad Baja (5-6)</div>
                <div>🟢 Verde: Intensidad Mínima (1-4)</div>
              </div>
            </div>
          </div>
        </div>

        <div className="map-container">
          <div id="map"></div>
        </div>
      </div>
    </div>
  );
}