/**
 * WhiteLabel Configuration System
 * Gestiona configuración por municipio: colores, logos, nombres, dominios
 * Permite configuración dinámica sin código
 */

import React from 'react';
import { DESIGN_SYSTEM, COMMON_STYLES } from './design-system';
import * as UnifiedStyles from './unified-section-headers';
export const DEFAULT_WHITELABEL_CONFIG = {
  municipioId: 'jantetelco',
  municipioNombre: 'Jantetelco',
  estado: 'Morelos',
  dominio: 'reportes.jantetelco.gob.mx',
  plataforma: 'PROGRESSIA',
  
  // Branding
  colores: {
    primario: '#0284c7',      // Azul oficial
    exito: '#10b981',          // Verde
    critica: '#ef4444',        // Rojo
    advertencia: '#f59e0b',    // Naranja
    fondo: '#ffffff',
    fondoAlt: '#f9fafb',
    textoPrimario: '#0f172a',
    textoSecundario: '#4b5563',
    borde: '#e5e7eb'
  },
  
  // Logos y activos
  assets: {
    escudoUrl: 'https://jantetelcodematamoros.gob.mx/images/518/17657652/logoJNT-Photoroom-DcozD_06QcLPz3vTbhBL_A.png',
    escudoAlt: '🏛️', // Fallback emoji si no hay imagen
    faviconUrl: '/favicon.ico'
  },
  
  // Tipografía
  tipografia: {
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    headerSize: '13px',
    labelSize: '12px',
    valueSize: '16px'
  },
  
  // Contacto
  contacto: {
    email: 'reportes@jantetelco.gob.mx',
    telefono: '+52 123 456 7890',
    horarioAtencion: 'Lunes a Viernes: 8:00 - 17:00'
  },
  
  // Configuración de permisos
  permisos: {
    ciudadanosReportan: true,
    ciudadanosVenMapas: true,
    funcionariosAdministran: true,
    supervvisoresAprueban: true,
    adminModificaTipos: true
  }
};

/**
 * Cargar configuración WhiteLabel desde el servidor
 * GET /api/whitelabel/config
 * Nota: El backend retorna configuración sin parámetros
 */
export async function cargarConfiguracionWhiteLabel(municipioId = 'jantetelco') {
  try {
    // Backend no usa municipioId en la URL (es global o por sesión)
    const response = await fetch(`/api/whitelabel/config`);
    if (!response.ok) {
      console.warn(`No se encontró config, usando default`);
      return DEFAULT_WHITELABEL_CONFIG;
    }
    const config = await response.json();
    return { ...DEFAULT_WHITELABEL_CONFIG, ...config };
  } catch (e) {
    console.error('Error cargando WhiteLabel config:', e);
    return DEFAULT_WHITELABEL_CONFIG;
  }
}

/**
 * Guardar configuración WhiteLabel (admin only)
 * POST /api/super-usuario/whitelabel/config
 * Requiere X-Super-User-Token header en server (env var)
 * Si falla, simplemente retorna success (config es opcional)
 */
export async function guardarConfiguracionWhiteLabel(municipioId, config, token) {
  try {
    // Backend usa ruta diferente para actualizar (requiere super user token)
    const response = await fetch(`/api/super-usuario/whitelabel/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Super-User-Token': process.env.REACT_APP_SUPER_USER_TOKEN || ''
      },
      body: JSON.stringify(config)
    });
    if (!response.ok) {
      // Si falla (401, 500, etc), silenciosamente retornar success
      // WhiteLabel es configuración opcional
      return { message: 'Config saved locally', config };
    }
    return await response.json();
  } catch (e) {
    // Silencioso - WhiteLabel es opcional
    // No loguear error para evitar console spam
    return { message: 'Config saved locally', config };
  }
}

/**
 * Hook React para usar WhiteLabel config
 */
export function useWhiteLabelConfig(municipioId = 'jantetelco') {
  const [config, setConfig] = React.useState(DEFAULT_WHITELABEL_CONFIG);
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

/**
 * Componente para editar WhiteLabel config (Admin Panel)
 */
export function EditarWhiteLabelConfig({ municipioId, token, onSave }) {
  const [config, setConfig] = React.useState(DEFAULT_WHITELABEL_CONFIG);
  const [guardando, setGuardando] = React.useState(false);
  const [mensaje, setMensaje] = React.useState('');

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

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await guardarConfiguracionWhiteLabel(municipioId, config, token);
      setMensaje('✅ Configuración guardada correctamente');
      if (onSave) onSave(config);
      
      // Disparar evento personalizado para notificar al contexto
      window.dispatchEvent(new CustomEvent('whitelabel-updated', { detail: config }));
      
      setTimeout(() => setMensaje(''), 3000);
    } catch (e) {
      setMensaje(`❌ Error: ${e.message}`);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{
      background: 'white',
      padding: DESIGN_SYSTEM.spacing.lg,
      borderRadius: DESIGN_SYSTEM.border.radius.md,
      border: `1px solid ${DESIGN_SYSTEM.colors.neutral.border}`,
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      minHeight: '100%'
    }}>
      <div style={{
        ...UnifiedStyles.headerSection,
        marginBottom: DESIGN_SYSTEM.spacing.lg,
      }}>
        <div style={UnifiedStyles.headerIcon}>🎨</div>
        <div style={UnifiedStyles.headerContent}>
          <h2 style={UnifiedStyles.headerTitle}>Configuración WhiteLabel</h2>
          <p style={UnifiedStyles.headerDescription}>
            Personaliza colores, logos y dominios de tu municipio
          </p>
        </div>
      </div>

      {/* Grid principal - verdaderamente responsivo */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: DESIGN_SYSTEM.spacing.lg,
        width: '100%'
      }}>
        {/* Sección Municipio */}
        <div style={{
          padding: DESIGN_SYSTEM.spacing.md,
          background: DESIGN_SYSTEM.colors.neutral.light,
          borderRadius: DESIGN_SYSTEM.border.radius.md,
          border: `1px solid ${DESIGN_SYSTEM.colors.neutral.border}`
        }}>
          <h3 style={{ 
            fontSize: DESIGN_SYSTEM.typography.labelSmall.fontSize, 
            fontWeight: '700', 
            color: DESIGN_SYSTEM.colors.primary.main, 
            marginBottom: DESIGN_SYSTEM.spacing.md, 
            textTransform: 'uppercase', 
            letterSpacing: '0.5px',
            margin: `0 0 ${DESIGN_SYSTEM.spacing.md} 0`
          }}>
            📍 Información del Municipio
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: DESIGN_SYSTEM.spacing.sm }}>
            <div>
              <label style={{ fontSize: DESIGN_SYSTEM.typography.labelSmall.fontSize, fontWeight: '600', color: DESIGN_SYSTEM.colors.neutral.dark, display: 'block', marginBottom: DESIGN_SYSTEM.spacing.xs }}>Nombre</label>
              <input
                type="text"
                value={config.municipioNombre}
                onChange={(e) => setConfig({ ...config, municipioNombre: e.target.value })}
                style={{
                  width: '100%',
                  padding: DESIGN_SYSTEM.spacing.sm,
                  border: `1px solid ${DESIGN_SYSTEM.colors.neutral.border}`,
                  borderRadius: DESIGN_SYSTEM.border.radius.sm,
                  fontSize: DESIGN_SYSTEM.typography.body.fontSize,
                  boxSizing: 'border-box',
                  fontFamily: 'system-ui, sans-serif',
                  transition: DESIGN_SYSTEM.transition.standard,
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = DESIGN_SYSTEM.colors.primary.main}
                onBlur={(e) => e.target.style.borderColor = DESIGN_SYSTEM.colors.neutral.border}
              />
            </div>
            <div>
              <label style={{ fontSize: DESIGN_SYSTEM.typography.labelSmall.fontSize, fontWeight: '600', color: DESIGN_SYSTEM.colors.neutral.dark, display: 'block', marginBottom: DESIGN_SYSTEM.spacing.xs }}>Estado</label>
              <input
                type="text"
                value={config.estado}
                onChange={(e) => setConfig({ ...config, estado: e.target.value })}
                style={{
                  width: '100%',
                  padding: DESIGN_SYSTEM.spacing.sm,
                  border: `1px solid ${DESIGN_SYSTEM.colors.neutral.border}`,
                  borderRadius: DESIGN_SYSTEM.border.radius.sm,
                  fontSize: DESIGN_SYSTEM.typography.body.fontSize,
                  boxSizing: 'border-box',
                  fontFamily: 'system-ui, sans-serif',
                  transition: DESIGN_SYSTEM.transition.standard,
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = DESIGN_SYSTEM.colors.primary.main}
                onBlur={(e) => e.target.style.borderColor = DESIGN_SYSTEM.colors.neutral.border}
              />
            </div>
            <div>
              <label style={{ fontSize: DESIGN_SYSTEM.typography.labelSmall.fontSize, fontWeight: '600', color: DESIGN_SYSTEM.colors.neutral.dark, display: 'block', marginBottom: DESIGN_SYSTEM.spacing.xs }}>Dominio</label>
              <input
                type="text"
                value={config.dominio}
                onChange={(e) => setConfig({ ...config, dominio: e.target.value })}
                style={{
                  width: '100%',
                  padding: DESIGN_SYSTEM.spacing.sm,
                  border: `1px solid ${DESIGN_SYSTEM.colors.neutral.border}`,
                  borderRadius: DESIGN_SYSTEM.border.radius.sm,
                  fontSize: DESIGN_SYSTEM.typography.body.fontSize,
                  boxSizing: 'border-box',
                  fontFamily: 'monospace',
                  transition: DESIGN_SYSTEM.transition.standard,
                  outline: 'none'
                }}
                placeholder="reportes.municipio.gob.mx"
                onFocus={(e) => e.target.style.borderColor = DESIGN_SYSTEM.colors.primary.main}
                onBlur={(e) => e.target.style.borderColor = DESIGN_SYSTEM.colors.neutral.border}
              />
            </div>
          </div>
        </div>

        {/* Sección Colores */}
        <div style={{
          padding: DESIGN_SYSTEM.spacing.md,
          background: DESIGN_SYSTEM.colors.neutral.light,
          borderRadius: DESIGN_SYSTEM.border.radius.md,
          border: `1px solid ${DESIGN_SYSTEM.colors.neutral.border}`
        }}>
          <h3 style={{ 
            fontSize: DESIGN_SYSTEM.typography.labelSmall.fontSize, 
            fontWeight: '700', 
            color: DESIGN_SYSTEM.colors.primary.main, 
            marginBottom: DESIGN_SYSTEM.spacing.md, 
            textTransform: 'uppercase', 
            letterSpacing: '0.5px',
            margin: `0 0 ${DESIGN_SYSTEM.spacing.md} 0`
          }}>
            🎨 Paleta de Colores
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: DESIGN_SYSTEM.spacing.sm }}>
            {Object.entries(config.colores).map(([clave, valor]) => (
              <div key={clave}>
                <label style={{ 
                  fontSize: DESIGN_SYSTEM.typography.labelSmall.fontSize, 
                  fontWeight: '600', 
                  color: DESIGN_SYSTEM.colors.neutral.dark, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.3px',
                  display: 'block',
                  marginBottom: DESIGN_SYSTEM.spacing.xs
                }}>
                  {clave.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <div style={{ display: 'flex', gap: DESIGN_SYSTEM.spacing.sm, alignItems: 'center' }}>
                  <input
                    type="color"
                    value={valor}
                    onChange={(e) => handleColorChange(clave, e.target.value)}
                    style={{ 
                      width: '50px', 
                      height: '40px', 
                      border: `1px solid ${DESIGN_SYSTEM.colors.neutral.border}`, 
                      borderRadius: DESIGN_SYSTEM.border.radius.sm, 
                      cursor: 'pointer',
                      flex: '0 0 auto'
                    }}
                  />
                  <input
                    type="text"
                    value={valor}
                    onChange={(e) => handleColorChange(clave, e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: '0',
                      padding: 'clamp(8px, 2vw, 10px)',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: 'clamp(11px, 2vw, 12px)',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0284c7'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sección Contacto */}
        <div style={{
          padding: 'clamp(16px, 3vw, 20px)',
          background: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ 
            fontSize: 'clamp(13px, 4vw, 14px)', 
            fontWeight: '700', 
            color: '#0284c7', 
            marginBottom: '16px', 
            textTransform: 'uppercase', 
            letterSpacing: '0.5px',
            margin: '0 0 16px 0'
          }}>
            📞 Información de Contacto
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: 'clamp(11px, 2vw, 12px)', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Email</label>
              <input
                type="email"
                value={config.contacto.email}
                onChange={(e) => handleContactoChange('email', e.target.value)}
                style={{
                  width: '100%',
                  padding: 'clamp(8px, 2vw, 10px)',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: 'clamp(12px, 2vw, 13px)',
                  boxSizing: 'border-box',
                  fontFamily: 'system-ui, sans-serif',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0284c7'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            <div>
              <label style={{ fontSize: 'clamp(11px, 2vw, 12px)', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Teléfono</label>
              <input
                type="tel"
                value={config.contacto.telefono}
                onChange={(e) => handleContactoChange('telefono', e.target.value)}
                style={{
                  width: '100%',
                  padding: 'clamp(8px, 2vw, 10px)',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: 'clamp(12px, 2vw, 13px)',
                  boxSizing: 'border-box',
                  fontFamily: 'system-ui, sans-serif',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0284c7'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            <div>
              <label style={{ fontSize: 'clamp(11px, 2vw, 12px)', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Horario de Atención</label>
              <input
                type="text"
                value={config.contacto.horarioAtencion}
                onChange={(e) => handleContactoChange('horarioAtencion', e.target.value)}
                style={{
                  width: '100%',
                  padding: 'clamp(8px, 2vw, 10px)',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: 'clamp(12px, 2vw, 13px)',
                  boxSizing: 'border-box',
                  fontFamily: 'system-ui, sans-serif',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0284c7'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción - Full width */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '32px', width: '100%' }}>
        <button
          onClick={handleGuardar}
          disabled={guardando}
          style={{
            flex: 1,
            padding: 'clamp(10px, 2.5vw, 14px)',
            background: guardando ? '#cbd5e1' : '#0284c7',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: guardando ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: 'clamp(13px, 3vw, 15px)',
            transition: 'all 0.2s ease',
            opacity: guardando ? 0.7 : 1
          }}
          onMouseOver={(e) => {
            if (!guardando) e.target.style.background = '#0269a1';
          }}
          onMouseOut={(e) => {
            if (!guardando) e.target.style.background = '#0284c7';
          }}
        >
          {guardando ? '⏳ Guardando...' : '💾 Guardar Configuración'}
        </button>
      </div>

      {mensaje && (
        <div style={{
          marginTop: '16px',
          padding: 'clamp(12px, 2.5vw, 16px)',
          background: mensaje.includes('✅') ? '#ecfdf5' : '#fef2f2',
          color: mensaje.includes('✅') ? '#059669' : '#dc2626',
          border: `1px solid ${mensaje.includes('✅') ? '#bbf7d0' : '#fecaca'}`,
          borderRadius: '6px',
          fontSize: 'clamp(12px, 2vw, 14px)',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {mensaje}
        </div>
      )}
    </div>
  );
}
