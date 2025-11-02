# Implementación: Descripción Corta para Popups del Mapa

**Fecha:** 2025-10-01  
**Tipo:** Feature Implementation  
**Protocolo:** Code Surgeon + Database Migration  

## 🎯 Objetivo

Separar la información pública (visible en el mapa) de la información completa (solo para funcionarios):

- **Descripción corta (`descripcion_corta`):** Texto breve mostrado en popups del mapa (público)
- **Descripción completa (`descripcion`):** Información detallada accesible solo a funcionarios autenticados

## 📊 Cambios Implementados

### 1. Migración de Base de Datos

**Archivo:** `server/migrations/001_add_descripcion_corta.sql`

```sql
-- Agregar columna descripcion_corta
ALTER TABLE reportes ADD COLUMN descripcion_corta TEXT;

-- Generar descripciones cortas automáticas (primeros 100 caracteres)
UPDATE reportes 
SET descripcion_corta = CASE 
  WHEN length(descripcion) <= 100 THEN descripcion
  ELSE substr(descripcion, 1, 100) || '...'
END
WHERE descripcion_corta IS NULL;

-- Crear índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_reportes_descripcion_corta ON reportes(descripcion_corta);
```

**Script de aplicación:** `server/aplicar-migracion-001.js`

**Resultado:**
- ✅ Columna agregada exitosamente
- ✅ 84 registros existentes actualizados con descripcion_corta
- ✅ Índice creado para optimizar consultas

### 2. Backend API (server/app.js)

#### POST /api/reportes
```javascript
app.post('/api/reportes', (req, res) => {
  const { tipo, descripcion = '', descripcion_corta, ... } = req.body;
  
  // Si no se proporciona descripcion_corta, generarla automáticamente
  const descCorta = descripcion_corta || 
    (descripcion.length > 100 ? descripcion.substring(0, 100) + '...' : descripcion);
  
  const stmt = `INSERT INTO reportes(tipo, descripcion, descripcion_corta, ...) VALUES (?,?,?,...)`;
  db.run(stmt, [tipo, descripcion, descCorta, ...], ...);
});
```

#### GET /api/reportes
```javascript
// Ahora incluye descripcion_corta en SELECT
const sql = `SELECT id, tipo, descripcion, descripcion_corta, lat, lng, peso, creado_en FROM reportes ${where}`;
```

#### GET /api/reportes/geojson
```javascript
properties: {
  id: r.id,
  tipo: r.tipo,
  descripcion: r.descripcion,
  descripcion_corta: r.descripcion_corta,  // ← Nuevo campo
  peso: r.peso,
  creado_en: r.creado_en,
}
```

### 3. Frontend (client/src/SimpleMapView.jsx)

**Ya estaba implementado** (líneas 165-168):
```javascript
// Usar descripción corta de la base de datos o fallback a descripción truncada
const descripcionCorta = reporte.descripcion_corta || 
  (reporte.descripcion.length > 50 
    ? reporte.descripcion.substring(0, 50).trim() + '...'
    : reporte.descripcion);
```

**Popup del mapa** (línea 196):
```html
<div style="...">
  ${descripcionCorta}  <!-- ← Solo descripción corta visible en mapa -->
</div>
```

## 🧪 Validación

**Script:** `server/test-descripcion-corta.js`

**Resultado:**
```
✅ Campo descripcion_corta presente en respuesta
✅ El mapa mostrará solo la descripción corta en popups
```

**Prueba manual:**
1. Abrir http://localhost:5173
2. Hacer clic en cualquier marcador del mapa
3. El popup muestra descripción breve
4. La descripción completa solo está disponible para funcionarios

## 📋 Comportamiento del Sistema

### Para Usuarios Públicos (sin login)
- ✅ Ven marcadores en el mapa
- ✅ Popups muestran **descripción corta**
- ❌ NO ven descripción completa
- ❌ NO pueden editar reportes

### Para Funcionarios (con login)
- ✅ Ven marcadores en el mapa
- ✅ Acceden a panel de administración
- ✅ Ven **descripción completa** en panel
- ✅ Pueden editar/cerrar reportes

## 🔄 Flujo de Datos

```
Usuario reporta problema
  ↓
Formulario captura:
  • descripcion (completa)
  • descripcion_corta (opcional)
  ↓
Backend:
  • Si no hay descripcion_corta → genera automáticamente (100 chars)
  • Guarda ambas en DB
  ↓
Mapa público:
  • Muestra descripcion_corta en popup
  ↓
Panel funcionarios:
  • Muestra descripcion completa
```

## 📊 Esquema de Base de Datos

```sql
CREATE TABLE reportes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL,
  descripcion TEXT,           -- Descripción completa (funcionarios)
  descripcion_corta TEXT,     -- Descripción breve (mapa público) ← NUEVO
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  peso INTEGER NOT NULL DEFAULT 1,
  estado TEXT NOT NULL DEFAULT 'abierto',
  dependencia TEXT,
  prioridad TEXT DEFAULT 'media',
  fingerprint TEXT,
  ip_cliente TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## 🎨 Ejemplo Visual

**Popup en mapa (público):**
```
┌────────────────────────────┐
│ 💧 Agua y Drenaje          │
│ ALTA                       │
│                            │
│ No hay agua               │  ← descripcion_corta
│                            │
│ Peso: 5 | ID: 84           │
│ 2/10/2025                  │
└────────────────────────────┘
```

**Panel funcionario (detallado):**
```
┌──────────────────────────────────┐
│ Detalles del Reporte #84         │
├──────────────────────────────────┤
│ Tipo: Agua y Drenaje             │
│ Estado: Abierto                  │
│ Prioridad: Alta                  │
│                                  │
│ Descripción completa:            │
│ Falta de suministro de agua     │ ← descripcion completa
│ potable en la zona desde hace   │
│ 3 días. Afecta a 50 familias.   │
│ Requiere revisión de bomba.      │
│                                  │
│ Asignado a: Juan Pérez           │
│ Dependencia: Agua Potable        │
└──────────────────────────────────┘
```

## 🔧 Mantenimiento

### Regenerar descripciones cortas
```bash
# Si se necesita actualizar todas las descripciones cortas
cd server
node aplicar-migracion-001.js
```

### Actualizar registros existentes
```sql
-- Manualmente en SQLite
UPDATE reportes 
SET descripcion_corta = 'Nueva descripción breve'
WHERE id = X;
```

## 📝 Notas Importantes

1. **Compatibilidad hacia atrás:** Si `descripcion_corta` es NULL, el frontend usa `descripcion`
2. **Generación automática:** Backend crea descripcion_corta si no se proporciona
3. **Límite recomendado:** 100 caracteres para descripcion_corta
4. **Indexado:** Campo indexado para búsquedas rápidas

---
**Autor:** GitHub Copilot  
**Estado:** ✅ COMPLETADO Y PROBADO  
**Migración:** 001_add_descripcion_corta (aplicada exitosamente)
