import React, { useState, useEffect } from 'react';
import { DEFAULT_WHITELABEL_CONFIG, cargarConfiguracionWhiteLabel } from './WhiteLabelConfig.jsx';

export default function ProfessionalTopBar({ 
  currentView, 
  usuario, 
  onNavigate, 
  onLogout, 
  onLoginClick 
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [config, setConfig] = useState(DEFAULT_WHITELABEL_CONFIG);

  // Cargar configuración WhiteLabel al montar
  useEffect(() => {
    cargarConfiguracionWhiteLabel()
      .then(setConfig)
      .catch(e => console.error('Error cargando config:', e));
  }, []);

  const buttonStyle = (isActive) => ({
    padding: '8px 16px',
    backgroundColor: isActive ? config.colores.primario : 'transparent',
    color: isActive ? 'white' : config.colores.textoSecundario,
    border: '1px solid transparent',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: isActive ? '600' : '500',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  });

  const inactiveHover = (e) => {
    if (e.target.dataset.active !== 'true') {
      e.target.style.backgroundColor = config.colores.fondoAlt;
      e.target.style.color = config.colores.textoPrimario;
    }
  };

  const inactiveLeave = (e) => {
    if (e.target.dataset.active !== 'true') {
      e.target.style.backgroundColor = 'transparent';
      e.target.style.color = config.colores.textoSecundario;
    }
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      padding: '0',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1999
    }}>
      {/* TOP ROW: Logo + Municipio + Info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 20px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        {/* Left: Logo + Municipality */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {/* Escudo/Logo */}
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: config.colores.primario,
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '18px',
            overflow: 'hidden'
          }}>
            {config.assets.escudoUrl ? 
              <img src={config.assets.escudoUrl} alt="Escudo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> 
              : config.assets.escudoAlt}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '700',
              color: config.colores.primario,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              H. AYUNTAMIENTO
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: '700',
              color: config.colores.textoPrimario
            }}>
              {config.municipioNombre}, {config.estado}
            </div>
            <div style={{
              fontSize: '11px',
              color: config.colores.textoSecundario
            }}>
              Sistema de Reportes Ciudadanos • {config.plataforma}
            </div>
          </div>
        </div>

        {/* Right: User Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          position: 'relative'
        }}>
          {usuario ? (
            <>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '2px'
              }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: config.colores.textoPrimario
                }}>
                  {usuario.nombre || usuario.email?.split('@')[0]}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: config.colores.textoSecundario,
                  textTransform: 'capitalize'
                }}>
                  {usuario.rol === 'admin' ? 'Administrador' : 
                   usuario.rol === 'supervisor' ? 'Supervisor' : 
                   'Funcionario'} • {usuario.dependencia}
                </div>
              </div>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: config.colores.fondoAlt,
                  border: `1px solid ${config.colores.borde}`,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = config.colores.borde}
                onMouseLeave={(e) => e.target.style.backgroundColor = config.colores.fondoAlt}
              >
                👤
              </button>
              {showUserMenu && (
                <div style={{
                  position: 'absolute',
                  top: '48px',
                  right: '0',
                  backgroundColor: config.colores.fondo,
                  border: `1px solid ${config.colores.borde}`,
                  borderRadius: '4px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  minWidth: '160px',
                  zIndex: 2000
                }}>
                  <button
                    onClick={onLogout}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'transparent',
                      color: config.colores.critica,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#fef2f2'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={onLoginClick}
              style={{
                ...buttonStyle(false),
                backgroundColor: config.colores.exito,
                color: 'white',
                border: `1px solid ${config.colores.exito}`,
                fontWeight: '600'
              }}
              onMouseEnter={(e) => {
                e.target.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = '1';
              }}
            >
              Iniciar Sesión
            </button>
          )}
        </div>
      </div>

      {/* BOTTOM ROW: Navigation - 100% Responsive */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
        gap: '2px',
        padding: 'clamp(6px, 2vw, 8px) clamp(12px, 4vw, 20px)',
        backgroundColor: '#f9fafb',
        width: '100%',
        alignItems: 'center'
      }}>
        <button
          onClick={() => onNavigate('map')}
          data-active={currentView === 'map'}
          style={{
            padding: 'clamp(6px, 1.5vw, 8px) clamp(8px, 2vw, 16px)',
            backgroundColor: currentView === 'map' ? config.colores.primario : 'transparent',
            color: currentView === 'map' ? 'white' : config.colores.textoSecundario,
            border: '1px solid transparent',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: 'clamp(11px, 2.5vw, 14px)',
            fontWeight: currentView === 'map' ? '600' : '500',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            minWidth: '0',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          onMouseEnter={inactiveHover}
          onMouseLeave={inactiveLeave}
        >
          Mapa
        </button>

        <button
          onClick={() => onNavigate('form')}
          data-active={currentView === 'form'}
          style={{
            padding: 'clamp(6px, 1.5vw, 8px) clamp(8px, 2vw, 16px)',
            backgroundColor: currentView === 'form' ? config.colores.primario : 'transparent',
            color: currentView === 'form' ? 'white' : config.colores.textoSecundario,
            border: '1px solid transparent',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: 'clamp(11px, 2.5vw, 14px)',
            fontWeight: currentView === 'form' ? '600' : '500',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            minWidth: '0',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          onMouseEnter={inactiveHover}
          onMouseLeave={inactiveLeave}
        >
          Nuevo Reporte
        </button>

        {usuario && (
          <button
            onClick={() => onNavigate('panel')}
            data-active={currentView === 'panel'}
            style={{
              padding: 'clamp(6px, 1.5vw, 8px) clamp(8px, 2vw, 16px)',
              backgroundColor: currentView === 'panel' ? config.colores.primario : 'transparent',
              color: currentView === 'panel' ? 'white' : config.colores.textoSecundario,
              border: '1px solid transparent',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: 'clamp(11px, 2.5vw, 14px)',
              fontWeight: currentView === 'panel' ? '600' : '500',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              minWidth: '0',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            onMouseEnter={inactiveHover}
            onMouseLeave={inactiveLeave}
          >
            Mi Panel
          </button>
        )}

        {usuario?.rol === 'admin' && (
          <button
            onClick={() => onNavigate('admin')}
            data-active={currentView === 'admin'}
            style={{
              padding: 'clamp(6px, 1.5vw, 8px) clamp(8px, 2vw, 16px)',
              backgroundColor: currentView === 'admin' ? '#dc2626' : 'transparent',
              color: currentView === 'admin' ? 'white' : '#4b5563',
              border: '1px solid transparent',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: 'clamp(11px, 2.5vw, 14px)',
              fontWeight: currentView === 'admin' ? '600' : '500',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              minWidth: '0',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            onMouseEnter={inactiveHover}
            onMouseLeave={inactiveLeave}
          >
            Administración
          </button>
        )}

        {/* Spacer */}
        <div style={{ flex: 1, display: usuario ? 'block' : 'none' }} />

        {/* User Section */}
        {usuario && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(2px, 1vw, 2px)',
            paddingLeft: 'clamp(6px, 2vw, 12px)',
            borderLeft: '1px solid #d1d5db',
            minWidth: '0',
            overflow: 'hidden'
          }}>
            <span style={{
              fontSize: 'clamp(10px, 2vw, 12px)',
              color: '#6b7280',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {usuario.email?.split('@')[0]} •
            </span>
            <button
              onClick={onLogout}
              style={{
                backgroundColor: 'transparent',
                color: '#ef4444',
                border: '1px solid transparent',
                borderRadius: '3px',
                cursor: 'pointer',
                padding: 'clamp(4px, 1.5vw, 4px) clamp(4px, 1.5vw, 8px)',
                fontSize: 'clamp(10px, 2vw, 13px)',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#fef2f2';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
