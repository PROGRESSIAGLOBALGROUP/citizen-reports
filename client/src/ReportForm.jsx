import React, { useState, useEffect, useRef } from 'react';
import { crearReporte, tiposReporte } from './api.js';
import { recopilarDatosIdentificacion } from './fingerprint.js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Coordenadas del centro de Jantetelco
const JANTETELCO_CENTER = {
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
    peso: 3
  });
  
  const [tipos, setTipos] = useState([]);
  const [tiposInfo, setTiposInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [ubicacionActual, setUbicacionActual] = useState(null);
  
  // Referencias para el mapa interactivo
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const selectedMarker = useRef(null);

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

    // Crear el mapa centrado en Jantetelco
    mapInstance.current = L.map(mapRef.current).setView([JANTETELCO_CENTER.lat, JANTETELCO_CENTER.lng], 15);

    // Agregar tiles de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(mapInstance.current);

    // Marcador fijo del centro de Jantetelco
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

    L.marker([JANTETELCO_CENTER.lat, JANTETELCO_CENTER.lng], { icon: centroIcon })
      .bindPopup(`
        <div style="font-family: system-ui, -apple-system, sans-serif; text-align: center;">
          <div style="font-weight: 700; font-size: 16px; color: #1e293b; margin-bottom: 4px;">
            🏛️ Centro de Jantetelco
          </div>
          <div style="color: #64748b; font-size: 12px;">
            Morelos, México
          </div>
        </div>
      `)
      .addTo(mapInstance.current);

    // Colocar marcador por defecto en el centro de Jantetelco
    const defaultLat = JANTETELCO_CENTER.lat;
    const defaultLng = JANTETELCO_CENTER.lng;
    
    // Actualizar campos de coordenadas con el centro por defecto
    setFormData(prev => ({ 
      ...prev, 
      lat: defaultLat.toFixed(6), 
      lng: defaultLng.toFixed(6) 
    }));

    // Crear marcador de selección por defecto usando la función auxiliar
    actualizarMarcadorMapa(defaultLat, defaultLng);

    // Evento de clic en el mapa para seleccionar nueva ubicación
    mapInstance.current.on('click', (e) => {
      const { lat, lng } = e.latlng;
      console.log('📍 Click en mapa:', lat, lng);
      
      // Actualizar campos de coordenadas primero
      setFormData(prev => {
        const tipoActual = prev.tipo; // Obtener tipo del estado actual
        
        // Usar setTimeout para asegurar que el DOM se actualice
        setTimeout(() => {
          actualizarMarcadorMapa(lat, lng, tipoActual);
        }, 0);
        
        return {
          ...prev, 
          lat: lat.toFixed(6), 
          lng: lng.toFixed(6) 
        };
      });

      setMessage({ type: 'success', text: `Ubicación seleccionada: ${lat.toFixed(6)}, ${lng.toFixed(6)}` });
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
        
        // Verificar que esté dentro del área de Jantetelco (aproximadamente)
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
          setMessage({ type: 'warning', text: 'Tu ubicación parece estar fuera de Jantetelco. Verifica las coordenadas.' });
        }
      },
      (error) => {
        console.error('Error de geolocalización:', error);
        setMessage({ type: 'error', text: 'No se pudo obtener tu ubicación. Ingresa las coordenadas manualmente.' });
      }
    );
  };

  // Usar ubicación del centro de Jantetelco como sugerencia
  const usarCentroJantetelco = () => {
    const { lat, lng } = JANTETELCO_CENTER;
    setFormData(prev => ({ 
      ...prev, 
      lat: lat.toString(), 
      lng: lng.toString() 
    }));
    actualizarMarcadorMapa(lat, lng);
    setMessage({ type: 'info', text: 'Coordenadas del centro de Jantetelco establecidas y mostradas en el mapa' });
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
      setMessage({ type: 'error', text: 'Por favor selecciona un tipo de reporte' });
      return;
    }
    
    if (!formData.descripcionCorta.trim()) {
      setMessage({ type: 'error', text: 'Por favor proporciona una descripción corta' });
      return;
    }
    
    if (!formData.descripcion.trim()) {
      setMessage({ type: 'error', text: 'Por favor describe detalladamente el problema' });
      return;
    }
    
    if (!formData.lat || !formData.lng) {
      setMessage({ type: 'error', text: 'Por favor proporciona las coordenadas de ubicación' });
      return;
    }

    const lat = parseFloat(formData.lat);
    const lng = parseFloat(formData.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
      setMessage({ type: 'error', text: 'Las coordenadas deben ser números válidos' });
      return;
    }

    // Validar que esté dentro de rangos razonables para Jantetelco
    if (lat < 18.700 || lat > 18.730 || lng < -98.790 || lng > -98.760) {
      setMessage({ type: 'warning', text: 'Las coordenadas parecen estar fuera de Jantetelco. ¿Deseas continuar?' });
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
        // Agregar datos de identificación sin molestar al usuario
        fingerprint: datosIdentificacion.fingerprint,
        sesionId: datosIdentificacion.sesionId,
        userAgent: datosIdentificacion.userAgent
      };

      console.log('📝 Enviando reporte con identificación:', {
        ...reporteData,
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

      // Limpiar formulario
      setFormData({
        tipo: '',
        descripcion: '',
        descripcionCorta: '',
        lat: '',
        lng: '',
        peso: 3
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
    <div style={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'auto',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '12px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '600px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        overflow: 'visible',
        marginBottom: '40px'
      }}>
        {/* Header - Clase Mundial Design */}
        <div style={{
          // Fondo premium con gradiente dinámico
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 25%, #1e40af 50%, #3b82f6 75%, #60a5fa 100%)',
          color: 'white',
          padding: '64px 40px 56px 40px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 60px rgba(30, 58, 138, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}>
          {/* Efecto de fondo - Orbs animados */}
          <div style={{
            position: 'absolute',
            top: '-40%',
            right: '-15%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(96, 165, 250, 0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            animation: 'float-orb 6s ease-in-out infinite'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-50%',
            left: '-10%',
            width: '350px',
            height: '350px',
            background: 'radial-gradient(circle, rgba(30, 58, 138, 0.2) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(50px)',
            animation: 'float-orb-reverse 8s ease-in-out infinite'
          }} />
          
          {/* Grid pattern subtle */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 50px), repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 50px)',
            pointerEvents: 'none'
          }} />

          {/* Accent lines - top */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            opacity: 0.5
          }} />

          {/* Contenido principal */}
          <div style={{ 
            position: 'relative', 
            zIndex: 2,
            animation: 'fadeInDown 0.8s ease-out'
          }}>
            {/* Línea decorativa superior */}
            <div style={{
              width: '60px',
              height: '3px',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
              margin: '0 auto 24px auto',
              borderRadius: '2px'
            }} />

            {/* Título principal - Mega impactante */}
            <h1 style={{ 
              margin: '0 0 16px 0', 
              fontSize: 'clamp(28px, 8vw, 42px)',
              fontWeight: '900',
              letterSpacing: '-1px',
              lineHeight: '1.2',
              textShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              background: 'linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Reportar un Problema
            </h1>

            {/* Subtítulo elegante */}
            <p style={{ 
              margin: '0 auto 28px auto', 
              fontSize: 'clamp(14px, 2vw, 16px)',
              opacity: 0.92,
              fontWeight: '400',
              letterSpacing: '0.4px',
              lineHeight: '1.6',
              maxWidth: '500px'
            }}>
              Tu reporte es importante. Comparte la ubicación exacta y una descripción clara para que podamos actuar rápidamente.
            </p>

            {/* Badge premium - Glass effect mejorado */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              borderRadius: '50px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontSize: '13px',
              fontWeight: '600',
              letterSpacing: '0.5px',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              cursor: 'default'
            }}>
              <span style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                background: '#10b981',
                borderRadius: '50%',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)'
              }} />
              Sistema activo
            </div>

            {/* Línea decorativa inferior */}
            <div style={{
              width: '60px',
              height: '3px',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
              margin: '28px auto 0 auto',
              borderRadius: '2px'
            }} />
          </div>

          {/* Estilos de animación */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes float-orb {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-20px); }
            }
            @keyframes float-orb-reverse {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(20px); }
            }
            @keyframes fadeInDown {
              from {
                opacity: 0;
                transform: translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ 
          padding: '32px 24px',
          boxSizing: 'border-box'
        }}>
          
          {/* Ubicación - MOVIDO AL INICIO */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151'
            }}>
              Ubicación *
            </label>

            {/* Botones de Ubicación - ARRIBA DEL MAPA */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '16px',
              flexWrap: 'wrap'
            }}>
              <button
                type="button"
                onClick={obtenerUbicacionActual}
                style={{
                  flex: '1',
                  minWidth: '140px',
                  padding: '12px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#059669';
                  e.target.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#10b981';
                  e.target.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.2)';
                }}
              >
                📍 Mi Ubicación
              </button>
              
              <button
                type="button"
                onClick={usarCentroJantetelco}
                style={{
                  flex: '1',
                  minWidth: '140px',
                  padding: '12px 16px',
                  backgroundColor: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(99, 102, 241, 0.2)'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#4f46e5';
                  e.target.style.boxShadow = '0 4px 8px rgba(99, 102, 241, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#6366f1';
                  e.target.style.boxShadow = '0 2px 4px rgba(99, 102, 241, 0.2)';
                }}
              >
                🏛️ Centro
              </button>
            </div>

            {/* Mapa Interactivo - DEBAJO DE LOS BOTONES */}
            <div style={{ 
              marginBottom: '16px',
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <label style={{ 
                fontSize: '14px', 
                color: '#374151',
                fontWeight: '600',
                marginBottom: '8px', 
                display: 'block' 
              }}>
                🗺️ Ubicación Interactiva
              </label>
              <p style={{
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '12px',
                lineHeight: '1.4'
              }}>
                Haz clic en cualquier punto del mapa para seleccionar la ubicación exacta del reporte.
                Las coordenadas se actualizarán automáticamente.
              </p>
              <div 
                ref={mapRef}
                style={{
                  width: '100%',
                  height: '300px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  background: '#f9fafb',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}
              />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: '8px',
                padding: '8px 12px',
                backgroundColor: '#ecfdf5',
                border: '1px solid #bbf7d0',
                borderRadius: '6px'
              }}>
                <span style={{ fontSize: '12px', marginRight: '6px' }}>💡</span>
                <span style={{
                  fontSize: '11px',
                  color: '#059669',
                  fontStyle: 'italic'
                }}>
                  El marcador 🏛️ muestra el centro de Jantetelco. El marcador 📍 rojo aparecerá donde hagas clic.
                </span>
              </div>
            </div>

            {/* Lat/Lng Hidden - SIGUE SIENDO INVISIBLE */}
            <div style={{ display: 'none', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                  Latitud *
                </label>
                <input
                  type="number"
                  name="lat"
                  value={formData.lat}
                  onChange={handleInputChange}
                  placeholder="18.715"
                  step="0.000001"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                  Longitud *
                </label>
                <input
                  type="number"
                  name="lng"
                  value={formData.lng}
                  onChange={handleInputChange}
                  placeholder="-98.7764"
                  step="0.000001"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Tipo de Reporte */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151'
            }}>
              Tipo de Reporte *
            </label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: 'white',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
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
              <div style={{
                marginTop: '8px',
                padding: '8px 12px',
                backgroundColor: tipoSeleccionado.color + '10',
                border: `1px solid ${tipoSeleccionado.color}40`,
                borderRadius: '6px',
                fontSize: '14px',
                color: tipoSeleccionado.color
              }}>
                {tipoSeleccionado.icono} {tipoSeleccionado.nombre} seleccionado
              </div>
            )}
          </div>

          {/* Descripción Corta */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600', 
              color: '#374151'
            }}>
              Descripción Corta *
            </label>
            <input
              type="text"
              name="descripcionCorta"
              value={formData.descripcionCorta}
              onChange={handleInputChange}
              placeholder="Resumen breve (ej: Bache grande en calle principal)"
              maxLength="100"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              marginTop: '4px',
              fontStyle: 'italic'
            }}>
              Esta descripción aparecerá en el mapa al hacer clic en el marcador ({formData.descripcionCorta.length}/100)
            </p>
          </div>

          {/* Descripción Detallada */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600', 
              color: '#374151'
            }}>
              Descripción Detallada *
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              placeholder="Describe detalladamente el problema que encontraste..."
              rows="4"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                resize: 'vertical',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Nivel de Urgencia */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151'
            }}>
              Nivel de Urgencia
            </label>
            
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5].map(nivel => (
                <label key={nivel} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  border: `2px solid ${formData.peso == nivel ? '#3b82f6' : '#e5e7eb'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: formData.peso == nivel ? '#eff6ff' : 'white',
                  transition: 'all 0.2s ease',
                  fontSize: '14px'
                }}>
                  <input
                    type="radio"
                    name="peso"
                    value={nivel}
                    checked={formData.peso == nivel}
                    onChange={handleInputChange}
                    style={{ margin: 0 }}
                  />
                  <span>
                    {nivel === 1 && '🟢 Baja'}
                    {nivel === 2 && '🟡 Normal'}
                    {nivel === 3 && '🟠 Media'}
                    {nivel === 4 && '🔴 Alta'}
                    {nivel === 5 && '🚨 Crítica'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Mensaje de Estado */}
          {message.text && (
            <div style={{
              padding: '12px 16px',
              marginBottom: '24px',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 
                message.type === 'success' ? '#f0fdf4' :
                message.type === 'error' ? '#fef2f2' :
                message.type === 'warning' ? '#fefbf3' : '#f0f9ff',
              color:
                message.type === 'success' ? '#15803d' :
                message.type === 'error' ? '#dc2626' :
                message.type === 'warning' ? '#d97706' : '#1d4ed8',
              border: `1px solid ${
                message.type === 'success' ? '#bbf7d0' :
                message.type === 'error' ? '#fecaca' :
                message.type === 'warning' ? '#fed7aa' : '#bfdbfe'
              }`
            }}>
              {message.type === 'success' && '✅ '}
              {message.type === 'error' && '❌ '}
              {message.type === 'warning' && '⚠️ '}
              {message.type === 'info' && 'ℹ️ '}
              {message.text}
            </div>
          )}

          {/* Botón Enviar */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseOver={(e) => {
              if (!loading) e.target.style.backgroundColor = '#2563eb';
            }}
            onMouseOut={(e) => {
              if (!loading) e.target.style.backgroundColor = '#3b82f6';
            }}
          >
            {loading ? '📤 Enviando...' : '📤 Enviar Reporte'}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          padding: '20px 24px',
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <p style={{ 
            margin: '0 0 8px 0', 
            fontSize: '14px', 
            color: '#6b7280' 
          }}>
            Tu reporte será visible en el mapa en tiempo real
          </p>
          <a 
            href="/"
            style={{
              color: '#3b82f6',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}
            onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
            onMouseOut={(e) => e.target.style.textDecoration = 'none'}
          >
            🗺️ Ver Mapa de Reportes
          </a>
        </div>
      </div>
    </div>
  );
}

export default ReportForm;