# Proceso de Deployment: Local → Producción

## 📋 Resumen Ejecutivo

Este documento describe el procedimiento **paso a paso** para desplegar cambios desde el ambiente local hacia el servidor de producción en `145.79.0.77`. El proceso es **reproducible** y debe seguirse exactamente en este orden.

**Información de Producción:**
- **Host:** `root@145.79.0.77`
- **Puerto SSH:** 22 (default)
- **Ruta Aplicación:** `/root/citizen-reports/`
- **Ruta Servidor Web:** `/root/citizen-reports/server/`
- **Ruta Distribución:** `/root/citizen-reports/server/dist/`
- **Process Manager:** PM2 (nombre del proceso: `citizen-reports`)
- **Puerto HTTP:** 4000

---

## 🔄 Flujo General del Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. MODIFICAR EN LOCAL                                           │
│    - Editar archivos en c:\PROYECTOS\Jantetelco\client\src\     │
│    - Cambios en estilos, componentes React, etc.               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ 2. COMPILAR CON VITE                                            │
│    - npm run build genera dist/ con archivos minificados        │
│    - Hash automático en nombres: index-XXXXX.css, index-XXXXX.js│
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ 3. COPIAR CON SCP                                               │
│    - Transferir archivos dist/* a servidor                      │
│    - Reemplaza archivos antiguos en /root/citizen-reports/server/dist/│
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ 4. REINICIAR CON PM2                                            │
│    - pm2 restart citizen-reports reinicia la aplicación        │
│    - Servidor comienza a servir nuevos archivos                │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ 5. VALIDAR ACTUALIZACIÓN                                        │
│    - Verificar que archivos estén en servidor                   │
│    - Comprobar que index.html referencia CSS correcto          │
│    - Revisar que servidor está online (pm2 status)             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Procedimiento Detallado

### Paso 1: Hacer Cambios en Local

**Archivos que normalmente se modifican:**

```
c:\PROYECTOS\Jantetelco\
├── client/src/
│   ├── styles.css              ← CSS principal (mobile-first responsive)
│   ├── App.jsx                 ← Componente raíz y navegación
│   ├── components/
│   │   ├── MapView.jsx         ← Vista del mapa
│   │   ├── ReportForm.jsx      ← Formulario de reportes
│   │   ├── AdminPanel.jsx      ← Panel de administración
│   │   └── ...otros.jsx
│   └── index.jsx               ← Entry point React
└── server/
    ├── app.js                  ← Express app y rutas API
    ├── server.js               ← Servidor Node.js
    ├── db.js                   ← Funciones de base de datos
    └── schema.sql              ← Estructura de BD (NO se modifica en prod)
```

**Editar** los archivos necesarios en VS Code, guardar (Ctrl+S).

**Verificar cambios localmente:**
```powershell
cd c:\PROYECTOS\Jantetelco\client
npm run dev      # Vite dev server en :5173
# Abrir http://localhost:5173 en navegador y probar
```

---

### Paso 2: Compilar con Vite

**Compilar el cliente:**
```powershell
cd c:\PROYECTOS\Jantetelco\client
npm run build
```

**Salida esperada (últimas líneas):**
```
vite v7.1.7 building for production...
transforming...
Ô£ô 60 modules transformed.
rendering chunks...
computing gzip size...
dist/assets/manifest-D4WhTm8V.json    0.18 kB │ gzip:   0.14 kB
dist/index.html                       0.73 kB │ gzip:   0.41 kB
dist/assets/index-Dxdrm8G3.css       23.97 kB │ gzip:   8.51 kB
dist/assets/index-Bw-GvXan.js       785.49 kB │ gzip: 207.53 kB
```

**Notas importantes:**
- ⚠️ Cada compilación genera un **hash único** en los nombres (ej: `index-Dxdrm8G3.css`)
- ✅ El archivo `index.html` se actualiza con referencias al nuevo hash
- ⚠️ Los archivos antiguos `.css` y `.js` quedan en `dist/assets/` pero el HTML no los referencia

**Verificar que se creó `dist/`:**
```powershell
ls c:\PROYECTOS\Jantetelco\client\dist\
```

Debe mostrar:
```
assets/
    index-Dxdrm8G3.css
    index-Bw-GvXan.js
    manifest-D4WhTm8V.json
index.html
```

---

### Paso 3: Copiar Archivos a Servidor con SCP

**Copiar TODOS los archivos compilados:**
```powershell
scp -r c:\PROYECTOS\Jantetelco\client\dist/* root@145.79.0.77:/root/citizen-reports/server/dist/
```

**Proceso:**
1. Pedirá contraseña de root
2. Mostrará progreso de cada archivo: `index-Bw-GvXan.js 100% 785KB`
3. Cuando termina, regresa al prompt

**Salida esperada (ejemplo):**
```
index-Bw-GvXan.css                                                   100%   23KB 156.9KB/s   00:00
index-Bw-GvXan.js                                                    100%  769KB   1.7MB/s   00:00
manifest-D4WhTm8V.json                                               100%  177     2.2KB/s   00:00
index.html                                                           100%  729     9.1KB/s   00:00
```

**⚠️ Notas críticas sobre SCP:**

- ✅ Usar `-r` (recursive) para copiar directorio entero
- ✅ El path remoto debe terminar con `/` para copiar CONTENIDO (no crear subdirectorio)
- ✅ Esto **sobrescribe** archivos antiguos automáticamente
- ❌ NO omitir `/*` al final del path local (así copia el contenido, no la carpeta)

**Comando CORRECTO:**
```powershell
scp -r c:\PROYECTOS\Jantetelco\client\dist/* root@145.79.0.77:/root/citizen-reports/server/dist/
```

**Comando INCORRECTO:**
```powershell
# Esto crearıa /root/citizen-reports/server/dist/dist/
scp -r c:\PROYECTOS\Jantetelco\client\dist root@145.79.0.77:/root/citizen-reports/server/dist/
```

---

### Paso 4: Reiniciar Aplicación con PM2

**Conectar por SSH y reiniciar:**
```powershell
ssh root@145.79.0.77 "cd /root/citizen-reports && pm2 restart citizen-reports && sleep 2 && pm2 status"
```

**Salida esperada:**
```
[PM2] Applying action restartProcessId on app [citizen-reports](ids: [ 0 ])
[PM2] [citizen-reports](0) ✓

┌────┬────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │
├────┼────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ citizen-reports    │ default     │ N/A     │ cluster │ 151455   │ 2s     │ 40   │ online    │ 0%       │ 68.5mb   │
└────┴────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┘
```

**Datos clave a verificar:**
- `status: online` ✅ Aplicación está corriendo
- `pid: XXXXX` - PID del proceso (debe ser diferente al anterior)
- `uptime: 2s` - Acababa de reiniciarse

**⚠️ Si algo va mal:**
```powershell
# Ver logs del último error
ssh root@145.79.0.77 "pm2 logs citizen-reports --lines 50"

# Detener la aplicación
ssh root@145.79.0.77 "pm2 stop citizen-reports"

# Iniciar nuevamente
ssh root@145.79.0.77 "cd /root/citizen-reports && pm2 start server/server.js --name citizen-reports"
```

---

### Paso 5: Validar Actualización

#### 5a. Verificar que archivos están en servidor

```powershell
ssh root@145.79.0.77 "ls -lah /root/citizen-reports/server/dist/assets/index-*.css"
```

Debe mostrar el archivo más reciente con el hash correcto:
```
-rw-r--r-- 1 root root 23K Nov 1 00:59 index-Bw-GvXan.css
```

#### 5b. Verificar que index.html referencia CSS correcto

```powershell
ssh root@145.79.0.77 "cat /root/citizen-reports/server/dist/index.html | Select-String 'href.*css'"
```

Debe mostrar:
```html
<link rel="stylesheet" crossorigin href="/assets/index-Bw-GvXan.css">
```

⚠️ El hash debe ser el MISMO que en el paso anterior.

#### 5c. Verificar contenido del CSS

```powershell
ssh root@145.79.0.77 "head -50 /root/citizen-reports/server/dist/assets/index-Bw-GvXan.css"
```

Debe mostrar el CSS comenzando con variables CSS (`:root { --app-bg: ...`)

#### 5d. Probar URL en navegador

Abrir en navegador:
```
http://145.79.0.77:4000/
```

**Notas sobre caché del navegador:**
- ⚠️ Si ves la versión ANTERIOR, el navegador está usando caché
- ✅ **Solución:** Hard refresh: `Ctrl+Shift+R` (Windows) o `Cmd+Shift+R` (Mac)
- ✅ Alternativamente: Abrir DevTools (F12) → Settings → "Disable cache (while DevTools is open)"

---

## 🔐 Autenticación SSH

**Primera vez conectándose:**
Se pedirá contraseña de root. Ingresarla cuando aparezca:
```
root@145.79.0.77's password:
```

**Para evitar escribir contraseña cada vez:**

Usar SSH keys (opcional pero recomendado):
```powershell
# Generar key si no existe
ssh-keygen -t ed25519 -f $HOME\.ssh\id_ed25519

# Copiar key pública al servidor
type $HOME\.ssh\id_ed25519.pub | ssh root@145.79.0.77 "cat >> ~/.ssh/authorized_keys"

# Desde ahora no pide contraseña
ssh root@145.79.0.77 "pm2 status"
```

---

## 📊 Tabla de Referencia Rápida

| Paso | Comando | Ubicación | Salida Esperada |
|------|---------|-----------|-----------------|
| **1** | `npm run build` | `c:\PROYECTOS\Jantetelco\client` | `dist/assets/index-XXXXX.css` |
| **2** | `scp -r dist/*` | Local → `145.79.0.77:/root/citizen-reports/server/dist/` | `100% transferred` |
| **3** | `pm2 restart` | `ssh root@145.79.0.77` | `[citizen-reports](0) ✓` |
| **4a** | `ls -lah dist/assets/` | `ssh root@145.79.0.77` | Nuevo hash visible |
| **4b** | `cat index.html \| grep css` | `ssh root@145.79.0.77` | Coincide con nuevo hash |
| **5** | Abrir navegador | `http://145.79.0.77:4000/` | Cambios visibles (hard refresh si necesario) |

---

## ⚡ Script PowerShell Automático (Opcional)

Para no escribir comandos cada vez, crear archivo `deploy.ps1`:

```powershell
# c:\PROYECTOS\Jantetelco\deploy.ps1

param(
    [string]$Message = "Deployment sin mensaje"
)

Write-Host "🚀 Iniciando deployment..." -ForegroundColor Green

# Paso 1: Build
Write-Host "📦 Compilando cliente..." -ForegroundColor Cyan
cd c:\PROYECTOS\Jantetelco\client
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build falló" -ForegroundColor Red
    exit 1
}

# Paso 2: SCP
Write-Host "📤 Copiando archivos a servidor..." -ForegroundColor Cyan
scp -r c:\PROYECTOS\Jantetelco\client\dist/* root@145.79.0.77:/root/citizen-reports/server/dist/
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ SCP falló" -ForegroundColor Red
    exit 1
}

# Paso 3: Reiniciar PM2
Write-Host "🔄 Reiniciando aplicación..." -ForegroundColor Cyan
ssh root@145.79.0.77 "cd /root/citizen-reports && pm2 restart citizen-reports && sleep 2 && pm2 status"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ PM2 restart falló" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deployment completado exitosamente" -ForegroundColor Green
Write-Host "🌐 Acceder en: http://145.79.0.77:4000/" -ForegroundColor Yellow
Write-Host "💡 Si no ves cambios: Hard refresh (Ctrl+Shift+R)" -ForegroundColor Yellow
```

**Usar el script:**
```powershell
cd c:\PROYECTOS\Jantetelco
.\deploy.ps1 -Message "Añadido responsive mobile-first"
```

---

## 🐛 Troubleshooting

### Problema: "Permission denied (publickey,password)"

**Causa:** No hay conexión SSH o contraseña incorrecta

**Solución:**
```powershell
# Probar conexión básica
ssh -vvv root@145.79.0.77 "echo hola"
# Verá detalles de por qué falla
```

### Problema: "All specified targets for scp to remote closed"

**Causa:** SCP intenta copiar pero ruta no existe o permisos incorrectos

**Solución:**
```powershell
# Verificar que directorio dist/ existe en servidor
ssh root@145.79.0.77 "ls -la /root/citizen-reports/server/dist/"

# Si no existe, crearlo
ssh root@145.79.0.77 "mkdir -p /root/citizen-reports/server/dist"
```

### Problema: "Hash en CSS no coincide con index.html"

**Causa:** `index.html` no se transfirió correctamente

**Solución:**
```powershell
# Re-copiar SOLO index.html
scp c:\PROYECTOS\Jantetelco\client\dist\index.html root@145.79.0.77:/root/citizen-reports/server/dist/index.html

# Verificar
ssh root@145.79.0.77 "cat /root/citizen-reports/server/dist/index.html | grep href"
```

### Problema: "Cambios no visibles en navegador"

**Causa #1:** Caché del navegador (99% de casos)

**Solución:**
```
Presionar: Ctrl+Shift+R (Windows) o Cmd+Shift+R (Mac)
```

**Causa #2:** PM2 no reinició correctamente

**Solución:**
```powershell
ssh root@145.79.0.77 "pm2 logs citizen-reports --lines 20"
# Ver si hay errores en los logs
```

**Causa #3:** Viejo archivo CSS todavía siendo servido

**Solución:**
```powershell
# Ver qué archivos CSS existen
ssh root@145.79.0.77 "ls -lah /root/citizen-reports/server/dist/assets/*.css"

# Borrar archivos antiguos (OPCIONAL - Vite los sobrescribe automáticamente)
ssh root@145.79.0.77 "rm /root/citizen-reports/server/dist/assets/index-*.css.bak"
```

---

## 📝 Checklist Pre-Deployment

Antes de hacer deployment, verificar:

- [ ] Cambios probados localmente (`npm run dev` en cliente)
- [ ] No hay errores en consola local
- [ ] Build completa sin warnings críticos (`npm run build`)
- [ ] `dist/` tiene archivos `.css` y `.js` con diferentes hashes cada vez
- [ ] `index.html` en `dist/` referencia los nuevos hashes
- [ ] SSH funciona: `ssh root@145.79.0.77 "echo test"`
- [ ] PM2 está corriendo: `ssh root@145.79.0.77 "pm2 status"`
- [ ] Hay espacio en servidor: `ssh root@145.79.0.77 "df -h /"`

---

## 📈 Tiempos Esperados

| Actividad | Tiempo |
|-----------|--------|
| Compilar con Vite (`npm run build`) | 10-15 segundos |
| Copiar archivos con SCP | 5-10 segundos (depende de conexión) |
| Reiniciar PM2 | 2-5 segundos |
| **Total Deployment** | **~30 segundos** |
| Caché del navegador + hard refresh | 2-3 segundos |
| **Tiempo Total (usuario ve cambios)** | **~35 segundos** |

---

## 🔄 Workflow Completo Ejemplo

**Escenario:** Se añadió CSS responsive mobile-first y se modificó App.jsx

```bash
# 1. Verificar localmente
cd c:\PROYECTOS\Jantetelco\client
npm run dev
# Abrir http://localhost:5173, probar, cerrar dev server (Ctrl+C)

# 2. Compilar
npm run build
# ✅ Build successful

# 3. Copiar a servidor
scp -r dist/* root@145.79.0.77:/root/citizen-reports/server/dist/
# index-Bw-GvXan.js 100% 785KB 1.7MB/s 00:00

# 4. Reiniciar
ssh root@145.79.0.77 "cd /root/citizen-reports && pm2 restart citizen-reports && sleep 2 && pm2 status"
# [citizen-reports](0) ✓
# status: online ✅

# 5. Validar
ssh root@145.79.0.77 "cat /root/citizen-reports/server/dist/index.html" | Select-String "href.*css"
# <link rel="stylesheet" crossorigin href="/assets/index-Bw-GvXan.css">

# 6. Abrir en navegador
# http://145.79.0.77:4000/
# Ctrl+Shift+R para hard refresh
# ✅ Cambios visibles

```

---

## 📞 Referencia Rápida para Errores

| Error | Causa | Comando de Fix |
|-------|-------|----------------|
| `scp: command not found` | OpenSSH no instalada | Instalar Git Bash o WSL |
| `Permission denied` | Contraseña incorrecta | Verificar credenciales |
| `dist not found` | Build no completó | `npm run build` desde `client/` |
| `pm2: command not found` | PM2 no en PATH del servidor | `ssh root@145.79.0.77 "which pm2"` |
| `EADDRINUSE: port 4000` | Puerto en uso | `ssh root@145.79.0.77 "lsof -i :4000"` |

---

## 🎯 Conclusión

El deployment es un proceso de **5 pasos sencillos y reproducibles**:

1. **Build** → Compilar con Vite
2. **Copy** → SCP al servidor
3. **Restart** → PM2 reinicia
4. **Verify** → Comprobar que archivos están correctos
5. **Test** → Abrir navegador y hard refresh

**Cada paso debe completarse exitosamente antes de pasar al siguiente.**

Si algo falla, **no continuar** y revisar logs del error.

---

## 🔗 Archivos Relacionados

- Configuración Vite: `client/vite.config.js`
- Configuración PM2: `/root/citizen-reports/ecosystem.config.js` (en servidor)
- Servidor Express: `server/server.js`
- Variables de ambiente: `server/.env` (no incluido en repo)

---

**Última actualización:** Octubre 31, 2025  
**Autor:** GitHub Copilot + Human  
**Estado:** Documentación Completa ✅
