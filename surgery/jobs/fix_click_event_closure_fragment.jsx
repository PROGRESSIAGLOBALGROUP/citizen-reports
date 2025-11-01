    // Evento de clic en el mapa para seleccionar nueva ubicación
    mapInstance.current.on('click', (e) => {
      const { lat, lng } = e.latlng;
      console.log('📍 Click en mapa:', lat, lng);
      
      // Actualizar campos de coordenadas primero
      setFormData(prev => {
        const tipoActual = prev.tipo; // Obtener tipo del estado actual
        
        // Usar setTimeout para asegurar que el DOM se actualice
        setTimeout(() => {
          actualizarMarcadorMapa(lat, lng, tipoActual);
        }, 0);
        
        return {
          ...prev, 
          lat: lat.toFixed(6), 
          lng: lng.toFixed(6) 
        };
      });

      setMessage({ type: 'success', text: `Ubicación seleccionada: ${lat.toFixed(6)}, ${lng.toFixed(6)}` });
    });