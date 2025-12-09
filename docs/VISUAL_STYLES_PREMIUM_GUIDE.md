# 🎨 Guía de Estilos Visuales Premium - citizen-reports

> **Documentación comprensiva de todos los estilos visuales aplicados**  
> Para replicación consistente por IA en futuras sesiones

---

## 📋 Índice

1. [Sistema de Variables CSS](#sistema-de-variables-css)
2. [Tipografía Premium](#tipografía-premium)
3. [Espaciado y Layout](#espaciado-y-layout)
4. [Componentes de Formulario](#componentes-de-formulario)
5. [Botones Premium](#botones-premium)
6. [Cards y Contenedores](#cards-y-contenedores)
7. [Mapas e Interactivos](#mapas-e-interactivos)
8. [Estados y Feedback](#estados-y-feedback)
9. [Responsive Breakpoints](#responsive-breakpoints)
10. [Patrones de Animación](#patrones-de-animación)

---

## 1. Sistema de Variables CSS

```css
:root {
  /* Colores Primarios (Azul Institucional) */
  --gp-primary-50: #eff6ff;
  --gp-primary-100: #dbeafe;
  --gp-primary-200: #bfdbfe;
  --gp-primary-500: #3b82f6;
  --gp-primary-600: #2563eb;
  --gp-primary-700: #1d4ed8;
  --gp-primary-800: #1e40af;

  /* Grises (Neutros) */
  --gp-gray-50: #f9fafb;
  --gp-gray-100: #f3f4f6;
  --gp-gray-200: #e5e7eb;
  --gp-gray-300: #d1d5db;
  --gp-gray-400: #9ca3af;
  --gp-gray-500: #6b7280;
  --gp-gray-600: #4b5563;
  --gp-gray-700: #374151;
  --gp-gray-800: #1f2937;

  /* Colores Semánticos */
  --gp-success: #10b981;  /* Verde éxito */
  --gp-error: #ef4444;    /* Rojo error */
  --gp-warning: #f59e0b;  /* Amarillo warning */

  /* Border Radius */
  --gp-radius-sm: 6px;
  --gp-radius-md: 8px;
  --gp-radius-lg: 12px;
  --gp-radius-xl: 16px;

  /* Sombras */
  --gp-shadow-sm: 0 1px 3px rgba(0,0,0,0.05);
  --gp-shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --gp-shadow-lg: 0 8px 24px rgba(0,0,0,0.12);
  --gp-shadow-xl: 0 12px 40px rgba(0,0,0,0.15);

  /* Transiciones */
  --gp-transition-fast: 0.15s ease;
  --gp-transition-normal: 0.25s ease;

  /* Fuentes */
  --gp-font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

---

## 2. Tipografía Premium

### Headers
```css
/* Título Principal (H1) */
.gp-header-title {
  font-size: clamp(28px, 8vw, 42px);
  font-weight: 900;
  letter-spacing: -1px;
  line-height: 1.2;
  /* Gradient text effect */
  background: linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Subtítulo */
.gp-header-subtitle {
  font-size: clamp(14px, 2vw, 16px);
  font-weight: 400;
  letter-spacing: 0.4px;
  line-height: 1.6;
  opacity: 0.92;
}
```

### Labels de Formulario
```css
.gp-form-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--gp-gray-700);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin-bottom: 10px;
}
```

### Texto de Ayuda
```css
.gp-char-count, .gp-hint {
  font-size: 12px;
  color: var(--gp-gray-500);
  font-style: italic;
  margin-top: 6px;
}
```

---

## 3. Espaciado y Layout

### Form Groups
```css
.gp-form-group {
  margin-bottom: 24px;
}

.gp-mb-32 { margin-bottom: 32px; }
.gp-mt-28 { margin-top: 28px; }
```

### Container Principal
```css
.gp-report-form-container {
  padding: 24px;
  background: linear-gradient(135deg, var(--gp-gray-50) 0%, var(--gp-gray-200) 100%);
}

.gp-report-form-card {
  max-width: 900px;
  margin: 0 auto;
  background: var(--gp-white);
  border-radius: var(--gp-radius-xl);
  box-shadow: var(--gp-shadow-xl);
}
```

### Body del Formulario
```css
.gp-report-form-body {
  padding: 32px 24px;
}
```

---

## 4. Componentes de Formulario

### Input de Texto
```css
.gp-form-input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid var(--gp-gray-200);
  border-radius: var(--gp-radius-md);
  font-size: 15px;
  font-family: var(--gp-font-sans);
  color: var(--gp-gray-800);
  background: var(--gp-white);
  transition: all var(--gp-transition-fast);
  box-sizing: border-box;
}

.gp-form-input:hover {
  border-color: var(--gp-gray-300);
}

.gp-form-input:focus {
  border-color: var(--gp-primary-500);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
  outline: none;
}

/* iOS zoom prevention */
@media (max-width: 640px) {
  .gp-form-input, .gp-select, .gp-textarea {
    font-size: 16px;
  }
}
```

### Select Dropdown
```css
.gp-select {
  width: 100%;
  padding: 14px 18px;
  padding-right: 48px;
  border: 2px solid var(--gp-gray-200);
  border-radius: var(--gp-radius-md);
  font-size: 16px;
  font-weight: 500;
  color: var(--gp-gray-700);
  background: var(--gp-white);
  cursor: pointer;
  appearance: none;
  /* Chevron icon */
  background-image: url("data:image/svg+xml,...chevron...");
  background-position: right 16px center;
  background-repeat: no-repeat;
  background-size: 18px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: all 0.2s ease;
}

.gp-select:hover {
  border-color: var(--gp-gray-300);
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
}

.gp-select:focus {
  border-color: var(--gp-primary-500);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
}
```

### Textarea
```css
.gp-textarea {
  width: 100%;
  padding: 14px 18px;
  border: 2px solid var(--gp-gray-200);
  border-radius: var(--gp-radius-md);
  font-size: 16px;
  font-family: var(--gp-font-sans);
  resize: vertical;
  min-height: 100px;
  transition: all 0.2s ease;
}

.gp-textarea:hover {
  border-color: var(--gp-gray-300);
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
}

.gp-textarea:focus {
  border-color: var(--gp-primary-500);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
}
```

### Urgencia Radio Group (Cards Verticales)
```css
.gp-urgencia-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.gp-urgencia-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 20px;
  min-width: 90px;
  border: 2px solid var(--gp-gray-200);
  border-radius: var(--gp-radius-md);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  background: var(--gp-white);
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  transition: all 0.25s ease;
  text-align: center;
}

.gp-urgencia-option:hover {
  border-color: var(--gp-gray-300);
  background: var(--gp-gray-50);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.gp-urgencia-option.selected {
  border-color: var(--gp-primary-500);
  background: linear-gradient(135deg, var(--gp-primary-50) 0%, #eff6ff 100%);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
  transform: translateY(-2px);
}

.gp-urgencia-option input {
  display: none; /* Radio oculto, styling visual only */
}
```

---

## 5. Botones Premium

### Botón Principal (Submit)
```css
.gp-btn-submit {
  width: 100%;
  padding: 18px 28px;
  background: linear-gradient(135deg, 
    var(--gp-primary-500) 0%, 
    var(--gp-primary-600) 50%, 
    var(--gp-primary-700) 100%
  );
  color: white;
  border: none;
  border-radius: var(--gp-radius-lg);
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  box-shadow: 
    0 6px 20px rgba(37, 99, 235, 0.3), 
    0 2px 8px rgba(37, 99, 235, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

/* Shimmer effect */
.gp-btn-submit::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s ease;
}

.gp-btn-submit:hover:not(:disabled)::before {
  left: 100%;
}

.gp-btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 
    0 8px 28px rgba(37, 99, 235, 0.35), 
    0 4px 12px rgba(37, 99, 235, 0.25);
}

.gp-btn-submit:disabled {
  background: linear-gradient(135deg, var(--gp-gray-400) 0%, var(--gp-gray-500) 100%);
  cursor: not-allowed;
  box-shadow: none;
}
```

### Botones de Ubicación
```css
.gp-btn-location {
  flex: 1;
  min-width: 140px;
  padding: 12px 16px;
  border: none;
  border-radius: var(--gp-radius-md);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.gp-btn-location-gps {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
}

.gp-btn-location-gps:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
}

.gp-btn-location-center {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
}
```

---

## 6. Cards y Contenedores

### Location Info Box (Verde)
```css
.gp-location-info {
  padding: 20px;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border: 2px solid #86efac;
  border-radius: var(--gp-radius-lg);
  margin-bottom: 28px;
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.1);
}

.gp-location-info-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 15px;
  font-weight: 700;
  color: #166534;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.gp-location-info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.gp-location-info-item label {
  font-size: 11px;
  color: #4b7c59;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  display: block;
}

.gp-location-info-value {
  padding: 10px 14px;
  background: white;
  border: 1px solid #bbf7d0;
  border-radius: var(--gp-radius-sm);
  font-size: 14px;
  font-weight: 500;
  color: var(--gp-gray-800);
  min-height: 42px;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.gp-location-info-hint {
  margin-top: 12px;
  padding: 10px 14px;
  background: rgba(255,255,255,0.6);
  border-radius: var(--gp-radius-sm);
  font-size: 12px;
  color: #4b7c59;
  font-style: italic;
}
```

### Header Premium (Gradient Azul)
```css
.gp-report-header {
  background: linear-gradient(135deg, 
    #0f172a 0%, 
    #1e3a8a 25%, 
    #1e40af 50%, 
    #3b82f6 75%, 
    #60a5fa 100%
  );
  color: white;
  padding: 64px 40px 56px;
  text-align: center;
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 20px 60px rgba(30, 58, 138, 0.3), 
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* Orb decorativo flotante */
.gp-report-header::before {
  content: '';
  position: absolute;
  top: -40%;
  right: -15%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(96, 165, 250, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  filter: blur(60px);
  animation: gp-float-orb 6s ease-in-out infinite;
}
```

### Badge de Estado
```css
.gp-report-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.gp-report-status-dot {
  width: 6px;
  height: 6px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
  animation: gp-pulse-dot 2s ease-in-out infinite;
}
```

---

## 7. Mapas e Interactivos

### Contenedor del Mapa
```css
.gp-map-container {
  width: 100%;
  height: 450px;
  border: 2px solid var(--gp-gray-300);
  border-radius: var(--gp-radius-md);
  background: var(--gp-gray-100);
  box-shadow: var(--gp-shadow-sm);
}

/* Responsive heights */
@media (max-width: 768px) { .gp-map-container { height: 380px; } }
@media (max-width: 640px) { .gp-map-container { height: 320px; } }
@media (max-width: 380px) { .gp-map-container { height: 280px; } }
```

### Map Section
```css
.gp-map-section {
  margin-bottom: 16px;
  padding: 16px;
  background: var(--gp-gray-50);
  border-radius: var(--gp-radius-md);
  border: 1px solid var(--gp-gray-200);
}

.gp-map-label {
  font-size: 14px;
  color: var(--gp-gray-700);
  font-weight: 600;
  margin-bottom: 8px;
}

.gp-map-hint {
  font-size: 12px;
  color: var(--gp-gray-500);
  margin-bottom: 12px;
  line-height: 1.4;
}

.gp-map-tip {
  display: flex;
  align-items: center;
  margin-top: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
  border: 1px solid #bbf7d0;
  border-radius: var(--gp-radius-sm);
}

.gp-map-tip-text {
  font-size: 11px;
  color: #059669;
  font-style: italic;
}
```

---

## 8. Estados y Feedback

### Alertas
```css
.gp-alert {
  padding: 14px 16px;
  border-radius: var(--gp-radius-md);
  font-size: 14px;
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.gp-alert-success {
  background: linear-gradient(135deg, #f0fdf4 0%, #f5fff8 100%);
  border: 1px solid #bbf7d0;
  color: #166534;
}

.gp-alert-error {
  background: linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%);
  border: 1px solid #fecaca;
  color: #b91c1c;
}

.gp-alert-warning {
  background: linear-gradient(135deg, #fffbeb 0%, #fffef5 100%);
  border: 1px solid #fde68a;
  color: #92400e;
}
```

### Loading Overlay
```css
.gp-loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.gp-loading-card {
  background: white;
  padding: 32px 48px;
  border-radius: var(--gp-radius-xl);
  box-shadow: var(--gp-shadow-xl);
  text-align: center;
}

.gp-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--gp-gray-200);
  border-top-color: var(--gp-primary-600);
  border-radius: 50%;
  margin: 0 auto 16px;
  animation: gp-spin 1s linear infinite;
}
```

---

## 9. Responsive Breakpoints

```css
/* Tablet */
@media (max-width: 768px) {
  .gp-report-form-container { padding: 12px; }
  .gp-report-header { padding: 40px 20px 32px; }
  .gp-location-info-grid { grid-template-columns: repeat(2, 1fr); }
}

/* Mobile */
@media (max-width: 640px) {
  .gp-report-form-container { padding: 8px; }
  .gp-report-header { padding: 32px 16px 28px; }
  .gp-report-form-body { padding: 20px 16px; }
  .gp-location-buttons { flex-direction: column; }
  .gp-btn-location { min-width: 100%; }
  .gp-urgencia-group { flex-direction: column; }
  .gp-location-info-grid { grid-template-columns: 1fr 1fr; }
  
  /* iOS zoom prevention */
  .gp-select, .gp-textarea, .gp-form-input { font-size: 16px; }
}

/* Small Mobile (iPhone SE) */
@media (max-width: 380px) {
  .gp-report-form-container { padding: 4px; }
  .gp-location-info-grid { grid-template-columns: 1fr; }
}

/* Touch devices */
@media (hover: none) and (pointer: coarse) {
  .gp-btn-location, .gp-urgencia-option, .gp-btn-submit {
    min-height: 48px; /* Minimum touch target */
  }
}

/* Safe area for notched devices */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .gp-report-form-footer {
    padding-bottom: calc(16px + env(safe-area-inset-bottom));
  }
}
```

---

## 10. Patrones de Animación

```css
/* Fade in down */
@keyframes gp-fade-in-down {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Float orb (decorativo) */
@keyframes gp-float-orb {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(30px, -30px) rotate(120deg); }
  66% { transform: translate(-20px, 20px) rotate(240deg); }
}

/* Pulse dot (indicador activo) */
@keyframes gp-pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.2); }
}

/* Spin (loading) */
@keyframes gp-spin {
  to { transform: rotate(360deg); }
}

/* Scale in (modales) */
@keyframes gp-scale-in {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

/* Pulse (loading button) */
@keyframes gp-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

---

## 📐 Principios de Diseño

### 1. **Consistencia Visual**
- Usar siempre las variables CSS definidas
- Gradients de 135deg para backgrounds principales
- Border-radius consistente: sm(6px), md(8px), lg(12px), xl(16px)

### 2. **Jerarquía de Sombras**
- Elementos base: `0 1px 3px rgba(0,0,0,0.05)`
- Hover: `0 4px 12px rgba(0,0,0,0.08)`
- Elevated: `0 8px 24px rgba(0,0,0,0.12)`
- Modales: `0 12px 40px rgba(0,0,0,0.15)`

### 3. **Feedback Visual**
- Hover: `translateY(-2px)` + sombra aumentada
- Focus: `box-shadow: 0 0 0 4px rgba(color, 0.12)`
- Active: `translateY(0)` para presionado

### 4. **Transiciones**
- Fast (inputs, hovers): `0.15s ease`
- Normal (botones, cards): `0.25s ease`
- Slow (animaciones decorativas): `0.3s ease`

### 5. **Accesibilidad Táctil**
- Touch targets mínimo: 48px
- Font-size 16px en mobile para evitar zoom iOS
- Safe area insets para dispositivos con notch

---

## 🎯 Checklist de Aplicación

Cuando apliques estos estilos a nuevos componentes:

- [ ] Usar variables CSS (`--gp-*`)
- [ ] Aplicar gradients de 135deg
- [ ] Incluir estados `:hover` y `:focus`
- [ ] Agregar transiciones suaves
- [ ] Verificar responsive en 4 breakpoints
- [ ] Asegurar touch targets de 48px mínimo
- [ ] Probar con build (`npm run build`)

---

*Última actualización: 30 de noviembre de 2025*
