# ⚡ GUÍA RÁPIDA - Iniciar citizen-reports

## 🚀 Para Desarrollo (RECOMENDADO)

Abre PowerShell en `C:\PROYECTOS\citizen-reports` y ejecuta:

```powershell
.\start-dev.ps1
```

### ✅ Qué hace este script:

1. ✅ Verifica que Node.js esté instalado
2. ✅ Instala dependencias automáticamente si no existen
3. ✅ Inicializa la base de datos si es necesario
4. ✅ Abre **DOS ventanas separadas**:
   - **Ventana 1 (Backend):** Express + SQLite en `http://localhost:4000`
   - **Ventana 2 (Frontend):** Vite + React en `http://localhost:5173`
5. ✅ Los servidores se **reinician automáticamente** si hay errores
6. ✅ Muestra las credenciales de prueba

### 🌐 Accede a la aplicación:

Abre tu navegador en: **http://localhost:5173**

### 🔐 Credenciales de Prueba:

Todos los usuarios tienen password: **`admin123`**

- `admin@jantetelco.gob.mx` - Administrador
- `supervisor.obras@jantetelco.gob.mx` - Supervisor Obras Públicas
- `func.obras1@jantetelco.gob.mx` - Funcionario Obras Públicas

---

## 🏭 Para Producción

```powershell
.\start-prod.ps1 -Build
```

- Compila el frontend automáticamente
- Inicia un **solo proceso** en `http://localhost:4000`
- Sirve tanto la API como el SPA compilado

---

## 🛑 Para Detener los Servidores

```powershell
.\stop-servers.ps1
```

Este script:

- Encuentra todos los procesos en puertos 4000 y 5173
- Los detiene de forma segura
- Limpia procesos huérfanos

**O manualmente:**

- Ve a cada ventana de terminal
- Presiona `Ctrl+C`
- Cierra las ventanas

---

## ❓ Si Algo Sale Mal

### Error: "No se puede ejecutar scripts"

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Error: "Puerto ya en uso"

```powershell
.\stop-servers.ps1  # Detiene procesos anteriores
.\start-dev.ps1     # Vuelve a iniciar
```

### Error: "Base de datos no existe"

El script `start-dev.ps1` lo arregla automáticamente. O manualmente:

```powershell
cd server
Remove-Item data.db -ErrorAction SilentlyContinue
npm run init
```

### Los servidores se reinician constantemente

Hay un error en el código. Para ver el error completo:

```powershell
.\start-dev.ps1 -NoRestart
```

---

## 📚 Documentación Completa

- **Scripts detallados:** [`docs/SCRIPTS_SERVIDORES.md`](docs/SCRIPTS_SERVIDORES.md)
- **Sistema de autenticación:** [`docs/SISTEMA_AUTENTICACION.md`](docs/SISTEMA_AUTENTICACION.md)
- **README principal:** [`README.md`](README.md)

---

## 🎯 Flujo de Trabajo Típico

1. **Iniciar:**

   ```powershell
   .\start-dev.ps1
   ```

2. **Desarrollar:**
   - Edita archivos en `client/src/` o `server/`
   - Los cambios se recargan automáticamente (Hot Module Replacement)
   - Abre http://localhost:5173

3. **Probar:**
   - Navega por la aplicación
   - Prueba el login con las credenciales de prueba
   - Revisa los logs en las ventanas de terminal

4. **Detener:**
   ```powershell
   .\stop-servers.ps1
   ```
   O cierra las ventanas de terminal

---

## 🔥 Características del Sistema de Inicio

### Ventajas vs. inicio manual:

| Característica                    | Manual (`npm run dev`) | Script (`start-dev.ps1`) |
| --------------------------------- | ---------------------- | ------------------------ |
| **Verifica dependencias**         | ❌ No                  | ✅ Sí                    |
| **Inicializa DB automáticamente** | ❌ No                  | ✅ Sí                    |
| **Reinicio automático**           | ❌ No                  | ✅ Sí                    |
| **Dos comandos → uno**            | ❌ Dos terminales      | ✅ Un comando            |
| **Logs bonitos con emojis**       | ❌ No                  | ✅ Sí                    |
| **Muestra credenciales**          | ❌ No                  | ✅ Sí                    |
| **Detección de errores**          | ⚠️ Básica              | ✅ Avanzada              |

---

## 💡 Tips

- **Mantén las ventanas abiertas:** No cierres las ventanas de terminal mientras trabajas
- **Revisa los logs:** Si algo no funciona, los logs en las ventanas te dirán qué pasó
- **Usa el script de detención:** Evita procesos huérfanos usando `.\stop-servers.ps1`
- **Modo verbose:** Usa `.\start-dev.ps1 -Verbose` si necesitas más información

---

## 🎉 ¡Listo!

Ahora tienes un sistema robusto para iniciar y gestionar los servidores sin que se caigan cuando cierres las terminales.

**Siguiente paso:** Ejecuta `.\start-dev.ps1` y empieza a desarrollar! 🚀
