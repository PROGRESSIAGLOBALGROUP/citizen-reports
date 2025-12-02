import React, { useState, useEffect, useRef } from 'react';
import './gobierno-premium-panel.css';
import { useFocusTrap, useEscapeKey, announceToScreenReader } from './useAccessibility.js';

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
  const modalRef = useRef(null);

  // Accesibilidad: Cerrar con Escape
  useEscapeKey(true, onClose);
  
  // Accesibilidad: Focus trap
  useFocusTrap(true, modalRef);

  // Anunciar errores al screen reader
  useEffect(() => {
    if (error) {
      announceToScreenReader(`Error: ${error}`, 'assertive');
    }
  }, [error]);

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
    <div 
      className="gobierno-premium gp-modal-overlay"
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        ref={modalRef}
        className="gp-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        aria-describedby="login-modal-desc"
      >
        {/* Header Premium */}
        <div className="gp-modal-header">
          <div className="gp-modal-header-icon" aria-hidden="true">🏛️</div>
          <h2 id="login-modal-title" className="gp-modal-title">Acceso al Sistema</h2>
          <p id="login-modal-desc" className="gp-modal-subtitle">Portal de funcionarios autorizados</p>
          <button 
            className="gp-modal-close" 
            onClick={onClose}
            aria-label="Cerrar modal de inicio de sesión"
            type="button"
          >
            ×
          </button>
        </div>

        <div className="gp-modal-body">
          {error && (
            <div className="gp-alert gp-alert-error" role="alert" aria-live="assertive">
              <span className="gp-alert-icon" aria-hidden="true">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Tabs */}
          <div className="gp-modal-tabs" role="tablist" aria-label="Métodos de inicio de sesión">
            <button
              className={`gp-modal-tab ${modo === 'login' ? 'active' : ''}`}
              onClick={() => setModo('login')}
              role="tab"
              aria-selected={modo === 'login'}
              aria-controls="login-panel"
              id="tab-login"
            >
              <span className="gp-modal-tab-icon" aria-hidden="true">📧</span>
              Email
            </button>
            <button
              className={`gp-modal-tab ${modo === 'google' ? 'active' : ''}`}
              onClick={() => setModo('google')}
              role="tab"
              aria-selected={modo === 'google'}
              aria-controls="google-panel"
              id="tab-google"
            >
              <span className="gp-modal-tab-icon" aria-hidden="true">🔐</span>
              Google
            </button>
          </div>

          {/* Contenido */}
          {modo === 'login' ? (
            <form 
              onSubmit={handleLoginSubmit}
              id="login-panel"
              role="tabpanel"
              aria-labelledby="tab-login"
            >
              <div className="gp-form-group">
                <label htmlFor="login-email" className="gp-form-label" data-required>
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
                  aria-required="true"
                  placeholder="funcionario@gobierno.gob.mx"
                  className="gp-form-input"
                  aria-describedby="email-hint"
                />
                <span id="email-hint" className="sr-only">Ingresa tu correo electrónico institucional</span>
              </div>

              <div className="gp-form-group">
                <label htmlFor="login-password" className="gp-form-label" data-required>
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
                  aria-required="true"
                  placeholder="••••••••"
                  className="gp-form-input"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                aria-disabled={loading}
                className={`gp-btn-submit ${loading ? 'gp-btn-submit-loading' : ''}`}
              >
                {loading ? (
                  <>
                    <span aria-hidden="true">⏳</span>
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  <>
                    <span aria-hidden="true">🔓</span>
                    <span>Iniciar Sesión</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div 
              className="gp-google-signin"
              id="google-panel"
              role="tabpanel"
              aria-labelledby="tab-google"
            >
              <div id="googleSignInButton" aria-label="Iniciar sesión con Google"></div>
              {!googleLoaded && (
                <p className="gp-google-signin-placeholder" aria-live="polite">
                  <span aria-hidden="true">⏳</span> Cargando Google Sign-In...
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          <footer className="gp-modal-footer">
            <p className="gp-modal-footer-text">
              ¿No tienes acceso? Contacta al administrador del sistema.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
