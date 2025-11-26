# 🚀 Sistema de Monitoreo Automático - citizen-reports

Sistema robusto para prevenir caídas de servidor y garantizar disponibilidad 24/7 de la aplicación citizen-reports.

## 📋 Características

- **Monitoreo Automático**: Verifica constantemente la salud de los servicios
- **Reinicio Inteligente**: Reinicia servicios solo cuando es necesario
- **Recuperación Avanzada**: Maneja errores comunes automáticamente
- **Logging Completo**: Registra todos los eventos para análisis
- **Configuración Flexible**: Personalizable vía JSON
- **Interfaz Simple**: Scripts de PowerShell fáciles de usar

## 🛠️ Instalación Rápida

```powershell
# 1. Configurar el sistema
.\scripts\setup-monitor.ps1 -TestSetup -CreateShortcuts

# 2. Iniciar servicios con monitoreo
.\start-citizen-reports.ps1 -Monitor

# 3. O iniciar en background
.\start-citizen-reports.ps1 -Monitor -Background
```

## 📊 Comandos Principales

### Inicio y Control
```powershell
# Iniciar servicios normales
.\start-citizen-reports.ps1

# Iniciar con monitoreo automático
.\start-citizen-reports.ps1 -Monitor

# Iniciar con limpieza previa
.\start-citizen-reports.ps1 -Clean

# Ver estado actual
.\start-citizen-reports.ps1 -Status

# Detener todo
.\start-citizen-reports.ps1 -Stop
```

### Recuperación Manual
```powershell
# Recuperación completa
.\scripts\server-recovery.ps1 -Force

# Recuperación con limpieza
.\scripts\server-recovery.ps1 -CleanStart -Force

# Solo verificar puertos
.\scripts\server-recovery.ps1 -CheckPorts
```

### Monitoreo Dedicado
```powershell
# Solo monitoreo (modo verbose)
.\scripts\server-monitor.ps1 -Verbose

# Monitoreo con configuración personalizada
.\scripts\server-monitor.ps1 -CheckInterval 60 -MaxRestarts 10
```

## ⚙️ Configuración

Edita `scripts/monitor-config.json` para personalizar:

```json
{
  "monitoring": {
    "checkInterval": 30,           // Segundos entre checks
    "maxConsecutiveRestarts": 5,   // Máximo reinicios seguidos
    "restartCooldownMinutes": 5    // Pausa tras múltiples reinicios
  },
  "services": {
    "backend": {
      "url": "http://localhost:4000/api/reportes/tipos",
      "port": 4000,
      "startupDelay": 5
    },
    "frontend": {
      "url": "http://localhost:5173",
      "port": 5173,
      "startupDelay": 8
    }
  }
}
```

## 📁 Estructura de Archivos

```
scripts/
├── server-monitor.ps1      # Monitor principal con auto-restart
├── server-recovery.ps1     # Recuperación y diagnóstico
├── setup-monitor.ps1       # Instalación y configuración
└── monitor-config.json     # Configuración del sistema

start-citizen-reports.ps1        # Script principal de inicio
server-monitor.log          # Log de eventos
server-monitor.pid          # PID del monitor activo
```

## 🔧 Funcionalidades Avanzadas

### Detección Automática de Problemas
- **Puertos ocupados**: Libera automáticamente puertos en conflicto
- **Procesos zombie**: Elimina procesos Node.js colgados
- **Base de datos corrupta**: Detecta y repara archivos SQLite
- **Dependencias faltantes**: Verifica Node.js, NPM y archivos críticos

### Sistema de Logs
- **Rotación automática**: Limita tamaño de logs (10MB por defecto)
- **Niveles de log**: INFO, WARN, ERROR, SUCCESS
- **Timestamps precisos**: Formato ISO para análisis
- **Logs de colores**: Salida visual mejorada en consola

### Protección contra Loops
- **Límite de reinicios**: Máximo 5 reinicios consecutivos
- **Cooldown period**: Pausa de 5 minutos tras múltiples fallos
- **Reset automático**: Contador se reinicia tras período estable

## 🚨 Solución de Problemas

### El monitor no inicia
```powershell
# Verificar permisos
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# Probar instalación
.\scripts\setup-monitor.ps1 -TestSetup
```

### Servicios no responden
```powershell
# Recuperación forzada
.\scripts\server-recovery.ps1 -CleanStart -Force

# Verificar puertos manualmente
netstat -ano | findstr ":4000\|:5173"
```

### Frontend no carga
```powershell
# Limpiar caché y reiniciar
.\start-citizen-reports.ps1 -Clean

# Verificar dependencias npm
cd client && npm install
```

### Backend da errores
```powershell
# Verificar base de datos
cd server && npm run init

# Logs detallados
cd server && node server.js
```

## 📈 Monitoreo de Rendimiento

El sistema registra automáticamente:
- ✅ **Uptime** de servicios
- ⏱️ **Tiempo de respuesta** de APIs
- 🔄 **Número de reinicios**
- 💾 **Estado de base de datos**
- 🌐 **Conectividad de red**

## 🎯 URLs de Acceso

Una vez iniciado, accede a:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/api/reportes/tipos

## 📞 Accesos Directos

Si usaste `-CreateShortcuts`, encontrarás en tu escritorio:
- 🚀 **Iniciar citizen-reports**: Inicio normal
- 🔍 **citizen-reports con Monitor**: Inicio con monitoreo
- ⏹️ **Detener citizen-reports**: Parada limpia

## 🎉 ¡Listo!

Tu sistema citizen-reports ahora es altamente resistente a caídas y se auto-recupera automáticamente. El monitoreo continuo garantiza disponibilidad 24/7 para los ciudadanos de citizen-reports.

---
*Sistema desarrollado para máxima confiabilidad en entornos de producción cívico-tecnológicos.*