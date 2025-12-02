import React, { useState, useEffect, useRef } from 'react';
import { crearReporte, tiposReporte } from './api.js';
import { recopilarDatosIdentificacion } from './fingerprint.js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './gobierno-premium-panel.css';
import { announceToScreenReader } from './useAccessibility.js';

// Coordenadas del centro de citizen-reports
const CITIZEN_REPORTS_CENTER = {
  lat: 18.715,
  lng: -98.776389
};

function ReportForm() {
  const [formData, setFormData] = useState({
    tipo: '',
    descripcion: '',
    descripcionCorta: '',
    lat: '',
    lng: '',
    peso: 3,
    // Campos de ubicación geográfica obtenidos por reverse geocoding (Nominatim)
    colonia: '',
    codigo_postal: '',
    municipio: '',
    estado_ubicacion: '',
    pais: 'México'
  });
  
  const [tipos, setTipos] = useState([]);
  const [tiposInfo, setTiposInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingGeocoding, setLoadingGeocoding] = useState(false);
  const [geocodingMessage, setGeocodingMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [ubicacionActual, setUbicacionActual] = useState(null);
  const [municipioConfigurado, setMunicipioConfigurado] = useState('');
  const [datosUbicacionCompletos, setDatosUbicacionCompletos] = useState(false);
  
  // Referencias para el mapa interactivo
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const selectedMarker = useRef(null);

  // Cargar municipio configurado desde WhiteLabel
  useEffect(() => {
    const cargarMunicipioConfig = async () => {
      try {
        const response = await fetch('/api/whitelabel/config');
        if (response.ok) {
          const config = await response.json();
          if (config.municipioNombre || config.nombre_municipio) {
            setMunicipioConfigurado(config.municipioNombre || config.nombre_municipio);
            console.log('✅ Municipio configurado:', config.municipioNombre || config.nombre_municipio);
          }
        }
      } catch (error) {
        console.error('Error cargando configuración WhiteLabel:', error);
      }
    };
    cargarMunicipioConfig();
  }, []);

  // Cargar tipos de reportes disponibles (ADR-0009: dinámicos desde DB)
  useEffect(() => {
    const cargarTipos = async () => {
      try {
        const tiposData = await tiposReporte();
        // ADR-0009: Confiar en la API, sin filtrado ni fallback hardcodeado
        console.log('✅ Tipos cargados desde DB:', tiposData.length);
        setTipos(tiposData);
        
        // Construir tiposInfo dinámicamente desde la API
        const infoMap = {};
        tiposData.forEach(t => {
          infoMap[t.tipo] = {
            nombre: t.nombre,
            icono: t.icono,
            color: t.color || '#6b7280'
          };
        });
        setTiposInfo(infoMap);
      } catch (error) {
        console.error('❌ Error cargando tipos:', error);
        // En caso de error, mantener array vacío (evitar hardcoding)
        setTipos([]);
        setTiposInfo({});
      }
    };
    
    cargarTipos();
  }, []);

  // Función auxiliar para actualizar marcador en el mapa
  const actualizarMarcadorMapa = (lat, lng, tipoOverride = null) => {
    if (!mapInstance.current) return;

    // Remover marcador anterior si existe
    if (selectedMarker.current) {
      mapInstance.current.removeLayer(selectedMarker.current);
    }

    // Obtener información del tipo seleccionado (usar override si se proporciona)
    const tipoActual = tipoOverride || formData.tipo;
    const tipoInfo = tiposInfo[tipoActual];
    const icono = tipoInfo ? tipoInfo.icono : '📍';
    const color = tipoInfo ? tipoInfo.color : '#ef4444';
    const nombreTipo = tipoInfo ? tipoInfo.nombre : 'Ubicación';

    // Crear nuevo marcador de selección con icono del tipo
    const selectedIcon = L.divIcon({
      html: `
        <div style="
          background: ${color};
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 3px 10px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          transform: translate(-50%, -50%);
          cursor: pointer;
        ">
          ${icono}
        </div>
      `,
      className: 'selected-marker',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    selectedMarker.current = L.marker([lat, lng], { icon: selectedIcon })
      .bindPopup(`
        <div style="font-family: system-ui, -apple-system, sans-serif; text-align: center;">
          <div style="font-weight: 600; font-size: 14px; color: #1e293b; margin-bottom: 4px;">
            ${icono} ${nombreTipo}
          </div>
          <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">
            ${lat.toFixed(6)}, ${lng.toFixed(6)}
          </div>
          ${formData.descripcionCorta ? `<div style="color: #374151; font-size: 12px; font-style: italic;">\"${formData.descripcionCorta}\"</div>` : ''}
        </div>
      `)
      .addTo(mapInstance.current);

    // Centrar el mapa en la ubicación seleccionada
    mapInstance.current.setView([lat, lng], 16);
  };

  // Inicializar mapa interactivo
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    console.log('🗺️ Inicializando mapa interactivo para formulario');

    // Fix para iconos de Leaflet en Vite
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    // Crear el mapa centrado en citizen-reports
    mapInstance.current = L.map(mapRef.current).setView([CITIZEN_REPORTS_CENTER.lat, CITIZEN_REPORTS_CENTER.lng], 15);

    // Agregar tiles de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(mapInstance.current);

    // Marcador fijo del centro de citizen-reports
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

    L.marker([CITIZEN_REPORTS_CENTER.lat, CITIZEN_REPORTS_CENTER.lng], { icon: centroIcon })
      .bindPopup(`
        <div style="font-family: system-ui, -apple-system, sans-serif; text-align: center;">
          <div style="font-weight: 700; font-size: 16px; color: #1e293b; margin-bottom: 4px;">
            🏛️ Centro de citizen-reports
          </div>
          <div style="color: #64748b; font-size: 12px;">
            Morelos, México
          </div>
        </div>
      `)
      .addTo(mapInstance.current);

    // Colocar marcador por defecto en el centro de citizen-reports
    const defaultLat = CITIZEN_REPORTS_CENTER.lat;
    const defaultLng = CITIZEN_REPORTS_CENTER.lng;
    
    // Actualizar campos de coordenadas con el centro por defecto
    setFormData(prev => ({ 
      ...prev, 
      lat: defaultLat.toFixed(6), 
      lng: defaultLng.toFixed(6) 
    }));

    // Crear marcador de selección por defecto usando la función auxiliar
    actualizarMarcadorMapa(defaultLat, defaultLng);

    // Evento de clic en el mapa para seleccionar nueva ubicación
    mapInstance.current.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      console.log('📍 Click en mapa:', lat, lng);
      
      // Actualizar campos de coordenadas primero (SIN crear marcador todavía)
      setFormData(prev => ({
        ...prev, 
        lat: lat.toFixed(6), 
        lng: lng.toFixed(6) 
      }));

      // ========================================================================
      // REVERSE GEOCODING EN TIEMPO REAL
      // Obtener información de ubicación (colonia, código postal, municipio, etc.)
      // desde Nominatim (OpenStreetMap) - SIN COSTO, respeta privacidad
      // ========================================================================
      try {
        setLoadingGeocoding(true);
        setGeocodingMessage('Obteniendo información geográfica...');
        
        const response = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
        
        if (response.ok) {
          const geoData = await response.json();
          
          if (geoData.success && geoData.data) {
            const { colonia, codigo_postal, municipio, estado_ubicacion, pais } = geoData.data;
            
            console.log('✅ Datos de geocoding obtenidos:', {
              colonia,
              codigo_postal,
              municipio,
              estado_ubicacion,
              pais
            });
            
            // SIEMPRE actualizar formData con los datos disponibles (aunque sean null)
            // Esto asegura que los campos se muestren en el formulario
            const datosUbicacion = {
              colonia: colonia,
              codigo_postal: codigo_postal,
              municipio: municipio,
              estado_ubicacion: estado_ubicacion,
              pais: pais || 'México'
            };
            
            console.log('📝 Actualizando formData con:', datosUbicacion);
            
            // Actualizar formData y crear marcador
            setFormData(prev => {
              const nuevoEstado = {
                ...prev,
                ...datosUbicacion
              };
              
              // Crear marcador SIEMPRE (independiente de validación)
              setTimeout(() => {
                actualizarMarcadorMapa(lat, lng, nuevoEstado.tipo);
              }, 0);
              
              return nuevoEstado;
            });
            
            // VALIDACIÓN: Verificar municipio Y código postal para habilitar envío
            // Normalizar valores: null/undefined -> cadena vacía para validación
            const municipioNorm = (municipio || '').trim();
            const codigoPostalNorm = (codigo_postal || '').trim();
            
            // if (!municipioNorm || !codigoPostalNorm) { // CORRECCIÓN: Se elimina validación de código postal puesto que no todos los puntos la tienen (WDR - 19-NOV-2025)
            if (!municipioNorm) {
              // NO resetear formData, solo marcar como incompleto
              setDatosUbicacionCompletos(false);
              setLoadingGeocoding(false);
              
              let errorMsg = 'No se pudo obtener la información, por favor seleccione otra ubicación';
              setGeocodingMessage(errorMsg);
              
              setTimeout(() => {
                setGeocodingMessage('');
              }, 2000);
              
              setMessage({ 
                type: 'error', 
                text: errorMsg
              });
              return;
            }
            
            // Validación pasada: marcar como completo
            setDatosUbicacionCompletos(true);
            setLoadingGeocoding(false);
            setGeocodingMessage('');
            
            // Mostrar mensaje de éxito con información obtenida
            const infoText = [
              datosUbicacion.colonia && `Colonia: ${datosUbicacion.colonia}`,
              datosUbicacion.codigo_postal && `CP: ${datosUbicacion.codigo_postal}`,
              datosUbicacion.municipio && `Municipio: ${datosUbicacion.municipio}`
            ].filter(Boolean).join(' | ');
            
            setMessage({ 
              type: 'success', 
              text: infoText || `Ubicación seleccionada: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
            });
          } else {
            console.warn('⚠️ Reverse geocoding sin datos:', geoData);
            setDatosUbicacionCompletos(false);
            setLoadingGeocoding(false);
            setGeocodingMessage('No se pudo obtener la información, por favor seleccione otra ubicación');
            
            setTimeout(() => {
              setGeocodingMessage('');
            }, 2000);
            
            setMessage({ 
              type: 'error', 
              text: 'No se pudo obtener la información, por favor seleccione otra ubicación'
            });
          }
        } else {
          console.warn('⚠️ Error en reverse geocoding:', response.status);
          setDatosUbicacionCompletos(false);
          setLoadingGeocoding(false);
          setGeocodingMessage('No se pudo obtener la información, por favor seleccione otra ubicación');
          
          setTimeout(() => {
            setGeocodingMessage('');
          }, 2000);
          
          setMessage({ 
            type: 'error', 
            text: 'No se pudo obtener la información, por favor seleccione otra ubicación'
          });
        }
      } catch (error) {
        console.error('❌ Error en reverse geocoding:', error);
        setDatosUbicacionCompletos(false);
        setLoadingGeocoding(false);
        setGeocodingMessage('No se pudo obtener la información, por favor seleccione otra ubicación');
        
        setTimeout(() => {
          setGeocodingMessage('');
        }, 2000);
        
        setMessage({ 
          type: 'error', 
          text: 'No se pudo obtener la información, por favor seleccione otra ubicación'
        });
      }
    });

    // Cleanup al desmontar
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Actualizar marcador cuando cambie el tipo de reporte
  useEffect(() => {
    if (formData.lat && formData.lng && selectedMarker.current) {
      const lat = parseFloat(formData.lat);
      const lng = parseFloat(formData.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        actualizarMarcadorMapa(lat, lng);
      }
    }
  }, [formData.tipo, formData.descripcionCorta]);



  // Obtener ubicación actual del usuario
  const obtenerUbicacionActual = () => {
    if (!navigator.geolocation) {
      setMessage({ type: 'error', text: 'Tu navegador no soporta geolocalización' });
      return;
    }

    setMessage({ type: 'info', text: 'Obteniendo tu ubicación...' });
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // Verificar que esté dentro del área de citizen-reports (aproximadamente)
        const dentroDeLimites = (
          lat >= 18.700 && lat <= 18.730 &&
          lng >= -98.790 && lng <= -98.760
        );
        
        if (dentroDeLimites) {
          setFormData(prev => ({ ...prev, lat: lat.toFixed(6), lng: lng.toFixed(6) }));
          setUbicacionActual({ lat, lng });
          actualizarMarcadorMapa(lat, lng);
          setMessage({ type: 'success', text: 'Ubicación obtenida exitosamente y mostrada en el mapa' });
        } else {
          setFormData(prev => ({ ...prev, lat: lat.toFixed(6), lng: lng.toFixed(6) }));
          actualizarMarcadorMapa(lat, lng);
          setMessage({ type: 'warning', text: 'Tu ubicación parece estar fuera de citizen-reports. Verifica las coordenadas.' });
        }
      },
      (error) => {
        console.error('Error de geolocalización:', error);
        setMessage({ type: 'error', text: 'No se pudo obtener tu ubicación. Ingresa las coordenadas manualmente.' });
      }
    );
  };

  // Usar ubicación del centro de citizen-reports como sugerencia
  const usarCentroCitizenReports = () => {
    const { lat, lng } = CITIZEN_REPORTS_CENTER;
    setFormData(prev => ({ 
      ...prev, 
      lat: lat.toString(), 
      lng: lng.toString() 
    }));
    actualizarMarcadorMapa(lat, lng);
    setMessage({ type: 'info', text: 'Coordenadas del centro de citizen-reports establecidas y mostradas en el mapa' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar mensajes cuando el usuario empiece a escribir
    if (message.type === 'error') {
      setMessage({ type: '', text: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.tipo) {
      const errorMsg = 'Por favor selecciona un tipo de reporte';
      setMessage({ type: 'error', text: errorMsg });
      announceToScreenReader(errorMsg, 'assertive');
      return;
    }
    
    if (!formData.descripcionCorta.trim()) {
      const errorMsg = 'Por favor proporciona una descripción corta';
      setMessage({ type: 'error', text: errorMsg });
      announceToScreenReader(errorMsg, 'assertive');
      return;
    }
    
    if (!formData.descripcion.trim()) {
      const errorMsg = 'Por favor describe detalladamente el problema';
      setMessage({ type: 'error', text: errorMsg });
      announceToScreenReader(errorMsg, 'assertive');
      return;
    }
    
    if (!formData.lat || !formData.lng) {
      const errorMsg = 'Por favor proporciona las coordenadas de ubicación';
      setMessage({ type: 'error', text: errorMsg });
      announceToScreenReader(errorMsg, 'assertive');
      return;
    }

    const lat = parseFloat(formData.lat);
    const lng = parseFloat(formData.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
      setMessage({ type: 'error', text: 'Las coordenadas deben ser números válidos' });
      return;
    }

    // VALIDACIÓN 3: Verificar que el municipio del punto coincida con el municipio configurado
    if (municipioConfigurado && formData.municipio) {
      const municipioNormalizado = formData.municipio.trim().toLowerCase();
      const municipioConfigNormalizado = municipioConfigurado.trim().toLowerCase();
      
      if (municipioNormalizado !== municipioConfigNormalizado) {
        setErrorModalMessage(`Solo puede reportar dentro de ${municipioConfigurado}, por favor seleccione otro punto en el mapa`);
        setShowErrorModal(true);
        return;
      }
    }

    setLoading(true);
    
    try {
      // Recopilar datos de identificación automáticamente
      const datosIdentificacion = recopilarDatosIdentificacion();
      
      const reporteData = {
        tipo: formData.tipo,
        descripcion: formData.descripcion.trim(),
        descripcion_corta: formData.descripcionCorta.trim(), // CORRECCIÓN: snake_case para backend
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        peso: parseInt(formData.peso),
        // Información de ubicación obtenida por reverse geocoding (Nominatim)
        colonia: formData.colonia || '',
        codigo_postal: formData.codigo_postal || '',
        municipio: formData.municipio || '',
        estado_ubicacion: formData.estado_ubicacion || '',
        pais: formData.pais || 'México',
        // Agregar datos de identificación sin molestar al usuario
        fingerprint: datosIdentificacion.fingerprint,
        sesionId: datosIdentificacion.sesionId,
        userAgent: datosIdentificacion.userAgent
      };

      console.log('📝 Enviando reporte con ubicación:', {
        ...reporteData,
        colonia: reporteData.colonia || 'N/A',
        codigo_postal: reporteData.codigo_postal || 'N/A',
        municipio: reporteData.municipio || 'N/A',
        fingerprint: reporteData.fingerprint.substring(0, 8) + '...', // Log parcial por privacidad
        userAgent: reporteData.userAgent.substring(0, 50) + '...'
      });
      
      const resultado = await crearReporte(reporteData);
      
      console.log('✅ Reporte creado:', resultado);
      
      // Mensaje de éxito simple
      const mensajeExito = `¡Reporte enviado exitosamente! ID: ${resultado.id || 'N/A'}`;
      
      setMessage({ 
        type: 'success',
        text: mensajeExito
      });
      
      // Anunciar éxito al screen reader
      announceToScreenReader(mensajeExito, 'polite');

      // Limpiar formulario
      setFormData({
        tipo: '',
        descripcion: '',
        descripcionCorta: '',
        lat: '',
        lng: '',
        peso: 3,
        colonia: '',
        codigo_postal: '',
        municipio: '',
        estado_ubicacion: '',
        pais: 'México'
      });
      
      setUbicacionActual(null);

    } catch (error) {
      console.error('❌ Error enviando reporte:', error);
      setMessage({ 
        type: 'error', 
        text: `Error al enviar el reporte: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const tipoSeleccionado = tiposInfo[formData.tipo];

  return (
    <div className="gobierno-premium gp-report-form-container" role="region" aria-label="Formulario de nuevo reporte">
      <div className="gp-report-form-card">
        {/* Header - Clase Mundial Design */}
        <header className="gp-report-header">
          <div className="gp-report-header-content">
            <div className="gp-report-header-line" aria-hidden="true" />
            <h1 className="gp-report-header-title" id="form-title">Reportar un Problema</h1>
            <p className="gp-report-header-subtitle">
              Tu reporte es importante. Comparte la ubicación exacta y una descripción clara para que podamos actuar rápidamente.
            </p>
            <div className="gp-report-status-badge" aria-live="polite">
              <span className="gp-report-status-dot" aria-hidden="true" />
              Sistema activo
            </div>
            <div className="gp-report-header-line gp-mt-28 gp-mb-0" aria-hidden="true" />
          </div>
        </header>

        {/* Form */}
        <form 
          onSubmit={handleSubmit} 
          className="gp-report-form-body"
          aria-labelledby="form-title"
          noValidate
        >
          
          {/* Ubicación - MOVIDO AL INICIO */}
          <fieldset className="gp-location-section">
            <legend className="gp-form-label" data-required>Ubicación</legend>

            {/* Botones de Ubicación - ARRIBA DEL MAPA */}
            <div className="gp-location-buttons" role="group" aria-label="Opciones de ubicación">
              <button
                type="button"
                onClick={obtenerUbicacionActual}
                className="gp-btn-location gp-btn-location-gps"
                aria-label="Usar mi ubicación actual mediante GPS"
              >
                <span aria-hidden="true">📍</span> Mi Ubicación
              </button>
              
              <button
                type="button"
                onClick={usarCentroCitizenReports}
                className="gp-btn-location gp-btn-location-center"
                aria-label="Usar el centro del municipio como ubicación"
              >
                <span aria-hidden="true">🏛️</span> Centro
              </button>
            </div>

            {/* Mapa Interactivo - DEBAJO DE LOS BOTONES */}
            <div className="gp-map-section">
              <label className="gp-map-label" id="map-label">
                <span aria-hidden="true">🗺️</span> Ubicación Interactiva
              </label>
              <p className="gp-map-hint" id="map-hint">
                Haz clic en cualquier punto del mapa para seleccionar la ubicación exacta del reporte.
                Las coordenadas se actualizarán automáticamente.
              </p>
              <div 
                ref={mapRef} 
                className="gp-map-container" 
                role="application"
                aria-label="Mapa interactivo para seleccionar ubicación"
                aria-describedby="map-hint"
                tabIndex="0"
              />
              <div className="gp-map-tip" role="note">
                <span className="gp-map-tip-icon" aria-hidden="true">💡</span>
                <span className="gp-map-tip-text">
                  El marcador 🏛️ muestra el centro de citizen-reports. El marcador 📍 rojo aparecerá donde hagas clic.
                </span>
              </div>
            </div>

            {/* Lat/Lng Hidden - SIGUE SIENDO INVISIBLE */}
            <div className="gp-hidden-fields" aria-hidden="true">
              <div>
                <label htmlFor="report-lat" className="gp-coord-label">
                  Latitud *
                </label>
                <input
                  id="report-lat"
                  type="number"
                  name="lat"
                  value={formData.lat}
                  onChange={handleInputChange}
                  placeholder="18.715"
                  step="0.000001"
                  className="gp-coord-input"
                  aria-required="true"
                  tabIndex="-1"
                />
              </div>
              
              <div>
                <label htmlFor="report-lng" className="gp-coord-label">
                  Longitud *
                </label>
                <input
                  id="report-lng"
                  type="number"
                  name="lng"
                  value={formData.lng}
                  onChange={handleInputChange}
                  placeholder="-98.7764"
                  step="0.000001"
                  className="gp-coord-input"
                  aria-required="true"
                  tabIndex="-1"
                />
              </div>
            </div>
          </fieldset>

          {/* ================================================================ */}
          {/* INFORMACIÓN DE UBICACIÓN OBTENIDA POR REVERSE GEOCODING */}
          {/* Siempre mostrar los campos: Colonia, Código Postal, Municipio, Estado */}
          {/* ================================================================ */}
          <div className="gp-form-group">
            <div className="gp-location-info">
              <label className="gp-location-info-title">
                ✅ Información de Ubicación
              </label>
              
              <div className="gp-location-info-grid">
                {/* Campo: Colonia */}
                <div className="gp-location-info-item">
                  <label>Colonia</label>
                  <div className="gp-location-info-value">
                    {formData.colonia || '—'}
                  </div>
                </div>

                {/* Campo: Código Postal */}
                <div className="gp-location-info-item">
                  <label>Código Postal</label>
                  <div className="gp-location-info-value">
                    {formData.codigo_postal || '—'}
                  </div>
                </div>

                {/* Campo: Municipio */}
                <div className="gp-location-info-item">
                  <label>Municipio</label>
                  <div className="gp-location-info-value">
                    {formData.municipio || '—'}
                  </div>
                </div>

                {/* Campo: Estado */}
                <div className="gp-location-info-item">
                  <label>Estado</label>
                  <div className="gp-location-info-value">
                    {formData.estado_ubicacion || '—'}
                  </div>
                </div>
              </div>

              <div className="gp-location-info-hint">
                💡 Esta información se obtiene automáticamente de las coordenadas seleccionadas usando Nominatim (OpenStreetMap).
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          <div className="gp-form-group">
            <label htmlFor="report-tipo" className="gp-form-label">
              Tipo de Reporte *
            </label>
            <select
              id="report-tipo"
              name="tipo"
              value={formData.tipo}
              onChange={handleInputChange}
              className="gp-select"
              aria-required="true"
              aria-describedby="tipo-selected"
            >
              <option value="">Selecciona un tipo de reporte</option>
              {tipos.map(tipo => {
                const info = tiposInfo[tipo.tipo] || { nombre: tipo.nombre, icono: tipo.icono || '📍' };
                return (
                  <option key={tipo.tipo} value={tipo.tipo}>
                    {info.icono} {info.nombre}
                  </option>
                );
              })}
            </select>
            
            {tipoSeleccionado && (
              <div 
                id="tipo-selected"
                className="gp-tipo-badge"
                role="status"
                aria-live="polite"
                style={{
                  backgroundColor: tipoSeleccionado.color + '10',
                  border: `1px solid ${tipoSeleccionado.color}40`,
                  color: tipoSeleccionado.color
                }}
              >
                <span aria-hidden="true">{tipoSeleccionado.icono}</span> {tipoSeleccionado.nombre} seleccionado
              </div>
            )}
          </div>

          {/* Descripción Corta */}
          <div className="gp-form-group">
            <label htmlFor="report-descripcion-corta" className="gp-form-label" data-required>
              Descripción Corta
            </label>
            <input
              id="report-descripcion-corta"
              type="text"
              name="descripcionCorta"
              value={formData.descripcionCorta}
              onChange={handleInputChange}
              placeholder="Resumen breve (ej: Bache grande en calle principal)"
              maxLength="100"
              className="gp-form-input"
              aria-required="true"
              aria-describedby="desc-corta-hint"
            />
            <p id="desc-corta-hint" className="gp-char-count">
              Esta descripción aparecerá en el mapa al hacer clic en el marcador ({formData.descripcionCorta.length}/100)
            </p>
          </div>

          {/* Descripción Detallada */}
          <div className="gp-form-group">
            <label htmlFor="report-descripcion" className="gp-form-label" data-required>
              Descripción Detallada
            </label>
            <textarea
              id="report-descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              placeholder="Describe detalladamente el problema que encontraste..."
              rows="4"
              className="gp-textarea"
              aria-required="true"
            />
          </div>

          {/* Nivel de Urgencia */}
          <fieldset className="gp-form-group gp-mb-32">
            <legend className="gp-form-label">Nivel de Urgencia</legend>
            
            <div className="gp-urgencia-group" role="radiogroup" aria-label="Seleccionar nivel de urgencia">
              {[1, 2, 3, 4, 5].map(nivel => (
                <label 
                  key={nivel} 
                  className={`gp-urgencia-option ${formData.peso == nivel ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="peso"
                    value={nivel}
                    checked={formData.peso == nivel}
                    onChange={handleInputChange}
                    aria-label={{
                      1: 'Baja urgencia',
                      2: 'Urgencia normal',
                      3: 'Urgencia media',
                      4: 'Alta urgencia',
                      5: 'Urgencia crítica'
                    }[nivel]}
                  />
                  <span aria-hidden="true">
                    {nivel === 1 && '🟢 Baja'}
                    {nivel === 2 && '🟡 Normal'}
                    {nivel === 3 && '🟠 Media'}
                    {nivel === 4 && '🔴 Alta'}
                    {nivel === 5 && '🚨 Crítica'}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Mensaje de Estado */}
          {message.text && (
            <div 
              className={`gp-alert gp-alert-${message.type}`}
              role="alert"
              aria-live="assertive"
            >
              <span className="gp-alert-icon" aria-hidden="true">
                {message.type === 'success' && '✅'}
                {message.type === 'error' && '❌'}
                {message.type === 'warning' && '⚠️'}
                {message.type === 'info' && 'ℹ️'}
              </span>
              <span>{message.text}</span>
            </div>
          )}

          {/* Botón Enviar */}
          <button
            type="submit"
            disabled={loading || !datosUbicacionCompletos}
            aria-busy={loading}
            aria-disabled={loading || !datosUbicacionCompletos}
            className={`gp-btn-submit ${loading ? 'gp-btn-submit-loading' : ''}`}
            style={{ opacity: !datosUbicacionCompletos ? 0.6 : 1 }}
          >
            {loading ? (
              <><span aria-hidden="true">📤</span> Enviando...</>
            ) : !datosUbicacionCompletos ? (
              <><span aria-hidden="true">🔒</span> Seleccione un punto en el mapa</>
            ) : (
              <><span aria-hidden="true">📤</span> Enviar Reporte</>
            )}
          </button>
        </form>

        {/* Footer */}
        <footer className="gp-report-form-footer">
          <p>Tu reporte será visible en el mapa en tiempo real</p>
          <a href="/" aria-label="Ir al mapa de reportes">🗺️ Ver Mapa de Reportes</a>
        </footer>
      </div>

      {/* Modal de carga de geocoding */}
      {loadingGeocoding && (
        <div className="gp-loading-overlay" role="dialog" aria-modal="true" aria-label="Cargando ubicación">
          <div className="gp-loading-card">
            <div className="gp-spinner" role="status" aria-label="Procesando"></div>
            <p className="gp-loading-text" aria-live="polite">{geocodingMessage}</p>
          </div>
        </div>
      )}

      {/* Modal de error */}
      {showErrorModal && (
        <div className="gp-loading-overlay gp-z-modal-top" role="dialog" aria-modal="true" aria-labelledby="error-title">
          <div className="gp-error-modal">
            <div className="gp-error-icon" aria-hidden="true">❌</div>
            <h3 id="error-title" className="gp-error-title">Ubicación no válida</h3>
            <p className="gp-error-message">{errorModalMessage}</p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="gp-btn-error-close"
              aria-label="Cerrar mensaje de error"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportForm;