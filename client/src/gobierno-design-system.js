/**
 * gobierno-design-system.js
 * Sistema de diseño gubernamental profesional para toda la aplicación
 * Aplicar este sistema a TODAS las páginas para consistencia visual
 */

export const GOBIERNO_COLORS = {
  // Paleta gubernamental principal
  primary: '#475569',        // Slate-600 - Principal gubernamental
  primaryDark: '#334155',    // Slate-700 - Hover estados
  secondary: '#64748b',      // Slate-500 - Secundario
  
  // Neutrales gubernamentales
  text: '#1e293b',          // Slate-800 - Texto principal
  textSecondary: '#64748b', // Slate-500 - Texto secundario
  textMuted: '#94a3b8',     // Slate-400 - Texto deshabilitado
  
  // Backgrounds
  background: '#ffffff',
  backgroundSecondary: 'rgba(248, 250, 252, 0.95)',
  backgroundTertiary: 'rgba(248, 250, 252, 0.8)',
  
  // Borders
  border: 'rgba(226, 232, 240, 0.8)',
  borderHover: 'rgba(71, 85, 105, 0.3)',
  
  // Estados
  success: '#059669',       // Emerald-600
  warning: '#d97706',       // Amber-600
  error: '#dc2626',         // Red-600
  info: '#0284c7',          // Sky-600
  
  // Overlays
  overlay: 'rgba(15, 23, 42, 0.6)',
  overlayLight: 'rgba(71, 85, 105, 0.08)'
};

export const GOBIERNO_SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
  xxxl: '48px'
};

export const GOBIERNO_SHADOWS = {
  sm: '0 2px 8px -2px rgba(0, 0, 0, 0.06)',
  md: '0 4px 16px -4px rgba(0, 0, 0, 0.08)',
  lg: '0 8px 24px -6px rgba(0, 0, 0, 0.1)',
  xl: '0 16px 40px -8px rgba(0, 0, 0, 0.12)',
  
  // Shadows con color gubernamental
  government: '0 4px 16px -4px rgba(71, 85, 105, 0.15)',
  governmentLg: '0 8px 32px -8px rgba(71, 85, 105, 0.2)'
};

export const GOBIERNO_GLASSMORPHISM = {
  // Glassmorphism gubernamental discreto
  header: {
    background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.95) 100%)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: `1px solid ${GOBIERNO_COLORS.border}`,
    borderRadius: '16px'
  },
  
  card: {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: `1px solid ${GOBIERNO_COLORS.border}`,
    borderRadius: '16px'
  },
  
  modal: {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: `1px solid ${GOBIERNO_COLORS.border}`,
    borderRadius: '16px'
  }
};

// Componentes estandarizados
export const GobiernoComponents = {
  // Header principal gubernamental
  header: {
    ...GOBIERNO_GLASSMORPHISM.header,
    padding: GOBIERNO_SPACING.xl,
    marginBottom: GOBIERNO_SPACING.xl,
    boxShadow: `
      ${GOBIERNO_SHADOWS.lg},
      ${GOBIERNO_SHADOWS.government},
      inset 0 1px 0 rgba(255, 255, 255, 0.7)
    `,
    position: 'relative',
    overflow: 'hidden'
  },
  
  // Avatar gubernamental
  avatar: {
    width: '72px',
    height: '72px',
    background: `linear-gradient(135deg, ${GOBIERNO_COLORS.primary}, ${GOBIERNO_COLORS.secondary})`,
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    color: 'white',
    boxShadow: `0 8px 24px -8px rgba(71, 85, 105, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)`,
    transition: 'all 0.3s ease'
  },
  
  // Botón principal gubernamental
  buttonPrimary: {
    background: `linear-gradient(135deg, ${GOBIERNO_COLORS.primary}, ${GOBIERNO_COLORS.secondary})`,
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 20px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: GOBIERNO_SPACING.sm,
    boxShadow: GOBIERNO_SHADOWS.government,
    transition: 'all 0.2s ease'
  },
  
  // Botón secundario gubernamental  
  buttonSecondary: {
    background: GOBIERNO_COLORS.backgroundTertiary,
    border: `1px solid ${GOBIERNO_COLORS.border}`,
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    color: GOBIERNO_COLORS.primary,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  
  // Input gubernamental
  input: {
    width: '100%',
    padding: '12px 16px',
    border: `1px solid ${GOBIERNO_COLORS.border}`,
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    background: 'rgba(248, 250, 252, 0.5)',
    transition: 'all 0.2s ease'
  },
  
  // Card gubernamental
  card: {
    ...GOBIERNO_GLASSMORPHISM.card,
    boxShadow: GOBIERNO_SHADOWS.md,
    transition: 'all 0.25s ease',
    position: 'relative'
  },
  
  // Modal gubernamental
  modal: {
    ...GOBIERNO_GLASSMORPHISM.modal,
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: `
      ${GOBIERNO_SHADOWS.xl},
      ${GOBIERNO_SHADOWS.governmentLg},
      inset 0 1px 0 rgba(255, 255, 255, 0.7)
    `
  },
  
  // Overlay gubernamental
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: GOBIERNO_COLORS.overlay,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
};

// Funciones de utilidad para estados hover
export const GobiernoHoverEffects = {
  button: (element, isPrimary = true) => ({
    onMouseEnter: (e) => {
      if (isPrimary) {
        e.target.style.transform = 'translateY(-1px)';
        e.target.style.boxShadow = '0 6px 20px -4px rgba(71, 85, 105, 0.4)';
      } else {
        e.target.style.background = GOBIERNO_COLORS.overlayLight;
        e.target.style.borderColor = GOBIERNO_COLORS.borderHover;
      }
    },
    onMouseLeave: (e) => {
      if (isPrimary) {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = GOBIERNO_SHADOWS.government;
      } else {
        e.target.style.background = GOBIERNO_COLORS.backgroundTertiary;
        e.target.style.borderColor = GOBIERNO_COLORS.border;
      }
    }
  }),
  
  card: (element) => ({
    onMouseEnter: (e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = GOBIERNO_SHADOWS.lg;
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = GOBIERNO_SHADOWS.md;
    }
  }),
  
  input: (element) => ({
    onFocus: (e) => {
      e.target.style.borderColor = GOBIERNO_COLORS.borderHover;
      e.target.style.background = 'white';
    },
    onBlur: (e) => {
      e.target.style.borderColor = GOBIERNO_COLORS.border;
      e.target.style.background = 'rgba(248, 250, 252, 0.5)';
    }
  })
};

// Typography gubernamental
export const GobiernoTypography = {
  h1: {
    fontSize: '28px',
    fontWeight: '700',
    color: GOBIERNO_COLORS.text,
    margin: 0,
    marginBottom: GOBIERNO_SPACING.sm,
    letterSpacing: '-0.4px'
  },
  
  h2: {
    fontSize: '24px',
    fontWeight: '700',
    color: GOBIERNO_COLORS.text,
    margin: 0,
    marginBottom: GOBIERNO_SPACING.xs,
    letterSpacing: '-0.3px'
  },
  
  h3: {
    fontSize: '20px',
    fontWeight: '600',
    color: GOBIERNO_COLORS.text,
    margin: 0,
    marginBottom: GOBIERNO_SPACING.xs
  },
  
  body: {
    fontSize: '16px',
    fontWeight: '500',
    color: GOBIERNO_COLORS.textSecondary,
    margin: 0,
    lineHeight: '1.5'
  },
  
  caption: {
    fontSize: '14px',
    fontWeight: '500',
    color: GOBIERNO_COLORS.textMuted,
    margin: 0
  }
};

export default {
  GOBIERNO_COLORS,
  GOBIERNO_SPACING,
  GOBIERNO_SHADOWS,
  GOBIERNO_GLASSMORPHISM,
  GobiernoComponents,
  GobiernoHoverEffects,
  GobiernoTypography
};