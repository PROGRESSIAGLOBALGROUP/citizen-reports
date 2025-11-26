# Centralización y Corrección Completa de Base de Datos - 2025-10-05

## 🎯 Problema Identificado

**Síntoma:** Panel izquierdo del mapa vacío, no se mostraban categorías ni tipos de reportes.

**Causa Raíz Múltiple:**

### 1. Archivos .db Duplicados (3 ubicaciones)
```
C:\PROYECTOS\citizen-reports\
├── data.db ❌ (duplicado en raíz - vacío)
├── e2e.db ❌ (para tests E2E)
├── server/
│   ├── data.db ✅ (ubicación correcta)
│   └── migrations/
│       └── data.db ❌ (duplicado - vacío)
```

**Problema:** Múltiples archivos causaban confusión sobre cuál era la fuente de verdad.

### 2. Tablas Faltantes en Schema
El código frontend/backend esperaba tablas `categorias` y `tipos_reporte` (implementadas en ADR-0009) pero **`server/schema.sql` nunca fue actualizado**.

**Tablas faltantes:**
- `categorias` - Lista de categorías con iconos y orden
- `tipos_reporte` - Lista de tipos de reportes con metadatos

**Endpoints que fallaban:**
- `GET /api/categorias` → 500 Internal Server Error (tabla no existe)
- `GET /api/tipos` → 500 Internal Server Error (tabla no existe)

**Consecuencia:** Frontend no podía cargar el panel lateral, mostraba pantalla vacía.

---

## ✅ Soluciones Aplicadas

### Fase 1: Centralización de Archivos

#### Acciones:
1. ✅ **Respaldos creados:**
   - `backups/data-before-schema-completo-[timestamp].db`

2. ✅ **Archivos eliminados:**
   - `data.db` (raíz) - eliminado
   - `e2e.db` (raíz) - eliminado (se regenera con tests E2E)
   - `server/migrations/data.db` - eliminado

3. ✅ **Archivo único conservado:**
   - `server/data.db` - **ÚNICA fuente de verdad**

#### Configuración:
```javascript
// server/db.js (sin cambios - ya estaba correcto)
function resolveDbPath() {
  const custom = process.env.DB_PATH;
  if (custom) {
    return isAbsolute(custom) ? custom : resolve(custom);
  }
  return join(__dirname, 'data.db'); // ← server/data.db
}
```

---

### Fase 2: Schema Completo con Todas las Tablas

#### Creado: `server/schema-completo.sql`

**Tablas agregadas:**
```sql
-- Nueva tabla: Categorías (ADR-0009)
CREATE TABLE categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT UNIQUE NOT NULL,
  icono TEXT NOT NULL,
  descripcion TEXT,
  orden INTEGER NOT NULL DEFAULT 0,
  activo INTEGER NOT NULL DEFAULT 1,
  ...
);

-- Nueva tabla: Tipos de Reporte (ADR-0009)
CREATE TABLE tipos_reporte (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT UNIQUE NOT NULL,         -- Slug técnico
  nombre TEXT NOT NULL,               -- Nombre display
  icono TEXT NOT NULL,
  color TEXT NOT NULL,
  categoria_id INTEGER NOT NULL,
  dependencia TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  activo INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);
```

**Datos iniciales:**
- **7 categorías:** Obras Públicas, Servicios Públicos, Agua Potable, Seguridad, Salud, Medio Ambiente, Otros
- **21 tipos de reporte:** baches, alumbrado, seguridad, agua, quema, etc.
- **11 reportes de ejemplo** (10 originales + 1 interdepartamental)
- **8 usuarios** con password `admin123`
- **9 asignaciones** lógicas por departamento

---

### Fase 3: Regeneración de Base de Datos

#### Proceso ejecutado:
```powershell
# 1. Backup automático
Copy-Item server/data.db backups/...

# 2. Eliminar base de datos anterior
Remove-Item server/data.db -Force

# 3. Regenerar desde schema completo
Get-Content server/schema-completo.sql | sqlite3 server/data.db

# 4. Actualizar schema.sql oficial
Copy-Item server/schema-completo.sql server/schema.sql -Force
```

#### Resultado:
```
✅ 8 tablas creadas:
   - reportes (11 registros)
   - usuarios (8 registros)
   - sesiones (0 - se crean al login)
   - asignaciones (9 registros)
   - cierres_pendientes (0 - se crean al solicitar cierre)
   - categorias (7 registros) ← NUEVA
   - tipos_reporte (21 registros) ← NUEVA
   - sqlite_sequence (metadata)
```

---

### Fase 4: Verificación de Endpoints

#### Tests de integración:
```bash
GET /api/reportes
✅ Status 200 - 11 reportes

GET /api/categorias
✅ Status 200 - 7 categorías con tipos anidados

GET /api/tipos
✅ Status 200 - 21 tipos activos

GET /
✅ Status 200 - Frontend cargando correctamente
```

---

## 📊 Estado Final del Sistema

### Arquitectura de Datos (Centralizada)
```
server/data.db (ÚNICO ARCHIVO)
├── reportes (11)
│   ├── Relacionados con tipos_reporte.tipo
│   └── Asignados a usuarios via asignaciones
├── usuarios (8)
│   ├── admin@jantetelco.gob.mx (admin)
│   ├── 3 supervisores (obras, servicios, parques)
│   └── 4 funcionarios (obras, servicios, seguridad, parques)
├── asignaciones (9)
│   └── Many-to-many: reportes ↔ usuarios
├── categorias (7) ← NUEVA
│   └── Obras, Servicios, Agua, Seguridad, Salud, Ambiente, Otros
└── tipos_reporte (21) ← NUEVA
    ├── FK a categorias
    └── Metadatos: icono, color, dependencia
```

### Flujo de Datos en Frontend

```
┌─────────────────────────────────────────────────┐
│         client/src/SimpleApp.jsx                │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. useEffect(() => {                           │
│       obtenerCategoriasConTipos()  ← API        │
│       listarReportes()             ← API        │
│     })                                          │
│                                                 │
│  2. Renderiza panel lateral:                    │
│     categorias.map(cat => {                     │
│       ✅ Muestra categoría con collapse         │
│       ✅ Lista sus tipos con checkboxes         │
│       ✅ Muestra contador de reportes por tipo  │
│     })                                          │
│                                                 │
│  3. Al cambiar filtros:                         │
│     - Actualiza reportesVisibles                │
│     - Actualiza heat layer en mapa              │
│                                                 │
└─────────────────────────────────────────────────┘
                    ↓ fetch
┌─────────────────────────────────────────────────┐
│         server/tipos-routes.js                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  obtenerCategoriasConTipos(req, res) {          │
│    db.all('SELECT * FROM categorias')           │
│    db.all('SELECT * FROM tipos_reporte')        │
│    return categorias.map(cat => ({              │
│      ...cat,                                    │
│      tipos: tipos.filter(t =>                   │
│        t.categoria_id === cat.id)               │
│    }))                                          │
│  }                                              │
│                                                 │
└─────────────────────────────────────────────────┘
                    ↓ query
┌─────────────────────────────────────────────────┐
│         server/data.db                          │
│                                                 │
│  categorias:                                    │
│  1 | Obras Públicas | 🛣️ | orden: 1            │
│  2 | Servicios Públicos | 🔧 | orden: 2        │
│  ...                                            │
│                                                 │
│  tipos_reporte:                                 │
│  1 | baches | Baches | 🛣️ | #8b5cf6 | cat: 1  │
│  2 | alumbrado | Alumbrado | 💡 | #f59e0b |    │
│  ...                                            │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🧪 Pruebas de Verificación

### Test 1: Panel Lateral con Categorías
```
✅ ANTES: Vacío (error 500 en /api/categorias)
✅ AHORA: Muestra 7 categorías con 21 tipos
```

### Test 2: Dropdown de Formulario
```
URL: http://localhost:5173/#reportar
✅ Muestra todos los 21 tipos organizados por categoría
✅ No depende de que existan reportes previos
```

### Test 3: Mapa con Reportes
```
URL: http://localhost:5173
✅ Muestra 11 reportes en el mapa de citizen-reports
✅ Heat layer funciona correctamente
✅ Filtros por tipo actualizan el mapa en tiempo real
```

### Test 4: Reporte Interdepartamental
```
Reporte #11:
- Tipo: quema (dependencia: medio_ambiente)
- Asignado a: Func. Parques (dependencia: parques_jardines)
- Supervisor: Parkeador (parques_jardines)

✅ Puede solicitar cierre sin error "No se encontró supervisor"
```

---

## 📝 Archivos Modificados

### Nuevos:
- `server/schema-completo.sql` - Schema con todas las tablas (categorías + tipos)
- `CENTRALIZACION_DB_2025-10-05.md` - Este documento

### Actualizados:
- `server/schema.sql` - Reemplazado con schema-completo.sql

### Respaldados:
- `server/schema-backup-[timestamp].sql` - Backup del schema original
- `backups/data-before-schema-completo-[timestamp].db` - Backup de data.db

### Eliminados:
- `data.db` (raíz) - Duplicado innecesario
- `e2e.db` (raíz) - Se regenera automáticamente en tests E2E
- `server/migrations/data.db` - Duplicado innecesario

---

## 🚀 Resultado Final

### URLs Activas:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:4000

### Estado de Servicios:
```
✅ Backend ACTIVO - 11 reportes
✅ Categorías: 7 categorías con tipos anidados
✅ Tipos: 21 tipos activos
✅ Frontend ACTIVO - Panel lateral funcionando
```

### Métricas de Éxito:
- ✅ Panel izquierdo SIEMPRE muestra categorías (incluso con 0 reportes)
- ✅ Dropdown de formulario SIEMPRE muestra 21 tipos activos
- ✅ Sistema centralizado con único archivo `server/data.db`
- ✅ Endpoints `/api/categorias` y `/api/tipos` responden correctamente
- ✅ Fix interdepartamental funcionando (reporte #11)
- ✅ Schema actualizado para futuros despliegues

---

## 🔄 Mantenimiento Futuro

### Para regenerar base de datos:
```powershell
# Desde raíz del proyecto
cd server
Get-Content schema.sql | sqlite3 data.db
```

### Para tests E2E:
```powershell
# Usa DB_PATH automáticamente
DB_PATH=./e2e.db npm run test:e2e
```

### Para backups:
```powershell
npm run backup:db
# Crea: backups/data-[timestamp].db
```

---

## 📚 Referencias

- **ADR-0009:** `docs/adr/ADR-0009-gestion-tipos-categorias-dinamicas.md`
- **API Endpoints:** `server/tipos-routes.js`
- **Frontend Panel:** `client/src/SimpleApp.jsx`
- **Schema Oficial:** `server/schema.sql`

---

**Fecha:** 5 de octubre de 2025  
**Completado:** ✅ Sistema centralizado, recableado y funcionando  
**Siguiente paso:** Usuario puede usar la aplicación normalmente
