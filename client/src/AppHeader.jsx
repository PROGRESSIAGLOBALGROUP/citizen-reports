import React, { useState, useEffect } from 'react';

export default function AppHeader() {
  const [municipio, setMunicipio] = useState('citizen-reports');
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
    <div className="app-header">
      {/* Brand Section - LEFT */}
      <div className="app-header-brand">
        {/* Icon - Municipality Seal/Badge */}
        <img 
          src="/logo-jantetelco.jpg"
          alt="Logo jantetelco"
          className="app-header-logo"
        />

        {/* Text Content - Vertical Stack */}
        <div className="app-header-text">
          {/* Title */}
          <h1 className="app-header-title">Reportes Ciudadanos</h1>
          
          {/* Subtitle */}
          <div className="app-header-subtitle">
            {municipio}, Morelos, México
          </div>
        </div>
      </div>

      {/* Accent Line - RIGHT */}
      <div className="app-header-accent" />
    </div>
  );
}
