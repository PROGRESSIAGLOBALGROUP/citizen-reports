  // Función auxiliar para actualizar marcador en el mapa
  const actualizarMarcadorMapa = (lat, lng, tipoOverride = null) => {
    if (!mapInstance.current) return;

    // Remover marcador anterior si existe
    if (selectedMarker.current) {
      mapInstance.current.removeLayer(selectedMarker.current);
    }

    // Obtener información del tipo seleccionado (usar override si se proporciona)
    const tipoActual = tipoOverride || formData.tipo;
    const tipoInfo = TIPOS_INFO[tipoActual];
    const icono = tipoInfo ? tipoInfo.icono : '📍';
    const color = tipoInfo ? tipoInfo.color : '#ef4444';
    const nombreTipo = tipoInfo ? tipoInfo.nombre : 'Ubicación';

    // Crear nuevo marcador de selección con icono del tipo
    const selectedIcon = L.divIcon({
      html: `
        <div style="
          background: ${color};
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 3px 10px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          transform: translate(-50%, -50%);
          cursor: pointer;
        ">
          ${icono}
        </div>
      `,
      className: 'selected-marker',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    selectedMarker.current = L.marker([lat, lng], { icon: selectedIcon })
      .bindPopup(`
        <div style="font-family: system-ui, -apple-system, sans-serif; text-align: center;">
          <div style="font-weight: 600; font-size: 14px; color: #1e293b; margin-bottom: 4px;">
            ${icono} ${nombreTipo}
          </div>
          <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">
            ${lat.toFixed(6)}, ${lng.toFixed(6)}
          </div>
          ${formData.descripcionCorta ? `<div style="color: #374151; font-size: 12px; font-style: italic;">"${formData.descripcionCorta}"</div>` : ''}
        </div>
      `)
      .addTo(mapInstance.current);

    // Centrar el mapa en la ubicación seleccionada
    mapInstance.current.setView([lat, lng], 16);
  };