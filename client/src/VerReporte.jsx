/**
 * Componente VerReporte - Vista de solo lectura de reporte con edición de notas y mapa
 * Solo funcionarios asignados pueden editar las notas de trabajo
 */

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

      // Fetch paralelo de reporte y asignaciones
      const [reporteRes, asignacionesRes] = await Promise.all([
        fetch(`${API_BASE}/api/reportes/${reporteId}`),
        fetch(`${API_BASE}/api/reportes/${reporteId}/asignaciones`, { headers })
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
    if (!notasCierre.trim()) {
      setMensaje({ type: 'error', text: 'Las notas de cierre son obligatorias' });
      return;
    }
    
    if (!firmaDigital) {
      setMensaje({ type: 'error', text: 'La firma digital es obligatoria' });
      return;
    }

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
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '56px',
          height: '56px',
          borderRadius: '12px',
          background: '#fef2f2',
          border: '2px solid #fee2e2',
          marginBottom: '16px'
        }}>
          <span style={{ fontSize: '24px' }}>⚠️</span>
        </div>
        <div style={{
          fontSize: '15px',
          color: '#dc2626',
          marginBottom: '24px',
          fontWeight: '500'
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
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
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
      padding: 'max(16px, 5%)',
      maxWidth: '900px',
      width: '100%',
      margin: '0 auto',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        alignItems: 'stretch',
        justifyContent: 'space-between',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '16px'
      }} className="responsive-header">
        <style>{`
          @media (min-width: 768px) {
            .responsive-header {
              flex-direction: row !important;
              align-items: center !important;
            }
          }
        `}</style>
        <div>
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: 'clamp(20px, 5vw, 28px)',
            fontWeight: '700',
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '1.2em' }}>{tipoInfo.icono}</span>
            Reporte #{reporte.id}
          </h1>
          <p style={{
            margin: 0,
            fontSize: '13px',
            color: '#6b7280',
            wordBreak: 'break-word'
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
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
            minHeight: '44px',
            flexShrink: 0
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#f9fafb'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
        >
          ← Volver al Mapa
        </button>
      </div>

      {/* Mapa de Ubicación - World Class Premium */}
      <div style={{
        background: 'linear-gradient(to bottom, #ffffff, #fafbfc)',
        borderRadius: '16px',
        padding: '28px',
        marginBottom: '28px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Header con gradiente y glassmorphism */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.05) 100%)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
          }}>
            📍
          </div>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '17px',
              fontWeight: '700',
              color: '#111827',
              letterSpacing: '-0.02em'
            }}>
              Ubicación del Reporte
            </h2>
            <p style={{
              margin: '2px 0 0 0',
              fontSize: '12px',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              Coordenadas geográficas verificadas
            </p>
          </div>
        </div>

        {/* Mapa con sombra premium */}
        <div
          ref={mapRef}
          style={{
            width: '100%',
            height: '420px',
            borderRadius: '12px',
            border: '2px solid #f3f4f6',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
            position: 'relative'
          }}
        />

        {/* Badge de coordenadas con diseño premium */}
        <div style={{
          marginTop: '20px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            flex: 1,
            minWidth: '200px',
            padding: '14px 18px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
            }}>
              🌐
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Coordenadas GPS
              </div>
              <div style={{ fontSize: '13px', color: '#1e293b', fontFamily: 'monospace', fontWeight: '600' }}>
                {reporte?.lat.toFixed(6)}, {reporte?.lng.toFixed(6)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información del Reporte (Solo Lectura) */}
      <div style={{
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        padding: 'max(16px, 4%)',
        marginBottom: '24px',
        border: '1px solid #e5e7eb'
      }}>
        <h2 style={{
          margin: '0 0 16px 0',
          fontSize: 'clamp(16px, 4vw, 18px)',
          fontWeight: '700',
          color: '#111827'
        }}>
          📋 Información del Reporte
        </h2>

        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Tarjeta de Descripción - World Class Premium */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 10px 40px rgba(102, 126, 234, 0.25), 0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Efecto de luz en esquina */}
            <div style={{
              position: 'absolute',
              top: -100,
              right: -100,
              width: 200,
              height: 200,
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />

            {/* Header con badge */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}>
                📋
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '19px',
                  fontWeight: '700',
                  color: 'white',
                  letterSpacing: '-0.02em',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                  Descripción del Reporte
                </h3>
                <div style={{
                  marginTop: '8px',
                  display: 'inline-block',
                  padding: '6px 14px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'white'
                }}>
                  {reporte.descripcion_corta || 'Sin categoría'}
                </div>
              </div>
            </div>

            {/* Contenido con glassmorphism */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(20px)',
              borderRadius: '12px',
              padding: '20px',
              fontSize: '15px',
              lineHeight: '1.7',
              color: 'white',
              minHeight: '80px',
              whiteSpace: 'pre-wrap',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 4px 12px rgba(0, 0, 0, 0.1)'
            }}>
              {reporte.descripcion || 'Sin descripción detallada'}
            </div>
          </div>

          {/* Tarjeta de Geolocalización - World Class Premium */}
          <div style={{
            background: 'linear-gradient(to bottom, #ffffff, #fafbfc)',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e5e7eb',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Efecto decorativo */}
            <div style={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 150,
              height: 150,
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />

            {/* Header premium */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.05) 100%)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '24px',
              border: '1px solid rgba(59, 130, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}>
                📍
              </div>
              <h3 style={{
                margin: 0,
                fontSize: '17px',
                fontWeight: '700',
                color: '#111827',
                letterSpacing: '-0.02em'
              }}>
                Ubicación Geográfica
              </h3>
            </div>
            {/* Grid de coordenadas premium */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: '12px',
                padding: '18px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'default'
              }}>
                <div style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ fontSize: '14px' }}>↕️</span>
                  Latitud
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#1e293b',
                  fontFamily: 'monospace',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {reporte.lat}
                </div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: '12px',
                padding: '18px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'default'
              }}>
                <div style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ fontSize: '14px' }}>↔️</span>
                  Longitud
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#1e293b',
                  fontFamily: 'monospace',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {reporte.lng}
                </div>
              </div>
            </div>
          </div>

          {/* Información Administrativa - Ultra Premium */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: '1px solid #f3f4f6'
            }}>
              <span style={{ fontSize: '16px', color: '#10b981' }}>🏘️</span>
              <h3 style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: '600',
                color: '#111827',
                letterSpacing: '-0.01em'
              }}>
                Información Administrativa
              </h3>
            </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '12px',
                  padding: '14px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '6px'
                  }}>
                    País
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1e293b'
                  }}>
                    {reporte.pais || 'México'}
                  </div>
                </div>
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '12px',
                  padding: '14px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '6px'
                  }}>
                    Estado
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1e293b'
                  }}>
                    {reporte.estado_ubicacion || '—'}
                  </div>
                </div>
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '12px',
                  padding: '14px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '6px'
                  }}>
                    Municipio
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1e293b'
                  }}>
                    {reporte.municipio || '—'}
                  </div>
                </div>
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '12px',
                  padding: '14px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '6px'
                  }}>
                    Colonia
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1e293b'
                  }}>
                    {reporte.colonia || '—'}
                  </div>
                </div>
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '12px',
                  padding: '14px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '6px'
                  }}>
                    Código Postal
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1e293b'
                  }}>
                    {reporte.codigo_postal || '—'}
                  </div>
                </div>
              </div>
            <div style={{
              fontSize: '11px',
              color: '#6b7280',
              marginTop: '8px',
              fontStyle: 'italic'
            }}>
              📍 Esta información se obtiene automáticamente de las coordenadas seleccionadas usando Nominatim (OpenStreetMap).
            </div>
          </div>

          {/* Dashboard de Métricas - World Class Premium */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {/* Estado del Reporte - Premium Card */}
            <div style={{
              background: reporte.estado === 'abierto' 
                ? 'linear-gradient(135deg, #fecaca 0%, #ef4444 100%)' 
                : 'linear-gradient(135deg, #86efac 0%, #10b981 100%)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: reporte.estado === 'abierto'
                ? '0 8px 32px rgba(239, 68, 68, 0.25), 0 2px 8px rgba(0, 0, 0, 0.1)'
                : '0 8px 32px rgba(16, 185, 129, 0.25), 0 2px 8px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.2s',
              cursor: 'default'
            }}>
              {/* Efecto de brillo */}
              <div style={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 100,
                height: 100,
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  marginBottom: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}>
                  {reporte.estado === 'abierto' ? '🔴' : '✅'}
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  color: 'rgba(255, 255, 255, 0.9)', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.08em', 
                  fontWeight: '700',
                  marginBottom: '8px',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                }}>
                  Estado
                </div>
                <div style={{ 
                  fontSize: '22px', 
                  fontWeight: '800', 
                  color: 'white',
                  letterSpacing: '-0.02em',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                  {reporte.estado === 'abierto' ? 'Abierto' : 'Cerrado'}
                </div>
              </div>
            </div>

            {/* Prioridad - Premium Card */}
            <div style={{
              background: reporte.prioridad === 'alta' 
                ? 'linear-gradient(135deg, #fca5a5 0%, #dc2626 100%)' 
                : reporte.prioridad === 'media'
                ? 'linear-gradient(135deg, #fde047 0%, #f59e0b 100%)'
                : 'linear-gradient(135deg, #86efac 0%, #10b981 100%)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: reporte.prioridad === 'alta'
                ? '0 8px 32px rgba(220, 38, 38, 0.25), 0 2px 8px rgba(0, 0, 0, 0.1)'
                : reporte.prioridad === 'media'
                ? '0 8px 32px rgba(245, 158, 11, 0.25), 0 2px 8px rgba(0, 0, 0, 0.1)'
                : '0 8px 32px rgba(16, 185, 129, 0.25), 0 2px 8px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.2s',
              cursor: 'default'
            }}>
              <div style={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 100,
                height: 100,
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  marginBottom: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}>
                  {reporte.prioridad === 'alta' ? '🔥' : reporte.prioridad === 'media' ? '⚡' : '✓'}
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  color: 'rgba(255, 255, 255, 0.9)', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.08em', 
                  fontWeight: '700',
                  marginBottom: '8px',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                }}>
                  Prioridad
                </div>
                <div style={{ 
                  fontSize: '22px', 
                  fontWeight: '800', 
                  color: 'white',
                  letterSpacing: '-0.02em',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                  {reporte.prioridad === 'alta' ? 'Alta' : reporte.prioridad === 'media' ? 'Media' : 'Baja'}
                </div>
              </div>
            </div>

            {/* Peso/Urgencia - Premium Card */}
            <div style={{
              background: 'linear-gradient(135deg, #c084fc 0%, #9333ea 100%)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 8px 32px rgba(147, 51, 234, 0.25), 0 2px 8px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.2s',
              cursor: 'default'
            }}>
              <div style={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 100,
                height: 100,
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  marginBottom: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}>
                  ⚖️
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  color: 'rgba(255, 255, 255, 0.9)', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.08em', 
                  fontWeight: '700',
                  marginBottom: '8px',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                }}>
                  Peso / Urgencia
                </div>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: '800', 
                  color: 'white',
                  letterSpacing: '-0.02em',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                  {reporte.peso || 1}<span style={{ fontSize: '18px', opacity: 0.8 }}> / 5</span>
                </div>
              </div>
            </div>

            {/* Dependencia - Premium Card */}
            <div style={{
              background: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 8px 32px rgba(37, 99, 235, 0.25), 0 2px 8px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.2s',
              cursor: 'default'
            }}>
              <div style={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 100,
                height: 100,
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  marginBottom: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}>
                  🏛️
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  color: 'rgba(255, 255, 255, 0.9)', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.08em', 
                  fontWeight: '700',
                  marginBottom: '8px',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                }}>
                  Dependencia
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '800', 
                  color: 'white',
                  lineHeight: '1.3',
                  letterSpacing: '-0.01em',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                  {reporte.dependencia?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'No asignada'}
                </div>
              </div>
            </div>
          </div>

          {/* Fecha de Creación - World Class Premium */}
          <div style={{
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(245, 158, 11, 0.25), 0 2px 8px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            maxWidth: '380px',
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.2s',
            cursor: 'default'
          }}>
            <div style={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 100,
              height: 100,
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                marginBottom: '16px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}>
                📅
              </div>
              <div style={{ 
                fontSize: '11px', 
                color: 'rgba(255, 255, 255, 0.9)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.08em', 
                fontWeight: '700',
                marginBottom: '8px',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
              }}>
                Fecha de Creación
              </div>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '700', 
                color: 'white',
                lineHeight: '1.5',
                letterSpacing: '-0.01em',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}>
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
        </div>
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

      {/* Bitácora de Notas de Trabajo (Auditable - Append-Only) */}
      <div style={{
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        padding: '24px',
        border: '2px solid #3b82f6'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '700',
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📋 Bitácora de Trabajo
          </h2>
          <span style={{
            fontSize: '12px',
            color: '#6b7280',
            backgroundColor: '#e0e7ff',
            padding: '4px 12px',
            borderRadius: '12px',
            fontWeight: '600'
          }}>
            {notasTrabajo.length} {notasTrabajo.length === 1 ? 'entrada' : 'entradas'}
          </span>
        </div>

        <p style={{
          margin: '0 0 20px 0',
          fontSize: '13px',
          color: '#64748b',
          backgroundColor: '#e0f2fe',
          padding: '12px',
          borderRadius: '8px',
          borderLeft: '4px solid #3b82f6'
        }}>
          ℹ️ <strong>Sistema de trazabilidad auditable:</strong> Las notas se registran con timestamp y son inmutables (no se pueden editar ni eliminar). Cada entrada queda permanentemente en el historial.
        </p>

        {/* Formulario para agregar nueva nota (solo si está asignado y estado lo permite) */}
        {estaAsignado && reporte.estado !== 'pendiente_cierre' && reporte.estado !== 'cerrado' ? (
          <form onSubmit={agregarNotaTrabajo} style={{
            backgroundColor: '#fffbeb',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            border: '1px solid #fde68a'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Tipo de Nota:
              </label>
              <select
                value={tipoNota}
                onChange={(e) => setTipoNota(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                <option value="observacion">📝 Observación</option>
                <option value="avance">🔄 Avance de Trabajo</option>
                <option value="incidente">⚠️ Incidente / Problema</option>
                <option value="resolucion">✅ Resolución</option>
              </select>
            </div>

            {mensaje && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: mensaje.type === 'error' ? '#fee2e2' : '#dcfce7',
                border: `1px solid ${mensaje.type === 'error' ? '#fca5a5' : '#86efac'}`,
                borderRadius: '8px',
                marginBottom: '12px',
                color: mensaje.type === 'error' ? '#991b1b' : '#166534',
                fontSize: '13px'
              }}>
                {mensaje.text}
              </div>
            )}

            <textarea
              value={nuevaNota}
              onChange={(e) => setNuevaNota(e.target.value)}
              placeholder="Ej: Revisé el sitio, se requiere material adicional. Estimado de reparación: 3 días."
              rows="4"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                marginBottom: '12px'
              }}
            />

            <button
              type="submit"
              disabled={guardando || !nuevaNota.trim()}
              style={{
                padding: '10px 20px',
                backgroundColor: guardando || !nuevaNota.trim() ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: guardando || !nuevaNota.trim() ? 'not-allowed' : 'pointer',
                opacity: guardando || !nuevaNota.trim() ? 0.6 : 1
              }}
            >
              {guardando ? '💾 Guardando...' : '➕ Agregar a Bitácora'}
            </button>
          </form>
        ) : estaAsignado && (reporte.estado === 'pendiente_cierre' || reporte.estado === 'cerrado') ? (
          <div style={{
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #fde68a',
            borderLeft: '4px solid #fbbf24',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <span style={{ fontSize: '20px', color: '#f59e0b', minWidth: '24px' }}>⚠️</span>
            <div style={{ fontSize: '13px', color: '#78716c', lineHeight: '1.6' }}>
              <strong>Reporte {reporte.estado === 'pendiente_cierre' ? 'en revisión de cierre' : 'cerrado'}</strong>
              <br />
              No se pueden agregar más notas en este estado. {reporte.estado === 'pendiente_cierre' ? 'Espera a que el supervisor termine la revisión.' : ''}
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #fde68a',
            borderLeft: '4px solid #f59e0b',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <span style={{ fontSize: '20px', color: '#f59e0b' }}>🔒</span>
            <div style={{ fontSize: '13px', color: '#78716c', lineHeight: '1.5' }}>
              Solo funcionarios asignados pueden agregar notas a la bitácora.
            </div>
          </div>
        )}

        {/* Historial de notas (mostrar todas cronológicamente) */}
        <div style={{
          borderTop: '2px solid #e5e7eb',
          paddingTop: '20px'
        }}>
          <h3 style={{
            margin: '0 0 16px 0',
            fontSize: '15px',
            fontWeight: '600',
            color: '#374151'
          }}>
            📜 Historial Completo
          </h3>

          {cargandoNotas ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
              Cargando bitácora...
            </div>
          ) : notasTrabajo.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#9ca3af',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px dashed #d1d5db'
            }}>
              📭 No hay notas registradas aún
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {notasTrabajo.map((nota, idx) => {
                const tipoIconos = {
                  observacion: '📝',
                  avance: '🔄',
                  incidente: '⚠️',
                  resolucion: '✅'
                };
                const tipoColores = {
                  observacion: '#3b82f6',
                  avance: '#f59e0b',
                  incidente: '#ef4444',
                  resolucion: '#10b981'
                };

                return (
                  <div key={nota.id} style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '16px',
                    border: `1px solid ${tipoColores[nota.tipo]}20`,
                    borderLeft: `4px solid ${tipoColores[nota.tipo]}`
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <div>
                        <span style={{
                          backgroundColor: `${tipoColores[nota.tipo]}15`,
                          color: tipoColores[nota.tipo],
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          marginRight: '8px'
                        }}>
                          {tipoIconos[nota.tipo]} {nota.tipo.toUpperCase()}
                        </span>
                        <span style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          fontWeight: '600'
                        }}>
                          {nota.usuario_nombre}
                        </span>
                      </div>
                      <div style={{ 
                        fontSize: '11px', 
                        color: '#9ca3af',
                        textAlign: 'right'
                      }}>
                        {new Date(nota.creado_en).toLocaleString('es-MX', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#374151',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {nota.contenido}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sección: Solicitar Cierre del Reporte */}
      {estaAsignado && reporte.estado !== 'cerrado' && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '700',
              color: '#1e293b'
            }}>
              ✅ Solicitar Cierre del Reporte
            </h2>
            {!mostrarFormCierre && reporte.estado !== 'pendiente_cierre' && (
              <button
                onClick={() => setMostrarFormCierre(true)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
              >
                📝 Completar Solicitud de Cierre
              </button>
            )}
            {reporte.estado === 'pendiente_cierre' && !mostrarFormCierre && (
              <span style={{
                padding: '8px 16px',
                backgroundColor: '#fbbf24',
                color: '#78350f',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                display: 'inline-block'
              }}>
                ⏳ Solicitud pendiente de revisión
              </span>
            )}
          </div>

          {mostrarFormCierre ? (
            <div>
              <p style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '13px',
                color: '#166534',
                marginBottom: '20px'
              }}>
                ℹ️ <strong>Última etapa:</strong> Completa este formulario para enviar la solicitud de cierre al supervisor. Asegúrate de haber documentado todo el trabajo en la bitácora arriba.
              </p>

              {mensaje && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: mensaje.type === 'error' ? '#fee2e2' : '#dcfce7',
                  border: `1px solid ${mensaje.type === 'error' ? '#fca5a5' : '#86efac'}`,
                  borderRadius: '8px',
                  marginBottom: '16px',
                  color: mensaje.type === 'error' ? '#991b1b' : '#166534',
                  fontSize: '13px'
                }}>
                  {mensaje.text}
                </div>
              )}
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Notas de cierre *
                </label>
                <textarea
                  value={notasCierre}
                  onChange={(e) => setNotasCierre(e.target.value)}
                  rows={4}
                  placeholder="Describe las acciones realizadas para resolver el reporte..."
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
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Firma digital *
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
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
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
                  onClick={() => {
                    setMostrarFormCierre(false);
                    setNotasCierre('');
                    setFirmaDigital('');
                    setEvidenciaFotos([]);
                    setMensaje(null);
                  }}
                  disabled={guardando}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    color: '#64748b',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: guardando ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancelar
                </button>
                
                <button
                  onClick={handleSolicitarCierre}
                  disabled={guardando}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: guardando ? '#93c5fd' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: guardando ? 'not-allowed' : 'pointer'
                  }}
                >
                  {guardando ? '📤 Enviando...' : '📤 Enviar Solicitud de Cierre'}
                </button>
              </div>
            </div>
          ) : (
            <p style={{
              fontSize: '14px',
              color: '#64748b',
              margin: 0
            }}>
              🔄 Haz clic en el botón arriba cuando hayas completado todo el trabajo documentado en la bitácora.
            </p>
          )}
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
