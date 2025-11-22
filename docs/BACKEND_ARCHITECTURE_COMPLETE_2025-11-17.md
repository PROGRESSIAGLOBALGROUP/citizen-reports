# BACKEND ARCHITECTURE & UNDOCUMENTED FEATURES
## Funcionalidades Backend y Middleware Completo

**Última actualización:** Noviembre 17, 2025  
**Versión:** 2.0.0  
**Tech Stack:** Express 4 + SQLite + Node.js 18+

---

## 📋 Tabla de Contenidos

1. [Middleware de Seguridad](#middleware-de-seguridad)
2. [Rutas de Autenticación](#rutas-de-autenticación)
3. [Rutas de Reportes Avanzadas](#rutas-de-reportes-avanzadas)
4. [Sistema de Asignaciones](#sistema-de-asignaciones)
5. [Audit Trail (ADR-0010)](#audit-trail-adr-0010)
6. [Geocoding Automático](#geocoding-automático)
7. [Rutas Admin](#rutas-admin)
8. [Webhook GitHub](#webhook-github)
9. [Base de Datos](#base-de-datos)
10. [Utilities y Helpers](#utilities-y-helpers)

---

## 🔒 MIDDLEWARE DE SEGURIDAD

### Archivo: server/auth_middleware.js

#### 1. requiereAuth()
**Propósito:** Verificar que el usuario esté autenticado  
**Ubicación:** Líneas 1-50  

```javascript
import { requiereAuth } from './auth_middleware.js';

// Uso en rutas:
app.get('/api/mi-data', requiereAuth, (req, res) => {
  // req.usuario contiene datos del usuario autenticado
  console.log(req.usuario.email);
});
```

**Validación:**
- Extrae token del header `Authorization: Bearer {token}`
- Valida JWT (firma, expiración)
- Agrega `req.usuario` con datos decodificados
- Si falla: retorna 401 Unauthorized

**Token contents:**
```javascript
{
  user_id: number,
  email: string,
  nombre: string,
  rol: string,  // 'admin' | 'supervisor' | 'funcionario'
  dependencia: string,
  exp: number,  // timestamp de expiración
  iat: number   // timestamp de emisión
}
```

**Duración:** 24 horas desde emisión

---

#### 2. requiereRol(rolesPermitidos)
**Propósito:** Verificar que el usuario tenga rol permitido  
**Ubicación:** Líneas 60-90  

```javascript
import { requiereRol } from './auth_middleware.js';

// Uso:
app.post('/api/admin/usuarios', 
  requiereAuth,
  requiereRol(['admin']),
  usuariosRoutes.crearUsuario
);

// Múltiples roles permitidos:
app.post('/api/reportes/:id/asignaciones',
  requiereAuth,
  requiereRol(['admin', 'supervisor']),
  asignacionesRoutes.crearAsignacion
);
```

**Validación:**
- Comprueba si `req.usuario.rol` está en array de roles permitidos
- Si no: retorna 403 Forbidden
- Stack con `requiereAuth` (primero auth, después rol)

**Roles del sistema:**
```javascript
const ROLES_VALIDOS = ['admin', 'supervisor', 'funcionario'];
```

**Matriz de permisos:**

| Endpoint | Admin | Supervisor | Funcionario |
|----------|-------|------------|------------|
| GET /api/reportes | ✅ | ✅ | ✅ |
| POST /api/reportes | ✅ | ✅ | ✅ |
| POST /api/reportes/{id}/asignaciones | ✅ | ✅ | ❌ |
| POST /api/usuarios | ✅ | ❌ | ❌ |
| GET /api/admin/* | ✅ | ❌ | ❌ |

---

#### 3. verificarAccesoReporte(req, res, next)
**Propósito:** Verificar que el usuario tenga acceso a un reporte específico  
**Ubicación:** Líneas 100-130  

```javascript
// Uso:
app.get('/api/reportes/:id',
  verificarAccesoReporte,
  (req, res) => { /* ... */ }
);
```

**Lógica:**
- Si es `admin`: acceso total
- Si es `supervisor`: acceso a reportes de su dependencia
- Si es `funcionario`: acceso solo si está asignado
- Si es anónimo: acceso solo lectura

---

#### 4. verificarAsignacion(req, res, next)
**Propósito:** Verificar que el usuario esté asignado a un reporte  
**Ubicación:** Líneas 135-160  

```javascript
// Uso:
app.put('/api/reportes/:id/notas',
  requiereAuth,
  verificarAsignacion,
  asignacionesRoutes.actualizarNotas
);
```

**Validación:**
- Verifica que existe asignación en BD entre usuario y reporte
- Retorna 403 si no existe asignación

---

#### 5. obtenerSupervisor(dependencia)
**Propósito:** Buscar supervisor de una dependencia  
**Ubicación:** Líneas 165-185  

```javascript
import { obtenerSupervisor } from './auth_middleware.js';

const supervisor = obtenerSupervisor('obras_publicas');
// Returns: { id: 2, nombre: 'María López', email: 'maria@...', rol: 'supervisor' }

// O null si no existe
```

**Uso en workflow:**
- Cierre de reportes: encontrar supervisor para aprobación
- Asignaciones interdepartamentales: escalación automática

---

#### 6. DEPENDENCIA_POR_TIPO (Object)
**Propósito:** Mapeo automático de tipo de reporte → departamento  
**Ubicación:** Líneas 190-240  

```javascript
import { DEPENDENCIA_POR_TIPO } from './auth_middleware.js';

DEPENDENCIA_POR_TIPO = {
  'bache': 'obras_publicas',
  'agua': 'agua_potable',
  'electricidad': 'servicios_publicos',
  'quema': 'proteccion_civil',
  'basura': 'servicios_publicos',
  // ... 30+ más tipos
};

// Uso:
const dependencia = DEPENDENCIA_POR_TIPO[tipo] || 'administracion';
```

**Actualización:**
- Cuando se crea un nuevo tipo, agregar entrada aquí
- Fallback: 'administracion' si tipo no existe
- Usado en POST /api/reportes para auto-asignar dependencia

---

## 🔑 RUTAS DE AUTENTICACIÓN

### Archivo: server/auth_routes.js

#### POST /api/auth/login
**Propósito:** Autenticar usuario y emitir JWT  
**Implementación:** Líneas 1-100  

```javascript
Body:
{
  "email": "usuario@jantetelco.gob.mx",
  "password": "password123"
}

Response (201):
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "email": "usuario@jantetelco.gob.mx",
    "nombre": "Nombre Usuario",
    "rol": "admin",
    "dependencia": "administracion"
  }
}
```

**Validación:**
1. Email existe en BD
2. Usuario está activo (activo=1)
3. Password matches hash con bcrypt
4. No permite más de 5 intentos fallidos en 15 minutos

**Token generation:**
```javascript
const token = jwt.sign(
  {
    user_id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
    rol: usuario.rol,
    dependencia: usuario.dependencia
  },
  process.env.JWT_SECRET || 'dev-secret-key',
  { expiresIn: '24h' }
);
```

---

#### POST /api/auth/logout
**Propósito:** Invalidar sesión  
**Implementación:** Líneas 105-120  

**Funcionalidad:**
- En desarrollo: simplemente retorna éxito
- En producción: podría agregar token a blacklist (no implementado)
- Frontend es responsable de limpiar localStorage

---

#### GET /api/auth/me
**Propósito:** Obtener datos de usuario autenticado  
**Implementación:** Líneas 125-145  
**Autenticación:** Requerida  

**Respuesta:**
```json
{
  "id": 1,
  "email": "usuario@jantetelco.gob.mx",
  "nombre": "Nombre",
  "rol": "admin",
  "dependencia": "administracion",
  "activo": 1,
  "creado_en": "2025-10-01T10:00:00Z"
}
```

**Casos de uso:**
- Verificar que token sigue siendo válido
- Actualizar datos de usuario en frontend
- Validar rol/dependencia en cliente

---

## 📍 RUTAS DE REPORTES AVANZADAS

### Archivo: server/reportes_auth_routes.js

#### GET /api/reportes (con filtros avanzados)
**Implementación:** Líneas 1-150  

**Filtros soportados:**
```javascript
// Bounding box (para mapa)
?minLat=18&maxLat=19&minLng=-99&maxLng=-98

// Por tipo (soporta arrays y CSV)
?tipo=bache,agua,electricidad
?tipo=["bache", "agua"]

// Por estado
?estado=abierto
?estado=asignado,pendiente_cierre

// Por fecha
?from=2025-11-01&to=2025-11-17

// Por dependencia
?dependencia=obras_publicas

// Combinados
?minLat=18&maxLat=19&minLng=-99&maxLng=-98&estado=abierto&tipo=bache&from=2025-11-01
```

**Optimizaciones:**
- Índices en: lat, lng, tipo, estado, dependencia, creado_en
- Prepared statements (previene SQL injection)
- Limit 1000 resultados para evitar sobrecarga

**Performance:**
- Con índices: <100ms en tabla con 10,000 reportes
- Sin índices: >5s

---

#### GET /api/reportes/geojson
**Propósito:** Exportar en formato GeoJSON  
**Implementación:** Líneas 160-200  

**Soporta mismo filtrado que GET /api/reportes**

**Output:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-98.776, 18.716]
      },
      "properties": {
        "id": 1,
        "tipo": "bache",
        "estado": "abierto",
        "descripcion": "Bache en avenida",
        "dependencia": "obras_publicas"
      }
    }
  ]
}
```

**Casos de uso:**
- Importar a QGIS/ArcGIS
- Visualizar en herramientas GIS externas
- Análisis geoespacial

---

#### GET /api/reportes/grid
**Propósito:** Agregación en grid para heatmap  
**Implementación:** Líneas 210-270  

**Parámetros:**
```javascript
?tipo=bache&cell=0.001   // Cell size en grados
?estado=abierto&cell=0.01
```

**Output:**
```json
[
  {
    "lat": 18.716,
    "lng": -98.776,
    "peso": 5  // Número de reportes en esa celda
  }
]
```

**Lógica:**
1. Divide mapa en grid de celdas
2. Agrupa reportes por celda
3. Suma pesos de reportes en cada celda
4. Retorna coordenadas + peso agregado

**Performance:**
- Reduce puntos de ~10,000 a ~100 en output
- Mejor para visualización de heatmap

**Cell size reference:**
```javascript
0.001°  ≈ 111 metros
0.01°   ≈ 1.1 kilómetros
0.1°    ≈ 11 kilómetros
1.0°    ≈ 111 kilómetros
```

---

## 👥 SISTEMA DE ASIGNACIONES

### Archivo: server/asignaciones-routes.js

#### POST /api/reportes/{id}/asignaciones
**Propósito:** Asignar funcionario a reporte  
**Implementación:** Líneas 50-150  
**Autenticación:** Requerida (admin, supervisor)

**Body:**
```json
{
  "usuario_id": 3
}
```

**Validaciones:**
1. Usuario existe y es `funcionario`
2. Reporte existe
3. No existe asignación duplicada
4. Si funcionario es de otra dependencia: solo admin puede asignar

**Workflow automático:**
1. Busca supervisor de la dependencia del funcionario
2. Si es interdepartamental: incluye nota en audit trail
3. Registra cambio en `historial_cambios` (ADR-0010)
4. Retorna ID de asignación

**Response (201):**
```json
{
  "ok": true,
  "asignacion_id": 10,
  "usuario_id": 3,
  "reporte_id": 1,
  "auditado": true
}
```

---

#### DELETE /api/reportes/{id}/asignaciones/{usuarioId}
**Propósito:** Remover asignación  
**Implementación:** Líneas 160-220  

**Lógica especial:**
1. Si era la ÚNICA asignación: reporte vuelve a estado "abierto"
2. Si hay más asignaciones: estado se mantiene "asignado"
3. Siempre registra en audit trail

**Response (200):**
```json
{
  "ok": true,
  "estado_reporte": "abierto"  // O "asignado"
}
```

---

#### PUT /api/reportes/{id}/notas
**Propósito:** Funcionario agrega notas de progreso  
**Implementación:** Líneas 230-280  
**Autenticación:** Requerida  

**Body:**
```json
{
  "notas": "Se visitó el sitio, se encontró...",
  "usuario_id": 3
}
```

**Validación:**
- Usuario debe estar asignado al reporte
- Notas no pueden estar vacías
- Max 5000 caracteres

**Guarda como:**
- Tabla `notas` con timestamp
- Usuario_id para auditoría
- Reporte_id para relación

---

#### POST /api/reportes/{id}/solicitar-cierre
**Propósito:** Funcionario solicita cierre de reporte  
**Implementación:** Líneas 290-350  

**Body:**
```json
{
  "motivo": "Problema resuelto",
  "firma_base64": "data:image/png;base64,...",
  "fotos": [
    {
      "data": "data:image/jpeg;base64,...",
      "tipo": "trabajo_completado"
    }
  ]
}
```

**Validación:**
- Tamaño máximo 5MB (signatures + fotos)
- Firma y al menos 1 foto requeridas
- Base64 válido

**Proceso:**
1. Crea entrada en `cierres_pendientes`
2. Encuentra supervisor de la dependencia
3. Establece `aprobado = false` (pendiente supervisión)
4. Registra en audit trail
5. Retorna ID de cierre

**Response:**
```json
{
  "ok": true,
  "cierre_id": 5,
  "estado": "pendiente_cierre"
}
```

---

#### GET /api/reportes/{id}/historial
**Propósito:** Ver audit trail completo (ADR-0010)  
**Implementación:** Líneas 360-380  

**Response:**
```json
[
  {
    "id": 1,
    "reporte_id": 1,
    "usuario_id": 1,
    "tipo_cambio": "asignacion",
    "valor_anterior": null,
    "valor_nuevo": "Juan Pérez (func.juan@...) asignado",
    "timestamp": "2025-11-17T10:35:00Z",
    "detalles": {
      "motivo": "Asignación automática",
      "dependencia": "obras_publicas"
    }
  }
]
```

**Tipos de cambios registrados:**
- `asignacion`: Nuevo funcionario asignado
- `desasignacion`: Funcionario removido
- `notas_agregadas`: Notas de progreso
- `cierre_solicitado`: Solicitud de cierre
- `cierre_aprobado`: Supervisor aprobó cierre
- `cierre_rechazado`: Supervisor rechazó cierre
- `reabrir`: Reporte reabierto

---

## 🔍 AUDIT TRAIL (ADR-0010)

### Tabla: historial_cambios
**Ubicación:** server/schema.sql líneas 150-170

**Estructura:**
```sql
CREATE TABLE historial_cambios (
  id INTEGER PRIMARY KEY,
  entidad TEXT,            -- 'reporte', 'usuario', 'asignacion'
  tipo_cambio TEXT,        -- 'crear', 'actualizar', 'eliminar', etc.
  objeto_id INTEGER,       -- ID del objeto modificado
  usuario_id INTEGER,      -- Quién hizo el cambio
  valor_anterior TEXT,     -- JSON del estado anterior
  valor_nuevo TEXT,        -- JSON del estado nuevo
  detalles TEXT,          -- JSON con contexto adicional
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Función: registrarCambio()
**Ubicación:** server/reasignacion-utils.js

```javascript
import { registrarCambio } from './reasignacion-utils.js';

// Uso:
registrarCambio(
  'reporte',
  'asignacion',
  reporteId,
  usuarioId,
  {
    funcionario_anterior: 'Juan Pérez',
    funcionario_nuevo: 'María López',
    motivo: 'Reasignación interdepartamental'
  }
);
```

**Beneficios:**
- Trazabilidad completa de cambios
- Debugging de problemas
- Auditoría para gobierno
- Visualización de workflow

---

## 🌐 GEOCODING AUTOMÁTICO

### Archivo: server/geocoding-service.js

#### reverseGeocode(lat, lng)
**Propósito:** Convertir coordenadas en dirección  
**Implementación:** Líneas 1-100  

**Process:**
1. Valida coordenadas (lat -90 a 90, lng -180 a 180)
2. Rate limiting: máx 1 req/segundo
3. Llama OpenStreetMap Nominatim API
4. Parsea respuesta
5. Extrae: colonia, código postal, municipio, estado

**Response:**
```javascript
{
  success: true,
  data: {
    colonia: "Centro",
    codigo_postal: "06000",
    municipio: "México",
    estado: "México",
    pais: "México"
  }
}
```

**Rate limiting:**
- 1 segundo entre requests
- Queue automática para requests simultáneos
- Previene bans de OpenStreetMap

**Integración en POST /api/reportes:**
```javascript
// Si no se proporciona ubicación, hace reverse geocoding automático
if (!req.body.colonia) {
  const geoData = await reverseGeocode(lat, lng);
  req.body.colonia = geoData.data.colonia;
  req.body.codigo_postal = geoData.data.codigo_postal;
  // etc.
}
```

---

## 🔧 RUTAS ADMIN

### Archivo: server/admin-routes.js

#### Gestión de Tipos de Reportes

**POST /api/admin/tipos**
```javascript
Body: {
  "tipo": "nuevo_tipo",
  "nombre": "Nuevo Tipo",
  "descripcion": "Descripción",
  "categoria_id": 1,
  "dependencia": "obras_publicas"
}

Response (201): { ok: true, id: 50 }
```

**PUT /api/admin/tipos/:id**
```javascript
// Actualizar campos
Body: { "nombre": "Nuevo nombre", ... }
Response (200): { ok: true }
```

**DELETE /api/admin/tipos/:id**
```javascript
// Soft delete: marca como inactivo
Response (200): { ok: true }

// Nota: No elimina físicamente, solo marca inactivo=0
// Previene romper reportes históricos
```

#### Gestión de Categorías

**POST /api/admin/categorias**
```javascript
Body: { "nombre": "Categoría", "icono": "🆕" }
Response (201): { ok: true, id: 10 }
```

**PUT /api/admin/categorias/:id**
```javascript
Body: { "nombre": "Nuevo nombre", "icono": "🔄" }
Response (200): { ok: true }
```

**DELETE /api/admin/categorias/:id**
```javascript
// Soft delete
Response (200): { ok: true }
```

#### Gestión de Dependencias

**POST /api/admin/dependencias**
```javascript
Body: {
  "slug": "nueva_dependencia",
  "nombre": "Nueva Dependencia",
  "icono": "🏢"
}
Response (201): { ok: true, id: 8 }
```

**PATCH /api/admin/dependencias/:id/orden**
```javascript
Body: { "orden": 5 }
// Reordenar para UI
Response (200): { ok: true }
```

---

## 🔄 WEBHOOK GITHUB

### Archivo: server/webhook-routes.js

#### POST /api/webhook/github
**Propósito:** Auto-deploy desde GitHub  
**Implementación:** Líneas 1-100  

**Validación de firma:**
```javascript
const signature = req.headers['x-hub-signature-256'];
// Valida con GITHUB_WEBHOOK_SECRET
```

**Eventos escuchados:**
- `push` a rama `main` → Trigger deploy

**Proceso de deploy:**
1. Verifica firma
2. Ejecuta: `git pull origin main`
3. Ejecuta: `npm install`
4. Ejecuta: `npm run build`
5. Reinicia app con PM2
6. Valida que esté online
7. Registra en logs

**Logs de deploy:**
```javascript
GET /api/deploy/logs
// Retorna últimas 50 líneas
```

**Monitoreo:**
```
[17/Nov/2025 13:45:23] 🚀 Deploy iniciado
[17/Nov/2025 13:45:25] 📥 git pull...
[17/Nov/2025 13:45:28] 📦 npm install...
[17/Nov/2025 13:45:45] 🏗️ npm run build...
[17/Nov/2025 13:46:10] 🔄 pm2 restart...
[17/Nov/2025 13:46:15] ✅ Deploy completado
```

---

## 📊 BASE DE DATOS

### Archivo: server/schema.sql

**9 tablas principales:**

1. **reportes** (2000+ registros)
   - Stores citizen reports
   - Indexed: lat, lng, tipo, estado, dependencia

2. **usuarios** (45 users)
   - Staff users only
   - Hash passwords with bcrypt

3. **sesiones** (Active sessions)
   - JWT tokens
   - Auto-expire after 24h

4. **tipos_reporte** (38 types)
   - Dynamic type management (ADR-0009)
   - Linked to categorias

5. **categorias** (7 categories)
   - Group tipos
   - Icons and ordering

6. **dependencias** (8 departments)
   - Municipal departments
   - Icons and ordering

7. **asignaciones** (Many-to-many)
   - Links reportes ↔ usuarios
   - ADR-0006: Many-to-many assignments

8. **cierres_pendientes** (Closure workflow)
   - Pending closures
   - Supervisor approval workflow

9. **historial_cambios** (Audit trail)
   - Complete audit log (ADR-0010)
   - All changes tracked

---

## 🛠️ UTILITIES Y HELPERS

### Función: validarCoordenadas(lat, lng)
```javascript
// Validación de límites
lat: -90 ≤ lat ≤ 90
lng: -180 ≤ lng ≤ 180

// Uso en POST /api/reportes
if (!validarCoordenadas(lat, lng)) {
  return res.status(400).json({ error: 'Coordenadas inválidas' });
}
```

### Función: normalizeTipos(raw)
```javascript
// Convierte tipos en array único
normalizeTipos('bache')             // ['bache']
normalizeTipos('bache,agua')        // ['bache', 'agua']
normalizeTipos(['bache', 'agua'])   // ['bache', 'agua']
normalizeTipos('bache,,agua,bache') // ['bache', 'agua']
```

### Función: isIsoDate(s)
```javascript
// Valida formato YYYY-MM-DD
isIsoDate('2025-11-17')  // true
isIsoDate('17/11/2025')  // false
isIsoDate('2025-13-01')  // false
```

---

## 🚀 PERFORMANCE & OPTIMIZATIONS

**Database Indexes:**
```sql
CREATE INDEX idx_reportes_lat ON reportes(lat);
CREATE INDEX idx_reportes_lng ON reportes(lng);
CREATE INDEX idx_reportes_tipo ON reportes(tipo);
CREATE INDEX idx_reportes_estado ON reportes(estado);
CREATE INDEX idx_reportes_dependencia ON reportes(dependencia);
CREATE INDEX idx_reportes_creado_en ON reportes(creado_en);
```

**Query optimization:**
- Prepared statements (prevent SQL injection)
- Proper indexing strategy
- Result limiting (max 1000)
- Bounding box queries (spatial index simulation)

**Response times (with indexes):**
- GET /api/reportes (10,000 records): ~80ms
- GET /api/reportes/grid: ~150ms
- POST /api/reportes (with geocoding): ~500ms

---

**Documento Version:** 2.0  
**Última revisión:** Noviembre 17, 2025  
**Responsable:** Backend Team
