      // Event: Click en el mapa para cambiar ubicación (sin requerir editMode)
      mapInstance.current.on('click', (e) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        actualizarCoords(newLat, newLng, zoom, ubicacion);
      });
