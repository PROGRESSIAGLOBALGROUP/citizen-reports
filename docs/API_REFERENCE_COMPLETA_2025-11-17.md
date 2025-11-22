# API REFERENCE COMPLETA - Jantetelco Heatmap Platform
## Documentación de todos los endpoints y funcionalidades

**Última actualización:** Noviembre 17, 2025  
**Version:** 2.0.0  
**Base URL:** `http://localhost:4000` (dev) | `http://145.79.0.77:4000` (prod)

---

## 📋 Tabla de Contenidos

1. [Autenticación](#autenticación)
2. [Reportes](#reportes)
3. [Asignaciones](#asignaciones)
4. [Tipos y Categorías](#tipos-y-categorías)
5. [Usuarios (Admin)](#usuarios-admin)
6. [Dependencias (Admin)](#dependencias-admin)
7. [Whitelabel (Super-Usuario)](#whitelabel-super-usuario)
8. [Webhook (GitHub Deploy)](#webhook-github-deploy)
9. [Salud del Sistema](#salud-del-sistema)

---

## 🔐 AUTENTICACIÓN

### POST /api/auth/login
**Propósito:** Autenticar usuario y obtener token  
**Autenticación:** No requerida  
**Body:**
```json
{
  "email": "usuario@jantetelco.gob.mx",
  "password": "password123"
}
```

**Respuesta (201 OK):**
```json
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

**Errores:**
- `400`: Email o password inválido
- `401`: Credenciales incorrectas

**Usuarios de Prueba:**
```
admin@jantetelco.gob.mx / admin123 (rol: admin)
supervisor.obras@jantetelco.gob.mx / admin123 (rol: supervisor)
func.obras1@jantetelco.gob.mx / admin123 (rol: funcionario)
```

---

### POST /api/auth/logout
**Propósito:** Cerrar sesión  
**Autenticación:** Requerida (Bearer token)  
**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta (200 OK):**
```json
{ "ok": true, "message": "Sesión cerrada exitosamente" }
```

---

### GET /api/auth/me
**Propósito:** Obtener datos de sesión actual  
**Autenticación:** Requerida (Bearer token)  
**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta (200 OK):**
```json
{
  "id": 1,
  "email": "admin@jantetelco.gob.mx",
  "nombre": "Administrador",
  "rol": "admin",
  "dependencia": "administracion",
  "activo": 1
}
```

---

## 📍 REPORTES

### POST /api/reportes
**Propósito:** Crear nuevo reporte de ciudadano  
**Autenticación:** No requerida  
**Content-Type:** `application/json`  
**Límite de tamaño:** 5MB (para soportar fotos + firmas)

**Body:**
```json
{
  "tipo": "bache",
  "descripcion": "Descripción del problema",
  "descripcion_corta": "Bache en calle (auto-generada si no se proporciona)",
  "lat": 18.716,
  "lng": -98.776,
  "peso": 1,
  "fingerprint": "navegador_id",
  "ip_cliente": "192.168.1.1",
  "colonia": "Centro",
  "codigo_postal": "06000",
  "municipio": "México",
  "estado_ubicacion": "México"
}
```

**Respuesta (201 Created):**
```json
{
  "ok": true,
  "id": 123,
  "dependencia": "obras_publicas"
}
```

**Validación:**
- `tipo`: Requerido, debe existir en `tipos_reporte`
- `lat`: Entre -90 y 90
- `lng`: Entre -180 y 180
- `descripcion`: Opcional pero recomendada

**Mapeo automático de tipos → dependencias:**
- `bache` → `obras_publicas`
- `agua` → `agua_potable`
- `electricidad` → `servicios_publicos`
- Ver `DEPENDENCIA_POR_TIPO` en `auth_middleware.js` para lista completa

---

### GET /api/reportes
**Propósito:** Listar reportes con filtros  
**Autenticación:** No requerida  
**Query Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `minLat` | number | Latitud mínima (bounding box) |
| `maxLat` | number | Latitud máxima |
| `minLng` | number | Longitud mínima |
| `maxLng` | number | Longitud máxima |
| `tipo` | string | Tipo de reporte (puede ser array o CSV) |
| `estado` | string | Estado (abierto, asignado, pendiente_cierre, cerrado) |
| `dependencia` | string | Slug de dependencia |
| `from` | date | Desde (formato YYYY-MM-DD) |
| `to` | date | Hasta (formato YYYY-MM-DD) |

**Ejemplos:**
```
GET /api/reportes?estado=abiertos
GET /api/reportes?tipo=bache,agua&estado=abiertos
GET /api/reportes?minLat=18&maxLat=19&minLng=-99&maxLng=-98&estado=abiertos
GET /api/reportes?tipo=bache&from=2025-11-01&to=2025-11-17&dependencia=obras_publicas
```

**Respuesta (200 OK):**
```json
[
  {
    "id": 1,
    "tipo": "bache",
    "descripcion": "Bache en avenida principal",
    "descripcion_corta": "Bache en avenida principal",
    "lat": 18.716,
    "lng": -98.776,
    "peso": 1,
    "estado": "abierto",
    "dependencia": "obras_publicas",
    "creado_en": "2025-11-17T10:30:00Z",
    "colonia": "Centro",
    "codigo_postal": "06000",
    "municipio": "México",
    "estado_ubicacion": "México"
  }
]
```

---

### GET /api/reportes/{id}
**Propósito:** Obtener detalles de un reporte específico  
**Autenticación:** No requerida  

**Respuesta (200 OK):**
```json
{
  "id": 1,
  "tipo": "bache",
  "descripcion": "Bache en avenida principal",
  "lat": 18.716,
  "lng": -98.776,
  "peso": 1,
  "estado": "abierto",
  "dependencia": "obras_publicas",
  "creado_en": "2025-11-17T10:30:00Z",
  "colonia": "Centro",
  "codigo_postal": "06000",
  "municipio": "México",
  "estado_ubicacion": "México"
}
```

**Errores:**
- `404`: Reporte no encontrado

---

### GET /api/reportes/geojson
**Propósito:** Exportar reportes en formato GeoJSON  
**Autenticación:** No requerida  
**Query Parameters:** Mismo que `GET /api/reportes`

**Respuesta (200 OK):**
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
        "descripcion": "Bache en avenida principal"
      }
    }
  ]
}
```

---

### GET /api/reportes/grid
**Propósito:** Agregación de reportes en grid para heatmap  
**Autenticación:** No requerida  
**Query Parameters:**
- `tipo`: string (puede ser array o CSV)
- `cell`: number (tamaño de celda en grados, default 0.001)

**Respuesta (200 OK):**
```json
[
  {
    "lat": 18.716,
    "lng": -98.776,
    "peso": 5
  }
]
```

---

## 👥 ASIGNACIONES

### GET /api/reportes/{id}/asignaciones
**Propósito:** Listar funcionarios asignados a un reporte  
**Autenticación:** Recomendada  
**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta (200 OK):**
```json
[
  {
    "usuario_id": 3,
    "nombre": "Juan Pérez",
    "email": "juan.perez@jantetelco.gob.mx",
    "dependencia": "obras_publicas",
    "rol": "funcionario"
  }
]
```

---

### POST /api/reportes/{id}/asignaciones
**Propósito:** Asignar funcionario a reporte  
**Autenticación:** Requerida  
**Roles permitidos:** `admin`, `supervisor`  
**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "usuario_id": 3
}
```

**Respuesta (201 Created):**
```json
{
  "ok": true,
  "asignacion_id": 10,
  "usuario_id": 3,
  "reporte_id": 1,
  "auditado": true
}
```

**Lógica:**
- El usuario debe existir y ser `funcionario`
- Si es de otra dependencia, solo `admin` puede asignar
- Genera entrada en `historial_cambios` (ADR-0010: Audit trail)

---

### DELETE /api/reportes/{id}/asignaciones/{usuarioId}
**Propósito:** Remover asignación de funcionario  
**Autenticación:** Requerida  
**Roles permitidos:** `admin`, `supervisor`  

**Respuesta (200 OK):**
```json
{
  "ok": true,
  "estado_reporte": "abierto"
}
```

**Lógica:**
- Si era la última asignación, reporte vuelve a estado "abierto"
- Genera entrada en `historial_cambios`

---

### PUT /api/reportes/{id}/notas
**Propósito:** Agregar notas de progreso al reporte  
**Autenticación:** Requerida  
**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "notas": "Se realizó inspección, se encontró...",
  "usuario_id": 3
}
```

**Respuesta (200 OK):**
```json
{
  "ok": true,
  "reporte_id": 1,
  "timestamp": "2025-11-17T14:30:00Z"
}
```

---

### GET /api/reportes/{id}/notas-draft
**Propósito:** Obtener borrador de notas  
**Autenticación:** Requerida  

**Respuesta (200 OK):**
```json
{
  "reporte_id": 1,
  "usuario_id": 3,
  "notas": "Borrador de notas...",
  "actualizado_en": "2025-11-17T14:15:00Z"
}
```

---

### POST /api/reportes/{id}/notas-draft
**Propósito:** Guardar borrador de notas  
**Autenticación:** Requerida  

**Body:**
```json
{
  "notas": "Texto del borrador",
  "usuario_id": 3
}
```

**Respuesta (200 OK):**
```json
{
  "ok": true,
  "reporte_id": 1
}
```

---

### GET /api/reportes/{id}/historial
**Propósito:** Ver audit trail completo del reporte  
**Autenticación:** Recomendada  

**Respuesta (200 OK):**
```json
[
  {
    "id": 1,
    "reporte_id": 1,
    "usuario_id": 1,
    "tipo_cambio": "asignacion",
    "valor_anterior": null,
    "valor_nuevo": "Juan Pérez asignado",
    "timestamp": "2025-11-17T10:35:00Z"
  }
]
```

---

### POST /api/reportes/{id}/solicitar-cierre
**Propósito:** Funcionario solicita cerrar reporte  
**Autenticación:** Requerida  

**Body:**
```json
{
  "motivo": "Reporte resuelto",
  "firma_base64": "data:image/png;base64,...",
  "fotos": [
    {
      "data": "data:image/jpeg;base64,...",
      "tipo": "trabajo_completado"
    }
  ]
}
```

**Respuesta (200 OK):**
```json
{
  "ok": true,
  "cierre_id": 5,
  "estado": "pendiente_cierre"
}
```

---

### POST /api/reportes/{id}/reabrir
**Propósito:** Volver a abrir reporte cerrado  
**Autenticación:** Requerida  

**Body:**
```json
{
  "motivo": "Requiere más trabajo"
}
```

**Respuesta (200 OK):**
```json
{
  "ok": true,
  "estado": "abierto"
}
```

---

## 📂 TIPOS Y CATEGORÍAS

### GET /api/tipos
**Propósito:** Listar todos los tipos activos  
**Autenticación:** No requerida  

**Respuesta (200 OK):**
```json
[
  {
    "id": 1,
    "tipo": "bache",
    "nombre": "Baches",
    "descripcion": "Hoyos en la calle",
    "categoria_id": 1,
    "dependencia": "obras_publicas",
    "activo": 1
  }
]
```

---

### GET /api/categorias
**Propósito:** Listar categorías sin tipos anidados  
**Autenticación:** No requerida  

**Respuesta (200 OK):**
```json
[
  {
    "id": 1,
    "nombre": "Obras Públicas",
    "icono": "🏗️",
    "activo": 1
  }
]
```

---

### GET /api/categorias-con-tipos
**Propósito:** Listar categorías con tipos anidados  
**Autenticación:** No requerida  

**Respuesta (200 OK):**
```json
[
  {
    "id": 1,
    "nombre": "Obras Públicas",
    "icono": "🏗️",
    "tipos": [
      {
        "id": 1,
        "tipo": "bache",
        "nombre": "Baches",
        "descripcion": "Hoyos en la calle"
      }
    ]
  }
]
```

---

### POST /api/admin/tipos
**Propósito:** Crear nuevo tipo (solo admin)  
**Autenticación:** Requerida  
**Roles permitidos:** `admin`  

**Body:**
```json
{
  "tipo": "nuevo_tipo",
  "nombre": "Nuevo Tipo",
  "descripcion": "Descripción",
  "categoria_id": 1,
  "dependencia": "obras_publicas"
}
```

**Respuesta (201 Created):**
```json
{
  "ok": true,
  "id": 50
}
```

---

### PUT /api/admin/tipos/{id}
**Propósito:** Actualizar tipo  
**Autenticación:** Requerida  
**Roles permitidos:** `admin`  

**Respuesta (200 OK):**
```json
{ "ok": true }
```

---

### DELETE /api/admin/tipos/{id}
**Propósito:** Desactivar tipo (soft delete)  
**Autenticación:** Requerida  
**Roles permitidos:** `admin`  

**Respuesta (200 OK):**
```json
{ "ok": true }
```

---

### POST /api/admin/categorias
**Propósito:** Crear categoría  
**Autenticación:** Requerida  
**Roles permitidos:** `admin`  

**Body:**
```json
{
  "nombre": "Nueva Categoría",
  "icono": "🆕"
}
```

---

### PUT /api/admin/categorias/{id}
**Propósito:** Actualizar categoría  

---

### DELETE /api/admin/categorias/{id}
**Propósito:** Desactivar categoría  

---

## 👤 USUARIOS (ADMIN)

### GET /api/usuarios
**Propósito:** Listar usuarios con filtros  
**Autenticación:** Recomendada  
**Query Parameters:**
- `dependencia`: string
- `rol`: string
- `activo`: 0|1

**Respuesta (200 OK):**
```json
[
  {
    "id": 1,
    "email": "admin@jantetelco.gob.mx",
    "nombre": "Administrador",
    "rol": "admin",
    "dependencia": "administracion",
    "activo": 1
  }
]
```

---

### GET /api/usuarios/{id}
**Propósito:** Obtener datos específicos de usuario  

---

### POST /api/usuarios
**Propósito:** Crear nuevo usuario (solo admin)  
**Autenticación:** Requerida  
**Roles permitidos:** `admin`  

**Body:**
```json
{
  "email": "nuevo@jantetelco.gob.mx",
  "nombre": "Nuevo Usuario",
  "rol": "funcionario",
  "dependencia": "obras_publicas",
  "password": "NuevaPassword123"
}
```

**Validación:**
- Email único
- Password: mínimo 8 caracteres, letra y número
- Rol en: admin, supervisor, funcionario
- Dependencia debe existir

---

### PUT /api/usuarios/{id}
**Propósito:** Actualizar usuario  

---

### DELETE /api/usuarios/{id}
**Propósito:** Desactivar usuario (soft delete)  

---

### GET /api/roles
**Propósito:** Listar roles disponibles  
**Autenticación:** No requerida  

**Respuesta (200 OK):**
```json
[
  { "id": "admin", "nombre": "Administrador" },
  { "id": "supervisor", "nombre": "Supervisor" },
  { "id": "funcionario", "nombre": "Funcionario" }
]
```

---

## 🏢 DEPENDENCIAS (ADMIN)

### GET /api/dependencias
**Propósito:** Listar dependencias públicamente  
**Autenticación:** No requerida  

**Respuesta (200 OK):**
```json
[
  {
    "id": 1,
    "slug": "obras_publicas",
    "nombre": "Obras Públicas",
    "icono": "🏗️",
    "orden": 1,
    "activo": 1
  }
]
```

---

### GET /api/admin/dependencias
**Propósito:** Listar dependencias (admin)  
**Autenticación:** Requerida  
**Roles permitidos:** `admin`  

---

### POST /api/admin/dependencias
**Propósito:** Crear dependencia  

---

### PUT /api/admin/dependencias/{id}
**Propósito:** Actualizar dependencia  

---

### PATCH /api/admin/dependencias/{id}/orden
**Propósito:** Reordenar dependencias  

---

### DELETE /api/admin/dependencias/{id}
**Propósito:** Desactivar dependencia  

---

## 🎨 WHITELABEL (SUPER-USUARIO)

### GET /api/whitelabel/config
**Propósito:** Obtener configuración visual del sistema  
**Autenticación:** No requerida  

**Respuesta (200 OK):**
```json
{
  "titulo": "Jantetelco Reportes",
  "logo_url": "/images/logo.png",
  "color_primario": "#2196F3",
  "color_secundario": "#FFC107"
}
```

---

### POST /api/super-usuario/whitelabel/config
**Propósito:** Actualizar configuración  
**Autenticación:** Requerida  
**Roles permitidos:** `admin`  

---

### GET /api/super-usuario/stats
**Propósito:** Obtener estadísticas del sistema  
**Autenticación:** Requerida  
**Roles permitidos:** `admin`  

**Respuesta (200 OK):**
```json
{
  "total_reportes": 1250,
  "reportes_abiertos": 320,
  "reportes_asignados": 450,
  "reportes_cerrados": 480,
  "total_usuarios": 45,
  "tipos_reporte": 25
}
```

---

## 🔄 WEBHOOK (GITHUB DEPLOY)

### POST /api/webhook/github
**Propósito:** Webhook para auto-deploy desde GitHub  
**Autenticación:** Verificación de firma GitHub  

**Headers:**
```
X-Hub-Signature-256: sha256={hash}
Content-Type: application/json
```

**Body:** GitHub push event

**Respuesta (200 OK):**
```json
{
  "ok": true,
  "message": "Deploy iniciado"
}
```

---

### GET /api/deploy/logs
**Propósito:** Ver últimos 50 logs de deployment  
**Autenticación:** No requerida  

**Respuesta (200 OK):**
```json
{
  "logs": "[timestamp] Iniciando deploy...\n[timestamp] git pull...\n..."
}
```

---

## 🏥 SALUD DEL SISTEMA

### GET /health
**Propósito:** Health check del servidor  
**Autenticación:** No requerida  

**Respuesta (200 OK):**
```json
{
  "status": "OK",
  "timestamp": "2025-11-17T14:30:00Z"
}
```

---

## 🔒 SEGURIDAD Y HEADERS

### Headers Requeridos en Producción

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' unpkg.com cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self' https:;
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
```

### Autenticación Bearer Token

```
Authorization: Bearer {jwt_token}
```

Token incluye:
- `user_id`: ID del usuario
- `email`: Email del usuario
- `rol`: Rol del usuario
- `dependencia`: Dependencia del usuario
- `exp`: Expiration time (24 horas)

---

## 🎯 ERRORES COMUNES

| Código | Significado | Solución |
|--------|-----------|----------|
| 200 | OK | Éxito |
| 201 | Created | Recurso creado exitosamente |
| 400 | Bad Request | Validar parámetros |
| 401 | Unauthorized | Falta token o token inválido |
| 403 | Forbidden | Rol insuficiente para operación |
| 404 | Not Found | Recurso no existe |
| 409 | Conflict | Duplicado (ej. usuario ya existe) |
| 500 | Server Error | Error interno del servidor |

---

## 📚 RELACIONADOS

- **OpenAPI Spec:** `docs/api/openapi.yaml`
- **Rutas Auth:** `server/auth_routes.js`
- **Middleware:** `server/auth_middleware.js`
- **ADRs Relevantes:**
  - ADR-0006: Many-to-many assignments
  - ADR-0009: Database-driven types
  - ADR-0010: Unified audit trail

---

**Documento Version:** 2.0  
**Última revisión:** Noviembre 17, 2025  
**Responsable:** Development Team
