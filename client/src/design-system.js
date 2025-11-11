/**
 * 🎨 DESIGN SYSTEM GLOBAL - Jantetelco Heatmap Platform
 * Clase Mundial - Profesional, Moderno, Impactante
 * 
 * Todos los componentes DEBEN usar esta paleta
 */

export const DESIGN_SYSTEM = {
  // COLORES PRIMARIOS - Moderna paleta profesional
  colors: {
    // Gradientes de marca
    primary: {
      main: '#0284c7',      // Azul profesional vibrante
      dark: '#0369a1',      // Azul oscuro para hover
      light: '#0ea5e9',     // Azul claro
      lighter: '#38bdf8',   // Azul muy claro
      gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
      gradientAlt: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
    },
    
    // Secundarios - Acentos
    secondary: {
      main: '#7c3aed',      // Púrpura vibrante
      dark: '#6d28d9',
      light: '#a78bfa',
    },
    
    // Semánticos
    semantic: {
      success: '#10b981',   // Verde éxito
      warning: '#f59e0b',   // Naranja advertencia
      danger: '#ef4444',    // Rojo peligro
      info: '#3b82f6',      // Azul info
    },
    
    // Neutrales
    neutral: {
      light: '#ffffff',     // Blanco
      medium: '#f9fafb',    // Gris muy claro
      dark: '#4b5563',      // Gris oscuro para textos
      darkGray: '#334155',  // Gris oscuro para fondos
      border: '#e5e7eb',    // Gris para bordes
    },
    
    dark: {
      bg: '#0f172a',        // Muy oscuro para fondos
      card: '#1e293b',      // Oscuro para tarjetas
      text: '#0f172a',      // Texto oscuro
      border: '#334155',    // Bordes oscuros
    },
    light: {
      bg: '#f8fafc',        // Fondo claro
      card: '#ffffff',      // Tarjetas blancas
      text: '#1e293b',      // Texto oscuro sobre claro
      border: '#e2e8f0',    // Bordes claros
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },

  // TIPOGRAFÍA - Moderna y legible
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    
    // Escalas de texto
    h1: {
      fontSize: '32px',
      fontWeight: '700',
      lineHeight: '1.2',
      letterSpacing: '-0.5px',
    },
    h2: {
      fontSize: '28px',
      fontWeight: '700',
      lineHeight: '1.3',
      letterSpacing: '-0.25px',
    },
    h3: {
      fontSize: '24px',
      fontWeight: '600',
      lineHeight: '1.4',
    },
    h4: {
      fontSize: '20px',
      fontWeight: '600',
      lineHeight: '1.4',
    },
    body: {
      fontSize: '16px',
      fontWeight: '400',
      lineHeight: '1.5',
    },
    bodySmall: {
      fontSize: '14px',
      fontWeight: '400',
      lineHeight: '1.5',
    },
    label: {
      fontSize: '13px',
      fontWeight: '500',
      lineHeight: '1.4',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    labelSmall: {
      fontSize: '11px',
      fontWeight: '600',
      lineHeight: '1.4',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
  },

  // ESPACIADO - Consistente
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '40px',
    '5xl': '48px',
  },

  // BORDES Y SOMBRAS
  border: {
    radius: {
      xs: '3px',
      sm: '4px',
      md: '6px',
      lg: '8px',
      xl: '12px',
      full: '9999px',
    },
  },

  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px rgba(0, 0, 0, 0.15)',
    
    // Premium shadows con color de marca
    primarySm: '0 2px 8px rgba(2, 132, 199, 0.15)',
    primaryMd: '0 4px 12px rgba(2, 132, 199, 0.2)',
    primaryLg: '0 10px 20px rgba(2, 132, 199, 0.25)',
  },

  // TRANSICIONES
  transitions: {
    fast: 'all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    normal: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    smooth: 'all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },

  // Alias para compatibilidad retroactiva
  transition: {
    fast: 'all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    normal: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    smooth: 'all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    default: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    standard: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },

  // BREAKPOINTS - Responsive
  breakpoints: {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px',
  },
};

/**
 * ESTILOS REUTILIZABLES - Para todos los componentes
 */
export const COMMON_STYLES = {
  // Header unificado
  header: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    borderBottom: '2px solid #0284c7',
    padding: '16px 20px',
    boxShadow: '0 4px 15px rgba(2, 132, 199, 0.1)',
  },

  // Botones primarios
  buttonPrimary: {
    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(2, 132, 199, 0.3)',
    transition: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },

  // Botones secundarios
  buttonSecondary: {
    background: '#ffffff',
    color: '#0284c7',
    border: '1px solid #0284c7',
    borderRadius: '6px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },

  // Tarjetas
  card: {
    background: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    padding: '16px',
    transition: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },

  // Inputs
  input: {
    background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
    border: '1px solid #475569',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '14px',
    color: '#cbd5e1',
    fontWeight: '500',
  },

  // Panel oscuro
  panelDark: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    borderLeft: '2px solid #0284c7',
    boxShadow: '2px 0 20px rgba(2, 132, 199, 0.2)',
  },

  // Sección con título
  section: {
    padding: '14px',
    background: '#ffffff',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    marginBottom: '12px',
  },

  // Título de sección
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0284c7',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    paddingBottom: '8px',
    borderBottom: '2px solid #0284c7',
    marginBottom: '8px',
  },
};

export default DESIGN_SYSTEM;
