# 🚀 Implementation Guide - Production Prevention

**citizen-reports.progressiagroup.com**  
**14 Noviembre 2025**

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Pre-requisitos](#pre-requisitos)
3. [Opción A: Deployment Remoto (Recomendado)](#opción-a-deployment-remoto)
4. [Opción B: Ejecución Manual en Servidor](#opción-b-ejecución-manual-en-servidor)
5. [Verificación Post-Implementación](#verificación-post-implementación)
6. [Testing de la Recuperación](#testing-de-la-recuperación)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Resumen Ejecutivo

Hay **DOS opciones** para implementar las medidas preventivas:

### Opción A: Deployment Remoto (MÁS FÁCIL)
- Ejecutas un comando desde tu máquina local
- El script automáticamente:
  - Conecta via SSH
  - Sube los scripts
  - Ejecuta la configuración completa

### Opción B: Manual en Servidor (CONTROL TOTAL)
- Te conectas al servidor manualmente
- Ejecutas los scripts paso a paso
- Más control pero más pasos

**RECOMENDADO:** Opción A (más rápida y menos propenso a errores)

---

## ✅ Pre-requisitos

### Para Opción A (Remoto):
```bash
# 1. Tener acceso SSH al servidor
ssh root@145.79.0.77
# Debe conectar sin errores

# 2. Si no tienes SSH key, asegúrate que `ssh-keygen` está instalado
ssh-keygen -t ed25519  # Si no tienes keys
```

### Para Ambas Opciones:
- Docker instalado en VPS
- Git actualizado en VPS
- 500MB libres en disco

---

## 🔵 Opción A: Deployment Remoto (RECOMENDADO)

### Paso 1: Desde tu máquina local, navega al repositorio
```bash
cd c:\PROYECTOS\citizen-reports
```

### Paso 2: Ejecuta el script de deployment remoto

**Sin SSH key específica (usa la predeterminada):**
```bash
bash scripts/deploy-prevention-remote.sh 145.79.0.77
```

**Con SSH key específica:**
```bash
bash scripts/deploy-prevention-remote.sh 145.79.0.77 ~/.ssh/id_rsa
```

### Paso 3: Verifica que todo funcionó
```bash
# El script te mostrará:
# ✅ SSH connection OK
# ✅ Scripts uploaded
# ✅ Prevention setup completed

# Verifica dashboard
ssh root@145.79.0.77 "bash /root/citizen-reports/scripts/dashboard.sh"
```

---

## 🟠 Opción B: Ejecución Manual en Servidor

### Paso 1: Conecta al servidor via SSH
```bash
ssh root@145.79.0.77
```

### Paso 2: Verifica la estructura de directorios
```bash
cd /root/citizen-reports
ls -la scripts/
# Debería mostrar:
# - production-recovery.sh
# - production-health-check.sh
# - setup-production-prevention.sh
```

### Paso 3: Si falta algo, descargalo desde GitHub
```bash
git pull origin main
# Esto trae todos los scripts nuevos
```

### Paso 4: Ejecuta el script de setup
```bash
bash /root/citizen-reports/scripts/setup-production-prevention.sh
```

### Paso 5: Espera a que complete (toma ~2-3 minutos)
El script mostrará:
```
✅ Auto-recovery cron job active (every 5 min)
✅ Database backup automation running (daily 2 AM)
✅ Log rotation configured (30 days)
✅ Health check dashboard ready
```

---

## 📊 Verificación Post-Implementación

### Verificación Rápida (30 segundos)

```bash
# Ejecuta el dashboard
bash /root/citizen-reports/scripts/dashboard.sh

# Debería mostrar:
# - Container status: Up X minutes
# - Memory usage: ~100-200MB
# - Database size: ~200KB
# - Recent logs: [timestamps]
```

### Verificación Completa (2 minutos)

```bash
# 1. Verifica que container está running
docker ps | grep citizen-reports

# 2. Verifica que API responde
curl -I http://localhost:4000/api/reportes
# Debe retornar HTTP 200

# 3. Verifica que cron jobs están configurados
crontab -l
# Debe mostrar dos líneas:
# */5 * * * * bash /root/citizen-reports/scripts/production-recovery.sh
# 0 2 * * * bash /root/citizen-reports/scripts/backup-database.sh

# 4. Verifica que backups existen
ls -lh /root/citizen-reports/backups/
# Debe mostrar al menos un backup con fecha actual

# 5. Verifica que logs se crean
tail -5 /var/log/citizen-reports-monitor.log
# Debe mostrar líneas recientes
```

---

## 🧪 Testing de la Recuperación

### Test 1: Verificar que Auto-Recovery Funciona (5 min)

```bash
# 1. Ver estado actual
docker ps | grep citizen-reports

# 2. Matar el container deliberadamente
docker kill citizen-reports-app

# 3. Verificar que está down
docker ps | grep citizen-reports  # No debe aparecer

# 4. Esperar 5 minutos (próximo cron job)
sleep 300

# 5. Verificar que se reinició automáticamente
docker ps | grep citizen-reports
# Debe mostrar "Up X seconds"

# 6. Verificar que API está disponible nuevamente
curl -I http://localhost:4000/api/reportes
# Debe retornar HTTP 200
```

### Test 2: Verificar que Backups se Crean (después de las 2 AM)

```bash
# Mañana a las 2 AM, verifica:
ls -lh /root/citizen-reports/backups/

# Debe haber un nuevo archivo:
# data-YYYYMMDD_020000.db

# Verifica el log
tail /var/log/citizen-reports-backup.log
```

### Test 3: Verificar que Logs se Rotan (después de 24h)

```bash
# Mañana, verifica que no hay un único log gigante:
ls -lh /var/log/citizen-reports-monitor.log*

# Debe mostrar:
# citizen-reports-monitor.log      (actual)
# citizen-reports-monitor.log.1.gz (ayer, comprimido)
```

---

## 🔧 Troubleshooting

### Problema: "SSH Connection Failed"

**Solución:**
```bash
# Verifica que puedes conectar manualmente
ssh root@145.79.0.77 "whoami"

# Si no funciona:
# 1. Verifica IP: ping 145.79.0.77
# 2. Verifica contraseña SSH
# 3. Verifica firewall
```

### Problema: "Scripts not found after upload"

**Solución:**
```bash
# Verifica que existen en tu máquina local
ls -la c:\PROYECTOS\citizen-reports\scripts\production-*.sh

# Si no existen, haz git pull:
cd c:\PROYECTOS\citizen-reports
git pull origin main
```

### Problema: "Cron job not created"

**Solución:**
```bash
# En el servidor, verifica crontab manualmente:
crontab -l

# Si está vacío, agrégalo manualmente:
crontab -e
# Pega estas dos líneas:
*/5 * * * * bash /root/citizen-reports/scripts/production-recovery.sh >> /var/log/citizen-reports-monitor.log 2>&1
0 2 * * * bash /root/citizen-reports/scripts/backup-database.sh
# Ctrl+X, Y, Enter para guardar
```

### Problema: "Backup directory doesn't exist"

**Solución:**
```bash
# En el servidor:
mkdir -p /root/citizen-reports/backups
chmod 755 /root/citizen-reports/backups
```

### Problema: "Permission denied" en los scripts

**Solución:**
```bash
# En el servidor:
chmod +x /root/citizen-reports/scripts/*.sh
chmod 755 /root/citizen-reports/scripts/production-recovery.sh
chmod 755 /root/citizen-reports/scripts/backup-database.sh
```

---

## 📈 Después de la Implementación

### Día 1: Monitoreo Activo
```bash
# Ver logs cada hora
ssh root@145.79.0.77 "tail -10 /var/log/citizen-reports-monitor.log"

# Debería mostrar líneas como:
# [HH:MM:SS] ✅ Service is healthy (API responding with 200)
```

### Semana 1: Testing
- Test: Matar container y verificar que se reinicia
- Test: Verificar que API sigue respondiendo
- Test: Revisar logs para problemas

### Mes 1: Optimización
- Revisar performance (memoria, CPU)
- Analizar logs para patrones
- Ajustar configuración si es necesario

---

## 📞 Soporte

Si algo no funciona:

1. **Verifica los logs:**
   ```bash
   tail -50 /var/log/citizen-reports-monitor.log
   ```

2. **Verifica estado del container:**
   ```bash
   docker logs --tail=50 citizen-reports-app
   ```

3. **Verifica cron jobs:**
   ```bash
   crontab -l
   ```

4. **Ejecuta health check manual:**
   ```bash
   bash /root/citizen-reports/scripts/production-health-check.sh
   ```

---

## ✅ Checklist de Implementación

- [ ] Pre-requisitos verificados (SSH, Docker, Git)
- [ ] Script de deployment descargado
- [ ] Option A ejecutado O scripts manuales corridos
- [ ] Dashboard muestra container "Up"
- [ ] API responde con HTTP 200
- [ ] Cron jobs listados con `crontab -l`
- [ ] Primer backup creado en `/root/citizen-reports/backups/`
- [ ] Logs siendo registrados en `/var/log/citizen-reports-monitor.log`

---

**Estimado:** 10-15 minutos para Opción A, 20-30 minutos para Opción B  
**Creado:** 14 Noviembre 2025

