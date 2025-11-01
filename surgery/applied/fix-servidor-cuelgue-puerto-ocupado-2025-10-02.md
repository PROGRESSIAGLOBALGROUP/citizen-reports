# Corrección: Servidor se cuelga al iniciar

**Fecha:** 2025-10-02  
**Protocolo:** code_surgeon - Ingeniería Inversa  
**Estado:** ✅ Resuelto

---

## Problema Reportado

**Síntoma:** Comandos como `node server.js 2>&1 | Select-Object -First 30` hacen que el servidor se cuelgue

**Contexto:** 
- El servidor se inicia pero inmediatamente se detiene
- No se puede acceder a `http://localhost:4000`
- Los comandos con pipes (`|`) bloquean la terminal

---

## Análisis de Causa Raíz (Ingeniería Inversa)

### Paso 1: Hipótesis Inicial
❌ **Hipótesis incorrecta:** Error en el código de `server.js` o `app.js`

**Verificación:**
```bash
node diagnostico.js
# Resultado: ✅ createApp() funciona sin errores
```

### Paso 2: Diagnóstico del Servidor
```bash
node diagnostico-completo.js
# Resultado: ❌ ERROR del servidor: listen EADDRINUSE: address already in use :::4000
```

### Paso 3: Identificación del Proceso
```powershell
Get-NetTCPConnection -LocalPort 4000 | Select-Object -ExpandProperty OwningProcess
# Resultado: PID 5568 (proceso node.js)
```

### Causa Raíz Confirmada

**PUERTO 4000 YA ESTABA EN USO** por un proceso Node.js anterior que no se detuvo correctamente.

Cuando se ejecuta `node server.js`, el servidor intenta escuchar en el puerto 4000, detecta que está ocupado, lanza el error `EADDRINUSE`, y el proceso termina inmediatamente (Exit Code 1).

---

## Solución Aplicada

### 1. Detener el proceso zombie

```powershell
# Identificar proceso
Get-NetTCPConnection -LocalPort 4000 | Select-Object -ExpandProperty OwningProcess

# Detener proceso
Stop-Process -Id 5568 -Force
```

### 2. Verificar puerto libre

```powershell
Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue | Measure-Object
# Resultado: Count = 0 (puerto libre)
```

### 3. Iniciar servidor correctamente

```powershell
cd C:\PROYECTOS\Jantetelco\server
Start-Job -ScriptBlock { 
  Set-Location C:\PROYECTOS\Jantetelco\server
  node server.js 
} -Name "Jantetelco-Server"
```

### 4. Validar funcionamiento

```powershell
Test-NetConnection -ComputerName localhost -Port 4000
# Resultado: TcpTestSucceeded = True ✅

Invoke-WebRequest -Uri "http://localhost:4000/api/reportes"
# Resultado: Status 200, Reportes: 10 ✅
```

---

## Sobre el Comando que Causa Cuelgue

### ¿Por qué `node server.js 2>&1 | Select-Object` se cuelga?

**Explicación técnica:**

1. **El servidor es un proceso de larga duración** que no termina hasta que se presiona Ctrl+C
2. **PowerShell con pipe (`|`) espera que el comando termine** para pasar el output al siguiente comando
3. **El servidor nunca termina naturalmente**, por lo que PowerShell queda esperando indefinidamente
4. **VSCode detecta esto como "cuelgue"** y permite cancelar el comando

**Analogía:** Es como pedirle a PowerShell que cuente todas las líneas de un archivo que nunca termina de escribirse.

### Comandos Seguros para Usar

✅ **Iniciar servidor en background:**
```powershell
Start-Job -ScriptBlock { 
  Set-Location C:\PROYECTOS\Jantetelco\server
  node server.js 
}
```

✅ **Ver output del job:**
```powershell
Receive-Job -Name "Jantetelco-Server" -Keep
```

✅ **Detener servidor:**
```powershell
Stop-Job -Name "Jantetelco-Server"
Remove-Job -Name "Jantetelco-Server"
```

✅ **Verificar estado sin pipes:**
```powershell
Test-NetConnection localhost -Port 4000 -WarningAction SilentlyContinue
```

### Comandos a EVITAR

❌ `node server.js 2>&1 | Select-Object`  
❌ `node server.js | Out-File`  
❌ `node --trace-warnings server.js | Select-Object`  

**Razón:** Todos usan pipes que esperan que el proceso termine.

---

## Scripts de Diagnóstico Creados

### `server/diagnostico.js`
Verifica que `createApp()` funcione correctamente.

```javascript
import { createApp } from './app.js';
const app = createApp();
// ✅ Sin errores = código de app.js funciona
```

### `server/diagnostico-completo.js`
Intenta iniciar el servidor y captura errores específicos.

```javascript
const server = app.listen(PORT, callback);
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Puerto ${PORT} ya está en uso`);
  }
});
```

**Uso:**
```powershell
cd C:\PROYECTOS\Jantetelco\server
node diagnostico-completo.js
```

---

## Prevención de Errores Futuros

### Problema: Puerto ocupado por proceso zombie

**Causa:** Al cancelar el servidor con Ctrl+C o cerrar VSCode, a veces el proceso no termina correctamente.

**Solución preventiva:**

#### 1. Script de limpieza de puertos

```powershell
# server/cleanup-port.ps1
$port = 4000
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | 
           Select-Object -ExpandProperty OwningProcess
if ($process) {
  Write-Host "🧹 Deteniendo proceso $process en puerto $port"
  Stop-Process -Id $process -Force
  Write-Host "✅ Puerto $port liberado"
} else {
  Write-Host "✅ Puerto $port ya está libre"
}
```

**Uso:**
```powershell
.\cleanup-port.ps1
node server.js
```

#### 2. Agregar manejo de errores en server.js

```javascript
// server/server.js (líneas a agregar)
const server = app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ Puerto ${PORT} ya está en uso`);
    console.error('   Ejecuta: Get-NetTCPConnection -LocalPort 4000');
    console.error('   O usa: npx kill-port 4000\n');
    process.exit(1);
  }
  throw error;
});
```

#### 3. Usar `npx kill-port` (cross-platform)

```powershell
npm install -g kill-port
kill-port 4000
node server.js
```

---

## Estado Final del Sistema

```
✅ Servidor corriendo en http://localhost:4000
✅ Puerto 4000 escuchando correctamente
✅ API respondiendo: 200 OK
✅ 10 reportes disponibles
✅ Scripts de diagnóstico creados
```

---

## Comandos de Referencia Rápida

### Verificar si el servidor está corriendo
```powershell
Test-NetConnection localhost -Port 4000 -WarningAction SilentlyContinue
```

### Encontrar proceso en puerto 4000
```powershell
Get-NetTCPConnection -LocalPort 4000 | Select-Object -ExpandProperty OwningProcess
```

### Matar proceso específico
```powershell
Stop-Process -Id <PID> -Force
```

### Matar todos los procesos Node.js
```powershell
Get-Process node | Stop-Process -Force
```

### Iniciar servidor en background
```powershell
cd C:\PROYECTOS\Jantetelco\server
Start-Job -ScriptBlock { 
  Set-Location C:\PROYECTOS\Jantetelco\server
  node server.js 
} -Name "Jantetelco-Server"
```

### Ver logs del servidor en background
```powershell
Receive-Job -Name "Jantetelco-Server" -Keep
```

### Detener servidor en background
```powershell
Stop-Job -Name "Jantetelco-Server"
Remove-Job -Name "Jantetelco-Server"
```

---

## Lecciones Aprendidas

1. **Los servidores no deben ejecutarse con pipes en PowerShell** porque son procesos de larga duración
2. **El error `EADDRINUSE` es común** cuando se cancela el servidor incorrectamente
3. **`Start-Job` es la forma correcta** de ejecutar servidores en PowerShell
4. **Siempre verificar el puerto antes de iniciar** con `Test-NetConnection`
5. **Scripts de diagnóstico son esenciales** para debugging sin colgar la terminal

---

**Protocolo aplicado:**
- ✅ Ingeniería inversa con diagnóstico progresivo
- ✅ No mocks ni placeholders (problema real resuelto)
- ✅ Scripts de diagnóstico reutilizables creados
- ✅ Documentación completa del proceso

**El servidor ahora funciona correctamente. El problema NO era el código, sino un proceso zombie en el puerto 4000.**
