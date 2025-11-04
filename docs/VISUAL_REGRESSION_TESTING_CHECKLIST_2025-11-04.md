# Visual Regression Testing Checklist
**November 4, 2025**

## 🎯 Objetivo
Verificar que todos los admin panels se ven profesionales, consistentes y "clase mundial" después de las mejoras de diseño.

---

## 📋 Testing Procedure

### Setup
1. Open browser console: **F12**
2. Clear cache: **Ctrl+Shift+Del** (or visit in incognito)
3. Navigate to: `http://localhost:4000/#admin`
4. Login with: `admin@jantetelco.gob.mx` / `admin123`

### Screenshot Capture
For each panel:
1. Full page screenshot at 1920x1080 (desktop)
2. Scroll if content exceeds viewport
3. Test hover states on key elements
4. Note any visual inconsistencies

---

## ✅ AdminDependencias Panel Checklist

### ItemDependencia Cards - Key Visual Elements

#### Icon Box (76px)
- [ ] Icon box is **large** (76px, not tiny 40px)
- [ ] Icon box has **colored border** matching department color
- [ ] Icon emoji is **prominent** (40px emoji, visible)
- [ ] Icon box has **colored shadow** (glow effect)
- [ ] Border radius is **rounded** (12px, not sharp)
- [ ] Icon box maintains color through card list

#### Card Container
- [ ] Cards have **generous padding** (visible air around content)
- [ ] Cards have **readable spacing** (16px gap between cards)
- [ ] Cards have **subtle shadow** (perceivable depth)
- [ ] Cards on drag have **elevated shadow** (much darker)
- [ ] Cards on drag have **slight scale** (small zoom effect)
- [ ] Overall appearance is **premium, not cramped**

#### Drag Handle (⋮⋮)
- [ ] Drag handle is **visible** on left
- [ ] Drag handle color changes to **brand blue on hover**
- [ ] Drag handle is **easy to grab** (good padding)

#### Department Name
- [ ] Department name is **bold** (700 weight)
- [ ] Department name is **dark** (#1e293b)
- [ ] Department name is **prominent** (18px)
- [ ] Department name has **spacing below** (6px margin)

#### Slug & Description
- [ ] Slug is **visible** (slightly lighter than name)
- [ ] Slug is **medium weight** (500)
- [ ] Description is **muted** (light gray, secondary info)
- [ ] Bullet separator is **subtle** (•)

#### Responsable Info
- [ ] Contact icon (👤) is **visible**
- [ ] Contact info is **secondary** (lighter color)
- [ ] Phone number is **included if available**
- [ ] Info is **clearly separated** from above

#### Status Badge
- [ ] Badge is **green** when Activa
- [ ] Badge is **red** when Inactiva
- [ ] Badge has **padding** (not cramped)
- [ ] Badge has **icon** (✓ or ✗)
- [ ] Badge has **text** ("Activa" or "Inactiva")
- [ ] Badge has **subtle shadow** (semantic color glow)

#### Action Buttons
- [ ] Edit button is **visible** with "✏️ Editar" text
- [ ] Delete button is **visible** with "🗑️ Eliminar" text
- [ ] Buttons are **aligned right**
- [ ] Buttons have **good spacing** (not touching)
- [ ] Edit button on hover:
  - [ ] Background turns **brand blue** (#0284c7)
  - [ ] Text turns **white**
  - [ ] Shadow deepens (glow effect)
  - [ ] Button **lifts** slightly (translateY effect)
- [ ] Delete button on hover:
  - [ ] Background turns **red** (#dc2626)
  - [ ] Text turns **white**
  - [ ] Shadow deepens (glow effect)
  - [ ] Button **lifts** slightly

#### Consistency Across Cards
- [ ] All cards have **same padding**
- [ ] All cards have **same spacing**
- [ ] All cards have **same shadow depth**
- [ ] All icons are **same size** (76px)
- [ ] All text sizes are **consistent**
- [ ] Visual style is **uniform** across list

---

## ✅ Other Admin Panels - Consistency Check

### ImprovedMapView
- [ ] Header has **gradient background** (dark blue)
- [ ] Header has **brand color accent** (left border or underline)
- [ ] Buttons have **consistent styling** with ItemDependencia buttons
- [ ] Overall color scheme matches **design-system**

### AdminUsuarios
- [ ] Table has **consistent padding**
- [ ] Badges use **semantic colors** (green/yellow/red)
- [ ] Buttons match **ItemDependencia button styles**
- [ ] Input fields have **consistent borders** and styling
- [ ] Overall layout is **professional and organized**

### AdminCategorias
- [ ] Loading states use **design-system colors**
- [ ] Error messages are **clearly visible** (red background)
- [ ] Buttons are **consistent** with other panels
- [ ] Spacing is **generous** (similar to AdminDependencias)

### WhiteLabelConfig
- [ ] Form sections are **well-organized**
- [ ] Input fields have **consistent styling**
- [ ] Buttons use **brand colors**
- [ ] Overall appearance is **professional**

---

## 🎨 Design System Compliance

### Colors
- [ ] Primary blue (#0284c7) used for:
  - [ ] Drag handle hover
  - [ ] Edit button hover
  - [ ] Links and accents
- [ ] Semantic colors used correctly:
  - [ ] Green (#10b981) for success/active
  - [ ] Red (#ef4444) for danger/inactive
  - [ ] Proper contrast for accessibility

### Typography
- [ ] Department name: 18px, bold (700)
- [ ] Slug/description: 13px, regular
- [ ] Meta info: 13px, medium weight (500)
- [ ] Badge: 12px, bold (600)
- [ ] Button text: 13px, bold (600)

### Spacing
- [ ] Card padding: 16px top/bottom, 20px left/right
- [ ] Gap between cards: 16px
- [ ] Internal element gaps: 6-8px
- [ ] Icon box: 76px × 76px
- [ ] No cramped or overly spacious areas

### Shadows
- [ ] Normal card: `0 4px 6px rgba(0,0,0,0.1)` (subtle)
- [ ] Dragging card: `0 20px 25px rgba(0,0,0,0.15)` (elevated)
- [ ] Icon box: color-matched glow effect
- [ ] Buttons on hover: color-matched shadow

### Transitions
- [ ] All hover effects are **smooth** (0.25s cubic-bezier)
- [ ] No jarring or instant changes
- [ ] GPU-accelerated (transform/opacity, not dimensions)

---

## 🚀 Performance Checks

- [ ] **Page loads quickly** (no noticeable delay)
- [ ] **Hover effects are smooth** (60fps, no jank)
- [ ] **Scrolling is smooth** (no performance issues)
- [ ] **No console errors** (F12 → Console tab is clean)
- [ ] **No console warnings** (no yellow warnings)

---

## 📸 Screenshot Comparison

### Capture Locations
1. **AdminDependencias - Full Page**
   - Shows entire departments list with cards
   - Highlights icon improvements
   - Documents spacing and shadows

2. **AdminDependencias - Item Hover**
   - Capture hover state on one card
   - Shows button color changes
   - Documents lifted effect

3. **AdminUsuarios - Table View**
   - Shows consistency with other panels
   - Demonstrates semantic badges
   - Consistent button styling

4. **AdminCategorias - List View**
   - Shows form styling consistency
   - Demonstrates spacing uniformity

5. **ImprovedMapView - Header**
   - Shows header gradient and brand colors
   - Consistent with other panels

### Before/After Comparison
- [ ] AdminDependencias cards before (small icons, cramped)
- [ ] AdminDependencias cards after (large icons, generous spacing)
- [ ] Button styles before (icon-only, basic hover)
- [ ] Button styles after (text + icon, sophisticated hover)

---

## ✨ Visual Quality Assessment

### Rate Each Element (1-10)

**ItemDependencia Card Overall:** ___/10
- Expected: 9-10 (premium, professional)
- Should feel like high-end SaaS

**Icon Box Design:** ___/10
- Expected: 9-10 (prominent, elegant)
- Clear visual focus point

**Button Interactions:** ___/10
- Expected: 9-10 (sophisticated, responsive)
- Multiple feedback cues

**Spacing & Air:** ___/10
- Expected: 9-10 (generous, breathable)
- Professional layout

**Color Consistency:** ___/10
- Expected: 10/10 (matches design-system)
- Semantic and intentional

**Typography Hierarchy:** ___/10
- Expected: 9-10 (clear primary/secondary)
- Easy to scan

**Shadow & Depth:** ___/10
- Expected: 9-10 (perceivable depth)
- Professional quality

**Overall "Class Mundial" Rating:** ___/10
- Expected: 9-10
- Government-grade appearance
- Would impress a mayor

---

## 🔍 Known Issues to Watch For

### Icon Box
- ❌ **FAIL:** Icon box is still 40-48px (should be 76px)
- ❌ **FAIL:** No colored shadow on icon (should have glow)
- ❌ **FAIL:** Icon emoji is too small

### Cards
- ❌ **FAIL:** Cards are cramped (padding too small)
- ❌ **FAIL:** Cards have no visible shadow (should have depth)
- ❌ **FAIL:** Gap between cards is minimal

### Buttons
- ❌ **FAIL:** Buttons show only emoji (should have text)
- ❌ **FAIL:** Hover effect is invisible (should change color + shadow + lift)
- ❌ **FAIL:** Buttons don't match design-system colors

### Overall
- ❌ **FAIL:** Appearance looks basic, not premium
- ❌ **FAIL:** No visual consistency across panels
- ❌ **FAIL:** Components look cramped and cluttered

---

## ✅ Success Criteria

**All items below must be TRUE for regression test to PASS:**

1. ✅ Icon boxes are **76px** (not 40-48px)
2. ✅ Icons have **colored shadows** (glow effect)
3. ✅ Cards have **generous padding** (16px/20px)
4. ✅ Cards have **readable shadows** (0 4px 6px)
5. ✅ Buttons show **text + icon** (not icon-only)
6. ✅ Buttons have **sophisticated hover** (color + shadow + lift)
7. ✅ All elements are **consistent** across panels
8. ✅ Overall appearance is **premium/professional**
9. ✅ No **console errors or warnings**
10. ✅ Performance is **smooth** (no jank)

**Test Result:** PASS ✅ / FAIL ❌

---

## 📝 Notes & Observations

### What Worked Well
- 
- 
- 

### Areas for Improvement
- 
- 
- 

### Unexpected Findings
- 
- 
- 

### Recommendations
- 
- 
- 

---

## 🎯 Next Steps

If PASS ✅:
1. Proceed to government presentation screenshots
2. Deploy to staging environment
3. Send for user acceptance testing
4. Prepare for production release

If FAIL ❌:
1. Document specific issues
2. Debug and fix individual components
3. Re-run visual regression testing
4. Verify fixes before proceeding

---

**Testing Date:** November 4, 2025  
**Tester:** [Your Name]  
**Result:** [PASS/FAIL]  
**Time Spent:** __ minutes  
**Confidence Level:** 🟢 High / 🟡 Medium / 🔴 Low
