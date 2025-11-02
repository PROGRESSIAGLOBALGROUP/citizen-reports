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
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f766e 100%)',
      padding: esMobil ? '12px 16px' : '18px 28px',
      borderBottom: '4px solid #14b8a6',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      flexShrink: 0,
      boxShadow: '0 8px 24px rgba(0,0,0,0.25), 0 0 1px rgba(20, 184, 166, 0.3)'
    }}>
      {/* Brand Section - LEFT */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: esMobil ? '10px' : '16px',
        flex: 1,
        minWidth: 0
      }}>
        {/* Icon - Municipality Home */}
        <div style={{
          fontSize: esMobil ? '28px' : '36px',
          lineHeight: '1',
          flexShrink: 0,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          🏛️
        </div>

        {/* Text Content - Vertical Stack */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          flex: 1,
          minWidth: 0
        }}>
          {/* Title */}
          <h1 style={{
            margin: 0,
            fontSize: esMobil ? '16px' : '22px',
            fontWeight: '900',
            lineHeight: '1.1',
            letterSpacing: '-0.6px',
            background: 'linear-gradient(135deg, #ffffff 0%, #d1e7e4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Reportes Ciudadanos
          </h1>
          
          {/* Subtitle */}
          <div style={{
            fontSize: esMobil ? '11px' : '13px',
            opacity: 0.85,
            fontWeight: '600',
            letterSpacing: '0.3px',
            color: '#e0f2f1'
          }}>
            {municipio}, Morelos, México
          </div>
        </div>
      </div>

      {/* Accent Line - RIGHT */}
      <div style={{
        width: '3px',
        height: esMobil ? '28px' : '48px',
        background: 'linear-gradient(180deg, #14b8a6 0%, transparent 100%)',
        borderRadius: '2px',
        opacity: 0.8,
        flexShrink: 0
      }} />

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
