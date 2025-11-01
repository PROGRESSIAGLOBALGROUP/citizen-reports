    // Marcador del centro de Jantetelco (prominente con función de centrado)
    const centroIcon = L.divIcon({
      html: `
        <div style="
          background: linear-gradient(135deg, #6b7280, #4b5563);
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 4px solid white;
          box-shadow: 0 6px 20px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          transform: translate(-50%, -50%);
          z-index: 1;
          position: relative;
          opacity: 0.9;
          cursor: pointer;
          transition: all 0.3s ease;
        ">
          🏛️
        </div>
      `,
      className: 'centro-marker',
      iconSize: [50, 50],
      iconAnchor: [25, 25]
    });

    const centroMarker = L.marker(JANTETELCO_COORDS, { 
      icon: centroIcon,
      zIndexOffset: -1000  // Forzar que esté debajo de los reportes
    })
      .bindPopup(`
        <div style="font-family: system-ui, -apple-system, sans-serif; text-align: center;">
          <div style="font-weight: 700; font-size: 16px; color: #1e293b; margin-bottom: 4px;">
            🏛️ Centro de Jantetelco
          </div>
          <div style="color: #64748b; font-size: 14px; margin-bottom: 12px;">
            Morelos, México
          </div>
          <button style="
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 8px 16px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s ease;
          " onclick="this.closest('.leaflet-popup').parentElement.click()">
            📍 Centrar mapa aquí
          </button>
        </div>
      `)
      .on('click', () => {
        // Centrar el mapa en las coordenadas de Jantetelco con animación suave
        if (mapInstance.current) {
          mapInstance.current.setView(JANTETELCO_COORDS, INITIAL_ZOOM, {
            animate: true,
            duration: 1.0
          });
        }
      })
      .addTo(mapInstance.current);