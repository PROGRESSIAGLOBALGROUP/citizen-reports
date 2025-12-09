import React, { useState, useEffect } from 'react';
import './gobierno-premium-panel.css';

/**
 * Componente de Login Modal - Diseño Premium Gobierno
 */
export default function LoginModal({ onClose, onLoginSuccess }) {
  const [modo, setModo] = useState('login'); // 'login' o 'google'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleLoaded, setGoogleLoaded] = useState(false);

  // Auto-cerrar si ya hay sesión válida (evita mostrar login innecesariamente)
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const usuarioGuardado = localStorage.getItem('usuario');
    
    if (token && usuarioGuardado) {
      try {
        const usuario = JSON.parse(usuarioGuardado);
        // Ya hay sesión, cerrar modal y notificar
        console.log('🔐 LoginModal: Sesión existente detectada, cerrando modal');
        onLoginSuccess(usuario);
      } catch (e) {
        // Datos corruptos, continuar mostrando login
        console.warn('🔐 LoginModal: Datos de sesión corruptos');
      }
    }
  }, []);

  // Cargar Google Sign-In solo cuando sea necesario
  useEffect(() => {
    // Solo cargar si estamos en modo Google y hay client_id configurado
    if (modo !== 'google') return;
    
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn('Google Client ID no configurado');
      return;
    }

    if (window.google) {
      setGoogleLoaded(true);
      initializeGoogleSignIn();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setGoogleLoaded(true);
        initializeGoogleSignIn();
      };
      document.body.appendChild(script);
    }
  }, [modo]);

  const initializeGoogleSignIn = () => {
    if (!window.google) return;
    
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    // Esperar a que el elemento exista en el DOM
    const buttonElement = document.getElementById('googleSignInButton');
    if (!buttonElement) {
      setTimeout(initializeGoogleSignIn, 100);
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse
      });

      window.google.accounts.id.renderButton(
        buttonElement,
        { 
          theme: 'outline', 
          size: 'large',
          width: '100%',
          text: 'signin_with'
        }
      );
    } catch (error) {
      console.error('Error inicializando Google Sign-In:', error);
    }
  };

  const handleGoogleResponse = async (response) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión con Google');
      }

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      onLoginSuccess(data.usuario);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      // Verificar si la respuesta es JSON válido antes de parsear
      let data;
      try {
        data = await res.json();
      } catch (jsonError) {
        console.error('❌ Respuesta no es JSON válido:', jsonError);
        throw new Error('Error de comunicación con el servidor');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      onLoginSuccess(data.usuario);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gobierno-premium gp-modal-overlay">
      <div className="gp-modal">
        {/* Header Premium */}
        <div className="gp-modal-header">
          <div className="gp-modal-header-icon">🏛️</div>
          <h2 className="gp-modal-title">Acceso al Sistema</h2>
          <p className="gp-modal-subtitle">Portal de funcionarios autorizados</p>
          <button className="gp-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="gp-modal-body">
          {error && (
            <div className="gp-alert gp-alert-error">
              <span className="gp-alert-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Tabs */}
          <div className="gp-modal-tabs">
            <button
              className={`gp-modal-tab ${modo === 'login' ? 'active' : ''}`}
              onClick={() => setModo('login')}
            >
              <span className="gp-modal-tab-icon">📧</span>
              Email
            </button>
            <button
              className={`gp-modal-tab ${modo === 'google' ? 'active' : ''}`}
              onClick={() => setModo('google')}
            >
              <span className="gp-modal-tab-icon">🔐</span>
              Google
            </button>
          </div>

          {/* Contenido */}
          {modo === 'login' ? (
            <form onSubmit={handleLoginSubmit}>
              <div className="gp-form-group">
                <label htmlFor="login-email" className="gp-form-label">
                  Correo Electrónico
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="funcionario@gobierno.gob.mx"
                  className="gp-form-input"
                />
              </div>

              <div className="gp-form-group">
                <label htmlFor="login-password" className="gp-form-label">
                  Contraseña
                </label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="gp-form-input"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`gp-btn-submit ${loading ? 'gp-btn-submit-loading' : ''}`}
              >
                {loading ? (
                  <>
                    <span>⏳</span>
                    Verificando credenciales...
                  </>
                ) : (
                  <>
                    <span>🔓</span>
                    Iniciar Sesión
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="gp-google-signin">
              <div id="googleSignInButton"></div>
              {!googleLoaded && (
                <p className="gp-google-signin-placeholder">
                  ⏳ Cargando Google Sign-In...
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="gp-modal-footer">
            <p className="gp-modal-footer-text">
              ¿No tienes acceso? Contacta al administrador del sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
