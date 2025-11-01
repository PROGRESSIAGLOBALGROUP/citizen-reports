import React, { useState, useCallback } from 'react';
import SimpleMapView from './SimpleMapView';
import { listarReportes, obtenerCategoriasConTipos } from './api.js';
import './simple-styles.css';

function ImprovedMapView({ usuario = null, onVerReporte = null }) {
  // Estados de datos
  const [reportes, setReportes] = React.useState([]);
  const [categorias, setCategorias] = React.useState([]);
  const [tipos, setTipos] = React.useState([]);
  const [tiposInfo, setTiposInfo] = React.useState({});
  const [categoriasColapsadas, setCategoriasColapsadas] = React.useState(new Set());
  const [filtrosActivos, setFiltrosActivos] = React.useState([]);
  const [prioridadesActivas, setPrioridadesActivas] = React.useState(['alta', 'media', 'baja']);
  const [cargando, setCargando] = React.useState(true);
  
  // Estado para navegación temporal
  const [mesSeleccionado, setMesSeleccionado] = React.useState(new Date().getMonth());
  const [añoSeleccionado, setAñoSeleccionado] = React.useState(new Date().getFullYear());
  const [modoVista, setModoVista] = React.useState('abiertos');
  
  // UI State
  const [panelAbierto, setPanelAbierto] = React.useState(window.innerWidth > 768);
  
  const esMesActual = mesSeleccionado === new Date().getMonth() && añoSeleccionado === new Date().getFullYear();
  
  // Cargar datos iniciales
  React.useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        const categoriasData = await obtenerCategoriasConTipos();
        
        const infoMap = {};
        categoriasData.forEach(cat => {
          cat.tipos.forEach(tipo => {
            infoMap[tipo.tipo] = {
              nombre: tipo.nombre,
              icono: tipo.icono,
              color: tipo.color || cat.color,
              categoria: cat.nombre,
              dependencia: tipo.dependencia
            };
          });
        });
        
        const todosLosTipos = categoriasData.flatMap(cat => cat.tipos.map(t => t.tipo));
        const idsCategoriasColapsadas = new Set(categoriasData.map(cat => cat.id));
        
        setCategorias(categoriasData);
        setTipos(todosLosTipos);
        setTiposInfo(infoMap);
        setFiltrosActivos(todosLosTipos);
        setCategoriasColapsadas(idsCategoriasColapsadas);
        
        await cargarReportesPorMes();
      } catch (error) {
        console.error('❌ Error cargando datos:', error);
        setCategorias([]);
        setTipos([]);
        setTiposInfo({});
      } finally {
        setCargando(false);
      }
    };
    
    cargarDatos();
  }, []);
  
  React.useEffect(() => {
    cargarReportesPorMes();
  }, [mesSeleccionado, añoSeleccionado, modoVista]);
  
  const cargarReportesPorMes = useCallback(async () => {
    try {
      setCargando(true);
      const params = {};
      
      const primerDia = new Date(añoSeleccionado, mesSeleccionado, 1);
      const ultimoDia = new Date(añoSeleccionado, mesSeleccionado + 1, 0);
      const fechaDesde = primerDia.toISOString().split('T')[0];
      const fechaHasta = ultimoDia.toISOString().split('T')[0];
      
      params.from = fechaDesde;
      params.to = fechaHasta;
      
      if (modoVista === 'abiertos') {
        params.estados = ['nuevo', 'en_proceso'];
      } else if (modoVista === 'cerrados') {
        params.estados = ['cerrado', 'rechazado'];
      }
      
      const data = await listarReportes(params);
      setReportes(data || []);
    } catch (error) {
      console.error('❌ Error cargando reportes:', error);
      setReportes([]);
    } finally {
      setCargando(false);
    }
  }, [mesSeleccionado, añoSeleccionado, modoVista]);
  
  const toggleTipo = useCallback((tipo) => {
    setFiltrosActivos(prev => {
      const nuevo = prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo];
      return nuevo;
    });
  }, []);
  
  const toggleCategoria = useCallback((categoriaId) => {
    setCategoriasColapsadas(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(categoriaId)) nuevo.delete(categoriaId);
      else nuevo.add(categoriaId);
      return nuevo;
    });
  }, []);
  
  const toggleTodos = useCallback(() => {
    setFiltrosActivos(prev => {
      const todosActivos = prev.length === tipos.length;
      return todosActivos ? [] : tipos;
    });
  }, [tipos]);
  
  const togglePrioridad = useCallback((prioridad) => {
    setPrioridadesActivas(prev => {
      return prev.includes(prioridad)
        ? prev.filter(p => p !== prioridad)
        : [...prev, prioridad];
    });
  }, []);
  
  const reportesVisibles = reportes.filter(r => {
    const cumpleTipo = filtrosActivos.includes(r.tipo);
    const prioridad = r.peso >= 4 ? 'alta' : r.peso >= 2 ? 'media' : 'baja';
    const cumplePrioridad = prioridadesActivas.includes(prioridad);
    return cumpleTipo && cumplePrioridad;
  });
  
  const reportesPrioridad = reportesVisibles.reduce((acc, r) => {
    const prioridad = r.peso >= 4 ? 'alta' : r.peso >= 2 ? 'media' : 'baja';
    acc[prioridad] = (acc[prioridad] || 0) + 1;
    return acc;
  }, {});
  
  const reportesPrioridadTotal = reportes.filter(r => filtrosActivos.includes(r.tipo)).reduce((acc, r) => {
    const prioridad = r.peso >= 4 ? 'alta' : r.peso >= 2 ? 'media' : 'baja';
    acc[prioridad] = (acc[prioridad] || 0) + 1;
    return acc;
  }, {});
  
  // Responsive layout
  const esMobil = window.innerWidth < 768;
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#f9fafb'
    }}>
      {/* CONTENEDOR PRINCIPAL: Mapa + Panel (SIN HERO - va en AppHeader) */}
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        flexDirection: esMobil ? 'column' : 'row',
        position: 'relative'
      }}>
        {/* Mapa - OCUPA ESPACIO PRINCIPAL */}
        <main style={{
          flex: 1,
          position: 'relative',
          minWidth: 0,
          order: esMobil ? 1 : 0
        }}>
          {cargando ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              fontSize: '16px',
              color: '#64748b'
            }}>
              📡 Cargando reportes...
            </div>
          ) : (
            <SimpleMapView
              reportes={reportesVisibles}
              filtrosActivos={filtrosActivos}
              tiposInfo={tiposInfo}
              usuario={usuario}
              onVerReporte={onVerReporte}
            />
          )}
        </main>

        {/* Header móvil con toggle */}
        {esMobil && (
          <div style={{
            padding: '8px 12px',
            backgroundColor: 'white',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            zIndex: 100,
            order: 0
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: '600',
              color: '#1e293b',
              flex: 1
            }}>
              📋 Filtros
            </h2>
            <button
              onClick={() => setPanelAbierto(!panelAbierto)}
              style={{
                padding: '6px 10px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              {panelAbierto ? '✕ Cerrar' : '☰ Abrir'}
            </button>
          </div>
        )}
        
        {/* Panel Lateral / Modal */}
        {(!esMobil || panelAbierto) && (
          <div style={{
            width: esMobil ? '100%' : '320px',
            backgroundColor: 'white',
            borderLeft: esMobil ? 'none' : '1px solid #e2e8f0',
            borderTop: esMobil ? '1px solid #e2e8f0' : 'none',
            boxShadow: esMobil ? 'none' : '2px 0 8px rgba(0,0,0,0.1)',
            zIndex: esMobil ? 50 : 1000,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: esMobil ? '50vh' : '100%',
            overflow: 'auto',
            order: esMobil ? 2 : 1
          }}>
          
          {/* Contenido del panel (SIN HERO) */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: esMobil ? '12px' : '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {/* Modo Vista + Selector de Mes/Año */}
            <div style={{
              padding: '8px',
              background: modoVista === 'abiertos' ? '#dbeafe' : modoVista === 'cerrados' ? '#fef3c7' : '#f3f4f6',
              borderRadius: '6px',
              border: `1px solid ${modoVista === 'abiertos' ? '#93c5fd' : modoVista === 'cerrados' ? '#fcd34d' : '#d1d5db'}`
            }}>
              {/* Toggle Abiertos/Cerrados/Todos */}
              <div style={{
                display: 'flex',
                gap: '2px',
                marginBottom: '6px',
                background: 'white',
                borderRadius: '4px',
                padding: '2px',
                border: '1px solid #e5e7eb'
              }}>
                <button
                  onClick={() => setModoVista('abiertos')}
                  style={{
                    flex: 1,
                    padding: '3px 4px',
                    background: modoVista === 'abiertos' ? '#3b82f6' : 'transparent',
                    color: modoVista === 'abiertos' ? 'white' : '#6b7280',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '9px',
                    fontWeight: '600'
                  }}
                >
                  ● Abiertos
                </button>
                <button
                  onClick={() => setModoVista('cerrados')}
                  style={{
                    flex: 1,
                    padding: '3px 4px',
                    background: modoVista === 'cerrados' ? '#f59e0b' : 'transparent',
                    color: modoVista === 'cerrados' ? 'white' : '#6b7280',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '9px',
                    fontWeight: '600'
                  }}
                >
                  ✓ Cerrados
                </button>
                <button
                  onClick={() => setModoVista('todos')}
                  style={{
                    flex: 1,
                    padding: '3px 4px',
                    background: modoVista === 'todos' ? '#6b7280' : 'transparent',
                    color: modoVista === 'todos' ? 'white' : '#6b7280',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '9px',
                    fontWeight: '600'
                  }}
                >
                  ◉ Todos
                </button>
              </div>
              
              {/* Selector de Mes/Año */}
              <div style={{
                display: 'flex',
                gap: '3px',
                alignItems: 'center'
              }}>
                <button
                  onClick={() => setMesSeleccionado(mesSeleccionado === 0 ? 11 : mesSeleccionado - 1)}
                  style={{
                    padding: '3px 6px',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  &lt;
                </button>
                <input
                  type="month"
                  value={`${añoSeleccionado}-${String(mesSeleccionado + 1).padStart(2, '0')}`}
                  onChange={(e) => {
                    const [year, month] = e.target.value.split('-');
                    setAñoSeleccionado(parseInt(year));
                    setMesSeleccionado(parseInt(month) - 1);
                  }}
                  style={{
                    flex: 1,
                    padding: '3px 6px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '3px',
                    fontSize: '10px'
                  }}
                />
                <button
                  onClick={() => setMesSeleccionado(mesSeleccionado === 11 ? 0 : mesSeleccionado + 1)}
                  style={{
                    padding: '3px 6px',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  &gt;
                </button>
              </div>
            </div>

            {/* Resumen */}
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Resumen
              </h3>
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{
                  flex: 1,
                  padding: '6px',
                  backgroundColor: '#dbeafe',
                  borderRadius: '4px',
                  textAlign: 'center',
                  fontSize: '11px'
                }}>
                  <div style={{ fontWeight: '600', color: '#1e40af' }}>{reportesVisibles.length}</div>
                  <div style={{ fontSize: '8px', color: '#0c4a6e' }}>Visibles</div>
                </div>
                <div style={{
                  flex: 1,
                  padding: '6px',
                  backgroundColor: '#fecaca',
                  borderRadius: '4px',
                  textAlign: 'center',
                  fontSize: '11px'
                }}>
                  <div style={{ fontWeight: '600', color: '#7f1d1d' }}>{reportesPrioridadTotal.alta || 0}</div>
                  <div style={{ fontSize: '8px', color: '#991b1b' }}>Alta</div>
                </div>
              </div>
            </div>

            {/* Botón LIMPIAR/TODOS */}
            <button
              onClick={toggleTodos}
              style={{
                padding: '8px 10px',
                fontSize: '11px',
                fontWeight: '700',
                backgroundColor: filtrosActivos.length === tipos.length ? '#3b82f6' : '#e5e7eb',
                color: filtrosActivos.length === tipos.length ? 'white' : '#374151',
                border: `2px solid ${filtrosActivos.length === tipos.length ? '#1e40af' : '#d1d5db'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = filtrosActivos.length === tipos.length ? '#2563eb' : '#d1d5db';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = filtrosActivos.length === tipos.length ? '#3b82f6' : '#e5e7eb';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              {filtrosActivos.length === tipos.length ? '🔄 MOSTRAR TODOS' : '🔍 SELECCIONAR TODOS'}
            </button>

            {/* Prioridades */}
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🎯 Prioridad
              </h3>
              {[
                { nivel: 'alta', color: '#ef4444', label: 'Alta', icon: '🔴' },
                { nivel: 'media', color: '#f59e0b', label: 'Media', icon: '🟠' },
                { nivel: 'baja', color: '#10b981', label: 'Baja', icon: '🟢' }
              ].map(p => {
                const countTotal = reportesPrioridadTotal[p.nivel] || 0;
                const countVisibles = reportesVisibles.filter(r => {
                  const prioridad = r.peso >= 4 ? 'alta' : r.peso >= 2 ? 'media' : 'baja';
                  return prioridad === p.nivel;
                }).length;
                
                return (
                  <button
                    key={p.nivel}
                    onClick={() => togglePrioridad(p.nivel)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      marginBottom: '3px',
                      backgroundColor: prioridadesActivas.includes(p.nivel) ? p.color : '#e5e7eb',
                      color: prioridadesActivas.includes(p.nivel) ? 'white' : '#6b7280',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.opacity = '0.9';
                      e.target.style.transform = 'translateX(2px)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.opacity = '1';
                      e.target.style.transform = 'translateX(0)';
                    }}
                  >
                    <span>{p.icon} {p.label}</span>
                    <span style={{
                      background: prioridadesActivas.includes(p.nivel) ? 'rgba(255,255,255,0.3)' : 'rgba(107,114,128,0.2)',
                      padding: '1px 6px',
                      borderRadius: '2px',
                      fontSize: '9px',
                      fontWeight: '700'
                    }}>
                      {countVisibles}/{countTotal}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Categorías */}
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '9px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📋 Categorías
              </h3>
              
              {categorias.map(cat => {
                const reportesCat = reportes.filter(r => 
                  cat.tipos.some(t => t.tipo === r.tipo)
                ).length;
                const reportesCatVisibles = reportesVisibles.filter(r => 
                  cat.tipos.some(t => t.tipo === r.tipo)
                ).length;
                
                return (
                  <div key={cat.id} style={{ marginBottom: '4px' }}>
                    <button
                      onClick={() => toggleCategoria(cat.id)}
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '10px',
                        fontWeight: '600',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        color: '#374151'
                      }}
                    >
                      <span>{cat.nombre}</span>
                      <span style={{
                        fontSize: '8px',
                        backgroundColor: '#e5e7eb',
                        padding: '1px 4px',
                        borderRadius: '10px',
                        marginRight: '4px'
                      }}>
                        {reportesCatVisibles}/{reportesCat}
                      </span>
                      <span style={{ fontSize: '9px' }}>{categoriasColapsadas.has(cat.id) ? '▶' : '▼'}</span>
                    </button>
                    
                    {!categoriasColapsadas.has(cat.id) && (
                      <div style={{ marginTop: '2px', paddingLeft: '6px' }}>
                        {cat.tipos.map(tipo => {
                          const reportesTipo = reportes.filter(r => r.tipo === tipo.tipo).length;
                          const reportesTipoVisibles = reportesVisibles.filter(r => r.tipo === tipo.tipo).length;
                          
                          return (
                            <button
                              key={tipo.id}
                              onClick={() => toggleTipo(tipo.tipo)}
                              style={{
                                width: '100%',
                                padding: '3px 4px',
                                marginBottom: '1px',
                                backgroundColor: filtrosActivos.includes(tipo.tipo) ? tipo.color || '#3b82f6' : '#e5e7eb',
                                color: filtrosActivos.includes(tipo.tipo) ? 'white' : '#6b7280',
                                border: 'none',
                                borderRadius: '2px',
                                cursor: 'pointer',
                                fontSize: '9px',
                                fontWeight: '500',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}
                            >
                              <span>{tipo.icono}</span>
                              <span style={{ flex: 1 }}>{tipo.nombre}</span>
                              <span style={{
                                fontSize: '7px',
                                padding: '0 2px',
                                backgroundColor: 'rgba(255,255,255,0.3)',
                                borderRadius: '8px',
                                marginRight: '2px'
                              }}>
                                {reportesTipoVisibles}/{reportesTipo}
                              </span>
                              {filtrosActivos.includes(tipo.tipo) && <span style={{ fontSize: '8px' }}>✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

export default ImprovedMapView;
