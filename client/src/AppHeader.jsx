import React, { useState, useEffect } from 'react';

export default function AppHeader() {
  const [municipio, setMunicipio] = useState('Jantetelco');
  const esMobil = window.innerWidth < 768;

  // Cargar configuración de white label (si existe)
  useEffect(() => {
    const fetchMunicipioConfig = async () => {
      try {
        const response = await fetch('/api/whitelabel/config');
        if (response.ok) {
          const config = await response.json();
          if (config.nombre_municipio) {
            setMunicipio(config.nombre_municipio);
          }
        }
      } catch (err) {
        console.debug('No custom municipality config, using default');
      }
    };

    fetchMunicipioConfig();
  }, []);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
      padding: esMobil ? '10px 14px' : '14px 20px',
      borderBottom: '3px solid #1e3a8a',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      flexShrink: 0,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
    }}>
      {/* Brand Section - LEFT */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: esMobil ? '8px' : '12px',
        flex: 1,
        minWidth: 0
      }}>
        {/* Logo/Icon */}
        <div style={{
          fontSize: esMobil ? '20px' : '24px',
          lineHeight: '1',
          flexShrink: 0
        }}>
          🌍
        </div>

        {/* Text Content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1px',
          flex: 1,
          minWidth: 0
        }}>
          <div style={{
            fontSize: esMobil ? '9px' : '10px',
            opacity: 0.9,
            fontWeight: '700',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            lineHeight: '1'
          }}>
            ✨ PROGRESSIA
          </div>
          <h1 style={{
            margin: 0,
            fontSize: esMobil ? '14px' : '16px',
            fontWeight: '900',
            lineHeight: '1.1',
            letterSpacing: '-0.5px'
          }}>
            Reportes Ciudadanos
          </h1>
        </div>
      </div>

      {/* Municipality Badge - RIGHT */}
      <div style={{
        background: 'rgba(255,255,255,0.2)',
        padding: esMobil ? '6px 10px' : '8px 14px',
        borderRadius: '4px',
        fontSize: esMobil ? '10px' : '11px',
        fontWeight: '700',
        border: '1px solid rgba(255,255,255,0.3)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: esMobil ? '140px' : 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        flexShrink: 0
      }}>
        <span style={{ fontSize: esMobil ? '12px' : '14px' }}>📍</span>
        <span>{municipio}, Morelos</span>
      </div>
    </div>
  );
}
