# 📚 Deployment Documentation Index

## 🚀 Para Empezar AHORA

**Tienes 30 segundos y quieres hacerlo rápido:**
→ Lee [`DEPLOYMENT_QUICK_START.md`](./DEPLOYMENT_QUICK_START.md)

**Tienes 2 minutos y quieres entender cómo funciona:**
→ Lee [`DEPLOYMENT_PROCESS.md`](./DEPLOYMENT_PROCESS.md) (Sección "Procedimiento Detallado")

**Quieres automatizarlo completamente:**
→ Usa el script: `.\deploy.ps1` desde la raíz del proyecto

---

## 📖 Documentos Disponibles

### 1. **DEPLOYMENT_QUICK_START.md** ⚡ (3 minutos)
**Propósito:** Quick reference. Solo lo esencial.

- ✅ Los 5 pasos en código PowerShell
- ✅ Checklist pre-deployment
- ✅ Errores comunes y soluciones rápidas
- ✅ Tabla de tiempos
- ✅ Comandos útiles one-liners

**Lee esto si:** Necesitas hacerlo YA y no tienes tiempo

---

### 2. **DEPLOYMENT_PROCESS.md** 📘 (15 minutos)
**Propósito:** Documentación completa y detallada. REFERENCIA DEFINITIVA.

**Incluye:**
- Explicación del flujo general
- Cada paso con ejemplos reales
- Por qué se hace cada cosa
- Autenticación SSH y keys
- Troubleshooting detallado (7 problemas comunes)
- Script PowerShell automático (`deploy.ps1`)
- Tabla de referencia rápida
- Workflow completo ejemplo

**Lee esto si:** 
- Quieres entender cómo funciona el deployment
- Algo falló y necesitas diagnosticar
- Quieres configurar SSH keys
- Eres nuevo en el proyecto

---

### 3. **deploy.ps1** ⚙️ (Automático)
**Propósito:** Script PowerShell que automatiza TODO.

**Lo que hace:**
1. ✅ Compila el cliente con Vite
2. ✅ Copia archivos al servidor con SCP
3. ✅ Reinicia PM2
4. ✅ Valida que todo esté en su lugar
5. ✅ Muestra la URL para abrir

**Uso:**
```powershell
# Básico
.\deploy.ps1

# Con mensaje personalizado
.\deploy.ps1 -Message "Añadido responsive mobile-first"

# Sin compilar (usa dist/ existente)
.\deploy.ps1 -SkipBuild

# Sin validación (es más rápido)
.\deploy.ps1 -SkipValidation
```

**Ventajas:**
- ✅ 0 errores manuales
- ✅ Colores para ver qué pasó
- ✅ Validación automática
- ✅ Los 30 segundos se convierten en "presiona un botón"

---

### 4. **README.md** 📋
**En la sección:** "Deployment to Production (30 seconds)"

Referencia rápida con links a estos documentos.

---

## 🎯 Decisión Rápida: ¿Cuál Leo?

```
¿Tengo cuánto tiempo?
│
├─→ 30 segundos  → DEPLOYMENT_QUICK_START.md (TL;DR section)
│
├─→ 2 minutos    → DEPLOYMENT_QUICK_START.md (completo)
│
├─→ 5 minutos    → Usa deploy.ps1 (sin leer)
│
├─→ 15 minutos   → DEPLOYMENT_PROCESS.md (sección Procedimiento)
│
└─→ 1 hora       → DEPLOYMENT_PROCESS.md (TODO completo)
```

---

## 🔗 Relación Entre Documentos

```
README.md
  └─→ Sección "Deployment to Production"
      ├─→ DEPLOYMENT_QUICK_START.md (referencia rápida)
      │
      ├─→ DEPLOYMENT_PROCESS.md (guía completa)
      │   ├─→ Paso 1: Compilar
      │   ├─→ Paso 2: Copiar (SCP)
      │   ├─→ Paso 3: Reiniciar (PM2)
      │   ├─→ Paso 4: Validar
      │   ├─→ Paso 5: Probar
      │   ├─→ Script PowerShell (deploy.ps1)
      │   └─→ Troubleshooting
      │
      └─→ deploy.ps1 (automatizado)
```

---

## ⚡ Flujo Recomendado

### Primera vez (eres nuevo)
1. Lee completo `DEPLOYMENT_PROCESS.md`
2. Lee `DEPLOYMENT_QUICK_START.md`
3. Entiende qué hace `deploy.ps1`
4. Haz tu primer deployment manualmente (ejecutar los 5 pasos)
5. Luego usa `deploy.ps1` para hacerlo automático

### Deployments siguientes
1. `.\deploy.ps1 -Message "Tu mensaje"`
2. Abre navegador en `http://145.79.0.77:4000/`
3. Presiona `Ctrl+Shift+R` (hard refresh)
4. ✅ Listo

### Si algo falla
1. Lee `DEPLOYMENT_PROCESS.md` sección "Troubleshooting"
2. O usa `DEPLOYMENT_QUICK_START.md` tabla de errores
3. Ejecuta el comando de fix
4. Intenta de nuevo

---

## 📊 Características de Cada Documento

| Característica | QUICK_START | PROCESS | deploy.ps1 |
|---|---|---|---|
| Código listo para copiar | ✅ | ✅ | ✅ |
| Explicación detallada | ❌ | ✅ | ❌ |
| Troubleshooting | ✅ | ✅ | ❌ |
| Automatizado | ❌ | ❌ | ✅ |
| Requiere lectura | ✅ | ✅ | ❌ |
| Tiempo total | 2 min | 15 min | 30 seg |
| Ideal para | Rápido | Aprender | Automatizar |

---

## 🔐 Credenciales

Todos los documentos usan estas credenciales (cambia si es necesario):

```
Host:     145.79.0.77
User:     root
Port:     22 (SSH default)
HTTP:     4000
App:      /root/citizen-reports/
URL:      http://145.79.0.77:4000/
```

---

## 🛠️ Para Mantener Estos Documentos

**Cuando changes algo en el deployment:**

1. Actualiza el código en `deploy.ps1`
2. Actualiza los ejemplos en `DEPLOYMENT_PROCESS.md`
3. Actualiza el quickstart en `DEPLOYMENT_QUICK_START.md`
4. Actualiza este índice si agregas más documentos

**Notas importantes:**
- ✅ Los pasos NUNCA cambian (build → copy → restart es fundamental)
- ✅ Solo cambiarán las rutas, credenciales, o nombre del proceso
- ✅ Los hashes de CSS/JS cambian cada build (es normal)
- ✅ El hard refresh en navegador es SIEMPRE necesario

---

## ✅ Checklist: Estás Listo Para Deployar

- [ ] Leíste al menos `DEPLOYMENT_QUICK_START.md`
- [ ] Entiendes los 5 pasos
- [ ] SSH funciona: `ssh root@145.79.0.77 "echo test"`
- [ ] Tienes los archivos sin cambios sin guardar
- [ ] Entiendes que `npm run build` es necesario
- [ ] Sabes hacer hard refresh en navegador (Ctrl+Shift+R)

---

**Última actualización:** Octubre 31, 2025  
**Propósito:** Índice de documentación de deployment  
**Estado:** ✅ Completo y listo
