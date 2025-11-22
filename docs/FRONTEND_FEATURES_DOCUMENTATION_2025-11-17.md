# FRONTEND FEATURES DOCUMENTATION
## Documentación Completa de Funcionalidades del Cliente

**Última actualización:** Noviembre 17, 2025  
**Framework:** React 18 + Vite  
**UI Components:** Leaflet, Custom React Components  
**Location:** `client/src/`

---

## 📋 Tabla de Contenidos

1. [Componentes Principales](#componentes-principales)
2. [Vistas y Rutas](#vistas-y-rutas)
3. [Sistema de API](#sistema-de-api)
4. [Geolocalización](#geolocalización)
5. [Autenticación Frontend](#autenticación-frontend)
6. [Gestión de Estado](#gestión-de-estado)
7. [Componentes de UI](#componentes-de-ui)

---

## 🎨 COMPONENTES PRINCIPALES

### 1. MapView.jsx
**Propósito:** Visualizar mapa interactivo con reportes  
**Ubicación:** `client/src/MapView.jsx`  
**Funcionalidades:**

- ✅ Mapa Leaflet con marcadores por ubicación
- ✅ Heatmap con pesos de reportes
- ✅ Filtro por bounding box (zoom)
- ✅ Filtro por estado (abiertos, asignados, etc.)
- ✅ Click en mapa para crear nuevo reporte
- ✅ Click en marcador para ver detalles

**Props:** Ninguno (componente standalone)

**State:**
```javascript
- map: Leaflet map instance (useRef, no state para evitar re-renders)
- reportes: Array de reportes cargados
- error: Mensaje de error si falla carga
```

**Funciones principales:**
- `cargarReportes()`: GET /api/reportes con filtros
- `crearMarker(reporte)`: Agrega marcador al mapa
- `manejarClickMapa(e)`: Abre formulario de nuevo reporte

**Características avanzadas:**
- Clustering de marcadores automático
- Carga incremental de reportes al hacer zoom
- Filtrado por estado en tiempo real

---

### 2. VerReporte.jsx
**Propósito:** Ver detalles de reporte específico  
**Ubicación:** `client/src/VerReporte.jsx`  
**Funcionalidades:**

- ✅ Mostrar todos los datos del reporte
- ✅ Listar funcionarios asignados
- ✅ Asignar nuevos funcionarios
- ✅ Ver notas de trabajo
- ✅ Ver historial de cambios (audit trail)
- ✅ Solicitar cierre con firma y fotos
- ✅ Reabrir reporte si es necesario
- ✅ Reasignar a otro departamento

**Props:**
```javascript
{
  reporteId: number,    // ID del reporte a mostrar
  onClose: function,    // Callback para cerrar modal
  usuario: object       // Usuario actual
}
```

**Endpoints usados:**
- GET `/api/reportes/{id}` - Obtener detalles
- GET `/api/reportes/{id}/asignaciones` - Listar asignados
- GET `/api/reportes/{id}/historial` - Ver cambios
- POST `/api/reportes/{id}/asignaciones` - Asignar funcionario
- DELETE `/api/reportes/{id}/asignaciones/{uid}` - Desasignar
- PUT `/api/reportes/{id}/notas` - Guardar notas
- POST `/api/reportes/{id}/solicitar-cierre` - Solicitar cierre
- POST `/api/reportes/{id}/reabrir` - Reabrir reporte

**Funcionalidades por rol:**

**Ciudadano (Anónimo):**
- Ver detalles del reporte
- No puede hacer cambios

**Funcionario:**
- Ver detalles
- Ver notas de trabajo
- Agregar notas propias
- Solicitar cierre con fotos y firma
- Reabrir si fue rechazado

**Supervisor:**
- Todo lo de funcionario
- Aprobar/rechazar cierres
- Asignar a otros funcionarios
- Ver historial completo

**Admin:**
- Todo lo anterior
- Reasignar a otros departamentos
- Forzar cierre/reapertura

---

### 3. ImprovedMapView.jsx
**Propósito:** Versión mejorada del mapa (alternativa)  
**Ubicación:** `client/src/ImprovedMapView.jsx`  
**Diferencias con MapView:**

- Mejor manejo de errores
- Interfaz mejorada de filtros
- Performance optimizado
- Más opciones de visualización

**Funcionalidades:**
- Heatmap con intensidad variable
- Filtros avanzados (rango de fechas, dependencia)
- Export a GeoJSON
- Búsqueda por dirección

---

### 4. SimpleApp.jsx
**Propósito:** Versión simplificada para demo/testing  
**Ubicación:** `client/src/SimpleApp.jsx`  
**Funcionalidades:**

- Mapa básico
- Crear reportes simple
- Ver últimos reportes
- Sin autenticación

---

### 5. PanelFuncionario.jsx
**Propósito:** Dashboard para funcionarios con tareas asignadas  
**Ubicación:** `client/src/PanelFuncionario.jsx`  
**Funcionalidades:**

- ✅ Listar reportes "mis reportes" (asignados al usuario)
- ✅ Listar cierres pendientes de aprobación
- ✅ Agregar notas a reportes
- ✅ Subir fotos de progreso
- ✅ Solicitar cierre de reporte
- ✅ Reasignar a otro funcionario
- ✅ Ver detalles de cada reporte
- ✅ Búsqueda y filtrado

**State:**
```javascript
- reportes: Array de reportes asignados
- cierresPendientes: Array de cierres a aprobar
- filtro: string de búsqueda
- selectedReporte: Reporte seleccionado actual
```

**Endpoints usado:**
- GET `/api/reportes/mis-reportes` - Mis asignaciones
- GET `/api/reportes/cierres-pendientes` - Cierres a aprobar
- GET `/api/reportes?...` - Listar con filtros
- POST `/api/reportes/{id}/asignaciones` - Asignar
- DELETE `/api/reportes/{id}/asignaciones/{uid}` - Desasignar
- PUT `/api/reportes/{id}/notas` - Guardar notas
- POST `/api/reportes/{id}/notas-draft` - Guardar borrador
- POST `/api/reportes/{id}/reasignar` - Reasignar

---

### 6. AdminPanel.jsx
**Propósito:** Panel de administración  
**Ubicación:** `client/src/AdminPanel.jsx`  
**Funcionalidades:**

- ✅ Gestión de usuarios (CRUD)
- ✅ Gestión de dependencias
- ✅ Gestión de tipos de reportes
- ✅ Gestión de categorías
- ✅ Ver estadísticas del sistema
- ✅ Exportar datos
- ✅ Auditoría de cambios

**Tabs/Secciones:**
1. **Usuarios:** Crear, editar, desactivar usuarios
2. **Dependencias:** Administrar departamentos, reordenar
3. **Tipos de Reportes:** CRUD de tipos dinámicos
4. **Categorías:** Organizar tipos en categorías
5. **Estadísticas:** Dashboard de KPIs
6. **Logs:** Ver historial de cambios

**Endpoints usado:**
- GET/POST/PUT/DELETE `/api/usuarios`
- GET/POST/PUT/DELETE `/api/admin/dependencias`
- GET/POST/PUT/DELETE `/api/admin/tipos`
- GET/POST/PUT/DELETE `/api/admin/categorias`
- GET `/api/super-usuario/stats` - Estadísticas

---

### 7. App.jsx
**Propósito:** Componente raíz de la aplicación  
**Ubicación:** `client/src/App.jsx`  
**Funcionalidades:**

- ✅ Ruteo hash-based
- ✅ Autenticación y login
- ✅ Navbar con navegación
- ✅ Selección de vista (Mapa, Panel, Admin)

**Rutas disponibles:**
```
#               → Mapa principal (MapView)
#reportar       → Formulario crear reporte
#panel          → Panel funcionario (requiere auth)
#admin          → Panel admin (requiere admin)
#reporte/{id}   → Detalles de reporte
```

**State global:**
```javascript
- usuario: Usuario autenticado actual
- token: JWT token
- currentView: Vista actual ('mapa', 'panel', 'admin', etc.)
```

---

## 🗺️ VISTAS Y RUTAS

### Ruta: # (Raíz - Mapa)
**Componente:** MapView  
**Autenticación:** No requerida  
**Descripción:** Vista pública del mapa con todos los reportes

**Funcionalidades:**
- Ver mapa interactivo
- Filtrar por estado, tipo, fecha
- Crear nuevo reporte
- Ver detalles al hacer click

---

### Ruta: #reportar
**Componente:** FormularioReporte (dentro de MapView)  
**Autenticación:** No requerida  
**Descripción:** Formulario para crear nuevo reporte

**Campos:**
```
- Tipo (requerido): Select de tipos
- Descripción (recomendado): Textarea
- Fotos: Input de archivos múltiples
- Coordenadas: Auto-llenadas del click del mapa
- Ubicación: Auto-completadas por geocoding
```

**Flujo:**
1. Usuario hace click en mapa
2. Se abre modal con formulario
3. Campos de coordenadas pre-llenados
4. Usuario completa descripción
5. Click "Enviar"
6. POST /api/reportes
7. Reporte aparece en mapa

---

### Ruta: #panel
**Componente:** PanelFuncionario  
**Autenticación:** Requerida  
**Roles permitidos:** funcionario, supervisor, admin  
**Descripción:** Dashboard de tareas del usuario

**Secciones:**
1. **Mis Reportes:** Reportes asignados al usuario
2. **Cierres Pendientes:** Cierres que necesitan aprobación
3. **Acciones:** Agregar notas, fotos, solicitar cierre

---

### Ruta: #admin
**Componente:** AdminPanel  
**Autenticación:** Requerida  
**Roles permitidos:** admin  
**Descripción:** Panel de administración del sistema

**Secciones:** (Ver AdminPanel.jsx)

---

### Ruta: #reporte/{id}
**Componente:** VerReporte (modal)  
**Autenticación:** No requerida  
**Descripción:** Detalles de reporte específico

**Parámetros:**
- `id`: ID del reporte

---

## 🔗 SISTEMA DE API

### client/src/api.js
**Propósito:** Cliente API centralizado  
**Ubicación:** `client/src/api.js`  
**Características:**

**1. Configuración:**
```javascript
export const API_BASE = '';  // Relative URL en dev (proxy Vite)
const USE_MOCK = false;       // Para testing
```

**2. Funciones Utilitarias:**

#### buildQuery(params)
Construye URLSearchParams correctamente con & separadores
```javascript
buildQuery({lat: 18, lng: -99})
// Resultado: "lat=18&lng=-99"
```

#### apiCall(url, options)
Wrapper de fetch con manejo de errores
```javascript
- Valida respuesta
- Maneja timeouts
- Re-lanza errores
```

**3. Funciones de Reportes:**

#### crearReporte(data)
```javascript
POST /api/reportes
Body: {tipo, descripcion, lat, lng, ...}
Response: {ok, id, dependencia}
```

#### listarReportes(params)
```javascript
GET /api/reportes
Params: {minLat, maxLat, minLng, maxLng, tipo, estado, ...}
Response: Array de reportes
```

#### tiposReporte()
```javascript
GET /api/tipos
Response: Array de tipos
```

#### exportGeoJSON(params)
```javascript
GET /api/reportes/geojson
Response: GeoJSON FeatureCollection
```

#### gridAggregates(params)
```javascript
GET /api/reportes/grid
Response: Array de puntos agregados para heatmap
```

**4. Funciones de Usuarios:**

#### login(email, password)
```javascript
POST /api/auth/login
Response: {ok, token, usuario}
```

#### logout()
```javascript
POST /api/auth/logout
```

#### obtenerSesion()
```javascript
GET /api/auth/me
Response: Usuario actual
```

---

## 🌍 GEOLOCALIZACIÓN

### Características de Geocoding

**1. Reverse Geocoding (Coords → Dirección)**

Convierte coordenadas en dirección legible:
```javascript
// Input
lat: 18.716
lng: -98.776

// Output
{
  colonia: "Centro",
  codigo_postal: "06000",
  municipio: "México",
  estado: "México"
}
```

**Implementación:**
- Backend: `server/geocoding-service.js`
- API: `POST /api/reportes` automáticamente geocodifica
- Rate limiting: 1 request/segundo (OpenStreetMap)

**2. Autocompletado de Ubicación**

El formulario auto-llena datos de ubicación cuando:
1. Usuario hace click en mapa
2. Coordenadas se envían a backend
3. Backend hace reverse geocoding
4. Datos se devuelven y llenan el formulario

---

## 🔐 AUTENTICACIÓN FRONTEND

### localStorage Keys
```javascript
'auth_token'  // JWT token principal
'usuario'     // Datos del usuario (JSON stringified)
'session_id'  // ID de sesión
```

### Flujo de Login
1. Usuario ingresa email/password en formulario
2. POST /api/auth/login
3. Response incluye token y usuario
4. Se guarda en localStorage
5. Se redirige a vista correspondiente

### Flujo de Logout
1. Usuario click en botón Logout
2. POST /api/auth/logout
3. Se limpia localStorage
4. Se redirige a mapa (vista pública)

### Protección de Rutas
```javascript
// En App.jsx
if (currentView === 'admin' && (!usuario || usuario.rol !== 'admin')) {
  redirect a #panel o #
}
```

---

## 💾 GESTIÓN DE ESTADO

**Arquitectura:** Vanilla React (sin Redux, sin Context)

### State Global (en App.jsx)
```javascript
- usuario: object | null
- token: string | null
- currentView: 'mapa' | 'panel' | 'admin' | 'reporte'
- selectedReporteId: number | null
```

### State Local (por componente)
Cada componente maneja su propio estado con useState:

**MapView:**
- reportes: Array
- mapInstance: useRef (no state)
- filtros: object

**VerReporte:**
- detalles: object
- asignaciones: Array
- notas: string
- loading: boolean

**PanelFuncionario:**
- misReportes: Array
- cierresPendientes: Array
- selectedReporte: object

---

## 🎨 COMPONENTES DE UI

### FormularioReporte
**Propósito:** Capturar datos de nuevo reporte  
**Props:**
```javascript
{
  onSubmit: (data) => void,
  defaultCoords?: {lat, lng},
  loading?: boolean
}
```

**Campos:**
- Tipo (Select)
- Descripción (Textarea)
- Fotos (Input[file])
- Ubicación (Auto-complete)

---

### ModalReporte
**Propósito:** Mostrar detalles de reporte en modal  
**Props:**
```javascript
{
  reporteId: number,
  onClose: () => void,
  usuario: object
}
```

---

### TablaPanelFuncionario
**Propósito:** Mostrar lista de reportes  
**Props:**
```javascript
{
  reportes: Array,
  onSeleccionar: (reporte) => void,
  loading: boolean
}
```

---

### MapaLeaflet
**Propósito:** Renderizar mapa interactivo  
**Props:**
```javascript
{
  center: [lat, lng],
  zoom: number,
  reportes: Array,
  onClickMapa: (coords) => void,
  onClickMarcador: (reporte) => void
}
```

---

## 📱 RESPONSIVE DESIGN

**Breakpoints:**
```css
Mobile:    < 768px
Tablet:    768px - 1024px
Desktop:   > 1024px
```

**Componentes adaptativos:**
- MapView: Full screen en mobile, sidebar en desktop
- AdminPanel: Stack en mobile, columns en desktop
- Modales: Full screen en mobile, centered en desktop

---

## 🧪 TESTING

**Frontend tests:** `tests/frontend/`

**Tipos de tests:**
- Unit tests (Vitest)
- Integration tests (Vitest)
- E2E tests (Playwright)

**Coverage requerido:** 70% mínimo

---

## 🐛 DEBUGGING

### Console Logs Disponibles
```javascript
// En development, los logs incluyen:
// - 📨 POST requests
// - 📋 GET requests
// - ✅ Éxitos
// - ❌ Errores
// - Datos recibidos
```

### DevTools Network Tab
Buscar:
- `/api/reportes` - Queries al servidor
- `/tiles/` - Mapas de OpenStreetMap
- Status codes: 200/201 = OK, 4xx/5xx = Error

---

## 📚 ARCHIVOS RELACIONADOS

- **Estilos:** `client/src/App.css`
- **Config Vite:** `client/vite.config.js`
- **Package.json:** `client/package.json`
- **HTML raíz:** `client/index.html`
- **Public assets:** `client/public/`

---

**Documento Version:** 1.0  
**Última revisión:** Noviembre 17, 2025  
**Responsable:** Frontend Team
