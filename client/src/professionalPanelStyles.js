/**
 * PROFESSIONAL PANEL STYLING
 * Usado en ImprovedMapView - reemplaza el panel oscuro actual
 * Características:
 * - Fondo blanco/gris claro (#f9fafb)
 * - Tipografía profesional (Inter, sans-serif)
 * - Secciones claramente organizadas
 * - Contadores etiquetados y legibles
 * - Sin dark mode extremo
 */

const panelContainerStyle = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  height: 'calc(100vh - 50px)',
  overflowY: 'auto',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
};

const sectionHeaderStyle = {
  fontSize: '13px',
  fontWeight: '700',
  color: '#0284c7',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '8px',
  paddingBottom: '8px',
  borderBottom: '2px solid #0284c7'
};

const sectionTitleStyle = {
  fontSize: '14px',
  fontWeight: '700',
  color: '#1f2937',
  marginBottom: '12px'
};

const labelStyle = {
  fontSize: '12px',
  fontWeight: '500',
  color: '#4b5563',
  marginBottom: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.3px'
};

const valueStyle = {
  fontSize: '16px',
  fontWeight: '700',
  color: '#0f172a'
};

const buttonPrimaryStyle = {
  backgroundColor: '#0284c7',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  padding: '10px 16px',
  fontSize: '13px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  width: '100%'
};

const buttonSecondaryStyle = {
  backgroundColor: '#ffffff',
  color: '#0284c7',
  border: '1px solid #0284c7',
  borderRadius: '4px',
  padding: '10px 16px',
  fontSize: '13px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  width: '100%'
};

const filterGroupStyle = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap'
};

const filterButtonStyle = (isActive) => ({
  padding: '6px 12px',
  backgroundColor: isActive ? '#0284c7' : '#ffffff',
  color: isActive ? 'white' : '#4b5563',
  border: `1px solid ${isActive ? '#0284c7' : '#d1d5db'}`,
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: isActive ? '600' : '500',
  transition: 'all 0.2s ease'
});

const summaryCardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '4px',
  padding: '12px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const categoryItemStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '4px',
  padding: '12px',
  marginBottom: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
};

const priorityBadgeStyle = (nivel) => {
  const colors = {
    alta: { bg: '#fee2e2', text: '#dc2626', icon: '🔴' },
    media: { bg: '#fef3c7', text: '#d97706', icon: '🟠' },
    baja: { bg: '#dcfce7', text: '#16a34a', icon: '🟢' },
    critica: { bg: '#fce7f3', text: '#be185d', icon: '⚫' }
  };
  const color = colors[nivel.toLowerCase()] || colors.baja;
  return {
    backgroundColor: color.bg,
    color: color.text,
    padding: '4px 8px',
    borderRadius: '3px',
    fontSize: '11px',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  };
};

export {
  panelContainerStyle,
  sectionHeaderStyle,
  sectionTitleStyle,
  labelStyle,
  valueStyle,
  buttonPrimaryStyle,
  buttonSecondaryStyle,
  filterGroupStyle,
  filterButtonStyle,
  summaryCardStyle,
  categoryItemStyle,
  priorityBadgeStyle
};
