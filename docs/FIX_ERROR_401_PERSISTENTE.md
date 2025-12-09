# Fix: Error 401 Unauthorized Persistente en Eliminación de Dependencias

## Problema

El usuario reportó que el error "401 Unauthorized" persistía al intentar eliminar dependencias, incluso después de intentar manejarlo en el bloque `catch`.

## Causa Raíz

El manejo de errores anterior dependía de buscar la cadena "401" o "Unauthorized" en el mensaje de error (`err.message`).
Sin embargo, el backend retorna mensajes en español como:

- `Token inválido o expirado`
- `Sesión expirada por inactividad`

Estos mensajes **no contienen** el código "401", por lo que la lógica de detección fallaba, y el usuario veía un mensaje de error genérico en lugar de ser redirigido al login.

## Solución Implementada

Se modificaron las funciones `eliminarDependenciaDirecto` y `handleReasignarYEliminar` en `client/src/AdminDependencias.jsx` para verificar el código de estado HTTP directamente:

```javascript
if (response.status === 401) {
  console.error('❌ Error 401: Sesión expirada o inválida');
  alert('❌ Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
  window.location.reload();
  return;
}
```

Esta verificación ocurre **antes** de procesar el cuerpo de la respuesta o lanzar excepciones, garantizando que cualquier respuesta 401 dispare inmediatamente el flujo de recuperación de sesión (alerta + reload).

## Verificación

1. Abrir Admin Panel > Dependencias.
2. Intentar eliminar una dependencia.
3. Si la sesión es válida, funcionará.
4. Si la sesión expiró (o se manipula el token en localStorage), se mostrará la alerta "Tu sesión ha expirado" y la página se recargará.

## Archivos Modificados

- `client/src/AdminDependencias.jsx`
