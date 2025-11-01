import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Importar estilos CSS de Leaflet
import 'leaflet/dist/leaflet.css';

// Fix para los iconos de Leaflet en Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Coordenadas de Jantetelco, Morelos (coordenadas correctas)
const JANTETELCO_COORDS = [18.715, -98.7764];
const INITIAL_ZOOM = 15;

function SimpleMapView({ reportes = [], filtrosActivos = [], tiposInfo = {} }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  // Función para limpiar marcadores existentes
  const limpiarMarcadores = React.useCallback(() => {
    markersRef.current.forEach(marker => {
      if (mapInstance.current && mapInstance.current.hasLayer(marker)) {
        mapInstance.current.removeLayer(marker);
      }
    });
    markersRef.current = [];
  }, []);

  // Función para agregar marcadores filtrados
  const agregarMarcadores = React.useCallback(() => {
    console.log('🗺️ Agregando marcadores:', reportes.length, 'reportes');
    console.log('🔍 Filtros activos:', filtrosActivos);
    
    const reportesFiltrados = reportes.filter(reporte => 
      filtrosActivos.includes(reporte.tipo)
    );
    
    console.log('✅ Reportes filtrados:', reportesFiltrados.length);

    reportesFiltrados.forEach(reporte => {
      const tipoInfo = tiposInfo[reporte.tipo] || { 
        nombre: reporte.tipo, 
        icono: '📍', 
        color: '#64748b' 
      };
      
      // Determinar prioridad basada en peso
      const prioridad = reporte.peso >= 4 ? 'alta' : reporte.peso >= 2 ? 'media' : 'baja';
      const tamano = prioridad === 'alta' ? 35 : prioridad === 'media' ? 28 : 22;
      const borderWidth = prioridad === 'alta' ? 4 : 3;
      
      // Crear icono personalizado
      const customIcon = L.divIcon({
        html: `
          <div style="
            background-color: ${tipoInfo.color};
            width: ${tamano}px;
            height: ${tamano}px;
            border-radius: 50%;
            border: ${borderWidth}px solid white;
            box-shadow: 0 3px 12px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${tamano > 30 ? '16px' : '14px'};
            transform: translate(-50%, -50%);
            transition: all 0.2s ease;
          ">
            ${tipoInfo.icono}
          </div>
        `,
        className: 'custom-div-icon',
        iconSize: [tamano, tamano],
        iconAnchor: [tamano/2, tamano/2]
      });

      // Crear marcador
      const marker = L.marker([reporte.lat, reporte.lng], { icon: customIcon })
        .bindPopup(`
          <div style="font-family: Inter, sans-serif; min-width: 250px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
              <span style="font-size: 20px;">${tipoInfo.icono}</span>
              <div>
                <h4 style="margin: 0; color: #1e293b; font-size: 16px; font-weight: 600;">
                  ${tipoInfo.nombre}
                </h4>
                <span style="
                  font-size: 11px; 
                  padding: 2px 8px; 
                  border-radius: 12px; 
                  background: ${prioridad === 'alta' ? '#fee2e2' : prioridad === 'media' ? '#fef3c7' : '#f0fdf4'};
                  color: ${prioridad === 'alta' ? '#dc2626' : prioridad === 'media' ? '#d97706' : '#16a34a'};
                  font-weight: 600;
                  text-transform: uppercase;
                ">
                  ${prioridad}
                </span>
              </div>
            </div>
            <div style="margin-bottom: 8px; color: #374151; font-size: 14px; line-height: 1.4;">
              ${reporte.descripcion}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #6b7280;">
              <span>Peso: ${reporte.peso}</span>
              <span>${new Date(reporte.creado_en).toLocaleDateString('es-MX')}</span>
            </div>
          </div>
        `);
      
      if (mapInstance.current) {
        marker.addTo(mapInstance.current);
        markersRef.current.push(marker);
      }
    });
  }, [reportes, filtrosActivos, tiposInfo]);

  // Inicializar mapa
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    console.log('🗺️ Inicializando mapa de Jantetelco');

    // Crear el mapa centrado en Jantetelco
    mapInstance.current = L.map(mapRef.current).setView(JANTETELCO_COORDS, INITIAL_ZOOM);

    // Agregar tiles de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(mapInstance.current);

    // Marcador del centro de Jantetelco
    const centroIcon = L.divIcon({
      html: `
        <div style="
          background: linear-gradient(135deg, #f59e0b, #d97706);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 4px solid white;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          transform: translate(-50%, -50%);
        ">
          🏛️
        </div>
      `,
      className: 'centro-marker',
      iconSize: [48, 48],
      iconAnchor: [24, 24]
    });

    L.marker(JANTETELCO_COORDS, { icon: centroIcon })
      .bindPopup(`
        <div style="font-family: system-ui, -apple-system, sans-serif; text-align: center;">
          <div style="font-weight: 700; font-size: 18px; color: #1e293b; margin-bottom: 4px;">
            🏛️ Centro de Jantetelco
          </div>
          <div style="color: #64748b; font-size: 14px;">
            Morelos, México
          </div>
        </div>
      `)
      .addTo(mapInstance.current);

    // Cleanup al desmontar
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Efecto para actualizar marcadores cuando cambien los filtros o reportes
  useEffect(() => {
    if (mapInstance.current && reportes.length > 0) {
      console.log('🔄 Actualizando marcadores por cambio en filtros');
      limpiarMarcadores();
      agregarMarcadores();
    }
  }, [reportes, filtrosActivos, tiposInfo, limpiarMarcadores, agregarMarcadores]);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <div 
        ref={mapRef} 
        style={{ 
          height: '100%', 
          width: '100%' 
        }} 
      />
    </div>
  );
}

export default SimpleMapView;