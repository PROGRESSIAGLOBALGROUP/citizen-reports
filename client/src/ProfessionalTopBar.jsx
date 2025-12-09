import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { DEFAULT_WHITELABEL_CONFIG } from './WhiteLabelConfig.jsx';
import { useWhiteLabel } from './WhiteLabelContext.jsx';
import './gobierno-premium-panel.css';

export default function ProfessionalTopBar({ 
  currentView, 
  usuario, 
  onNavigate, 
  onLogout, 
  onLoginClick 
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrollDirection, setScrollDirection] = useState('down');
  const [lastScrollY, setLastScrollY] = useState(0);

  // Obtener config del contexto global
  const { config } = useWhiteLabel();

  // Efecto de scroll (opcional para efecto hide/show en desktop)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY) {
        setScrollDirection('down');
      } else {
        setScrollDirection('up');
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // === ESTILOS DE CLASE MUNDIAL ===
  
  const containerStyle = {
    background: `linear-gradient(135deg, ${config.colores.primario} 0%, ${config.colores.secundario || config.colores.primario} 100%)`,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    padding: '0',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1999,
    position: 'relative',
    overflow: 'visible'
  };

  const topRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'clamp(10px, 3vw, 16px) clamp(14px, 5vw, 24px)',
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(8px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    gap: '16px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    flex: '0 0 auto'
  };

  const brandContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flex: 1,
    minWidth: 0
  };

  const escudoStyle = {
    width: 'clamp(44px, 8vw, 56px)',
    height: 'clamp(44px, 8vw, 56px)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 'clamp(20px, 4vw, 28px)',
    overflow: 'hidden',
    backdropFilter: 'blur(4px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    flexShrink: 0,
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%)'
  };

  const brandTextStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    minWidth: 0,
    flex: 1
  };

  const eyebrowStyle = {
    fontSize: 'clamp(10px, 2.5vw, 12px)',
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  };

  const municipioStyle = {
    fontSize: 'clamp(14px, 3vw, 18px)',
    fontWeight: '700',
    color: 'white',
    lineHeight: '1.2',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  };

  const subtitleStyle = {
    fontSize: 'clamp(10px, 2vw, 12px)',
    color: 'rgba(255, 255, 255, 0.75)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  };

  const userSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(10px, 3vw, 16px)',
    position: 'relative',
    flexShrink: 0
  };

  const userInfoStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
    minWidth: 0,
    maxWidth: '200px'
  };

  const userNameStyle = {
    fontSize: 'clamp(12px, 2.5vw, 14px)',
    fontWeight: '600',
    color: 'white',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
  };

  const userRoleStyle = {
    fontSize: 'clamp(10px, 2vw, 12px)',
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'capitalize',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  };

  const avatarButtonStyle = {
    width: '40px',
    height: '40px',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    border: '1.5px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(4px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    flexShrink: 0,
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%)',
    fontWeight: 'bold'
  };

  const menuStyle = {
    position: 'fixed',
    top: '60px',
    right: '24px',
    backgroundColor: 'white',
    border: `1px solid ${config.colores.borde}`,
    borderRadius: '8px',
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
    minWidth: '180px',
    zIndex: 10000,
    overflow: 'hidden',
    animation: 'slideDown 0.2s ease-out'
  };

  const navRowStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: '8px',
    padding: 'clamp(8px, 2vw, 12px) clamp(12px, 4vw, 20px)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(8px)',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    width: '100%',
    alignItems: 'center',
    flex: '0 0 auto',
    transition: 'all 0.3s ease'
  };

  const navButtonStyle = (isActive) => ({
    padding: 'clamp(8px, 2vw, 10px) clamp(10px, 2.5vw, 14px)',
    backgroundColor: isActive 
      ? 'rgba(255, 255, 255, 0.25)' 
      : 'rgba(255, 255, 255, 0)',
    color: isActive ? 'white' : 'rgba(255, 255, 255, 0.85)',
    border: isActive 
      ? '1px solid rgba(255, 255, 255, 0.3)' 
      : '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: 'clamp(11px, 2.5vw, 13px)',
    fontWeight: isActive ? '600' : '500',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    minWidth: '0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    boxShadow: isActive ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none',
    backdropFilter: 'blur(4px)',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    background: isActive
      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.05) 100%)'
  });

  // === ANIMACIONES CSS ===
  const styleTag = (
    <style>{`
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      .header-container {
        animation: gradientShift 8s ease infinite;
        background-size: 200% 200%;
      }

      button:hover {
        transform: translateY(-1px) scale(1.02);
      }

      button:active {
        transform: translateY(0) scale(0.98);
      }

      @media (max-width: 768px) {
        .nav-row {
          gap: 4px !important;
          padding: 6px 8px !important;
        }
      }
    `}</style>
  );

  // === RETORNO ===
  return (
    <>
      {styleTag}
      <div style={containerStyle} className="header-container">
        {/* TOP ROW: Logo + Municipio + User Info */}
        <div style={topRowStyle}>
          {/* Brand Section */}
          <div style={brandContainerStyle}>
            <div style={escudoStyle}>
              {config.assets.escudoUrl ? 
                <img src={config.assets.escudoUrl} alt="Escudo" className="gp-escudo-img" /> 
                : config.assets.escudoAlt}
            </div>
            <div style={brandTextStyle}>
              <div style={eyebrowStyle}>H. AYUNTAMIENTO</div>
              <div style={municipioStyle}>{config.municipioNombre}</div>
              <div style={subtitleStyle}>{config.estado}</div>
            </div>
          </div>

          {/* User Section */}
          <div style={userSectionStyle}>
            {usuario ? (
              <>
                <div style={userInfoStyle}>
                  <div style={userNameStyle}>
                    {usuario.nombre || usuario.email?.split('@')[0]}
                  </div>
                  <div style={userRoleStyle}>
                    {usuario.rol === 'admin' ? 'Administrador' : 
                     usuario.rol === 'supervisor' ? 'Supervisor' : 
                     'Funcionario'}
                  </div>
                </div>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  style={avatarButtonStyle}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                    e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  👤
                </button>
                {showUserMenu && ReactDOM.createPortal(
                  <>
                    <div 
                      className="gp-user-menu-backdrop"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div style={menuStyle}>
                      <button
                        onClick={onLogout}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          backgroundColor: 'transparent',
                          color: config.colores.critica,
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          textAlign: 'left',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#fef2f2';
                          e.target.style.paddingLeft = '16px';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.paddingLeft = '14px';
                        }}
                      >
                        🚪 Cerrar Sesión
                      </button>
                    </div>
                  </>,
                  document.body
                )}
              </>
            ) : (
              <button
                onClick={onLoginClick}
                style={{
                  ...navButtonStyle(false),
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  color: 'white',
                  border: '1.5px solid rgba(255, 255, 255, 0.4)',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  padding: '10px 14px',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.35)';
                  e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
              >
                🔐 Iniciar Sesión
              </button>
            )}
          </div>
        </div>

        {/* NAV ROW: Navigation Buttons */}
        <div style={navRowStyle} className="nav-row">
          <button
            onClick={() => onNavigate('map')}
            style={navButtonStyle(currentView === 'map')}
            onMouseEnter={(e) => {
              if (currentView !== 'map') {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                e.target.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (currentView !== 'map') {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0)';
                e.target.style.color = 'rgba(255, 255, 255, 0.85)';
              }
            }}
          >
            🗺️ Mapa
          </button>

          <button
            onClick={() => onNavigate('form')}
            style={navButtonStyle(currentView === 'form')}
            onMouseEnter={(e) => {
              if (currentView !== 'form') {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                e.target.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (currentView !== 'form') {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0)';
                e.target.style.color = 'rgba(255, 255, 255, 0.85)';
              }
            }}
          >
            📋 Nuevo Reporte
          </button>

          {usuario && (
            <button
              onClick={() => onNavigate('panel')}
              style={navButtonStyle(currentView === 'panel')}
              onMouseEnter={(e) => {
                if (currentView !== 'panel') {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (currentView !== 'panel') {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0)';
                  e.target.style.color = 'rgba(255, 255, 255, 0.85)';
                }
              }}
            >
              📊 Mi Panel
            </button>
          )}

          {usuario?.rol === 'admin' && (
            <button
              onClick={() => onNavigate('admin')}
              style={{
                ...navButtonStyle(currentView === 'admin'),
                color: currentView === 'admin' ? 'white' : 'rgba(255, 255, 255, 0.9)'
              }}
              onMouseEnter={(e) => {
                if (currentView !== 'admin') {
                  e.target.style.backgroundColor = 'rgba(255, 100, 100, 0.2)';
                  e.target.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (currentView !== 'admin') {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0)';
                  e.target.style.color = 'rgba(255, 255, 255, 0.85)';
                }
              }}
            >
              ⚙️ Administración
            </button>
          )}
        </div>
      </div>
    </>
  );
}
