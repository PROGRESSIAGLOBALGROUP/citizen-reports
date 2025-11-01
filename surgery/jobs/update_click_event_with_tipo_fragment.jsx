    // Evento de clic en el mapa para seleccionar nueva ubicación
    mapInstance.current.on('click', (e) => {
      const { lat, lng } = e.latlng;
      console.log('📍 Click en mapa:', lat, lng);
      
      // Obtener el tipo actual antes de actualizar las coordenadas
      const tipoActual = formData.tipo;
      
      // Actualizar campos de coordenadas
      setFormData(prev => ({ 
        ...prev, 
        lat: lat.toFixed(6), 
        lng: lng.toFixed(6) 
      }));

      // Usar la función auxiliar con el tipo actual para mantener icono consistente
      actualizarMarcadorMapa(lat, lng, tipoActual);

      setMessage({ type: 'success', text: `Ubicación seleccionada: ${lat.toFixed(6)}, ${lng.toFixed(6)}` });
    });