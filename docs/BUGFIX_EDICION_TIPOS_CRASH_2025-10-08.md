# BUGFIX: Error al editar tipos de reportes - 2025-10-08

## Síntoma

Al intentar modificar el nombre de un tipo de reporte desde el panel de administración (`#admin/categorias`), la aplicación se rompía completamente mostrando "Error al cargar categorías" en la interfaz de administración.

## Causa Raíz

**Múltiples problemas interconectados:**

### 1. Token de autenticación incorrecto
Los componentes del panel de administración usaban `localStorage.getItem('token')` cuando el sistema de autenticación almacena el token como `localStorage.getItem('auth_token')`. Esto causaba que todas las peticiones fallaran con 401 Unauthorized.

### 2. Nombre de columna SQL incorrecto
El backend de administración (`server/admin-routes.js`) usaba la columna `slug` en INSERT/UPDATE:
```sql
INSERT INTO tipos_reporte (categoria_id, slug, nombre, ...)
UPDATE tipos_reporte SET categoria_id = ?, slug = ?, ...
```

Pero el schema real de la base de datos define la columna como `tipo`:
```sql
CREATE TABLE tipos_reporte (
  id INTEGER PRIMARY KEY,
  tipo TEXT UNIQUE NOT NULL,  -- ← Esta es la columna correcta
  nombre TEXT NOT NULL,
  ...
)
```

### 3. Schema de historial_cambios desactualizado
El código del admin intentaba registrar cambios usando columnas `entidad` y `entidad_id`:
```javascript
INSERT INTO historial_cambios (usuario_id, entidad, entidad_id, tipo_cambio, ...)
```

Pero el schema de `historial_cambios` solo soportaba auditoría de reportes con `reporte_id NOT NULL`:
```sql
CREATE TABLE historial_cambios (
  id INTEGER PRIMARY KEY,
  reporte_id INTEGER NOT NULL,  -- ← Solo para reportes
  usuario_id INTEGER NOT NULL,
  ...
)
```

Esto causaba error: **"table historial_cambios has no column named entidad"**

### 4. Mapeo incorrecto en formulario
El formulario de edición cargaba `tipo?.slug` cuando la propiedad del objeto es `tipo.tipo`.

## Correcciones Aplicadas

### ✅ 1. Token de autenticación (Frontend)

**Archivos modificados:**
- `client/src/FormularioTipo.jsx` (línea 69)
- `client/src/FormularioCategoria.jsx` (línea 32)
- `client/src/AdminCategorias.jsx` (líneas 75, 105, 131)

```javascript
// ANTES (❌)
const token = localStorage.getItem('token');

// AHORA (✅)
const token = localStorage.getItem('auth_token');
```

### ✅ 2. Nombre de columna SQL (Backend)

**Archivo modificado:** `server/admin-routes.js`

```javascript
// ANTES (❌)
INSERT INTO tipos_reporte (categoria_id, slug, nombre, ...)
UPDATE tipos_reporte SET categoria_id = ?, slug = ?, ...
SELECT id FROM tipos_reporte WHERE slug = ?

// AHORA (✅)
INSERT INTO tipos_reporte (categoria_id, tipo, nombre, ...)
UPDATE tipos_reporte SET categoria_id = ?, tipo = ?, ...
SELECT id FROM tipos_reporte WHERE tipo = ?
```

**Líneas corregidas:**
- Línea 269: Validación al crear
- Línea 292: INSERT al crear
- Línea 357: Validación al editar
- Línea 372: UPDATE al editar

### ✅ 3. Migración de historial_cambios (Base de Datos)

**Archivos creados:**
- `server/migrations/001_historial_cambios_generico.sql` - Script SQL de migración
- `server/apply-migration.js` - Script Node.js para aplicar migración

**Cambios en schema:**

```sql
-- ANTES (❌): Solo soportaba reportes
CREATE TABLE historial_cambios (
  id INTEGER PRIMARY KEY,
  reporte_id INTEGER NOT NULL,
  usuario_id INTEGER NOT NULL,
  ...
)

-- AHORA (✅): Genérico para cualquier entidad
CREATE TABLE historial_cambios (
  id INTEGER PRIMARY KEY,
  usuario_id INTEGER NOT NULL,
  entidad TEXT NOT NULL,        -- 'reporte', 'tipo_reporte', 'categoria', etc.
  entidad_id INTEGER NOT NULL,  -- ID de la entidad
  tipo_cambio TEXT NOT NULL,
  ...
)
```

**Índices actualizados:**
```sql
-- ANTES
CREATE INDEX idx_historial_reporte ON historial_cambios(reporte_id);

-- AHORA
CREATE INDEX idx_historial_entidad ON historial_cambios(entidad, entidad_id);
```

**Migración de datos existentes:**
Los registros antiguos se migraron automáticamente:
```sql
INSERT INTO historial_cambios_new 
  (usuario_id, entidad, entidad_id, tipo_cambio, ...)
SELECT 
  usuario_id, 
  'reporte' as entidad,
  reporte_id as entidad_id,
  tipo_cambio,
  ...
FROM historial_cambios;
```

### ✅ 4. Código de audit trail actualizado

**Archivos modificados:**
- `server/reportes_auth_routes.js` (línea 457)
- `server/reasignacion-utils.js` (línea 63)

```javascript
// ANTES (❌)
INSERT INTO historial_cambios (reporte_id, usuario_id, ...)

// AHORA (✅)
INSERT INTO historial_cambios (usuario_id, entidad, entidad_id, ...)
VALUES (?, 'reporte', ?, ...)
```

### ✅ 5. Mapeo en formulario

**Archivo modificado:** `client/src/FormularioTipo.jsx`

```javascript
// ANTES (❌)
const [slug, setSlug] = React.useState(tipo?.slug || '');

// AHORA (✅)
const [slug, setSlug] = React.useState(tipo?.tipo || '');
```

## Procedimiento de Aplicación

1. **Detener servidores:**
   ```powershell
   Get-Process | Where-Object {$_.ProcessName -match "node"} | Stop-Process -Force
   ```

2. **Aplicar migración de base de datos:**
   ```powershell
   cd server
   node apply-migration.js
   ```

3. **Reiniciar servidores:**
   ```powershell
   cd server && node server.js   # Backend
   cd client && npm run dev      # Frontend
   ```

## Resultado

✅ **Problema completamente resuelto**
- Los tipos de reportes se pueden crear, editar y eliminar sin errores
- El audit trail registra correctamente los cambios
- La autenticación funciona correctamente en todos los endpoints del admin
- Los datos históricos se preservaron durante la migración

## Lecciones Aprendidas

1. **Consistencia en nombres de columnas:** El schema y el código deben usar exactamente los mismos nombres (`tipo` vs `slug`)

2. **Audit trail genérico desde el inicio:** Diseñar tablas de auditoría genéricas evita migraciones posteriores

3. **Nombres de variables en localStorage:** Usar constantes para evitar discrepancias entre `'token'` y `'auth_token'`

4. **Testing de flujos completos:** El error solo aparecía al intentar guardar, no al abrir el formulario

## Archivos Afectados

### Frontend (5 archivos)
- ✅ `client/src/FormularioTipo.jsx`
- ✅ `client/src/FormularioCategoria.jsx`
- ✅ `client/src/AdminCategorias.jsx`

### Backend (5 archivos)
- ✅ `server/admin-routes.js`
- ✅ `server/reportes_auth_routes.js`
- ✅ `server/reasignacion-utils.js`
- ✅ `server/schema.sql`

### Nuevos archivos (2)
- ✅ `server/migrations/001_historial_cambios_generico.sql`
- ✅ `server/apply-migration.js`

## Verificación

Para confirmar que el fix funciona:

1. Navegar a http://localhost:5173/#admin/categorias
2. Hacer clic en "Editar" en cualquier tipo de reporte
3. Modificar el nombre
4. Hacer clic en "Guardar"
5. **Resultado esperado:** Mensaje "Tipo actualizado correctamente" y la lista se recarga sin errores

## Estado

✅ **RESUELTO** - 2025-10-08 22:10
