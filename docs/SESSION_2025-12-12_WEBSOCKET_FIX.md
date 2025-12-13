# Sesión 2025-12-12: Corrección de Errores WebSocket y Script de Servidores

## 📋 Resumen Ejecutivo

**Fecha:** 12 de Diciembre de 2025  
**Duración:** ~45 minutos  
**Objetivo:** Resolver errores de WebSocket en Vite HMR y optimizar script de inicio de servidores

---

## 🐛 Problema Inicial

### Síntomas Reportados
El usuario reportó errores persistentes de WebSocket en la consola del navegador:

```
WebSocket connection to 'ws://localhost:5173/?token=ZIBwErX4to60' failed
[vite] failed to connect to websocket.
your current setup:
  (browser) localhost:5173/ <--[HTTP]--> localhost:5173/ (server)
  (browser) localhost:5173/ <--[WebSocket (failing)]--> localhost:5173/ (server)
```

### Causa Raíz
1. **Configuración conflictiva de Vite:** `host: true` hacía que Vite escuchara en `0.0.0.0` (todas las interfaces), pero el WebSocket intentaba conectarse específicamente a `localhost`
2. **HMR mal configurado:** La configuración de Hot Module Replacement tenía parámetros que no funcionaban correctamente con VS Code Simple Browser
3. **Servidores no sincronizados:** El frontend iniciaba antes que el backend estuviera listo, causando errores de proxy `ECONNREFUSED`

---

## ✅ Soluciones Implementadas

### 1. Corrección de `vite.config.js`

**Archivo:** `client/vite.config.js`

**Antes:**
```javascript
server: {
  port: 5173,
  host: true, // Allow network access
  strictPort: true,
  hmr: {
    overlay: false,
    host: 'localhost',
    protocol: 'ws',
    clientPort: 5173,
  },
  // ...
}
```

**Después:**
```javascript
server: {
  port: 5173,
  host: '127.0.0.1', // Forzar localhost IPv4 para evitar problemas WebSocket
  strictPort: true,
  hmr: false, // HMR deshabilitado para evitar errores de WebSocket en VS Code Simple Browser
  // ...
}
```

**Justificación:**
- `host: '127.0.0.1'` → Fuerza IPv4 localhost, evitando conflictos de resolución de nombres
- `hmr: false` → Desactiva Hot Module Replacement, eliminando completamente los intentos de WebSocket que fallaban en VS Code Simple Browser

**Trade-off:** Sin HMR, los cambios requieren refresh manual (F5). Para desarrollo con HMR, usar navegador externo (Chrome/Firefox) en lugar de VS Code Simple Browser.

---

### 2. Actualización de `scripts/start-servers.ps1`

**Archivo:** `scripts/start-servers.ps1`

**Problemas del script anterior:**
- Usaba `Start-Job` que corría en background sin output visible
- Referenciaba `node server-dev.js` que no existe
- No verificaba si los servidores estaban listos
- Rutas hardcodeadas

**Nuevo script - Características:**

| Característica | Descripción |
|----------------|-------------|
| **Terminales separadas** | Backend y Frontend corren en ventanas pwsh independientes con logs visibles |
| **Limpieza automática** | Mata procesos Node anteriores antes de iniciar |
| **Verificación de salud** | Espera hasta 15 intentos para confirmar que el backend responde HTTP 200 |
| **Rutas dinámicas** | Usa `$ProjectRoot` calculado desde la ubicación del script |
| **Opciones CLI** | `-BackendOnly`, `-FrontendOnly`, `-Help` |
| **Feedback visual** | Muestra estado, URLs y credenciales de prueba |

**Uso:**
```powershell
# Iniciar ambos servidores
.\scripts\start-servers.ps1

# Solo backend
.\scripts\start-servers.ps1 -BackendOnly

# Solo frontend
.\scripts\start-servers.ps1 -FrontendOnly

# Ver ayuda
.\scripts\start-servers.ps1 -Help
```

---

## 📁 Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `client/vite.config.js` | HMR deshabilitado, host forzado a 127.0.0.1 |
| `scripts/start-servers.ps1` | Reescrito completamente con terminales separadas y verificación de salud |

---

## 🧪 Verificación

### Estado Final de Servidores
```
✅ Backend:  http://localhost:4000      HTTP 200
✅ Frontend: http://127.0.0.1:5173      Listo
```

### Logs del Backend (Funcionando)
```
✅ Servidor development en http://0.0.0.0:4000
📡 Server está escuchando activamente en puerto 4000
✅ DB singleton creada
POST /api/auth/login HTTP/1.1" 200
GET /api/reportes?estado=abiertos HTTP/1.1" 200
GET /api/categorias-con-tipos HTTP/1.1" 200
```

---

## 💡 Notas Técnicas

### Por qué HMR falla en VS Code Simple Browser
VS Code Simple Browser tiene restricciones de seguridad que impiden conexiones WebSocket arbitrarias. El token de Vite HMR (`?token=ZIBwErX4to60`) no puede establecer conexión persistente.

### Alternativas para desarrollo con HMR
1. **Usar navegador externo:** Chrome/Firefox en `http://localhost:5173` - HMR funciona
2. **Reactivar HMR condicionalmente:** Detectar si es VS Code Simple Browser y deshabilitar solo en ese caso

### Configuración recomendada para producción
El cambio de `hmr: false` **no afecta producción** - HMR solo existe en desarrollo. El build de producción (`npm run build`) genera archivos estáticos sin WebSocket.

---

## 🔗 Referencias

- [Vite HMR Documentation](https://vitejs.dev/config/server-options.html#server-hmr)
- [Vite Server Host Configuration](https://vitejs.dev/config/server-options.html#server-host)
- Archivo de instrucciones del proyecto: `.github/copilot-instructions.md`

---

## ✍️ Autor

Sesión documentada automáticamente por GitHub Copilot (Claude Opus 4.5)
