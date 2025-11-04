import React, { useState, useCallback } from 'react';
import SimpleMapView from './SimpleMapView';
import { listarReportes, obtenerCategoriasConTipos } from './api.js';
import { DESIGN_SYSTEM, COMMON_STYLES } from './design-system.js';
import * as UnifiedStyles from './unified-section-headers';
import './simple-styles.css';

function ImprovedMapView({ usuario = null, onVerReporte = null }) {
  console.log('🔧 ImprovedMapView component mounted');
  
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
  const [mostrarTodos, setMostrarTodos] = React.useState(true); // 🆕 Show all reports by default
  
  // UI State
  const [panelAbierto, setPanelAbierto] = React.useState(window.innerWidth > 768);
  
  const esMesActual = mesSeleccionado === new Date().getMonth() && añoSeleccionado === new Date().getFullYear();
  
  // Cargar categorías y tipos inicialmente
  React.useEffect(() => {
    const cargarDatos = async () => {
      try {
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
        
        // 🔥 FIX: Obtener tipos que existen en reportes reales para evitar filtros vacíos
        // Problema: categorias-con-tipos puede tener tipos no usados, causando filtrosActivos vacío
        const reportesData = await listarReportes({ limit: 1000 });
        const tiposEnReportes = new Set(reportesData.map(r => r.tipo));
        const tiposActivos = todosLosTipos.filter(tipo => tiposEnReportes.has(tipo));
        
        console.log('📊 Tipos cargados:', { total: todosLosTipos.length, activos: tiposActivos.length, tiposActivos });
        
        setCategorias(categoriasData);
        setTipos(todosLosTipos);
        setTiposInfo(infoMap);
        setFiltrosActivos(tiposActivos.length > 0 ? tiposActivos : todosLosTipos); // Fallback a todos si no hay reportes
        setCategoriasColapsadas(idsCategoriasColapsadas);
      } catch (error) {
        console.error('❌ Error cargando categorías:', error);
        setCategorias([]);
        setTipos([]);
        setTiposInfo({});
      }
    };
    
    cargarDatos();
  }, []);
  
  const cargarReportesPorMes = useCallback(async () => {
    try {
      console.log('🚀 cargarReportesPorMes INICIADO');
      setCargando(true);
      const params = {};
      
      // 🆕 If mostrarTodos is true, don't filter by date (show ALL reports)
      if (!mostrarTodos) {
        const primerDia = new Date(añoSeleccionado, mesSeleccionado, 1);
        const ultimoDia = new Date(añoSeleccionado, mesSeleccionado + 1, 0);
        const fechaDesde = primerDia.toISOString().split('T')[0];
        const fechaHasta = ultimoDia.toISOString().split('T')[0];
        
        params.from = fechaDesde;
        params.to = fechaHasta;
      }
      
      // La API acepta estado (singular) con estos valores:
      // 'abiertos' - excluye cerrados (nuevo + en_proceso + rechazado)
      // 'cerrado' - solo cerrados
      // sin estado - todos los reportes
      if (modoVista === 'abiertos') {
        params.estado = 'abiertos';
        console.log(`📅 Cargando reportes abiertos ${mostrarTodos ? '(sin filtro de fecha)' : 'del mes'}`);
      } else if (modoVista === 'cerrados') {
        params.estado = 'cerrado';
        console.log(`📅 Cargando reportes cerrados ${mostrarTodos ? '(sin filtro de fecha)' : 'del mes'}`);
      } else {
        // Modo todos: no filtrar por estado, solo por rango temporal
        console.log(`📅 Cargando todos los reportes ${mostrarTodos ? '(sin filtro de fecha)' : 'del mes'}`);
      }
      
      console.log('🔍 Parámetros de búsqueda:', params);
      const data = await listarReportes(params);
      console.log(`✅ ${data.length} reportes cargados`);
      setReportes(data || []);
    } catch (error) {
      console.error('❌ Error cargando reportes:', error);
      setReportes([]);
    } finally {
      setCargando(false);
      console.log('🏁 cargarReportesPorMes FINALIZADO');
    }
  }, [mesSeleccionado, añoSeleccionado, modoVista, mostrarTodos]);
  
  // 🆕 Cargar reportes cuando cambian los filtros principales
  React.useEffect(() => {
    console.log('📢 cargarReportesPorMes triggerered: modoVista=${modoVista}, mostrarTodos=${mostrarTodos}');
    cargarReportesPorMes();
  }, [cargarReportesPorMes]);
  
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
  
  // 🔥 FIX: Si filtrosActivos está vacío (tipos aún cargándose), mostrar todos los reportes
  // Evita que la pantalla quede sin marcadores mientras se cargan los tipos
  const reportesVisibles = reportes.filter(r => {
    // Si no hay filtros activos aún (inicializando), mostrar todos los reportes
    if (filtrosActivos.length === 0) {
      return true; // Mostrar TODO hasta que se carguen los tipos
    }
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
  
  // 🔥 FIX: Manejar caso donde filtrosActivos está vacío (tipos aún cargándose)
  const reportesPrioridadTotal = reportes.filter(r => {
    if (filtrosActivos.length === 0) return true; // Si no hay filtros, contar todos
    return filtrosActivos.includes(r.tipo);
  }).reduce((acc, r) => {
    const prioridad = r.peso >= 4 ? 'alta' : r.peso >= 2 ? 'media' : 'baja';
    acc[prioridad] = (acc[prioridad] || 0) + 1;
    return acc;
  }, {});
  
  // Responsive layout
  const esMobil = window.innerWidth < 768;
  
  // DEBUG LOGGING
  if (typeof window !== 'undefined') {
    console.log('🗺️ ImprovedMapView RENDER:', {
      reportes_total: reportes.length,
      reportes_visibles: reportesVisibles.length,
      filtros_activos: filtrosActivos.length,
      cargando,
      modoVista,
      mostrarTodos
    });
  }
  
  // Pasar los reportes filtrados correctamente al mapa
  const datosTest = reportesVisibles;
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: DESIGN_SYSTEM.colors.light.bg,
      fontFamily: DESIGN_SYSTEM.typography.fontFamily,
    }}>
      {/* CONTENEDOR PRINCIPAL: Mapa + Panel */}
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        flexDirection: esMobil ? 'column' : 'row',
        position: 'relative',
        gap: 0,
      }}>
        {/* Mapa - OCUPA ESPACIO PRINCIPAL */}
        <main style={{
          flex: 1,
          position: 'relative',
          minWidth: 0,
          order: esMobil ? 1 : 0,
          backgroundColor: DESIGN_SYSTEM.colors.light.bg,
        }}>
          {cargando ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              fontSize: '16px',
              color: DESIGN_SYSTEM.colors.gray[500],
              fontFamily: DESIGN_SYSTEM.typography.fontFamily,
            }}>
              📡 Cargando reportes...
            </div>
          ) : (
            <SimpleMapView
              reportes={datosTest}
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
            padding: DESIGN_SYSTEM.spacing.md + ' ' + DESIGN_SYSTEM.spacing.lg,
            ...COMMON_STYLES.header,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: DESIGN_SYSTEM.spacing.md,
            zIndex: 100,
            order: 0,
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: '700',
              background: DESIGN_SYSTEM.colors.primary.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              flex: 1,
            }}>
              📋 Filtros
            </h2>
            <button
              onClick={() => setPanelAbierto(!panelAbierto)}
              style={{
                ...COMMON_STYLES.buttonPrimary,
                fontSize: '12px',
                padding: '8px 12px',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = DESIGN_SYSTEM.shadow.primaryLg;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = COMMON_STYLES.buttonPrimary.boxShadow;
              }}
            >
              {panelAbierto ? '✕ Cerrar' : '☰ Abrir'}
            </button>
          </div>
        )}
        
        {/* Panel Lateral / Modal */}
        {(!esMobil || panelAbierto) && (
          <div style={{
            width: esMobil ? '100%' : '360px',
            ...COMMON_STYLES.panelDark,
            borderTop: esMobil ? `2px solid ${DESIGN_SYSTEM.colors.primary.main}` : 'none',
            borderLeft: esMobil ? 'none' : `2px solid ${DESIGN_SYSTEM.colors.primary.main}`,
            boxShadow: esMobil ? `0 -4px 20px ${DESIGN_SYSTEM.shadow.primaryMd}` : `2px 0 20px ${DESIGN_SYSTEM.shadow.primaryLg}`,
            zIndex: esMobil ? 50 : 1000,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: esMobil ? '50vh' : '100%',
            overflow: 'auto',
            order: esMobil ? 2 : 1,
          }}>
          
          {/* Contenido del panel */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: esMobil ? DESIGN_SYSTEM.spacing.md : DESIGN_SYSTEM.spacing.lg,
            display: 'flex',
            flexDirection: 'column',
            gap: DESIGN_SYSTEM.spacing.md,
          }}>
            {/* FILTROS DE REPORTE */}
            <div style={{
              ...UnifiedStyles.headerSection,
              marginBottom: DESIGN_SYSTEM.spacing.lg,
            }}>
              <div style={UnifiedStyles.headerIcon}>🗺️</div>
              <div style={UnifiedStyles.headerContent}>
                <h2 style={UnifiedStyles.headerTitle}>Filtrar Reportes</h2>
                <p style={UnifiedStyles.headerDescription}>
                  Personaliza la vista del mapa según tus criterios
                </p>
              </div>
            </div>

            <div style={{
              ...COMMON_STYLES.section,
              display: 'flex',
              flexDirection: 'column',
              gap: DESIGN_SYSTEM.spacing.md,
            }}>

              {/* Estado Buttons */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setModoVista('abiertos')}
                  style={{
                    flex: 1,
                    minWidth: '80px',
                    padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
                    backgroundColor: modoVista === 'abiertos' ? DESIGN_SYSTEM.colors.primary.main : DESIGN_SYSTEM.colors.neutral.light,
                    color: modoVista === 'abiertos' ? 'white' : DESIGN_SYSTEM.colors.neutral.dark,
                    border: `1px solid ${modoVista === 'abiertos' ? DESIGN_SYSTEM.colors.primary.main : DESIGN_SYSTEM.colors.neutral.border}`,
                    borderRadius: DESIGN_SYSTEM.border.radius.sm,
                    cursor: 'pointer',
                    fontSize: DESIGN_SYSTEM.typography.label.fontSize,
                    fontWeight: modoVista === 'abiertos' ? '600' : '500',
                    transition: DESIGN_SYSTEM.transition.default
                  }}
                >
                  Abiertos
                </button>
                <button
                  onClick={() => setModoVista('cerrados')}
                  style={{
                    flex: 1,
                    minWidth: '80px',
                    padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
                    backgroundColor: modoVista === 'cerrados' ? DESIGN_SYSTEM.colors.semantic.success : DESIGN_SYSTEM.colors.neutral.light,
                    color: modoVista === 'cerrados' ? 'white' : DESIGN_SYSTEM.colors.neutral.dark,
                    border: `1px solid ${modoVista === 'cerrados' ? DESIGN_SYSTEM.colors.semantic.success : DESIGN_SYSTEM.colors.neutral.border}`,
                    borderRadius: DESIGN_SYSTEM.border.radius.sm,
                    cursor: 'pointer',
                    fontSize: DESIGN_SYSTEM.typography.label.fontSize,
                    fontWeight: modoVista === 'cerrados' ? '600' : '500',
                    transition: DESIGN_SYSTEM.transition.default
                  }}
                >
                  Cerrados
                </button>
                <button
                  onClick={() => setModoVista('todos')}
                  style={{
                    flex: 1,
                    minWidth: '80px',
                    padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
                    backgroundColor: modoVista === 'todos' ? DESIGN_SYSTEM.colors.primary.main : DESIGN_SYSTEM.colors.neutral.light,
                    color: modoVista === 'todos' ? 'white' : DESIGN_SYSTEM.colors.neutral.dark,
                    border: `1px solid ${modoVista === 'todos' ? DESIGN_SYSTEM.colors.primary.main : DESIGN_SYSTEM.colors.neutral.border}`,
                    borderRadius: DESIGN_SYSTEM.border.radius.sm,
                    cursor: 'pointer',
                    fontSize: DESIGN_SYSTEM.typography.label.fontSize,
                    fontWeight: modoVista === 'todos' ? '600' : '500',
                    transition: DESIGN_SYSTEM.transition.default
                  }}
                >
                  Todos
                </button>
              </div>

              {/* Selector de Mes/Año */}
              <div style={{
                display: 'flex',
                gap: DESIGN_SYSTEM.spacing.xs,
                alignItems: 'center'
              }}>
                <button
                  onClick={() => setMesSeleccionado(mesSeleccionado === 0 ? 11 : mesSeleccionado - 1)}
                  style={{
                    padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
                    backgroundColor: DESIGN_SYSTEM.colors.neutral.darkGray,
                    border: `1px solid ${DESIGN_SYSTEM.colors.neutral.border}`,
                    borderRadius: DESIGN_SYSTEM.border.radius.sm,
                    cursor: 'pointer',
                    fontSize: DESIGN_SYSTEM.typography.label.fontSize,
                    color: DESIGN_SYSTEM.colors.neutral.medium,
                    fontWeight: '600',
                    transition: DESIGN_SYSTEM.transition.default
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = DESIGN_SYSTEM.colors.primary.main;
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.primary.main;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = DESIGN_SYSTEM.colors.neutral.darkGray;
                    e.currentTarget.style.color = DESIGN_SYSTEM.colors.neutral.medium;
                    e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.neutral.border;
                  }}
                >
                  ‹
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
                    padding: `${DESIGN_SYSTEM.spacing.sm} ${DESIGN_SYSTEM.spacing.md}`,
                    backgroundColor: DESIGN_SYSTEM.colors.neutral.darkGray,
                    border: `1px solid ${DESIGN_SYSTEM.colors.neutral.border}`,
                    borderRadius: DESIGN_SYSTEM.border.radius.sm,
                    fontSize: DESIGN_SYSTEM.typography.label.fontSize,
                    color: DESIGN_SYSTEM.colors.neutral.light,
                    fontWeight: '500',
                    outline: 'none',
                    cursor: 'pointer',
                    transition: DESIGN_SYSTEM.transition.default
                  }}
                />
                <button
                  onClick={() => setMesSeleccionado(mesSeleccionado === 11 ? 0 : mesSeleccionado + 1)}
                  style={{
                    padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
                    backgroundColor: DESIGN_SYSTEM.colors.neutral.darkGray,
                    border: `1px solid ${DESIGN_SYSTEM.colors.neutral.border}`,
                    borderRadius: DESIGN_SYSTEM.border.radius.sm,
                    cursor: 'pointer',
                    fontSize: DESIGN_SYSTEM.typography.label.fontSize,
                    color: DESIGN_SYSTEM.colors.neutral.medium,
                    fontWeight: '600',
                    transition: DESIGN_SYSTEM.transition.default
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = DESIGN_SYSTEM.colors.primary.main;
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.primary.main;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = DESIGN_SYSTEM.colors.neutral.darkGray;
                    e.currentTarget.style.color = DESIGN_SYSTEM.colors.neutral.medium;
                    e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.neutral.border;
                  }}
                >
                  ›
                </button>
              </div>

              {/* 🆕 Toggle: Show All Times */}
              <div style={{
                display: 'flex',
                gap: DESIGN_SYSTEM.spacing.md,
                alignItems: 'center',
                padding: `${DESIGN_SYSTEM.spacing.md} 0`,
                borderTop: `1px solid ${DESIGN_SYSTEM.colors.neutral.border}`,
                marginTop: DESIGN_SYSTEM.spacing.md
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: DESIGN_SYSTEM.spacing.md,
                  cursor: 'pointer',
                  flex: 1,
                  fontWeight: DESIGN_SYSTEM.typography.body.fontWeight,
                  fontSize: DESIGN_SYSTEM.typography.label.fontSize,
                  color: DESIGN_SYSTEM.colors.neutral.dark
                }}>
                  <input
                    type="checkbox"
                    checked={mostrarTodos}
                    onChange={(e) => setMostrarTodos(e.target.checked)}
                    style={{
                      cursor: 'pointer',
                      accentColor: DESIGN_SYSTEM.colors.primary.main,
                      width: '16px',
                      height: '16px'
                    }}
                  />
                  <span>Mostrar todos los tiempos</span>
                </label>
              </div>
            </div>

            {/* Resumen */}
            <div style={{
              ...COMMON_STYLES.card,
              backgroundColor: DESIGN_SYSTEM.colors.neutral.light,
              padding: DESIGN_SYSTEM.spacing.md,
              borderRadius: DESIGN_SYSTEM.border.radius.md,
              border: `1px solid ${DESIGN_SYSTEM.colors.neutral.border}`
            }}>
              <div style={{
                ...UnifiedStyles.headerTitle,
                fontSize: DESIGN_SYSTEM.typography.label.fontSize,
                fontWeight: '700',
                color: DESIGN_SYSTEM.colors.primary.main,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                paddingBottom: DESIGN_SYSTEM.spacing.md,
                borderBottom: `2px solid ${DESIGN_SYSTEM.colors.primary.main}`,
                marginBottom: DESIGN_SYSTEM.spacing.md
              }}>
                📊 Resumen
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: DESIGN_SYSTEM.spacing.md }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: DESIGN_SYSTEM.spacing.md,
                  borderBottom: `1px solid ${DESIGN_SYSTEM.colors.neutral.border}`
                }}>
                  <span style={{ fontSize: DESIGN_SYSTEM.typography.label.fontSize, fontWeight: '500', color: DESIGN_SYSTEM.colors.neutral.dark, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Reportes</span>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: DESIGN_SYSTEM.colors.primary.main }}>{reportesVisibles.length}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: DESIGN_SYSTEM.spacing.md,
                  borderBottom: `1px solid ${DESIGN_SYSTEM.colors.neutral.border}`
                }}>
                  <span style={{ fontSize: DESIGN_SYSTEM.typography.label.fontSize, fontWeight: '500', color: DESIGN_SYSTEM.colors.neutral.dark, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Alta Prioridad</span>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: DESIGN_SYSTEM.colors.semantic.danger }}>{reportesPrioridadTotal.alta || 0}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: DESIGN_SYSTEM.typography.label.fontSize, fontWeight: '500', color: DESIGN_SYSTEM.colors.neutral.dark, textTransform: 'uppercase', letterSpacing: '0.5px' }}>En Proceso</span>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: DESIGN_SYSTEM.colors.semantic.warning }}>{reportesPrioridadTotal.media || 0}</span>
                </div>
              </div>
            </div>

            {/* Botón SELECCIONAR TODOS */}
            <button
              onClick={toggleTodos}
              style={{
                width: '100%',
                padding: `${DESIGN_SYSTEM.spacing.md} ${DESIGN_SYSTEM.spacing.md}`,
                fontSize: DESIGN_SYSTEM.typography.label.fontSize,
                fontWeight: '600',
                backgroundColor: filtrosActivos.length === tipos.length ? DESIGN_SYSTEM.colors.primary.main : DESIGN_SYSTEM.colors.neutral.light,
                color: filtrosActivos.length === tipos.length ? 'white' : DESIGN_SYSTEM.colors.neutral.dark,
                border: `1px solid ${filtrosActivos.length === tipos.length ? DESIGN_SYSTEM.colors.primary.main : DESIGN_SYSTEM.colors.neutral.border}`,
                borderRadius: DESIGN_SYSTEM.border.radius.sm,
                cursor: 'pointer',
                transition: DESIGN_SYSTEM.transition.default,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
              onMouseOver={(e) => {
                if (filtrosActivos.length !== tipos.length) {
                  e.target.style.backgroundColor = DESIGN_SYSTEM.colors.neutral.medium;
                  e.target.style.borderColor = DESIGN_SYSTEM.colors.primary.main;
                }
              }}
              onMouseOut={(e) => {
                if (filtrosActivos.length !== tipos.length) {
                  e.target.style.backgroundColor = DESIGN_SYSTEM.colors.neutral.light;
                  e.target.style.borderColor = DESIGN_SYSTEM.colors.neutral.border;
                }
              }}
            >
              {filtrosActivos.length === tipos.length ? 'Mostrar Todos' : 'Seleccionar Todos'}
            </button>

            {/* Categorías */}
            <div style={{
              ...COMMON_STYLES.card,
              backgroundColor: DESIGN_SYSTEM.colors.neutral.light,
              padding: DESIGN_SYSTEM.spacing.md,
              borderRadius: DESIGN_SYSTEM.border.radius.md,
              border: `1px solid ${DESIGN_SYSTEM.colors.neutral.border}`
            }}>
              <div style={{
                fontSize: DESIGN_SYSTEM.typography.label.fontSize,
                fontWeight: '700',
                color: DESIGN_SYSTEM.colors.primary.main,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                paddingBottom: DESIGN_SYSTEM.spacing.md,
                borderBottom: `2px solid ${DESIGN_SYSTEM.colors.primary.main}`,
                marginBottom: DESIGN_SYSTEM.spacing.md
              }}>
                Categorías
              </div>
              
              {categorias.map(cat => {
                const reportesCat = reportes.filter(r => 
                  cat.tipos.some(t => t.tipo === r.tipo)
                ).length;
                const reportesCatVisibles = reportesVisibles.filter(r => 
                  cat.tipos.some(t => t.tipo === r.tipo)
                ).length;
                
                return (
                  <div key={cat.id} style={{ marginBottom: DESIGN_SYSTEM.spacing.md }}>
                    <button
                      onClick={() => toggleCategoria(cat.id)}
                      style={{
                        width: '100%',
                        padding: `${DESIGN_SYSTEM.spacing.sm} ${DESIGN_SYSTEM.spacing.md}`,
                        backgroundColor: DESIGN_SYSTEM.colors.neutral.medium,
                        border: `1px solid ${DESIGN_SYSTEM.colors.neutral.border}`,
                        borderRadius: DESIGN_SYSTEM.border.radius.sm,
                        cursor: 'pointer',
                        fontSize: DESIGN_SYSTEM.typography.label.fontSize,
                        fontWeight: '600',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        color: DESIGN_SYSTEM.colors.primary.main,
                        transition: DESIGN_SYSTEM.transition.default
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = DESIGN_SYSTEM.colors.primary.light;
                        e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.primary.main;
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = DESIGN_SYSTEM.colors.neutral.medium;
                        e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.neutral.border;
                      }}
                    >
                      <span>{cat.nombre}</span>
                      <div style={{ display: 'flex', gap: DESIGN_SYSTEM.spacing.md, alignItems: 'center' }}>
                        <span style={{
                          fontSize: '11px',
                          color: DESIGN_SYSTEM.colors.neutral.dark,
                          fontWeight: '500'
                        }}>
                          {reportesCatVisibles}/{reportesCat}
                        </span>
                        <span style={{ fontSize: '10px', color: DESIGN_SYSTEM.colors.neutral.medium }}>{categoriasColapsadas.has(cat.id) ? '▶' : '▼'}</span>
                      </div>
                    </button>
                    
                    {!categoriasColapsadas.has(cat.id) && (
                      <div style={{ marginTop: DESIGN_SYSTEM.spacing.xs, paddingLeft: DESIGN_SYSTEM.spacing.md, borderLeft: `2px solid ${DESIGN_SYSTEM.colors.primary.main}` }}>
                        {cat.tipos.map(tipo => {
                          const reportesTipo = reportes.filter(r => r.tipo === tipo.tipo).length;
                          const reportesTipoVisibles = reportesVisibles.filter(r => r.tipo === tipo.tipo).length;
                          
                          return (
                            <button
                              key={tipo.id}
                              onClick={() => toggleTipo(tipo.tipo)}
                              style={{
                                width: '100%',
                                padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
                                marginBottom: DESIGN_SYSTEM.spacing.xs,
                                backgroundColor: filtrosActivos.includes(tipo.tipo) ? DESIGN_SYSTEM.colors.primary.main : DESIGN_SYSTEM.colors.neutral.light,
                                color: filtrosActivos.includes(tipo.tipo) ? 'white' : DESIGN_SYSTEM.colors.neutral.dark,
                                border: `1px solid ${filtrosActivos.includes(tipo.tipo) ? DESIGN_SYSTEM.colors.primary.main : DESIGN_SYSTEM.colors.neutral.border}`,
                                borderRadius: DESIGN_SYSTEM.border.radius.sm,
                                cursor: 'pointer',
                                fontSize: DESIGN_SYSTEM.typography.label.fontSize,
                                fontWeight: '500',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: DESIGN_SYSTEM.spacing.xs,
                                transition: DESIGN_SYSTEM.transition.default
                              }}
                            >
                              <span style={{ fontSize: '13px' }}>{tipo.icono}</span>
                              <span style={{ flex: 1 }}>{tipo.nombre}</span>
                              <span style={{
                                fontSize: '10px',
                                padding: '1px 4px',
                                borderRadius: '3px',
                                fontWeight: '600',
                                backgroundColor: filtrosActivos.includes(tipo.tipo) ? 'rgba(255,255,255,0.25)' : '#f3f4f6'
                              }}>
                                {reportesTipoVisibles}/{reportesTipo}
                              </span>
                              {filtrosActivos.includes(tipo.tipo) && <span style={{ fontSize: '10px' }}>✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Prioridades */}
            <div style={{
              ...COMMON_STYLES.card,
              backgroundColor: DESIGN_SYSTEM.colors.neutral.light,
              padding: DESIGN_SYSTEM.spacing.md,
              borderRadius: DESIGN_SYSTEM.border.radius.md,
              border: `1px solid ${DESIGN_SYSTEM.colors.neutral.border}`
            }}>
              <div style={{
                fontSize: DESIGN_SYSTEM.typography.label.fontSize,
                fontWeight: '700',
                color: DESIGN_SYSTEM.colors.primary.main,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                paddingBottom: DESIGN_SYSTEM.spacing.md,
                borderBottom: `2px solid ${DESIGN_SYSTEM.colors.primary.main}`,
                marginBottom: DESIGN_SYSTEM.spacing.md
              }}>
                Prioridad
              </div>
              {[
                { nivel: 'alta', color: DESIGN_SYSTEM.colors.semantic.danger, label: 'Crítica' },
                { nivel: 'media', color: DESIGN_SYSTEM.colors.semantic.warning, label: 'Alta' },
                { nivel: 'baja', color: DESIGN_SYSTEM.colors.semantic.success, label: 'Normal' }
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
                      padding: `${DESIGN_SYSTEM.spacing.sm} ${DESIGN_SYSTEM.spacing.md}`,
                      marginBottom: DESIGN_SYSTEM.spacing.xs,
                      backgroundColor: prioridadesActivas.includes(p.nivel) ? p.color : DESIGN_SYSTEM.colors.neutral.medium,
                      color: prioridadesActivas.includes(p.nivel) ? 'white' : DESIGN_SYSTEM.colors.neutral.dark,
                      border: `1px solid ${prioridadesActivas.includes(p.nivel) ? p.color : DESIGN_SYSTEM.colors.neutral.border}`,
                      borderRadius: DESIGN_SYSTEM.border.radius.sm,
                      cursor: 'pointer',
                      fontSize: DESIGN_SYSTEM.typography.label.fontSize,
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: DESIGN_SYSTEM.transition.default
                    }}
                    onMouseOver={(e) => {
                      if (!prioridadesActivas.includes(p.nivel)) {
                        e.currentTarget.style.backgroundColor = DESIGN_SYSTEM.colors.neutral.light;
                        e.currentTarget.style.borderColor = p.color;
                        e.currentTarget.style.color = p.color;
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!prioridadesActivas.includes(p.nivel)) {
                        e.currentTarget.style.backgroundColor = DESIGN_SYSTEM.colors.neutral.medium;
                        e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.neutral.border;
                        e.currentTarget.style.color = DESIGN_SYSTEM.colors.neutral.dark;
                      }
                    }}
                  >
                    <span>{p.label}</span>
                    <span style={{
                      backgroundColor: prioridadesActivas.includes(p.nivel) 
                        ? 'rgba(255,255,255,0.25)' 
                        : DESIGN_SYSTEM.colors.neutral.medium,
                      color: prioridadesActivas.includes(p.nivel) ? 'white' : DESIGN_SYSTEM.colors.neutral.dark,
                      padding: '2px 6px',
                      borderRadius: DESIGN_SYSTEM.border.radius.xs,
                      fontSize: '11px',
                      fontWeight: '700'
                    }}>
                      {countVisibles}/{countTotal}
                    </span>
                  </button>
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
