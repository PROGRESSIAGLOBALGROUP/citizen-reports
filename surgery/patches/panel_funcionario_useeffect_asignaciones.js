  useEffect(() => {
    if (vista === 'mis-reportes') {
      cargarMisReportes();
    } else if (vista === 'reportes-dependencia' && (usuario.rol === 'supervisor' || usuario.rol === 'admin')) {
      cargarReportesDependencia();
    } else if (vista === 'cierres-pendientes' && (usuario.rol === 'supervisor' || usuario.rol === 'admin')) {
      cargarCierresPendientes();
    }
  }, [vista]);
