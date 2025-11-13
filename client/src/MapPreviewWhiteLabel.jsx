/**
 * MapPreviewWhiteLabel.jsx
 * Componente interactivo para previsualizar y editar coordenadas iniciales del mapa
 * Muestra un mapa en tiempo real con las coordenadas configuradas
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para iconos de Leaflet en Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/**
 * Componente para previsualizar y editar coordenadas del mapa
 * @param {Object} props
 * @param {number} props.lat - Latitud inicial
 * @param {number} props.lng - Longitud inicial
 * @param {number} props.zoom - Nivel de zoom inicial
 * @param {string} props.ubicacion - Nombre de la ubicación
 * @param {Function} props.onChange - Callback cuando cambian las coordenadas
 */
export default function MapPreviewWhiteLabel({ lat, lng, zoom, ubicacion, onChange }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const [editMode, setEditMode] = useState(false);
  const [coords, setCoords] = useState({ lat, lng, zoom, ubicacion });

  // Inicializar mapa
  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return;

    console.log('🗺️ Inicializando mapa de preview...', { lat, lng, zoom });

    try {
      // Crear mapa
      mapInstance.current = L.map(mapRef.current).setView([lat, lng], zoom);

      // Agregar tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapInstance.current);

      // Agregar marcador draggable
      markerRef.current = L.marker([lat, lng], { draggable: editMode })
        .bindPopup(`<b>${ubicacion}</b><br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`)
        .addTo(mapInstance.current)
        .openPopup();

      // Event: Click en el mapa para cambiar ubicación
      mapInstance.current.on('click', (e) => {
        if (!editMode) return;
        const { lat: newLat, lng: newLng } = e.latlng;
        actualizarCoords(newLat, newLng, zoom, ubicacion);
      });

      // Event: Arrastrar marcador
      markerRef.current.on('dragend', () => {
        if (!editMode) return;
        const { lat: newLat, lng: newLng } = markerRef.current.getLatLng();
        actualizarCoords(newLat, newLng, zoom, ubicacion);
      });

      // Event: Zoom
      mapInstance.current.on('zoomend', () => {
        if (editMode) {
          const nuevoZoom = mapInstance.current.getZoom();
          actualizarCoords(coords.lat, coords.lng, nuevoZoom, ubicacion);
        }
      });
    } catch (error) {
      console.error('❌ Error inicializando mapa:', error);
    }

    // Cleanup
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Actualizar cuando cambian las props
  useEffect(() => {
    if (mapInstance.current && markerRef.current) {
      mapInstance.current.setView([lat, lng], zoom);
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setPopupContent(`<b>${ubicacion}</b><br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`);
      setCoords({ lat, lng, zoom, ubicacion });
    }
  }, [lat, lng, zoom, ubicacion]);

  // Actualizar coordenadas
  const actualizarCoords = (newLat, newLng, newZoom, newUbicacion) => {
    const nuevoCoords = {
      lat: parseFloat(newLat.toFixed(6)),
      lng: parseFloat(newLng.toFixed(6)),
      zoom: newZoom,
      ubicacion: newUbicacion
    };
    setCoords(nuevoCoords);
    
    // Actualizar marcador
    if (markerRef.current) {
      markerRef.current.setLatLng([nuevoCoords.lat, nuevoCoords.lng]);
      markerRef.current.setPopupContent(
        `<b>${nuevoCoords.ubicacion}</b><br>Lat: ${nuevoCoords.lat.toFixed(6)}<br>Lng: ${nuevoCoords.lng.toFixed(6)}`
      );
    }

    // Notificar cambios
    if (onChange) {
      onChange(nuevoCoords);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      width: '100%'
    }}>
      {/* Controles */}
      <div style={{
        padding: '16px',
        background: '#f0f9ff',
        borderRadius: '8px',
        border: '1px solid #bfdbfe',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ 
              fontSize: '12px', 
              fontWeight: '600', 
              color: '#475569', 
              display: 'block', 
              marginBottom: '6px' 
            }}>
              Ubicación (Nombre legible)
            </label>
            <input
              type="text"
              value={coords.ubicacion}
              onChange={(e) => actualizarCoords(coords.lat, coords.lng, coords.zoom, e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: 'system-ui, sans-serif',
                boxSizing: 'border-box',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0284c7'}
              onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
            />
          </div>
        </div>

        {/* Grid de coordenadas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '12px'
        }}>
          <div>
            <label style={{ 
              fontSize: '12px', 
              fontWeight: '600', 
              color: '#475569', 
              display: 'block', 
              marginBottom: '4px' 
            }}>
              Latitud
            </label>
            <input
              type="number"
              value={coords.lat}
              onChange={(e) => actualizarCoords(parseFloat(e.target.value), coords.lng, coords.zoom, coords.ubicacion)}
              step="0.000001"
              min="-90"
              max="90"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: 'monospace',
                boxSizing: 'border-box',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0284c7'}
              onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
            />
          </div>
          <div>
            <label style={{ 
              fontSize: '12px', 
              fontWeight: '600', 
              color: '#475569', 
              display: 'block', 
              marginBottom: '4px' 
            }}>
              Longitud
            </label>
            <input
              type="number"
              value={coords.lng}
              onChange={(e) => actualizarCoords(coords.lat, parseFloat(e.target.value), coords.zoom, coords.ubicacion)}
              step="0.000001"
              min="-180"
              max="180"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: 'monospace',
                boxSizing: 'border-box',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0284c7'}
              onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
            />
          </div>
          <div>
            <label style={{ 
              fontSize: '12px', 
              fontWeight: '600', 
              color: '#475569', 
              display: 'block', 
              marginBottom: '4px' 
            }}>
              Zoom
            </label>
            <input
              type="number"
              value={coords.zoom}
              onChange={(e) => {
                const nuevoZoom = parseInt(e.target.value);
                actualizarCoords(coords.lat, coords.lng, nuevoZoom, coords.ubicacion);
                if (mapInstance.current) {
                  mapInstance.current.setZoom(nuevoZoom);
                }
              }}
              min="1"
              max="19"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: 'monospace',
                boxSizing: 'border-box',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0284c7'}
              onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
            />
          </div>
        </div>

        {/* Toggle modo edición */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <input
            type="checkbox"
            id="editMode"
            checked={editMode}
            onChange={(e) => {
              setEditMode(e.target.checked);
              if (markerRef.current) {
                markerRef.current.dragging[e.target.checked ? 'enable' : 'disable']();
              }
            }}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label htmlFor="editMode" style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#475569',
            cursor: 'pointer',
            userSelect: 'none'
          }}>
            🖱️ Modo edición: Arrastra el marcador o haz click en el mapa
          </label>
        </div>
      </div>

      {/* Mapa */}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '300px',
          borderRadius: '8px',
          border: '2px solid #0284c7',
          backgroundColor: '#f0f9ff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(2, 132, 199, 0.15)'
        }}
      />

      {/* Información de coordenadas */}
      <div style={{
        padding: '12px',
        background: '#f0fdf4',
        borderRadius: '6px',
        border: '1px solid #bbf7d0',
        fontSize: '11px',
        fontFamily: 'monospace',
        color: '#166534',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all'
      }}>
        📍 Coordenadas actuales:
        {`\nLatitud:  ${coords.lat}`}
        {`\nLongitud: ${coords.lng}`}
        {`\nZoom:     ${coords.zoom}`}
      </div>
    </div>
  );
}
