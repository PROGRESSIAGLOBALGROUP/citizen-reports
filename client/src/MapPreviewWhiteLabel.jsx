/**
 * MapPreviewWhiteLabel.jsx
 * Componente interactivo para previsualizar y editar coordenadas iniciales del mapa
 * Muestra un mapa en tiempo real con las coordenadas configuradas
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './gobierno-premium-panel.css';

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

      // Event: Click en el mapa para cambiar ubicación (sin requerir editMode)
      mapInstance.current.on('click', (e) => {
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
    <div className="gp-map-preview-wrapper">
      {/* Controles */}
      <div className="gp-map-preview-controls">
        <div className="gp-map-preview-row">
          <div className="gp-map-preview-field">
            <label className="gp-map-preview-label">
              Ubicación (Nombre legible)
            </label>
            <input
              type="text"
              value={coords.ubicacion}
              onChange={(e) => actualizarCoords(coords.lat, coords.lng, coords.zoom, e.target.value)}
              className="gp-map-preview-input"
            />
          </div>
        </div>

        {/* Grid de coordenadas */}
        <div className="gp-map-preview-grid">
          <div>
            <label className="gp-map-preview-label gp-map-preview-label--sm">
              Latitud
            </label>
            <input
              type="number"
              value={coords.lat}
              onChange={(e) => actualizarCoords(parseFloat(e.target.value), coords.lng, coords.zoom, coords.ubicacion)}
              step="0.000001"
              min="-90"
              max="90"
              className="gp-map-preview-input gp-map-preview-input--mono"
            />
          </div>
          <div>
            <label className="gp-map-preview-label gp-map-preview-label--sm">
              Longitud
            </label>
            <input
              type="number"
              value={coords.lng}
              onChange={(e) => actualizarCoords(coords.lat, parseFloat(e.target.value), coords.zoom, coords.ubicacion)}
              step="0.000001"
              min="-180"
              max="180"
              className="gp-map-preview-input gp-map-preview-input--mono"
            />
          </div>
          <div>
            <label className="gp-map-preview-label gp-map-preview-label--sm">
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
              className="gp-map-preview-input gp-map-preview-input--mono"
            />
          </div>
        </div>

        {/* Toggle modo edición */}
        <div className="gp-map-preview-toggle">
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
            className="gp-map-preview-checkbox"
          />
          <label htmlFor="editMode" className="gp-map-preview-toggle-label">
            🖱️ Modo edición: Arrastra el marcador o haz click en el mapa
          </label>
        </div>
      </div>

      {/* Mapa */}
      <div ref={mapRef} className="gp-map-preview-container" />

      {/* Información de coordenadas */}
      <div className="gp-map-preview-info">
        📍 Coordenadas actuales:
        {`\nLatitud:  ${coords.lat}`}
        {`\nLongitud: ${coords.lng}`}
        {`\nZoom:     ${coords.zoom}`}
      </div>
    </div>
  );
}
