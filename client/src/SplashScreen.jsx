/**
 * SplashScreen.jsx
 * Pantalla de inicio elegante con logo PROGRESSIA y municipio
 * 
 * Flujo:
 * 1. Modal oscura con blur y logo PROGRESSIA (2-3 segundos)
 * 2. Transición suave a logo del municipio (1-2 segundos)
 * 3. Desaparece con fade out y blur
 * 4. Libera la interfaz del mapa
 */

import React from 'react';
import { DESIGN_SYSTEM } from './design-system';
import { useWhiteLabel } from './WhiteLabelContext.jsx';

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = React.useState('progressia'); // 'progressia' | 'municipio' | 'fade'
  const { config } = useWhiteLabel();

  React.useEffect(() => {
    // Fase 1: PROGRESSIA (2.5 segundos)
    const timer1 = setTimeout(() => {
      setPhase('municipio');
    }, 2500);

    // Fase 2: Municipio (1.5 segundos)
    const timer2 = setTimeout(() => {
      setPhase('fade');
    }, 4000);

    // Fase 3: Fade out y desaparece (0.8 segundos)
    const timer3 = setTimeout(() => {
      onComplete();
    }, 4800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  // Modal de fondo oscuro con blur
  const backdropStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.95)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: phase === 'fade' ? 0 : 1,
    pointerEvents: phase === 'fade' ? 'none' : 'auto'
  };

  // Container del contenido
  const contentStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'clamp(8px, 1.5vw, 16px)',
    height: '100%',
    width: '100%',
    position: 'relative'
  };

  // Logo PROGRESSIA - Imagen responsiva
  const logoProgressiaStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 'clamp(220px, 50vw, 480px)',
    width: 'clamp(550px, 95vw, 1000px)',
    transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: phase === 'progressia' ? 1 : 0,
    transform: phase === 'progressia' ? 'scale(1)' : 'scale(0.8)'
  };

  const logoImageStyle = {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    filter: 'drop-shadow(0 0 20px rgba(2, 132, 199, 0.4))'
  };

  // Subtítulo PROGRESSIA
  const subtitleProgressiaStyle = {
    fontSize: DESIGN_SYSTEM.typography.body.fontSize,
    color: DESIGN_SYSTEM.colors.neutral.light,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    fontWeight: '600',
    transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: phase === 'progressia' ? 1 : 0,
    marginTop: 'clamp(-20px, -3vw, -8px)'
  };

  // Wrapper para fase PROGRESSIA
  const progressiaWrapperStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'clamp(8px, 1.5vw, 16px)',
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: phase === 'progressia' ? 1 : 0,
    pointerEvents: phase === 'progressia' ? 'auto' : 'none'
  };

  // Logo municipio con escudo
  const municipioContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: DESIGN_SYSTEM.spacing.md,
    transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: phase === 'municipio' ? 1 : 0,
    textAlign: 'center',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: phase === 'municipio' ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.7)'
  };

  // Escudo del municipio
  const escudoStyle = {
    fontSize: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: phase === 'municipio' ? 'pulse 2s ease-in-out infinite' : 'none'
  };

  // Nombre del municipio
  const municipioNombreStyle = {
    fontSize: '32px',
    fontWeight: '700',
    color: 'white',
    margin: 0,
    letterSpacing: '-0.5px'
  };

  // Subtítulo del municipio
  const municipioSubtitleStyle = {
    fontSize: DESIGN_SYSTEM.typography.bodySmall.fontSize,
    color: DESIGN_SYSTEM.colors.neutral.light,
    margin: 0,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    fontWeight: '500',
    marginTop: DESIGN_SYSTEM.spacing.sm
  };

  // Animación de pulse (parpadeo suave)
  const pulseKeyframes = `
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }
  `;

  return (
    <>
      <style>{pulseKeyframes}</style>
      <div style={backdropStyle}>
        <div style={contentStyle}>
          {/* Fase 1: Logo PROGRESSIA - Imagen Responsiva */}
          <div style={progressiaWrapperStyle}>
            <div style={logoProgressiaStyle}>
              <img 
                src="/assets/PROGRESSIA/Logo/PNG/ImagotipoHorizontalB.png" 
                alt="PROGRESSIA Logo" 
                style={logoImageStyle}
              />
            </div>
            <div style={subtitleProgressiaStyle}>Sistema de Reportes Ciudadanos</div>
          </div>

          {/* Fase 2: Logo Municipio */}
          <div style={municipioContainerStyle}>
            <div style={escudoStyle}>
              {config.assets.escudoUrl ? 
                <img src={config.assets.escudoUrl} alt="Escudo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> 
                : config.assets.escudoAlt}
            </div>
            <h1 style={municipioNombreStyle}>H. Ayuntamiento</h1>
            <h2 style={municipioNombreStyle}>{config.municipioNombre}</h2>
            <p style={municipioSubtitleStyle}>{config.ubicacion}</p>
          </div>
        </div>
      </div>
    </>
  );
}
