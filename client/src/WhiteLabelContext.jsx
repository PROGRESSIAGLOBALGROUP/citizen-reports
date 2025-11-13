import React, { createContext, useState, useEffect, useCallback } from 'react';
import { DEFAULT_WHITELABEL_CONFIG, cargarConfiguracionWhiteLabel } from './WhiteLabelConfig.jsx';

// Crear contexto global para whitelabel
export const WhiteLabelContext = createContext();

export function WhiteLabelProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_WHITELABEL_CONFIG);
  const [loading, setLoading] = useState(true);

  // Cargar configuración inicial
  useEffect(() => {
    cargarConfiguracionWhiteLabel()
      .then(cfg => {
        // Si la API retorna un objeto vacío, usar el default
        if (cfg && Object.keys(cfg).length > 0) {
          setConfig(cfg);
        }
      })
      .catch(e => console.error('Error cargando config inicial:', e))
      .finally(() => setLoading(false));
  }, []);

  // Función para actualizar config (usada cuando el admin guarda cambios)
  const actualizarConfig = useCallback((nuevoConfig) => {
    setConfig(nuevoConfig);
  }, []);

  // Función para recargar config desde servidor
  const recargarConfig = useCallback(async () => {
    try {
      const nuevaConfig = await cargarConfiguracionWhiteLabel();
      setConfig(nuevaConfig);
      return nuevaConfig;
    } catch (e) {
      console.error('Error recargando config:', e);
      throw e;
    }
  }, []);

  // Escuchar evento de actualización desde WhiteLabelConfig
  useEffect(() => {
    const handleUpdate = (event) => {
      setConfig(event.detail);
    };
    
    window.addEventListener('whitelabel-updated', handleUpdate);
    return () => window.removeEventListener('whitelabel-updated', handleUpdate);
  }, []);

  // Polling: Recargar config cada 3 segundos cuando hay cambios
  // (para detectar si otro admin cambió la config)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const nuevaConfig = await cargarConfiguracionWhiteLabel();
        // Solo actualizar si cambió y tiene datos válidos
        if (nuevaConfig && Object.keys(nuevaConfig).length > 0 && 
            JSON.stringify(nuevaConfig) !== JSON.stringify(config)) {
          setConfig(nuevaConfig);
        }
      } catch (e) {
        // Silenciar errores de polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [config]);

  return (
    <WhiteLabelContext.Provider value={{ config, loading, actualizarConfig, recargarConfig }}>
      {children}
    </WhiteLabelContext.Provider>
  );
}

// Hook para usar el contexto
export function useWhiteLabel() {
  const context = React.useContext(WhiteLabelContext);
  if (!context) {
    throw new Error('useWhiteLabel debe usarse dentro de WhiteLabelProvider');
  }
  return context;
}
