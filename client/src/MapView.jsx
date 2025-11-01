import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import { API_BASE, crearReporte, listarReportes, tiposReporte, exportGeoJSON, gridAggregates } from './api.js';
import * as htmlToImage from 'html-to-image';

export default function MapView() {
  const mapRef = useRef(null);
  const layerGroupRef = useRef(null);
  const containerRef = useRef(null);

  const [puntos, setPuntos] = useState([]);

  // Función para crear círculos de calor visibles
  const crearCirculosCalor = useCallback(() => {
    if (!layerGroupRef.current || !mapRef.current) {
      alert('❌ Mapa no disponible');
      return;
    }
    
    console.log('🔥 Creando círculos de calor...');
    layerGroupRef.current.clearLayers();
    
    // Datos de ejemplo para Jantetelco
    const puntos = [
      {lat: 18.816667, lng: -98.966667, peso: 10, desc: 'Centro de Jantetelco', color: '#FF0000'},
      {lat: 18.816800, lng: -98.966500, peso: 8, desc: 'Zona Norte', color: '#FF8000'},
      {lat: 18.816500, lng: -98.966800, peso: 9, desc: 'Zona Sur', color: '#FF4000'},
      {lat: 18.816850, lng: -98.966450, peso: 7, desc: 'Zona Este', color: '#FFFF00'},
      {lat: 18.816450, lng: -98.966850, peso: 6, desc: 'Zona Oeste', color: '#80FF00'}
    ];
    
    puntos.forEach(punto => {
      const circle = L.circle([punto.lat, punto.lng], {
        color: punto.color,
        fillColor: punto.color,
        fillOpacity: 0.7,
        radius: 50 + (punto.peso * 8),
        weight: 3
      }).bindPopup(`<b>${punto.desc}</b><br>Intensidad: ${punto.peso}/10`);
      
      layerGroupRef.current.addLayer(circle);
    });
    
    // Centrar en Jantetelco
    mapRef.current.setView([18.816667, -98.966667], 16);
    setPuntos(puntos);
    
    alert('✅ Círculos de calor aplicados correctamente!');
  }, []);

  // Inicializar mapa
  useEffect(() => {
    if (mapRef.current) return;
    
    console.log('🗺️ Inicializando mapa...');
    const map = L.map('map').setView([18.816667, -98.966667], 16);
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

  }, [crearCirculosCalor]);

  return (
    <div className="mapview" ref={containerRef}>
      <div className="top-bar">
        <div className="brand">
          <div className="eyebrow">OBSERVATORIO CIUDADANO • DATOS EN VIVO</div>
          <h1>Mapa de calor de incidentes</h1>
          <p>Monitorea reportes comunitarios de Jantetelco, Morelos.</p>
        </div>
        <div className="metrics">
          <div className="metric-card">
            <div className="metric-value">{puntos?.length || 0}</div>
            <div className="metric-label">PUNTOS</div>
            <div className="metric-description">visibles</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">Jantetelco</div>
            <div className="metric-label">UBICACIÓN</div>
            <div className="metric-description">Morelos</div>
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
            <p>Este mapa muestra la concentración de incidentes en Jantetelco, Morelos usando círculos de colores.</p>
            
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