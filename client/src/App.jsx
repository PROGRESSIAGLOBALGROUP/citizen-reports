import React, { useState, useEffect } from 'react';
import ProfessionalTopBar from './ProfessionalTopBar.jsx';
import ImprovedMapView from './ImprovedMapView.jsx';
import ReportForm from './ReportForm.jsx';
import LoginModal from './LoginModal.jsx';
import PanelFuncionario from './PanelFuncionario.jsx';
import AdminPanel from './AdminPanel.jsx';
import SuperUserPanel from './SuperUserPanel.jsx';
import VerReporte from './VerReporte.jsx';
import SplashScreen from './SplashScreen.jsx';
import { WhiteLabelProvider } from './WhiteLabelContext.jsx';

function AppContent() {
  const [currentView, setCurrentView] = useState('map'); // 'map', 'form', 'panel', 'admin', 'super-user', 'ver-reporte'
  const [usuario, setUsuario] = useState(null);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [reporteIdActual, setReporteIdActual] = useState(null);
  const [superUserToken, setSuperUserToken] = useState(localStorage.getItem('super_user_token'));
  const [mostrarSplash, setMostrarSplash] = useState(true); // Control del splash screen

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
      
      // Verificar sesión directamente desde localStorage (evita race condition con estado React)
      const token = localStorage.getItem('auth_token');
      const usuarioGuardado = localStorage.getItem('usuario');
      let usuarioActual = usuario;
      
      if (!usuarioActual && token && usuarioGuardado) {
        try {
          usuarioActual = JSON.parse(usuarioGuardado);
        } catch (e) {
          usuarioActual = null;
        }
      }
      
      if (hash === '#reportar') {
        setCurrentView('form');
      } else if (hash === '#panel') {
        if (usuarioActual) {
          setCurrentView('panel');
        } else {
          setMostrarLogin(true);
          window.location.hash = '';
        }
      } else if (hash.startsWith('#reporte/')) {
        if (usuarioActual) {
          const id = hash.replace('#reporte/', '');
          setReporteIdActual(id);
          setCurrentView('ver-reporte');
        } else {
          setMostrarLogin(true);
          window.location.hash = '';
        }
      } else if (hash === '#admin') {
        if (usuarioActual && usuarioActual.rol === 'admin') {
          setCurrentView('admin');
        } else {
          setMostrarLogin(true);
          window.location.hash = '';
        }
      } else if (hash === '#admin/categorias') {
        if (usuarioActual && usuarioActual.rol === 'admin') {
          setCurrentView('admin-categorias');
        } else {
          setMostrarLogin(true);
          window.location.hash = '';
        }
      } else if (hash === '#admin/dependencias') {
        if (usuarioActual && usuarioActual.rol === 'admin') {
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

  const navigateToPanel = (userOverride = null) => {
    const userToCheck = userOverride || usuario;
    if (userToCheck) {
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
    navigateToPanel(usuarioData);
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

  // Barra de navegación - REEMPLAZADA POR ProfessionalTopBar.jsx
  // Ver: ProfessionalTopBar component

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
      
      {/* SPLASH SCREEN - Aparece solo al cargar la página */}
      {mostrarSplash && (
        <SplashScreen
          onComplete={() => setMostrarSplash(false)}
          municipioNombre="citizen-reports"
          municipioEscudo="🏛️"
        />
      )}
      
      <div className="app-main-container">
      {/* PROFESSIONAL TOPBAR (Navegación Institucional) */}
      <ProfessionalTopBar
        currentView={currentView}
        usuario={usuario}
        onNavigate={(view) => {
          // Verificar sesión directamente desde localStorage (evita race condition)
          const token = localStorage.getItem('auth_token');
          const usuarioGuardado = localStorage.getItem('usuario');
          let usuarioActual = usuario;
          
          if (!usuarioActual && token && usuarioGuardado) {
            try {
              usuarioActual = JSON.parse(usuarioGuardado);
              setUsuario(usuarioActual); // Sincronizar estado
            } catch (e) {
              usuarioActual = null;
            }
          }
          
          if (view === 'map') {
            setCurrentView('map');
            window.location.hash = '';
          } else if (view === 'form') {
            setCurrentView('form');
            window.location.hash = '#reportar';
          } else if (view === 'panel') {
            if (usuarioActual) {
              setCurrentView('panel');
              window.location.hash = '#panel';
            } else {
              setMostrarLogin(true);
            }
          } else if (view === 'admin') {
            if (usuarioActual && usuarioActual.rol === 'admin') {
              setCurrentView('admin');
              window.location.hash = '#admin';
            } else {
              setMostrarLogin(true);
            }
          }
        }}
        onLoginClick={() => setMostrarLogin(true)}
        onLogout={handleLogout}
      />
      
      {/* NIVEL 3-5: Contenedores de vistas con altura ajustada */}
      <div className="app-views-container">
        {console.log('🎬 App RENDER: currentView =', currentView)}
        {currentView === 'map' && (console.log('✅ Renderizando ImprovedMapView'), <ImprovedMapView usuario={usuario} onVerReporte={(id) => { window.location.hash = `#reporte/${id}`; }} />)}
        {currentView === 'form' && <ReportForm />}
        {currentView === 'panel' && usuario && <PanelFuncionario usuario={usuario} />}
        {currentView === 'admin' && usuario && usuario.rol === 'admin' && <AdminPanel />}
        {currentView === 'super-user' && <div className="app-superuser-container"><SuperUserPanel superUserToken={superUserToken} /></div>}
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

export default function App() {
  return (
    <WhiteLabelProvider>
      <AppContent />
    </WhiteLabelProvider>
  );
}
