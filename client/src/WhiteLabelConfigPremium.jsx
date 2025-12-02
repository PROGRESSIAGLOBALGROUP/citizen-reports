/**
 * WhiteLabel Configuration Premium
 * Interfaz profesional para configuración municipal
 * Diseño moderno siguiendo el sistema de diseño gp-*
 */

import React, { useState, useEffect } from 'react';
import MapPreviewWhiteLabel from './MapPreviewWhiteLabel.jsx';
import './gobierno-premium-panel.css';

export const DEFAULT_WHITELABEL_CONFIG = {
  municipioId: 'citizen-reports',
  municipioNombre: 'Jantetelco',
  estado: 'Morelos',
  dominio: 'reportes.jantetelco.gob.mx',
  plataforma: 'PROGRESSIA',
  ubicacion: 'Jantetelco, Morelos',
  
  colores: {
    primario: '#0284c7',
    exito: '#10b981',
    critica: '#ef4444',
    advertencia: '#f59e0b',
    fondo: '#ffffff',
    fondoAlt: '#f9fafb',
    textoPrimario: '#0f172a',
    textoSecundario: '#4b5563',
    borde: '#e5e7eb'
  },
  
  assets: {
    escudoUrl: 'https://jantetelcodematamoros.gob.mx/images/518/17657652/logoJNT-Photoroom-DcozD_06QcLPz3vTbhBL_A.png',
    escudoAlt: '🏛️',
    faviconUrl: '/favicon.ico'
  },
  
  contacto: {
    email: 'reportes@jantetelco.gob.mx',
    telefono: '+52 123 456 7890',
    horarioAtencion: 'Lunes a Viernes: 8:00 - 17:00'
  },
  
  mapa: {
    lat: 18.7150,
    lng: -98.7764,
    zoom: 16
  },
  
  permisos: {
    ciudadanosReportan: true,
    ciudadanosVenMapas: true,
    funcionariosAdministran: true,
    supervvisoresAprueban: true,
    adminModificaTipos: true
  }
};

// Componente principal
export function EditarWhiteLabelConfig({ municipioId = 'citizen-reports', token, onSave }) {
  const [config, setConfig] = useState(DEFAULT_WHITELABEL_CONFIG);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);

  // Cargar configuración actual desde la API al montar
  useEffect(() => {
    const cargarConfigActual = async () => {
      try {
        const response = await fetch('/api/whitelabel/config');
        if (response.ok) {
          const data = await response.json();
          
          // Mapear estructura plana de API a estructura anidada del componente
          setConfig(prev => ({
            ...prev,
            municipioId: data.nombre_municipio || prev.municipioId,
            municipioNombre: data.municipioNombre || data.nombre_municipio || prev.municipioNombre,
            estado: data.estado || prev.estado,
            dominio: data.dominio || prev.dominio,
            ubicacion: data.ubicacion || prev.ubicacion,
            colores: {
              ...prev.colores,
              primario: data.color_primario || prev.colores.primario,
              exito: data.color_secundario || prev.colores.exito
            },
            assets: {
              ...prev.assets,
              escudoUrl: data.logo_url || prev.assets.escudoUrl
            },
            mapa: {
              lat: data.mapa?.lat || prev.mapa.lat,
              lng: data.mapa?.lng || prev.mapa.lng,
              zoom: data.mapa?.zoom || prev.mapa.zoom
            }
          }));
        }
      } catch (e) {
        console.error('Error cargando config actual:', e);
      } finally {
        setCargando(false);
      }
    };
    
    cargarConfigActual();
  }, []);

  const handleColorChange = (clave, valor) => {
    setConfig(prev => ({
      ...prev,
      colores: { ...prev.colores, [clave]: valor }
    }));
  };

  const handleMapaChange = (coordenadas) => {
    setConfig(prev => ({
      ...prev,
      mapa: {
        lat: coordenadas.lat,
        lng: coordenadas.lng,
        zoom: coordenadas.zoom
      },
      ubicacion: coordenadas.ubicacion
    }));
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const payload = {
        nombre_municipio: config.municipioNombre,
        estado: config.estado,
        ubicacion: config.ubicacion,
        color_primario: config.colores?.primario,
        color_secundario: config.colores?.exito,
        mapa: config.mapa,
        mostrar_progressia: config.mostrarProgressia,
        mostrar_citizen_reports: config.mostrarCitizenReports,
        logo_url: config.logoUrl,
        nombre_app: config.nombreApp,
        lema: config.lema
      };
      
      const response = await fetch('/api/super-usuario/whitelabel/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar');
      }

      setMensaje('success:Configuración guardada correctamente');
      if (onSave) onSave(config);
      window.dispatchEvent(new CustomEvent('whitelabel-updated', { detail: config }));

      setTimeout(() => setMensaje(''), 3000);
    } catch (e) {
      setMensaje(`error:${e.message}`);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="gp-wl-loading">
        <span>⏳</span> Cargando configuración...
      </div>
    );
  }

  const colorLabels = {
    primario: 'Color Primario',
    exito: 'Éxito / Completado',
    critica: 'Crítico / Error',
    advertencia: 'Advertencia',
    fondo: 'Fondo Principal',
    fondoAlt: 'Fondo Alternativo',
    textoPrimario: 'Texto Principal',
    textoSecundario: 'Texto Secundario',
    borde: 'Bordes'
  };

  return (
    <div className="gp-whitelabel-wrapper">
      {/* Header Premium */}
      <div className="gp-admin-header">
        <div className="gp-admin-header-icon">🌐</div>
        <div className="gp-admin-header-content">
          <h1 className="gp-admin-header-title">Centro de Control Municipal</h1>
          <p className="gp-admin-header-subtitle">Personaliza la plataforma de reportes ciudadanos de tu municipio</p>
          <div className="gp-admin-header-stats">
            <span className="gp-admin-stat">🏛️ {config.municipioNombre}</span>
            <span className="gp-admin-stat success">📍 {config.estado}</span>
          </div>
        </div>
      </div>

      <div className="gp-whitelabel-content">
        {/* Mensajes de estado */}
        {mensaje && (
          <div className={`gp-wl-alert gp-wl-alert--${mensaje.split(':')[0]}`}>
            <span>{mensaje.split(':')[0] === 'success' ? '✅' : '❌'}</span>
            <span>{mensaje.split(':')[1]}</span>
          </div>
        )}

        {/* Sección: Ubicación Geográfica */}
        <div className="gp-wl-section gp-wl-section--full">
          <div className="gp-wl-section-header">
            <div className="gp-wl-section-icon">🗺️</div>
            <div className="gp-wl-section-text">
              <h2 className="gp-wl-section-title">Ubicación Geográfica</h2>
              <p className="gp-wl-section-desc">Define la posición inicial del mapa interactivo. Arrastra el marcador o haz clic para ajustar.</p>
            </div>
          </div>
          <MapPreviewWhiteLabel
            lat={config.mapa.lat}
            lng={config.mapa.lng}
            zoom={config.mapa.zoom}
            ubicacion={config.ubicacion}
            onChange={handleMapaChange}
          />
        </div>

        {/* Sección: Información Municipal */}
        <div className="gp-wl-section">
          <div className="gp-wl-section-header">
            <div className="gp-wl-section-icon">🏛️</div>
            <div className="gp-wl-section-text">
              <h2 className="gp-wl-section-title">Información Municipal</h2>
              <p className="gp-wl-section-desc">Datos básicos de identificación del municipio</p>
            </div>
          </div>
          <div className="gp-wl-form-grid">
            <div className="gp-wl-field">
              <label className="gp-wl-label">Nombre del Municipio</label>
              <input
                type="text"
                className="gp-wl-input"
                value={config.municipioNombre}
                onChange={(e) => setConfig({ ...config, municipioNombre: e.target.value })}
              />
            </div>
            <div className="gp-wl-field">
              <label className="gp-wl-label">Estado</label>
              <input
                type="text"
                className="gp-wl-input"
                value={config.estado}
                onChange={(e) => setConfig({ ...config, estado: e.target.value })}
              />
            </div>
            <div className="gp-wl-field">
              <label className="gp-wl-label">Dominio Oficial</label>
              <input
                type="url"
                className="gp-wl-input gp-wl-input--mono"
                value={config.dominio}
                onChange={(e) => setConfig({ ...config, dominio: e.target.value })}
                placeholder="reportes.municipio.gob.mx"
              />
            </div>
          </div>
        </div>

        {/* Sección: Contacto */}
        <div className="gp-wl-section">
          <div className="gp-wl-section-header">
            <div className="gp-wl-section-icon">📞</div>
            <div className="gp-wl-section-text">
              <h2 className="gp-wl-section-title">Información de Contacto</h2>
              <p className="gp-wl-section-desc">Datos de atención ciudadana y comunicación</p>
            </div>
          </div>
          <div className="gp-wl-form-grid">
            <div className="gp-wl-field">
              <label className="gp-wl-label">Email de Contacto</label>
              <input
                type="email"
                className="gp-wl-input gp-wl-input--mono"
                value={config.contacto.email}
                onChange={(e) => setConfig({ ...config, contacto: { ...config.contacto, email: e.target.value } })}
              />
            </div>
            <div className="gp-wl-field">
              <label className="gp-wl-label">Teléfono</label>
              <input
                type="tel"
                className="gp-wl-input"
                value={config.contacto.telefono}
                onChange={(e) => setConfig({ ...config, contacto: { ...config.contacto, telefono: e.target.value } })}
              />
            </div>
            <div className="gp-wl-field">
              <label className="gp-wl-label">Horario de Atención</label>
              <input
                type="text"
                className="gp-wl-input"
                value={config.contacto.horarioAtencion}
                onChange={(e) => setConfig({ ...config, contacto: { ...config.contacto, horarioAtencion: e.target.value } })}
              />
            </div>
          </div>
        </div>

        {/* Sección: Identidad Visual */}
        <div className="gp-wl-section">
          <div className="gp-wl-section-header">
            <div className="gp-wl-section-icon">🖼️</div>
            <div className="gp-wl-section-text">
              <h2 className="gp-wl-section-title">Identidad Visual</h2>
              <p className="gp-wl-section-desc">Logo y recursos gráficos del municipio</p>
            </div>
          </div>
          <div className="gp-wl-form-grid">
            <div className="gp-wl-field">
              <label className="gp-wl-label">URL del Escudo/Logo</label>
              <input
                type="url"
                className="gp-wl-input gp-wl-input--mono"
                value={config.assets.escudoUrl}
                onChange={(e) => setConfig({ ...config, assets: { ...config.assets, escudoUrl: e.target.value } })}
                placeholder="https://..."
              />
            </div>
            <div className="gp-wl-field">
              <label className="gp-wl-label">URL del Favicon</label>
              <input
                type="url"
                className="gp-wl-input gp-wl-input--mono"
                value={config.assets.faviconUrl}
                onChange={(e) => setConfig({ ...config, assets: { ...config.assets, faviconUrl: e.target.value } })}
                placeholder="/favicon.ico"
              />
            </div>
          </div>
        </div>

        {/* Sección: Paleta de Colores */}
        <div className="gp-wl-section gp-wl-section--full">
          <div className="gp-wl-section-header">
            <div className="gp-wl-section-icon">🎨</div>
            <div className="gp-wl-section-text">
              <h2 className="gp-wl-section-title">Paleta de Colores</h2>
              <p className="gp-wl-section-desc">Define los colores que identifican a tu municipio en toda la plataforma</p>
            </div>
          </div>
          <div className="gp-wl-form-grid gp-wl-form-grid--colors">
            {Object.entries(config.colores).map(([clave, valor]) => (
              <div key={clave} className="gp-wl-field">
                <label className="gp-wl-label">{colorLabels[clave] || clave}</label>
                <div className="gp-wl-color-field">
                  <div className="gp-wl-color-preview">
                    <input
                      type="color"
                      value={valor}
                      onChange={(e) => handleColorChange(clave, e.target.value)}
                    />
                  </div>
                  <input
                    type="text"
                    className="gp-wl-color-input"
                    value={valor}
                    onChange={(e) => handleColorChange(clave, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="gp-wl-footer">
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="gp-wl-btn-save"
          >
            {guardando ? '⏳ Guardando...' : '💾 Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditarWhiteLabelConfig;
