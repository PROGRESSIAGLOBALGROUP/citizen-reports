# 🎨 CLASS MUNDIAL Design System - Quick Reference

## Using Unified Styles in Your Components

### Import the Library

```jsx
import * as UnifiedStyles from './unified-section-headers';
import { DESIGN_SYSTEM } from './design-system';
```

### Header Pattern (Most Common)

```jsx
<div style={{
  ...UnifiedStyles.headerSection,
  marginBottom: DESIGN_SYSTEM.spacing.lg,
}}>
  <div style={UnifiedStyles.headerIcon}>🏛️</div>
  <div style={UnifiedStyles.headerContent}>
    <h2 style={UnifiedStyles.headerTitle}>Panel Title</h2>
    <p style={UnifiedStyles.headerDescription}>
      Optional description for context
    </p>
  </div>
</div>
```

**What You Get:**
- Gradient background (left to right)
- 60px centered icon
- Professional typography hierarchy
- Branded left border (4px solid primary color)
- Consistent spacing

**Available Icons:** 📦 (deps), 📁 (categories), 👥 (users), 🗺️ (map), 🎨 (config), etc.

---

## Card Grid Pattern

```jsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: DESIGN_SYSTEM.spacing.lg,
}}>
  {items.map(item => (
    <div key={item.id} style={{
      ...UnifiedStyles.itemCard,
      flexDirection: 'column',
      padding: DESIGN_SYSTEM.spacing.lg,
    }}>
      {/* Icon - Top Center */}
      <div style={{
        ...UnifiedStyles.itemIconContainer,
        width: '90px',
        height: '90px',
        fontSize: '52px',
        alignSelf: 'center',
        marginBottom: DESIGN_SYSTEM.spacing.lg,
      }}>
        {item.icono}
      </div>

      {/* Content - Center */}
      <div style={{
        ...UnifiedStyles.itemContent,
        alignItems: 'center',
        textAlign: 'center',
        width: '100%',
      }}>
        <h3 style={UnifiedStyles.itemTitle}>{item.nombre}</h3>
      </div>

      {/* Buttons - Bottom Full Width */}
      <div style={{
        ...UnifiedStyles.itemActionsContainer,
        justifyContent: 'center',
        width: '100%',
        marginTop: DESIGN_SYSTEM.spacing.lg,
      }}>
        <button style={UnifiedStyles.actionButtonEdit}>✏️ Edit</button>
        <button style={UnifiedStyles.actionButtonDelete}>🗑️ Delete</button>
      </div>
    </div>
  ))}
</div>
```

**What You Get:**
- Responsive GRID (auto-fit, minmax 320px)
- Vertical card layout (icon → content → buttons)
- Professional shadows with hover effects
- Smooth transitions (0.25s)
- Scale transforms on interaction

---

## Empty State Pattern

```jsx
{items.length === 0 && (
  <div style={UnifiedStyles.emptyState}>
    <div style={UnifiedStyles.emptyStateIcon}>📋</div>
    <h3 style={UnifiedStyles.emptyStateTitle}>No Items Yet</h3>
    <p style={UnifiedStyles.emptyStateDescription}>
      Create your first item to get started
    </p>
  </div>
)}
```

**What You Get:**
- Centered layout with vertical flex
- Large centered icon
- Professional typography
- Subtle background color
- Lots of whitespace for focus

---

## Button Patterns

### Edit Button (Primary Action)

```jsx
<button style={UnifiedStyles.actionButtonEdit}>
  ✏️ Edit
</button>
```

### Delete Button (Destructive Action)

```jsx
<button style={UnifiedStyles.actionButtonDelete}>
  🗑️ Delete
</button>
```

### Primary Action Button (Large CTA)

```jsx
<button style={UnifiedStyles.primaryActionButton}>
  + Create New
</button>
```

**Hover Behavior:**
- Color inversion
- Subtle shadow lift (translateY -2px)
- Smooth transition (DESIGN_SYSTEM.transition.normal = 0.25s)

---

## DESIGN_SYSTEM Token Reference

### Spacing
```
xs: 4px    sm: 8px    md: 12px   lg: 16px   
xl: 20px   2xl: 24px  3xl: 32px  4xl: 40px  5xl: 48px
```

### Colors
```
Primary:      #0284c7 (main), #0369a1 (dark)
Success:      #10b981
Danger:       #ef4444
Warning:      #f59e0b
Neutral:      Various grays
```

### Typography
```
h1-h4, body, bodySmall, label, labelSmall
```

### Transitions
```
DESIGN_SYSTEM.transition.fast:   0.15s
DESIGN_SYSTEM.transition.normal: 0.25s
DESIGN_SYSTEM.transition.smooth: 0.35s
```

### Shadows
```
shadow.sm, shadow.md, shadow.lg, shadow.xl
```

---

## Common Mistakes to Avoid

❌ **Wrong:**
```jsx
transition: `all ${DESIGN_SYSTEM.transitions.normal}` // ❌ transitions (plural) doesn't exist!
```

✅ **Correct:**
```jsx
transition: `all ${DESIGN_SYSTEM.transition.normal}` // ✅ transition (singular)
```

---

❌ **Wrong - Hardcoded values:**
```jsx
padding: '16px', // ❌ Use DESIGN_SYSTEM.spacing instead
color: '#0284c7', // ❌ Use DESIGN_SYSTEM.colors.primary.main
```

✅ **Correct - Token-based:**
```jsx
padding: DESIGN_SYSTEM.spacing.lg,
color: DESIGN_SYSTEM.colors.primary.main,
```

---

## File Organization

All unified styles live in ONE place:

```
client/src/unified-section-headers.js
```

Import as needed - don't duplicate styles. This makes it easy to:
- Update all headers at once
- Maintain consistency
- A/B test visual changes
- Hand off to designers

---

## When to Use Each Style

| Situation | Use This |
|-----------|----------|
| Section header in admin panel | `headerSection` |
| List of items in grid | `itemCard` + responsive GRID |
| No data found | `emptyState` |
| 90px icon in card | `itemIconContainer` |
| Edit/Delete on card | `actionButtonEdit` / `actionButtonDelete` |
| Large CTA button | `primaryActionButton` |
| Text content in card | `itemContent` + `itemTitle` |
| Action buttons row | `itemActionsContainer` |

---

## Advanced: Customizing Styles

You can extend any style by spreading + overriding:

```jsx
<div style={{
  ...UnifiedStyles.itemCard,
  // Override specific properties:
  backgroundColor: 'rgba(255, 0, 0, 0.05)', // Custom background
  borderRadius: DESIGN_SYSTEM.border.radius.lg, // Override radius
}}>
  Custom card variant
</div>
```

**But Remember:**
- Keep overrides minimal
- If overriding >3 properties, consider adding to `unified-section-headers.js`
- Never hardcode colors - use DESIGN_SYSTEM tokens
- Always use DESIGN_SYSTEM spacing for consistency

---

## Performance Notes

- Styles are objects (not CSS-in-JS), so they're checked at component render
- Memoize style objects if they don't change:
  ```jsx
  const headerStyle = useMemo(() => ({
    ...UnifiedStyles.headerSection,
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  }), []);
  ```
- Most panels don't need this - React optimizes automatically

---

## Visual Showcase

### AdminDependencias
- ✨ GRID responsive layout
- ✨ 90px colored icons with gradients
- ✨ Vertical cards (icon → content → buttons)
- ✨ Professional shadows & hover effects

### AdminCategorias
- 📁 Unified header with gradient
- 📁 Consistent empty state
- 📁 Professional spacing

### AdminUsuarios
- 👥 Professional header with description
- 👥 Unified styling across panel

### ImprovedMapView
- 🗺️ Unified section headers (filters, summary)
- 📊 Consistent typography and spacing

### WhiteLabelConfig
- 🎨 Professional header with gradient
- 🎨 Consistent with other panels

---

## Questions?

Refer to the documentation in:
- `docs/CLASS_MUNDIAL_UNIFICATION_COMPLETE_2025-11-03.md` - Full details
- `client/src/unified-section-headers.js` - Implementation
- `client/src/design-system.js` - Token definitions

---

**Last Updated:** November 3, 2025  
**Version:** 1.0 (CLASS MUNDIAL Design System)  
**Status:** Production Ready ✅
