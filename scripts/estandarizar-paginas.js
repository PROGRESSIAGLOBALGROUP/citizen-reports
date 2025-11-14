/**
 * estandarizar-paginas.js
 * Script para aplicar el diseño gubernamental profesional a TODA la aplicación
 * 
 * PÁGINAS A ESTANDARIZAR:
 * - AdminUsuarios.jsx ✅ (Ya tiene diseño premium)
 * - AdminCategorias.jsx ✅ (Ya transformado)
 * - AdminDependencias.jsx (Pendiente)
 * - FormularioTipo.jsx (Pendiente) 
 * - FormularioUsuario.jsx (Pendiente)
 * - Panel.jsx (Pendiente)
 * - PanelReportes.jsx (Pendiente)
 * - App.jsx header (Pendiente)
 */

// PASOS DE IMPLEMENTACIÓN:

// 1. IMPORTAR EL SISTEMA DE DISEÑO EN CADA ARCHIVO
const importStatement = `
import { 
  GOBIERNO_COLORS, 
  GobiernoComponents, 
  GobiernoHoverEffects, 
  GobiernoTypography 
} from './gobierno-design-system.js';
`;

// 2. PATRONES DE TRANSFORMACIÓN ESTÁNDAR

// Header principal (aplicar a todas las páginas principales)
const headerPattern = {
  from: /style=\{\{[^}]*padding[^}]*background[^}]*\}\}/,
  to: `style={{
    ...GobiernoComponents.header,
    // Overlay gubernamental sutil
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'radial-gradient(circle at 70% 20%, rgba(71, 85, 105, 0.03) 0%, transparent 60%)',
      pointerEvents: 'none'
    }
  }}`
};

// Avatar/Icono principal
const avatarPattern = {
  from: /width: ['"]?\d+px['"]?[^}]*height: ['"]?\d+px['"]?[^}]*background[^}]*\}\}/,
  to: `style={{
    ...GobiernoComponents.avatar,
    ...GobiernoHoverEffects.avatar
  }}`
};

// Botones primarios
const buttonPrimaryPattern = {
  from: /background: ['"]?[^'"]*blue[^'"]*['"]?[^}]*color: ['"]?white['"]?[^}]*\}\}/,
  to: `style={{
    ...GobiernoComponents.buttonPrimary,
    ...GobiernoHoverEffects.button(this, true)
  }}`
};

// Botones secundarios
const buttonSecondaryPattern = {
  from: /background: ['"]?white['"]?[^}]*border: [^}]*\}\}/,
  to: `style={{
    ...GobiernoComponents.buttonSecondary,
    ...GobiernoHoverEffects.button(this, false)
  }}`
};

// Inputs/Campos de formulario
const inputPattern = {
  from: /padding: ['"]?\d+px \d+px['"]?[^}]*border: [^}]*\}\}/,
  to: `style={{
    ...GobiernoComponents.input,
    ...GobiernoHoverEffects.input(this)
  }}`
};

// Cards/Contenedores
const cardPattern = {
  from: /background: ['"]?white['"]?[^}]*borderRadius: [^}]*\}\}/,
  to: `style={{
    ...GobiernoComponents.card,
    ...GobiernoHoverEffects.card(this)
  }}`
};

// Modales/Overlays
const modalPattern = {
  from: /position: ['"]?fixed['"]?[^}]*background: ['"]?rgba\(0, 0, 0[^}]*\}\}/,
  to: `style={GobiernoComponents.overlay}`
};

// Typography estándar
const typographyPatterns = {
  h1: {
    from: /fontSize: ['"]?\d+px['"]?[^}]*fontWeight: ['"]?[^'"]*['"]?[^}]*color: [^}]*\}\}/,
    to: `style={GobiernoTypography.h1}`
  },
  h2: {
    from: /fontSize: ['"]?2[0-4]px['"]?[^}]*fontWeight: [^}]*\}\}/,
    to: `style={GobiernoTypography.h2}`
  },
  body: {
    from: /fontSize: ['"]?1[4-6]px['"]?[^}]*color: ['"]?#[^'"]*['"]?[^}]*\}\}/,
    to: `style={GobiernoTypography.body}`
  }
};

// 3. ARCHIVO DE CONFIGURACIÓN PARA APLICAR AUTOMÁTICAMENTE

export const ESTANDARIZACION_CONFIG = {
  // Archivos a procesar
  archivos: [
    'AdminDependencias.jsx',
    'FormularioTipo.jsx', 
    'FormularioUsuario.jsx',
    'Panel.jsx',
    'PanelReportes.jsx',
    'App.jsx'
  ],
  
  // Transformaciones a aplicar
  transformaciones: [
    headerPattern,
    avatarPattern, 
    buttonPrimaryPattern,
    buttonSecondaryPattern,
    inputPattern,
    cardPattern,
    modalPattern,
    ...Object.values(typographyPatterns)
  ],
  
  // Colores a reemplazar
  coloresLegacy: {
    '#3b82f6': GOBIERNO_COLORS.primary,
    '#1e40af': GOBIERNO_COLORS.primaryDark,
    '#60a5fa': GOBIERNO_COLORS.secondary,
    '#374151': GOBIERNO_COLORS.text,
    '#6b7280': GOBIERNO_COLORS.textSecondary,
    '#9ca3af': GOBIERNO_COLORS.textMuted
  }
};

// 4. FUNCIÓN PARA APLICAR TRANSFORMACIONES
export function aplicarEstandarizacionGuberamental(contenidoArchivo) {
  let contenidoTransformado = contenidoArchivo;
  
  // Agregar import del sistema de diseño
  if (!contenidoTransformado.includes('gobierno-design-system')) {
    contenidoTransformado = contenidoTransformado.replace(
      /import React from 'react';/,
      `import React from 'react';\n${importStatement}`
    );
  }
  
  // Aplicar transformaciones de patrones
  ESTANDARIZACION_CONFIG.transformaciones.forEach(pattern => {
    contenidoTransformado = contenidoTransformado.replace(pattern.from, pattern.to);
  });
  
  // Reemplazar colores legacy
  Object.entries(ESTANDARIZACION_CONFIG.coloresLegacy).forEach(([colorViejo, colorNuevo]) => {
    const regex = new RegExp(colorViejo, 'g');
    contenidoTransformado = contenidoTransformado.replace(regex, colorNuevo);
  });
  
  return contenidoTransformado;
}

// 5. CHECKLIST DE ESTANDARIZACIÓN MANUAL

export const CHECKLIST_ESTANDARIZACION = {
  header: [
    '✅ Usar GobiernoComponents.header como base',
    '✅ Agregar overlay sutil gubernamental', 
    '✅ Aplicar glassmorphism discreto',
    '✅ Usar colores neutros (grises)',
    '✅ Avatar con GobiernoComponents.avatar'
  ],
  
  botones: [
    '✅ Primarios: GobiernoComponents.buttonPrimary',
    '✅ Secundarios: GobiernoComponents.buttonSecondary', 
    '✅ Hover effects con GobiernoHoverEffects.button',
    '✅ Sin colores brillantes ni emojis excesivos',
    '✅ Transiciones suaves (0.2s ease)'
  ],
  
  formularios: [
    '✅ Inputs: GobiernoComponents.input',
    '✅ Focus/blur effects con GobiernoHoverEffects.input',
    '✅ Background sutil (rgba(248, 250, 252, 0.5))',
    '✅ Borders discretos',
    '✅ Placeholders profesionales'
  ],
  
  cards: [
    '✅ Base: GobiernoComponents.card',
    '✅ Glassmorphism sutil',
    '✅ Shadows gubernamentales',
    '✅ Hover effects discretos',
    '✅ Border radius 16px'
  ],
  
  modales: [
    '✅ Overlay: GobiernoComponents.overlay',
    '✅ Modal: GobiernoComponents.modal',
    '✅ Header gubernamental',
    '✅ Footer con botones estandarizados',
    '✅ Backdrop blur 8px-16px'
  ],
  
  typography: [
    '✅ H1: GobiernoTypography.h1',
    '✅ H2: GobiernoTypography.h2', 
    '✅ Body: GobiernoTypography.body',
    '✅ Colors neutros gubernamentales',
    '✅ Letter-spacing sutil'
  ],
  
  colores: [
    '✅ Primary: #475569 (Slate-600)',
    '✅ Secondary: #64748b (Slate-500)',
    '✅ Text: #1e293b (Slate-800)',
    '✅ Borders: rgba(226, 232, 240, 0.8)',
    '✅ Backgrounds: rgba(248, 250, 252, 0.95)'
  ]
};

// 6. INSTRUCCIONES DE USO

/*
CÓMO USAR ESTE SISTEMA DE ESTANDARIZACIÓN:

1. IMPORTAR en cada archivo:
   import { GobiernoComponents, GobiernoHoverEffects, GobiernoTypography } from './gobierno-design-system.js';

2. REEMPLAZAR estilos existentes:
   - Headers: style={GobiernoComponents.header}
   - Botones: style={{...GobiernoComponents.buttonPrimary, ...GobiernoHoverEffects.button(this, true)}}
   - Inputs: style={{...GobiernoComponents.input, ...GobiernoHoverEffects.input(this)}}
   - Cards: style={{...GobiernoComponents.card, ...GobiernoHoverEffects.card(this)}}

3. VERIFICAR checklist de estandarización para cada componente

4. APLICAR de forma progresiva página por página

RESULTADO: 
Interfaz gubernamental 100% consistente, profesional y apropiada para plataforma municipal
*/

export default {
  ESTANDARIZACION_CONFIG,
  aplicarEstandarizacionGuberamental,
  CHECKLIST_ESTANDARIZACION
};