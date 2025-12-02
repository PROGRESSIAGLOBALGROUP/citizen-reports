# 📋 User Stories — citizen-reports

> **Documento exhaustivo** de todas las funcionalidades del sistema  
> Organizado por rol y pantalla para guiar desarrollo y auditorías

---

## 🎯 Índice de Roles

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| [Ciudadano](#-ciudadano-usuario-público) | Usuario público sin autenticación | Mapa + Formulario |
| [Funcionario](#-funcionario) | Empleado municipal asignado a reportes | Panel + Reportes asignados |
| [Supervisor](#-supervisor) | Jefe de departamento | Panel + Todos los reportes del depto |
| [Admin](#-administrador) | Administrador del sistema | Panel Admin completo |
| [SuperUser](#-superuser) | Acceso técnico de emergencia | Herramientas avanzadas |

---

## 👤 Ciudadano (Usuario Público)

### 🗺️ US-C01: Ver Mapa de Calor de Reportes
**Como** ciudadano  
**Quiero** ver un mapa de calor con los reportes de mi municipio  
**Para** conocer las zonas con más incidencias

**Criterios de Aceptación:**
- [ ] El mapa carga centrado en las coordenadas del municipio configurado
- [ ] Los reportes se muestran como puntos de calor (heatmap)
- [ ] Puedo hacer zoom in/out para ver más detalle
- [ ] Los colores indican densidad: verde (pocos) → rojo (muchos)
- [ ] El mapa es responsive (funciona en móvil y desktop)
- [ ] Los tiles cargan correctamente sin errores 404

**Componentes:** `ImprovedMapView.jsx`, `MapaCalor.jsx`  
**API:** `GET /api/reportes` (público)

---

### 📍 US-C02: Crear Nuevo Reporte
**Como** ciudadano  
**Quiero** reportar un problema en mi colonia  
**Para** que las autoridades lo atiendan

**Criterios de Aceptación:**
- [ ] Puedo seleccionar ubicación tocando/clickeando el mapa
- [ ] El sistema obtiene automáticamente: colonia, CP, municipio, estado
- [ ] Valida que la ubicación pertenezca al municipio configurado
- [ ] Puedo seleccionar el tipo de reporte de una lista
- [ ] Puedo escribir una descripción del problema
- [ ] Puedo adjuntar hasta 5 fotos como evidencia
- [ ] Las fotos se comprimen automáticamente (max 800px)
- [ ] El botón de enviar se deshabilita mientras procesa
- [ ] Recibo confirmación visual al crear el reporte
- [ ] El reporte aparece en el mapa inmediatamente

**Componentes:** `ReportForm.jsx`, `MapSelector.jsx`  
**API:** `POST /api/reportes`  
**Servicio:** `geocoding-service.js` (reverseGeocode)

---

### 🔍 US-C03: Ver Detalle de Reporte (Público)
**Como** ciudadano  
**Quiero** ver el estado de un reporte existente  
**Para** saber si ya fue atendido

**Criterios de Aceptación:**
- [ ] Puedo ver: tipo, descripción, estado, fecha de creación
- [ ] Puedo ver la ubicación en un mini-mapa
- [ ] Puedo ver las fotos de evidencia originales
- [ ] El estado se muestra con colores: pendiente (amarillo), en proceso (azul), cerrado (verde)
- [ ] NO puedo ver notas internas de trabajo
- [ ] NO puedo ver información del funcionario asignado

**Componentes:** `VerReporte.jsx` (modo público)  
**API:** `GET /api/reportes/:id`

---

### 🔐 US-C04: Iniciar Sesión
**Como** ciudadano con cuenta  
**Quiero** iniciar sesión  
**Para** acceder a funciones de funcionario

**Criterios de Aceptación:**
- [ ] Puedo iniciar sesión con email y contraseña
- [ ] Puedo iniciar sesión con Google OAuth
- [ ] El modal de login aparece al hacer clic en "Iniciar Sesión"
- [ ] El modal se cierra automáticamente al autenticar
- [ ] Si las credenciales son incorrectas, veo mensaje de error
- [ ] El token se guarda en `localStorage.auth_token`
- [ ] Después de login, navego al panel correspondiente a mi rol

**Componentes:** `LoginModal.jsx`, `LoginButton.jsx`  
**API:** `POST /api/usuarios/login`

---

### 🚪 US-C05: Cerrar Sesión
**Como** usuario autenticado  
**Quiero** cerrar mi sesión  
**Para** proteger mi cuenta en dispositivos compartidos

**Criterios de Aceptación:**
- [ ] El botón de logout aparece en el header cuando estoy autenticado
- [ ] Al cerrar sesión, se elimina el token de localStorage
- [ ] Se invalida la sesión en el servidor
- [ ] Navego automáticamente a la pantalla pública (mapa)
- [ ] No puedo acceder a rutas protegidas después de logout

**Componentes:** `AppHeader.jsx`, `ProfessionalTopBar.jsx`  
**API:** `POST /api/usuarios/logout`

---

### ✏️ US-C06: Editar Mi Reporte (Ciudadano)
**Como** ciudadano que creó un reporte  
**Quiero** editar la descripción antes de que sea asignado  
**Para** corregir errores o agregar información

**Criterios de Aceptación:**
- [ ] Solo puedo editar reportes que yo creé (por fingerprint/IP)
- [ ] Solo puedo editar si el estado es "pendiente"
- [ ] Puedo modificar: descripción, tipo, fotos
- [ ] NO puedo modificar: ubicación (requiere nuevo reporte)
- [ ] El historial registra la edición

**Componentes:** `VerReporte.jsx` (modo edición)  
**API:** `PUT /api/reportes/:id`  
**Restricción:** Solo si `estado === 'pendiente'` y `fingerprint` coincide

---

## 👷 Funcionario

### 📋 US-F01: Ver Mis Reportes Asignados
**Como** funcionario  
**Quiero** ver los reportes que tengo asignados  
**Para** conocer mi carga de trabajo

**Criterios de Aceptación:**
- [ ] Veo una lista de reportes donde estoy asignado
- [ ] **Solo veo reportes de MI dependencia** (no de otras)
- [ ] Puedo filtrar por estado: pendiente, en proceso, cerrado
- [ ] Puedo buscar por texto en descripción o dirección
- [ ] Cada tarjeta muestra: tipo, fecha, estado, colonia
- [ ] Puedo ordenar por fecha (más reciente primero)
- [ ] El contador muestra total de reportes asignados
- [ ] Los reportes cerrados aparecen con estilo diferente
- [ ] NO puedo ver reportes de otras dependencias aunque conozca el ID

**Restricción de Acceso:** `WHERE dependencia = req.usuario.dependencia`

**Componentes:** `PanelFuncionario.jsx` (vista: mis-reportes)  
**API:** `GET /api/reportes/mis-reportes`

---

### 📝 US-F02: Agregar Nota de Trabajo
**Como** funcionario  
**Quiero** documentar mi trabajo en un reporte  
**Para** dejar registro de las acciones realizadas

**Criterios de Aceptación:**
- [ ] Puedo escribir notas de texto libre
- [ ] Las notas son **append-only** (no se pueden editar ni borrar)
- [ ] Cada nota registra: usuario, fecha/hora, contenido
- [ ] Las notas se muestran en orden cronológico
- [ ] Puedo ver notas de otros funcionarios asignados
- [ ] El campo de nota tiene un borrador que se guarda localmente
- [ ] El borrador se limpia después de enviar

**Componentes:** `VerReporte.jsx` (sección notas-trabajo)  
**API:** `POST /api/reportes/:id/notas-trabajo`  
**Auditoría:** Cada nota → `historial_cambios`

---

### 📸 US-F03: Adjuntar Evidencia Fotográfica
**Como** funcionario  
**Quiero** subir fotos del trabajo realizado  
**Para** documentar el avance o cierre

**Criterios de Aceptación:**
- [ ] Puedo tomar foto directamente desde el móvil
- [ ] Puedo seleccionar fotos de la galería
- [ ] Las fotos se comprimen automáticamente
- [ ] Veo preview de las fotos antes de enviar
- [ ] Las fotos se almacenan en base64 en la BD
- [ ] Puedo ver las fotos de evidencia en galería

**Componentes:** `VerReporte.jsx`, `ImageUploader.jsx`  
**API:** `POST /api/reportes/:id/evidencias`

---

### ✅ US-F04: Solicitar Cierre de Reporte
**Como** funcionario  
**Quiero** solicitar el cierre de un reporte  
**Para** indicar que el trabajo está completado

**Criterios de Aceptación:**
- [ ] El botón "Solicitar Cierre" aparece solo en reportes asignados a mí
- [ ] Debo escribir un resumen del trabajo realizado
- [ ] Debo adjuntar al menos 1 foto de evidencia
- [ ] Debo proporcionar mi **firma digital** (canvas de firma)
- [ ] La solicitud queda en estado "pendiente de aprobación"
- [ ] El supervisor de mi dependencia recibe notificación
- [ ] NO puedo cerrar directamente, solo solicitar

**Componentes:** `VerReporte.jsx` (modal solicitud-cierre)  
**API:** `POST /api/reportes/:id/solicitar-cierre`  
**Flujo:** funcionario → supervisor aprueba/rechaza

---

### 🗺️ US-F05: Ver Ubicación en Mapa
**Como** funcionario  
**Quiero** ver la ubicación exacta del reporte en un mapa  
**Para** poder llegar al lugar

**Criterios de Aceptación:**
- [ ] El mapa muestra un marcador en la ubicación del reporte
- [ ] Puedo hacer zoom para ver más detalle
- [ ] La dirección completa aparece debajo del mapa
- [ ] Puedo abrir la ubicación en Google Maps (link externo)

**Componentes:** `VerReporte.jsx` (mini-mapa)  
**Datos:** lat, lng, colonia, cp, municipio

---

## 👔 Supervisor

### 📊 US-S01: Ver Reportes de Mi Dependencia
**Como** supervisor  
**Quiero** ver todos los reportes de mi departamento  
**Para** monitorear la carga de trabajo del equipo

**Criterios de Aceptación:**
- [ ] Veo todos los reportes asignados a **MI dependencia únicamente**
- [ ] Incluye reportes de todos los funcionarios de MI depto
- [ ] **NO puedo ver reportes de otras dependencias**
- [ ] Puedo filtrar por funcionario específico (de mi depto)
- [ ] Puedo filtrar por estado y tipo
- [ ] Veo métricas: total, pendientes, en proceso, cerrados (solo mi depto)
- [ ] Puedo exportar lista a CSV (solo mi depto)
- [ ] Si intento acceder a reporte de otra dependencia → 403 Forbidden

**Restricción de Acceso:** `WHERE dependencia = req.usuario.dependencia`  
**⚠️ IMPORTANTE:** Solo el Admin puede ver reportes de TODAS las dependencias

**Componentes:** `PanelFuncionario.jsx` (vista: reportes-dependencia)  
**API:** `GET /api/reportes/dependencia/:id`  
**Validación:** Solo si `req.usuario.rol === 'supervisor'`

---

### 👥 US-S02: Asignar Funcionario a Reporte
**Como** supervisor  
**Quiero** asignar funcionarios a un reporte  
**Para** distribuir el trabajo

**Criterios de Aceptación:**
- [ ] Veo lista de funcionarios **solo de MI dependencia** disponibles
- [ ] **NO puedo asignar funcionarios de otras dependencias**
- [ ] Solo puedo asignar a reportes **de MI dependencia**
- [ ] Puedo seleccionar uno o varios funcionarios (de mi depto)
- [ ] La asignación se registra con fecha y hora
- [ ] El funcionario ve el reporte en "Mis Reportes"
- [ ] El historial registra quién asignó y cuándo
- [ ] Puedo re-asignar a otro funcionario (de mi depto)

**Restricción:** Solo supervisores pueden asignar, y solo dentro de su dependencia

**Componentes:** `VerReporte.jsx` (modal asignación)  
**API:** `POST /api/reportes/:id/asignaciones`  
**Auditoría:** `historial_cambios` con acción "asignacion"

---

### 🔄 US-S03: Reasignar Reporte a Otra Dependencia
**Como** supervisor  
**Quiero** transferir un reporte a otra dependencia  
**Para** que lo atienda el departamento correcto

**Criterios de Aceptación:**
- [ ] Puedo seleccionar la dependencia destino
- [ ] Debo escribir motivo de la transferencia
- [ ] El reporte se desasigna de mi dependencia
- [ ] El supervisor destino recibe notificación
- [ ] El historial registra la transferencia completa
- [ ] Los funcionarios actuales ya no ven el reporte

**Componentes:** `VerReporte.jsx` (modal reasignar)  
**API:** `PUT /api/reportes/:id/reasignar`  
**Auditoría:** IP, user_agent, motivo registrados

---

### ✅ US-S04: Aprobar/Rechazar Cierre
**Como** supervisor  
**Quiero** revisar y aprobar solicitudes de cierre  
**Para** validar que el trabajo se completó correctamente

**Criterios de Aceptación:**
- [ ] Veo lista de cierres pendientes **solo de MI dependencia**
- [ ] **NO veo cierres de otras dependencias**
- [ ] Puedo ver: resumen, evidencias, firma del funcionario
- [ ] Puedo **aprobar**: el reporte pasa a estado "cerrado"
- [ ] Puedo **rechazar**: el reporte vuelve a "en proceso" con nota
- [ ] Debo escribir comentario en caso de rechazo
- [ ] El funcionario recibe notificación del resultado
- [ ] El historial registra aprobación/rechazo con timestamp
- [ ] Si intento aprobar cierre de otra dependencia → 403 Forbidden

**Componentes:** `PanelFuncionario.jsx` (vista: cierres-pendientes)  
**API:** `PUT /api/reportes/:id/aprobar-cierre`, `PUT /api/reportes/:id/rechazar-cierre`

---

### 📜 US-S05: Ver Historial de Cambios
**Como** supervisor  
**Quiero** ver el historial completo de un reporte  
**Para** auditar todas las acciones realizadas

**Criterios de Aceptación:**
- [ ] Veo timeline cronológico de todas las acciones
- [ ] Cada entrada muestra: acción, usuario, fecha/hora
- [ ] Incluye: creación, asignaciones, notas, cambios de estado
- [ ] Puedo ver IP y user_agent de cada acción (auditoría)
- [ ] El historial es **inmutable** (no se puede modificar)
- [ ] Puedo filtrar por tipo de acción

**Componentes:** `VerReporte.jsx` (sección historial)  
**API:** `GET /api/reportes/:id/historial`  
**Tabla:** `historial_cambios`

---

### 🔓 US-S06: Reabrir Reporte Cerrado
**Como** supervisor  
**Quiero** reabrir un reporte cerrado  
**Para** atender situaciones que reaparecen

**Criterios de Aceptación:**
- [ ] **Solo puedo reabrir reportes de MI dependencia**
- [ ] NO puedo reabrir reportes de otras dependencias
- [ ] Debo escribir motivo de reapertura
- [ ] El estado cambia a "en proceso"
- [ ] El historial registra la reapertura
- [ ] Los funcionarios originales son notificados
- [ ] Las estadísticas de cierre se recalculan
- [ ] Si intento reabrir reporte de otra dependencia → 403 Forbidden

**Componentes:** `VerReporte.jsx` (modal reabrir)  
**API:** `PUT /api/reportes/:id/reabrir`

---

## 🛡️ Administrador

### 👥 US-A01: Gestionar Usuarios
**Como** administrador  
**Quiero** crear, editar y eliminar usuarios  
**Para** controlar el acceso al sistema

**Criterios de Aceptación:**
- [ ] Puedo ver lista de todos los usuarios del sistema
- [ ] Puedo crear usuario con: nombre, email, password, rol, dependencia
- [ ] Puedo editar cualquier campo de un usuario existente
- [ ] Puedo cambiar el rol de un usuario
- [ ] Puedo desactivar un usuario (soft delete)
- [ ] Los passwords se hashean con bcrypt
- [ ] No puedo eliminar mi propia cuenta
- [ ] El email debe ser único en el sistema

**Componentes:** `AdminUsuarios.jsx`  
**API:** `GET/POST/PUT/DELETE /api/usuarios`  
**Tab:** Admin Panel → Usuarios

---

### 📂 US-A02: Gestionar Categorías y Tipos
**Como** administrador  
**Quiero** configurar las categorías y tipos de reporte  
**Para** organizar los reportes ciudadanos

**Criterios de Aceptación:**
- [ ] Puedo crear categorías (agrupadores)
- [ ] Puedo crear tipos dentro de cada categoría
- [ ] Cada tipo tiene: nombre, ícono, color, dependencia responsable
- [ ] Puedo reordenar tipos con drag-and-drop
- [ ] Puedo activar/desactivar tipos sin eliminarlos
- [ ] Los tipos desactivados no aparecen en el formulario público
- [ ] Puedo asignar dependencia por defecto a cada tipo

**Componentes:** `AdminCategorias.jsx`  
**API:** `GET/POST/PUT/DELETE /api/categorias`, `/api/tipos`  
**Tab:** Admin Panel → Categorías

---

### 🏢 US-A03: Gestionar Dependencias
**Como** administrador  
**Quiero** configurar las dependencias municipales  
**Para** organizar la estructura organizacional

**Criterios de Aceptación:**
- [ ] Puedo crear dependencias con nombre y descripción
- [ ] Puedo asignar supervisor a cada dependencia
- [ ] Puedo ver funcionarios asignados a cada dependencia
- [ ] Puedo mover funcionarios entre dependencias
- [ ] Puedo desactivar dependencias sin eliminarlas
- [ ] No puedo eliminar dependencia con usuarios activos

**Componentes:** `AdminDependencias.jsx`  
**API:** `GET/POST/PUT/DELETE /api/dependencias`  
**Tab:** Admin Panel → Dependencias

---

### 🎨 US-A04: Configurar WhiteLabel
**Como** administrador  
**Quiero** personalizar la apariencia del sistema  
**Para** adaptarlo a la identidad del municipio

**Criterios de Aceptación:**
- [ ] Puedo configurar: nombre del municipio, logo, colores
- [ ] Puedo establecer el centro del mapa (lat, lng)
- [ ] Puedo configurar el zoom inicial del mapa
- [ ] Puedo subir logo en formato PNG/JPG
- [ ] Los colores se aplican a: header, botones, links
- [ ] Puedo configurar el título de la página
- [ ] Los cambios se aplican inmediatamente (sin reload)

**Componentes:** `EditarWhiteLabelConfig.jsx`  
**API:** `GET/PUT /api/whitelabel/config`  
**Tab:** Admin Panel → WhiteLabel

---

### 🗄️ US-A05: Herramientas de Base de Datos
**Como** administrador  
**Quiero** acceder a herramientas de mantenimiento  
**Para** gestionar la base de datos

**Criterios de Aceptación:**
- [ ] Puedo crear backup de la base de datos
- [ ] Puedo descargar el archivo de backup
- [ ] Puedo ver estadísticas: total reportes, usuarios, tamaño BD
- [ ] Puedo ver logs de errores recientes
- [ ] Puedo limpiar reportes de prueba (solo en desarrollo)
- [ ] Las acciones destructivas requieren confirmación doble

**Componentes:** `AdminDatabaseTools.jsx`  
**API:** `GET /api/admin/stats`, `POST /api/admin/backup`  
**Tab:** Admin Panel → BD

---

### 📊 US-A06: Dashboard de Métricas
**Como** administrador  
**Quiero** ver métricas generales del sistema  
**Para** monitorear el rendimiento

**Criterios de Aceptación:**
- [ ] Veo total de reportes por estado
- [ ] Veo reportes por tipo (gráfico de barras)
- [ ] Veo reportes por dependencia
- [ ] Veo tendencia semanal/mensual
- [ ] Veo tiempo promedio de resolución
- [ ] Puedo filtrar por rango de fechas
- [ ] Puedo exportar reportes a CSV

**Componentes:** `AdminDashboard.jsx`  
**API:** `GET /api/admin/metricas`

---

## 🔧 SuperUser

### ⚡ US-SU01: Acceso de Emergencia
**Como** superuser  
**Quiero** acceder al sistema con token especial  
**Para** resolver problemas críticos

**Criterios de Aceptación:**
- [ ] Accedo con token de emergencia (no email/password)
- [ ] El token se configura via variable de entorno
- [ ] Tengo acceso a todas las funciones de admin
- [ ] Puedo acceder aunque el login normal esté caído
- [ ] Mis acciones se registran con identificador "SUPERUSER"
- [ ] El token debe rotarse periódicamente

**Componentes:** `SuperUserPanel.jsx`  
**Acceso:** `/#super-user?token=SUPER_TOKEN`  
**Seguridad:** Token en `process.env.SUPER_TOKEN`

---

### 🛠️ US-SU02: Ejecutar SQL Directo
**Como** superuser  
**Quiero** ejecutar consultas SQL directamente  
**Para** diagnosticar y reparar datos

**Criterios de Aceptación:**
- [ ] Puedo ejecutar SELECT queries
- [ ] Los queries destructivos requieren confirmación
- [ ] Los resultados se muestran en tabla formateada
- [ ] Los queries se registran en log de auditoría
- [ ] Hay timeout de 30 segundos para evitar queries largos
- [ ] Las transacciones se manejan correctamente

**Componentes:** `SuperUserPanel.jsx` (SQL console)  
**API:** `POST /api/super/query`  
**⚠️ PELIGRO:** Solo en desarrollo o emergencias

---

## 🔌 Integraciones Técnicas

### 🗺️ US-T01: Proxy de Tiles OSM
**Como** sistema  
**Quiero** servir tiles de OpenStreetMap a través de un proxy  
**Para** evitar problemas de CORS y rate limiting

**Criterios de Aceptación:**
- [ ] Los tiles se solicitan a `/tiles/:z/:x/:y.png`
- [ ] El sistema balancea entre múltiples hosts OSM (a, b, c)
- [ ] En caso de fallo, retorna tile transparente de fallback
- [ ] Se respetan los términos de uso de OSM (User-Agent)
- [ ] Los tiles se cachean por 24 horas

**Componentes:** `ImprovedMapView.jsx`  
**API:** `GET /tiles/:z/:x/:y.png`

---

### 📍 US-T02: Reverse Geocoding
**Como** ciudadano  
**Quiero** que el sistema obtenga mi dirección automáticamente  
**Para** no tener que escribirla manualmente

**Criterios de Aceptación:**
- [ ] Al seleccionar ubicación, se obtiene: colonia, CP, municipio, estado
- [ ] Se usa Nominatim (OSM) sin costo
- [ ] Se respeta rate limit (1 req/sec)
- [ ] Se valida que la ubicación pertenezca al municipio configurado
- [ ] Los datos crudos de Nominatim NO se exponen al cliente (privacidad)

**Componentes:** `ReportForm.jsx`  
**API:** `GET /api/geocode/reverse?lat=X&lng=Y`  
**Servicio:** `geocoding-service.js`

---

### 📊 US-T03: GeoJSON y Grid para Heatmaps
**Como** desarrollador frontend  
**Quiero** obtener reportes en formato GeoJSON  
**Para** renderizar mapas de calor eficientemente

**Criterios de Aceptación:**
- [ ] `GET /api/reportes/geojson` retorna FeatureCollection
- [ ] `GET /api/reportes/grid` retorna datos agregados por celda
- [ ] Soporta filtros: tipo, from, to
- [ ] El tamaño de celda es configurable (0.001 a 1 grados)
- [ ] La respuesta incluye peso acumulado por celda

**Componentes:** `MapaCalor.jsx`, `ImprovedMapView.jsx`  
**API:** `GET /api/reportes/geojson`, `GET /api/reportes/grid`

---

### 🔔 US-T04: Webhooks GitHub (Auto-deploy)
**Como** desarrollador DevOps  
**Quiero** que el sistema se actualice automáticamente al hacer push  
**Para** deployment continuo sin intervención manual

**Criterios de Aceptación:**
- [ ] El endpoint `/api/webhook/github` recibe eventos push
- [ ] Valida la firma HMAC del webhook
- [ ] Ejecuta `git pull` y reinicia el servidor
- [ ] Registra la acción en logs
- [ ] Solo responde a branch `main`

**API:** `POST /api/webhook/github`  
**Archivo:** `server/webhook-routes.js`

---

## 🔒 Seguridad y Auditoría

### 🛡️ US-SEC01: Audit Trail Completo
**Como** auditor  
**Quiero** tener trazabilidad completa de acciones  
**Para** cumplir regulaciones gubernamentales

**Criterios de Aceptación:**
- [ ] Toda acción CRUD se registra en `historial_cambios`
- [ ] Cada registro incluye: usuario_id, accion, tabla, registro_id
- [ ] Se captura: IP, user_agent, timestamp UTC
- [ ] Los valores anteriores y nuevos se guardan en JSON
- [ ] El historial es **inmutable** (solo INSERT, nunca UPDATE/DELETE)
- [ ] Los registros se retienen por mínimo 5 años
- [ ] Se puede generar reporte de auditoría por período

**Tabla:** `historial_cambios`  
**Middleware:** `registrarCambio()` en cada route

---

### 🔐 US-SEC02: Autenticación Segura
**Como** usuario  
**Quiero** que mis credenciales estén protegidas  
**Para** evitar accesos no autorizados

**Criterios de Aceptación:**
- [ ] Passwords hasheados con bcrypt (cost 10+)
- [ ] Tokens JWT con expiración de 24 horas
- [ ] Rate limiting en endpoint de login (5 intentos/minuto)
- [ ] Bloqueo temporal después de 5 intentos fallidos
- [ ] Sesiones se invalidan al cambiar password
- [ ] Tokens almacenados solo en localStorage (no cookies)
- [ ] HTTPS obligatorio en producción

**Middleware:** `requiereAuth`, `requiereRol`  
**Tabla:** `sesiones`

---

### 🛑 US-SEC03: Protección SQL Injection
**Como** sistema  
**Quiero** prevenir inyección SQL  
**Para** proteger la base de datos

**Criterios de Aceptación:**
- [ ] Todas las queries usan parámetros (`?` placeholders)
- [ ] Nunca se concatenan strings en queries
- [ ] Los inputs se validan antes de usar
- [ ] Los tipos de datos se verifican (números, emails)
- [ ] Las coordenadas se validan con `validarCoordenadas()`
- [ ] Los arrays se normalizan con `normalizeTipos()`

**Patrón:**
```javascript
// ✅ CORRECTO
db.get('SELECT * FROM usuarios WHERE email = ?', [email]);

// ❌ NUNCA
db.get(`SELECT * FROM usuarios WHERE email = '${email}'`);
```

---

### 📝 US-SEC04: Validación de Entrada
**Como** sistema  
**Quiero** validar todos los inputs  
**Para** prevenir datos malformados

**Criterios de Aceptación:**
- [ ] Emails validados con regex RFC 5322
- [ ] Coordenadas dentro de rangos válidos (-90/90, -180/180)
- [ ] Tipos de reporte validados contra lista permitida
- [ ] Tamaño de imágenes limitado (5MB max)
- [ ] Longitud de texto limitada (descripción: 2000 chars)
- [ ] Caracteres especiales sanitizados en outputs
- [ ] UUIDs validados con regex

---

### 🔏 US-SEC05: Control de Acceso por Rol y Dependencia
**Como** sistema  
**Quiero** restringir acceso según rol Y dependencia  
**Para** cumplir principio de mínimo privilegio

**Criterios de Aceptación:**
- [ ] `funcionario`: solo reportes asignados a él **dentro de su dependencia**
- [ ] `supervisor`: todos los reportes **solo de su dependencia** + aprobar cierres
- [ ] `admin`: **TODO el sistema** - ve reportes de TODAS las dependencias
- [ ] `superuser`: acceso total con token especial
- [ ] Las rutas verifican rol Y dependencia antes de ejecutar
- [ ] Los intentos de acceso a otra dependencia se registran en audit
- [ ] Los endpoints retornan 403 (no 404) si no autorizado
- [ ] El filtro de dependencia se aplica a nivel de query SQL, no solo UI

**Middleware:** `requiereRol(['admin'])`, `requiereRol(['supervisor', 'admin'])`  
**Query Pattern:**
```javascript
// Funcionario/Supervisor: solo su dependencia
WHERE dependencia = ? -- req.usuario.dependencia

// Admin: sin filtro de dependencia (ve todo)
// No aplica WHERE dependencia
```

---

## 📱 Responsive & Accesibilidad

### 📱 US-UX01: Experiencia Móvil
**Como** ciudadano con celular  
**Quiero** usar la app desde mi teléfono  
**Para** reportar problemas en campo

**Criterios de Aceptación:**
- [ ] El mapa ocupa 100% del viewport en móvil
- [ ] Los botones tienen tamaño mínimo de 44x44px
- [ ] El formulario es scrolleable sin perder el mapa
- [ ] La cámara se activa correctamente en iOS y Android
- [ ] Los modales se adaptan al tamaño de pantalla
- [ ] El teclado no oculta campos de texto

**Viewports soportados:**
- Mobile: 375x667 (iPhone SE)
- Mobile Large: 428x926 (iPhone 14 Pro Max)
- Tablet: 768x1024 (iPad)
- Desktop: 1280x800
- Large Desktop: 1920x1080

---

### ♿ US-UX02: Accesibilidad (WCAG 2.1)
**Como** usuario con discapacidad  
**Quiero** poder usar el sistema  
**Para** tener acceso igualitario

**Criterios de Aceptación:**
- [ ] Contraste de colores cumple WCAG AA (4.5:1)
- [ ] Todos los elementos interactivos tienen focus visible
- [ ] Las imágenes tienen alt text descriptivo
- [ ] Los formularios tienen labels asociados
- [ ] La navegación funciona solo con teclado
- [ ] Los lectores de pantalla pueden navegar correctamente
- [ ] Los errores se anuncian a screen readers

---

## 🚀 Checklist de Implementación

### Por Pantalla

| Pantalla | Componente | Stories | Status |
|----------|------------|---------|--------|
| Mapa Público | `ImprovedMapView.jsx` | US-C01 | ✅ |
| Formulario | `ReportForm.jsx` | US-C02 | ✅ |
| Login | `LoginModal.jsx` | US-C04 | ✅ |
| Panel Funcionario | `PanelFuncionario.jsx` | US-F01 | ✅ |
| Ver Reporte | `VerReporte.jsx` | US-F02-F05, US-S05-S06 | ✅ |
| Admin Usuarios | `AdminUsuarios.jsx` | US-A01 | ✅ |
| Admin Categorías | `AdminCategorias.jsx` | US-A02 | ✅ |
| Admin Dependencias | `AdminDependencias.jsx` | US-A03 | ✅ |
| Admin WhiteLabel | `EditarWhiteLabelConfig.jsx` | US-A04 | ✅ |
| Admin BD | `AdminDatabaseTools.jsx` | US-A05 | ⚠️ Parcial |
| Admin Dashboard | `AdminDashboard.jsx` | US-A06 | ✅ |
| SuperUser | `SuperUserPanel.jsx` | US-SU01-02 | ✅ |

### Seguridad (Auditoría)

| Requisito | Story | Status | Prioridad |
|-----------|-------|--------|-----------|
| Audit Trail | US-SEC01 | ✅ Implementado | 🔴 Crítica |
| Auth Segura | US-SEC02 | ⚠️ Parcial (falta rate limit) | 🔴 Crítica |
| SQL Injection | US-SEC03 | ✅ Implementado | 🔴 Crítica |
| Validación Input | US-SEC04 | ⚠️ Parcial | 🟡 Alta |
| Control Acceso | US-SEC05 | ✅ Implementado | 🔴 Crítica |

### Gaps de Seguridad (Para Auditoría)

| Gap | Descripción | Story | Prioridad |
|-----|-------------|-------|-----------|
| Rate Limiting | No hay límite de intentos de login | US-SEC02 | 🔴 Crítica |
| Password Policy | No hay política de complejidad | US-SEC02 | 🟡 Alta |
| Session Timeout | Tokens no expiran en inactividad | US-SEC02 | 🟡 Alta |
| Input Sanitization | Algunos campos no sanitizan XSS | US-SEC04 | 🟡 Alta |
| CSRF Protection | No hay tokens CSRF | - | 🟡 Alta |
| Encryption at Rest | BD no está encriptada | - | 🟠 Media |
| Backup Encryption | Backups sin encriptar | US-A05 | 🟠 Media |
| Log Rotation | Logs no rotan automáticamente | - | 🟢 Baja |

---

## 📊 Matrices de Trazabilidad

### Story → Componente → API

| Story | Componente | API Endpoint |
|-------|------------|--------------|
| US-C01 | ImprovedMapView.jsx | GET /api/reportes |
| US-C02 | ReportForm.jsx | POST /api/reportes |
| US-C04 | LoginModal.jsx | POST /api/usuarios/login |
| US-F01 | PanelFuncionario.jsx | GET /api/reportes/mis-reportes |
| US-F02 | VerReporte.jsx | POST /api/reportes/:id/notas-trabajo |
| US-F04 | VerReporte.jsx | POST /api/reportes/:id/solicitar-cierre |
| US-S01 | PanelFuncionario.jsx | GET /api/reportes/dependencia/:id |
| US-S02 | VerReporte.jsx | POST /api/reportes/:id/asignaciones |
| US-S03 | VerReporte.jsx | PUT /api/reportes/:id/reasignar |
| US-S04 | PanelFuncionario.jsx | PUT /api/reportes/:id/aprobar-cierre |
| US-A01 | AdminUsuarios.jsx | GET/POST/PUT/DELETE /api/usuarios |
| US-A02 | AdminCategorias.jsx | GET/POST/PUT/DELETE /api/categorias |
| US-A03 | AdminDependencias.jsx | GET/POST/PUT/DELETE /api/dependencias |
| US-A04 | EditarWhiteLabelConfig.jsx | GET/PUT /api/whitelabel/config |

### Story → Test

| Story | Test File | Test Name |
|-------|-----------|-----------|
| US-C02 | tests/e2e/crear-reporte.spec.ts | should create report |
| US-C04 | tests/e2e/login.spec.ts | should login with credentials |
| US-F01 | tests/backend/reportes.test.js | GET /mis-reportes |
| US-S04 | tests/backend/cierres.test.js | approve closure |
| US-A01 | tests/backend/usuarios.test.js | CRUD usuarios |

---

## 🔮 Roadmap de Mejoras

### Fase 1: Seguridad Crítica (Sprint actual)
- [ ] Implementar rate limiting en login
- [ ] Agregar política de passwords
- [ ] Implementar session timeout
- [ ] Agregar protección CSRF

### Fase 2: UX/Accesibilidad
- [ ] Mejorar contraste de colores
- [ ] Agregar skip links
- [ ] Implementar notificaciones push
- [ ] Agregar modo offline (PWA)

### Fase 3: Analytics
- [ ] Dashboard de métricas (US-A06)
- [ ] Reportes exportables
- [ ] Alertas automáticas
- [ ] Mapas de calor temporales

### Fase 4: Integraciones
- [ ] Notificaciones SMS
- [ ] Integración con WhatsApp
- [ ] API pública documentada
- [ ] Webhook para sistemas externos
