/**
 * WhiteLabel Configuration Premium
 * Interfaz profesional para configuración municipal
 * Diseño moderno, limpio y atractivo para gobiernos locales
 */

import React, { useState, useEffect } from 'react';
import MapPreviewWhiteLabel from './MapPreviewWhiteLabel.jsx';

const PREMIUM_COLORS = {
  // Marca principal
  primary: '#0066cc',
  primaryLight: '#e6f2ff',
  primaryDark: '#004499',
  
  // Secundarios
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  
  // Neutrales
  bg: '#ffffff',
  bgAlt: '#f8fafb',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  text: '#1f2937',
  textMuted: '#6b7280',
  textLight: '#9ca3af',
  
  // Gobierno
  govBlue: '#003d82',
  govGreen: '#2d8f3f'
};

export const DEFAULT_WHITELABEL_CONFIG = {
  municipioId: 'jantetelco',
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

// Componente Card reutilizable
const Card = ({ children, className = '' }) => (
  <div
    className={className}
    style={{
      background: PREMIUM_COLORS.bg,
      border: `1px solid ${PREMIUM_COLORS.border}`,
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
      transition: 'all 0.3s ease',
      '&:hover': { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }
    }}
  >
    {children}
  </div>
);

// Componente SectionHeader
const SectionHeader = ({ icon, title, description }) => (
  <div style={{ marginBottom: '24px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
      <span style={{ fontSize: '24px' }}>{icon}</span>
      <h2
        style={{
          fontSize: '20px',
          fontWeight: '700',
          color: PREMIUM_COLORS.text,
          margin: 0,
          letterSpacing: '-0.5px'
        }}
      >
        {title}
      </h2>
    </div>
    {description && (
      <p
        style={{
          fontSize: '14px',
          color: PREMIUM_COLORS.textMuted,
          margin: 0,
          paddingLeft: '36px'
        }}
      >
        {description}
      </p>
    )}
  </div>
);

// Componente Input reutilizable
const PremiumInput = ({ label, value, onChange, type = 'text', placeholder = '', error = false }) => (
  <div style={{ marginBottom: '16px' }}>
    {label && (
      <label
        style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: '600',
          color: PREMIUM_COLORS.text,
          marginBottom: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.4px'
        }}
      >
        {label}
      </label>
    )}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '10px 12px',
        fontSize: '14px',
        border: `1.5px solid ${error ? PREMIUM_COLORS.danger : PREMIUM_COLORS.border}`,
        borderRadius: '8px',
        fontFamily: type === 'email' || type === 'url' ? 'monospace' : 'system-ui, sans-serif',
        backgroundColor: PREMIUM_COLORS.bg,
        color: PREMIUM_COLORS.text,
        transition: 'all 0.2s ease',
        boxSizing: 'border-box',
        outline: 'none'
      }}
      onFocus={(e) => {
        e.target.style.borderColor = PREMIUM_COLORS.primary;
        e.target.style.boxShadow = `0 0 0 3px ${PREMIUM_COLORS.primaryLight}`;
      }}
      onBlur={(e) => {
        e.target.style.borderColor = error ? PREMIUM_COLORS.danger : PREMIUM_COLORS.border;
        e.target.style.boxShadow = 'none';
      }}
    />
  </div>
);

// Componente ColorPicker
const ColorPickerField = ({ label, value, onChange }) => (
  <div style={{ marginBottom: '16px' }}>
    {label && (
      <label
        style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: '600',
          color: PREMIUM_COLORS.text,
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.4px'
        }}
      >
        {label}
      </label>
    )}
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <div
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '8px',
          border: `2px solid ${PREMIUM_COLORS.border}`,
          overflow: 'hidden',
          flexShrink: 0
        }}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            cursor: 'pointer'
          }}
        />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1,
          padding: '10px 12px',
          fontSize: '13px',
          border: `1.5px solid ${PREMIUM_COLORS.border}`,
          borderRadius: '8px',
          fontFamily: 'monospace',
          color: PREMIUM_COLORS.text,
          transition: 'all 0.2s ease',
          outline: 'none'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = PREMIUM_COLORS.primary;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = PREMIUM_COLORS.border;
        }}
      />
    </div>
  </div>
);

// Componente principal
export function EditarWhiteLabelConfig({ municipioId = 'jantetelco', token, onSave }) {
  const [config, setConfig] = useState(DEFAULT_WHITELABEL_CONFIG);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const handleColorChange = (clave, valor) => {
    setConfig(prev => ({
      ...prev,
      colores: { ...prev.colores, [clave]: valor }
    }));
  };

  const handleContactoChange = (clave, valor) => {
    setConfig(prev => ({
      ...prev,
      contacto: { ...prev.contacto, [clave]: valor }
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
      const response = await fetch('/api/super-usuario/whitelabel/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) throw new Error('Error al guardar');

      setMensaje('✅ Configuración guardada correctamente');
      if (onSave) onSave(config);
      window.dispatchEvent(new CustomEvent('whitelabel-updated', { detail: config }));

      setTimeout(() => setMensaje(''), 3000);
    } catch (e) {
      setMensaje(`❌ Error: ${e.message}`);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      style={{
        background: PREMIUM_COLORS.bgAlt,
        minHeight: '100vh',
        padding: '32px 24px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {/* Header Principal */}
        <div style={{ marginBottom: '40px' }}>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: '800',
              color: PREMIUM_COLORS.text,
              margin: 0,
              marginBottom: '8px',
              letterSpacing: '-1px'
            }}
          >
            Centro de Control Municipal
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: PREMIUM_COLORS.textMuted,
              margin: 0
            }}
          >
            Personaliza la plataforma de reportes ciudadanos de tu municipio
          </p>
        </div>

        {/* Grid de secciones */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
          }}
        >
          {/* Información Municipal */}
          <div
            style={{
              background: PREMIUM_COLORS.bg,
              border: `1px solid ${PREMIUM_COLORS.border}`,
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
            }}
          >
            <SectionHeader
              icon="🏛️"
              title="Información Municipal"
              description="Datos básicos del municipio"
            />
            <PremiumInput
              label="Nombre del Municipio"
              value={config.municipioNombre}
              onChange={(e) => setConfig({ ...config, municipioNombre: e.target.value })}
            />
            <PremiumInput
              label="Estado"
              value={config.estado}
              onChange={(e) => setConfig({ ...config, estado: e.target.value })}
            />
            <PremiumInput
              label="Dominio Oficial"
              type="url"
              value={config.dominio}
              onChange={(e) => setConfig({ ...config, dominio: e.target.value })}
              placeholder="reportes.municipio.gob.mx"
            />
          </div>

          {/* Contacto */}
          <div
            style={{
              background: PREMIUM_COLORS.bg,
              border: `1px solid ${PREMIUM_COLORS.border}`,
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
            }}
          >
            <SectionHeader
              icon="📞"
              title="Contacto"
              description="Información de atención ciudadana"
            />
            <PremiumInput
              label="Email de Contacto"
              type="email"
              value={config.contacto.email}
              onChange={(e) => setConfig({ ...config, contacto: { ...config.contacto, email: e.target.value } })}
            />
            <PremiumInput
              label="Teléfono"
              type="tel"
              value={config.contacto.telefono}
              onChange={(e) => setConfig({ ...config, contacto: { ...config.contacto, telefono: e.target.value } })}
            />
            <PremiumInput
              label="Horario de Atención"
              value={config.contacto.horarioAtencion}
              onChange={(e) => setConfig({ ...config, contacto: { ...config.contacto, horarioAtencion: e.target.value } })}
            />
          </div>

          {/* Paleta de Colores */}
          <div
            style={{
              background: PREMIUM_COLORS.bg,
              border: `1px solid ${PREMIUM_COLORS.border}`,
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
              gridColumn: '1 / -1'
            }}
          >
            <SectionHeader
              icon="🎨"
              title="Paleta de Colores"
              description="Define los colores que identifican a tu municipio"
            />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px'
              }}
            >
              {Object.entries(config.colores).map(([clave, valor]) => (
                <ColorPickerField
                  key={clave}
                  label={clave.replace(/([A-Z])/g, ' $1').trim()}
                  value={valor}
                  onChange={(newColor) => handleColorChange(clave, newColor)}
                />
              ))}
            </div>
          </div>

          {/* Configuración del Mapa */}
          <div
            style={{
              background: PREMIUM_COLORS.bg,
              border: `1px solid ${PREMIUM_COLORS.border}`,
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
              gridColumn: '1 / -1'
            }}
          >
            <SectionHeader
              icon="🗺️"
              title="Ubicación Geográfica"
              description="Define la posición inicial del mapa interactivo. Arrastra el marcador o haz clic para ajustar."
            />
            <MapPreviewWhiteLabel
              lat={config.mapa.lat}
              lng={config.mapa.lng}
              zoom={config.mapa.zoom}
              ubicacion={config.ubicacion}
              onChange={handleMapaChange}
            />
          </div>
        </div>

        {/* Mensajes de estado */}
        {mensaje && (
          <div
            style={{
              padding: '16px 20px',
              background: mensaje.includes('✅') ? '#ecfdf5' : '#fef2f2',
              border: `1.5px solid ${mensaje.includes('✅') ? '#86efac' : '#fca5a5'}`,
              borderRadius: '8px',
              color: mensaje.includes('✅') ? '#166534' : '#991b1b',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
              animation: 'slideIn 0.3s ease'
            }}
          >
            <span>{mensaje.split(' ')[0]}</span>
            <span>{mensaje.slice(2)}</span>
          </div>
        )}

        {/* Botones de acción */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'flex-end',
            paddingTop: '24px',
            borderTop: `1px solid ${PREMIUM_COLORS.border}`
          }}
        >
          <button
            onClick={handleGuardar}
            disabled={guardando}
            style={{
              padding: '12px 32px',
              fontSize: '15px',
              fontWeight: '700',
              border: 'none',
              borderRadius: '8px',
              background: guardando ? PREMIUM_COLORS.border : PREMIUM_COLORS.primary,
              color: 'white',
              cursor: guardando ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              letterSpacing: '0.3px',
              opacity: guardando ? 0.7 : 1
            }}
            onMouseOver={(e) => {
              if (!guardando) {
                e.target.style.background = PREMIUM_COLORS.primaryDark;
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 16px rgba(0, 102, 204, 0.2)';
              }
            }}
            onMouseOut={(e) => {
              if (!guardando) {
                e.target.style.background = PREMIUM_COLORS.primary;
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            {guardando ? '⏳ Guardando...' : '💾 Guardar Cambios'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default EditarWhiteLabelConfig;
