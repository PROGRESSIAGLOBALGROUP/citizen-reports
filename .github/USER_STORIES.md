# 📋 User Stories — citizen-reports

> **Documento exhaustivo** de todas las funcionalidades del sistema  
> Organizado por rol y pantalla para guiar desarrollo y auditorías

---

## ✅ Definición de "Done" (Global)

Toda User Story se considera **TERMINADA** cuando cumple:

| Criterio | Descripción |
|----------|-------------|
| ✅ Código | Implementado y funcionando en desarrollo |
| ✅ Tests | Unitarios + E2E pasando (cobertura >80%) |
| ✅ API Docs | Endpoint documentado en API_REFERENCE |
| ✅ Seguridad | Validación de inputs, autenticación correcta |
| ✅ Accesibilidad | WCAG 2.1 AA (contraste, keyboard, ARIA) |
| ✅ Mobile | Responsive en viewports 375px-1920px |
| ✅ Audit Trail | Acciones registradas en historial_cambios |
| ✅ Sin Debug | No console.log de desarrollo en código |

---

## 👥 Personas / Arquetipos

### 👩 María — Ciudadana (55 años)
| Atributo | Detalle |
|----------|---------|
| **Dispositivo** | Android económico, 4G intermitente |
| **Objetivo** | Reportar baches cerca de su casa |
| **Frustración** | Apps complicadas, formularios largos |
| **Necesita** | Interfaz simple, confirmación clara, sin login obligatorio |

### 👷 Juan — Funcionario de Obras (35 años)
| Atributo | Detalle |
|----------|---------|
| **Dispositivo** | Tablet municipal en campo |
| **Objetivo** | Cerrar reportes eficientemente, documentar trabajo |
| **Frustración** | No recibir notificaciones, perderse reportes asignados |
| **Necesita** | Lista clara de pendientes, navegación GPS, fotos rápidas |

### 👔 Carmen — Supervisora de Agua Potable (45 años)
| Atributo | Detalle |
|----------|---------|
| **Dispositivo** | Laptop en oficina, móvil para emergencias |
| **Objetivo** | Monitorear equipo, aprobar cierres, cumplir SLAs |
| **Frustración** | No ver métricas de rendimiento, aprobaciones lentas |
| **Necesita** | Dashboard con KPIs, alertas de SLA, historial completo |

### 🛡️ Roberto — Administrador TI (40 años)
| Atributo | Detalle |
|----------|---------|
| **Dispositivo** | Desktop con múltiples monitores |
| **Objetivo** | Mantener sistema estable, gestionar usuarios |
| **Frustración** | Errores sin logs claros, backups manuales |
| **Necesita** | Herramientas de diagnóstico, alertas automáticas |

---

## 📊 Resumen de Implementación

| Rol | Total | ✅ Impl. | ⏳ Pend. | Cobertura |
|-----|-------|----------|----------|-----------|
| Ciudadano | 6 | 6 | 0 | 100% |
| Funcionario | 5 | 5 | 0 | 100% |
| Supervisor | 6 | 6 | 0 | 100% |
| Admin | 6 | 6 | 0 | 100% |
| SuperUser | 2 | 2 | 0 | 100% |
| Técnicas | 9 | 9 | 0 | 100% |
| Seguridad | 5 | 5 | 0 | 100% |
| UX/Accesibilidad | 6 | 6 | 0 | 100% |
| **TOTAL** | **45** | **45** | **0** | **100%** |

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

## 📋 User Stories Quick Reference

> **Documento completo:** [`.github/USER_STORIES.md`](USER_STORIES.md)

### Por Rol

| Rol | Stories | Descripción |
|-----|---------|-------------|
| Ciudadano | US-C01 a US-C06 | Mapa, crear reporte, ver detalle, login, logout, editar |
| Funcionario | US-F01 a US-F05 | Mis reportes, notas, evidencias, solicitar cierre |
| Supervisor | US-S01 a US-S06 | Reportes depto, asignar, aprobar cierres, historial |
| Admin | US-A01 a US-A06 | Usuarios, categorías, dependencias, whitelabel, BD |
| SuperUser | US-SU01-02 | Acceso emergencia, SQL directo |
| Técnicas | US-T01-04 | Tiles proxy, geocoding, GeoJSON, webhooks |
| Seguridad | US-SEC01-05 | Audit trail, auth, SQL injection, validación, roles |

### Gaps de Seguridad Críticos (Auditoría)

| Gap | Estado | Story |
|-----|--------|-------|
| ✅ Rate Limiting en login | Implementado | US-SEC02 |
| ✅ Política de passwords | Implementado | US-SEC02 |
| ✅ Session timeout por inactividad | Implementado (30 min) | US-SEC02 |
| ✅ Protección CSRF | Implementado | - |
| ✅ Sanitización XSS | Implementado | US-SEC04 |
| ✅ Rutas /api/usuarios protegidas | Corregido 2025-12-06 | US-SEC05 |

### Archivos de Seguridad

| Archivo | Contenido |
|---------|-----------|
| `server/security.js` | Rate limiting, cifrado E2E, CSRF, sanitización, session timeout |
| `server/auth_middleware.js` | requiereAuth, requiereRol, verificarSesionActiva |
| `client/src/secureFetch.js` | Helper fetch con auth + CSRF automático |
| `tests/e2e/security-integration.spec.ts` | 13 tests de seguridad E2E |

---

## 🚨 ERRORES CRÍTICOS A EVITAR (Lecciones Aprendidas)

### ❌ Error: Rutas sin middleware de autorización
```javascript
// ❌ MAL - Cualquiera puede acceder
app.post('/api/usuarios', usuariosRoutes.crearUsuario);

// ✅ BIEN - Solo admin autenticado
app.post('/api/usuarios', requiereAuth, requiereRol(['admin']), usuariosRoutes.crearUsuario);
```
**Siempre verificar** que las rutas sensibles tengan `requiereAuth` + `requiereRol()`.

### ❌ Error: Hash change race condition en tests E2E
```javascript
// ❌ MAL - El hash se ejecuta ANTES de que React lea localStorage
await page.goto('http://localhost:4000/#panel');
// React monta → hash handler ve #panel → pero usuario aún es null → limpia hash

// ✅ BIEN - Navegar SIN hash, esperar splash, LUEGO cambiar hash
await page.goto('http://localhost:4000');
await page.waitForTimeout(6000);  // Splash + React mount
await page.evaluate(() => window.location.hash = '#panel');
```

### ❌ Error: page.goto() después de localStorage pierde el contexto
```javascript
// ❌ MAL - goto puede resetear localStorage
await page.evaluate(() => localStorage.setItem('auth_token', token));
await page.goto('http://localhost:4000/#panel');  // localStorage se pierde!

// ✅ BIEN - Usar addInitScript ANTES de navegar
await page.addInitScript(({ token }) => {
  localStorage.setItem('auth_token', token);
}, { token });
await page.goto('http://localhost:4000');  // localStorage ya está configurado
```

### ❌ Error: storageState no resuelve splash screen de la app
El splash screen de 6 segundos es parte del flujo de la app React, NO del login. 
Incluso con storageState, el splash sigue apareciendo. El ahorro real es evitar 
el login UI (~3-4s), no el splash.

### ❌ Error: Ejecutar suite completa para validar cambios pequeños
```powershell
# ❌ MAL - Pierde 20+ minutos en suite completa
npm run test:e2e

# ✅ BIEN - Ejecutar solo los tests afectados
npx playwright test tests/e2e/security-integration.spec.ts --config=config/playwright.config.ts
```

### ❌ Error: No revisar resultados históricos antes de correr tests
Antes de ejecutar la suite completa, revisar el contexto de la conversación 
para ver qué tests ya pasaron/fallaron. Evita re-ejecutar innecesariamente.

---

## ⚡ Optimizaciones de Tests E2E (2025-12-06)

### Mejora de Rendimiento
| Métrica | Original | Optimizado | Mejora |
|---------|----------|------------|--------|
| Suite completa | 37.6 min | 17.8 min | **53%** |
| cierres-pendientes | 7.6 min | 2.9 min | **62%** |
| panel-funcionario-responsive | 5.5 min | 4.6 min | **16%** |

### Helper Optimizado: loginViaAPIAndSetToken
```typescript
// tests/e2e/fixtures/login-helper.ts
export async function loginViaAPIAndSetToken(page: Page, user: User): Promise<string> {
  // 1. Obtener token via API (sin UI)
  const response = await page.request.post(`${API_URL}/api/auth/login`, {
    data: { email: user.email, password: user.password }
  });
  const { token } = await response.json();
  
  // 2. Inyectar localStorage ANTES de cargar la app
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('usuario', JSON.stringify(user));
  }, { token, user });
  
  // 3. Navegar SIN hash (evita race condition)
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  
  // 4. Esperar splash screen (inevitable, ~6s)
  await page.waitForTimeout(6000);
  
  // 5. Ahora cambiar hash (usuario ya está en estado React)
  await page.evaluate(() => window.location.hash = '#panel');
  await page.waitForTimeout(500);
  
  return token;
}
```

### Usuarios de Test Predefinidos
```typescript
// tests/e2e/fixtures/login-helper.ts
export const USERS = {
  admin: { email: 'admin@jantetelco.gob.mx', password: 'admin123', rol: 'admin', ... },
  supervisorObras: { email: 'supervisor.obras@jantetelco.gob.mx', ... },
  funcionarioObras: { email: 'func.obras1@jantetelco.gob.mx', ... }
};
```

---

## 👤 Ciudadano (Usuario Público)

### 🗺️ US-C01: Ver Mapa de Calor de Reportes
**Como** ciudadano  
**Quiero** ver un mapa de calor con los reportes de mi municipio  
**Para** conocer las zonas con más incidencias

**Prioridad:** 🔴 Crítica | **Estimación:** 5 pts | **Estado:** ✅ Implementado

**Criterios de Aceptación:**
- [x] El mapa carga centrado en las coordenadas del municipio configurado
- [x] Los reportes se muestran como puntos de calor (heatmap)
- [x] Puedo hacer zoom in/out para ver más detalle
- [x] Los colores indican densidad: verde (pocos) → rojo (muchos)
- [x] El mapa es responsive (funciona en móvil y desktop)
- [x] Los tiles cargan correctamente sin errores 404

**Escenarios de Prueba:**
```gherkin
DADO que abro la aplicación en mi navegador
CUANDO la página carga completamente
ENTONCES veo un mapa centrado en Jantetelco (18.7, -98.77)
  Y los reportes aparecen como manchas de calor
  Y puedo hacer zoom con gestos o scroll
```

**Edge Cases:**
| Caso | Comportamiento |
|------|----------------|
| Sin reportes | Mapa vacío, sin heatmap |
| Tiles lentos | Skeleton loader mientras carga |
| Sin internet | Mensaje "Sin conexión" |

**Métricas de Éxito:**
- ⏱️ Tiempo de carga < 3s en 4G
- 📊 FCP < 1.5s, LCP < 2.5s

**Componentes:** `ImprovedMapView.jsx`, `MapaCalor.jsx`  
**API:** `GET /api/reportes` (público)

---

### 📍 US-C02: Crear Nuevo Reporte
**Como** ciudadano  
**Quiero** reportar un problema en mi colonia  
**Para** que las autoridades lo atiendan

**Prioridad:** 🔴 Crítica | **Estimación:** 13 pts | **Estado:** ✅ Implementado

**Dependencias:**
- ⬅️ Requiere: US-T02 (Geocoding)
- ➡️ Habilita: US-F01 (Ver reportes), US-T05 (Push notifications)

**Criterios de Aceptación:**
- [x] Puedo seleccionar ubicación tocando/clickeando el mapa
- [x] El sistema obtiene automáticamente: colonia, CP, municipio, estado
- [x] Valida que la ubicación pertenezca al municipio configurado
- [x] Puedo seleccionar el tipo de reporte de una lista
- [x] Puedo escribir una descripción del problema
- [x] Puedo adjuntar hasta 5 fotos como evidencia
- [x] Las fotos se comprimen automáticamente (max 800px)
- [x] El botón de enviar se deshabilita mientras procesa
- [x] Recibo confirmación visual al crear el reporte
- [x] El reporte aparece en el mapa inmediatamente

**Escenarios de Prueba:**
```gherkin
Escenario: Creación exitosa
DADO que soy ciudadano en la pantalla del mapa
CUANDO selecciono ubicación en Jantetelco (18.71, -98.77)
  Y selecciono tipo="Bache"
  Y escribo descripción="Hoyo grande en la esquina"
  Y adjunto 1 foto
  Y presiono "Enviar Reporte"
ENTONCES veo mensaje "✅ Reporte creado exitosamente"
  Y el reporte aparece en el mapa
  Y se genera ID único

Escenario: Ubicación fuera del municipio
DADO que selecciono ubicación en CDMX (19.43, -99.13)
CUANDO intento enviar el reporte
ENTONCES veo error "La ubicación debe estar dentro del municipio"
  Y NO se crea el reporte
```

**Edge Cases:**
| Caso | Comportamiento |
|------|----------------|
| Foto >5MB | Comprimir automáticamente a <1MB |
| GPS deshabilitado | Permitir selección manual en mapa |
| Sin descripción | Bloquear envío, resaltar campo |
| Geocoding falla | Permitir envío sin colonia, capturar lat/lng |
| Doble clic enviar | Deshabilitar botón, prevenir duplicados |

**Métricas de Éxito:**
- 📊 Tasa de conversión: >60% de formularios iniciados se completan
- 🔴 Tasa de error: <2% de envíos fallidos
- ⏱️ Tiempo promedio para completar: <90 segundos

**Componentes:** `ReportForm.jsx`, `MapSelector.jsx`  
**API:** `POST /api/reportes`  
**Servicio:** `geocoding-service.js` (reverseGeocode)

---

### 🔍 US-C03: Ver Detalle de Reporte (Público)
**Como** ciudadano  
**Quiero** ver el estado de un reporte existente  
**Para** saber si ya fue atendido

**Prioridad:** 🟡 Alta | **Estimación:** 5 pts | **Estado:** ✅ Implementado

**Criterios de Aceptación:**
- [x] Puedo ver: tipo, descripción, estado, fecha de creación
- [x] Puedo ver la ubicación en un mini-mapa
- [x] Puedo ver las fotos de evidencia originales
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
- [x] Puedo crear backup de la base de datos
- [x] Puedo descargar el archivo de backup
- [x] Puedo ver estadísticas: total reportes, usuarios, tamaño BD
- [x] Puedo ver logs de errores recientes
- [x] Puedo limpiar reportes de prueba (solo en desarrollo)
- [x] Las acciones destructivas requieren confirmación doble

**Componentes:** `AdminDatabaseTools.jsx`  
**API:** `GET /api/admin/database/stats`, `GET /api/admin/database/logs`, `GET /api/admin/database/backup`
**Tests:** `tests/backend/admin-database.test.js`
**Implementado:** 2025-12-08  
**Tab:** Admin Panel → BD

---

### 📊 US-A06: Dashboard de Métricas
**Como** administrador  
**Quiero** ver métricas generales del sistema  
**Para** monitorear el rendimiento

**Criterios de Aceptación:**
- [x] Veo total de reportes por estado (cards + donut chart)
- [ ] Veo reportes por tipo (gráfico de barras)
- [x] Veo reportes por dependencia (cards con totales)
- [ ] Veo tendencia semanal/mensual
- [ ] Veo tiempo promedio de resolución
- [ ] Puedo filtrar por rango de fechas
- [x] Puedo exportar reportes a CSV (Premium: 14 columnas, BOM UTF-8)

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
- [x] Puedo ejecutar SELECT queries
- [x] Los queries destructivos requieren confirmación
- [x] Los resultados se muestran en tabla formateada (JSON con columns, rows, duration)
- [x] Los queries se registran en log de auditoría (historial_cambios)
- [x] Hay timeout de 30 segundos para evitar queries largos
- [x] Las transacciones se manejan correctamente

**Componentes:** `SuperUserPanel.jsx` (SQL console)  
**API:** 
- `POST /api/super/query` - Ejecutar SQL
- `GET /api/super/tables` - Listar tablas de BD
- `GET /api/super/schema/:table` - Obtener schema de tabla
**Header requerido:** `X-Super-Token` o `X-Super-User-Token`
**Configuración:** `SUPER_USER_TOKEN` o `SUPER_TOKEN` en .env
**Tests:** `tests/backend/super-routes.test.js` (21 tests)
**Implementado:** 2025-12-08  
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

### 📲 US-T05: Notificaciones Push en Tiempo Real ✅
**Como** supervisor/funcionario  
**Quiero** recibir notificaciones cuando hay nuevos reportes o asignaciones  
**Para** responder rápidamente a los ciudadanos

**Criterios de Aceptación:**
- [x] Al crear un reporte, supervisores de la dependencia reciben notificación
- [x] Al asignar funcionario, este recibe notificación de la asignación
- [x] Las notificaciones incluyen: título, descripción corta, link al reporte
- [x] El envío es asíncrono (no bloquea la respuesta al ciudadano)
- [x] Los errores de push no afectan la creación/asignación del reporte
- [x] Solo se envían si VAPID keys están configuradas

**Componentes:** `push-notifications.js`  
**Funciones:**
- `notificarNuevoReporteADependencia(dependencia, reporteId, tipo, descripcion)`
- `notificarAsignacionReporte(funcionarioId, reporteId, tipo, supervisorNombre)`

**Integración:**
- `POST /api/reportes` → llama `notificarNuevoReporteADependencia`
- `POST /api/reportes/:id/asignaciones` → llama `notificarAsignacionReporte`

**Implementado:** 2025-12-06

---

### 📱 US-T06: Notificaciones SMS con Twilio ✅
**Como** supervisor/funcionario  
**Quiero** recibir SMS cuando hay eventos importantes  
**Para** estar informado aunque no tenga acceso a la app

**Criterios de Aceptación:**
- [x] Servicio SMS con Twilio (lazy-load del cliente)
- [x] Normalización de teléfonos mexicanos a formato E.164
- [x] Notificación SMS al crear nuevo reporte (a supervisores)
- [x] Notificación SMS al asignar funcionario
- [x] Notificación SMS al aprobar/rechazar cierre
- [x] Campo `telefono` en tabla usuarios
- [x] Campo `sms_habilitado` para opt-in/opt-out
- [x] Audit trail de SMS enviados/fallidos
- [x] El envío es asíncrono (no bloquea respuesta HTTP)
- [x] Fail-safe: errores de SMS no afectan operaciones

**Componentes:** `sms-service.js`  
**Funciones:**
- `enviarSms(telefono, mensaje)` - Envío individual
- `enviarSmsMasivo(telefonos, mensaje)` - Envío a múltiples
- `notificarNuevoReporteSms(dependencia, reporteId, tipo, colonia)`
- `notificarAsignacionSms(funcionarioId, reporteId, tipo)`
- `notificarResultadoCierreSms(funcionarioId, reporteId, aprobado)`
- `notificarCierrePendienteSms(dependencia, reporteId, funcionarioNombre)`

**Configuración (.env):**
```
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+521234567890
SMS_ENABLED=true
```

**Migración:** `006_usuarios_telefono.sql`  
**Implementado:** 2025-12-06

---

### 🚨 US-T07: Sistema de Alertas Automáticas ✅
**Como** supervisor/admin  
**Quiero** recibir alertas automáticas cuando hay problemas en el sistema  
**Para** poder reaccionar rápidamente a situaciones críticas

**Criterios de Aceptación:**
- [x] Detecta umbral de reportes pendientes por dependencia (>10)
- [x] Detecta violaciones de SLA de asignación (>24h sin asignar)
- [x] Detecta violaciones de SLA de cierre (>72h sin cerrar)
- [x] Detecta anomalías (picos 2x sobre el promedio)
- [x] Notifica vía push y/o SMS a supervisores
- [x] Registra alertas en base de datos para dashboard
- [x] Severidades: info, warning, critical
- [x] Verificación periódica configurable (default: 30 min)
- [x] API para consultar, resolver y verificar manualmente

**Componentes:** `alertas-automaticas.js`, `alertas-routes.js`  
**Funciones:**
- `detectarUmbralPendientes()` - Umbral de pendientes excedido
- `detectarViolacionesSLAAsignacion()` - Reportes sin asignar >24h
- `detectarViolacionesSLACierre()` - Reportes sin cerrar >72h
- `detectarAnomalias()` - Picos inusuales de reportes
- `ejecutarVerificaciones()` - Ejecuta todas las detecciones
- `iniciarVerificacionPeriodica()` - Inicia timer automático

**API Endpoints:**
- `GET /api/alertas` - Lista alertas activas
- `GET /api/alertas/stats` - Estadísticas de alertas
- `GET /api/alertas/config` - Configuración actual
- `PUT /api/alertas/:id/resolver` - Marca alerta como resuelta
- `POST /api/alertas/verificar` - Ejecuta verificación manual

**Configuración (.env):**
```
ALERTS_ENABLED=true
ALERT_THRESHOLD_PENDING=10
SLA_HOURS_ASSIGN=24
SLA_HOURS_CLOSE=72
ALERT_ANOMALY_FACTOR=2.0
ALERT_CHECK_INTERVAL=30
```

**Tests:** 12 tests en `tests/backend/alertas-automaticas.test.js`  
**Implementado:** 2025-12-08

---

### 🗓️ US-T08: Mapas de Calor Temporales ✅
**Como** administrador/supervisor  
**Quiero** ver patrones temporales de reportes  
**Para** optimizar asignación de personal y recursos

**Criterios de Aceptación:**
- [x] Endpoint para agregar reportes por hora del día (0-23)
- [x] Endpoint para agregar reportes por día de la semana (0-6)
- [x] Endpoint para agregar reportes por fecha (YYYY-MM-DD)
- [x] Endpoint para agregar reportes por mes (YYYY-MM)
- [x] Matriz hora x día para visualización 2D
- [x] Filtros por tipo, dependencia y rango de fechas
- [x] Respuesta incluye metadata con filtros aplicados
- [x] Validación de tipos de agrupación
- [x] Retorna peso_total para análisis de severidad

**Componentes:** `server/app.js` (endpoint heatmap-temporal)  
**API Endpoint:** `GET /api/reportes/heatmap-temporal`

**Query Parameters:**
- `agrupacion`: `hora` | `dia_semana` | `fecha` | `mes` | `hora_dia` (default: hora)
- `from`: Fecha inicio (YYYY-MM-DD)
- `to`: Fecha fin (YYYY-MM-DD)  
- `tipo`: Filtrar por tipo(s) de reporte
- `dependencia`: Filtrar por dependencia

**Ejemplo de uso:**
```bash
# Horas pico últimos 30 días
GET /api/reportes/heatmap-temporal?agrupacion=hora&from=2025-11-08

# Días con más actividad
GET /api/reportes/heatmap-temporal?agrupacion=dia_semana

# Tendencia mensual
GET /api/reportes/heatmap-temporal?agrupacion=mes

# Heatmap 2D (hora x día)
GET /api/reportes/heatmap-temporal?agrupacion=hora_dia
```

**Respuesta:**
```json
{
  "metadata": {
    "agrupacion": "hora",
    "filtros": { "from": "2025-12-01", "to": null, "tipos": null, "dependencia": null },
    "total_registros": 24
  },
  "data": [
    { "periodo": 8, "cantidad": 45, "peso_total": 45 },
    { "periodo": 9, "cantidad": 62, "peso_total": 62 }
  ]
}
```

**Tests:** 14 tests en `tests/backend/heatmap-temporal.test.js`  
**Implementado:** 2025-12-08

---

### 💬 US-T09: Integración WhatsApp con Evolution-API ✅
**Como** supervisor/funcionario  
**Quiero** recibir notificaciones por WhatsApp  
**Para** estar informado en tiempo real sin depender de la app

**Criterios de Aceptación:**
- [x] Servicio WhatsApp con Evolution-API (self-hosted)
- [x] Normalización de teléfonos mexicanos a formato WhatsApp
- [x] Notificación WhatsApp al crear nuevo reporte (a supervisores)
- [x] Notificación WhatsApp al asignar funcionario
- [x] Notificación WhatsApp al aprobar/rechazar cierre
- [x] Envío de ubicación del reporte en mapa
- [x] Mensajes con botones interactivos
- [x] Integración con n8n para workflows automáticos
- [x] API endpoints para estado y QR de conexión
- [x] El envío es asíncrono (no bloquea respuesta HTTP)
- [x] Fail-safe: errores de WhatsApp no afectan operaciones

**Componentes:** `whatsapp-service.js`, `whatsapp-routes.js`  
**Funciones:**
- `enviarMensajeWhatsApp(telefono, mensaje)` - Envío de texto
- `enviarMensajeConBotones(telefono, titulo, desc, botones)` - Botones interactivos
- `enviarImagenWhatsApp(telefono, imageUrl, caption)` - Imágenes
- `enviarUbicacionWhatsApp(telefono, lat, lng, nombre, direccion)` - Ubicación
- `notificarNuevoReporteWhatsApp(dependencia, reporteId, tipo, colonia, ubicacion)`
- `notificarAsignacionWhatsApp(funcionarioId, reporteId, tipo, colonia, supervisor)`
- `notificarResultadoCierreWhatsApp(funcionarioId, reporteId, aprobado, comentario)`
- `notificarCiudadanoWhatsApp(telefono, reporteId, nuevoEstado, mensaje)`
- `dispararWebhookN8n(evento, datos)` - Integración n8n
- `verificarEstadoWhatsApp()` - Estado de conexión
- `obtenerQRCodeWhatsApp()` - QR para conectar

**API Endpoints:**
- `GET /api/whatsapp/status` - Estado de la instancia
- `GET /api/whatsapp/qr` - Obtener QR para conectar
- `POST /api/whatsapp/webhook` - Recibir mensajes entrantes
- `POST /api/whatsapp/test` - Enviar mensaje de prueba

**Configuración (.env):**
```
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=your-api-key
EVOLUTION_INSTANCE=citizen-reports
N8N_WEBHOOK_URL=http://localhost:5678/webhook/whatsapp
WHATSAPP_ENABLED=true
```

**Tests:** 15 tests en `tests/backend/whatsapp-service.test.js`  
**Implementado:** 2025-12-08

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
- [x] El mapa ocupa 100% del viewport en móvil
- [x] Los botones tienen tamaño mínimo de 44x44px
- [x] El formulario es scrolleable sin perder el mapa
- [x] La cámara se activa correctamente en iOS y Android
- [x] Los modales se adaptan al tamaño de pantalla
- [x] El teclado no oculta campos de texto

**Componentes:** `mobile-ux.css` ✅  
**Implementado:** 2025-12-06

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
- [x] Contraste de colores cumple WCAG AA (4.5:1)
- [x] Todos los elementos interactivos tienen focus visible
- [x] Las imágenes tienen alt text descriptivo
- [x] Los formularios tienen labels asociados
- [x] La navegación funciona solo con teclado
- [x] Los lectores de pantalla pueden navegar correctamente
- [x] Los errores se anuncian a screen readers

---

### 🔔 US-UX03: Sistema de Notificaciones Toast
**Como** usuario del sistema  
**Quiero** ver notificaciones elegantes en lugar de alertas del navegador  
**Para** una experiencia más profesional y menos intrusiva

**Criterios de Aceptación:**
- [x] Los toasts aparecen en esquina superior derecha
- [x] Soporta tipos: success (verde), error (rojo), warning (amarillo), info (azul)
- [x] Auto-dismiss después de 5 segundos
- [x] Animación de entrada/salida suave
- [x] Múltiples toasts se apilan verticalmente
- [x] Botón de cerrar manual (X)
- [x] Reemplaza todos los `alert()` del sistema
- [x] Accesible: role="alert" aria-live="polite"

**Componentes:** `ToastProvider.jsx`, `useToast` hook ✅  
**Ubicación:** Overlay global, z-index 9999

---

### ⏳ US-UX04: Skeleton Loaders
**Como** usuario  
**Quiero** ver indicadores de carga mientras los datos se obtienen  
**Para** saber que el sistema está trabajando

**Criterios de Aceptación:**
- [ ] Skeleton shimmer en tarjetas de reportes mientras cargan
- [ ] Skeleton en tabla de usuarios mientras carga
- [x] Skeleton en dashboard mientras obtiene métricas
- [x] Animación de shimmer de izquierda a derecha
- [x] Los skeletons tienen la misma forma que el contenido real
- [x] Transición suave de skeleton a contenido real

**Componentes:** `SkeletonLoaders.jsx` ✅  
**CSS:** Animación `@keyframes shimmer` con gradiente

---

### 🌙 US-UX05: Dark Mode
**Como** usuario  
**Quiero** poder cambiar entre modo claro y oscuro  
**Para** reducir fatiga visual y preferencia personal

**Criterios de Aceptación:**
- [x] Toggle en header para cambiar modo
- [x] Preferencia se guarda en localStorage
- [x] Respeta `prefers-color-scheme` del sistema operativo
- [x] Transición suave de colores (0.3s)
- [x] Todos los componentes soportan dark mode
- [x] El mapa usa filtro invertido en dark mode
- [x] Iconos y toggle animado con sol/luna

**Componentes:** `ThemeProvider.jsx`, `useTheme` hook ✅  
**CSS:** `theme.css` con variables `--theme-*`

---

### 🔍 US-UX06: Búsqueda Global
**Como** funcionario/admin  
**Quiero** buscar rápidamente reportes, usuarios o configuraciones  
**Para** navegar eficientemente sin usar menús

**Criterios de Aceptación:**
- [x] Atajo de teclado Ctrl+K (Cmd+K en Mac) abre modal
- [x] Búsqueda fuzzy en tiempo real
- [x] Resultados agrupados: Reportes, Usuarios, Acciones
- [x] Navegación con flechas arriba/abajo
- [x] Enter ejecuta la acción seleccionada
- [x] Escape cierra el modal
- [x] Historial de búsquedas recientes

**Componentes:** `CommandPalette.jsx`, `useAppCommands.js`  
**Inspiración:** VS Code, Slack, Linear

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
| Admin BD | `AdminDatabaseTools.jsx` | US-A05 | ✅ |
| Admin Dashboard | `AdminDashboard.jsx` | US-A06 | ✅ |
| SuperUser | `SuperUserPanel.jsx` | US-SU01-02 | ✅ |

### Seguridad (Auditoría)

| Requisito | Story | Status | Prioridad |
|-----------|-------|--------|-----------|
| Audit Trail | US-SEC01 | ✅ Implementado | 🔴 Crítica |
| Auth Segura | US-SEC02 | ✅ Implementado (rate limit + session timeout) | 🔴 Crítica |
| SQL Injection | US-SEC03 | ✅ Implementado | 🔴 Crítica |
| Validación Input | US-SEC04 | ✅ Implementado (sanitización XSS) | 🟡 Alta |
| Control Acceso | US-SEC05 | ✅ Implementado (rutas protegidas) | 🔴 Crítica |

### Gaps de Seguridad (Para Auditoría) - Actualizado 2025-12-06

| Gap | Descripción | Story | Estado |
|-----|-------------|-------|--------|
| ✅ Rate Limiting | 5 intentos/min, bloqueo 15 min | US-SEC02 | Implementado |
| ✅ Password Policy | Min 8 chars, mayúscula+minúscula+número | US-SEC02 | Implementado |
| ✅ Session Timeout | 30 min inactividad | US-SEC02 | Implementado |
| ✅ Input Sanitization | XSS sanitizado con escape HTML | US-SEC04 | Implementado |
| ✅ CSRF Protection | Token por sesión + header X-CSRF-Token | - | Implementado |
| ✅ Rutas /api/usuarios | requiereAuth + requiereRol(['admin']) | US-SEC05 | Corregido |
| ✅ Encryption at Rest | PII cifrado con AES-256-GCM | - | Implementado 2025-12-06 |
| ✅ Backup Encryption | `?encrypted=true` en endpoint backup | US-A05 | Implementado |
| ✅ Log Rotation | Winston + daily-rotate-file (14 días) | - | Implementado 2025-12-06 |

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

### Fase 1: Seguridad Crítica ✅ COMPLETADA (2025-12-06)
- [x] Implementar rate limiting en login (5 intentos/min, bloqueo 15 min)
- [x] Agregar política de passwords (8+ chars, mayúscula+minúscula+número)
- [x] Implementar session timeout (30 min inactividad)
- [x] Agregar protección CSRF (token por sesión + header X-CSRF-Token)
- [x] Cifrado de datos sensibles (AES-256-GCM para PII)
- [x] Rotación de logs (Winston + daily-rotate, 14 días retención)

### Fase 2: UX/Accesibilidad ✅ COMPLETADA (2025-12-06)
- [x] Mejorar contraste de colores (WCAG AA 4.5:1)
- [x] Agregar skip links (navegación por teclado)
- [x] Implementar notificaciones push (Service Worker + VAPID)
- [x] Agregar modo offline (PWA) ✅ Implementado 2025-12-06
- [x] ARIA labels y roles semánticos
- [x] Focus trap en modales

### Fase 2.5: UX Premium 🚀 COMPLETADA (2025-12-06)
- [x] Sistema de Toasts (reemplazar alert()) — US-UX03 ✅
- [x] Skeleton Loaders (shimmer mientras carga) — US-UX04 ✅
- [x] Dark Mode (toggle persistente) — US-UX05 ✅
- [x] Búsqueda global (Ctrl+K) — US-UX06 ✅
- [x] Experiencia móvil (touch targets 44px, responsive) — US-UX01 ✅

### Fase 3: Analytics ✅ COMPLETADA (2025-12-08)
- [x] Dashboard de métricas base (US-A06)
- [x] Donut chart por estado
- [x] Exportar CSV Premium (14 columnas, BOM UTF-8)
- [x] Gráfico de barras por tipo (top 10)
- [x] Tendencia semanal/mensual (barras + línea SVG)
- [x] Tiempo promedio de resolución (min/avg/max)
- [x] Filtros por rango de fechas (7d, 30d, personalizado)
- [x] Alertas automáticas ✅ Implementado 2025-12-08
- [x] Mapas de calor temporales ✅ Implementado 2025-12-08 (US-T08)

### Fase 4: Integraciones ✅ COMPLETADA (2025-12-08)
- [x] Notificaciones SMS (US-T06) ✅ Implementado 2025-12-06
- [x] Integración con WhatsApp (US-T09) ✅ Implementado 2025-12-08
- [x] API pública documentada (v2.1.0)
- [x] Webhook GitHub (auto-deploy)
- [x] Notificaciones push en tiempo real (US-T05) ✅ Implementado 2025-12-06
