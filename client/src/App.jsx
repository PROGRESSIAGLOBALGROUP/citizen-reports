import React, { useState, useEffect } from 'react';
import SimpleApp from './SimpleApp.jsx';
import ReportForm from './ReportForm.jsx';
import LoginModal from './LoginModal.jsx';
import PanelFuncionario from './PanelFuncionario.jsx';
import AdminUsuarios from './AdminUsuarios.jsx';
import AdminCategorias from './AdminCategorias.jsx';
import AdminDependencias from './AdminDependencias.jsx';
import VerReporte from './VerReporte.jsx';

export default function App() {
  const [currentView, setCurrentView] = useState('map'); // 'map', 'form', 'panel', 'admin', 'ver-reporte'
  const [usuario, setUsuario] = useState(null);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [reporteIdActual, setReporteIdActual] = useState(null);

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
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '50px',
      zIndex: 2000,
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
          gap: '4px',
          minWidth: '0',
          whiteSpace: 'nowrap'
        }}
      >
        🗺️ Mapa
      </button>
      
      <button
        onClick={navigateToForm}
        style={{
          flex: '1 1 auto',
          padding: '0',
          backgroundColor: currentView === 'form' ? '#3b82f6' : '#f3f4f6',
          color: currentView === 'form' ? 'white' : '#374151',
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
          borderLeft: '1px solid #d1d5db',
          borderRight: '1px solid #d1d5db'
        }}
      >
        📝 Reportar
      </button>

      {/* Botón de Login/Panel/Usuario */}
      {!usuario ? (
        <button
          onClick={() => setMostrarLogin(true)}
          style={{
            flex: '1 1 auto',
            padding: '0',
            backgroundColor: '#10b981',
            color: 'white',
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
          � Sesión
        </button>
      ) : (
        <>
          <button
            onClick={navigateToPanel}
            style={{
              flex: '1 1 auto',
              padding: '0',
              backgroundColor: currentView === 'panel' ? '#3b82f6' : '#f3f4f6',
              color: currentView === 'panel' ? 'white' : '#374151',
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
            📋 Panel
          </button>

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
    <div>
      {renderNavigation()}
      <div style={{ paddingTop: '50px' }}>
        {currentView === 'map' && <SimpleApp usuario={usuario} onVerReporte={(id) => { window.location.hash = `#reporte/${id}`; }} />}
        {currentView === 'form' && <ReportForm />}
        {currentView === 'panel' && usuario && <PanelFuncionario usuario={usuario} />}
        {currentView === 'admin' && usuario && usuario.rol === 'admin' && <AdminUsuarios />}
        {currentView === 'admin-categorias' && usuario && usuario.rol === 'admin' && <AdminCategorias fullscreen={true} />}
        {currentView === 'admin-dependencias' && usuario && usuario.rol === 'admin' && <AdminDependencias fullscreen={true} />}
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
  );
}
