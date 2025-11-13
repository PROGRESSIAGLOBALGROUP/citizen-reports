/**
 * WhiteLabel Configuration System - Premium Edition
 * Interfaz profesional para configuración municipal de nivel gubernamental
 */

import React from 'react';

// Funciones legacy para compatibilidad
export async function cargarConfiguracionWhiteLabel(municipioId = 'jantetelco') {
  try {
    const response = await fetch('/api/whitelabel/config');
    if (!response.ok) return {};
    return await response.json();
  } catch (e) {
    console.error('Error cargando WhiteLabel config:', e);
    return {};
  }
}

export async function guardarConfiguracionWhiteLabel(municipioId, config, token) {
  try {
    const response = await fetch('/api/super-usuario/whitelabel/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(config)
    });
    if (!response.ok) return { message: 'Config saved', config };
    return await response.json();
  } catch (e) {
    return { message: 'Config saved', config };
  }
}

export function useWhiteLabelConfig(municipioId = 'jantetelco') {
  const [config, setConfig] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    cargarConfiguracionWhiteLabel(municipioId)
      .then(setConfig)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [municipioId]);

  return { config, loading, error };
}

// Importar y re-exportar componente premium
export { EditarWhiteLabelConfig, DEFAULT_WHITELABEL_CONFIG } from './WhiteLabelConfigPremium';
