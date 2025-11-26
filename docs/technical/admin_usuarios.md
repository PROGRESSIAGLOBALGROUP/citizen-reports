# Sistema de Gestión de Usuarios

## Descripción General

Sistema completo de administración de usuarios (funcionarios) que permite gestionar el acceso al sistema de reportes ciudadanos. Cada usuario pertenece a una dependencia municipal específica y tiene un rol que determina sus permisos.

## Arquitectura

### Backend (`server/usuarios-routes.js`)

**Stack Tecnológico:**
- Node.js + Express (REST API)
- SQLite3 (Base de datos)
- bcrypt (Hash de contraseñas - Salt rounds: 10)
- Validaciones robustas a nivel de negocio

**Endpoints REST:**

```
GET    /api/usuarios           # Lista todos los usuarios (sin passwords)
GET    /api/usuarios/:id       # Obtiene un usuario específico
POST   /api/usuarios           # Crea un nuevo usuario
PUT    /api/usuarios/:id       # Actualiza usuario existente
DELETE /api/usuarios/:id       # Desactiva usuario (soft delete)
GET    /api/dependencias       # Lista dependencias disponibles
GET    /api/roles              # Lista roles disponibles
```

**Validaciones Backend:**

1. **Email:**
   - Formato válido (regex)
   - Único en el sistema
   - Preferentemente @jantetelco.gob.mx

2. **Nombre:**
   - Mínimo 3 caracteres
   - Trimmed (espacios eliminados)

3. **Password:**
   - Mínimo 8 caracteres
   - Al menos 1 letra
   - Al menos 1 número
   - Hash bcrypt con 10 salt rounds

4. **Dependencia:**
   - Debe estar en lista blanca de dependencias válidas

5. **Rol:**
   - Debe ser: admin, supervisor, o funcionario

**Seguridad:**

- Passwords NUNCA se devuelven en ningún endpoint
- Hash bcrypt con salt rounds = 10 (estándar industria)
- Soft delete: usuarios se marcan como inactivos, no se eliminan físicamente
- Usuario ID 1 (admin principal) protegido contra eliminación
- Validaciones tanto en frontend como backend (defensa en profundidad)

### Frontend (`client/src/AdminUsuarios.jsx`)

**Stack Tecnológico:**
- React 18 (Hooks: useState, useEffect)
- Vanilla CSS-in-JS (sin dependencias externas)
- Fetch API (comunicación con backend)
- Arquitectura de componente funcional puro

**Funcionalidades:**

1. **Listado de Usuarios:**
   - Tabla responsive con información completa
   - Estados visuales (Activo/Inactivo)
   - Badges de colores por rol y dependencia
   - Total de usuarios filtrados

2. **Filtros:**
   - Por estado (Todos/Activos/Inactivos)
   - Por dependencia
   - Contador en tiempo real

3. **Crear Usuario:**
   - Modal con formulario completo
   - Validación en tiempo real
   - Mensajes de ayuda contextual
   - Auto-generación de sugerencias

4. **Editar Usuario:**
   - Pre-carga de datos existentes
   - Password opcional (solo si se quiere cambiar)
   - Actualización selectiva de campos
   - Validaciones dinámicas

5. **Desactivar Usuario:**
   - Confirmación antes de ejecutar
   - Soft delete (marca como inactivo)
   - Protección del admin principal
   - Retroalimentación visual

**UX/UI Best Practices:**

- **Feedback inmediato:** Mensajes de éxito/error claros
- **Loading states:** Indicadores durante operaciones asíncronas
- **Confirmaciones:** Dialogs antes de acciones destructivas
- **Accessibility:** Labels correctos, contraste de colores WCAG AA
- **Responsive:** Diseño adaptable a diferentes pantallas
- **Iconos intuitivos:** Emojis universales (👥, ✏️, 🗑️, ✓, ✕)

## Roles y Permisos

### 1. **Admin** (`admin`)
- **Color:** Amarillo (`#fef3c7` / `#92400e`)
- **Icono:** 👤 con corona
- **Permisos:**
  - Gestión completa de usuarios (CRUD)
  - Acceso a todas las dependencias
  - Configuración del sistema
  - Aprobación de cierres de cualquier dependencia

### 2. **Supervisor** (`supervisor`)
- **Color:** Índigo (`#e0e7ff` / `#3730a3`)
- **Icono:** 📋
- **Permisos:**
  - Ver reportes de su dependencia
  - Asignar reportes a funcionarios
  - Aprobar cierres de reportes
  - Ver métricas y estadísticas

### 3. **Funcionario** (`funcionario`)
- **Color:** Gris (`#f3f4f6` / `#1f2937`)
- **Icono:** 🔧
- **Permisos:**
  - Ver reportes asignados
  - Atender y cerrar reportes
  - Subir evidencia fotográfica
  - Actualizar estado de reportes

## Dependencias Municipales

```javascript
const DEPENDENCIAS = [
  'administracion',        // Administración General
  'obras_publicas',        // Obras Públicas
  'servicios_publicos',    // Servicios Públicos
  'agua_potable',          // Agua Potable
  'seguridad_publica',     // Seguridad Pública
  'parques_jardines'       // Parques y Jardines
];
```

**Asignación automática de reportes por tipo:**

| Tipo de Reporte | Dependencia Asignada |
|----------------|----------------------|
| baches         | obras_publicas       |
| alumbrado      | servicios_publicos   |
| agua           | agua_potable         |
| limpieza       | servicios_publicos   |
| seguridad      | seguridad_publica    |
| parques        | parques_jardines     |

## Schema de Base de Datos

```sql
CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  password_hash TEXT,              -- bcrypt hash
  dependencia TEXT NOT NULL,       -- snake_case
  rol TEXT NOT NULL DEFAULT 'funcionario',
  firma_digital TEXT,              -- Para cierres de reportes
  activo INTEGER NOT NULL DEFAULT 1,
  google_id TEXT UNIQUE,           -- OAuth (futuro)
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Índices para optimización
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_dependencia ON usuarios(dependencia);
```

## Flujo de Trabajo

### Creación de Usuario (Happy Path)

```
1. Admin hace clic en "➕ Nuevo Usuario"
2. Se abre modal con formulario
3. Admin llena:
   - Nombre: "Juan Pérez García"
   - Email: "juan.perez@jantetelco.gob.mx"
   - Password: "Admin2025!"
   - Dependencia: "Obras Públicas"
   - Rol: "Funcionario"
4. Al hacer submit:
   a. Frontend valida campos
   b. Envía POST /api/usuarios
   c. Backend valida de nuevo
   d. Backend hace hash bcrypt del password
   e. Backend inserta en DB
   f. Backend devuelve { ok: true, id: X }
5. Frontend muestra mensaje de éxito
6. Frontend recarga lista de usuarios
7. Modal se cierra automáticamente después de 1.5s
```

### Actualización de Usuario

```
1. Admin hace clic en "✏️ Editar" en la fila del usuario
2. Modal se abre pre-cargado con datos actuales
3. Campo password aparece VACÍO (seguridad)
4. Admin puede:
   - Cambiar nombre, email, dependencia, rol
   - Dejar password vacío (no cambia)
   - O escribir nuevo password (se actualiza)
   - Marcar/desmarcar checkbox "Usuario Activo"
5. Al hacer submit:
   a. Frontend construye objeto solo con campos modificados
   b. Envía PUT /api/usuarios/:id
   c. Backend valida campos enviados
   d. Si password presente: hace nuevo hash
   e. Backend actualiza solo campos recibidos
   f. Backend devuelve { ok: true, cambios: N }
6. Frontend recarga lista
7. Modal se cierra
```

### Desactivación de Usuario

```
1. Admin hace clic en "🗑️ Desactivar"
2. Aparece confirm dialog nativo
3. Si confirma:
   a. Frontend envía DELETE /api/usuarios/:id
   b. Backend verifica que no sea ID=1 (admin principal)
   c. Backend ejecuta: UPDATE usuarios SET activo=0 WHERE id=?
   d. Backend devuelve { ok: true }
4. Frontend recarga lista
5. Usuario aparece con badge "✕ Inactivo" rojo
6. Botón "Desactivar" se deshabilita (gris)
```

## Patrones de Código

### Backend: Validación + Hash + Insert

```javascript
export async function crearUsuario(req, res) {
  const { email, nombre, password, dependencia, rol } = req.body;
  
  // 1. Validaciones
  if (!validarEmail(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }
  if (!validarPassword(password)) {
    return res.status(400).json({ error: 'Password débil' });
  }
  
  // 2. Hash
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  
  // 3. Insert
  db.run(
    'INSERT INTO usuarios (...) VALUES (...)',
    [email, nombre, passwordHash, dependencia, rol],
    function(err) {
      if (err?.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'Email ya registrado' });
      }
      res.status(201).json({ ok: true, id: this.lastID });
    }
  );
}
```

### Frontend: Estado + Fetch + Actualización

```javascript
async function handleSubmit(e) {
  e.preventDefault();
  setError(null);
  
  try {
    const res = await fetch(url, {
      method: modoEdicion ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error);
    }
    
    setSuccess('Usuario guardado exitosamente');
    await cargarUsuarios();
    setTimeout(() => cerrarModal(), 1500);
    
  } catch (err) {
    setError(err.message);
  }
}
```

## Testing

### Tests Manuales Recomendados

**Crear Usuario:**
- [ ] Email duplicado debe fallar con error 409
- [ ] Password corto (<8 chars) debe rechazarse
- [ ] Password sin números debe rechazarse
- [ ] Dependencia inválida debe rechazarse
- [ ] Nombre con <3 caracteres debe rechazarse
- [ ] Usuario válido debe crearse con success

**Editar Usuario:**
- [ ] Cambiar email a uno duplicado debe fallar
- [ ] Dejar password vacío NO debe cambiar password
- [ ] Escribir nuevo password debe actualizar hash
- [ ] Desmarcar "activo" debe marcar usuario como inactivo
- [ ] Cambiar solo nombre debe actualizar solo nombre

**Desactivar Usuario:**
- [ ] Desactivar usuario debe cambiar estado a inactivo=0
- [ ] Usuario inactivo NO debe poder hacer login
- [ ] Intentar desactivar admin principal (ID=1) debe fallar

**Filtros:**
- [ ] Filtro "Solo Activos" debe ocultar inactivos
- [ ] Filtro "Solo Inactivos" debe ocultar activos
- [ ] Filtro por dependencia debe mostrar solo esa dependencia
- [ ] Contador debe actualizar en tiempo real

## Seguridad

### Consideraciones

1. **Passwords:**
   - NUNCA almacenar en texto plano
   - SIEMPRE usar bcrypt con salt rounds >= 10
   - NUNCA devolver password_hash en endpoints
   - Validar complejidad (longitud + caracteres)

2. **SQL Injection:**
   - SIEMPRE usar prepared statements (`?` placeholders)
   - NUNCA concatenar strings en queries SQL
   - SQLite3 escapa automáticamente con prepared statements

3. **Autenticación:**
   - Solo usuarios con `rol='admin'` pueden acceder a `/api/usuarios`
   - Verificar token JWT en middleware (implementación futura)
   - Validar permisos en cada endpoint

4. **Soft Delete:**
   - Nunca eliminar físicamente (mantiene integridad referencial)
   - Marcar como `activo=0`
   - Queries deben filtrar por `activo=1` donde aplique

## Extensiones Futuras

### Corto Plazo
- [ ] Middleware de autenticación JWT
- [ ] Paginación en lista de usuarios
- [ ] Búsqueda por nombre/email
- [ ] Exportar lista a CSV

### Mediano Plazo
- [ ] OAuth con Google Workspace
- [ ] Roles personalizados (permisos granulares)
- [ ] Auditoría de cambios (quién modificó qué)
- [ ] Reseteo de contraseña por email

### Largo Plazo
- [ ] 2FA (Two-Factor Authentication)
- [ ] SSO (Single Sign-On)
- [ ] API de integración con sistemas municipales
- [ ] Dashboard de actividad de usuarios

## Notas de Implementación

### Por qué Soft Delete en lugar de Hard Delete

**Razones:**
1. **Integridad Referencial:** Los reportes tienen foreign keys a `usuarios.id`
2. **Auditoría:** Mantener histórico de quién hizo qué
3. **Reversibilidad:** Fácil reactivar usuario sin perder datos
4. **Compliance:** Regulaciones pueden requerir mantener registros

### Por qué bcrypt sobre otros métodos

**Ventajas:**
- Diseñado específicamente para passwords
- Protección contra rainbow tables (salt automático)
- Resistente a ataques de fuerza bruta (cost factor ajustable)
- Estándar de industria (usado por Django, Rails, etc.)

### Por qué Validar en Backend Y Frontend

**Defensa en Profundidad:**
- Frontend: Mejora UX con feedback inmediato
- Backend: Seguridad real (frontend es bypassable)
- Nunca confiar en datos del cliente
- Validaciones de negocio SIEMPRE en backend

## Comandos Útiles

```bash
# Crear nuevo usuario desde terminal (SQLite CLI)
sqlite3 server/data.db "INSERT INTO usuarios (email, nombre, password_hash, dependencia, rol) VALUES ('test@jantetelco.gob.mx', 'Usuario Test', '\$2b\$10\$IC/ygKAFm7Nz5tSK0g15mulnmQ/LzQSX3ZJYqpbgpTPCrPFLJvMba', 'obras_publicas', 'funcionario');"

# Listar todos los usuarios
sqlite3 server/data.db "SELECT id, email, nombre, rol, activo FROM usuarios;"

# Reactivar usuario
sqlite3 server/data.db "UPDATE usuarios SET activo=1 WHERE id=?;"

# Cambiar rol de usuario
sqlite3 server/data.db "UPDATE usuarios SET rol='supervisor' WHERE id=?;"
```

## Créditos

**Desarrollado siguiendo:**
- REST API Best Practices (Microsoft/Google/Amazon Style Guides)
- OWASP Security Guidelines
- Material Design principles (UX)
- WCAG 2.1 AA (Accessibility)
- DRY, SOLID, KISS principles

**Referencias:**
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [REST API Best Practices](https://stackoverflow.blog/2020/03/02/best-practices-for-rest-api-design/)
- [bcrypt npm package](https://www.npmjs.com/package/bcrypt)
- [React Hooks Best Practices](https://react.dev/reference/react)

---

**Última actualización:** 1 de octubre de 2025  
**Versión:** 1.0.0  
**Mantenedor:** Equipo de Desarrollo citizen-reports
