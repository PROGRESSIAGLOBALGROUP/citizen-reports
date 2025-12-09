# 🔐 Error 401: Token Inválido o Expirado

## ❌ El Error

```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Error: Error: Token inválido o expirado at eliminarDependenciaDirecto (AdminDependencias.jsx:165:15)
```

## 🔍 Causas Posibles

| Causa | Síntoma | Solución |
|-------|---------|----------|
| **Sesión expirada** | Pasaron >30 min sin actividad | Inicia sesión nuevamente |
| **Token corrupto** | El localStorage está corrupto | Borra cookies y storage |
| **Logout sin actualizar UI** | Hiciste logout en otra pestaña | Recarga la página |
| **Token no se guardó** | El auth_token está vacío | Verifica localStorage (F12) |
| **Servidor reiniciado** | Todos los tokens se invalidan | Inicia sesión nuevamente |

## ✅ Soluciones

### Opción 1: Reinicia Sesión (Recomendado)

1. **Cierra sesión:**
   - Haz click en el avatar/menu en la esquina superior derecha
   - Selecciona "Cerrar sesión"

2. **Inicia sesión nuevamente:**
   - Email: `admin@jantetelco.gob.mx`
   - Password: `admin123`

3. **Intenta la operación nuevamente**

### Opción 2: Borra datos del navegador

1. **Abre DevTools (F12)**
2. **Ve a Application → Storage**
3. **Borra:**
   - localStorage
   - sessionStorage
   - Cookies

4. **Recarga la página (Ctrl+R)**
5. **Inicia sesión nuevamente**

### Opción 3: Abre una pestaña privada/incógnita

A veces el localStorage de la pestaña normal se corrompe:

1. **Abre una nueva ventana privada/incógnita (Ctrl+Shift+P)**
2. **Ve a la aplicación en la ventana privada**
3. **Inicia sesión nuevamente**
4. **Intenta la operación**

## 🛠️ Debugging

### Ver el estado del token

Abre la **Consola (F12 → Console)** y ejecuta:

```javascript
// Ver si el token existe
console.log(localStorage.getItem('auth_token'));

// Ver si el usuario está en localStorage
console.log(localStorage.getItem('usuario'));

// Ver todos los datos almacenados
console.log(localStorage);
```

### Verificar logs de la operación

Cuando intentes eliminar una dependencia, deberías ver logs como:

```
🗑️ handleEliminar: Consultando usuarios de dependencia 1
🗑️ Token presente: Sí
🗑️ Response status: 200
```

Si ves `Token presente: No`, el problema es que el token no está en localStorage.

## 🔐 Información de Seguridad

**El error 401 es ESPERADO cuando:**
- Tu sesión expira (después de 30 min de inactividad)
- Cierras sesión en otra pestaña
- El servidor se reinicia

**El sistema se redirecciona automáticamente a login cuando detecta 401.**

## 📱 Pasos Detallados para Eliminar Dependencia

1. **Asegúrate de estar autenticado:**
   - Deberías ver tu nombre/avatar en la esquina superior derecha
   - Si no lo ves, inicia sesión

2. **Ve a Admin → Dependencias**

3. **Haz click en "Eliminar" 🗑️**
   - Si tiene usuarios → Aparece MODAL de reasignación
   - Si no tiene usuarios → Confirmación

4. **En el MODAL:**
   - Selecciona dependencia destino
   - Haz click en "Reasignar y Eliminar"

5. **Si ves error 401:**
   - Significa que tu sesión expiró
   - El sistema recargará la página automáticamente
   - Inicia sesión nuevamente

## 🎯 Checklist de Solución Rápida

- [ ] Verifica que estás autenticado (avatar visible)
- [ ] Abre consola (F12)
- [ ] Ejecuta `localStorage.getItem('auth_token')` 
- [ ] Si está vacío → Haz logout/login nuevamente
- [ ] Si está lleno → El problema es en el servidor (contacta soporte)
- [ ] Recarga la página (Ctrl+R)
- [ ] Intenta nuevamente

## 📞 Contactar Soporte

Si después de todos los pasos anteriores sigues viendo 401:

1. Abre la consola (F12)
2. Copia todos los logs (incluyendo el 401)
3. Contacta al equipo técnico con:
   - Screenshot del error
   - Logs de la consola
   - Hora exacta que ocurrió
   - Tu email de usuario

---

**Última actualización:** 2025-12-13  
**Versión:** 1.0
