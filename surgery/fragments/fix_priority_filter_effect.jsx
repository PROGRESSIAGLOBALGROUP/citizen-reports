  // Efecto para actualizar marcadores cuando cambien los filtros, reportes o prioridades
  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`🔄 [${timestamp}] useEffect disparado - Verificando condiciones:`, {
      tieneMapaInstancia: !!mapInstance.current,
      tieneReportes: reportes.length > 0,
      cantidadFiltros: filtrosActivos.length,
      filtrosActivos: filtrosActivos,
      reportesTotal: reportes.length
    });
    
    // Usar setTimeout para asegurar que el efecto se ejecute después del render
    const updateTimeout = setTimeout(() => {
      if (mapInstance.current) {
        if (reportes.length > 0) {
          console.log(`✅ [${timestamp}] Condiciones cumplidas - Iniciando actualización de marcadores`);
          console.log(`🎯 [${timestamp}] Filtros a aplicar:`, filtrosActivos);
          
          limpiarMarcadores();
          
          // Pequeña pausa para asegurar limpieza completa
          setTimeout(() => {
            agregarMarcadores();
            console.log(`🏁 [${timestamp}] Actualización de marcadores completada`);
          }, 50);
        } else {
          console.log(`🧹 [${timestamp}] Sin reportes filtrados - Limpiando todos los marcadores`);
          limpiarMarcadores();
        }
      } else {
        console.log(`❌ [${timestamp}] Condiciones no cumplidas:`, {
          tieneMapaInstancia: !!mapInstance.current,
          tieneReportes: reportes.length > 0
        });
      }
    }, 10);
    
    return () => clearTimeout(updateTimeout);
  }, [reportes, filtrosActivos, tiposInfo, forceUpdate]);