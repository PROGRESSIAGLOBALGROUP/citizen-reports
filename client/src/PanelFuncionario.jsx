import React, { useState, useEffect } from 'react';
import './gobierno-premium-panel.css';
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

  // Filtros Cierres
  const [filtroEstado, setFiltroEstado] = useState('pendiente');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [pagina, setPagina] = useState(0);
  const LIMIT = 10;

  const token = localStorage.getItem('auth_token');

  // Debug: Log when useEffect runs
  useEffect(() => {
    console.log('🔄 useEffect triggered:', { vista, token: !!token, usuario: !!usuario, rol: usuario?.rol });
    
    // Verificar que tenemos token y usuario antes de cargar datos
    if (!token || !usuario) {
      console.log('⏳ Esperando token/usuario...');
      return;
    }
    
    if (vista === 'mis-reportes' || vista === 'mis-reportes-cerrados') {
      console.log('📋 Cargando mis reportes...');
      cargarMisReportes();
    } else if (vista === 'reportes-dependencia' && (usuario.rol === 'supervisor' || usuario.rol === 'admin')) {
      console.log('🏢 Cargando reportes de dependencia...');
      cargarReportesDependencia();
    } else if (vista === 'cierres-pendientes' && (usuario.rol === 'supervisor' || usuario.rol === 'admin')) {
      console.log('✅ Cargando cierres pendientes...');
      cargarCierresPendientes();
    } else {
      console.log('⚠️ No matching condition:', { vista, rol: usuario?.rol });
    }
  }, [vista, filtroEstado, fechaInicio, fechaFin, pagina, token, usuario]); // Incluir token y usuario como dependencias

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
      const params = new URLSearchParams({
        estado: filtroEstado,
        limit: LIMIT,
        offset: pagina * LIMIT
      });
      
      if (fechaInicio) params.append('fecha_inicio', fechaInicio);
      if (fechaFin) params.append('fecha_fin', fechaFin);

      const res = await fetch(`/api/reportes/cierres-pendientes?${params.toString()}`, {
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

      // Filtros de fecha (NO aplicar filtroEstado - ese es para Cierres Pendientes)
      // Esta vista muestra TODOS los reportes independientemente del estado
      if (fechaInicio) params.append('from', fechaInicio);
      if (fechaFin) params.append('to', fechaFin);
      
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

  const getFilteredReports = () => {
    let data = [];
    
    if (vista === 'mis-reportes') {
      data = reportes.filter(r => r.estado !== 'cerrado');
    } else if (vista === 'mis-reportes-cerrados') {
      data = reportes.filter(r => r.estado === 'cerrado');
    } else if (vista === 'reportes-dependencia') {
      // Aplicar paginación cliente para reportes de dependencia
      const start = pagina * LIMIT;
      return reportesDependencia.slice(start, start + LIMIT);
    } else if (vista === 'cierres-pendientes') {
      return cierresPendientes; // Ya paginado por backend
    }

    // Aplicar filtros cliente para mis-reportes
    if (vista === 'mis-reportes' || vista === 'mis-reportes-cerrados') {
      if (fechaInicio) {
        data = data.filter(r => new Date(r.creado_en) >= new Date(fechaInicio));
      }
      if (fechaFin) {
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59);
        data = data.filter(r => new Date(r.creado_en) <= fin);
      }
      
      // Paginación cliente
      const start = pagina * LIMIT;
      return data.slice(start, start + LIMIT);
    }
    
    return data;
  };

  const getTotalPages = () => {
    let total = 0;
    if (vista === 'mis-reportes') {
      total = reportes.filter(r => r.estado !== 'cerrado').length;
    } else if (vista === 'mis-reportes-cerrados') {
      total = reportes.filter(r => r.estado === 'cerrado').length;
    } else if (vista === 'reportes-dependencia') {
      total = reportesDependencia.length;
    } else {
      // Para cierres-pendientes (backend pagination), no tenemos el total count
      // Asumimos que si hay menos de LIMIT, es la última página
      return -1; 
    }
    return Math.ceil(total / LIMIT);
  };

  return (
    <div className="gobierno-premium">
      <div className="gp-container">
        {/* Header Premium Institucional */}
        <div className="gp-panel-header">
          <div className="gp-header-content">
            <span className="gp-header-eyebrow">
              Sistema de Gestión Municipal
            </span>
            <h1 className="gp-header-title">
              Mi Panel de {usuario.rol === 'admin' ? 'Gestión' : 
                           usuario.rol === 'supervisor' ? 'Supervisión' : 'Reportes'}
            </h1>
            <div className="gp-header-subtitle">
              <span className="gp-header-badge">
                👤 {usuario.nombre}
              </span>
              <span className="gp-header-badge gold">
                🏛️ {usuario.dependencia.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs Premium */}
        <div className="gp-tabs-container">
          <div className="gp-tabs">
            <button
              onClick={() => { setVista('mis-reportes'); setPagina(0); }}
              className={`gp-tab ${vista === 'mis-reportes' ? 'active' : ''}`}
            >
              <span className="gp-tab-icon">📋</span>
              Mis Reportes
              <span className="gp-tab-badge">{reportes.filter(r => r.estado !== 'cerrado').length}</span>
            </button>

            <button
              onClick={() => { setVista('mis-reportes-cerrados'); setPagina(0); }}
              className={`gp-tab ${vista === 'mis-reportes-cerrados' ? 'active' : ''}`}
            >
              <span className="gp-tab-icon">🔒</span>
              Cerrados
              <span className="gp-tab-badge">{reportes.filter(r => r.estado === 'cerrado').length}</span>
            </button>
            
            {(usuario.rol === 'supervisor' || usuario.rol === 'admin') && (
              <>
                <button
                  onClick={() => { setVista('reportes-dependencia'); setPagina(0); }}
                  className={`gp-tab ${vista === 'reportes-dependencia' ? 'active' : ''}`}
                >
                  <span className="gp-tab-icon">🏢</span>
                  Dependencia
                  <span className="gp-tab-badge">{reportesDependencia.length}</span>
                </button>
                
                <button
                  onClick={() => { setVista('cierres-pendientes'); setPagina(0); }}
                  className={`gp-tab ${vista === 'cierres-pendientes' ? 'active' : ''}`}
                >
                  <span className="gp-tab-icon">⏳</span>
                  Pendientes
                  <span className="gp-tab-badge">{cierresPendientes.length}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filtros Premium */}
        <div className="gp-filters-bar">
          <div className="gp-filters-header">
            <span className="gp-filters-title">
              <span>🔍</span> Filtros
            </span>
            {(filtroEstado !== 'todos' || fechaInicio || fechaFin) && (
              <button
                className="gp-filters-clear"
                onClick={() => {
                  setFiltroEstado(vista === 'cierres-pendientes' ? 'pendiente' : 'todos');
                  setFechaInicio('');
                  setFechaFin('');
                  setPagina(0);
                }}
              >
                ✕ Limpiar
              </button>
            )}
          </div>
          
          <div className="gp-filters-grid">
            <div className="gp-filter-group">
              <label className="gp-filter-label">Estado</label>
              {vista === 'cierres-pendientes' ? (
                <select 
                  name="filtro-estado"
                  className="gp-filter-select"
                  value={filtroEstado}
                  onChange={(e) => { setFiltroEstado(e.target.value); setPagina(0); }}
                >
                  <option value="pendiente">Pendientes</option>
                  <option value="aprobado">Aprobados</option>
                  <option value="rechazado">Rechazados</option>
                  <option value="todos">Todos</option>
                </select>
              ) : (
                <select 
                  name="filtro-estado"
                  className="gp-filter-select"
                  value={filtroEstado}
                  onChange={(e) => { setFiltroEstado(e.target.value); setPagina(0); }}
                >
                  <option value="todos">Todos los Estados</option>
                  <option value="abierto">Abierto</option>
                  <option value="asignado">Asignado</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="pendiente_cierre">Pendiente Cierre</option>
                  <option value="cerrado">Cerrado</option>
                </select>
              )}
            </div>
            
            <div className="gp-filter-group">
              <label className="gp-filter-label">Desde</label>
              <input 
                type="date"
                className="gp-filter-input"
                name="fecha-inicio"
                value={fechaInicio}
                onChange={(e) => { setFechaInicio(e.target.value); setPagina(0); }}
              />
            </div>
            
            <div className="gp-filter-group">
              <label className="gp-filter-label">Hasta</label>
              <input 
                type="date"
                className="gp-filter-input"
                name="fecha-fin"
                value={fechaFin}
                onChange={(e) => { setFechaFin(e.target.value); setPagina(0); }}
              />
            </div>
          </div>
        </div>

        {/* Contenido */}
        {error && (
          <div className="gp-alert gp-alert-error">
            <span className="gp-alert-icon">⚠️</span>
            <div className="gp-alert-content">
              <p className="gp-alert-message">{error}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="gp-loading">
            <div className="gp-spinner"></div>
            <span className="gp-loading-text">Cargando reportes...</span>
          </div>
        )}

        {/* Vista: Mis Reportes y Mis Reportes Cerrados - PREMIUM */}
        {(vista === 'mis-reportes' || vista === 'mis-reportes-cerrados') && !loading && (
          <>
            {getFilteredReports().length === 0 ? (
              <div className="gp-empty-state gp-animate-in">
                <div className="gp-empty-icon">
                  {vista === 'mis-reportes' ? '📋' : '🔒'}
                </div>
                <h3 className="gp-empty-title">
                  {vista === 'mis-reportes' 
                    ? 'Sin reportes asignados' 
                    : 'Sin reportes cerrados'}
                </h3>
                <p className="gp-empty-description">
                  {vista === 'mis-reportes' 
                    ? 'No tienes reportes asignados activos que coincidan con los filtros aplicados.' 
                    : 'No tienes reportes cerrados que coincidan con los filtros aplicados.'}
                </p>
              </div>
            ) : (
              <div className="gp-reports-grid">
                {getFilteredReports().map(reporte => (
                  <div key={reporte.id} className="gp-report-card gp-animate-in">
                    <div className="gp-card-header">
                      <div className="gp-card-badges">
                        <span className="gp-badge gp-badge-type">
                          {reporte.tipo}
                        </span>
                        <span className={`gp-badge gp-badge-status ${reporte.estado || 'abierto'}`}>
                          {(reporte.estado || 'abierto').replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="gp-card-id">#{reporte.id}</span>
                    </div>
                    
                    <div className="gp-card-body">
                      <h3 className="gp-card-title">
                        {reporte.descripcion || 'Sin descripción'}
                      </h3>
                      
                      <div className="gp-card-meta">
                        <div className="gp-meta-item">
                          <span className="gp-meta-icon">📅</span>
                          <span>Creado: {new Date(reporte.creado_en).toLocaleDateString('es-MX')}</span>
                        </div>
                        <div className="gp-meta-item">
                          <span className="gp-meta-icon">👤</span>
                          <span>Asignado: {new Date(reporte.asignado_en).toLocaleDateString('es-MX')}</span>
                        </div>
                      </div>
                      
                      {reporte.notas_asignacion && (
                        <div className="gp-card-note">
                          📝 {reporte.notas_asignacion}
                        </div>
                      )}
                      
                      {reporte.estado !== 'cerrado' && reporte.estado !== 'pendiente_cierre' && (
                        <div className="gp-tip">
                          <span className="gp-tip-icon">💡</span>
                          <span><strong>Tip:</strong> Abre el reporte para agregar notas y solicitar cierre</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="gp-card-footer">
                      <button
                        className="gp-btn gp-btn-primary gp-btn-block"
                        onClick={() => window.location.hash = `#reporte/${reporte.id}`}
                      >
                        <span className="gp-btn-icon">🔍</span>
                        Ver Reporte Completo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Vista: Reportes de Mi Dependencia (solo supervisores/admins) - PREMIUM */}
        {vista === 'reportes-dependencia' && !loading && (
          <>
            <div className="gp-alert gp-alert-info">
              <span className="gp-alert-icon">💡</span>
              <div className="gp-alert-content">
                <p className="gp-alert-title">Gestión de Reportes</p>
                <p className="gp-alert-message">
                  {usuario.rol === 'admin' 
                    ? 'Como administrador, puedes ver y gestionar TODOS los reportes del sistema.'
                    : 'Haz clic en "Asignar" para asignar reportes a funcionarios de tu dependencia.'
                  }
                </p>
              </div>
            </div>
            
            {reportesDependencia.length === 0 ? (
              <div className="gp-empty-state gp-animate-in">
                <div className="gp-empty-icon">🏢</div>
                <h3 className="gp-empty-title">Sin reportes</h3>
                <p className="gp-empty-description">
                  {usuario.rol === 'admin' 
                    ? 'No hay reportes en el sistema'
                    : 'No hay reportes en tu dependencia'
                  }
                </p>
              </div>
            ) : (
              <div className="gp-reports-grid">
                {reportesDependencia.map(reporte => (
                  <div key={reporte.id} className="gp-report-card gp-animate-in">
                    <div className="gp-card-header">
                      <div className="gp-card-badges">
                        <span className="gp-badge gp-badge-type">{reporte.tipo}</span>
                        <span className={`gp-badge gp-badge-status ${reporte.estado || 'abierto'}`}>
                          {(reporte.estado || 'abierto').replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="gp-card-id">#{reporte.id}</span>
                    </div>
                    
                    <div className="gp-card-body">
                      <h3 className="gp-card-title">
                        {reporte.descripcion_corta || reporte.descripcion?.substring(0, 100) || 'Sin descripción'}
                      </h3>
                      
                      <div className="gp-card-meta">
                        <div className="gp-meta-item">
                          <span className="gp-meta-icon">📍</span>
                          <span>{reporte.lat?.toFixed(4)}, {reporte.lng?.toFixed(4)}</span>
                        </div>
                        <div className="gp-meta-item">
                          <span className="gp-meta-icon">📅</span>
                          <span>{new Date(reporte.creado_en).toLocaleDateString('es-MX')}</span>
                        </div>
                        {reporte.prioridad && (
                          <div className="gp-meta-item">
                            <span className="gp-meta-icon">🚨</span>
                            <span>{reporte.prioridad}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="gp-card-footer">
                      <button
                        className="gp-btn gp-btn-primary gp-btn-block"
                        onClick={() => window.location.hash = `#reporte/${reporte.id}`}
                      >
                        🔍 Ver Reporte
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Vista: Cierres Pendientes - PREMIUM */}
        {vista === 'cierres-pendientes' && !loading && (
          <>
            <div className="gp-alert gp-alert-warning">
              <span className="gp-alert-icon">⏳</span>
              <div className="gp-alert-content">
                <p className="gp-alert-title">Solicitudes de Cierre Pendientes</p>
                <p className="gp-alert-message">
                  Revisa y aprueba las solicitudes de cierre de los funcionarios.
                </p>
              </div>
            </div>

            {cierresPendientes.length === 0 ? (
              <div className="gp-empty-state gp-animate-in">
                <div className="gp-empty-icon">✅</div>
                <h3 className="gp-empty-title">¡Todo al día!</h3>
                <p className="gp-empty-description">
                  No hay solicitudes de cierre pendientes de aprobación.
                </p>
              </div>
            ) : (
              <div className="gp-reports-grid">
                {cierresPendientes.map(cierre => (
                  <div 
                    key={cierre.id} 
                    className="gp-report-card gp-animate-in"
                    onClick={() => window.location.hash = `#reporte/${cierre.reporte_id}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="gp-card-header">
                      <div className="gp-card-badges">
                        <span className="gp-badge gp-badge-type">{cierre.tipo}</span>
                        <span className="gp-badge gp-badge-status pendiente_cierre">
                          Pendiente
                        </span>
                      </div>
                      <span className="gp-card-id">#{cierre.reporte_id}</span>
                    </div>
                    
                    <div className="gp-card-body">
                      <h3 className="gp-card-title">
                        {(cierre.descripcion || 'Sin descripción').substring(0, 80)}
                        {(cierre.descripcion || '').length > 80 ? '...' : ''}
                      </h3>
                      
                      <div className="gp-card-meta">
                        <div className="gp-meta-item">
                          <span className="gp-meta-icon">👤</span>
                          <span>{cierre.funcionario_nombre || 'Funcionario'}</span>
                        </div>
                        <div className="gp-meta-item">
                          <span className="gp-meta-icon">📅</span>
                          <span>{new Date(cierre.fecha_cierre).toLocaleDateString('es-MX')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="gp-card-footer">
                      <button className="gp-btn gp-btn-success gp-btn-block">
                        ✓ Revisar y Aprobar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      {/* Modal de solicitud de cierre */}
      {mostrarModalCierre && (
        <div className="gp-modal-overlay">
          <div className="gp-modal lg">
            <div className="gp-modal-header">
              <h2 className="gp-modal-title">
                <span className="gp-modal-title-icon">📋</span>
                Solicitar Cierre de Reporte
              </h2>
              <button className="gp-modal-close" onClick={() => setMostrarModalCierre(false)}>×</button>
            </div>
            
            <div className="gp-modal-body">
              <div className="gp-info-box">
                <p style={{ margin: 0 }}><strong>Reporte:</strong> {reporteSeleccionado?.descripcion}</p>
                <p style={{ margin: '4px 0 0 0' }}><strong>Tipo:</strong> {reporteSeleccionado?.tipo}</p>
              </div>
              
              <div className="gp-form-group">
                <label className="gp-form-label required">Notas de cierre</label>
                <textarea
                  className="gp-textarea"
                  value={notasCierre}
                  onChange={(e) => setNotasCierre(e.target.value)}
                  rows={4}
                  placeholder="Describe las acciones realizadas para resolver el reporte..."
                />
              </div>
              
              <div className="gp-form-group">
                <label className="gp-form-label required">
                  Firma digital {!usuario.tieneFirma && '(Sube una imagen de tu firma)'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFirmaChange}
                  className="gp-input"
                  style={{ padding: '10px' }}
                />
                {firmaDigital && (
                  <img 
                    src={firmaDigital} 
                    alt="Firma" 
                    style={{ 
                      maxWidth: '200px', 
                      marginTop: '12px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px'
                    }} 
                  />
                )}
              </div>
              
              <div className="gp-form-group">
                <label className="gp-form-label">Evidencia fotográfica (opcional)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleEvidenciaChange}
                  className="gp-input"
                  style={{ padding: '10px' }}
                />
                {evidenciaFotos.length > 0 && (
                  <div className="gp-image-preview-grid">
                    {evidenciaFotos.map((foto, idx) => (
                      <div key={idx} className="gp-image-preview-item">
                        <img 
                          src={foto} 
                          alt={`Evidencia ${idx + 1}`}
                          className="gp-image-preview-img"
                        />
                        <button
                          onClick={() => setEvidenciaFotos(prev => prev.filter((_, i) => i !== idx))}
                          className="gp-image-preview-remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="gp-modal-footer">
              <button
                className="gp-btn gp-btn-secondary"
                onClick={() => setMostrarModalCierre(false)}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                className="gp-btn gp-btn-primary"
                onClick={handleSolicitarCierre}
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Asignar Reporte */}
      {mostrarModalAsignacion && reporteSeleccionado && (
        <div className="gp-modal-overlay">
          <div className="gp-modal">
            <div className="gp-modal-header">
              <h2 className="gp-modal-title">
                <span className="gp-modal-title-icon">👥</span>
                Asignar Reporte #{reporteSeleccionado.id}
              </h2>
              <button className="gp-modal-close" onClick={() => setMostrarModalAsignacion(false)}>×</button>
            </div>
            
            <div className="gp-modal-body">
              <div className="gp-info-box">
                <p style={{ margin: 0 }}><strong>Tipo:</strong> {reporteSeleccionado.tipo}</p>
                <p style={{ margin: '4px 0 0 0' }}>
                  <strong>Descripción:</strong> {reporteSeleccionado.descripcion_corta || reporteSeleccionado.descripcion}
                </p>
              </div>
              
              {asignacionesReporte.length > 0 && (
                <div className="gp-assignee-list">
                  <p style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#166534' }}>
                    👥 Funcionarios Ya Asignados:
                  </p>
                  {asignacionesReporte.map(asig => (
                    <div key={asig.id} className="gp-assignee-item">
                      <div className="gp-assignee-info">
                        <div className="gp-assignee-name">✓ {asig.usuario_nombre}</div>
                        <div className="gp-assignee-date">{asig.usuario_email}</div>
                        {asig.notas && <div className="gp-assignee-notes">💬 "{asig.notas}"</div>}
                      </div>
                      <button
                        onClick={() => handleDesasignarFuncionario(reporteSeleccionado.id, asig.usuario_id, asig.usuario_nombre)}
                        disabled={loading}
                        className="gp-assignee-remove"
                      >
                        🗑️ Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="gp-form-group">
                <label className="gp-form-label required">Seleccionar Funcionario</label>
                <select
                  className="gp-select"
                  value={funcionarioSeleccionado}
                  onChange={(e) => setFuncionarioSeleccionado(e.target.value)}
                >
                  <option value="">-- Selecciona un funcionario --</option>
                  {funcionariosDisponibles.map(func => (
                    <option key={func.id} value={func.id}>
                      {func.nombre} ({func.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="gp-form-group">
                <label className="gp-form-label">Razón de asignación (opcional, pero recomendado)</label>
                <textarea
                  className="gp-textarea"
                  value={notasAsignacion}
                  onChange={(e) => setNotasAsignacion(e.target.value)}
                  placeholder="Ej: Funcionario con experiencia en este tipo de casos, reasignación interdepartamental, etc."
                  rows="3"
                />
              </div>
              
              <div className="gp-info-box primary">
                <span style={{ fontSize: '16px', marginRight: '8px' }}>ℹ️</span>
                <strong>Trazabilidad:</strong> Esta acción quedará registrada en el historial del reporte con fecha, hora, usuario y razón proporcionada.
              </div>
            </div>
            
            <div className="gp-modal-footer">
              <button
                className="gp-btn gp-btn-secondary"
                onClick={() => setMostrarModalAsignacion(false)}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                className="gp-btn gp-btn-primary"
                onClick={handleAsignarReporte}
                disabled={loading}
              >
                {loading ? 'Asignando...' : 'Asignar Reporte'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Notas (Draft) */}
      {mostrarModalNotas && reporteSeleccionado && (
        <div className="gp-modal-overlay">
          <div className="gp-modal lg">
            <div className="gp-modal-header">
              <h2 className="gp-modal-title">
                <span className="gp-modal-title-icon">✏️</span>
                Editar Notas - Reporte #{reporteSeleccionado.id}
              </h2>
              <button className="gp-modal-close" onClick={() => setMostrarModalNotas(false)}>×</button>
            </div>
            
            <div className="gp-modal-body">
              <div className="gp-info-box warning">
                <strong>💡 Nota:</strong> Puedes guardar borradores de tus notas sin cerrar el reporte. 
                Cuando estés listo para cerrar, usa el botón "Solicitar Cierre".
              </div>
              
              <div className="gp-info-box">
                <p style={{ margin: 0 }}><strong>Tipo:</strong> {reporteSeleccionado.tipo}</p>
                <p style={{ margin: '4px 0 0 0' }}>
                  <strong>Descripción:</strong> {reporteSeleccionado.descripcion}
                </p>
              </div>
              
              <div className="gp-form-group">
                <label className="gp-form-label required">Notas de Trabajo</label>
                <textarea
                  className="gp-textarea"
                  value={notasDraft}
                  onChange={(e) => setNotasDraft(e.target.value)}
                  placeholder="Describe el trabajo realizado, materiales usados, observaciones, etc..."
                  rows="8"
                />
                <p className="gp-help-text">{notasDraft.length} caracteres</p>
              </div>
            </div>
            
            <div className="gp-modal-footer">
              <button
                className="gp-btn gp-btn-secondary"
                onClick={() => {
                  setMostrarModalNotas(false);
                  setNotasDraft('');
                }}
              >
                Cancelar
              </button>
              <button
                className="gp-btn gp-btn-primary"
                onClick={guardarDraft}
                disabled={guardandoDraft || !notasDraft.trim()}
                style={{ background: guardandoDraft ? '#94a3b8' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
              >
                💾 {guardandoDraft ? 'Guardando...' : 'Guardar Borrador'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reasignación Interdepartamental */}
      {mostrarModalReasignacion && reporteAReasignar && (
        <div className="gp-modal-overlay">
          <div className="gp-modal lg">
            <div className="gp-modal-header">
              <h3 className="gp-modal-title">
                <span className="gp-modal-title-icon">🔄</span>
                Reasignar Reporte #{reporteAReasignar.id}
              </h3>
              <button className="gp-modal-close" onClick={() => {
                setMostrarModalReasignacion(false);
                setRazonReasignacion('');
                setNuevoTipoSugerido('');
                setMantenerTipo(false);
              }}>×</button>
            </div>

            <div className="gp-modal-body">
              <div className="gp-info-box">
                <div><strong>Tipo actual:</strong> {NOMBRES_TIPOS[reporteAReasignar.tipo] || reporteAReasignar.tipo}</div>
                <div style={{ marginTop: '4px' }}><strong>Departamento actual:</strong> {NOMBRES_DEPENDENCIAS[DEPENDENCIA_POR_TIPO[reporteAReasignar.tipo]] || DEPENDENCIA_POR_TIPO[reporteAReasignar.tipo]}</div>
              </div>

              <div className="gp-form-group">
                <label className="gp-form-label required">Nuevo Funcionario</label>
                <select
                  className="gp-select"
                  value={funcionarioSeleccionado}
                  onChange={(e) => {
                    setFuncionarioSeleccionado(e.target.value);
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
                >
                  <option value="">-- Selecciona un funcionario --</option>
                  {funcionariosDisponibles.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.nombre} - {NOMBRES_DEPENDENCIAS[f.dependencia] || f.dependencia}
                    </option>
                  ))}
                </select>
              </div>

              {nuevoTipoSugerido && (
                <div className="gp-info-box warning">
                  <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                    ⚠️ Cambio de departamento detectado
                  </div>
                  <div>
                    El sistema sugiere cambiar el tipo a: <strong>{NOMBRES_TIPOS[nuevoTipoSugerido] || nuevoTipoSugerido}</strong>
                  </div>
                  <label className="gp-checkbox-wrapper" style={{ marginTop: '10px' }}>
                    <input 
                      type="checkbox" 
                      className="gp-checkbox"
                      checked={mantenerTipo}
                      onChange={(e) => setMantenerTipo(e.target.checked)}
                    />
                    <span className="gp-checkbox-label">Mantener tipo "{NOMBRES_TIPOS[reporteAReasignar.tipo]}" (no cambiar automáticamente)</span>
                  </label>
                </div>
              )}

              <div className="gp-form-group">
                <label className="gp-form-label required">Razón de la reasignación (mínimo 10 caracteres)</label>
                <textarea
                  className="gp-textarea"
                  value={razonReasignacion}
                  onChange={(e) => setRazonReasignacion(e.target.value)}
                  placeholder="Ej: El reporte fue mal categorizado y corresponde al departamento de..."
                  rows={4}
                />
                <p className="gp-help-text">
                  {razonReasignacion.length} caracteres (se guardará en el audit trail)
                </p>
              </div>
            </div>

            <div className="gp-modal-footer">
              <button 
                className="gp-btn gp-btn-secondary"
                onClick={() => {
                  setMostrarModalReasignacion(false);
                  setRazonReasignacion('');
                  setNuevoTipoSugerido('');
                  setMantenerTipo(false);
                }}
                disabled={reasignando}
              >
                Cancelar
              </button>
              <button 
                className="gp-btn gp-btn-primary"
                onClick={handleReasignar}
                disabled={!funcionarioSeleccionado || razonReasignacion.length < 10 || reasignando}
              >
                {reasignando ? '🔄 Reasignando...' : '🔄 Reasignar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Historial / Audit Trail */}
      {mostrarHistorial && (
        <div className="gp-modal-overlay">
          <div className="gp-modal lg">
            <div className="gp-modal-header">
              <h3 className="gp-modal-title">
                <span className="gp-modal-title-icon">📜</span>
                Historial de Cambios (Audit Trail)
              </h3>
              <button className="gp-modal-close" onClick={() => setMostrarHistorial(false)}>×</button>
            </div>

            <div className="gp-modal-body">
              {cargandoHistorial ? (
                <div className="gp-modal-loading">Cargando historial...</div>
              ) : historialReporte.length === 0 ? (
                <div className="gp-empty-state">
                  <div className="gp-empty-state-icon">📭</div>
                  No hay cambios registrados para este reporte
                </div>
              ) : (
                <div className="gp-timeline">
                  {historialReporte.map((cambio, idx) => (
                    <div key={idx} className="gp-timeline-item">
                      <div className="gp-timeline-date">
                        {new Date(cambio.creado_en).toLocaleString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>

                      <div className="gp-timeline-action">
                        <span className={`gp-timeline-badge ${cambio.tipo_cambio.toLowerCase()}`}>
                          {cambio.tipo_cambio.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="gp-timeline-detail">
                        👤 <strong>{cambio.usuario_nombre}</strong> ({cambio.usuario_rol})
                        {cambio.usuario_email && (
                          <span style={{ color: '#64748b', marginLeft: '10px', fontSize: '12px' }}>
                            {cambio.usuario_email}
                          </span>
                        )}
                      </div>

                      {cambio.campo_modificado && (
                        <div className="gp-timeline-detail">
                          📝 Campo: <code className="gp-timeline-code">{cambio.campo_modificado}</code>
                        </div>
                      )}

                      {cambio.valor_anterior && (
                        <div className="gp-timeline-detail">
                          ❌ Antes: <code className="gp-timeline-code old">{cambio.valor_anterior}</code>
                        </div>
                      )}

                      {cambio.valor_nuevo && (
                        <div className="gp-timeline-detail">
                          ✅ Después: <code className="gp-timeline-code new">{cambio.valor_nuevo}</code>
                        </div>
                      )}

                      {cambio.notas && (
                        <div className="gp-timeline-detail" style={{ fontStyle: 'italic', marginTop: '8px' }}>
                          💬 "{cambio.notas}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="gp-modal-footer">
              <button
                className="gp-btn gp-btn-secondary"
                onClick={() => setMostrarHistorial(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paginación Global */}
      {!loading && !error && (
        <div className="panel-pagination">
          <button 
            onClick={() => setPagina(p => Math.max(0, p - 1))}
            disabled={pagina === 0}
          >
            Anterior
          </button>
          <span>
            Página {pagina + 1}
          </span>
          {(() => {
            let isNextDisabled = false;
            
            if (vista === 'mis-reportes') {
              const totalItems = reportes.filter(r => r.estado !== 'cerrado').length;
              isNextDisabled = (pagina + 1) * LIMIT >= totalItems;
            } else if (vista === 'mis-reportes-cerrados') {
              const totalItems = reportes.filter(r => r.estado === 'cerrado').length;
              isNextDisabled = (pagina + 1) * LIMIT >= totalItems;
            } else if (vista === 'reportes-dependencia') {
              // Paginación cliente: deshabilitar si no hay más páginas
              isNextDisabled = (pagina + 1) * LIMIT >= reportesDependencia.length;
            } else if (vista === 'cierres-pendientes') {
              // Paginación servidor: deshabilitar si recibimos menos de LIMIT
              isNextDisabled = cierresPendientes.length < LIMIT;
            }

            return (
              <button 
                className="gp-btn gp-btn-secondary"
                onClick={() => setPagina(p => p + 1)}
                disabled={isNextDisabled}
              >
                Siguiente →
              </button>
            );
          })()}
        </div>
      )}
      </div> {/* Cierre gp-container */}
    </div>
  );
}
