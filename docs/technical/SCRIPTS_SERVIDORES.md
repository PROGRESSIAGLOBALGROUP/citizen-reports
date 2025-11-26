# Scripts de Gestión de Servidores - citizen-reports

Scripts PowerShell para iniciar, gestionar y detener los servidores de desarrollo y producción de forma segura y persistente.

## 📜 Scripts Disponibles

### 🚀 `start-dev.ps1` - Desarrollo (Recomendado)

Inicia backend y frontend en ventanas separadas con reinicio automático.

**Uso básico:**

```powershell
.\start-dev.ps1
```

**Opciones:**

```powershell
.\start-dev.ps1 -NoRestart    # Sin reinicio automático
.\start-dev.ps1 -Verbose      # Logs detallados
```

**Características:**

- ✅ Inicia backend (Express) en puerto 4000
- ✅ Inicia frontend (Vite) en puerto 5173
- ✅ Cada servidor en su propia ventana de terminal
- ✅ Reinicio automático si hay errores recuperables
- ✅ Verifica dependencias e inicializa DB si es necesario
- ✅ Muestra credenciales de prueba y URLs

**¿Cuándo usar?**

- Durante el desarrollo
- Cuando necesitas Hot Module Replacement (HMR)
- Cuando trabajas en frontend y backend simultáneamente

---

### 🏭 `start-prod.ps1` - Producción

Inicia un solo servidor que sirve tanto API como SPA compilado.

**Uso básico:**

```powershell
.\start-prod.ps1
```

**Opciones:**

```powershell
.\start-prod.ps1 -Build       # Recompila frontend antes de iniciar
.\start-prod.ps1 -NoRestart   # Sin reinicio automático
```

**Características:**

- ✅ Modo producción (NODE_ENV=production)
- ✅ Un solo proceso en puerto 4000
- ✅ Sirve SPA desde `client/dist/`
- ✅ Compila frontend automáticamente si no existe
- ✅ Reinicio automático ante errores
- ✅ Optimizado para menor consumo de recursos

**¿Cuándo usar?**

- Para pruebas de producción local
- Antes de deployment
- Cuando no necesitas HMR
- Para simular el entorno de producción

---

### 🛑 `stop-servers.ps1` - Detener Servidores

Detiene todos los servidores de citizen-reports de forma segura.

**Uso:**

```powershell
.\stop-servers.ps1
```

**Qué hace:**

1. Busca procesos escuchando en puertos 4000 y 5173
2. Identifica procesos Node.js relacionados con citizen-reports
3. Detiene todos los procesos encontrados
4. Confirma la detención

**¿Cuándo usar?**

- Cuando las ventanas de terminal se cerraron pero los procesos siguen corriendo
- Antes de reiniciar el sistema
- Para limpiar procesos huérfanos

---

## 🔧 Solución de Problemas Comunes

### ❌ Error: "No se puede ejecutar scripts en este sistema"

**Causa:** Política de ejecución de PowerShell restringida.

**Solución:**

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Luego vuelve a ejecutar el script.

---

### ❌ Error: "El puerto 4000/5173 ya está en uso"

**Causa:** Otro proceso está usando el puerto (posiblemente un servidor anterior que no se detuvo).

**Solución:**

```powershell
# Opción 1: Usar el script de detención
.\stop-servers.ps1

# Opción 2: Detener manualmente
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

---

### ❌ Error: "data.db: no such table: reportes"

**Causa:** Base de datos no inicializada.

**Solución:**

```powershell
cd server
Remove-Item data.db -ErrorAction SilentlyContinue
npm run init
```

El script `start-dev.ps1` hace esto automáticamente si detecta que falta la DB.

---

### ❌ Error: "Module not found" o dependencias faltantes

**Causa:** `node_modules` no instalados.

**Solución:**

```powershell
# Backend
cd server
npm install

# Frontend
cd ..\client
npm install
```

El script `start-dev.ps1` verifica esto automáticamente.

---

### ⚠️ Los servidores se reinician constantemente

**Causa:** Error en el código que causa crash inmediato.

**Solución:**

1. Revisa los logs en las ventanas de terminal
2. Ejecuta con `-NoRestart` para ver el error completo:
   ```powershell
   .\start-dev.ps1 -NoRestart
   ```
3. Corrige el error en el código
4. Vuelve a ejecutar normalmente

---

## 🎯 Flujo de Trabajo Recomendado

### Para Desarrollo Diario

1. **Iniciar:**

   ```powershell
   .\start-dev.ps1
   ```

2. **Trabajar:**
   - Abre http://localhost:5173 en el navegador
   - Edita archivos en `client/src/` o `server/`
   - Los cambios se recargan automáticamente

3. **Detener:**
   - Presiona `Ctrl+C` en cada ventana de terminal
   - O cierra las ventanas directamente
   - O ejecuta `.\stop-servers.ps1` si se quedaron procesos

### Para Probar en Modo Producción

1. **Compilar y ejecutar:**

   ```powershell
   .\start-prod.ps1 -Build
   ```

2. **Probar:**
   - Abre http://localhost:4000 (NO 5173)
   - Verifica que todo funcione correctamente
   - Prueba rendimiento y carga

3. **Detener:**
   - Presiona `Ctrl+C`
   - O ejecuta `.\stop-servers.ps1`

---

## 📊 Comparación de Modos

| Característica       | `start-dev.ps1`         | `start-prod.ps1`                   |
| -------------------- | ----------------------- | ---------------------------------- |
| **Procesos**         | 2 (backend + frontend)  | 1 (backend sirve todo)             |
| **Puertos**          | 4000 (API) + 5173 (SPA) | 4000 (ambos)                       |
| **HMR**              | ✅ Sí                   | ❌ No                              |
| **Compilación**      | No necesaria            | Automática si falta                |
| **Velocidad inicio** | Rápido                  | Moderado (compila si es necesario) |
| **Uso de memoria**   | Mayor                   | Menor                              |
| **Logs**             | Separados en ventanas   | Combinados                         |
| **Reinicio auto**    | ✅ Sí (configurable)    | ✅ Sí (configurable)               |
| **Recomendado para** | Desarrollo activo       | Testing pre-deployment             |

---

## 🔐 Usuarios de Prueba

Todos usan password: **`admin123`**

- `admin@jantetelco.gob.mx` - Administrador
- `supervisor.obras@jantetelco.gob.mx` - Supervisor Obras Públicas
- `func.obras1@jantetelco.gob.mx` - Funcionario Obras Públicas
- `supervisor.servicios@jantetelco.gob.mx` - Supervisor Servicios Públicos
- `func.servicios1@jantetelco.gob.mx` - Funcionario Servicios Públicos

---

## 📝 Notas Técnicas

### Reinicio Automático

El reinicio automático se activa cuando:

- El proceso termina con código de salida diferente de 0
- Hay un error no capturado (unhandled exception)
- Hay un error de sintaxis en el código

El reinicio **NO** se activa cuando:

- Presionas `Ctrl+C` (detención manual)
- El proceso termina con código 0 (salida limpia)

### Variables de Entorno

**Desarrollo (`start-dev.ps1`):**

- Backend: Puerto 4000, NODE_ENV no definido (default: development)
- Frontend: Puerto 5173, proxy a backend en 4000

**Producción (`start-prod.ps1`):**

- NODE_ENV=production
- PORT=4000
- Sirve archivos estáticos desde `client/dist/`

### Logs y Debugging

Los scripts muestran:

- ✅ Mensajes de éxito en verde
- ⚠️ Advertencias en amarillo
- ❌ Errores en rojo
- ℹ️ Información en cyan

Para más detalle, usa:

```powershell
.\start-dev.ps1 -Verbose
```

---

## 🚀 Próximos Pasos

Después de iniciar los servidores:

1. **Verificar que todo funciona:**
   - Backend: http://localhost:4000/api/reportes/tipos
   - Frontend: http://localhost:5173

2. **Probar autenticación:**
   - Click en "🔐 Inicio de Sesión"
   - Usa credenciales de prueba

3. **Explorar funcionalidades:**
   - Ver mapa de reportes
   - Crear nuevo reporte
   - Panel de funcionario (requiere login)

---

## 📚 Documentación Relacionada

- [README.md](../README.md) - Guía principal del proyecto
- [SISTEMA_AUTENTICACION.md](../docs/SISTEMA_AUTENTICACION.md) - Sistema de auth y roles
- [architecture.md](../docs/architecture.md) - Arquitectura técnica
- [tdd_philosophy.md](../docs/tdd_philosophy.md) - Filosofía de testing

---

## 🆘 Ayuda Adicional

Si sigues teniendo problemas:

1. Revisa los logs en las ventanas de terminal
2. Ejecuta `npm run test:all` para verificar que todo está correcto
3. Consulta la documentación en `docs/`
4. Verifica que Node.js esté actualizado: `node --version` (requiere v20+)

---

**¡Feliz desarrollo! 🎉**
