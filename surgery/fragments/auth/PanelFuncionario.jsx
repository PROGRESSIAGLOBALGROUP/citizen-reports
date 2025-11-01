import React, { useState, useEffect } from 'react';

/**
 * Panel de Funcionario - Gestión de reportes
 */
export default function PanelFuncionario({ usuario }) {
  const [vista, setVista] = useState('mis-reportes'); // 'mis-reportes', 'cierres-pendientes'
  const [reportes, setReportes] = useState([]);
  const [cierresPendientes, setCierresPendientes] = useState([]);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal de cierre
  const [mostrarModalCierre, setMostrarModalCierre] = useState(false);
  const [notasCierre, setNotasCierre] = useState('');
  const [firmaDigital, setFirmaDigital] = useState('');
  const [evidenciaFotos, setEvidenciaFotos] = useState([]);

  const token = localStorage.getItem('auth_token');

  useEffect(() => {
    if (vista === 'mis-reportes') {
      cargarMisReportes();
    } else if (vista === 'cierres-pendientes' && (usuario.rol === 'supervisor' || usuario.rol === 'admin')) {
      cargarCierresPendientes();
    }
  }, [vista]);

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
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
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
                      {reporte.estado.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', color: '#1e293b' }}>
                    {reporte.descripcion || 'Sin descripción'}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>
                    Reportado: {new Date(reporte.creado_en).toLocaleDateString('es-MX')} • 
                    Asignado: {new Date(reporte.asignado_en).toLocaleDateString('es-MX')}
                  </p>
                  {reporte.notas_asignacion && (
                    <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px', fontStyle: 'italic' }}>
                      Nota: {reporte.notas_asignacion}
                    </p>
                  )}
                </div>
                
                {reporte.estado !== 'cerrado' && reporte.estado !== 'pendiente_cierre' && (
                  <button
                    onClick={() => abrirModalCierre(reporte)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    ✓ Solicitar Cierre
                  </button>
                )}
              </div>
            ))
          )}
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
    </div>
  );
}
