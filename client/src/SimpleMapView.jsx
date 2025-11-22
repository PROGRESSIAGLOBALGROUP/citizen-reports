import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Importar estilos CSS de Leaflet
import 'leaflet/dist/leaflet.css';

// Fix para los iconos de Leaflet en Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Polyfill para evitar errores de _leaflet_pos en React
if (typeof Element !== 'undefined' && !Element.prototype.getClientRects) {
  Element.prototype.getClientRects = function() {
    const rect = this.getBoundingClientRect ? this.getBoundingClientRect() : { top: 0, left: 0, width: 0, height: 0, right: 0, bottom: 0 };
    return { length: 1, 0: rect };
  };
}

// Coordenadas de Jantetelco, Morelos (coordenadas correctas)
const JANTETELCO_COORDS = [18.715, -98.7764];
const INITIAL_ZOOM = 15;

function SimpleMapView({ reportes = [], filtrosActivos = [], tiposInfo = {}, forceUpdate = 0, usuario = null, onVerReporte = null }) {
  console.log('🗺️ SimpleMapView MOUNTED:', { reportes: reportes.length, filtrosActivos: filtrosActivos.length });
  
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  // Función para limpiar marcadores existentes (versión robusta)
  const limpiarMarcadores = () => {
    console.log('🧹 Limpiando marcadores existentes:', markersRef.current.length);
    
    // Método 1: Remover marcadores individuales
    markersRef.current.forEach((marker, index) => {
      try {
        if (mapInstance.current && marker) {
          if (mapInstance.current.hasLayer(marker)) {
            mapInstance.current.removeLayer(marker);
            console.log(`🗑️ Marcador ${index + 1} removido`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Error removiendo marcador:', error);
      }
    });
    
    // Método 2: Limpiar array de referencia
    markersRef.current = [];
    
    // Método 3: Forzar limpieza adicional del mapa (backup)
    if (mapInstance.current) {
      mapInstance.current.eachLayer((layer) => {
        if (layer.options && layer.options.icon && layer.options.icon.options && 
            layer.options.icon.options.className === 'custom-div-icon') {
          mapInstance.current.removeLayer(layer);
          console.log('🔧 Marcador adicional removido via backup cleanup');
        }
      });
    }
    
    console.log('✅ Limpieza completa finalizada');
  };

  // Función para agregar marcadores filtrados con manejo de coordenadas duplicadas
  const agregarMarcadores = () => {
    console.log('🗺️ Agregando marcadores:', reportes.length, 'reportes totales');
    console.log('🔍 Filtros activos:', filtrosActivos);
    
    // Validaciones de seguridad
    if (!mapInstance.current) {
      console.error('❌ No hay instancia de mapa disponible');
      return;
    }

    if (!reportes || !Array.isArray(reportes) || reportes.length === 0) {
      console.log('ℹ️ No hay reportes para procesar');
      return;
    }

    if (!tiposInfo || typeof tiposInfo !== 'object') {
      console.error('❌ tiposInfo no es válido');
      return;
    }
    
    // Los reportes ya vienen filtrados desde SimpleApp.jsx (tipo + prioridad)
    const reportesFiltrados = reportes;
    
    console.log('✅ Reportes filtrados a mostrar:', reportesFiltrados.length);
    
    // Agrupar reportes por coordenadas para detectar duplicados
    const coordenadasMap = new Map();
    reportesFiltrados.forEach(reporte => {
      const coordKey = `${reporte.lat},${reporte.lng}`;
      if (!coordenadasMap.has(coordKey)) {
        coordenadasMap.set(coordKey, []);
      }
      coordenadasMap.get(coordKey).push(reporte);
    });
    
    console.log('📍 Análisis de coordenadas duplicadas:');
    let totalCoordenadasUnicas = 0;
    let totalCoordenadasDuplicadas = 0;
    coordenadasMap.forEach((reportesEnCoordenada, coordKey) => {
      if (reportesEnCoordenada.length > 1) {
        console.log(`   🔄 Coordenada ${coordKey}: ${reportesEnCoordenada.length} reportes (IDs: ${reportesEnCoordenada.map(r => r.id).join(', ')})`);
        totalCoordenadasDuplicadas++;
      } else {
        totalCoordenadasUnicas++;
      }
    });
    console.log(`   📊 Total coordenadas únicas: ${totalCoordenadasUnicas}`);
    console.log(`   📊 Total coordenadas con duplicados: ${totalCoordenadasDuplicadas}`);

    let marcadoresCreados = 0;
    let marcadoresErrores = 0;

    // Procesar cada grupo de coordenadas
    coordenadasMap.forEach((reportesEnCoordenada, coordKey) => {
      reportesEnCoordenada.forEach((reporte, index) => {
        try {
          // Validar coordenadas antes de crear el marcador
          if (isNaN(reporte.lat) || isNaN(reporte.lng)) {
            console.error(`❌ Marcador - Coordenadas inválidas:`, reporte.lat, reporte.lng, 'para reporte ID:', reporte.id);
            marcadoresErrores++;
            return;
          }

          if (reporte.lat < -90 || reporte.lat > 90 || reporte.lng < -180 || reporte.lng > 180) {
            console.error(`❌ Marcador - Coordenadas fuera de rango:`, reporte.lat, reporte.lng, 'para reporte ID:', reporte.id);
            marcadoresErrores++;
            return;
          }

          const tipoInfo = tiposInfo[reporte.tipo] || { 
            nombre: reporte.tipo, 
            icono: '📍', 
            color: '#64748b' 
          };
          
          // Aplicar micro-desplazamiento para reportes duplicados
          let latFinal = reporte.lat;
          let lngFinal = reporte.lng;
          
          if (reportesEnCoordenada.length > 1) {
            // Calcular desplazamiento circular para múltiples reportes en la misma coordenada
            const radius = 0.0002; // ~20 metros de radio
            const angle = (index * 2 * Math.PI) / reportesEnCoordenada.length;
            latFinal = reporte.lat + (radius * Math.cos(angle));
            lngFinal = reporte.lng + (radius * Math.sin(angle));
            
            console.log(`🔄 Aplicando micro-desplazamiento a reporte ID ${reporte.id}: (${reporte.lat}, ${reporte.lng}) → (${latFinal.toFixed(6)}, ${lngFinal.toFixed(6)})`);
          }
          
          console.log(`📍 Creando marcador para reporte ID ${reporte.id}:`, reporte.tipo, 'en', [latFinal.toFixed(6), lngFinal.toFixed(6)]);
          
          // Determinar prioridad basada en peso
          const prioridad = reporte.peso >= 4 ? 'alta' : reporte.peso >= 2 ? 'media' : 'baja';
          const tamano = prioridad === 'alta' ? 35 : prioridad === 'media' ? 28 : 22;
          const borderWidth = prioridad === 'alta' ? 4 : 3;
          
          // Crear icono personalizado
          const customIcon = L.divIcon({
            html: `
              <div style="
                background-color: ${tipoInfo.color};
                width: ${tamano}px;
                height: ${tamano}px;
                border-radius: 50%;
                border: ${borderWidth}px solid white;
                box-shadow: 0 3px 12px rgba(0,0,0,0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: ${tamano > 30 ? '16px' : '14px'};
                transform: translate(-50%, -50%);
                transition: all 0.2s ease;
              ">
                ${tipoInfo.icono}
              </div>
            `,
            className: 'custom-div-icon',
            iconSize: [tamano, tamano],
            iconAnchor: [tamano/2, tamano/2]
          });

          // Usar descripción corta de la base de datos o fallback a descripción truncada
          const descripcionCorta = reporte.descripcion_corta || 
            (reporte.descripcion.length > 50 
              ? reporte.descripcion.substring(0, 50).trim() + '...'
              : reporte.descripcion);

          // MAPA PÚBLICO: Todos los usuarios pueden ver todos los reportes (sin restricción de dependencia)
          // La restricción de dependencia solo aplica en PanelFuncionario, no en el mapa
          const puedeVerReporte = true; // Siempre permitir ver reportes desde el mapa público

          // Crear marcador con coordenadas ajustadas
          const marker = L.marker([latFinal, lngFinal], { icon: customIcon })
            .bindPopup(`
              <div style="font-family: Inter, sans-serif; min-width: 280px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                  <span style="font-size: 20px;">${tipoInfo.icono}</span>
                  <div>
                    <h4 style="margin: 0; color: #1e293b; font-size: 16px; font-weight: 600;">
                      ${tipoInfo.nombre}
                    </h4>
                    <span style="
                      font-size: 11px; 
                      padding: 2px 8px; 
                      border-radius: 12px; 
                      background: ${prioridad === 'alta' ? '#fee2e2' : prioridad === 'media' ? '#fef3c7' : '#f0fdf4'};
                      color: ${prioridad === 'alta' ? '#dc2626' : prioridad === 'media' ? '#d97706' : '#16a34a'};
                      font-weight: 600;
                      text-transform: uppercase;
                    ">
                      ${prioridad}
                    </span>
                  </div>
                </div>
                <div style="margin-bottom: 8px; color: #374151; font-size: 14px; line-height: 1.4;">
                  ${descripcionCorta}
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #6b7280;">
                  <span>Peso: ${reporte.peso} | ID: ${reporte.id}</span>
                  <span>${new Date(reporte.creado_en).toLocaleDateString('es-MX')}</span>
                </div>
                ${reportesEnCoordenada.length > 1 ? `
                  <div style="margin-top: 8px; padding: 4px 8px; background: #f3f4f6; border-radius: 4px; font-size: 11px; color: #6b7280;">
                    📍 ${reportesEnCoordenada.length} reportes en esta ubicación
                  </div>
                ` : ''}
                ${(reporte.colonia || reporte.codigo_postal || reporte.municipio || reporte.estado_ubicacion) ? `
                  <div style="margin-top: 8px; padding: 8px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; font-size: 11px;">
                    <div style="font-weight: 600; color: #16a34a; margin-bottom: 6px;">✅ Información de Ubicación</div>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px;">
                      <div><span style="font-weight: 600; color: #6b7280;">Colonia:</span> ${reporte.colonia || '—'}</div>
                      <div><span style="font-weight: 600; color: #6b7280;">CP:</span> ${reporte.codigo_postal || '—'}</div>
                      <div><span style="font-weight: 600; color: #6b7280;">Municipio:</span> ${reporte.municipio || '—'}</div>
                      <div><span style="font-weight: 600; color: #6b7280;">Estado:</span> ${reporte.estado_ubicacion || '—'}</div>
                    </div>
                  </div>
                ` : ''}
                <button 
                  onclick="window.location.hash='#reporte/${reporte.id}'"
                  style="
                    width: 100%;
                    margin-top: 12px;
                    padding: 10px;
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
                  "
                  onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(59, 130, 246, 0.4)';"
                  onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(59, 130, 246, 0.3)';"
                >
                  👁️ Ver Reporte Completo
                </button>
              </div>
            `);
          
          if (mapInstance.current) {
            marker.addTo(mapInstance.current);
            markersRef.current.push(marker);
            marcadoresCreados++;
            console.log(`✅ Marcador agregado exitosamente para reporte ID:`, reporte.id);
          } else {
            console.error(`❌ No se pudo agregar marcador - mapInstance.current es null para reporte ID:`, reporte.id);
            marcadoresErrores++;
          }
        } catch (error) {
          console.error(`❌ Error creando marcador para reporte ID:`, reporte.id, error);
          marcadoresErrores++;
        }
      });
    });

    console.log(`🏁 Resumen de creación de marcadores:`);
    console.log(`   ✅ Marcadores creados exitosamente: ${marcadoresCreados}`);
    console.log(`   ❌ Marcadores con errores: ${marcadoresErrores}`);
    console.log(`   📊 Total reportes procesados: ${reportesFiltrados.length}`);
    console.log(`   🎯 Marcadores almacenados en referencia: ${markersRef.current.length}`);
    console.log(`   📍 Total coordenadas únicas procesadas: ${coordenadasMap.size}`);
  };

  // Inicializar mapa
  useEffect(() => {
    // Validar que el contenedor existe y está listo
    if (!mapRef.current) {
      console.warn('⚠️ mapRef.current no disponible aún');
      return;
    }
    
    // No reinicializar si ya existe
    if (mapInstance.current) {
      console.log('ℹ️ Mapa ya inicializado, saltando');
      return;
    }

    console.log('🗺️ Inicializando mapa de Jantetelco');

    try {
      // Validar que el contenedor tiene dimensiones
      if (mapRef.current.offsetHeight === 0 || mapRef.current.offsetWidth === 0) {
        console.warn('⚠️ Contenedor del mapa sin dimensiones, reintentando en 100ms');
        const retryTimeout = setTimeout(() => {
          if (mapRef.current && !mapInstance.current) {
            console.log('🔄 Reintentando inicialización del mapa');
            mapInstance.current = L.map(mapRef.current).setView(JANTETELCO_COORDS, INITIAL_ZOOM);
          }
        }, 100);
        return () => clearTimeout(retryTimeout);
      }

      // Crear el mapa centrado en Jantetelco
      mapInstance.current = L.map(mapRef.current).setView(JANTETELCO_COORDS, INITIAL_ZOOM);
      console.log('✅ Mapa de Leaflet creado exitosamente');

      // Agregar tiles de OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapInstance.current);

      // Marcador del centro de Jantetelco (prominente con función de centrado)
      const centroIcon = L.divIcon({
        html: `
          <div style="
            background: linear-gradient(135deg, #6b7280, #4b5563);
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: 4px solid white;
            box-shadow: 0 6px 20px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            transform: translate(-50%, -50%);
            z-index: 1;
            position: relative;
            opacity: 0.9;
            cursor: pointer;
            transition: all 0.3s ease;
          ">
            🏛️
          </div>
        `,
        className: 'centro-marker',
        iconSize: [50, 50],
        iconAnchor: [25, 25]
      });

      const centroMarker = L.marker(JANTETELCO_COORDS, { 
        icon: centroIcon,
        zIndexOffset: -1000  // Forzar que esté debajo de los reportes
      })
        .bindPopup(`
          <div style="font-family: system-ui, -apple-system, sans-serif; text-align: center;">
            <div style="font-weight: 700; font-size: 16px; color: #1e293b; margin-bottom: 4px;">
              🏛️ Centro de Jantetelco
            </div>
            <div style="color: #64748b; font-size: 14px; margin-bottom: 12px;">
              Morelos, México
            </div>
            <button style="
              background: #3b82f6;
              color: white;
              border: none;
              border-radius: 6px;
              padding: 8px 16px;
              font-size: 12px;
              font-weight: 600;
              cursor: pointer;
              transition: background 0.2s ease;
            " onclick="this.closest('.leaflet-popup').parentElement.click()">
              📍 Centrar mapa aquí
            </button>
          </div>
        `)
        .on('click', () => {
          // Centrar el mapa en las coordenadas de Jantetelco con animación suave
          if (mapInstance.current) {
            mapInstance.current.setView(JANTETELCO_COORDS, INITIAL_ZOOM, {
              animate: true,
              duration: 1.0
            });
          }
        })
        .addTo(mapInstance.current);

      console.log('✅ Mapa inicializado exitosamente');
    } catch (error) {
      console.error('❌ Error inicializando mapa:', error);
      mapInstance.current = null;
    }

    // Cleanup al desmontar
    return () => {
      if (mapInstance.current) {
        try {
          mapInstance.current.remove();
          mapInstance.current = null;
          console.log('🧹 Mapa desmontado correctamente');
        } catch (error) {
          console.error('⚠️ Error desmontando mapa:', error);
        }
      }
    };
  }, []);

  // Efecto para actualizar marcadores cuando cambien los filtros, reportes o prioridades
  useEffect(() => {
    const timestamp = new Date().toISOString();
    
    // Validaciones previas
    if (!mapInstance.current) {
      console.warn(`⚠️ [${timestamp}] mapInstance.current no disponible aún`);
      return;
    }

    if (!reportes || !Array.isArray(reportes)) {
      console.error(`❌ [${timestamp}] reportes no es un array válido:`, reportes);
      return;
    }

    if (!tiposInfo || typeof tiposInfo !== 'object') {
      console.warn(`⚠️ [${timestamp}] tiposInfo no es un objeto válido:`, tiposInfo);
      return;
    }

    console.log(`🔄 [${timestamp}] useEffect disparado - Verificando condiciones:`, {
      tieneMapaInstancia: !!mapInstance.current,
      tieneReportes: reportes.length > 0,
      cantidadFiltros: filtrosActivos.length,
      filtrosActivos: filtrosActivos,
      reportesTotal: reportes.length
    });
    
    // Usar setTimeout para asegurar que el efecto se ejecute después del render
    const updateTimeout = setTimeout(() => {
      try {
        if (!mapInstance.current) {
          console.warn(`⚠️ [${timestamp}] mapInstance desapareció durante la actualización`);
          return;
        }

        if (reportes.length > 0) {
          console.log(`✅ [${timestamp}] Condiciones cumplidas - Iniciando actualización de marcadores`);
          console.log(`🎯 [${timestamp}] Filtros a aplicar:`, filtrosActivos);
          
          limpiarMarcadores();
          
          // Pequeña pausa para asegurar limpieza completa
          setTimeout(() => {
            try {
              if (mapInstance.current) {
                agregarMarcadores();
                console.log(`🏁 [${timestamp}] Actualización de marcadores completada`);
              }
            } catch (error) {
              console.error(`❌ [${timestamp}] Error al agregar marcadores:`, error);
            }
          }, 50);
        } else {
          console.log(`🧹 [${timestamp}] Sin reportes filtrados - Limpiando todos los marcadores`);
          limpiarMarcadores();
        }
      } catch (error) {
        console.error(`❌ [${timestamp}] Error en updateTimeout:`, error);
      }
    }, 10);
    
    return () => {
      clearTimeout(updateTimeout);
    };
  }, [reportes, filtrosActivos, tiposInfo, forceUpdate]);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      {console.log('🎨 SimpleMapView RENDERING - Container div created')}
      <div 
        ref={mapRef} 
        style={{ 
          height: '100%', 
          width: '100%' 
        }} 
      />
    </div>
  );
}

export default SimpleMapView;