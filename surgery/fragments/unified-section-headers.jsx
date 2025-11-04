/**
 * Unified Section Headers Fragment - CLASS MUNDIAL VISUAL CONSISTENCY
 * Applied to all admin panels for coherent professional branding
 * 
 * Key Features:
 * - Gradient background (brand primary → secondary)
 * - Large icon (60px emoji)
 * - Bold typography hierarchy
 * - Professional shadow
 * - Consistent spacing across all panels
 */

// Header Section with Gradient & Icon
const headerSection = {
  padding: `${DESIGN_SYSTEM.spacing.lg} 0`,
  marginBottom: DESIGN_SYSTEM.spacing.xl,
  background: `linear-gradient(135deg, ${DESIGN_SYSTEM.colors.primary.main}15 0%, ${DESIGN_SYSTEM.colors.secondary.main}10 100%)`,
  borderLeft: `4px solid ${DESIGN_SYSTEM.colors.primary.main}`,
  boxShadow: `0 4px 12px ${DESIGN_SYSTEM.colors.primary.main}20`,
  borderRadius: DESIGN_SYSTEM.border.radius.lg,
  display: 'flex',
  alignItems: 'flex-start',
  gap: DESIGN_SYSTEM.spacing.lg
};

const headerIcon = {
  fontSize: '60px',
  flex: '0 0 auto',
  marginTop: DESIGN_SYSTEM.spacing.md,
  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
};

const headerContent = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: DESIGN_SYSTEM.spacing.xs
};

const headerTitle = {
  fontSize: DESIGN_SYSTEM.typography.h2.fontSize,
  fontWeight: '700',
  color: DESIGN_SYSTEM.colors.neutral.dark,
  margin: 0,
  letterSpacing: '-0.02em'
};

const headerDescription = {
  fontSize: DESIGN_SYSTEM.typography.bodySmall.fontSize,
  color: DESIGN_SYSTEM.colors.neutral.medium,
  fontWeight: '500',
  margin: 0,
  letterSpacing: '0.01em'
};

// Primary Action Button - Professional & Impactful
const primaryActionButton = {
  padding: `${DESIGN_SYSTEM.spacing.sm} ${DESIGN_SYSTEM.spacing.lg}`,
  backgroundColor: DESIGN_SYSTEM.colors.primary.main,
  color: 'white',
  border: 'none',
  borderRadius: DESIGN_SYSTEM.border.radius.md,
  fontSize: DESIGN_SYSTEM.typography.body.fontSize,
  fontWeight: '600',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: DESIGN_SYSTEM.spacing.sm,
  transition: `all ${DESIGN_SYSTEM.transitions.normal}`,
  boxShadow: `0 4px 12px ${DESIGN_SYSTEM.colors.primary.main}40`,
  whiteSpace: 'nowrap'
};

const primaryActionButtonHover = {
  backgroundColor: DESIGN_SYSTEM.colors.primary.dark,
  boxShadow: `0 8px 20px ${DESIGN_SYSTEM.colors.primary.main}50`,
  transform: 'translateY(-2px)'
};

// Item Card Container - Unified Across All Panels
const itemCard = {
  backgroundColor: 'white',
  padding: `${DESIGN_SYSTEM.spacing.lg} ${DESIGN_SYSTEM.spacing.lg}`,
  borderRadius: DESIGN_SYSTEM.border.radius.lg,
  border: `1px solid ${DESIGN_SYSTEM.colors.neutral.light}`,
  boxShadow: `0 2px 8px rgba(0,0,0,0.06)`,
  transition: `all ${DESIGN_SYSTEM.transitions.smooth}`,
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  gap: DESIGN_SYSTEM.spacing.lg,
  alignItems: 'center'
};

const itemCardHover = {
  boxShadow: `0 12px 24px rgba(0,0,0,0.12)`,
  transform: 'translateY(-4px)',
  borderColor: DESIGN_SYSTEM.colors.primary.main
};

// Item Icon Container - Professional & Large
const itemIconContainer = {
  width: '80px',
  height: '80px',
  borderRadius: DESIGN_SYSTEM.border.radius.lg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '44px',
  flexShrink: 0,
  background: 'linear-gradient(135deg, rgba(2,132,199,0.08) 0%, rgba(124,58,237,0.08) 100%)',
  border: `2px solid rgba(2,132,199,0.2)`,
  boxShadow: '0 4px 12px rgba(2,132,199,0.15)',
  transition: `all ${DESIGN_SYSTEM.transitions.normal}`
};

// Item Content Container
const itemContent = {
  display: 'flex',
  flexDirection: 'column',
  gap: DESIGN_SYSTEM.spacing.xs
};

const itemTitle = {
  fontSize: '18px',
  fontWeight: '700',
  color: DESIGN_SYSTEM.colors.neutral.dark,
  margin: 0,
  letterSpacing: '-0.01em'
};

const itemDescription = {
  fontSize: DESIGN_SYSTEM.typography.bodySmall.fontSize,
  color: DESIGN_SYSTEM.colors.neutral.medium,
  fontWeight: '500',
  margin: 0
};

const itemMeta = {
  fontSize: '12px',
  color: DESIGN_SYSTEM.colors.neutral.light,
  fontWeight: '500',
  marginTop: DESIGN_SYSTEM.spacing.xs,
  letterSpacing: '0.02em',
  textTransform: 'uppercase'
};

// Item Actions Container - Right Aligned
const itemActionsContainer = {
  display: 'flex',
  gap: DESIGN_SYSTEM.spacing.sm,
  alignItems: 'center',
  justifyContent: 'flex-end',
  flexShrink: 0
};

const actionButton = {
  padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.md}`,
  borderRadius: DESIGN_SYSTEM.border.radius.md,
  border: 'none',
  fontSize: DESIGN_SYSTEM.typography.bodySmall.fontSize,
  fontWeight: '600',
  cursor: 'pointer',
  transition: `all ${DESIGN_SYSTEM.transitions.fast}`,
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  whiteSpace: 'nowrap'
};

const actionButtonEdit = {
  ...actionButton,
  backgroundColor: `${DESIGN_SYSTEM.colors.primary.main}15`,
  color: DESIGN_SYSTEM.colors.primary.main,
  border: `1px solid ${DESIGN_SYSTEM.colors.primary.main}30`
};

const actionButtonEditHover = {
  backgroundColor: DESIGN_SYSTEM.colors.primary.main,
  color: 'white',
  boxShadow: `0 4px 12px ${DESIGN_SYSTEM.colors.primary.main}40`,
  transform: 'translateY(-2px)'
};

const actionButtonDelete = {
  ...actionButton,
  backgroundColor: `${DESIGN_SYSTEM.colors.semantic.danger}15`,
  color: DESIGN_SYSTEM.colors.semantic.danger,
  border: `1px solid ${DESIGN_SYSTEM.colors.semantic.danger}30`
};

const actionButtonDeleteHover = {
  backgroundColor: DESIGN_SYSTEM.colors.semantic.danger,
  color: 'white',
  boxShadow: `0 4px 12px ${DESIGN_SYSTEM.colors.semantic.danger}40`,
  transform: 'translateY(-2px)'
};

// Empty State - Professional Messaging
const emptyState = {
  padding: `${DESIGN_SYSTEM.spacing.xl} ${DESIGN_SYSTEM.spacing.xl}`,
  textAlign: 'center',
  borderRadius: DESIGN_SYSTEM.border.radius.lg,
  backgroundColor: `${DESIGN_SYSTEM.colors.neutral.light}40`,
  border: `2px dashed ${DESIGN_SYSTEM.colors.neutral.light}`
};

const emptyStateIcon = {
  fontSize: '64px',
  marginBottom: DESIGN_SYSTEM.spacing.md,
  opacity: 0.6,
  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.08))'
};

const emptyStateTitle = {
  fontSize: DESIGN_SYSTEM.typography.h3.fontSize,
  fontWeight: '700',
  color: DESIGN_SYSTEM.colors.neutral.dark,
  margin: `0 0 ${DESIGN_SYSTEM.spacing.xs} 0`
};

const emptyStateDescription = {
  fontSize: DESIGN_SYSTEM.typography.bodySmall.fontSize,
  color: DESIGN_SYSTEM.colors.neutral.medium,
  fontWeight: '500',
  margin: 0
};

export {
  headerSection,
  headerIcon,
  headerContent,
  headerTitle,
  headerDescription,
  primaryActionButton,
  primaryActionButtonHover,
  itemCard,
  itemCardHover,
  itemIconContainer,
  itemContent,
  itemTitle,
  itemDescription,
  itemMeta,
  itemActionsContainer,
  actionButton,
  actionButtonEdit,
  actionButtonEditHover,
  actionButtonDelete,
  actionButtonDeleteHover,
  emptyState,
  emptyStateIcon,
  emptyStateTitle,
  emptyStateDescription
};
