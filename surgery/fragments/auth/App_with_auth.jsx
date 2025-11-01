import React, { useState, useEffect } from 'react';
import SimpleApp from './SimpleApp.jsx';
import ReportForm from './ReportForm.jsx';
import LoginModal from './LoginModal.jsx';
import PanelFuncionario from './PanelFuncionario.jsx';

export default function App() {
  const [currentView, setCurrentView] = useState('map'); // 'map', 'form', 'panel'
  const [usuario, setUsuario] = useState(null);
  const [mostrarLogin, setMostrarLogin] = useState(false);

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
      } else {
        setCurrentView('map');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [usuario]);

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

  // Barra de navegación
  const renderNavigation = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 2000,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid #e5e7eb',
      padding: '12px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ 
        fontSize: '18px', 
        fontWeight: '700', 
        color: '#1e293b',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        🏛️ Jantetelco
      </div>
      
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          onClick={navigateToMap}
          style={{
            padding: '8px 16px',
            backgroundColor: currentView === 'map' ? '#3b82f6' : 'transparent',
            color: currentView === 'map' ? 'white' : '#374151',
            border: currentView === 'map' ? 'none' : '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          🗺️ Mapa
        </button>
        
        <button
          onClick={navigateToForm}
          style={{
            padding: '8px 16px',
            backgroundColor: currentView === 'form' ? '#3b82f6' : 'transparent',
            color: currentView === 'form' ? 'white' : '#374151',
            border: currentView === 'form' ? 'none' : '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          📝 Reportar
        </button>

        {/* Botón de Login/Panel/Usuario */}
        {!usuario ? (
          <button
            onClick={() => setMostrarLogin(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🔐 Inicio de Sesión
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={navigateToPanel}
              style={{
                padding: '8px 16px',
                backgroundColor: currentView === 'panel' ? '#3b82f6' : 'transparent',
                color: currentView === 'panel' ? 'white' : '#374151',
                border: currentView === 'panel' ? 'none' : '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              📋 Panel
            </button>
            
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#64748b',
                textAlign: 'right'
              }}>
                <div style={{ fontWeight: '600', color: '#1e293b' }}>
                  {usuario.nombre}
                </div>
                <div style={{ fontSize: '11px' }}>
                  {usuario.rol === 'admin' ? 'Administrador' : 
                   usuario.rol === 'supervisor' ? 'Supervisor' : 'Funcionario'}
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title="Cerrar sesión"
              >
                🚪
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {renderNavigation()}
      <div style={{ paddingTop: currentView === 'form' ? '0' : '60px' }}>
        {currentView === 'map' && <SimpleApp />}
        {currentView === 'form' && <ReportForm />}
        {currentView === 'panel' && usuario && <PanelFuncionario usuario={usuario} />}
      </div>
      
      {mostrarLogin && (
        <LoginModal
          onClose={() => setMostrarLogin(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}
