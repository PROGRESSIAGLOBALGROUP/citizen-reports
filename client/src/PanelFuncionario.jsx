import React, { useState, useEffect } from 'react';
import { 
  DEPENDENCIA_POR_TIPO, 
  TIPOS_POR_DEPENDENCIA, 
  NOMBRES_DEPENDENCIAS, 
  NOMBRES_TIPOS 
} from './constants/reasignacion.js';

/**
 * Panel de Funcionario - Gestión de reportes
 */
export default function PanelFuncionario({ usuario }) {
  const [vista, setVista] = useState('mis-reportes'); // 'mis-reportes', 'cierres-pendientes', 'reportes-dependencia'
  const [reportes, setReportes] = useState([]);
  const [reportesDependencia, setReportesDependencia] = useState([]);
  const [cierresPendientes, setCierresPendientes] = useState([]);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal de cierre
  const [mostrarModalCierre, setMostrarModalCierre] = useState(false);
  const [notasCierre, setNotasCierre] = useState('');
  const [firmaDigital, setFirmaDigital] = useState('');
  const [evidenciaFotos, setEvidenciaFotos] = useState([]);

  // Modal de asignación
  const [mostrarModalAsignacion, setMostrarModalAsignacion] = useState(false);
  const [funcionariosDisponibles, setFuncionariosDisponibles] = useState([]);
  const [funcionarioSeleccionado, setFuncionarioSeleccionado] = useState('');
  const [notasAsignacion, setNotasAsignacion] = useState('');
  const [asignacionesReporte, setAsignacionesReporte] = useState([]);
  
  // Modal de notas draft
  const [mostrarModalNotas, setMostrarModalNotas] = useState(false);
  const [notasDraft, setNotasDraft] = useState('');
  const [guardandoDraft, setGuardandoDraft] = useState(false);

  // Modal de reasignación interdepartamental
  const [mostrarModalReasignacion, setMostrarModalReasignacion] = useState(false);
  const [reporteAReasignar, setReporteAReasignar] = useState(null);
  const [razonReasignacion, setRazonReasignacion] = useState('');
  const [nuevoTipoSugerido, setNuevoTipoSugerido] = useState('');
  const [mantenerTipo, setMantenerTipo] = useState(false);
  const [reasignando, setReasignando] = useState(false);

  // Modal de historial/audit trail
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [historialReporte, setHistorialReporte] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const token = localStorage.getItem('auth_token');

  useEffect(() => {
    if (vista === 'mis-reportes') {
      cargarMisReportes();
    } else if (vista === 'reportes-dependencia' && (usuario.rol === 'supervisor' || usuario.rol === 'admin')) {
      cargarReportesDependencia();
    } else if (vista === 'cierres-pendientes' && (usuario.rol === 'supervisor' || usuario.rol === 'admin')) {
      cargarCierresPendientes();
    }
  }, [vista]); // Recargar cuando cambie la vista

  const cargarMisReportes = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/reportes/mis-reportes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Error cargando reportes');
      
      const data = await res.json();
      setReportes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarCierresPendientes = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/reportes/cierres-pendientes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Error cargando cierres pendientes');
      
      const data = await res.json();
      setCierresPendientes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarReportesDependencia = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🔍 Cargando reportes de dependencia:', usuario.dependencia);
      
      // Construir parámetros de consulta
      const params = new URLSearchParams();
      
      // Admin puede ver todas las dependencias, funcionarios/supervisores solo la suya
      if (usuario.rol !== 'admin') {
        params.append('dependencia', usuario.dependencia);
        console.log('👤 Filtrando por dependencia:', usuario.dependencia);
      } else {
        console.log('👑 Admin: mostrando todas las dependencias');
      }
      
      // NO filtrar por estado - mostrar TODOS los reportes (abiertos y cerrados)
      // Esto permite que supervisor y funcionario vean todos los reportes de su dependencia
      console.log('📅 Mostrando TODOS los reportes (abiertos y cerrados)');
      
      const url = `/api/reportes?${params.toString()}`;
      console.log('📡 URL:', url);
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Error cargando reportes de la dependencia');
      
      const data = await res.json();
      console.log('📦 Reportes recibidos:', data.length, data);
      setReportesDependencia(data);
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarFuncionarios = async () => {
    try {
      // Admin puede ver todos, supervisor solo su departamento
      // Solo cargar funcionarios (no supervisores ni admins)
      const params = new URLSearchParams({ rol: 'funcionario', activo: '1' });
      
      if (usuario.rol === 'supervisor') {
        // Supervisor solo ve funcionarios de su departamento
        params.append('dependencia', usuario.dependencia);
      }
      // Admin ve todos los funcionarios de todos los departamentos
      
      const res = await fetch(`/api/usuarios?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Error cargando funcionarios');
      
      const data = await res.json();
      
      // Excluir al usuario actual (no puede auto-asignarse)
      const funcionariosFiltrados = data.filter(f => f.id !== usuario.id);
      
      setFuncionariosDisponibles(funcionariosFiltrados);
    } catch (err) {
      console.error('Error cargando funcionarios:', err);
      alert('Error al cargar la lista de funcionarios');
    }
  };

  const abrirModalAsignacion = async (reporte) => {
    setReporteSeleccionado(reporte);
    await cargarFuncionarios();
    
    // Cargar asignaciones existentes
    const asignaciones = await cargarAsignaciones(reporte.id);
    setAsignacionesReporte(asignaciones);
    
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
      const res = await fetch(`/api/reportes/${reporteSeleccionado.id}/asignaciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          usuario_id: funcionarioSeleccionado,
          asignado_por: usuario.id,
          notas: notasAsignacion
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al asignar reporte');
      }

      alert('Reporte asignado exitosamente');
      
      // Recargar asignaciones para actualizar la lista
      const asignaciones = await cargarAsignaciones(reporteSeleccionado.id);
      setAsignacionesReporte(asignaciones);
      
      // Limpiar selección
      setFuncionarioSeleccionado('');
      setNotasAsignacion('');
      
      cargarReportesDependencia();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDesasignarFuncionario = async (reporteId, usuarioId, nombreFuncionario) => {
    if (!confirm(`¿Deseas desasignar a ${nombreFuncionario} de este reporte?`)) {
      return;
    }

    setLoading(true);
    
    try {
      const res = await fetch(`/api/reportes/${reporteId}/asignaciones/${usuarioId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al desasignar funcionario');
      }

      alert('Funcionario desasignado exitosamente');
      
      // Recargar asignaciones
      const asignaciones = await cargarAsignaciones(reporteId);
      setAsignacionesReporte(asignaciones);
      
      cargarReportesDependencia();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarAsignaciones = async (reporteId) => {
    try {
      const res = await fetch(`/api/reportes/${reporteId}/asignaciones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Error cargando asignaciones');
      
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Error:', err);
      return [];
    }
  };

  const abrirModalNotas = async (reporte) => {
    setReporteSeleccionado(reporte);
    setMostrarModalNotas(true);
    
    // Cargar draft existente si hay
    try {
      const res = await fetch(`/api/reportes/${reporte.id}/notas-draft?usuario_id=${usuario.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setNotasDraft(data?.notas || '');
      }
    } catch (err) {
      console.error('Error cargando draft:', err);
      setNotasDraft('');
    }
  };

  const guardarDraft = async () => {
    if (!notasDraft.trim()) {
      alert('Las notas no pueden estar vacías');
      return;
    }

    setGuardandoDraft(true);
    
    try {
      const res = await fetch(`/api/reportes/${reporteSeleccionado.id}/notas-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          usuario_id: usuario.id,
          notas: notasDraft
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al guardar borrador');
      }

      const data = await res.json();
      alert(data.mensaje || 'Borrador guardado exitosamente');
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardandoDraft(false);
    }
  };

  // Funciones de reasignación interdepartamental
  const abrirModalReasignacion = async (reporte) => {
    setReporteAReasignar(reporte);
    setRazonReasignacion('');
    setNuevoTipoSugerido('');
    setMantenerTipo(false);
    setMostrarModalReasignacion(true);
    await cargarFuncionarios(); // Cargar todos los funcionarios disponibles
  };

  const handleReasignar = async () => {
    if (!funcionarioSeleccionado) {
      alert('Debes seleccionar un funcionario');
      return;
    }

    if (razonReasignacion.trim().length < 10) {
      alert('La razón debe tener al menos 10 caracteres para el audit trail');
      return;
    }

    setReasignando(true);

    try {
      const response = await fetch(`/api/reportes/${reporteAReasignar.id}/reasignar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          funcionario_id: parseInt(funcionarioSeleccionado),
          razon: razonReasignacion,
          nuevo_tipo: nuevoTipoSugerido || undefined,
          mantener_tipo: mantenerTipo
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error en la reasignación');
      }

      const resultado = await response.json();

      // Mostrar resumen de cambios
      let mensaje = '✅ Reasignación exitosa\n\n';
      mensaje += `👤 Funcionario: ${resultado.cambios.funcionario_nombre}\n`;
      mensaje += `🏛️  Departamento: ${NOMBRES_DEPENDENCIAS[resultado.cambios.dependencia_nueva] || resultado.cambios.dependencia_nueva}\n\n`;
      
      if (resultado.cambios.tipo_actualizado) {
        mensaje += `📝 Tipo actualizado automáticamente:\n`;
        mensaje += `   De: "${NOMBRES_TIPOS[resultado.cambios.tipo_anterior] || resultado.cambios.tipo_anterior}"\n`;
        mensaje += `   A: "${NOMBRES_TIPOS[resultado.cambios.tipo_nuevo] || resultado.cambios.tipo_nuevo}"\n\n`;
        mensaje += `⚠️  Los íconos en el mapa se actualizarán automáticamente.`;
      }

      alert(mensaje);
      setMostrarModalReasignacion(false);
      
      // Recargar reportes según la vista actual
      if (vista === 'reportes-dependencia') {
        cargarReportesDependencia();
      }
    } catch (error) {
      console.error('Error reasignando:', error);
      alert('Error al reasignar reporte: ' + error.message);
    } finally {
      setReasignando(false);
    }
  };

  // Funciones de historial/audit trail
  const cargarHistorial = async (reporteId) => {
    setCargandoHistorial(true);
    
    try {
      const response = await fetch(`/api/reportes/${reporteId}/historial`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Error cargando historial');
      }

      const data = await response.json();
      setHistorialReporte(data);
      setMostrarHistorial(true);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar historial: ' + error.message);
    } finally {
      setCargandoHistorial(false);
    }
  };

  const abrirModalCierre = (reporte) => {
    setReporteSeleccionado(reporte);
    setMostrarModalCierre(true);
    setNotasCierre('');
    setFirmaDigital('');
    setEvidenciaFotos([]);
  };

  const handleSolicitarCierre = async () => {
    if (!notasCierre.trim()) {
      alert('Las notas de cierre son obligatorias');
      return;
    }
    
    if (!firmaDigital) {
      alert('La firma digital es obligatoria');
      return;
    }

    setLoading(true);
    
    try {
      const res = await fetch(`/api/reportes/${reporteSeleccionado.id}/solicitar-cierre`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          notas_cierre: notasCierre,
          firma_digital: firmaDigital,
          evidencia_fotos: evidenciaFotos
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al solicitar cierre');
      }
      
      alert('Solicitud de cierre enviada al supervisor exitosamente');
      setMostrarModalCierre(false);
      cargarMisReportes();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAprobarCierre = async (cierreId) => {
    const notas = prompt('Notas del supervisor (opcional):');
    
    setLoading(true);
    
    try {
      const res = await fetch(`/api/reportes/cierres/${cierreId}/aprobar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notas_supervisor: notas || '' })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al aprobar cierre');
      }
      
      alert('Cierre aprobado exitosamente');
      cargarCierresPendientes();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRechazarCierre = async (cierreId) => {
    const notas = prompt('Motivo del rechazo (obligatorio):');
    
    if (!notas || !notas.trim()) {
      alert('Debes proporcionar un motivo para rechazar el cierre');
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch(`/api/reportes/cierres/${cierreId}/rechazar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notas_supervisor: notas })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al rechazar cierre');
      }
      
      alert('Cierre rechazado. El funcionario recibirá las observaciones.');
      cargarCierresPendientes();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFirmaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFirmaDigital(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEvidenciaChange = (e) => {
    const files = Array.from(e.target.files);
    const promises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });
    
    Promise.all(promises).then(results => {
      setEvidenciaFotos(prev => [...prev, ...results]);
    });
  };

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          color: '#1e293b',
          marginBottom: '8px'
        }}>
          Panel de {usuario.rol === 'admin' ? 'Administración' : 
                    usuario.rol === 'supervisor' ? 'Supervisión' : 'Funcionario'}
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>
          {usuario.nombre} • {usuario.email} • {usuario.dependencia.replace(/_/g, ' ').toUpperCase()}
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <button
          onClick={() => setVista('mis-reportes')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: vista === 'mis-reportes' ? '3px solid #3b82f6' : 'none',
            marginBottom: '-2px',
            color: vista === 'mis-reportes' ? '#3b82f6' : '#64748b',
            fontWeight: vista === 'mis-reportes' ? '600' : '400',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          📋 Mis Reportes Asignados
        </button>
        
        {(usuario.rol === 'supervisor' || usuario.rol === 'admin') && (
          <>
            <button
              onClick={() => setVista('reportes-dependencia')}
              style={{
                padding: '12px 24px',
                background: 'none',
                border: 'none',
                borderBottom: vista === 'reportes-dependencia' ? '3px solid #3b82f6' : 'none',
                marginBottom: '-2px',
                color: vista === 'reportes-dependencia' ? '#3b82f6' : '#64748b',
                fontWeight: vista === 'reportes-dependencia' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🏢 Reportes de Mi Dependencia
            </button>
            
            <button
              onClick={() => setVista('cierres-pendientes')}
              style={{
                padding: '12px 24px',
                background: 'none',
                border: 'none',
                borderBottom: vista === 'cierres-pendientes' ? '3px solid #3b82f6' : 'none',
                marginBottom: '-2px',
                color: vista === 'cierres-pendientes' ? '#3b82f6' : '#64748b',
                fontWeight: vista === 'cierres-pendientes' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ✅ Cierres Pendientes de Aprobación
            </button>
          </>
        )}
      </div>

      {/* Contenido */}
      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '20px',
          color: '#dc2626'
        }}>
          {error}
        </div>
      )}

      {loading && <p>Cargando...</p>}

      {/* Vista: Mis Reportes */}
      {vista === 'mis-reportes' && !loading && (
        <div style={{
          display: 'grid',
          gap: '16px'
        }}>
          {reportes.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
              No tienes reportes asignados actualmente
            </p>
          ) : (
            reportes.map(reporte => (
              <div key={reporte.id} style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {reporte.tipo.toUpperCase()}
                  </span>
                  <span style={{
                    backgroundColor: reporte.estado === 'cerrado' ? '#dcfce7' :
                                    reporte.estado === 'pendiente_cierre' ? '#fef3c7' : '#f3f4f6',
                    color: reporte.estado === 'cerrado' ? '#166534' :
                           reporte.estado === 'pendiente_cierre' ? '#92400e' : '#1f2937',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {(reporte.estado || 'abierto').replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
                
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1e293b' }}>
                  Reporte #{reporte.id} - {reporte.descripcion || 'Sin descripción'}
                </h3>
                
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                  Reportado: {new Date(reporte.creado_en).toLocaleDateString('es-MX')} • 
                  Asignado: {new Date(reporte.asignado_en).toLocaleDateString('es-MX')}
                </p>
                
                {reporte.notas_asignacion && (
                  <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px', fontStyle: 'italic', padding: '8px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                    📝 Nota: {reporte.notas_asignacion}
                  </p>
                )}
                
                {/* Botón Ver Reporte Completo (siempre visible) */}
                <div style={{ marginTop: '16px' }}>
                  <button
                    onClick={() => window.location.hash = `#reporte/${reporte.id}`}
                    style={{
                      width: '100%',
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                      transition: 'all 0.2s ease',
                      marginBottom: '8px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
                    }}
                    title="Ver detalles completos del reporte con mapa"
                  >
                    🗺️ Ver Reporte Completo
                  </button>
                </div>
                
                {/* Mensaje informativo sobre workflow */}
                {reporte.estado !== 'cerrado' && reporte.estado !== 'pendiente_cierre' && (
                  <p style={{
                    margin: '12px 0 0 0',
                    fontSize: '12px',
                    color: '#64748b',
                    textAlign: 'center',
                    padding: '8px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px'
                  }}>
                    💡 <strong>Usa "Ver Reporte Completo"</strong> para agregar notas y solicitar cierre
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Vista: Reportes de Mi Dependencia (solo supervisores/admins) */}
      {vista === 'reportes-dependencia' && !loading && (
        <div>
          <div style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px'
          }}>
            <p style={{ margin: 0, color: '#1e40af', fontSize: '14px' }}>
              💡 <strong>Asignar reportes:</strong> Haz clic en "Asignar" para asignar reportes a funcionarios de tu dependencia. Aquí puedes ver TODOS los reportes de tu dependencia (abiertos y cerrados).
            </p>
          </div>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            {reportesDependencia.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
                No hay reportes en tu dependencia
              </p>
            ) : (
              reportesDependencia.map(reporte => (
                <div key={reporte.id} style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <span style={{
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '600',
                        marginRight: '8px'
                      }}>
                        {reporte.tipo}
                      </span>
                      <span style={{
                        backgroundColor: reporte.estado === 'abierto' ? '#fee2e2' : 
                                       reporte.estado === 'asignado' ? '#fef3c7' :
                                       reporte.estado === 'pendiente_cierre' ? '#dbeafe' : '#d1fae5',
                        color: reporte.estado === 'abierto' ? '#991b1b' :
                               reporte.estado === 'asignado' ? '#92400e' :
                               reporte.estado === 'pendiente_cierre' ? '#1e40af' : '#065f46',
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {(reporte.estado || 'abierto').replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>
                      #{reporte.id} • {new Date(reporte.creado_en).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    marginBottom: '8px',
                    color: '#1e293b'
                  }}>
                    {reporte.descripcion_corta || reporte.descripcion?.substring(0, 100)}
                  </h3>
                  
                  {reporte.descripcion && reporte.descripcion !== reporte.descripcion_corta && (
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#64748b',
                      marginBottom: '12px',
                      lineHeight: '1.5'
                    }}>
                      {reporte.descripcion}
                    </p>
                  )}
                  
                  <div style={{ 
                    display: 'flex', 
                    gap: '16px',
                    fontSize: '13px',
                    color: '#64748b',
                    marginBottom: '16px'
                  }}>
                    <span>📍 {reporte.lat.toFixed(4)}, {reporte.lng.toFixed(4)}</span>
                    <span>⚖️ Peso: {reporte.peso}</span>
                    {reporte.prioridad && <span>🚨 {reporte.prioridad}</span>}
                  </div>

                  {/* Información de Ubicación */}
                  {(reporte.colonia || reporte.codigo_postal || reporte.municipio || reporte.estado_ubicacion) && (
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #86efac',
                      borderRadius: '6px',
                      marginBottom: '16px',
                      fontSize: '12px'
                    }}>
                      <div style={{
                        fontWeight: '600',
                        color: '#16a34a',
                        marginBottom: '8px'
                      }}>
                        ✅ Información de Ubicación
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '8px'
                      }}>
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>
                            Colonia
                          </div>
                          <div style={{ padding: '4px 6px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #d1d5db', minHeight: '28px', display: 'flex', alignItems: 'center' }}>
                            {reporte.colonia || '—'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>
                            CP
                          </div>
                          <div style={{ padding: '4px 6px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #d1d5db', minHeight: '28px', display: 'flex', alignItems: 'center' }}>
                            {reporte.codigo_postal || '—'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>
                            Municipio
                          </div>
                          <div style={{ padding: '4px 6px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #d1d5db', minHeight: '28px', display: 'flex', alignItems: 'center' }}>
                            {reporte.municipio || '—'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>
                            Estado
                          </div>
                          <div style={{ padding: '4px 6px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #d1d5db', minHeight: '28px', display: 'flex', alignItems: 'center' }}>
                            {reporte.estado_ubicacion || '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => window.location.hash = `#reporte/${reporte.id}`}
                      style={{
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
                      }}
                      title="Ver detalles completos del reporte con mapa"
                    >
                      �️ Ver Reporte Completo
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Vista: Cierres Pendientes (solo supervisores/admins) */}
      {vista === 'cierres-pendientes' && !loading && (
        <div style={{ display: 'grid', gap: '16px' }}>
          {cierresPendientes.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
              No hay cierres pendientes de aprobación
            </p>
          ) : (
            cierresPendientes.map(cierre => (
              <div key={cierre.id} style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <span style={{
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginRight: '8px'
                    }}>
                      {cierre.tipo.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '14px', color: '#64748b' }}>
                      Reporte #{cierre.reporte_id}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    {new Date(cierre.fecha_cierre).toLocaleDateString('es-MX')}
                  </div>
                </div>
                
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1e293b' }}>
                  {cierre.descripcion || 'Sin descripción'}
                </h3>
                
                <div style={{ 
                  backgroundColor: '#f9fafb', 
                  padding: '12px', 
                  borderRadius: '6px',
                  marginBottom: '12px'
                }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                    Funcionario: {cierre.funcionario_nombre}
                  </p>
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                    {cierre.funcionario_email}
                  </p>
                  <p style={{ fontSize: '13px', color: '#1e293b', fontWeight: '500', marginBottom: '4px' }}>
                    Notas de cierre:
                  </p>
                  <p style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'pre-wrap' }}>
                    {cierre.notas_cierre}
                  </p>
                </div>
                
                {cierre.firma_digital && (
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                      Firma digital:
                    </p>
                    <img 
                      src={cierre.firma_digital} 
                      alt="Firma" 
                      style={{ 
                        maxWidth: '200px', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px'
                      }} 
                    />
                  </div>
                )}
                
                {cierre.evidencia_fotos && cierre.evidencia_fotos.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                      Evidencia fotográfica:
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {cierre.evidencia_fotos.map((foto, idx) => (
                        <img 
                          key={idx}
                          src={foto} 
                          alt={`Evidencia ${idx + 1}`}
                          style={{ 
                            width: '100px', 
                            height: '100px',
                            objectFit: 'cover',
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px'
                          }} 
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button
                    onClick={() => handleAprobarCierre(cierre.id)}
                    disabled={loading}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: loading ? '#93c5fd' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    ✓ Aprobar Cierre
                  </button>
                  
                  <button
                    onClick={() => handleRechazarCierre(cierre.id)}
                    disabled={loading}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: loading ? '#fca5a5' : '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    ✗ Rechazar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de solicitud de cierre */}
      {mostrarModalCierre && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px',
          overflowY: 'auto'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>
              Solicitar Cierre de Reporte
            </h2>
            
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', color: '#64748b' }}>
                <strong>Reporte:</strong> {reporteSeleccionado?.descripcion}
              </p>
              <p style={{ fontSize: '14px', color: '#64748b' }}>
                <strong>Tipo:</strong> {reporteSeleccionado?.tipo}
              </p>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                Notas de cierre *
              </label>
              <textarea
                value={notasCierre}
                onChange={(e) => setNotasCierre(e.target.value)}
                rows={4}
                placeholder="Describe las acciones realizadas para resolver el reporte..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                Firma digital * {!usuario.tieneFirma && '(Sube una imagen de tu firma)'}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFirmaChange}
                style={{ fontSize: '14px' }}
              />
              {firmaDigital && (
                <img 
                  src={firmaDigital} 
                  alt="Firma" 
                  style={{ 
                    maxWidth: '200px', 
                    marginTop: '8px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px'
                  }} 
                />
              )}
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                Evidencia fotográfica (opcional)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleEvidenciaChange}
                style={{ fontSize: '14px' }}
              />
              {evidenciaFotos.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {evidenciaFotos.map((foto, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      <img 
                        src={foto} 
                        alt={`Evidencia ${idx + 1}`}
                        style={{ 
                          width: '80px', 
                          height: '80px',
                          objectFit: 'cover',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px'
                        }} 
                      />
                      <button
                        onClick={() => setEvidenciaFotos(prev => prev.filter((_, i) => i !== idx))}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setMostrarModalCierre(false)}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: '#64748b',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSolicitarCierre}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: loading ? '#93c5fd' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Asignar Reporte */}
      {mostrarModalAsignacion && reporteSeleccionado && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '700',
              marginBottom: '16px',
              color: '#1e293b'
            }}>
              Asignar Reporte #{reporteSeleccionado.id}
            </h2>
            
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              color: '#64748b'
            }}>
              <p style={{ margin: 0 }}><strong>Tipo:</strong> {reporteSeleccionado.tipo}</p>
              <p style={{ margin: '4px 0 0 0' }}>
                <strong>Descripción:</strong> {reporteSeleccionado.descripcion_corta || reporteSeleccionado.descripcion}
              </p>
            </div>
            
            {asignacionesReporte.length > 0 && (
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <p style={{ 
                  margin: '0 0 12px 0', 
                  fontSize: '14px', 
                  fontWeight: '600',
                  color: '#166534'
                }}>
                  👥 Funcionarios Ya Asignados:
                </p>
                {asignacionesReporte.map(asig => (
                  <div key={asig.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#fff',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    marginBottom: '8px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', color: '#15803d', fontWeight: '600' }}>
                        ✓ {asig.usuario_nombre}
                      </div>
                      <div style={{ fontSize: '12px', color: '#4ade80' }}>
                        {asig.usuario_email}
                      </div>
                      {asig.notas && (
                        <div style={{ fontSize: '11px', color: '#86efac', fontStyle: 'italic', marginTop: '4px' }}>
                          💬 "{asig.notas}"
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDesasignarFuncionario(reporteSeleccionado.id, asig.usuario_id, asig.usuario_nombre)}
                      disabled={loading}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.5 : 1
                      }}
                    >
                      🗑️ Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '600', 
                marginBottom: '8px',
                color: '#1e293b'
              }}>
                Seleccionar Funcionario *
              </label>
              <select
                value={funcionarioSeleccionado}
                onChange={(e) => setFuncionarioSeleccionado(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="">-- Selecciona un funcionario --</option>
                {funcionariosDisponibles.map(func => (
                  <option key={func.id} value={func.id}>
                    {func.nombre} ({func.email})
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '600', 
                marginBottom: '8px',
                color: '#1e293b'
              }}>
                Razón de asignación (opcional, pero recomendado)
              </label>
              <textarea
                value={notasAsignacion}
                onChange={(e) => setNotasAsignacion(e.target.value)}
                placeholder="Ej: Funcionario con experiencia en este tipo de casos, reasignación interdepartamental, etc."
                rows="3"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>
            
            {/* Audit Trail Notification (ADR-0010) */}
            <div style={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#0369a1',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>ℹ️</span>
              <span>
                <strong>Trazabilidad:</strong> Esta acción quedará registrada en el historial del reporte con fecha, hora, usuario y razón proporcionada.
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setMostrarModalAsignacion(false)}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: '#64748b',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                Cancelar
              </button>
              
              <button
                onClick={handleAsignarReporte}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: loading ? '#93c5fd' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Asignando...' : 'Asignar Reporte'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Notas (Draft) */}
      {mostrarModalNotas && reporteSeleccionado && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2 style={{
              margin: '0 0 20px 0',
              fontSize: '20px',
              fontWeight: '600',
              color: '#1e293b'
            }}>
              ✏️ Editar Notas - Reporte #{reporteSeleccionado.id}
            </h2>
            
            <div style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #fde68a',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#92400e'
            }}>
              <strong>💡 Nota:</strong> Puedes guardar borradores de tus notas sin cerrar el reporte. 
              Cuando estés listo para cerrar, usa el botón "Solicitar Cierre".
            </div>
            
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              color: '#64748b'
            }}>
              <p style={{ margin: 0 }}><strong>Tipo:</strong> {reporteSeleccionado.tipo}</p>
              <p style={{ margin: '4px 0 0 0' }}>
                <strong>Descripción:</strong> {reporteSeleccionado.descripcion}
              </p>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '600', 
                marginBottom: '8px',
                color: '#1e293b'
              }}>
                Notas de Trabajo *
              </label>
              <textarea
                value={notasDraft}
                onChange={(e) => setNotasDraft(e.target.value)}
                placeholder="Describe el trabajo realizado, materiales usados, observaciones, etc..."
                rows="8"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
              <p style={{ 
                margin: '8px 0 0 0', 
                fontSize: '12px', 
                color: '#64748b' 
              }}>
                {notasDraft.length} caracteres
              </p>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'flex-end' 
            }}>
              <button
                onClick={() => {
                  setMostrarModalNotas(false);
                  setNotasDraft('');
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={guardarDraft}
                disabled={guardandoDraft || !notasDraft.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: guardandoDraft ? '#94a3b8' : '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: guardandoDraft ? 'not-allowed' : 'pointer'
                }}
              >
                💾 {guardandoDraft ? 'Guardando...' : 'Guardar Borrador'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reasignación Interdepartamental */}
      {mostrarModalReasignacion && reporteAReasignar && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>
              🔄 Reasignar Reporte #{reporteAReasignar.id}
            </h3>

            <div style={{ 
              backgroundColor: '#f1f5f9', 
              padding: '15px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              <div><strong>Tipo actual:</strong> {NOMBRES_TIPOS[reporteAReasignar.tipo] || reporteAReasignar.tipo}</div>
              <div><strong>Departamento actual:</strong> {NOMBRES_DEPENDENCIAS[DEPENDENCIA_POR_TIPO[reporteAReasignar.tipo]] || DEPENDENCIA_POR_TIPO[reporteAReasignar.tipo]}</div>
            </div>

            <label style={{ display: 'block', marginBottom: '15px' }}>
              <strong>Nuevo Funcionario *</strong>
              <select
                value={funcionarioSeleccionado}
                onChange={(e) => {
                  setFuncionarioSeleccionado(e.target.value);
                  
                  // Auto-detectar cambio de departamento
                  const func = funcionariosDisponibles.find(f => f.id === parseInt(e.target.value));
                  if (func && reporteAReasignar) {
                    const depActual = DEPENDENCIA_POR_TIPO[reporteAReasignar.tipo];
                    const depNueva = func.dependencia;
                    
                    if (depActual !== depNueva) {
                      const tiposNuevos = TIPOS_POR_DEPENDENCIA[depNueva] || [];
                      setNuevoTipoSugerido(tiposNuevos[0] || '');
                    } else {
                      setNuevoTipoSugerido('');
                    }
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '5px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="">-- Selecciona un funcionario --</option>
                {funcionariosDisponibles.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.nombre} - {NOMBRES_DEPENDENCIAS[f.dependencia] || f.dependencia}
                  </option>
                ))}
              </select>
            </label>

            {nuevoTipoSugerido && (
              <div style={{
                backgroundColor: '#fef3c7',
                border: '2px solid #fbbf24',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '15px',
                fontSize: '14px'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                  ⚠️ Cambio de departamento detectado
                </div>
                <div>
                  El sistema sugiere cambiar el tipo a: <strong>{NOMBRES_TIPOS[nuevoTipoSugerido] || nuevoTipoSugerido}</strong>
                </div>
                <label style={{ display: 'block', marginTop: '10px' }}>
                  <input 
                    type="checkbox" 
                    checked={mantenerTipo}
                    onChange={(e) => setMantenerTipo(e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  Mantener tipo "{NOMBRES_TIPOS[reporteAReasignar.tipo]}" (no cambiar automáticamente)
                </label>
              </div>
            )}

            <label style={{ display: 'block', marginBottom: '15px' }}>
              <strong>Razón de la reasignación * (mínimo 10 caracteres)</strong>
              <textarea
                value={razonReasignacion}
                onChange={(e) => setRazonReasignacion(e.target.value)}
                placeholder="Ej: El reporte fue mal categorizado y corresponde al departamento de..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '5px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
              <small style={{ color: '#64748b' }}>
                {razonReasignacion.length} caracteres (se guardará en el audit trail)
              </small>
            </label>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button 
                onClick={() => {
                  setMostrarModalReasignacion(false);
                  setRazonReasignacion('');
                  setNuevoTipoSugerido('');
                  setMantenerTipo(false);
                }}
                disabled={reasignando}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'white',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  cursor: reasignando ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleReasignar}
                disabled={!funcionarioSeleccionado || razonReasignacion.length < 10 || reasignando}
                style={{
                  padding: '10px 20px',
                  backgroundColor: (!funcionarioSeleccionado || razonReasignacion.length < 10 || reasignando) ? '#94a3b8' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (!funcionarioSeleccionado || razonReasignacion.length < 10 || reasignando) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {reasignando ? '🔄 Reasignando...' : '🔄 Reasignar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Historial / Audit Trail */}
      {mostrarHistorial && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>
              📜 Historial de Cambios (Audit Trail)
            </h3>

            {cargandoHistorial ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                Cargando historial...
              </div>
            ) : historialReporte.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                No hay cambios registrados para este reporte
              </div>
            ) : (
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {historialReporte.map((cambio, idx) => (
                  <div key={idx} style={{
                    borderLeft: '4px solid #3b82f6',
                    paddingLeft: '20px',
                    marginBottom: '25px',
                    position: 'relative'
                  }}>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '5px' }}>
                      {new Date(cambio.creado_en).toLocaleString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>

                    <div style={{ 
                      fontWeight: 'bold', 
                      fontSize: '14px',
                      textTransform: 'uppercase',
                      color: '#1e293b',
                      marginBottom: '8px',
                      letterSpacing: '0.5px'
                    }}>
                      {cambio.tipo_cambio.replace(/_/g, ' ')}
                    </div>

                    <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                      👤 <strong>{cambio.usuario_nombre}</strong> ({cambio.usuario_rol})
                      {cambio.usuario_email && (
                        <span style={{ color: '#64748b', marginLeft: '10px', fontSize: '12px' }}>
                          {cambio.usuario_email}
                        </span>
                      )}
                    </div>

                    {cambio.campo_modificado && (
                      <div style={{ fontSize: '13px', color: '#475569', marginBottom: '5px' }}>
                        📝 Campo: <code style={{ 
                          backgroundColor: '#f1f5f9', 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>
                          {cambio.campo_modificado}
                        </code>
                      </div>
                    )}

                    {cambio.valor_anterior && (
                      <div style={{ fontSize: '13px', marginBottom: '5px' }}>
                        ❌ Antes: <code style={{ 
                          backgroundColor: '#fee2e2', 
                          padding: '4px 8px', 
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#991b1b'
                        }}>
                          {cambio.valor_anterior}
                        </code>
                      </div>
                    )}

                    {cambio.valor_nuevo && (
                      <div style={{ fontSize: '13px', marginBottom: '5px' }}>
                        ✅ Después: <code style={{ 
                          backgroundColor: '#dcfce7', 
                          padding: '4px 8px', 
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#166534'
                        }}>
                          {cambio.valor_nuevo}
                        </code>
                      </div>
                    )}

                    {cambio.razon && (
                      <div style={{ 
                        fontStyle: 'italic', 
                        marginTop: '10px',
                        padding: '10px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: '#475569'
                      }}>
                        💬 "{cambio.razon}"
                      </div>
                    )}

                    {cambio.metadatos && (
                      <details style={{ fontSize: '11px', marginTop: '10px', color: '#64748b' }}>
                        <summary style={{ cursor: 'pointer', userSelect: 'none' }}>
                          🔍 Ver metadatos técnicos
                        </summary>
                        <pre style={{ 
                          backgroundColor: '#1e293b', 
                          color: '#e2e8f0', 
                          padding: '10px', 
                          borderRadius: '4px',
                          overflow: 'auto',
                          marginTop: '8px',
                          fontSize: '10px'
                        }}>
                          {JSON.stringify(cambio.metadatos, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => {
                  setMostrarHistorial(false);
                  setHistorialReporte([]);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
