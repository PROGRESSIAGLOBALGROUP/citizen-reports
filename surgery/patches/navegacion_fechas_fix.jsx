  // Funciones para navegar por mes/año con validación
  const handleMesAnterior = useCallback(() => {
    const hoy = new Date();
    let nuevoMes = mesSeleccionado - 1;
    let nuevoAño = añoSeleccionado;
    
    if (nuevoMes < 0) {
      nuevoMes = 11;
      nuevoAño -= 1;
    }
    
    setAñoSeleccionado(nuevoAño);
    setMesSeleccionado(nuevoMes);
  }, [mesSeleccionado, añoSeleccionado]);

  const handleMesSiguiente = useCallback(() => {
    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const añoActual = hoy.getFullYear();
    
    // No avanzar más allá del mes actual
    if (añoSeleccionado === añoActual && mesSeleccionado === mesActual) {
      return;
    }
    
    let nuevoMes = mesSeleccionado + 1;
    let nuevoAño = añoSeleccionado;
    
    if (nuevoMes > 11) {
      nuevoMes = 0;
      nuevoAño += 1;
    }
    
    // Validar que no supere el mes actual
    if (nuevoAño > añoActual || (nuevoAño === añoActual && nuevoMes > mesActual)) {
      return;
    }
    
    setAñoSeleccionado(nuevoAño);
    setMesSeleccionado(nuevoMes);
  }, [mesSeleccionado, añoSeleccionado]);
