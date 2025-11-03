import React from 'react';
import SimpleMapView from './SimpleMapView';
import { listarReportes, obtenerCategoriasConTipos } from './api.js';
import './simple-styles.css';

function SimpleApp({ usuario = null, onVerReporte = null }) {
  const [reportes, setReportes] = React.useState([]);
  const [categorias, setCategorias] = React.useState([]); // ADR-0009: Dinámicas desde DB
  const [tipos, setTipos] = React.useState([]); // Lista plana de todos los tipos
  const [tiposInfo, setTiposInfo] = React.useState({}); // Mapeo dinámico slug -> {nombre, icono, color}
  const [categoriasColapsadas, setCategoriasColapsadas] = React.useState(new Set()); // ADR-0009: Collapse/expand
  const [filtrosActivos, setFiltrosActivos] = React.useState([]);
  const [prioridadesActivas, setPrioridadesActivas] = React.useState(['alta', 'media', 'baja']);
  const [cargando, setCargando] = React.useState(true);
  
  // Estado para navegación temporal
  const [mesSeleccionado, setMesSeleccionado] = React.useState(new Date().getMonth()); // 0-11
  const [añoSeleccionado, setAñoSeleccionado] = React.useState(new Date().getFullYear());
  const [modoVista, setModoVista] = React.useState('abiertos'); // 'abiertos' | 'cerrados' | 'todos'
  
  // Determinar si estamos en mes actual
  const esMesActual = mesSeleccionado === new Date().getMonth() && añoSeleccionado === new Date().getFullYear();
  
  // Cargar datos de la API (ADR-0009: dinámicos desde DB)
  React.useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        console.log('📡 Cargando datos de la API...');
        
        // Cargar categorías y tipos desde DB (ADR-0009: NO hardcoded)
        const categoriasData = await obtenerCategoriasConTipos();
        console.log('✅ Categorías cargadas:', categoriasData.length);
        
        // Construir mapeo dinámico: slug -> {nombre, icono, color, categoria}
        const infoMap = {};
        categoriasData.forEach(cat => {
          cat.tipos.forEach(tipo => {
            infoMap[tipo.tipo] = {
              nombre: tipo.nombre,
              icono: tipo.icono,
              color: tipo.color || cat.color, // Usar color del tipo o de la categoría
              categoria: cat.nombre,
              dependencia: tipo.dependencia
            };
          });
        });
        
        // Extraer lista plana de slugs
        const todosLosTipos = categoriasData.flatMap(cat => 
          cat.tipos.map(t => t.tipo)
        );
        
        // ADR-0009: Inicializar categorías ABIERTAS por defecto (máximo impacto visual)
        const idsCategoriasColapsadas = new Set(); // Set vacío = todas abiertas
        
        setCategorias(categoriasData);
        setTipos(todosLosTipos);
        setTiposInfo(infoMap); // Guardar mapeo dinámico
        setFiltrosActivos(todosLosTipos); // Mostrar todos por defecto
        setCategoriasColapsadas(idsCategoriasColapsadas); // Colapsar todas por defecto
        
        // Cargar reportes según mes/año seleccionado
        await cargarReportesPorMes();
      } catch (error) {
        console.error('❌ Error cargando datos:', error);
        // En caso de error, mantener arrays vacíos (evitar hardcoding)
        setCategorias([]);
        setTipos([]);
        setTiposInfo({});
      } finally {
        setCargando(false);
      }
    };
    
    cargarDatos();
  }, []); // Solo al montar
  
  // Cargar reportes cuando cambie el mes/año o modo de vista
  React.useEffect(() => {
    cargarReportesPorMes();
  }, [mesSeleccionado, añoSeleccionado, modoVista]);
  
  // Función para cargar reportes según el mes/año seleccionado
  const cargarReportesPorMes = React.useCallback(async () => {
    try {
      setCargando(true);
      const params = {};
      
      // Calcular rango de fechas del mes seleccionado
      const primerDia = new Date(añoSeleccionado, mesSeleccionado, 1);
      const ultimoDia = new Date(añoSeleccionado, mesSeleccionado + 1, 0);
      const fechaDesde = primerDia.toISOString().split('T')[0]; // YYYY-MM-DD
      const fechaHasta = ultimoDia.toISOString().split('T')[0];
      
      // Aplicar filtro temporal para TODOS los modos
      params.from = fechaDesde;
      params.to = fechaHasta;
      
      // Determinar filtro de estado según modo de vista
      if (modoVista === 'abiertos') {
        params.estado = 'abiertos';
        console.log(`📅 Cargando reportes abiertos del mes: ${fechaDesde} - ${fechaHasta}`);
      } else if (modoVista === 'cerrados') {
        params.estado = 'cerrado';
        console.log(`📅 Cargando reportes cerrados del mes: ${fechaDesde} - ${fechaHasta}`);
      } else {
        // Modo todos: no filtrar por estado, pero SÍ por rango temporal
        console.log(`📅 Cargando todos los reportes del mes: ${fechaDesde} - ${fechaHasta}`);
      }
      
      // NOTA: El mapa público NO debe filtrar por dependencia
      // Solo debe filtrar por fecha/estado para mostrar contexto temporal de la ciudad
      // El filtro de dependencia es exclusivo del PanelFuncionario
      
      const reportesData = await listarReportes(params);
      console.log('✅ Reportes cargados:', reportesData.length, 'elementos');
      setReportes(reportesData);
    } catch (error) {
      console.error('❌ Error cargando reportes:', error);
      setReportes([]);
    } finally {
      setCargando(false);
    }
  }, [mesSeleccionado, añoSeleccionado, modoVista]);
  
  // Función para toggle de filtros
  const toggleFiltro = React.useCallback((tipo) => {
    console.log('🔘 Toggling filtro:', tipo);
    setFiltrosActivos(prev => {
      const newFilters = prev.includes(tipo) 
        ? prev.filter(t => t !== tipo)
        : [...prev, tipo];
      console.log('🔄 Filtros actualizados:', newFilters);
      return newFilters;
    });
  }, []);

  // Función para toggle Ninguno/Todos
  const toggleTodosFiltros = React.useCallback(() => {
    console.log('🔘 Toggle Todos/Ninguno clicked. Estado actual:', {
      filtrosActivos: filtrosActivos.length,
      tipos: tipos.length,
      sonIguales: filtrosActivos.length === tipos.length
    });
    
    setFiltrosActivos(prev => {
      const todosActivos = prev.length === tipos.length && tipos.every(tipo => prev.includes(tipo));
      const nuevaSeleccion = todosActivos ? [] : [...tipos];
      console.log('🔄 Nueva selección:', todosActivos ? 'Ninguno' : 'Todos', nuevaSeleccion);
      return nuevaSeleccion;
    });
  }, [tipos, filtrosActivos]);

  // Función para toggle de prioridades
  const togglePrioridad = React.useCallback((prioridad) => {
    console.log('🔘 Toggling prioridad:', prioridad);
    setPrioridadesActivas(prev => {
      const newPriorities = prev.includes(prioridad)
        ? prev.filter(p => p !== prioridad)
        : [...prev, prioridad];
      console.log('🔄 Prioridades actualizadas:', newPriorities);
      return newPriorities;
    });
  }, []);

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

  return (
    <div className="simple-app" style={{ display: 'flex', height: '100vh' }}>
      {/* Panel Lateral Izquierdo */}
      <aside style={{
        width: '360px',
        background: 'rgba(255, 255, 255, 0.98)',
        borderRight: '1px solid #e2e8f0',
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header del Panel */}
        <header style={{
          padding: '20px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '28px',
            fontWeight: '700',
            color: '#1e293b',
            lineHeight: '1.2'
          }}>
            Reportes Ciudadanos
          </h1>
          
          {/* Controles de Navegación Temporal */}
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: modoVista === 'abiertos' ? '#dbeafe' : modoVista === 'cerrados' ? '#fef3c7' : '#f3f4f6',
            borderRadius: '8px',
            border: `1px solid ${modoVista === 'abiertos' ? '#93c5fd' : modoVista === 'cerrados' ? '#fcd34d' : '#d1d5db'}`
          }}>
            {/* Toggle Abiertos/Cerrados/Todos */}
            <div style={{
              display: 'flex',
              gap: '4px',
              marginBottom: '10px',
              background: 'white',
              borderRadius: '6px',
              padding: '3px',
              border: '1px solid #e5e7eb'
            }}>
              <button
                onClick={() => setModoVista('abiertos')}
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  background: modoVista === 'abiertos' ? '#3b82f6' : 'transparent',
                  color: modoVista === 'abiertos' ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px'
                }}
              >
                <span style={{ fontSize: '9px' }}>●</span>
                Abiertos
              </button>
              <button
                onClick={() => setModoVista('cerrados')}
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  background: modoVista === 'cerrados' ? '#f59e0b' : 'transparent',
                  color: modoVista === 'cerrados' ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px'
                }}
              >
                <span style={{ fontSize: '9px' }}>✓</span>
                Cerrados
              </button>
              <button
                onClick={() => setModoVista('todos')}
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  background: modoVista === 'todos' ? '#6b7280' : 'transparent',
                  color: modoVista === 'todos' ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px'
                }}
              >
                <span style={{ fontSize: '9px' }}>◉</span>
                Todos
              </button>
            </div>

            {/* Date Picker + Flechas */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
              gap: '6px'
            }}>
              <button
                onClick={() => {
                  if (mesSeleccionado === 0) {
                    setMesSeleccionado(11);
                    setAñoSeleccionado(añoSeleccionado - 1);
                  } else {
                    setMesSeleccionado(mesSeleccionado - 1);
                  }
                }}
                aria-label="Mes anterior"
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => e.target.style.background = '#f9fafb'}
                onMouseOut={(e) => e.target.style.background = 'white'}
              >
                ←
              </button>
              
              <input
                type="month"
                value={`${añoSeleccionado}-${String(mesSeleccionado + 1).padStart(2, '0')}`}
                onChange={(e) => {
                  const [año, mes] = e.target.value.split('-').map(Number);
                  const hoy = new Date();
                  const mesActual = hoy.getMonth();
                  const añoActual = hoy.getFullYear();
                  
                  // No permitir fechas futuras
                  if (año > añoActual || (año === añoActual && mes - 1 > mesActual)) {
                    return;
                  }
                  
                  setAñoSeleccionado(año);
                  setMesSeleccionado(mes - 1);
                }}
                max={(() => {
                  const hoy = new Date();
                  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
                })()}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  background: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  textAlign: 'center',
                  fontFamily: 'inherit'
                }}
              />
              
              <button
                onClick={() => {
                  const hoy = new Date();
                  const mesActual = hoy.getMonth();
                  const añoActual = hoy.getFullYear();
                  
                  // Solo permitir avanzar hasta el mes actual
                  if (añoSeleccionado < añoActual || 
                      (añoSeleccionado === añoActual && mesSeleccionado < mesActual)) {
                    if (mesSeleccionado === 11) {
                      setMesSeleccionado(0);
                      setAñoSeleccionado(añoSeleccionado + 1);
                    } else {
                      setMesSeleccionado(mesSeleccionado + 1);
                    }
                  }
                }}
                disabled={esMesActual}
                aria-label="Mes siguiente"
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: esMesActual ? '#f3f4f6' : 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: esMesActual ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: esMesActual ? '#9ca3af' : '#374151',
                  opacity: esMesActual ? 0.5 : 1,
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => !esMesActual && (e.target.style.background = '#f9fafb')}
                onMouseOut={(e) => !esMesActual && (e.target.style.background = 'white')}
              >
                →
              </button>
            </div>
            
            {/* Botón "Hoy" cuando no estamos en mes actual */}
            {!esMesActual && (
              <button
                onClick={() => {
                  const hoy = new Date();
                  setMesSeleccionado(hoy.getMonth());
                  setAñoSeleccionado(hoy.getFullYear());
                }}
                style={{
                  width: '100%',
                  padding: '7px',
                  marginBottom: '8px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  boxShadow: '0 1px 3px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 2px 6px rgba(59, 130, 246, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 1px 3px rgba(59, 130, 246, 0.3)';
                }}
              >
                📍 Volver a Hoy
              </button>
            )}
            
            {/* Indicador de estado */}
            <div style={{
              fontSize: '11px',
              color: '#6b7280',
              textAlign: 'center',
              padding: '5px 8px',
              background: 'rgba(255, 255, 255, 0.7)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: modoVista === 'abiertos' ? '#3b82f6' : modoVista === 'cerrados' ? '#f59e0b' : '#6b7280',
                animation: 'pulse 2s ease-in-out infinite'
              }}></span>
              {modoVista === 'abiertos' && (
                <span style={{ color: '#1e40af', fontWeight: '600' }}>
                  Mostrando reportes abiertos
                </span>
              )}
              {modoVista === 'cerrados' && (
                <span style={{ color: '#92400e', fontWeight: '600' }}>
                  Mostrando reportes cerrados
                </span>
              )}
              {modoVista === 'todos' && (
                <span style={{ color: '#374151', fontWeight: '600' }}>
                  Mostrando todos los reportes
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Contenido del Panel */}
        <div style={{
          padding: '20px',
          flex: 1,
          overflowY: 'auto'
        }}>
          {/* Estadísticas Generales */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '18px',
              fontWeight: '600',
              color: '#334155'
            }}>
              Resumen ({modoVista === 'abiertos' ? 'Abiertos' : modoVista === 'cerrados' ? 'Cerrados' : 'Todos'})
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                background: modoVista === 'abiertos' ? '#dbeafe' : modoVista === 'cerrados' ? '#fef3c7' : '#f3f4f6',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: modoVista === 'abiertos' ? '#1e40af' : modoVista === 'cerrados' ? '#d97706' : '#374151' }}>
                  {reportesVisibles.length}
                </div>
                <div style={{ fontSize: '12px', color: modoVista === 'abiertos' ? '#1e3a8a' : modoVista === 'cerrados' ? '#92400e' : '#4b5563' }}>
                  {modoVista === 'abiertos' ? 'Reportes Abiertos' : modoVista === 'cerrados' ? 'Reportes Cerrados' : 'Total de Reportes'}
                </div>
              </div>
              <div style={{
                background: '#fee2e2',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>
                  {reportesPrioridad.alta || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#991b1b' }}>Alta Prioridad</div>
              </div>
            </div>
          </div>

          {/* Filtros por Tipo - Agrupados por Categoría */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: '#334155'
              }}>
                Tipos de Reportes
              </h3>
              <button
                onClick={toggleTodosFiltros}
                style={{
                  fontSize: '12px',
                  padding: '4px 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  background: 'white',
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                {(filtrosActivos.length === tipos.length && tipos.every(tipo => filtrosActivos.includes(tipo))) ? 'Ninguno' : 'Todos'}
              </button>
            </div>
            
            {/* ADR-0009: Categorías dinámicas con collapse/expand */}
            {categorias.map((categoria) => {
              const colapsada = categoriasColapsadas.has(categoria.id);
              
              // Contar reportes en esta categoría
              const tiposEnCategoria = categoria.tipos.map(t => t.tipo);
              const reportesEnCategoria = reportes.filter(r => tiposEnCategoria.includes(r.tipo));
              
              return (
                <div key={categoria.id} style={{ marginBottom: '16px' }}>
                  {/* Header de categoría con toggle collapse/expand */}
                  <div 
                    onClick={() => {
                      setCategoriasColapsadas(prev => {
                        const next = new Set(prev);
                        if (next.has(categoria.id)) {
                          next.delete(categoria.id);
                        } else {
                          next.add(categoria.id);
                        }
                        return next;
                      });
                    }}
                    style={{
                      fontSize: '50px',
                      fontWeight: '900',
                      color: '#ffffff',
                      marginBottom: colapsada ? '0' : '20px',
                      paddingLeft: '20px',
                      paddingRight: '20px',
                      paddingTop: '24px',
                      paddingBottom: '24px',
                      textTransform: 'uppercase',
                      letterSpacing: '3px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderRadius: '8px',
                      transition: 'all 0.3s ease',
                      backgroundColor: '#dc2626',
                      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)',
                      ':hover': {
                        backgroundColor: 'rgba(203, 213, 225, 0.8)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }
                    }}
                  >
                    <span>
                      {categoria.icono} {categoria.nombre}
                      {reportesEnCategoria.length > 0 && (
                        <span style={{ 
                          marginLeft: '8px', 
                          fontSize: '11px',
                          fontWeight: '600',
                          color: '#94a3b8',
                          backgroundColor: '#f1f5f9',
                          padding: '2px 8px',
                          borderRadius: '10px'
                        }}>
                          {reportesEnCategoria.length}
                        </span>
                      )}
                    </span>
                    <span style={{ 
                      fontSize: '14px',
                      color: '#94a3b8',
                      transition: 'transform 0.2s ease',
                      transform: colapsada ? 'rotate(-90deg)' : 'rotate(0deg)'
                    }}>
                      ▼
                    </span>
                  </div>
                  
                  {/* Lista de tipos (solo visible si NO está colapsada) */}
                  {!colapsada && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}>
                      {categoria.tipos.map((tipoObj) => {
                        const tipo = tipoObj.tipo;
                        const info = tiposInfo[tipo] || { 
                          nombre: tipoObj.nombre, 
                          icono: tipoObj.icono, 
                          color: tipoObj.color 
                        };
                        
                        // Contar reportes de este tipo
                        const reportesDelTipo = reportes.filter(r => r.tipo === tipo);
                        
                        return (
                          <div key={tipo} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '14px 12px',
                            borderRadius: '8px',
                            backgroundColor: filtrosActivos.includes(tipo) ? 'rgba(248, 250, 252, 1)' : 'rgba(241, 245, 249, 0.5)',
                            border: `2px solid ${filtrosActivos.includes(tipo) ? info.color + '80' : '#cbd5e1'}`,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: filtrosActivos.includes(tipo) ? `0 4px 12px ${info.color}40` : 'none'
                          }}
                          onClick={() => toggleFiltro(tipo)}
                          >
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              flex: 1
                            }}>
                              <span style={{ fontSize: '48px', lineHeight: '1' }}>{info.icono}</span>
                              <div>
                                <div style={{
                                  fontSize: '32px',
                                  fontWeight: '900',
                                  color: filtrosActivos.includes(tipo) ? '#0f172a' : '#374151'
                                }}>
                                  {info.nombre}
                                </div>
                                <div style={{
                                  fontSize: '20px',
                                  color: '#64748b',
                                  fontWeight: '700'
                                }}>
                                  {reportesPorTipo[tipo] || 0} reportes
                                </div>
                              </div>
                            </div>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              backgroundColor: filtrosActivos.includes(tipo) ? info.color : '#e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '18px',
                              color: 'white',
                              fontWeight: '900',
                              transition: 'all 0.2s ease',
                              boxShadow: filtrosActivos.includes(tipo) ? `0 0 8px ${info.color}60` : 'none'
                            }}>
                              {filtrosActivos.includes(tipo) ? '✓' : ''}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Filtros de Prioridades */}
          <div>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '18px',
              fontWeight: '600',
              color: '#334155'
            }}>
              Prioridades
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {[
                { nivel: 'alta', color: '#dc2626', descripcion: 'Requiere atención inmediata' },
                { nivel: 'media', color: '#d97706', descripcion: 'Atención en 48 horas' },
                { nivel: 'baja', color: '#16a34a', descripcion: 'Programar mantenimiento' }
              ].map((prioridad) => (
                <div key={prioridad.nivel} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: prioridadesActivas.includes(prioridad.nivel) ? 'rgba(248, 250, 252, 1)' : 'rgba(241, 245, 249, 0.5)',
                  border: `1px solid ${prioridadesActivas.includes(prioridad.nivel) ? prioridad.color + '40' : '#e2e8f0'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => togglePrioridad(prioridad.nivel)}
                >
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: prioridad.color
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: prioridadesActivas.includes(prioridad.nivel) ? '#1e293b' : '#94a3b8',
                      textTransform: 'capitalize'
                    }}>
                      {prioridad.nivel} ({reportesPrioridadTotal[prioridad.nivel] || 0})
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#64748b'
                    }}>
                      {prioridad.descripcion}
                    </div>
                  </div>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    backgroundColor: prioridadesActivas.includes(prioridad.nivel) ? prioridad.color : '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: 'white',
                    fontWeight: '600'
                  }}>
                    {prioridadesActivas.includes(prioridad.nivel) ? '✓' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
      
      {/* Contenedor del Mapa */}
      <main style={{ flex: 1, position: 'relative' }}>
        {cargando ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            fontSize: '18px',
            color: '#64748b'
          }}>
            📡 Cargando reportes ciudadanos...
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
    </div>
  );
}

export default SimpleApp;