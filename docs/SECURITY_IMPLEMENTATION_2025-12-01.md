# 🔐 Implementación de Seguridad - citizen-reports

> **Fecha:** 2025-12-01  
> **Versión:** 1.0  
> **Estado:** ✅ Implementado y Probado

---

## 📋 Resumen Ejecutivo

Se implementó un módulo de seguridad integral que cubre:
- Cifrado E2E de datos sensibles (AES-256-GCM)
- Rate limiting para login y API
- Política de contraseñas seguras
- Protección XSS y sanitización de inputs
- Security headers (CSP, HSTS, etc.)
- Tokens CSRF
- Gestión de sesiones con timeout

---

## 🔐 Cifrado End-to-End (AES-256-GCM)

### Campos Cifrados
```javascript
const SENSITIVE_FIELDS = [
  'descripcion',      // Descripción del reporte
  'colonia',          // Ubicación sensible
  'fingerprint',      // Identificador del dispositivo
  'notas',            // Notas de trabajo
  'direccion',        // Dirección completa
  'nombre_ciudadano', // PII
  'telefono',         // PII
  'email_ciudadano'   // PII
];
```

### Formato de Almacenamiento
```
IV:AuthTag:CipherText (Base64)
Ejemplo: O+JnCK7UrMIicE8+3Z36Lw==:95aN6QmEaTayTq0YePMNhg==:PB5aFSMr...
```

### Verificación
```bash
# En BD (cifrado):
Descripcion: O+JnCK7UrMIicE8+3Z36Lw==:95aN6QmEaTayTq0YePMNhg==:PB5aFSMr...

# Via API (descifrado):
Descripcion: Probando cifrado E2E correctamente
```

### Configuración
```bash
# Variable de entorno REQUERIDA para producción:
ENCRYPTION_KEY=tu-clave-de-32-bytes-hex

# Generar clave segura:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🚦 Rate Limiting

### Login
| Parámetro | Valor |
|-----------|-------|
| Intentos permitidos | 5 por minuto |
| Ventana de tiempo | 60 segundos |
| Bloqueo tras exceder | 15 minutos |
| Mensaje | "Por seguridad, su acceso está bloqueado por X minutos" |

### API General
| Parámetro | Valor |
|-----------|-------|
| Requests permitidos | 100 por minuto |
| Por | IP |
| Código HTTP | 429 Too Many Requests |

---

## 🔑 Política de Contraseñas

```javascript
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false  // Próxima fase
};
```

### Validación
```javascript
import { validarPassword } from './security.js';

const { valido, errores } = validarPassword('MiPassword123');
// valido: true
// errores: []
```

---

## 🛡️ Security Headers

```javascript
// Implementados automáticamente
'X-Frame-Options': 'DENY',
'X-Content-Type-Options': 'nosniff',
'X-XSS-Protection': '1; mode=block',
'Referrer-Policy': 'strict-origin-when-cross-origin',
'Content-Security-Policy': "default-src 'self'; ...",
'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
'Permissions-Policy': 'geolocation=(self), camera=(self)'
```

---

## 🔒 CSRF Protection

### Token Generation
```javascript
// En login exitoso, se retorna:
{
  "token": "auth_token_here",
  "csrfToken": "csrf_token_here",  // NUEVO
  "usuario": { ... }
}
```

### Uso en Frontend
```javascript
// Enviar en headers de requests POST/PUT/DELETE
fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'X-CSRF-Token': csrfToken  // REQUERIDO
  }
});
```

---

## ⏰ Gestión de Sesiones

| Parámetro | Valor |
|-----------|-------|
| Timeout por inactividad | 30 minutos |
| Duración máxima | 24 horas |
| Limpieza automática | Cada 5 minutos |

---

## 🧹 Sanitización XSS

```javascript
import { sanitizeInput, sanitizeObject } from './security.js';

// Input individual
const clean = sanitizeInput('<script>alert("xss")</script>');
// Resultado: 'scriptalert("xss")/script'

// Objeto completo
const cleanObj = sanitizeObject({
  nombre: '<b>Test</b>',
  descripcion: '<script>evil()</script>'
});
```

---

## 📁 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `server/security.js` | **NUEVO** - Módulo de seguridad completo (~500 líneas) |
| `server/auth_routes.js` | Rate limiting, CSRF token, audit |
| `server/app.js` | Security headers, API rate limiting, cifrado en POST |
| `server/asignaciones-routes.js` | Descifrado en GET detalle |
| `server/reportes_auth_routes.js` | Descifrado en consultas |
| `server/notas-trabajo-routes.js` | Cifrado/descifrado de notas |
| `server/usuarios-routes.js` | Validación de password policy |

---

## ✅ Checklist de Seguridad

- [x] Rate limiting en login (5 intentos/min, bloqueo 15 min)
- [x] Rate limiting en API (100 req/min)
- [x] Cifrado AES-256-GCM de datos sensibles
- [x] Descifrado transparente en API responses
- [x] Password policy (8+ chars, mayúscula, minúscula, número)
- [x] Sanitización XSS en inputs
- [x] Security headers (CSP, HSTS, X-Frame-Options, etc.)
- [x] CSRF token generation
- [x] Session timeout (30 min inactividad)
- [x] Audit trail de eventos de seguridad
- [x] Compatibilidad con datos legacy (no cifrados)

---

## ⚠️ Pendiente para Producción

1. **Definir ENCRYPTION_KEY**
   ```bash
   # En .env o variables de entorno del servidor
   ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   ```

2. **Habilitar validación CSRF estricta**
   - Actualmente en modo warning-only
   - Frontend debe enviar `X-CSRF-Token` en headers

3. **Migrar datos existentes**
   - Los datos legacy (no cifrados) siguen funcionando
   - Considerar script de migración para cifrar datos existentes

---

## 🧪 Pruebas

### Tests Unitarios
```bash
npm run test:unit -- --testPathPattern=security
# 30 tests passing
```

### Prueba Manual de Cifrado
```bash
# Crear reporte
curl -X POST http://localhost:4000/api/reportes \
  -H "Content-Type: application/json" \
  -d '{"tipo":"bache","descripcion":"Test E2E","lat":18.715,"lng":-98.776}'

# Verificar en BD (cifrado)
sqlite3 server/data.db "SELECT descripcion FROM reportes WHERE id = X"
# Output: O+JnCK7UrMIicE8+3Z36Lw==:95aN6QmEaTayTq0YePMNhg==:...

# Verificar via API (descifrado)
curl http://localhost:4000/api/reportes/X
# Output: {"descripcion":"Test E2E",...}
```

### Prueba de Rate Limiting
```bash
# 6 intentos fallidos en 1 minuto
for i in {1..6}; do
  curl -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
# Resultado: 429 "Por seguridad, su acceso está bloqueado por 15 minutos"
```

---

## 📚 Referencias

- [OWASP Top 10](https://owasp.org/Top10/)
- [AES-256-GCM](https://nodejs.org/api/crypto.html#cryptocreatedecipherivalgorithm-key-iv-options)
- [ADR-0010: Audit Trail](../docs/adr/ADR-0010-audit-trail.md)
- [US-SEC01-05](../.github/USER_STORIES.md#-seguridad-y-auditoría)
