import React, { useState, useEffect } from 'react';
import AppHeader from './AppHeader.jsx';
import ImprovedMapView from './ImprovedMapView.jsx';
import ReportForm from './ReportForm.jsx';
import LoginModal from './LoginModal.jsx';
import PanelFuncionario from './PanelFuncionario.jsx';
import AdminPanel from './AdminPanel.jsx';
import SuperUserPanel from './SuperUserPanel.jsx';
import VerReporte from './VerReporte.jsx';

export default function App() {
  const [currentView, setCurrentView] = useState('map'); // 'map', 'form', 'panel', 'admin', 'super-user', 'ver-reporte'
  const [usuario, setUsuario] = useState(null);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [reporteIdActual, setReporteIdActual] = useState(null);
  const [superUserToken, setSuperUserToken] = useState(localStorage.getItem('super_user_token'));

  // Verificar sesión al cargar
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const usuarioGuardado = localStorage.getItem('usuario');
    
    if (token && usuarioGuardado) {
      try {
        const parsed = JSON.parse(usuarioGuardado);
        setUsuario(parsed);
        
        // Verificar si el token sigue siendo válido
        fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => {
          if (!res.ok) {
            // Token inválido, limpiar
            localStorage.removeItem('auth_token');
            localStorage.removeItem('usuario');
            setUsuario(null);
          }
        }).catch(() => {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('usuario');
          setUsuario(null);
        });
      } catch (e) {
        console.error('Error parsing usuario:', e);
      }
    }
  }, []);

  // Simple routing basado en hash de URL
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#reportar') {
        setCurrentView('form');
      } else if (hash === '#panel') {
        if (usuario) {
          setCurrentView('panel');
        } else {
          setMostrarLogin(true);
          window.location.hash = '';
        }
      } else if (hash.startsWith('#reporte/')) {
        const id = hash.replace('#reporte/', '');
        setReporteIdActual(id);
        setCurrentView('ver-reporte');
      } else if (hash === '#admin') {
        if (usuario && usuario.rol === 'admin') {
          setCurrentView('admin');
        } else {
          setMostrarLogin(true);
          window.location.hash = '';
        }
      } else if (hash === '#admin/categorias') {
        if (usuario && usuario.rol === 'admin') {
          setCurrentView('admin-categorias');
        } else {
          setMostrarLogin(true);
          window.location.hash = '';
        }
      } else if (hash === '#admin/dependencias') {
        if (usuario && usuario.rol === 'admin') {
          setCurrentView('admin-dependencias');
        } else {
          setMostrarLogin(true);
          window.location.hash = '';
        }
      } else if (hash === '#super-user') {
        // Solo accesible si tienes token de super usuario
        if (superUserToken) {
          setCurrentView('super-user');
        } else {
          const token = prompt('🔐 Ingresa el token de super usuario:');
          if (token) {
            localStorage.setItem('super_user_token', token);
            setSuperUserToken(token);
            setCurrentView('super-user');
          } else {
            window.location.hash = '';
          }
        }
      } else {
        setCurrentView('map');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [usuario, superUserToken]);

  const navigateToMap = () => {
    window.location.hash = '';
    setCurrentView('map');
  };

  const navigateToForm = () => {
    window.location.hash = '#reportar';
    setCurrentView('form');
  };

  const navigateToPanel = () => {
    if (usuario) {
      window.location.hash = '#panel';
      setCurrentView('panel');
    } else {
      setMostrarLogin(true);
    }
  };

  const navigateToAdmin = () => {
    if (usuario && usuario.rol === 'admin') {
      window.location.hash = '#admin';
      setCurrentView('admin');
    } else {
      setMostrarLogin(true);
    }
  };

  const handleLoginSuccess = (usuarioData) => {
    setUsuario(usuarioData);
    setMostrarLogin(false);
    navigateToPanel();
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {
        console.error('Error en logout:', e);
      }
    }
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('usuario');
    setUsuario(null);
    navigateToMap();
  };

  // Barra de navegación - OPTIMIZADA PARA MÓVIL
  const renderNavigation = () => (
    <div className="top-bar" style={{
      position: 'static',
      height: '50px',
      zIndex: 1999,
      backgroundColor: 'white',
      borderBottom: '2px solid #e5e7eb',
      padding: '0',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'stretch',
      gap: '0',
      margin: '0'
    }}>
      {/* MÓVIL: Botones grandes de navegación */}
      <div style={{ display: 'flex', gap: '0', alignItems: 'stretch', flex: '1' }}>
      <button
        onClick={navigateToMap}
        style={{
          flex: '1 1 auto',
          padding: '0',
          backgroundColor: currentView === 'map' ? '#3b82f6' : '#f3f4f6',
          color: currentView === 'map' ? 'white' : '#374151',
          border: 'none',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          borderRadius: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          minWidth: '0',
          whiteSpace: 'nowrap',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <span style={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          animation: 'shimmer 2s infinite'
        }} />
        🗺️ Mapa
      </button>
      
      <button
        onClick={navigateToForm}
        style={{
          flex: '1 1 auto',
          padding: '0 8px',
          backgroundColor: currentView === 'form' ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : '#f8fafc',
          color: currentView === 'form' ? 'white' : '#1e293b',
          border: 'none',
          fontSize: '18px',
          fontWeight: '800',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          borderRadius: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          minWidth: '0',
          whiteSpace: 'nowrap',
          borderLeft: '2px solid #e2e8f0',
          borderRight: '2px solid #e2e8f0',
          boxShadow: currentView === 'form' ? '0 4px 12px rgba(139, 92, 246, 0.4)' : 'none',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <span style={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: currentView === 'form' ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' : 'transparent',
          animation: currentView === 'form' ? 'shimmer 2s infinite' : 'none'
        }} />
        📝 Reportar
      </button>

      {/* Botón de Login/Panel/Usuario */}
      {!usuario ? (
        <button
          onClick={() => setMostrarLogin(true)}
          style={{
            flex: '1 1 auto',
            padding: '0 12px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            border: 'none',
            fontSize: '18px',
            fontWeight: '900',
            cursor: 'pointer',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            borderRadius: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            minWidth: '0',
            whiteSpace: 'nowrap',
            borderLeft: '3px solid #047857',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.target.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.6)';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.4)';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          <span style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            animation: 'shimmer 2s infinite'
          }} />
          🔐 Inicia Sesión
        </button>
      ) : (
        <>
          <button
            onClick={navigateToPanel}
            style={{
              flex: '1 1 auto',
              padding: '0 8px',
              backgroundColor: currentView === 'panel' ? '#3b82f6' : '#f8fafc',
              color: currentView === 'panel' ? 'white' : '#1e293b',
              border: 'none',
              fontSize: '18px',
              fontWeight: '800',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              borderRadius: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minWidth: '0',
              whiteSpace: 'nowrap',
              borderLeft: '2px solid #e2e8f0',
              boxShadow: currentView === 'panel' ? '0 4px 12px rgba(59, 130, 246, 0.4)' : 'none'
            }}
          >
            📋 Panel
          </button>

          {usuario && usuario.rol === 'admin' && (
            <button
              onClick={navigateToAdmin}
              style={{
                flex: '1 1 auto',
                padding: '0 8px',
                backgroundColor: currentView === 'admin' ? '#3b82f6' : '#f3f4f6',
                color: currentView === 'admin' ? 'white' : '#374151',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderRadius: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                minWidth: '0',
                whiteSpace: 'nowrap',
                borderLeft: '1px solid #d1d5db'
              }}
            >
              ⚙️ Admin
            </button>
          )}

          <button
            onClick={handleLogout}
            style={{
              flex: '0.7 1 auto',
              padding: '0',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              borderRadius: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              minWidth: '0',
              whiteSpace: 'nowrap',
              borderLeft: '1px solid #d1d5db',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            title="Cerrar sesión"
          >
            🚪
          </button>
        </>
      )}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* NIVEL 1: APPHEADER (Gris) - ARRIBA DE TODO */}
      <AppHeader />
      
      {/* NIVEL 2: TOPBAR (Navegación) */}
      {renderNavigation()}
      
      {/* NIVEL 3-5: Contenedores de vistas con altura ajustada */}
      <div style={{ 
        paddingTop: '0', 
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {currentView === 'map' && <ImprovedMapView usuario={usuario} onVerReporte={(id) => { window.location.hash = `#reporte/${id}`; }} />}
        {currentView === 'form' && <ReportForm />}
        {currentView === 'panel' && usuario && <PanelFuncionario usuario={usuario} />}
        {currentView === 'admin' && usuario && usuario.rol === 'admin' && <AdminPanel />}
        {currentView === 'super-user' && <div style={{ padding: '16px', backgroundColor: '#f3f4f6', minHeight: '100vh', overflow: 'auto' }}><SuperUserPanel superUserToken={superUserToken} /></div>}
        {currentView === 'ver-reporte' && reporteIdActual && (
          <VerReporte 
            reporteId={reporteIdActual}
            usuario={usuario}
            onVolver={() => { window.location.hash = ''; }}
          />
        )}
      </div>
      
      {mostrarLogin && (
        <LoginModal
          onClose={() => setMostrarLogin(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
    </>
  );
}
