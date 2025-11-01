  // Función para toggle de filtros
  const toggleFiltro = React.useCallback((tipo) => {
    console.log('🔘 Toggling filtro:', tipo);
    setFiltrosActivos(prev => {
      const newFilters = prev.includes(tipo) 
        ? prev.filter(t => t !== tipo)
        : [...prev, tipo];
      console.log('🔄 Filtros actualizados:', newFilters);
      return newFilters;
    });
  }, []);

  // Función para toggle Ninguno/Todos
  const toggleTodosFiltros = React.useCallback(() => {
    console.log('🔘 Toggle Todos/Ninguno clicked. Estado actual:', {
      filtrosActivos: filtrosActivos.length,
      tipos: tipos.length,
      sonIguales: filtrosActivos.length === tipos.length
    });
    
    setFiltrosActivos(prev => {
      const todosActivos = prev.length === tipos.length && tipos.every(tipo => prev.includes(tipo));
      const nuevaSeleccion = todosActivos ? [] : [...tipos];
      console.log('🔄 Nueva selección:', todosActivos ? 'Ninguno' : 'Todos', nuevaSeleccion);
      return nuevaSeleccion;
    });
  }, [tipos, filtrosActivos]);