# 🚀 Deployment Quick Start - 30 Segundos

## TL;DR - Solo Ejecuta Esto

```powershell
# 1. Compilar (desde client/)
cd c:\PROYECTOS\Jantetelco\client && npm run build

# 2. Copiar (automático)
scp -r c:\PROYECTOS\Jantetelco\client\dist/* root@145.79.0.77:/root/citizen-reports/server/dist/

# 3. Reiniciar (automático)
ssh root@145.79.0.77 "cd /root/citizen-reports && pm2 restart citizen-reports && sleep 1 && pm2 status"

# 4. Abrir en navegador
# http://145.79.0.77:4000/
# Presiona: Ctrl+Shift+R (hard refresh)
```

---

## ✅ Checklist Pre-Deployment

- [ ] Cambios guardados en local (`Ctrl+S` en VS Code)
- [ ] Probé localmente con `npm run dev` (opcional pero recomendado)
- [ ] Sin errores en consola del navegador
- [ ] SSH funciona: `ssh root@145.79.0.77 "echo test"` → muestra "test"

---

## 🎯 Los 5 Pasos (en Orden)

### 1️⃣ COMPILAR (10-15 seg)
```powershell
cd c:\PROYECTOS\Jantetelco\client
npm run build
```

**✅ Éxito:** Ves `dist/assets/index-XXXXX.css` con hash nuevo

**❌ Fallo:** Revisa errores en consola (syntax error en `.jsx` o `.css`)

---

### 2️⃣ COPIAR (5-10 seg)
```powershell
scp -r c:\PROYECTOS\Jantetelco\client\dist/* root@145.79.0.77:/root/citizen-reports/server/dist/
```

**✅ Éxito:** Ve `100% transferred` para cada archivo

**❌ Fallo:** 
- Contraseña incorrecta → intenta otra vez
- `Permission denied` → SSH key problema

---

### 3️⃣ REINICIAR (2-5 seg)
```powershell
ssh root@145.79.0.77 "cd /root/citizen-reports && pm2 restart citizen-reports && sleep 1 && pm2 status"
```

**✅ Éxito:** Ve `[citizen-reports](0) ✓` y `status: online`

**❌ Fallo:** Revisa logs con `pm2 logs citizen-reports --lines 20`

---

### 4️⃣ VALIDAR (5 seg)
```powershell
ssh root@145.79.0.77 "cat /root/citizen-reports/server/dist/index.html | grep 'href.*css'"
```

**✅ Éxito:** Ve `href="/assets/index-XXXXX.css"` con hash nuevo (diferente al anterior)

**❌ Fallo:** SCP no transfirió bien el `index.html`

---

### 5️⃣ PROBAR EN NAVEGADOR (2-3 seg)
```
1. Abrir: http://145.79.0.77:4000/
2. Presionar: Ctrl+Shift+R (o Cmd+Shift+R en Mac)
3. Ver cambios
```

**✅ Éxito:** Ve los cambios CSS/JS nuevos

**❌ Fallo:** Aún ves versión anterior
   - Intenta hard refresh otra vez
   - Abre DevTools (F12) → Network → chequea que carga CSS nuevo

---

## 🔁 Workflow Visual

```
LOCAL (tu PC)          SSH COMMANDS           SERVIDOR (145.79.0.77)
═════════════════      ═════════════════      ═════════════════════

client/src/
  └─ App.jsx ─────┐
  └─ styles.css ─┤
                 └──→ npm run build
                      └─→ client/dist/
                          ├─ index.html
                          └─ assets/
                              ├─ index-NEW.css  ◄─┐
                              └─ index-NEW.js   ◄─┤
                                                  │
                              scp -r dist/*  ────→│
                                                  │
                                              /root/citizen-reports/
                                              server/dist/
                                                ├─ index.html
                                                └─ assets/
                                                    ├─ index-NEW.css ✓
                                                    └─ index-NEW.js  ✓
                                                    
                                              pm2 restart
                                                ↓
                                              SERVIDOR SIRVIENDO
                                              CAMBIOS NUEVOS ✓
```

---

## 📊 Tiempos

| Paso | Tiempo | Acción |
|------|--------|--------|
| Build | 10-15s | Vite compilando |
| Copy | 5-10s | SCP transferencia |
| Restart | 2-5s | PM2 reinicia |
| Browser | 2-3s | Hard refresh |
| **TOTAL** | **~30s** | ⚡ Deployment completo |

---

## 🆘 Errores Comunes

### "scp: command not found"
➜ Instalaste SCP? (Viene con Git Bash o WSL)  
➜ Usa: `scoop install openssh` o instala Git Bash

### "Permission denied (publickey,password)"
➜ Contraseña de root incorrecta  
➜ O SSH key no configurada

### "Build succeeded but no dist/"
➜ Estás en carpeta equivocada  
➜ Must be: `c:\PROYECTOS\Jantetelco\client`  
➜ Check: `pwd` (powershell: `(pwd).Path`)

### "Veo cambios en local pero no en servidor"
➜ No hiciste `npm run build`  
➜ O el build falló (hay errores)  
➜ O SCP no copió bien (revisa salida)

### "Cambios no se ven en navegador"
➜ **CASI SIEMPRE:** Falta hard refresh  
➜ Presiona: `Ctrl+Shift+R` (Windows) o `Cmd+Shift+R` (Mac)  
➜ O abre DevTools (F12) → Settings → "Disable cache (while DevTools is open)"

### "PM2 status muestra error"
```powershell
# Ver logs detallados
ssh root@145.79.0.77 "pm2 logs citizen-reports --lines 50"

# Si no reinicia, parar y empezar manualmente
ssh root@145.79.0.77 "pm2 stop citizen-reports"
ssh root@145.79.0.77 "cd /root/citizen-reports && pm2 start server/server.js --name citizen-reports"
```

---

## 🔐 Credenciales

**Host:** `145.79.0.77`  
**User:** `root`  
**SSH Port:** 22  
**Path App:** `/root/citizen-reports/`  
**Port HTTP:** 4000  
**URL:** `http://145.79.0.77:4000/`

---

## 📝 Comandos Útiles

```powershell
# Ver estado del servidor
ssh root@145.79.0.77 "pm2 status"

# Ver últimos 50 logs
ssh root@145.79.0.77 "pm2 logs citizen-reports --lines 50"

# Revisar espacio en disco
ssh root@145.79.0.77 "df -h"

# Listar archivos en dist/
ssh root@145.79.0.77 "ls -lah /root/citizen-reports/server/dist/"

# Ver el CSS que se está sirviendo
ssh root@145.79.0.77 "curl http://localhost:4000/assets/index-*.css | head -20"
```

---

## 🎓 Notas Importantes

- ⚠️ **El hash CSS/JS cambia cada build** → Es normal
- ⚠️ **`index.html` siempre tiene referencias a los hashes nuevos** → No editar a mano
- ✅ **Vite minifica y optimiza** → Archivos son pequeños (~20KB CSS, ~700KB JS)
- ✅ **PM2 reinicia sin downtime** → El servidor sigue respondiendo
- ✅ **SCP sobrescribe automáticamente** → No necesitas borrar viejos archivos

---

## 🚀 Flujo Típico Diario

**Por la mañana:**
```powershell
# Hago cambios en App.jsx y styles.css
# ...edito en VS Code...
# Guardo cambios

# Compilar
cd c:\PROYECTOS\Jantetelco\client && npm run build

# Una sola línea lo hace todo automáticamente:
scp -r c:\PROYECTOS\Jantetelco\client\dist/* root@145.79.0.77:/root/citizen-reports/server/dist/ ; ssh root@145.79.0.77 "cd /root/citizen-reports && pm2 restart citizen-reports && sleep 1 && pm2 status"

# Abrir navegador
# http://145.79.0.77:4000/
# Ctrl+Shift+R
# ✅ Listo
```

**Eso es todo.**

---

**Última actualización:** Octubre 31, 2025  
**Propósito:** Quick reference para deployment rápido  
**Estado:** ✅ Listo para usar
