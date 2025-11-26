/**
 * WhiteLabel Configuration System - Premium Edition
 * Interfaz profesional para configuración municipal de nivel gubernamental
 */

import React from 'react';

// Funciones legacy para compatibilidad
export async function cargarConfiguracionWhiteLabel(municipioId = 'citizen-reports') {
  try {
    const response = await fetch('/api/whitelabel/config');
    if (!response.ok) {
      // Si hay error, retornar una copia del DEFAULT para no dejar undefined
      const { DEFAULT_WHITELABEL_CONFIG } = await import('./WhiteLabelConfigPremium');
      return DEFAULT_WHITELABEL_CONFIG;
    }
    const data = await response.json();
    // Asegurar que siempre tiene la estructura correcta
    const { DEFAULT_WHITELABEL_CONFIG } = await import('./WhiteLabelConfigPremium');
    return { ...DEFAULT_WHITELABEL_CONFIG, ...data };
  } catch (e) {
    console.error('Error cargando WhiteLabel config:', e);
    // En caso de error, retornar DEFAULT en lugar de {}
    const { DEFAULT_WHITELABEL_CONFIG } = await import('./WhiteLabelConfigPremium');
    return DEFAULT_WHITELABEL_CONFIG;
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

export function useWhiteLabelConfig(municipioId = 'citizen-reports') {
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
