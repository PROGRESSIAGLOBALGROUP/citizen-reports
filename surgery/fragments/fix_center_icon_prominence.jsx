    // Marcador del centro de Jantetelco (prominente pero debajo de reportes)
    const centroIcon = L.divIcon({
      html: `
        <div style="
          background: linear-gradient(135deg, #6b7280, #4b5563);
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 4px solid white;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          transform: translate(-50%, -50%);
          z-index: 1;
          position: relative;
          opacity: 0.9;
        ">
          🏛️
        </div>
      `,
      className: 'centro-marker',
      iconSize: [42, 42],
      iconAnchor: [21, 21]
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