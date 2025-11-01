    // Marcador del centro de Jantetelco (con z-index bajo para no interferir)
    const centroIcon = L.divIcon({
      html: `
        <div style="
          background: linear-gradient(135deg, #f59e0b, #d97706);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          transform: translate(-50%, -50%);
          z-index: 1;
          position: relative;
        ">
          🏛️
        </div>
      `,
      className: 'centro-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    L.marker(JANTETELCO_COORDS, { 
      icon: centroIcon,
      zIndexOffset: -1000  // Forzar que esté debajo de los reportes
    })
      .bindPopup(`
        <div style="font-family: system-ui, -apple-system, sans-serif; text-align: center;">
          <div style="font-weight: 700; font-size: 16px; color: #1e293b; margin-bottom: 4px;">
            🏛️ Centro de Jantetelco
          </div>
          <div style="color: #64748b; font-size: 14px;">
            Morelos, México
          </div>
        </div>
      `)
      .addTo(mapInstance.current);