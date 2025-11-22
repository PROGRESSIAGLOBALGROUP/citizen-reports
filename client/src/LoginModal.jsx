import React, { useState, useEffect } from 'react';

/**
 * Componente de Login Modal
 */
export default function LoginModal({ onClose, onLoginSuccess }) {
  const [modo, setModo] = useState('login'); // 'login' o 'google'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleLoaded, setGoogleLoaded] = useState(false);

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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        position: 'relative'
      }}>
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#9ca3af',
            padding: '4px',
            lineHeight: 1
          }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '700', 
            color: '#1e293b',
            marginBottom: '8px'
          }}>
            Inicio de Sesión
          </h2>
          <p style={{ 
            fontSize: '14px', 
            color: '#64748b'
          }}>
            Funcionarios autorizados únicamente
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            color: '#dc2626',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <button
            onClick={() => setModo('login')}
            style={{
              flex: 1,
              padding: '12px',
              background: 'none',
              border: 'none',
              borderBottom: modo === 'login' ? '2px solid #3b82f6' : 'none',
              marginBottom: '-2px',
              color: modo === 'login' ? '#3b82f6' : '#64748b',
              fontWeight: modo === 'login' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Email / Password
          </button>
          <button
            onClick={() => setModo('google')}
            style={{
              flex: 1,
              padding: '12px',
              background: 'none',
              border: 'none',
              borderBottom: modo === 'google' ? '2px solid #3b82f6' : 'none',
              marginBottom: '-2px',
              color: modo === 'google' ? '#3b82f6' : '#64748b',
              fontWeight: modo === 'google' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Google
          </button>
        </div>

        {/* Contenido */}
        {modo === 'login' ? (
          <form onSubmit={handleLoginSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="funcionario@jantetelco.gob.mx"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: loading ? '#93c5fd' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        ) : (
          <div>
            <div id="googleSignInButton" style={{ marginBottom: '16px' }}></div>
            {!googleLoaded && (
              <p style={{ 
                textAlign: 'center', 
                color: '#64748b', 
                fontSize: '14px' 
              }}>
                Cargando Google Sign-In...
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center',
          fontSize: '12px',
          color: '#64748b'
        }}>
          <p>
            ¿No tienes acceso? Contacta al administrador del sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
