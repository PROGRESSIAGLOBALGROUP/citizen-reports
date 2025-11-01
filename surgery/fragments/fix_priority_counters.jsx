  // Calcular estadísticas
  const reportesPorTipo = tipos.reduce((acc, tipo) => {
    acc[tipo] = reportes.filter(r => r.tipo === tipo).length;
    return acc;
  }, {});

  const reportesVisibles = reportes.filter(r => {
    const cumpleTipo = filtrosActivos.includes(r.tipo);
    const prioridad = r.peso >= 4 ? 'alta' : r.peso >= 2 ? 'media' : 'baja';
    const cumplePrioridad = prioridadesActivas.includes(prioridad);
    console.log(`🔍 Reporte ${r.id}: tipo=${r.tipo}(${cumpleTipo}) peso=${r.peso}→${prioridad}(${cumplePrioridad}) prioridadesActivas=[${prioridadesActivas.join(',')}]`);
    return cumpleTipo && cumplePrioridad;
  });
  
  // Calcular prioridades basadas en peso (solo para reportes visibles en el resumen)
  const reportesPrioridad = reportesVisibles.reduce((acc, r) => {
    const prioridad = r.peso >= 4 ? 'alta' : r.peso >= 2 ? 'media' : 'baja';
    acc[prioridad] = (acc[prioridad] || 0) + 1;
    return acc;
  }, {});

  // Calcular prioridades totales basadas solo en filtros de tipo (para mostrar números reales)
  const reportesPrioridadTotal = reportes.filter(r => filtrosActivos.includes(r.tipo)).reduce((acc, r) => {
    const prioridad = r.peso >= 4 ? 'alta' : r.peso >= 2 ? 'media' : 'baja';
    acc[prioridad] = (acc[prioridad] || 0) + 1;
    return acc;
  }, {});