# White Label & Super Usuario Configuration

## 📋 Descripción General

Sistema de configuración permitemarcas blancas (white label) para municipios que deseen ocultar la referencia a PROGRESSIA y personalizar la aplicación con su propia identidad corporativa.

**Acceso**: Solo SUPER USUARIO con token especial
**Ubicación**: `#super-user` en la aplicación
**Base de datos**: Nueva tabla `whitelabel_config`

---

## 🔐 Autenticación de Super Usuario

### Token de Super Usuario

1. **Configurar variable de entorno**:
```bash
export SUPER_USER_TOKEN="tu-token-super-secreto"
```

2. **Primer acceso**:
   - Ir a `http://app.local:4000/#super-user`
   - Sistema pedirá ingresartoken via `prompt()`
   - Token se guarda en `localStorage` bajo clave `super_user_token`

3. **Endpoints protegidos**:
Todos los endpoints de super usuario requieren header:
```
X-Super-User-Token: {SUPER_USER_TOKEN}
```

---

## 🎨 Configuración de White Label

### Parámetros Disponibles

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `nombre_municipio` | String | 'citizen-reports' | Nombre del municipio que aparece en hero section |
| `mostrar_progressia` | Boolean | `true` | Mostrar u ocultar logo/branding "🌍 PROGRESSIA" |
| `mostrar_citizen_reports` | Boolean | `true` | Mostrar u ocultar texto "Citizen-Reports" |
| `color_primario` | Hex | '#1e40af' | Color principal (gradiente hero section) |
| `color_secundario` | Hex | '#2563eb' | Color secundario (gradiente hero section) |
| `logo_url` | String/NULL | NULL | URL del logo del municipio (futuro) |
| `nombre_app` | String | 'Citizen-Reports' | Nombre de la aplicación |
| `lema` | String | 'Transparencia Municipal' | Lema o eslogan |

### Ejemplo de Configuración

**Para Municipio de Cuernavaca** (ocultar PROGRESSIA):
```json
{
  "nombre_municipio": "Cuernavaca",
  "mostrar_progressia": false,
  "mostrar_citizen_reports": true,
  "color_primario": "#1f2937",
  "color_secundario": "#374151",
  "nombre_app": "ReportesCDI",
  "lema": "Cuernavaca Transparente 2025"
}
```

---

## 🛠️ API Endpoints

### 1. GET /api/whitelabel/config
**Acceso**: Público (sin autenticación)
**Descripción**: Obtiene la configuración white label actual

**Response**:
```json
{
  "nombre_municipio": "citizen-reports",
  "mostrar_progressia": 1,
  "mostrar_citizen_reports": 1,
  "color_primario": "#1e40af",
  "color_secundario": "#2563eb",
  "nombre_app": "Citizen-Reports",
  "lema": "Transparencia Municipal"
}
```

### 2. POST /api/super-usuario/whitelabel/config
**Acceso**: Solo SUPER USUARIO
**Headers**: `X-Super-User-Token: {token}`
**Descripción**: Actualiza o crea configuración white label

**Body**:
```json
{
  "nombre_municipio": "Cuernavaca",
  "mostrar_progressia": false,
  "mostrar_citizen_reports": true,
  "color_primario": "#1f2937",
  "color_secundario": "#374151",
  "nombre_app": "ReportesCDI",
  "lema": "Cuernavaca Transparente"
}
```

**Response** (201 Created):
```json
{
  "message": "White label configuration created",
  "config": { ...config }
}
```

### 3. GET /api/super-usuario/stats
**Acceso**: Solo SUPER USUARIO
**Headers**: `X-Super-User-Token: {token}`
**Descripción**: Dashboard con estadísticas del sistema

**Response**:
```json
{
  "timestamp": "2025-11-01T21:45:00Z",
  "stats": {
    "total_reportes": 156,
    "total_usuarios": 24,
    "total_admins": 3,
    "dependencias_activas": 5,
    "reportes_abiertos": 89,
    "reportes_cerrados": 67
  }
}
```

---

## 💾 Schema de Base de Datos

### Tabla: whitelabel_config
```sql
CREATE TABLE whitelabel_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_municipio TEXT NOT NULL,
  mostrar_progressia INTEGER DEFAULT 1,
  mostrar_citizen_reports INTEGER DEFAULT 1,
  color_primario TEXT DEFAULT '#1e40af',
  color_secundario TEXT DEFAULT '#2563eb',
  logo_url TEXT,
  nombre_app TEXT DEFAULT 'Citizen-Reports',
  lema TEXT DEFAULT 'Transparencia Municipal',
  activo INTEGER DEFAULT 1,
  super_usuario_id INTEGER,
  creado_en TEXT DEFAULT (datetime('now')),
  actualizado_en TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (super_usuario_id) REFERENCES usuarios(id)
);
```

---

## 🎯 Panel de Super Usuario

### Características

**Tab 1: ⚙️ White Label**
- Editar nombre del municipio
- Toggle mostrar/ocultar PROGRESSIA
- Toggle mostrar/ocultar Citizen-Reports
- Selector de colores primario y secundario
- Editar nombre app y lema
- Botón "Guardar Configuración"

**Tab 2: 📊 Estadísticas**
- Total de reportes en el sistema
- Total de usuarios
- Total de administradores
- Dependencias activas
- Reportes abiertos vs cerrados
- Visualización en tarjetas con colores

### Acceso

```
URL: http://app.local:4000/#super-user
```

Si no hay token guardado, mostrará `prompt()` solicitándolo.

---

## 📈 Flujo de Uso Típico

### Para Cliente PROGRESSIA (citizen-reports)

1. ✅ Mostrar PROGRESSIA = `true`
2. ✅ Mostrar Citizen-Reports = `true`
3. ✅ Colores por defecto (#1e40af, #2563eb)
4. ✅ Nombre municipio = "citizen-reports"

### Para Cliente Pagante (Cuernavaca)

1. ❌ Mostrar PROGRESSIA = `false` (ocultado)
2. ✅ Mostrar Citizen-Reports = `true`
3. 🎨 Colores personalizados (#1f2937, #374151)
4. 📱 Nombre app = "ReportesCDI"
5. 💬 Lema = "Cuernavaca Transparente"

---

## 🔑 Contadores de Prioridades

### Nueva Funcionalidad

Cada nivel de prioridad (Alta/Media/Baja) ahora muestra contador de reportes:

```
🔴 Alta       12/34    ← Visibles/Total
🟠 Media      8/21
🟢 Baja       15/45
```

**Lógica de Cálculo**:
- Peso >= 4: "Alta"
- Peso 2-3: "Media"
- Peso < 2: "Baja"

**Contador Visible vs Total**:
- Visible: Reportes que pasan los filtros de tipo y prioridad activos
- Total: Todos los reportes con filtros de tipo aplicados

---

## 📝 Variables de Entorno

### Requeridas para Super Usuario

```env
# Servidor
SUPER_USER_TOKEN=your-super-secret-token-here
PORT=4000
DB_PATH=./data.db

# Opcional
NODE_ENV=production
```

**⚠️ CRÍTICO**: Nunca versionar `SUPER_USER_TOKEN` en Git
Usar `.env` local o gestión de secretos del servidor

---

## 🚀 Deployment Checklist

- [ ] Crear tabla `whitelabel_config` (ejecutar `npm run init`)
- [ ] Configurar variable `SUPER_USER_TOKEN` en servidor
- [ ] Importar `SuperUserPanel.jsx` en `App.jsx`
- [ ] Importar rutas de whitelabel en `server/app.js`
- [ ] Build cliente: `npm run build`
- [ ] Deploy: `scp dist` y `pm2 restart app`
- [ ] Acceder a `#super-user` e ingresar token
- [ ] Guardar configuración de prueba

---

## 🔄 Arquitectura de Datos

```
Frontend (React)
    ↓
SuperUserPanel.jsx (UI para edición)
    ↓
POST /api/super-usuario/whitelabel/config (con token)
    ↓
whitelabel-routes.js (validación + DB)
    ↓
whitelabel_config table (SQLite)
    ↓
GET /api/whitelabel/config (pública)
    ↓
ImprovedMapView.jsx (lee config on mount)
    ↓
Hero Section renderiza con config actual
```

---

## 🧪 Testing

### Crear Config de Prueba

```bash
curl -X POST http://localhost:4000/api/super-usuario/whitelabel/config \
  -H "Content-Type: application/json" \
  -H "X-Super-User-Token: test-token" \
  -d '{
    "nombre_municipio": "Cuernavaca",
    "mostrar_progressia": false,
    "mostrar_citizen_reports": true,
    "color_primario": "#1f2937",
    "nombre_app": "ReportesCDI"
  }'
```

### Obtener Config (Público)

```bash
curl http://localhost:4000/api/whitelabel/config
```

### Obtener Stats (Super Usuario)

```bash
curl http://localhost:4000/api/super-usuario/stats \
  -H "X-Super-User-Token: test-token"
```

---

## 📌 Notas Importantes

1. **Multi-tenancy**: Actualmente soporta 1 configuración activa
2. **Futuro**: Poder tener múltiples municipios con sus propias configs
3. **Logo**: Campo `logo_url` está listo para implementación futura
4. **Colores**: Validación regex para formato #RRGGBB
5. **Auditoria**: Nueva tabla usa `creado_en` y `actualizado_en` para tracking

---

## 🎓 Ejemplos Prácticos

### Ejemplo 1: Cliente que paga por branding personalizado

```json
{
  "nombre_municipio": "Toluca",
  "mostrar_progressia": false,
  "mostrar_citizen_reports": false,
  "color_primario": "#c41e3a",
  "color_secundario": "#ffc72c",
  "nombre_app": "ToIReportea",
  "lema": "Toluca Conectada"
}
```

### Ejemplo 2: Municipio compartido (mostrar todos los partners)

```json
{
  "nombre_municipio": "Cuauhtémoc / CDMX",
  "mostrar_progressia": true,
  "mostrar_citizen_reports": true,
  "color_primario": "#0066cc",
  "color_secundario": "#ff9900",
  "nombre_app": "Citizen-Reports",
  "lema": "Transparencia CDMX"
}
```

---

**Última actualización**: 1 de Noviembre, 2025  
**Versión**: 1.0 (White Label + Super Usuario)
