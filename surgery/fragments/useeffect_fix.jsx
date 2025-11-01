  // Efecto para actualizar marcadores cuando cambien los filtros o reportes
  useEffect(() => {
    console.log('🔄 useEffect disparado - Verificando condiciones:', {
      tieneMapaInstancia: !!mapInstance.current,
      tieneReportes: reportes.length > 0,
      cantidadFiltros: filtrosActivos.length,
      filtrosActivos: filtrosActivos
    });
    
    if (mapInstance.current && reportes.length > 0) {
      console.log('✅ Condiciones cumplidas - Actualizando marcadores');
      limpiarMarcadores();
      agregarMarcadores();
    } else {
      console.log('❌ Condiciones no cumplidas - No se actualizan marcadores');
    }
  }, [reportes, filtrosActivos, tiposInfo]); // Dependencias simplificadas