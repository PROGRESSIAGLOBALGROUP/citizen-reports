# Sistema de Autenticación y Gestión de Reportes para Funcionarios

## Descripción General

Se ha implementado un sistema completo de autenticación y gestión de reportes que permite a los funcionarios municipales:

1. **Iniciar sesión** con email/password o Google OAuth
2. **Ver reportes asignados** a su usuario
3. **Solicitar cierre de reportes** con firma digital y evidencia
4. **Aprobar o rechazar cierres** (solo supervisores)
5. **Gestión de permisos** por dependencia y rol

## Arquitectura del Sistema

### Base de Datos

Se agregaron 4 nuevas tablas:

- **`usuarios`**: Funcionarios con email, password, dependencia y rol
- **`sesiones`**: Tokens de autenticación con expiración
- **`asignaciones`**: Relación entre reportes y funcionarios
- **`cierres_pendientes`**: Solicitudes de cierre pendientes de aprobación

### Dependencias Instaladas

**Backend:**

- `bcrypt`: Para hashear passwords
- `google-auth-library`: Para OAuth con Google (opcional)

**Frontend:**

- Google Sign-In API (cargada dinámicamente)

## Flujo de Trabajo

### 1. Ciudadano Reporta un Problema

- El reporte se crea con estado `abierto`
- Se asigna automáticamente a una dependencia según el tipo:
  - `baches` → Obras Públicas
  - `alumbrado` → Servicios Públicos
  - `seguridad` → Seguridad Pública
  - `agua` → Agua Potable
  - `parques` → Parques y Jardines

### 2. Supervisor Asigna el Reporte

- El supervisor inicia sesión
- Ve todos los reportes de su dependencia
- Asigna el reporte a un funcionario específico
- El reporte cambia a estado `asignado`

### 3. Funcionario Trabaja en el Reporte

- El funcionario inicia sesión
- Ve sus reportes asignados en "Mis Reportes"
- Trabaja en la solución del problema
- Cuando termina, solicita el cierre

### 4. Solicitud de Cierre

El funcionario debe proporcionar:

- **Notas de cierre**: Descripción de las acciones realizadas
- **Firma digital**: Imagen de su firma (upload)
- **Evidencia fotográfica** (opcional): Fotos del problema resuelto

El reporte cambia a estado `pendiente_cierre` y se notifica al supervisor.

### 5. Aprobación del Supervisor

- El supervisor ve la solicitud en "Cierres Pendientes"
- Revisa las notas, firma y evidencia
- Puede:
  - **Aprobar**: El reporte cambia a estado `cerrado`
  - **Rechazar**: El reporte vuelve a `asignado` con observaciones

## Usuarios de Prueba

Los siguientes usuarios están pre-cargados en la base de datos:

| Email                                    | Password   | Rol           | Dependencia        |
| ---------------------------------------- | ---------- | ------------- | ------------------ |
| `admin@jantetelco.gob.mx`                | `admin123` | Administrador | Administración     |
| `supervisor.obras@jantetelco.gob.mx`     | `admin123` | Supervisor    | Obras Públicas     |
| `func.obras1@jantetelco.gob.mx`          | `admin123` | Funcionario   | Obras Públicas     |
| `supervisor.servicios@jantetelco.gob.mx` | `admin123` | Supervisor    | Servicios Públicos |
| `func.servicios1@jantetelco.gob.mx`      | `admin123` | Funcionario   | Servicios Públicos |

**⚠️ IMPORTANTE:** Cambiar estos passwords en producción.

## API Endpoints

### Autenticación

```http
POST /api/auth/login
Body: { email, password }
Response: { token, expiraEn, usuario }

POST /api/auth/logout
Headers: Authorization: Bearer <token>

GET /api/auth/me
Headers: Authorization: Bearer <token>
Response: { id, email, nombre, dependencia, rol, tieneFirma }
```

### Gestión de Reportes (Autenticado)

```http
GET /api/reportes/mis-reportes
Headers: Authorization: Bearer <token>
Response: Array de reportes asignados al usuario

GET /api/reportes/:id/detalle
Headers: Authorization: Bearer <token>
Response: Detalle completo del reporte con asignaciones y cierre pendiente

POST /api/reportes/:id/asignar
Headers: Authorization: Bearer <token>
Body: { usuario_id, notas }
Requiere: rol supervisor o admin

POST /api/reportes/:id/solicitar-cierre
Headers: Authorization: Bearer <token>
Body: { notas_cierre, firma_digital, evidencia_fotos }
Requiere: estar asignado al reporte

GET /api/reportes/cierres-pendientes
Headers: Authorization: Bearer <token>
Requiere: rol supervisor o admin

POST /api/reportes/cierres/:id/aprobar
Headers: Authorization: Bearer <token>
Body: { notas_supervisor }
Requiere: rol supervisor o admin

POST /api/reportes/cierres/:id/rechazar
Headers: Authorization: Bearer <token>
Body: { notas_supervisor }
Requiere: rol supervisor o admin
```

## Permisos y Roles

### Funcionario

- Ver reportes asignados a su usuario
- Solicitar cierre de reportes asignados
- Subir evidencia y firma digital

### Supervisor

- Todo lo anterior
- Asignar reportes a funcionarios de su dependencia
- Aprobar/rechazar cierres de su dependencia

### Administrador

- Acceso completo a todas las dependencias
- Puede asignar cualquier reporte
- Puede aprobar/rechazar cualquier cierre

## Configuración de Google OAuth (Opcional)

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear un proyecto nuevo o usar uno existente
3. Habilitar la API "Google Sign-In"
4. Crear credenciales OAuth 2.0
5. Agregar `http://localhost:5173` y `http://localhost:4000` como orígenes autorizados
6. Copiar el Client ID
7. Crear archivo `.env` en `server/`:

   ```env
   GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
   ```

8. Crear archivo `.env` en `client/`:

   ```env
   VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
   ```

## Seguridad

- Passwords hasheados con bcrypt (10 rounds)
- Tokens de sesión aleatorios (SHA-256)
- Sesiones con expiración de 24 horas
- Middleware de autenticación en todas las rutas protegidas
- Validación de permisos por rol y dependencia
- Foreign keys habilitados en SQLite

## Interfaz de Usuario

### Barra de Navegación

- **Usuario no autenticado**: Muestra botón "🔐 Inicio de Sesión"
- **Usuario autenticado**: Muestra nombre, rol y botón "🚪 Cerrar Sesión"
- Botón "📋 Panel" para acceder al panel de funcionario

### Modal de Login

- Tabs para elegir entre Email/Password o Google
- Validación de campos
- Mensajes de error claros

### Panel de Funcionario

- Tab "Mis Reportes Asignados": Lista de reportes con botón para solicitar cierre
- Tab "Cierres Pendientes" (solo supervisores): Lista con botones aprobar/rechazar
- Modal para solicitar cierre con:
  - Campo de notas (obligatorio)
  - Upload de firma (obligatorio)
  - Upload de evidencia fotográfica (opcional, múltiples fotos)

## Próximos Pasos Recomendados

1. **Notificaciones**: Email/SMS cuando se asigna un reporte o se aprueba/rechaza un cierre
2. **Dashboard**: Estadísticas de reportes por dependencia, funcionario, tiempo promedio de resolución
3. **Historial**: Log de todos los cambios de estado de un reporte
4. **Geolocalización**: Mostrar reportes asignados en el mapa
5. **PWA**: Convertir en Progressive Web App para uso móvil offline

## Testing

Para probar el sistema:

1. Iniciar sesión con cualquiera de los usuarios de prueba
2. Como supervisor: Crear un reporte ciudadano y asignarlo a un funcionario
3. Como funcionario: Ver el reporte asignado y solicitar su cierre
4. Como supervisor: Aprobar o rechazar el cierre

## Troubleshooting

### Error: "Usuario no autorizado"

- Verificar que el email esté registrado en la tabla `usuarios`
- Solo usuarios pre-autorizados pueden ingresar

### Error: "Token inválido o expirado"

- El token tiene validez de 24 horas
- Cerrar sesión y volver a iniciar

### No aparece el botón de Google

- Verificar que `VITE_GOOGLE_CLIENT_ID` esté configurado en `client/.env`
- Abrir DevTools y revisar errores de red

### Error al subir firma/evidencia

- Las imágenes se convierten a Base64 y se almacenan en la DB
- Para archivos grandes, considerar usar S3/Cloud Storage (futura mejora)

## Mantenimiento

### Limpiar sesiones expiradas

```sql
DELETE FROM sesiones WHERE datetime(expira_en) < datetime('now');
```

### Ver reportes por estado

```sql
SELECT estado, COUNT(*) as total FROM reportes GROUP BY estado;
```

### Listar funcionarios por dependencia

```sql
SELECT dependencia, COUNT(*) as total FROM usuarios WHERE activo = 1 GROUP BY dependencia;
```

## Licencia

Este sistema es parte del proyecto citizen-reports Heatmap Platform.
