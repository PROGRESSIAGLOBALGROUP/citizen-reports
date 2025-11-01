  // Función para limpiar marcadores existentes
  const limpiarMarcadores = () => {
    console.log('🧹 Limpiando marcadores existentes:', markersRef.current.length);
    markersRef.current.forEach(marker => {
      if (mapInstance.current && mapInstance.current.hasLayer(marker)) {
        mapInstance.current.removeLayer(marker);
      }
    });
    markersRef.current = [];
    console.log('✅ Marcadores limpiados');
  };

  // Función para agregar marcadores filtrados
  const agregarMarcadores = () => {
    console.log('🗺️ Agregando marcadores:', reportes.length, 'reportes totales');
    console.log('🔍 Filtros activos:', filtrosActivos);
    
    const reportesFiltrados = reportes.filter(reporte => 
      filtrosActivos.includes(reporte.tipo)
    );
    
    console.log('✅ Reportes filtrados a mostrar:', reportesFiltrados.length);

    reportesFiltrados.forEach((reporte, index) => {
      const tipoInfo = tiposInfo[reporte.tipo] || { 
        nombre: reporte.tipo, 
        icono: '📍', 
        color: '#64748b' 
      };
      
      console.log(`📍 Creando marcador ${index + 1}:`, reporte.tipo, 'en', [reporte.lat, reporte.lng]);
      
      // Determinar prioridad basada en peso
      const prioridad = reporte.peso >= 4 ? 'alta' : reporte.peso >= 2 ? 'media' : 'baja';
      const tamano = prioridad === 'alta' ? 35 : prioridad === 'media' ? 28 : 22;
      const borderWidth = prioridad === 'alta' ? 4 : 3;