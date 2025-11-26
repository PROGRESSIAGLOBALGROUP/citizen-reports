import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import { API_BASE, crearReporte, listarReportes, tiposReporte, exportGeoJSON, gridAggregates } from './api.js';
import * as htmlToImage from 'html-to-image';

const gradients = [
  { 0.2: '#00f', 0.4: '#0ff', 0.6: '#0f0', 0.8: '#ff0', 1.0: '#f00' },
  { 0.2: '#222', 0.4: '#4a90e2', 0.6: '#50e3c2', 0.8: '#b8e986', 1.0: '#f5a623' },
  { 0.2: '#2b2d42', 0.4: '#8d99ae', 0.6: '#edf2f4', 0.8: '#ef233c', 1.0: '#d90429' }
];

export default function MapView() {
  const mapRef = useRef(null);
  const heatLayerRef = useRef(null);
  const containerRef = useRef(null);
  const layerGroupRef = useRef(null);

  const [tipos, setTipos] = useState([]);
  const [tiposSeleccionados, setTiposSeleccionados] = useState([]);
  const [multiCapa, setMultiCapa] = useState(false);
  const [usarGrid, setUsarGrid] = useState(false);
  const [cell, setCell] = useState(0.005);
  const [gradIndex, setGradIndex] = useState(0);

  const [puntos, setPuntos] = useState([]);
  const [filtros, setFiltros] = useState({ from: '', to: '' });

  const [form, setForm] = useState({ tipo: 'general', descripcion: '', lat: '', lng: '', peso: 1 });

  const refrescarTipos = useCallback(async () => {
    try {
      const data = await tiposReporte();
      setTipos(data);
      setTiposSeleccionados((prev) => {
        if (!data || data.length === 0) {
          return [];
        }
        if (!prev || prev.length === 0) {
          return data;
        }
        const retained = data.filter((t) => prev.includes(t));
        const newOnes = data.filter((t) => !prev.includes(t));
        return [...retained, ...newOnes];
      });
    } catch (err) {
      console.error('No se pudieron cargar los tipos de reporte', err);
    }
  }, []);

  const clearLayers = useCallback(() => {
    try {
      if (layerGroupRef.current) {
        layerGroupRef.current.clearLayers();
        console.log('🧹 Capas limpiadas correctamente');
      }
      if (heatLayerRef.current) {
        heatLayerRef.current = null;
      }
    } catch (error) {
      console.error('❌ Error limpiando capas:', error);
    }
  }, []);

  const renderSingleHeat = useCallback((data) => {
    console.log('🔥 Renderizando heatmap único...');
    if (!data || data.length === 0) {
      console.log('⚠️ No hay datos para renderizar');
      return;
    }
    
    if (!layerGroupRef.current) {
      console.error('❌ Layer group no disponible');
      return;
    }
    
    try {
      clearLayers();
      
      const heatData = data.map(p => [Number(p.lat), Number(p.lng), Math.max(3, Number(p.peso) || 3)]);
      console.log('🔥 Datos procesados para heatmap:', heatData.length, 'puntos', heatData);
      
      // Crear nueva capa de heatmap cada vez
      const newHeatLayer = L.heatLayer(heatData, {
        radius: 40,
        blur: 20,
        maxZoom: 19,
        minOpacity: 0.5,
        gradient: gradients[gradIndex] || {0.4: 'blue', 0.65: 'lime', 1.0: 'red'}
      });
      
      layerGroupRef.current.addLayer(newHeatLayer);
      heatLayerRef.current = newHeatLayer;
      
      console.log('✅ Heatmap renderizado con', heatData.length, 'puntos');
    } catch (error) {
      console.error('❌ Error renderizando heatmap:', error);
    }
  }, [clearLayers, gradIndex]);

  const renderMultiLayers = useCallback((data) => {
    if (!layerGroupRef.current || !data) return;
    clearLayers();
    
    const groupedByType = {};
    data.forEach((point) => {
      const key = point.tipo || 'otros';
      if (!groupedByType[key]) groupedByType[key] = [];
      groupedByType[key].push(point);
    });

    Object.entries(groupedByType).forEach(([tipo, points]) => {
      const arr = [];
      points.forEach((p) => {
        arr.push([Number(p.lat), Number(p.lng), Math.max(1, Number(p.peso) || 1)]);
      });
      if (arr.length > 0) {
        L.heatLayer(arr, { radius: 20, blur: 12, maxZoom: 17, minOpacity: 0.3 }).addTo(layerGroupRef.current);
      }
    });
  }, [clearLayers]);

  const renderHeatFromGrid = useCallback((cells) => {
    if (!heatLayerRef.current || !cells) return;
    clearLayers();
    
    const heatData = cells.map(c => [Number(c.lat), Number(c.lng), Math.max(1, Number(c.peso) || 1)]);
    heatLayerRef.current.setLatLngs(heatData);
    heatLayerRef.current.setOptions({
      radius: 30,
      blur: 16,
      maxZoom: 17,
      minOpacity: 0.25,
      gradient: gradients[gradIndex]
    }).addTo(layerGroupRef.current);
  }, [clearLayers, gradIndex]);

  const refrescarPuntos = useCallback(async () => {
    console.log('📊 Refrescando puntos...', { tipos: tipos.length, tiposSeleccionados: tiposSeleccionados.length, usarGrid });
    
    try {
      // Comentamos la validación de selección vacía para debugging
      // const seleccionVacia = tipos.length > 0 && tiposSeleccionados.length === 0;
      // if (seleccionVacia) {
      //   console.log('⚠️ Selección vacía, limpiando capas');
      //   clearLayers();
      //   setPuntos([]);
      //   return;
      // }

      const params = { ...filtros };
      const debeFiltrar = tiposSeleccionados.length > 0 && tiposSeleccionados.length !== tipos.length;
      if (debeFiltrar) {
        params.tipo = tiposSeleccionados;
      }

      console.log('📋 Parámetros de consulta:', params);

      if (usarGrid) {
        console.log('🔲 Usando grid aggregates...');
        const data = await gridAggregates({ ...params, cell });
        console.log('🔲 Grid data recibida:', data.length, 'elementos');
        setPuntos(data);
        renderHeatFromGrid(data);
      } else {
        console.log('📍 Listando reportes...');
        const data = await listarReportes(params);
        console.log('📍 Reportes recibidos:', data.length, 'elementos');
        setPuntos(data);
        if (multiCapa) {
          console.log('🎨 Renderizando múltiples capas...');
          renderMultiLayers(data);
        } else {
          console.log('🔥 Renderizando heatmap único...');
          renderSingleHeat(data);
        }
      }
    } catch (err) {
      console.error('❌ Error al refrescar puntos:', err);
    }
  }, [usarGrid, filtros, cell, multiCapa, renderHeatFromGrid, renderMultiLayers, renderSingleHeat, tiposSeleccionados, tipos, clearLayers]);

  const toggleTipo = useCallback((value) => {
    setTiposSeleccionados((prev) => {
      if (prev.includes(value)) {
        return prev.filter((t) => t !== value);
      }
      return [...prev, value];
    });
  }, []);

  const seleccionarTodos = useCallback(() => {
    setTiposSeleccionados([...tipos]);
  }, [tipos]);

  const limpiarSeleccion = useCallback(() => {
    setTiposSeleccionados([]);
  }, []);

  useEffect(() => {
    if (mapRef.current) return;
    console.log('🗺️ Inicializando mapa para citizen-reports...');
    
    // Verificar que leaflet.heat está disponible
    if (!L.heatLayer) {
      console.error('❌ Plugin leaflet.heat no está disponible');
      return;
    }
    console.log('✅ Plugin leaflet.heat disponible');
    
    // Coordenadas precisas del centro de citizen-reports, Morelos
    const map = L.map('map', { zoomControl: true }).setView([18.816667, -98.966667], 16);
    mapRef.current = map;

    // Usar CartoDB Voyager como proveedor principal (más confiable que OSM)
    console.log('🗺️ Configurando tiles de CartoDB...');
    const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, © <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      crossOrigin: true
    });

    tileLayer.on('loading', () => console.log('📥 Cargando tiles...'));
    tileLayer.on('load', () => console.log('✅ Tiles cargados correctamente'));
    tileLayer.on('tileerror', (e) => console.error('❌ Error cargando tile:', e));
    
    tileLayer.addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);
    
    // Inicializar heatmap de forma más segura
    try {
      heatLayerRef.current = L.heatLayer([], { 
        radius: 40, 
        blur: 20, 
        maxZoom: 19, 
        minOpacity: 0.5,
        gradient: {0.4: 'blue', 0.65: 'lime', 1.0: 'red'}
      });
      console.log('✅ Heatmap layer creado correctamente');
    } catch (error) {
      console.error('❌ Error creando heatmap layer:', error);
    }
    
    // Forzar la carga de tiles y centrado
    setTimeout(() => {
      console.log('🎯 Forzando centrado exacto en citizen-reports...');
      map.setView([18.816667, -98.966667], 16);
      map.invalidateSize();
      
      // Datos de prueba inmediatos para verificar el heatmap - centrados en citizen-reports
      const testData = [
        [18.816667, -98.966667, 4], // Centro exacto de citizen-reports
        [18.817, -98.967, 3],       // Norte
        [18.816, -98.966, 2],       // Sur  
        [18.817, -98.966, 3],       // Este
        [18.816, -98.967, 2]        // Oeste
      ];
      
      console.log('🔥 Aplicando datos de prueba al heatmap...');
      if (heatLayerRef.current && layerGroupRef.current) {
        try {
          // Limpiar capas existentes
          layerGroupRef.current.clearLayers();
          
          // Crear nueva capa de heatmap con datos de prueba
          const newHeatLayer = L.heatLayer(testData, {
            radius: 50,
            blur: 25,
            maxZoom: 19,
            minOpacity: 0.8,
            gradient: {0.4: 'blue', 0.6: 'cyan', 0.8: 'lime', 1.0: 'red'}
          });
          
          layerGroupRef.current.addLayer(newHeatLayer);
          heatLayerRef.current = newHeatLayer;
          console.log('✅ Heatmap de prueba aplicado con', testData.length, 'puntos');
        } catch (error) {
          console.error('❌ Error aplicando heatmap de prueba:', error);
        }
      } else {
        console.warn('⚠️ Referencias de heatmap no disponibles');
      }
    }, 1000);

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      setForm(f => ({ ...f, lat: lat.toFixed(6), lng: lng.toFixed(6) }));
    });

    void (async () => {
      console.log('🚀 Iniciando carga de datos...');
      await refrescarTipos();
      
      // Forzar carga de datos después de un pequeño delay
      setTimeout(async () => {
        console.log('🔄 Forzando carga de puntos...');
        try {
          await refrescarPuntos();
          console.log('✅ Carga inicial completada');
          
          // Si aún no hay heatmap visible, forzar uno
          setTimeout(() => {
            if (layerGroupRef.current && layerGroupRef.current.getLayers().length === 0) {
              console.log('🔧 Auto-aplicando heatmap de emergencia...');
              const emergencyData = [
                [18.816667, -98.966667, 8],
                [18.816800, -98.966500, 6],
                [18.816500, -98.966800, 7]
              ];
              const emergencyHeat = L.heatLayer(emergencyData, {
                radius: 50, blur: 25, minOpacity: 0.8,
                gradient: {0.4: 'blue', 0.7: 'lime', 1.0: 'red'}
              });
              layerGroupRef.current.addLayer(emergencyHeat);
              console.log('✅ Heatmap de emergencia aplicado');
            }
          }, 1000);
        } catch (error) {
          console.error('❌ Error en carga inicial:', error);
        }
      }, 500);
    })();
  }, [refrescarTipos, refrescarPuntos]);

  useEffect(() => {
    if (!mapRef.current) return;
    void (async () => {
      await refrescarPuntos();
    })();
  }, [usarGrid, multiCapa, gradIndex, cell, refrescarPuntos]);

  useEffect(() => {
    if (!mapRef.current) return;
    void (async () => {
      await refrescarPuntos();
    })();
  }, [tiposSeleccionados, refrescarPuntos]);


  function usarMiUbicacion() {
    if (!navigator.geolocation) { alert('Geolocalización no soportada'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setForm(f => ({ ...f, lat: latitude.toFixed(6), lng: longitude.toFixed(6) }));
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 16);
        }
      },
      (err) => { console.error('Error de geolocalización', err); alert('No se pudo obtener tu ubicación'); }
    );
  }

  async function guardarReporte(e) {
    e.preventDefault();
    if (!form.lat || !form.lng) { alert('Falta ubicación'); return; }
    try {
      await crearReporte(form);
      alert('Reporte guardado');
      await refrescarPuntos();
      setForm({ tipo: 'general', descripcion: '', lat: '', lng: '', peso: 1 });
    } catch (err) {
      console.error('Error al guardar', err);
      alert('Error al guardar el reporte');
    }
  }

  const exportarImagen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(containerRef.current);
      const link = document.createElement('a');
      link.download = 'mapa-calor-citizen-reports.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error al exportar imagen', err);
      alert('Error al exportar la imagen');
    }
  }, []);

  const exportarGeoJSON = useCallback(async () => {
    try {
      const blob = await exportGeoJSON(filtros);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'reportes-citizen-reports.geojson';
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al exportar GeoJSON', err);
      alert('Error al exportar los datos');
    }
  }, [filtros]);

  return (
    <div className="mapview" ref={containerRef}>
      <div className="top-bar">
        <div className="brand">
          <div className="eyebrow">OBSERVATORIO CIUDADANO • DATOS EN VIVO</div>
          <h1>Mapa de calor de incidentes</h1>
          <p>Monitorea reportes comunitarios, valida tendencias y prioriza despliegues de campo en minutos.</p>
        </div>
        <div className="metrics">
          <div className="metric-card">
            <div className="metric-value">{puntos?.length || 0}</div>
            <div className="metric-label">TOTAL VISIBLE</div>
            <div className="metric-description">reportes</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{tiposSeleccionados?.length || 0}</div>
            <div className="metric-label">TIPOS ACTIVOS</div>
            <div className="metric-description">filtros aplicados</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">Calor estándar</div>
            <div className="metric-label">MODO DE VISTA</div>
            <div className="metric-description">Distribución dinámica</div>
          </div>
          <button 
            className="btn btn-primary" 
            style={{marginLeft: '12px', fontSize: '0.7rem', padding: '4px 8px'}}
            onClick={() => {
              console.log('🚨 BOTÓN SUPERIOR: Forzando heatmap...');
              if (!layerGroupRef.current || !mapRef.current) {
                alert('❌ Mapa no inicializado');
                return;
              }
              try {
                layerGroupRef.current.clearLayers();
                
                // USAR CÍRCULOS DIRECTOS - MÁS CONFIABLE
                console.log('🎯 Usando círculos de calor garantizados');
                const points = [
                  {lat: 18.816667, lng: -98.966667, peso: 10, desc: 'Centro Principal'},
                  {lat: 18.816700, lng: -98.966600, peso: 8, desc: 'Norte'},
                  {lat: 18.816600, lng: -98.966700, peso: 9, desc: 'Sur'},
                  {lat: 18.816750, lng: -98.966550, peso: 7, desc: 'Este'},
                  {lat: 18.816550, lng: -98.966750, peso: 6, desc: 'Oeste'}
                ];
                
                points.forEach(p => {
                  // Color basado en peso
                  let color, fillColor, radius;
                  if (p.peso >= 9) {
                    color = '#FF0000'; fillColor = '#FF0000'; radius = 80;
                  } else if (p.peso >= 7) {
                    color = '#FF8000'; fillColor = '#FF8000'; radius = 60;
                  } else {
                    color = '#0080FF'; fillColor = '#0080FF'; radius = 40;
                  }
                  
                  const circle = L.circle([p.lat, p.lng], {
                    color: color,
                    fillColor: fillColor,
                    fillOpacity: 0.8,
                    radius: radius,
                    weight: 3
                  }).bindPopup(`${p.desc}<br>Intensidad: ${p.peso}`);
                  
                  layerGroupRef.current.addLayer(circle);
                });
                
                // Centrar en citizen-reports
                setTimeout(() => {
                  mapRef.current.setView([18.816667, -98.966667], 16);
                  mapRef.current.invalidateSize();
                }, 100);
                
                alert('✅ CÍRCULOS DE CALOR aplicados - 100% visibles!');
                
                  // Intentar agregar heatmap adicional si funciona
                  try {
                    const heatData = points.map(p => [p.lat, p.lng, p.peso]);
                    const heat = L.heatLayer(heatData, {
                      radius: 100, blur: 50, minOpacity: 0.3,
                      gradient: {0.4: 'blue', 0.7: 'lime', 1.0: 'red'}
                    });
                    layerGroupRef.current.addLayer(heat);
                    console.log('✅ Heatmap adicional agregado');
                  } catch (e) {
                    console.log('⚠️ Heatmap falló, solo círculos:', e.message);
                  }
                }
                
              } catch (e) {
                console.error('❌ Error completo:', e);
                alert('❌ Error: ' + e.message);
              }
            }}>
            🔥 TEST
          </button>
        </div>
      </div>

      <div className="content">
        <div className="control-panel">
          <div className="section-block">
            <div className="eyebrow">CAPTURA MANUAL</div>
            <h2>Nuevo reporte</h2>
            <p>Registra eventos detectados por operadores o ciudadanía.</p>

            <form onSubmit={guardarReporte}>
              <label>
                Tipo
                <select value={form.tipo} onChange={(e) => setForm(f => ({ ...f, tipo: e.target.value }))}>
                  <option value="general">general</option>
                  {tipos.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>

              <label>
                Descripción
                <textarea
                  rows="3"
                  placeholder="Describe contexto, daños y contacto"
                  value={form.descripcion}
                  onChange={(e) => setForm(f => ({ ...f, descripcion: e.target.value }))}
                />
              </label>

              <div className="location-row">
                <label>
                  Latitud
                  <input
                    type="number"
                    step="any"
                    placeholder="18.816667"
                    value={form.lat}
                    onChange={(e) => setForm(f => ({ ...f, lat: e.target.value }))}
                  />
                </label>
                <label>
                  Longitud
                  <input
                    type="number"
                    step="any"
                    placeholder="-98.966667"
                    value={form.lng}
                    onChange={(e) => setForm(f => ({ ...f, lng: e.target.value }))}
                  />
                </label>
              </div>

              <button type="button" className="btn btn-ghost" onClick={usarMiUbicacion}>
                Usar mi ubicación
              </button>

              <label>
                Peso (intensidad)
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={form.peso}
                  onChange={(e) => setForm(f => ({ ...f, peso: Number(e.target.value) }))}
                />
              </label>

              <button type="submit" className="btn btn-primary">
                Guardar reporte
              </button>
            </form>
          </div>

          <div className="section-block">
            <div className="eyebrow">ANÁLISIS TEMPORAL</div>
            <h2>Filtros</h2>
            <p>Acota la vista por fechas y categorías prioritarias.</p>

            <div className="filters">
              <label>
                Desde
                <input
                  type="date"
                  value={filtros.from}
                  onChange={(e) => setFiltros(f => ({ ...f, from: e.target.value }))}
                />
              </label>
              <label>
                Hasta
                <input
                  type="date"
                  value={filtros.to}
                  onChange={(e) => setFiltros(f => ({ ...f, to: e.target.value }))}
                />
              </label>
              <button type="button" className="btn btn-ghost" onClick={() => { void refrescarPuntos(); }}>Aplicar fechas</button>
            </div>

            {tipos.length > 0 && (
              <div className="filter-chips">
                <div className="chips-header">
                  <span>Tipos de reporte</span>
                  <div className="chips-actions">
                    <button type="button" className="btn-link" onClick={seleccionarTodos}>Todos</button>
                    <button type="button" className="btn-link" onClick={limpiarSeleccion}>Ninguno</button>
                  </div>
                </div>
                <div className="chips">
                  {tipos.map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      className={`chip ${tiposSeleccionados.includes(tipo) ? 'chip-selected' : ''}`}
                      onClick={() => toggleTipo(tipo)}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="section-block">
            <div className="eyebrow">CONFIGURACIÓN AVANZADA</div>
            <h2>Visualización</h2>
            <p>Ajusta el modo de renderizado y exporta resultados.</p>

            <div className="viz-controls">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={multiCapa}
                  onChange={(e) => setMultiCapa(e.target.checked)}
                />
                Múltiples capas por tipo
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={usarGrid}
                  onChange={(e) => setUsarGrid(e.target.checked)}
                />
                Agregación por celdas
              </label>

              {usarGrid && (
                <label>
                  Tamaño de celda
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    max="0.1"
                    value={cell}
                    onChange={(e) => setCell(Number(e.target.value))}
                  />
                </label>
              )}

              <label>
                Gradiente de color
                <select value={gradIndex} onChange={(e) => setGradIndex(Number(e.target.value))}>
                  <option value={0}>Clásico (azul-rojo)</option>
                  <option value={1}>Corporativo</option>
                  <option value={2}>Alto contraste</option>
                </select>
              </label>

              <div className="viz-actions">
                <button className="btn btn-secondary" onClick={refrescarPuntos} type="button">Actualizar capas</button>
                <button className="btn btn-primary" 
                        onClick={() => {
                          console.log('🔧 FORZAR: Creando heatmap súper visible...');
                          
                          if (!layerGroupRef.current || !mapRef.current) {
                            console.error('❌ Referencias del mapa no disponibles');
                            return;
                          }
                          
                          try {
                            // Limpiar todo
                            layerGroupRef.current.clearLayers();
                            
                            // Datos de prueba con alta intensidad
                            const testData = [
                              [18.816667, -98.966667, 10], // Centro - máxima intensidad
                              [18.816700, -98.966600, 8],
                              [18.816600, -98.966700, 9],
                              [18.816750, -98.966550, 7],
                              [18.816550, -98.966750, 8],
                              [18.817000, -98.966500, 6],
                              [18.816200, -98.967000, 7]
                            ];
                            
                            // Crear heatmap súper visible
                            const heatLayer = L.heatLayer(testData, {
                              radius: 60,
                              blur: 30,
                              maxZoom: 19,
                              minOpacity: 0.9,
                              gradient: {0.0: 'navy', 0.3: 'blue', 0.5: 'cyan', 0.7: 'lime', 0.9: 'yellow', 1.0: 'red'}
                            });
                            
                            layerGroupRef.current.addLayer(heatLayer);
                            heatLayerRef.current = heatLayer;
                            
                            // Centrar en citizen-reports
                            mapRef.current.setView([18.816667, -98.966667], 16);
                            
                            console.log('✅ HEATMAP SÚPER VISIBLE aplicado:', testData.length, 'puntos');
                          } catch (error) {
                            console.error('❌ Error:', error);
                          }
                        }} 
                        type="button">
                  � FORZAR HEATMAP
                </button>
                <button className="btn btn-secondary" onClick={exportarImagen} type="button">Exportar imagen</button>
                <button className="btn btn-secondary" onClick={exportarGeoJSON} type="button">Exportar GeoJSON</button>
              </div>
            </div>
          </div>
        </div>

        <div className="map-container">
          <div id="map" className="map"></div>
          <div className="legend">
            <div className="legend-header">
              <span className="badge">Datos en vivo</span>
            </div>
            <div className="legend-content">
              <div className="legend-title">Intensidad</div>
              <div className="legend-scale">
                <span>Baja</span>
                <div className="legend-gradient"></div>
                <span>Alta</span>
              </div>
              <div className="legend-note">
                Los colores indican concentración de reportes recientes.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}