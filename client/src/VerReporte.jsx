/**
 * Componente VerReporte - Vista de solo lectura de reporte con edición de notas y mapa
 * Solo funcionarios asignados pueden editar las notas de trabajo
 */

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './gobierno-premium-panel.css';

const API_BASE = '';

function VerReporte({ reporteId, usuario, onVolver }) {
  const [reporte, setReporte] = useState(null);
  const [asignaciones, setAsignaciones] = useState([]);
  const [tiposInfo, setTiposInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  
  // Estados para bitácora de notas de trabajo (append-only)
  const [notasTrabajo, setNotasTrabajo] = useState([]);
  const [cargandoNotas, setCargandoNotas] = useState(false);
  const [nuevaNota, setNuevaNota] = useState('');
  const [tipoNota, setTipoNota] = useState('observacion');
  
  // Estados para solicitud de cierre
  const [mostrarFormCierre, setMostrarFormCierre] = useState(false);
  const [notasCierre, setNotasCierre] = useState('');
  const [firmaDigital, setFirmaDigital] = useState('');
  const [evidenciaFotos, setEvidenciaFotos] = useState([]);
  
  // Estados para modales
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [historialReporte, setHistorialReporte] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [mostrarModalAsignacion, setMostrarModalAsignacion] = useState(false);
  const [funcionariosDisponibles, setFuncionariosDisponibles] = useState([]);
  const [funcionarioSeleccionado, setFuncionarioSeleccionado] = useState('');
  const [notasAsignacion, setNotasAsignacion] = useState('');
  const [loadingAsignacion, setLoadingAsignacion] = useState(false);
  const [mostrarModalReabrir, setMostrarModalReabrir] = useState(false);
  const [razonReapertura, setRazonReapertura] = useState('');
  const [reabriendo, setReabriendo] = useState(false);
  
  // Estado para modal de confirmación de cierre
  const [mostrarConfirmacionCierre, setMostrarConfirmacionCierre] = useState(false);

  // Estados para mostrar solicitud de cierre (vista supervisor)
  const [solicitudCierre, setSolicitudCierre] = useState(null);
  const [cargandoSolicitudCierre, setCargandoSolicitudCierre] = useState(false);
  const [mostrarModalAprobacion, setMostrarModalAprobacion] = useState(false);
  const [accionCierre, setAccionCierre] = useState(''); // 'aprobar' | 'rechazar'
  const [notasSupervisor, setNotasSupervisor] = useState('');
  const [procesandoCierre, setProcesandoCierre] = useState(false);
  const [imagenExpandida, setImagenExpandida] = useState(null);

  // Verificar si el usuario actual está asignado
  const estaAsignado = asignaciones.some(a => a.usuario_id === usuario?.id);
  const miAsignacion = asignaciones.find(a => a.usuario_id === usuario?.id);

  // Cargar tipos dinámicamente desde la API
  useEffect(() => {
    const cargarTipos = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/tipos`);
        if (response.ok) {
          const tiposData = await response.json();
          console.log('✅ Tipos cargados desde API:', tiposData.length, 'tipos');
          const infoMap = {};
          tiposData.forEach(t => {
            infoMap[t.tipo] = {
              nombre: t.nombre,
              icono: t.icono,
              color: t.color || '#6b7280'
            };
          });
          console.log('📊 Mapa de tipos creado:', Object.keys(infoMap).length, 'tipos');
          setTiposInfo(infoMap);
        } else {
          console.error('❌ Error al cargar tipos:', response.status);
        }
      } catch (error) {
        console.error('❌ Error cargando tipos:', error);
        setTiposInfo({});
      }
    };
    
    cargarTipos();
  }, []);

  useEffect(() => {
    cargarDatos();
    if (usuario) {
      cargarNotasTrabajo();
    }
  }, [reporteId, usuario]);

  useEffect(() => {
    // Cargar notas del funcionario si está asignado
    if (miAsignacion) {
      setNotas(miAsignacion.notas || '');
    }
  }, [miAsignacion]);

  // Inicializar mapa cuando se carga el reporte Y los tipos
  useEffect(() => {
    if (!reporte || !mapRef.current || Object.keys(tiposInfo).length === 0) return;

    // Limpiar mapa anterior si existe
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Crear nuevo mapa centrado en la ubicación del reporte
    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([reporte.lat, reporte.lng], 16);

    // Agregar capa de tiles
    L.tileLayer('/tiles/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    // Agregar marcador en la ubicación del reporte con icono del tipo
    const tipoInfo = tiposInfo[reporte.tipo] || { icono: '📍', color: '#6b7280' };
    
    console.log('🗺️ Creando marcador para tipo:', reporte.tipo, 'con icono:', tipoInfo.icono, 'color:', tipoInfo.color);
    const customIcon = L.divIcon({
      html: `
        <div style="
          background: linear-gradient(135deg, ${tipoInfo.color} 0%, ${tipoInfo.color}dd 100%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 16px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          position: relative;
        ">
          ${tipoInfo.icono}
          <div style="
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-top: 8px solid white;
          "></div>
        </div>
      `,
      className: 'custom-marker-premium',
      iconSize: [44, 52],
      iconAnchor: [22, 52]
    });

    L.marker([reporte.lat, reporte.lng], { icon: customIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 12px; max-width: 250px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 20px;">${tipoInfo.icono}</span>
            <strong style="color: #111827; font-size: 14px;">${tipoInfo.nombre || reporte.tipo}</strong>
          </div>
          <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
            ${reporte.descripcion_corta || 'Sin descripción'}
          </p>
        </div>
      `);

    mapInstanceRef.current = map;

    // Cleanup al desmontar
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [reporte, tiposInfo]);

  async function cargarDatos() {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const headers = {};
      
      // Agregar token si existe (para endpoints protegidos)
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Fetch paralelo de reporte, asignaciones y solicitud de cierre
      const [reporteRes, asignacionesRes, solicitudCierreRes] = await Promise.all([
        fetch(`${API_BASE}/api/reportes/${reporteId}`),
        fetch(`${API_BASE}/api/reportes/${reporteId}/asignaciones`, { headers }),
        fetch(`${API_BASE}/api/reportes/${reporteId}/solicitud-cierre`, { headers })
      ]);

      if (!reporteRes.ok) {
        if (reporteRes.status === 404) {
          throw new Error('El reporte solicitado no existe o ha sido eliminado');
        }
        throw new Error(`Error al cargar reporte: ${reporteRes.status}`);
      }
      if (!asignacionesRes.ok) {
        throw new Error(`Error al cargar asignaciones: ${asignacionesRes.status}`);
      }

      const reporteData = await reporteRes.json();
      const asignacionesData = await asignacionesRes.json();
      
      // Cargar solicitud de cierre si existe
      if (solicitudCierreRes.ok) {
        const solicitudData = await solicitudCierreRes.json();
        setSolicitudCierre(solicitudData);
      }

      setReporte(reporteData);
      setAsignaciones(asignacionesData);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Cargar bitácora completa de notas de trabajo
  async function cargarNotasTrabajo() {
    setCargandoNotas(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/api/reportes/${reporteId}/notas-trabajo`, { headers });
      if (!response.ok) throw new Error('Error al cargar notas');
      
      const data = await response.json();
      setNotasTrabajo(data);
    } catch (err) {
      console.error('Error al cargar notas de trabajo:', err);
    } finally {
      setCargandoNotas(false);
    }
  }

  // Agregar nueva nota a la bitácora (append-only, inmutable)
  async function agregarNotaTrabajo(e) {
    e.preventDefault();

    if (!estaAsignado) {
      setMensaje({ type: 'error', text: 'No estás asignado a este reporte' });
      return;
    }

    if (!nuevaNota.trim()) {
      setMensaje({ type: 'error', text: 'La nota no puede estar vacía' });
      return;
    }

    setGuardando(true);
    setMensaje(null);

    try {
      const token = localStorage.getItem('auth_token');
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(`${API_BASE}/api/reportes/${reporteId}/notas-trabajo`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          contenido: nuevaNota.trim(),
          tipo: tipoNota
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      setMensaje({ type: 'success', text: '✅ Nota agregada a la bitácora' });
      setNuevaNota('');
      setTipoNota('observacion');
      
      // Recargar bitácora
      await cargarNotasTrabajo();
      
      setTimeout(() => {
        setMensaje(null);
      }, 3000);
    } catch (err) {
      console.error('Error al agregar nota:', err);
      setMensaje({ type: 'error', text: `❌ ${err.message}` });
    } finally {
      setGuardando(false);
    }
  }

  // Funciones para solicitud de cierre
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

  const handleSolicitarCierre = async () => {
    // Cerrar modal de confirmación
    setMostrarConfirmacionCierre(false);
    
    setGuardando(true);
    setMensaje(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE}/api/reportes/${reporteId}/solicitar-cierre`, {
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
      
      setMensaje({ type: 'success', text: '✅ Solicitud de cierre enviada al supervisor exitosamente' });
      setMostrarFormCierre(false);
      setNotasCierre('');
      setFirmaDigital('');
      setEvidenciaFotos([]);
      
      // Recargar datos del reporte
      cargarDatos();
      
      setTimeout(() => {
        setMensaje(null);
      }, 5000);
    } catch (err) {
      setMensaje({ type: 'error', text: `❌ ${err.message}` });
    } finally {
      setGuardando(false);
    }
  };

  // Funciones para aprobar/rechazar cierre (supervisor)
  const abrirModalAprobacion = (accion) => {
    setAccionCierre(accion);
    setNotasSupervisor('');
    setMostrarModalAprobacion(true);
  };

  const confirmarAprobacion = async () => {
    if (!solicitudCierre) return;
    
    setProcesandoCierre(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE}/api/reportes/cierres/${solicitudCierre.id}/aprobar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notas_supervisor: notasSupervisor || '' })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al aprobar cierre');
      }
      
      setMostrarModalAprobacion(false);
      setNotasSupervisor('');
      setMensaje({ type: 'success', text: '✅ Cierre aprobado exitosamente. El reporte ha sido cerrado.' });
      
      // Recargar datos
      cargarDatos();
      
      setTimeout(() => setMensaje(null), 5000);
    } catch (err) {
      setMensaje({ type: 'error', text: `❌ ${err.message}` });
    } finally {
      setProcesandoCierre(false);
    }
  };

  const confirmarRechazo = async () => {
    if (!solicitudCierre) return;
    
    if (!notasSupervisor || !notasSupervisor.trim()) {
      alert('Debes proporcionar un motivo para rechazar el cierre');
      return;
    }
    
    setProcesandoCierre(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE}/api/reportes/cierres/${solicitudCierre.id}/rechazar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notas_supervisor: notasSupervisor })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al rechazar cierre');
      }
      
      setMostrarModalAprobacion(false);
      setNotasSupervisor('');
      setMensaje({ type: 'success', text: '✅ Cierre rechazado. El funcionario recibirá las observaciones.' });
      
      // Recargar datos
      cargarDatos();
      
      setTimeout(() => setMensaje(null), 5000);
    } catch (err) {
      setMensaje({ type: 'error', text: `❌ ${err.message}` });
    } finally {
      setProcesandoCierre(false);
    }
  };

  // Funciones para historial modal
  const cargarHistorial = async () => {
    setCargandoHistorial(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/api/reportes/${reporteId}/historial`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error cargando historial');
      const data = await response.json();
      setHistorialReporte(data);
      setMostrarHistorial(true);
    } catch (error) {
      alert('Error al cargar historial: ' + error.message);
    } finally {
      setCargandoHistorial(false);
    }
  };

  // Funciones para asignación modal
  const cargarFuncionarios = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams({ rol: 'funcionario', activo: '1' });
      
      if (usuario.rol === 'supervisor') {
        params.append('dependencia', usuario.dependencia);
      }
      
      const res = await fetch(`${API_BASE}/api/usuarios?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Error cargando funcionarios');
      
      const data = await res.json();
      const funcionariosFiltrados = data.filter(f => f.id !== usuario.id);
      
      setFuncionariosDisponibles(funcionariosFiltrados);
    } catch (err) {
      console.error('Error cargando funcionarios:', err);
      alert('Error al cargar la lista de funcionarios');
    }
  };

  const cargarAsignacionesActuales = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE}/api/reportes/${reporteId}/asignaciones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Error cargando asignaciones');
      
      const data = await res.json();
      setAsignaciones(data);
      return data;
    } catch (err) {
      console.error('Error:', err);
      return [];
    }
  };

  const abrirModalAsignacion = async () => {
    await cargarFuncionarios();
    await cargarAsignacionesActuales();
    setMostrarModalAsignacion(true);
    setFuncionarioSeleccionado('');
    setNotasAsignacion('');
  };

  const handleAsignarReporte = async () => {
    if (!funcionarioSeleccionado) {
      alert('Debes seleccionar un funcionario');
      return;
    }

    setLoadingAsignacion(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE}/api/reportes/${reporteId}/asignaciones`, {
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
      
      await cargarAsignacionesActuales();
      
      setFuncionarioSeleccionado('');
      setNotasAsignacion('');
      
      cargarDatos();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingAsignacion(false);
    }
  };

  const handleDesasignarFuncionario = async (usuarioId, nombreFuncionario) => {
    if (!confirm(`¿Deseas desasignar a ${nombreFuncionario} de este reporte?`)) {
      return;
    }

    setLoadingAsignacion(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE}/api/reportes/${reporteId}/asignaciones/${usuarioId}`, {
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
      
      await cargarAsignacionesActuales();
      cargarDatos();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingAsignacion(false);
    }
  };

  const handleReabrirReporte = async () => {
    if (!razonReapertura || razonReapertura.trim().length < 10) {
      alert('Debes proporcionar una razón de al menos 10 caracteres');
      return;
    }

    setReabriendo(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE}/api/reportes/${reporteId}/reabrir`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ razon: razonReapertura.trim() })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al reabrir reporte');
      }

      const data = await res.json();
      alert(data.mensaje || 'Reporte reabierto exitosamente');
      
      setMostrarModalReabrir(false);
      setRazonReapertura('');
      cargarDatos();
    } catch (err) {
      alert(err.message);
    } finally {
      setReabriendo(false);
    }
  };

  if (loading) {
    return (
      <div className="gp-loading-container">
        ⏳ Cargando reporte...
      </div>
    );
  }

  if (error) {
    return (
      <div className="gp-error-container">
        <div className="gp-error-icon">
          <span>⚠️</span>
        </div>
        <div className="gp-error-message">
          {error}
        </div>
        <button
          onClick={onVolver}
          className="gp-btn-primary"
        >
          ← Volver al Mapa
        </button>
      </div>
    );
  }

  if (!reporte) {
    return null;
  }

  const tipoInfo = tiposInfo[reporte.tipo] || { nombre: reporte.tipo, icono: '📍', color: '#6b7280' };

  return (
    <div className="gobierno-premium gp-ver-reporte">
      {/* Header */}
      <div className="gp-ver-header">
        <div>
          <h1 className="gp-ver-title">
            <span className="gp-ver-title-icon">{tipoInfo.icono}</span>
            Reporte #{reporte.id}
          </h1>
          <p className="gp-ver-meta">
            {tipoInfo.nombre} • Creado el {new Date(reporte.creado_en).toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <button onClick={onVolver} className="gp-btn-back">
          ← Volver al Mapa
        </button>
      </div>

      {/* Mapa de Ubicación - World Class Premium */}
      <div className="gp-ver-map-section">
        {/* Header con gradiente y glassmorphism */}
        <div className="gp-ver-map-header">
          <div className="gp-ver-map-icon">📍</div>
          <div>
            <h2 className="gp-ver-map-title">Ubicación del Reporte</h2>
            <p className="gp-ver-map-subtitle">Coordenadas geográficas verificadas</p>
          </div>
        </div>

        {/* Mapa con sombra premium */}
        <div ref={mapRef} className="gp-ver-map-container" />

        {/* Badge de coordenadas con diseño premium */}
        <div className="gp-ver-coords-grid">
          <div className="gp-ver-coord-badge">
            <div className="gp-ver-coord-icon">🌐</div>
            <div className="gp-ver-coord-content">
              <div className="gp-ver-coord-label">Coordenadas GPS</div>
              <div className="gp-ver-coord-value">
                {reporte?.lat.toFixed(6)}, {reporte?.lng.toFixed(6)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información del Reporte (Solo Lectura) */}
      <div className="gp-ver-info-section">
        <h2 className="gp-ver-info-title">📋 Información del Reporte</h2>

        <div className="gp-ver-info-grid">
          {/* Tarjeta de Descripción - World Class Premium */}
          <div className="gp-ver-desc-card">
            <div className="gp-ver-desc-glow" />

            {/* Header con badge */}
            <div className="gp-ver-desc-header">
              <div className="gp-ver-desc-icon">📋</div>
              <div className="gp-ver-desc-header-content">
                <h3 className="gp-ver-desc-title">Descripción del Reporte</h3>
                <div className="gp-ver-desc-badge">
                  {reporte.descripcion_corta || 'Sin categoría'}
                </div>
              </div>
            </div>

            {/* Contenido con glassmorphism */}
            <div className="gp-ver-desc-content">
              {reporte.descripcion || 'Sin descripción detallada'}
            </div>
          </div>

          {/* Tarjeta de Geolocalización - World Class Premium */}
          <div className="gp-ver-geo-card">
            <div className="gp-ver-geo-glow" />

            {/* Header premium */}
            <div className="gp-ver-geo-header">
              <div className="gp-ver-geo-icon">📍</div>
              <h3 className="gp-ver-geo-title">Ubicación Geográfica</h3>
            </div>
            
            {/* Grid de coordenadas premium */}
            <div className="gp-ver-geo-grid">
              <div className="gp-ver-geo-item">
                <div className="gp-ver-geo-label">
                  <span className="gp-ver-geo-label-icon">↕️</span>
                  Latitud
                </div>
                <div className="gp-ver-geo-value">{reporte.lat}</div>
              </div>
              <div className="gp-ver-geo-item">
                <div className="gp-ver-geo-label">
                  <span className="gp-ver-geo-label-icon">↔️</span>
                  Longitud
                </div>
                <div className="gp-ver-geo-value">{reporte.lng}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información Administrativa */}
      <div className="gp-ver-admin-card">
        <div className="gp-ver-admin-header">
          <span className="gp-ver-admin-icon">🏘️</span>
          <h3 className="gp-ver-admin-title">
            Información Administrativa
          </h3>
        </div>
        <div className="gp-ver-admin-grid">
          <div className="gp-ver-admin-item">
            <div className="gp-ver-admin-label">País</div>
            <div className="gp-ver-admin-value">{reporte.pais || 'México'}</div>
          </div>
          <div className="gp-ver-admin-item">
            <div className="gp-ver-admin-label">Estado</div>
            <div className="gp-ver-admin-value">{reporte.estado_ubicacion || '—'}</div>
          </div>
          <div className="gp-ver-admin-item">
            <div className="gp-ver-admin-label">Municipio</div>
            <div className="gp-ver-admin-value">{reporte.municipio || '—'}</div>
          </div>
          <div className="gp-ver-admin-item">
            <div className="gp-ver-admin-label">Colonia</div>
            <div className="gp-ver-admin-value">{reporte.colonia || '—'}</div>
          </div>
          <div className="gp-ver-admin-item">
            <div className="gp-ver-admin-label">Código Postal</div>
            <div className="gp-ver-admin-value">{reporte.codigo_postal || '—'}</div>
          </div>
        </div>
        <div className="gp-ver-admin-note">
          📍 Esta información se obtiene automáticamente de las coordenadas seleccionadas usando Nominatim (OpenStreetMap).
        </div>
      </div>

      {/* Dashboard de Métricas - World Class Premium */}
      <div className="gp-metrics-grid">
        {/* Estado del Reporte */}
        <div className={`gp-metric-card estado-${reporte.estado === 'abierto' ? 'abierto' : 'cerrado'}`}>
          <div className="gp-metric-glow" />
          <div className="gp-metric-content">
            <div className="gp-metric-icon">
              {reporte.estado === 'abierto' ? '🔴' : '✅'}
            </div>
            <div className="gp-metric-label">Estado</div>
            <div className="gp-metric-value">
              {reporte.estado === 'abierto' ? 'Abierto' : 'Cerrado'}
            </div>
          </div>
        </div>

        {/* Prioridad */}
        <div className={`gp-metric-card prioridad-${reporte.prioridad || 'baja'}`}>
          <div className="gp-metric-glow" />
          <div className="gp-metric-content">
            <div className="gp-metric-icon">
              {reporte.prioridad === 'alta' ? '🔥' : reporte.prioridad === 'media' ? '⚡' : '✓'}
            </div>
            <div className="gp-metric-label">Prioridad</div>
            <div className="gp-metric-value">
              {reporte.prioridad === 'alta' ? 'Alta' : reporte.prioridad === 'media' ? 'Media' : 'Baja'}
            </div>
          </div>
        </div>

        {/* Peso/Urgencia */}
        <div className="gp-metric-card peso">
          <div className="gp-metric-glow" />
          <div className="gp-metric-content">
            <div className="gp-metric-icon">⚖️</div>
            <div className="gp-metric-label">Peso / Urgencia</div>
            <div className="gp-metric-value">
              {reporte.peso || 1}<span className="unit"> / 5</span>
            </div>
          </div>
        </div>

        {/* Dependencia */}
        <div className="gp-metric-card dependencia">
          <div className="gp-metric-glow" />
          <div className="gp-metric-content">
            <div className="gp-metric-icon">🏛️</div>
            <div className="gp-metric-label">Dependencia</div>
            <div className="gp-metric-value small">
              {reporte.dependencia?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'No asignada'}
            </div>
          </div>
        </div>
      </div>

      {/* Fecha de Creación */}
      <div className="gp-metric-card fecha">
        <div className="gp-metric-glow" />
        <div className="gp-metric-content">
          <div className="gp-metric-icon">📅</div>
          <div className="gp-metric-label">Fecha de Creación</div>
          <div className="gp-metric-value small">
            {reporte.creado_en ? new Date(reporte.creado_en).toLocaleString('es-MX', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'No disponible'}
          </div>
        </div>
      </div>

      {/* Botones de Acción (Solo para usuarios autenticados) */}
      {usuario && (usuario.rol === 'admin' || usuario.rol === 'supervisor') && (
        <div className="gp-ver-action-buttons">
          <button
            onClick={cargarHistorial}
            disabled={cargandoHistorial}
            className="gp-ver-btn-action historial"
          >
            📜 Ver Historial
          </button>
          
          <button
            onClick={abrirModalAsignacion}
            disabled={loadingAsignacion || reporte?.estado === 'cerrado'}
            className="gp-ver-btn-action asignar"
          >
            👤 Asignar Funcionario
          </button>

          {/* Botón de Reapertura (solo admin y si está cerrado) */}
          {usuario.rol === 'admin' && reporte?.estado === 'cerrado' && (
            <button
              onClick={() => setMostrarModalReabrir(true)}
              className="gp-ver-btn-action reabrir"
            >
              🔓 Reabrir Reporte
            </button>
          )}
        </div>
      )}

      {/* Funcionarios Asignados */}
      <div className="gp-ver-funcionarios-card">
        <h2 className="gp-ver-funcionarios-title">
          👥 Funcionarios Asignados ({asignaciones.length})
        </h2>

        {asignaciones.length === 0 ? (
          <div className="gp-ver-funcionarios-empty">
            ℹ️ Aún no hay funcionarios asignados a este reporte
          </div>
        ) : (
          <div className="gp-ver-funcionarios-list">
            {asignaciones.map(asig => (
              <div
                key={asig.id}
                className={`gp-ver-funcionario-item ${asig.usuario_id === usuario?.id ? 'current' : 'other'}`}
              >
                <div className="gp-ver-funcionario-name">
                  {asig.usuario_nombre}
                  {asig.usuario_id === usuario?.id && (
                    <span className="gp-ver-funcionario-badge">(Tú)</span>
                  )}
                </div>
                <div className="gp-ver-funcionario-email">
                  {asig.usuario_email}
                </div>
                {asig.asignado_por_nombre && (
                  <div className="gp-ver-funcionario-assigned-by">
                    Asignado por: {asig.asignado_por_nombre}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bitácora de Notas de Trabajo (Auditable - Append-Only) */}
      <div className="gp-ver-bitacora-card">
        <div className="gp-ver-bitacora-header">
          <h2 className="gp-ver-bitacora-title">
            📋 Bitácora de Trabajo
          </h2>
          <span className="gp-ver-bitacora-badge">
            {notasTrabajo.length} {notasTrabajo.length === 1 ? 'entrada' : 'entradas'}
          </span>
        </div>

        <p className="gp-info-banner">
          ℹ️ <strong>Sistema de trazabilidad auditable:</strong> Las notas se registran con timestamp y son inmutables (no se pueden editar ni eliminar). Cada entrada queda permanentemente en el historial.
        </p>

        {/* Formulario para agregar nueva nota (solo si está asignado y estado lo permite) */}
        {estaAsignado && reporte.estado !== 'pendiente_cierre' && reporte.estado !== 'cerrado' ? (
          <form onSubmit={agregarNotaTrabajo} className="gp-ver-bitacora-form">
            <div className="gp-form-group-sm">
              <label className="gp-form-label">
                Tipo de Nota:
              </label>
              <select
                value={tipoNota}
                onChange={(e) => setTipoNota(e.target.value)}
                className="gp-select"
              >
                <option value="observacion">📝 Observación</option>
                <option value="avance">🔄 Avance de Trabajo</option>
                <option value="incidente">⚠️ Incidente / Problema</option>
                <option value="resolucion">✅ Resolución</option>
              </select>
            </div>

            {mensaje && (
              <div className={`gp-message ${mensaje.type}`}>
                {mensaje.text}
              </div>
            )}

            <textarea
              value={nuevaNota}
              onChange={(e) => setNuevaNota(e.target.value)}
              placeholder="Ej: Revisé el sitio, se requiere material adicional. Estimado de reparación: 3 días."
              rows="4"
              className="gp-ver-bitacora-textarea"
            />

            <button
              type="submit"
              disabled={guardando || !nuevaNota.trim()}
              className="gp-ver-bitacora-btn-add"
            >
              {guardando ? '💾 Guardando...' : '➕ Agregar a Bitácora'}
            </button>
          </form>
        ) : estaAsignado && (reporte.estado === 'pendiente_cierre' || reporte.estado === 'cerrado') ? (
          <div className="gp-warning-banner">
            <span className="gp-warning-emoji">⚠️</span>
            <div>
              <strong>Reporte {reporte.estado === 'pendiente_cierre' ? 'en revisión de cierre' : 'cerrado'}</strong>
              <br />
              No se pueden agregar más notas en este estado. {reporte.estado === 'pendiente_cierre' ? 'Espera a que el supervisor termine la revisión.' : ''}
            </div>
          </div>
        ) : (
          <div className="gp-warning-banner">
            <span className="gp-warning-icon">🔒</span>
            <div>
              Solo funcionarios asignados pueden agregar notas a la bitácora.
            </div>
          </div>
        )}

        {/* Historial de notas (mostrar todas cronológicamente) */}
        <div className="gp-ver-bitacora-historial">
          <h3 className="gp-ver-bitacora-historial-title">
            📜 Historial Completo
          </h3>

          {cargandoNotas ? (
            <div className="gp-ver-bitacora-loading">
              Cargando bitácora...
            </div>
          ) : notasTrabajo.length === 0 ? (
            <div className="gp-ver-bitacora-empty-historial">
              📭 No hay notas registradas aún
            </div>
          ) : (
            <div className="gp-ver-bitacora-list">
              {notasTrabajo.map((nota, idx) => {
                const tipoIconos = {
                  observacion: '📝',
                  avance: '🔄',
                  incidente: '⚠️',
                  resolucion: '✅'
                };
                const tipoClases = {
                  observacion: 'observacion',
                  avance: 'avance',
                  incidente: 'incidente',
                  resolucion: 'resolucion'
                };

                return (
                  <div key={nota.id} className={`gp-ver-nota-item ${tipoClases[nota.tipo]}`}>
                    <div className="gp-ver-nota-header">
                      <div className="gp-ver-nota-meta">
                        <span className={`gp-ver-nota-badge ${tipoClases[nota.tipo]}`}>
                          {tipoIconos[nota.tipo]} {nota.tipo.toUpperCase()}
                        </span>
                        <span className="gp-ver-nota-author">
                          {nota.usuario_nombre}
                        </span>
                      </div>
                      <div className="gp-ver-nota-date">
                        {new Date(nota.creado_en).toLocaleString('es-MX', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="gp-ver-nota-content">
                      {nota.contenido}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========== SECCIÓN: SOLICITUD DE CIERRE PENDIENTE (VISTA SUPERVISOR) ========== */}
      {solicitudCierre && Number(solicitudCierre.aprobado) === 0 && (usuario?.rol === 'supervisor' || usuario?.rol === 'admin') && (
        <div className="gp-ver-solicitud-cierre">
          {/* Header con alerta */}
          <div className="gp-ver-solicitud-header">
            <div className="gp-ver-solicitud-icon">
              ⏳
            </div>
            <div>
              <h2 className="gp-ver-solicitud-title">
                📋 Solicitud de Cierre Pendiente
              </h2>
              <p className="gp-ver-solicitud-subtitle">
                Este reporte tiene una solicitud de cierre esperando tu aprobación
              </p>
            </div>
          </div>

          {/* Información del funcionario */}
          <div className="gp-ver-solicitud-card">
            <div className="gp-ver-solicitud-funcionario">
              <div className="gp-ver-solicitud-avatar">
                {(solicitudCierre.funcionario_nombre || 'F').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="gp-ver-solicitud-nombre">
                  {solicitudCierre.funcionario_nombre}
                </p>
                <p className="gp-ver-solicitud-email">
                  {solicitudCierre.funcionario_email}
                </p>
                <p className="gp-ver-solicitud-fecha">
                  📅 Enviada el {new Date(solicitudCierre.fecha_cierre).toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            {/* Notas de cierre */}
            <div className="gp-ver-solicitud-notas">
              <p className="gp-ver-solicitud-label">
                📝 Notas de cierre del funcionario
              </p>
              <p className="gp-ver-solicitud-texto">
                {solicitudCierre.notas_cierre || 'Sin notas'}
              </p>
            </div>
          </div>

          {/* Firma digital */}
          {solicitudCierre.firma_digital && (
            <div className="gp-ver-solicitud-card">
              <p className="gp-ver-solicitud-label">
                ✍️ Firma digital del funcionario
              </p>
              <div className="gp-ver-solicitud-firma">
                <img 
                  src={solicitudCierre.firma_digital} 
                  alt="Firma digital" 
                  onClick={() => setImagenExpandida(solicitudCierre.firma_digital)}
                />
              </div>
            </div>
          )}

          {/* Evidencia fotográfica */}
          {solicitudCierre.evidencia_fotos && solicitudCierre.evidencia_fotos.length > 0 && (
            <div className="gp-ver-solicitud-card">
              <p className="gp-ver-solicitud-label">
                📷 Evidencia fotográfica ({solicitudCierre.evidencia_fotos.length} {solicitudCierre.evidencia_fotos.length === 1 ? 'foto' : 'fotos'})
              </p>
              <div className="gp-ver-evidencia-grid">
                {solicitudCierre.evidencia_fotos.map((foto, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setImagenExpandida(foto)}
                    className="gp-ver-evidencia-item"
                  >
                    <img 
                      src={foto} 
                      alt={`Evidencia ${idx + 1}`}
                    />
                    <div className="gp-ver-evidencia-overlay">
                      📷 Foto {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="gp-ver-solicitud-actions">
            <button
              onClick={() => abrirModalAprobacion('aprobar')}
              disabled={procesandoCierre}
              className="gp-ver-solicitud-btn aprobar"
            >
              <span className="gp-btn-icon">✓</span>
              Aprobar Cierre
            </button>
            
            <button
              onClick={() => abrirModalAprobacion('rechazar')}
              disabled={procesandoCierre}
              className="gp-ver-solicitud-btn rechazar"
            >
              <span className="gp-btn-icon">✗</span>
              Rechazar
            </button>
          </div>
        </div>
      )}

      {/* Sección: Solicitar Cierre del Reporte */}
      {estaAsignado && reporte.estado !== 'cerrado' && (
        <div className="gp-ver-cierre-card">
          <div className="gp-ver-cierre-header">
            <h2 className="gp-ver-cierre-title">
              ✅ Solicitar Cierre del Reporte
            </h2>
            {!mostrarFormCierre && reporte.estado !== 'pendiente_cierre' && (
              <button
                onClick={() => setMostrarFormCierre(true)}
                className="gp-ver-cierre-btn-iniciar"
              >
                📝 Completar Solicitud de Cierre
              </button>
            )}
            {reporte.estado === 'pendiente_cierre' && !mostrarFormCierre && (
              <span className="gp-ver-cierre-badge-pendiente">
                ⏳ Solicitud pendiente de revisión
              </span>
            )}
          </div>

          {mostrarFormCierre ? (
            <div>
              <p className="gp-ver-cierre-info">
                ℹ️ <strong>Última etapa:</strong> Completa este formulario para enviar la solicitud de cierre al supervisor. Asegúrate de haber documentado todo el trabajo en la bitácora arriba.
              </p>

              {mensaje && (
                <div className={`gp-message ${mensaje.type}`}>
                  {mensaje.text}
                </div>
              )}
              
              <div className="gp-ver-cierre-form">
                <div>
                  <label className="gp-form-label required">
                    Notas de cierre
                  </label>
                  <textarea
                    value={notasCierre}
                    onChange={(e) => setNotasCierre(e.target.value)}
                    rows={4}
                    placeholder="Describe las acciones realizadas para resolver el reporte..."
                    className="gp-ver-cierre-textarea"
                  />
                </div>
                
                <div className="gp-ver-firma-section">
                  <label className="gp-ver-firma-label">
                    Firma digital *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFirmaChange}
                    className="gp-file-input"
                  />
                  {firmaDigital && (
                    <img 
                      src={firmaDigital} 
                      alt="Firma" 
                      className="gp-ver-firma-preview"
                    />
                  )}
                </div>
                
                <div className="gp-ver-evidencia-section">
                  <label className="gp-ver-evidencia-label">
                    Evidencia fotográfica (opcional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleEvidenciaChange}
                    className="gp-file-input"
                  />
                  {evidenciaFotos.length > 0 && (
                    <div className="gp-ver-evidencia-preview-grid">
                      {evidenciaFotos.map((foto, idx) => (
                        <div key={idx} className="gp-ver-evidencia-preview-item">
                          <img 
                            src={foto} 
                            alt={`Evidencia ${idx + 1}`}
                          />
                          <button
                            onClick={() => setEvidenciaFotos(prev => prev.filter((_, i) => i !== idx))}
                            className="gp-ver-evidencia-remove-btn"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="gp-ver-cierre-actions gp-justify-end">
                <button
                  onClick={() => {
                    setMostrarFormCierre(false);
                    setNotasCierre('');
                    setFirmaDigital('');
                    setEvidenciaFotos([]);
                    setMensaje(null);
                  }}
                  disabled={guardando}
                  className="gp-ver-cierre-btn-cancel"
                >
                  Cancelar
                </button>
                
                <button
                  onClick={() => {
                    // Validar antes de mostrar modal de confirmación
                    if (!notasCierre.trim()) {
                      setMensaje({ type: 'error', text: 'Las notas de cierre son obligatorias' });
                      return;
                    }
                    if (!firmaDigital) {
                      setMensaje({ type: 'error', text: 'La firma digital es obligatoria' });
                      return;
                    }
                    setMostrarConfirmacionCierre(true);
                  }}
                  disabled={guardando}
                  className="gp-btn-primary"
                >
                  {guardando ? '📤 Enviando...' : '📤 Enviar Solicitud de Cierre'}
                </button>
              </div>
            </div>
          ) : (
            <p className="gp-text-muted">
              🔄 Haz clic en el botón arriba cuando hayas completado todo el trabajo documentado en la bitácora.
            </p>
          )}
        </div>
      )}

      {/* Modal de Historial */}
      {mostrarHistorial && (
        <div className="gp-modal-overlay">
          <div className="gp-modal gp-modal-lg">
            <h3 className="gp-modal-title">
              📜 Historial de Cambios (Audit Trail)
            </h3>

            {cargandoHistorial ? (
              <div className="gp-loading-container">
                Cargando historial...
              </div>
            ) : historialReporte.length === 0 ? (
              <div className="gp-ver-historial-empty">
                No hay cambios registrados para este reporte
              </div>
            ) : (
              <div className="gp-ver-historial-container">
                {historialReporte.map((cambio, idx) => (
                  <div key={idx} className="gp-ver-historial-item">
                    <div className="gp-ver-historial-fecha">
                      {new Date(cambio.creado_en).toLocaleString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>

                    <div className="gp-ver-historial-tipo">
                      {cambio.tipo_cambio.replace(/_/g, ' ')}
                    </div>

                    <div className="gp-ver-historial-usuario">
                      👤 <strong>{cambio.usuario_nombre}</strong> ({cambio.usuario_rol})
                      {cambio.usuario_email && (
                        <span className="gp-ver-historial-usuario-email">
                          {cambio.usuario_email}
                        </span>
                      )}
                    </div>

                    {cambio.campo_modificado && (
                      <div className="gp-ver-historial-campo">
                        📝 Campo: <code className="gp-ver-historial-code">
                          {cambio.campo_modificado}
                        </code>
                      </div>
                    )}

                    {cambio.valor_anterior && (
                      <div className="gp-ver-historial-valor">
                        ❌ Antes: <code className="gp-ver-historial-valor-anterior">
                          {cambio.valor_anterior}
                        </code>
                      </div>
                    )}

                    {cambio.valor_nuevo && (
                      <div className="gp-ver-historial-valor">
                        ✅ Después: <code className="gp-ver-historial-valor-nuevo">
                          {cambio.valor_nuevo}
                        </code>
                      </div>
                    )}

                    {cambio.razon && (
                      <div className="gp-ver-historial-razon">
                        💬 "{cambio.razon}"
                      </div>
                    )}

                    {cambio.metadatos && (
                      <details className="gp-ver-historial-meta">
                        <summary className="gp-ver-historial-meta-toggle">
                          🔍 Ver metadatos técnicos
                        </summary>
                        <pre className="gp-ver-historial-meta-pre">
                          {JSON.stringify(cambio.metadatos, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="gp-modal-footer">
              <button
                onClick={() => {
                  setMostrarHistorial(false);
                  setHistorialReporte([]);
                }}
                className="gp-btn-primary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Asignación */}
      {mostrarModalAsignacion && (
        <div className="gp-modal-overlay">
          <div className="gp-modal gp-modal-md">
            <div className="gp-modal-header">
              <h2 className="gp-modal-title">
                Asignar Reporte #{reporteId}
              </h2>
            </div>
            
            <div className="gp-modal-body">
              <div className="gp-info-box">
                <p className="gp-info-box-line"><strong>Tipo:</strong> {reporte?.tipo}</p>
                <p className="gp-info-box-line">
                  <strong>Descripción:</strong> {reporte?.descripcion_corta || reporte?.descripcion}
                </p>
              </div>
              
              {asignaciones.length > 0 && (
                <div className="gp-success-box gp-mb-20">
                  <p className="gp-box-title">
                    👥 Funcionarios Ya Asignados:
                  </p>
                  {asignaciones.map(asig => (
                    <div key={asig.id} className="gp-asignacion-item">
                      <div className="gp-asignacion-content">
                        <div className="gp-asignacion-nombre">
                          ✓ {asig.usuario_nombre}
                        </div>
                        <div className="gp-asignacion-email">
                          {asig.usuario_email}
                        </div>
                        {asig.notas && (
                          <div className="gp-asignacion-notas">
                            💬 "{asig.notas}"
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDesasignarFuncionario(asig.usuario_id, asig.usuario_nombre)}
                        disabled={loadingAsignacion}
                        className="gp-btn-danger-sm"
                      >
                        🗑️ Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="gp-form-group">
                <label className="gp-form-label required">
                  Seleccionar Funcionario
                </label>
                <select
                  value={funcionarioSeleccionado}
                  onChange={(e) => setFuncionarioSeleccionado(e.target.value)}
                  className="gp-select"
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
                <label className="gp-form-label">
                  Razón de asignación (opcional, pero recomendado)
                </label>
                <textarea
                  value={notasAsignacion}
                  onChange={(e) => setNotasAsignacion(e.target.value)}
                  placeholder="Ej: Funcionario con experiencia en este tipo de casos, reasignación interdepartamental, etc."
                  rows="3"
                  className="gp-textarea"
                />
              </div>
            </div>
            
            <div className="gp-info-banner">
              <span className="gp-info-banner-icon">ℹ️</span>
              <span>
                <strong>Trazabilidad:</strong> Esta acción quedará registrada en el historial del reporte con fecha, hora, usuario y razón proporcionada.
              </span>
            </div>
            
            <div className="gp-modal-footer">
              <button
                onClick={() => setMostrarModalAsignacion(false)}
                disabled={loadingAsignacion}
                className="gp-btn-secondary"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleAsignarReporte}
                disabled={loadingAsignacion}
                className="gp-btn-primary"
              >
                {loadingAsignacion ? 'Asignando...' : 'Asignar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reapertura */}
      {mostrarModalReabrir && (
        <div className="gp-modal-overlay">
          <div className="gp-modal-reabrir">
            <h2 className="gp-modal-reabrir-title">
              🔓 Reabrir Reporte Cerrado
            </h2>

            <div className="gp-modal-reabrir-warning">
              ⚠️ <strong>Atención:</strong> Esta acción reabrirá el reporte cerrado. 
              Debes proporcionar una razón justificada (mínimo 10 caracteres).
            </div>

            <p className="gp-modal-reabrir-info">
              <strong>Reporte #{reporteId}:</strong> {reporte?.descripcion_corta || reporte?.descripcion}
            </p>

            <div className="gp-form-group">
              <label className="gp-form-label required">
                Razón de reapertura
              </label>
              <textarea
                value={razonReapertura}
                onChange={(e) => setRazonReapertura(e.target.value)}
                placeholder="Ej: Se detectaron nuevos problemas relacionados, la solución aplicada fue insuficiente, etc."
                rows="4"
                className="gp-textarea"
              />
              <p className={`gp-modal-reabrir-charcount ${razonReapertura.trim().length >= 10 ? 'valid' : 'invalid'}`}>
                {razonReapertura.trim().length} / 10 caracteres mínimos
              </p>
            </div>

            <div className="gp-modal-footer">
              <button
                onClick={() => {
                  setMostrarModalReabrir(false);
                  setRazonReapertura('');
                }}
                disabled={reabriendo}
                className="gp-btn-gray"
              >
                Cancelar
              </button>
              <button
                onClick={handleReabrirReporte}
                disabled={reabriendo || razonReapertura.trim().length < 10}
                className="gp-btn-warning"
              >
                {reabriendo ? 'Reabriendo...' : 'Confirmar Reapertura'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Cierre */}
      {mostrarConfirmacionCierre && (
        <div className="gp-modal-overlay">
          <div className="gp-modal-confirm-cierre">
            {/* Header con icono de advertencia */}
            <div className="gp-modal-confirm-header">
              <div className="gp-modal-confirm-icon">
                ⚠️
              </div>
              <h3 className="gp-modal-confirm-title">
                Confirmar Solicitud de Cierre
              </h3>
            </div>

            {/* Mensaje de advertencia */}
            <div className="gp-modal-confirm-alert">
              <p className="gp-modal-confirm-alert-text">
                <strong>⚠️ Atención:</strong> Una vez enviada la solicitud de cierre, 
                el reporte pasará a revisión del supervisor y <strong>no podrá ser reabierto</strong> por 
                el funcionario. Solo el supervisor podrá aprobar o rechazar el cierre.
              </p>
            </div>

            {/* Resumen de lo que se enviará */}
            <div className="gp-modal-confirm-summary">
              <div className="gp-modal-confirm-summary-item">
                <strong>📝 Notas de cierre:</strong> {notasCierre.substring(0, 100)}{notasCierre.length > 100 ? '...' : ''}
              </div>
              <div className="gp-modal-confirm-summary-item">
                <strong>✍️ Firma digital:</strong> Adjunta
              </div>
              {evidenciaFotos.length > 0 && (
                <div className="gp-modal-confirm-summary-item">
                  <strong>📷 Evidencia:</strong> {evidenciaFotos.length} foto(s)
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="gp-modal-confirm-actions">
              <button
                onClick={() => setMostrarConfirmacionCierre(false)}
                className="gp-btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleSolicitarCierre}
                className="gp-btn-warning"
              >
                ✅ Sí, Enviar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Aprobación/Rechazo de Cierre (Supervisor) */}
      {mostrarModalAprobacion && (
        <div className="gp-modal-overlay gp-modal-overlay-blur">
          <div className="gp-modal-aprobacion">
            {/* Header del modal */}
            <div className={`gp-modal-aprobacion-header ${accionCierre}`}>
              <div className="gp-modal-aprobacion-icon">
                {accionCierre === 'aprobar' ? '✓' : '✗'}
              </div>
              <h2 className="gp-modal-aprobacion-title">
                {accionCierre === 'aprobar' ? 'Aprobar Solicitud de Cierre' : 'Rechazar Solicitud de Cierre'}
              </h2>
            </div>

            {/* Contenido del modal */}
            <div className="gp-modal-aprobacion-body">
              <div className="gp-form-group">
                <label className="gp-form-label">
                  {accionCierre === 'aprobar' 
                    ? '📝 Notas del supervisor (opcional)' 
                    : '📝 Motivo del rechazo (obligatorio)'}
                </label>
                <textarea
                  value={notasSupervisor}
                  onChange={(e) => setNotasSupervisor(e.target.value)}
                  rows={4}
                  placeholder={accionCierre === 'aprobar' 
                    ? 'Escribe alguna observación o felicitación...'
                    : 'Explica por qué se rechaza esta solicitud...'
                  }
                  className="gp-textarea"
                />
              </div>

              {accionCierre === 'rechazar' && (
                <div className="gp-modal-aprobacion-alert rechazar">
                  <span className="gp-modal-aprobacion-alert-icon">⚠️</span>
                  <p className="gp-modal-aprobacion-alert-text">
                    El reporte volverá al funcionario para que corrija y envíe una nueva solicitud.
                  </p>
                </div>
              )}

              {accionCierre === 'aprobar' && (
                <div className="gp-modal-aprobacion-alert aprobar">
                  <span className="gp-modal-aprobacion-alert-icon">✅</span>
                  <p className="gp-modal-aprobacion-alert-text">
                    El reporte se marcará como cerrado definitivamente.
                  </p>
                </div>
              )}

              <div className="gp-modal-aprobacion-actions">
                <button
                  onClick={() => {
                    setMostrarModalAprobacion(false);
                    setNotasSupervisor('');
                  }}
                  disabled={procesandoCierre}
                  className="gp-btn-aprobacion-cancel"
                >
                  Cancelar
                </button>
                <button
                  onClick={accionCierre === 'aprobar' ? confirmarAprobacion : confirmarRechazo}
                  disabled={procesandoCierre || (accionCierre === 'rechazar' && !notasSupervisor.trim())}
                  className={`gp-btn-aprobacion-confirm ${accionCierre}`}
                >
                  {procesandoCierre ? '⏳ Procesando...' : (accionCierre === 'aprobar' ? '✓ Confirmar' : '✗ Confirmar Rechazo')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de imagen expandida */}
      {imagenExpandida && (
        <div 
          onClick={() => setImagenExpandida(null)}
          className="gp-modal-imagen-overlay"
        >
          <div className="gp-modal-imagen-container">
            <img 
              src={imagenExpandida}
              alt="Imagen expandida"
              className="gp-modal-imagen-img"
            />
            <button
              onClick={() => setImagenExpandida(null)}
              className="gp-modal-imagen-close"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VerReporte;
