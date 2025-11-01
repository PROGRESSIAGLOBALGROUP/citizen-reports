/**
 * Componente VerReporte - Vista de solo lectura de reporte con edición de notas y mapa
 * Solo funcionarios asignados pueden editar las notas de trabajo
 */

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const API_BASE = '/api';

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

  // Verificar si el usuario actual está asignado
  const estaAsignado = asignaciones.some(a => a.usuario_id === usuario?.id);
  const miAsignacion = asignaciones.find(a => a.usuario_id === usuario?.id);

  // Cargar tipos dinámicamente desde la API
  useEffect(() => {
    const cargarTipos = async () => {
      try {
        const response = await fetch(`${API_BASE}/tipos`);
        if (response.ok) {
          const tiposData = await response.json();
          const infoMap = {};
          tiposData.forEach(t => {
            infoMap[t.tipo] = {
              nombre: t.nombre,
              icono: t.icono,
              color: t.color || '#6b7280'
            };
          });
          setTiposInfo(infoMap);
        }
      } catch (error) {
        console.error('Error cargando tipos:', error);
        setTiposInfo({});
      }
    };
    
    cargarTipos();
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [reporteId]);

  useEffect(() => {
    // Cargar notas del funcionario si está asignado
    if (miAsignacion) {
      setNotas(miAsignacion.notas || '');
    }
  }, [miAsignacion]);

  // Inicializar mapa cuando se carga el reporte
  useEffect(() => {
    if (!reporte || !mapRef.current) return;

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

    // Agregar marcador en la ubicación del reporte
    const tipoInfo = tiposInfo[reporte.tipo] || { color: '#6b7280' };
    const customIcon = L.divIcon({
      html: `<div style="background: ${tipoInfo.color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
      className: 'custom-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    L.marker([reporte.lat, reporte.lng], { icon: customIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family: sans-serif; padding: 4px;">
          <strong>${reporte.descripcion_corta || 'Reporte'}</strong>
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
  }, [reporte]);

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

      // Fetch paralelo de reporte y asignaciones
      const [reporteRes, asignacionesRes] = await Promise.all([
        fetch(`${API_BASE}/reportes/${reporteId}`),
        fetch(`${API_BASE}/reportes/${reporteId}/asignaciones`, { headers })
      ]);

      if (!reporteRes.ok) {
        throw new Error(`Error al cargar reporte: ${reporteRes.status}`);
      }
      if (!asignacionesRes.ok) {
        throw new Error(`Error al cargar asignaciones: ${asignacionesRes.status}`);
      }

      const reporteData = await reporteRes.json();
      const asignacionesData = await asignacionesRes.json();

      setReporte(reporteData);
      setAsignaciones(asignacionesData);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function guardarNotas(e) {
    e.preventDefault();

    if (!estaAsignado) {
      setMensaje({ type: 'error', text: 'No estás asignado a este reporte' });
      return;
    }

    if (!notas.trim()) {
      setMensaje({ type: 'error', text: 'Las notas no pueden estar vacías' });
      return;
    }

    setGuardando(true);
    setMensaje(null);

    try {
      const token = localStorage.getItem('auth_token');
      const headers = { 'Content-Type': 'application/json' };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/reportes/${reporteId}/notas`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          usuario_id: usuario.id,
          notas: notas.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      setMensaje({ type: 'success', text: '✅ Notas guardadas correctamente' });
      
      // Recargar asignaciones para reflejar cambios
      setTimeout(() => {
        cargarDatos();
        setMensaje(null);
      }, 2000);
    } catch (err) {
      console.error('Error al guardar notas:', err);
      setMensaje({ type: 'error', text: `❌ ${err.message}` });
    } finally {
      setGuardando(false);
    }
  }

  // Funciones para historial modal
  const cargarHistorial = async () => {
    setCargandoHistorial(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/reportes/${reporteId}/historial`, {
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
      
      const res = await fetch(`${API_BASE}/usuarios?${params.toString()}`, {
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
      const res = await fetch(`${API_BASE}/reportes/${reporteId}/asignaciones`, {
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
      const res = await fetch(`${API_BASE}/reportes/${reporteId}/asignaciones`, {
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
      const res = await fetch(`${API_BASE}/reportes/${reporteId}/asignaciones/${usuarioId}`, {
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
      const res = await fetch(`${API_BASE}/reportes/${reporteId}/reabrir`, {
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
      <div style={{
        padding: '40px',
        textAlign: 'center',
        fontSize: '16px',
        color: '#6b7280'
      }}>
        ⏳ Cargando reporte...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '16px'
        }}>⚠️</div>
        <div style={{
          fontSize: '16px',
          color: '#ef4444',
          marginBottom: '24px'
        }}>
          {error}
        </div>
        <button
          onClick={onVolver}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
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
    <div style={{
      padding: '24px',
      maxWidth: '900px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '16px'
      }}>
        <div>
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '28px',
            fontWeight: '700',
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '32px' }}>{tipoInfo.icono}</span>
            Reporte #{reporte.id}
          </h1>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#6b7280'
          }}>
            {tipoInfo.nombre} • Creado el {new Date(reporte.creado_en).toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <button
          onClick={onVolver}
          style={{
            padding: '10px 20px',
            backgroundColor: 'white',
            color: '#374151',
            border: '2px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#f9fafb'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
        >
          ← Volver al Mapa
        </button>
      </div>

      {/* Información del Reporte (Solo Lectura) */}
      <div style={{
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #e5e7eb'
      }}>
        <h2 style={{
          margin: '0 0 16px 0',
          fontSize: '18px',
          fontWeight: '700',
          color: '#111827'
        }}>
          📋 Información del Reporte
        </h2>

        <div style={{ display: 'grid', gap: '16px' }}>
          {/* Descripción Corta */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Descripción Corta
            </label>
            <div style={{
              padding: '12px',
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#111827',
              minHeight: '40px'
            }}>
              {reporte.descripcion_corta || 'Sin descripción corta'}
            </div>
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              marginTop: '4px',
              fontStyle: 'italic'
            }}>
              Esta descripción aparece en el mapa al hacer clic en el marcador
            </p>
          </div>

          {/* Descripción Detallada */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Descripción Detallada
            </label>
            <div style={{
              padding: '12px',
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#111827',
              minHeight: '80px',
              whiteSpace: 'pre-wrap'
            }}>
              {reporte.descripcion || 'Sin descripción detallada'}
            </div>
          </div>

          {/* Ubicación */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Latitud
              </label>
              <div style={{
                padding: '12px',
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#111827'
              }}>
                {reporte.lat}
              </div>
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Longitud
              </label>
              <div style={{
                padding: '12px',
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#111827'
              }}>
                {reporte.lng}
              </div>
            </div>
          </div>

          {/* Estado y Dependencia */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Estado
              </label>
              <div style={{
                padding: '12px',
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#111827'
              }}>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  backgroundColor: reporte.estado === 'abierto' ? '#fee2e2' : '#dcfce7',
                  color: reporte.estado === 'abierto' ? '#991b1b' : '#166534',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {reporte.estado === 'abierto' ? '🔴 Abierto' : '🟢 Cerrado'}
                </span>
              </div>
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Dependencia Responsable
              </label>
              <div style={{
                padding: '12px',
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#111827'
              }}>
                {reporte.dependencia?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'No asignada'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mapa de Ubicación */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #e5e7eb'
      }}>
        <h2 style={{
          margin: '0 0 16px 0',
          fontSize: '18px',
          fontWeight: '700',
          color: '#111827'
        }}>
          📍 Ubicación del Reporte
        </h2>
        <div
          ref={mapRef}
          style={{
            width: '100%',
            height: '400px',
            borderRadius: '8px',
            border: '2px solid #e5e7eb',
            overflow: 'hidden'
          }}
        />
        <p style={{
          marginTop: '12px',
          fontSize: '13px',
          color: '#6b7280',
          textAlign: 'center'
        }}>
          📍 Coordenadas: {reporte?.lat.toFixed(6)}, {reporte?.lng.toFixed(6)}
        </p>
      </div>

      {/* Botones de Acción (Solo para usuarios autenticados) */}
      {usuario && (usuario.rol === 'admin' || usuario.rol === 'supervisor') && (
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={cargarHistorial}
            disabled={cargandoHistorial}
            style={{
              padding: '12px 24px',
              backgroundColor: cargandoHistorial ? '#c4b5fd' : '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: cargandoHistorial ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              if (!cargandoHistorial) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.3)';
            }}
          >
            📜 Ver Historial
          </button>
          
          <button
            onClick={abrirModalAsignacion}
            disabled={loadingAsignacion || reporte?.estado === 'cerrado'}
            style={{
              padding: '12px 24px',
              backgroundColor: (loadingAsignacion || reporte?.estado === 'cerrado') ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: (loadingAsignacion || reporte?.estado === 'cerrado') ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: reporte?.estado === 'cerrado' ? 0.5 : 1
            }}
            onMouseOver={(e) => {
              if (!loadingAsignacion && reporte?.estado !== 'cerrado') {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
            }}
          >
            👤 Asignar Funcionario
          </button>

          {/* Botón de Reapertura (solo admin y si está cerrado) */}
          {usuario.rol === 'admin' && reporte?.estado === 'cerrado' && (
            <button
              onClick={() => setMostrarModalReabrir(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.3)';
              }}
            >
              🔓 Reabrir Reporte
            </button>
          )}
        </div>
      )}

      {/* Funcionarios Asignados */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #e5e7eb'
      }}>
        <h2 style={{
          margin: '0 0 16px 0',
          fontSize: '18px',
          fontWeight: '700',
          color: '#111827'
        }}>
          👥 Funcionarios Asignados ({asignaciones.length})
        </h2>

        {asignaciones.length === 0 ? (
          <div style={{
            padding: '24px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            ℹ️ Aún no hay funcionarios asignados a este reporte
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {asignaciones.map(asig => (
              <div
                key={asig.id}
                style={{
                  padding: '12px 16px',
                  backgroundColor: asig.usuario_id === usuario?.id ? '#dbeafe' : '#f3f4f6',
                  border: `2px solid ${asig.usuario_id === usuario?.id ? '#3b82f6' : '#d1d5db'}`,
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <div style={{
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '4px'
                }}>
                  {asig.usuario_nombre}
                  {asig.usuario_id === usuario?.id && (
                    <span style={{
                      marginLeft: '8px',
                      fontSize: '12px',
                      color: '#3b82f6'
                    }}>(Tú)</span>
                  )}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  {asig.usuario_email}
                </div>
                {asig.asignado_por_nombre && (
                  <div style={{
                    fontSize: '11px',
                    color: '#9ca3af',
                    marginTop: '4px'
                  }}>
                    Asignado por: {asig.asignado_por_nombre}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notas de Trabajo (Solo si está asignado) */}
      {estaAsignado ? (
        <form onSubmit={guardarNotas} style={{
          backgroundColor: '#fffbeb',
          borderRadius: '12px',
          padding: '24px',
          border: '2px solid #fbbf24'
        }}>
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '18px',
            fontWeight: '700',
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📝 Tus Notas de Trabajo
          </h2>
          <p style={{
            margin: '0 0 16px 0',
            fontSize: '13px',
            color: '#92400e'
          }}>
            Registra aquí tus observaciones, avances y acciones realizadas sobre este reporte.
          </p>

          {mensaje && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: mensaje.type === 'error' ? '#fee2e2' : '#dcfce7',
              border: `1px solid ${mensaje.type === 'error' ? '#fca5a5' : '#86efac'}`,
              borderRadius: '8px',
              marginBottom: '16px',
              color: mensaje.type === 'error' ? '#991b1b' : '#166534',
              fontSize: '14px'
            }}>
              {mensaje.text}
            </div>
          )}

          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Ej: Revisé el sitio, se requiere material adicional. Estimado de reparación: 3 días."
            rows="6"
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
              marginBottom: '16px'
            }}
          />

          <button
            type="submit"
            disabled={guardando || !notas.trim()}
            style={{
              padding: '12px 24px',
              backgroundColor: guardando || !notas.trim() ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: guardando || !notas.trim() ? 'not-allowed' : 'pointer',
              opacity: guardando || !notas.trim() ? 0.6 : 1
            }}
          >
            {guardando ? '💾 Guardando...' : '💾 Guardar Notas'}
          </button>
        </form>
      ) : (
        <div style={{
          backgroundColor: '#f3f4f6',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #d1d5db',
          textAlign: 'center',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
          <div style={{ fontSize: '14px' }}>
            No puedes editar las notas porque no estás asignado a este reporte.
            <br />
            Contacta a tu supervisor para que te asigne.
          </div>
        </div>
      )}

      {/* Modal de Historial */}
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

      {/* Modal de Asignación */}
      {mostrarModalAsignacion && (
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
              Asignar Reporte #{reporteId}
            </h2>
            
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              color: '#64748b'
            }}>
              <p style={{ margin: 0 }}><strong>Tipo:</strong> {reporte?.tipo}</p>
              <p style={{ margin: '4px 0 0 0' }}>
                <strong>Descripción:</strong> {reporte?.descripcion_corta || reporte?.descripcion}
              </p>
            </div>
            
            {asignaciones.length > 0 && (
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
                {asignaciones.map(asig => (
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
                      onClick={() => handleDesasignarFuncionario(asig.usuario_id, asig.usuario_nombre)}
                      disabled={loadingAsignacion}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: loadingAsignacion ? 'not-allowed' : 'pointer',
                        opacity: loadingAsignacion ? 0.5 : 1
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
                disabled={loadingAsignacion}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: '#64748b',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loadingAsignacion ? 'not-allowed' : 'pointer'
                }}
              >
                Cancelar
              </button>
              
              <button
                onClick={handleAsignarReporte}
                disabled={loadingAsignacion}
                style={{
                  padding: '8px 16px',
                  backgroundColor: loadingAsignacion ? '#93c5fd' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loadingAsignacion ? 'not-allowed' : 'pointer'
                }}
              >
                {loadingAsignacion ? 'Asignando...' : 'Asignar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reapertura */}
      {mostrarModalReabrir && (
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
            maxWidth: '500px',
            width: '100%'
          }}>
            <h2 style={{
              margin: '0 0 20px 0',
              fontSize: '20px',
              fontWeight: '700',
              color: '#1e293b'
            }}>
              🔓 Reabrir Reporte Cerrado
            </h2>

            <div style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #fbbf24',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              fontSize: '14px',
              color: '#92400e'
            }}>
              ⚠️ <strong>Atención:</strong> Esta acción reabrirá el reporte cerrado. 
              Debes proporcionar una razón justificada (mínimo 10 caracteres).
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                <strong>Reporte #{reporteId}:</strong> {reporte?.descripcion_corta || reporte?.descripcion}
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
                Razón de reapertura *
              </label>
              <textarea
                value={razonReapertura}
                onChange={(e) => setRazonReapertura(e.target.value)}
                placeholder="Ej: Se detectaron nuevos problemas relacionados, la solución aplicada fue insuficiente, etc."
                rows="4"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '12px',
                color: razonReapertura.trim().length >= 10 ? '#10b981' : '#ef4444'
              }}>
                {razonReapertura.trim().length} / 10 caracteres mínimos
              </p>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setMostrarModalReabrir(false);
                  setRazonReapertura('');
                }}
                disabled={reabriendo}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e5e7eb',
                  color: '#1f2937',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: reabriendo ? 'not-allowed' : 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleReabrirReporte}
                disabled={reabriendo || razonReapertura.trim().length < 10}
                style={{
                  padding: '10px 20px',
                  backgroundColor: (reabriendo || razonReapertura.trim().length < 10) ? '#9ca3af' : '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: (reabriendo || razonReapertura.trim().length < 10) ? 'not-allowed' : 'pointer'
                }}
              >
                {reabriendo ? 'Reabriendo...' : 'Confirmar Reapertura'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VerReporte;
