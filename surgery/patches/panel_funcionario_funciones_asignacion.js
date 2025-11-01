  const cargarReportesDependencia = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/reportes?dependencia=${usuario.dependencia}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Error cargando reportes de la dependencia');
      
      const data = await res.json();
      setReportesDependencia(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarFuncionarios = async () => {
    try {
      const res = await fetch(`/api/usuarios?dependencia=${usuario.dependencia}&rol=funcionario`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Error cargando funcionarios');
      
      const data = await res.json();
      setFuncionariosDisponibles(data);
    } catch (err) {
      console.error('Error cargando funcionarios:', err);
      alert('Error al cargar la lista de funcionarios');
    }
  };

  const abrirModalAsignacion = async (reporte) => {
    setReporteSeleccionado(reporte);
    await cargarFuncionarios();
    setMostrarModalAsignacion(true);
    setFuncionarioSeleccionado('');
    setNotasAsignacion('');
  };

  const handleAsignarReporte = async () => {
    if (!funcionarioSeleccionado) {
      alert('Debes seleccionar un funcionario');
      return;
    }

    setLoading(true);
    
    try {
      const res = await fetch(`/api/reportes/${reporteSeleccionado.id}/asignar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          usuario_id: funcionarioSeleccionado,
          notas: notasAsignacion
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al asignar reporte');
      }

      alert('Reporte asignado exitosamente');
      setMostrarModalAsignacion(false);
      cargarReportesDependencia();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };
