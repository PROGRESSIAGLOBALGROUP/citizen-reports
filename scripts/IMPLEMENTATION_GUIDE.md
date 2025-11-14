# 🚀 Production Prevention Plan - Implementation Guide

**citizen-reports** | 14 Noviembre 2025

## 🎯 Objetivo

Implementar múltiples capas de protección para prevenir futuros downtime similares al incidente de hoy (502 Bad Gateway).

## ⚡ Ejecución Rápida (15 minutos)

### Paso 1: SSH al servidor
```bash
ssh root@145.79.0.77
```

### Paso 2: Ejecutar el script maestro (TODO en uno)
```bash
cd /root/citizen-reports
bash scripts/implement-prevention-plan.sh
```

Este script automáticamente:
- ✅ Hace backup de configuración actual
- ✅ Implementa health checks en Docker
- ✅ Configura cron jobs (auto-recovery + backups + log rotation)
- ✅ Valida que todo funciona correctamente
- ✅ Genera reporte final

**Tiempo estimado:** 10-15 minutos

---

## 📋 Qué Implementa

### 1. Health Checks en Docker (Automático - 30s)
```dockerfile
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:4000/api/reportes"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```
- Docker verifica cada 30 segundos si la app está viva
- Después de 3 fallos, marca container como unhealthy
- Requiere restart policy

### 2. Restart Policy (Automático)
```yaml
restart: unless-stopped
```
- Docker reinicia automáticamente el container si se cae
- Excepto si lo detienes manualmente

### 3. Cron Job - Auto-Recovery (Cada 5 minutos)
```bash
*/5 * * * * bash /root/citizen-reports/scripts/production-recovery.sh
```
- Verifica cada 5 minutos si container está running
- Si está down: reinicia automáticamente
- Registra todo en `/var/log/citizen-reports-monitor.log`

### 4. Database Backups (Diariamente a las 2 AM)
```bash
0 2 * * * bash /root/citizen-reports/scripts/backup-database.sh
```
- Backup automático cada noche
- Mantiene últimos 30 backups
- Verifica integridad de cada backup
- Limpia backups antiguos

### 5. Log Rotation (Diariamente a las 3 AM)
```bash
0 3 * * * logrotate -f /etc/logrotate.d/citizen-reports
```
- Rota logs automáticamente
- Mantiene 30 días de historial
- Comprime logs viejos

### 6. External Monitoring (Manual - Ver UPTIMEROBOT_SETUP_GUIDE.sh)
- UptimeRobot chequea cada 5 minutos desde internet
- Alertas por email si está down
- Alertas por SMS (plan premium)

---

## 📊 Capas de Protección

```
┌─────────────────────────────────────────────────────────────────┐
│              🌐 INTERNET (UptimeRobot chequea)                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │ (Alertas por Email/SMS)
                           ▼
        ┌─────────────────────────────────────────┐
        │  🔄 CRON JOB (cada 5 min)              │
        │  production-recovery.sh                 │
        │  - Verifica si container está running  │
        │  - Si está down → Reinicia            │
        └─────────────────────────────────────────┘
                           │
                           ▼
        ┌─────────────────────────────────────────┐
        │  🐳 DOCKER DAEMON                      │
        │  - Health checks cada 30s              │
        │  - Restart policy: unless-stopped     │
        │  - Detecta container muerto           │
        └─────────────────────────────────────────┘
                           │
                           ▼
        ┌─────────────────────────────────────────┐
        │  📦 APPLICATION (Node.js)              │
        │  - Escucha en puerto 4000              │
        │  - Responde /api/reportes             │
        │  - Log all requests y errores          │
        └─────────────────────────────────────────┘
                           │
                           ▼
        ┌─────────────────────────────────────────┐
        │  📁 DATABASE (SQLite)                  │
        │  - Backup automático cada noche       │
        │  - Integridad verificada              │
        │  - 30 días de retención               │
        └─────────────────────────────────────────┘
```

**Tiempo de detección + recuperación: < 6 minutos**

---

## 🔧 Configuración Manual (Si no ejecutas el script maestro)

### Opción 1: Solo Auto-Recovery (5 min)
```bash
# Agregar a crontab:
crontab -e
# Pegar:
*/5 * * * * bash /root/citizen-reports/scripts/production-recovery.sh
```

### Opción 2: Solo Database Backups (5 min)
```bash
# Agregar a crontab:
crontab -e
# Pegar:
0 2 * * * bash /root/citizen-reports/scripts/backup-database.sh
```

### Opción 3: Todo Manual (30 min)
Ver: `docs/PRODUCTION_MONITORING_RECOVERY_PLAN.md`

---

## ✅ Verificación

Después de ejecutar el script, verificar:

```bash
# 1. Cron jobs configurados
crontab -l

# 2. Docker health
docker inspect citizen-reports-app --format='{{.State.Health.Status}}'

# 3. API respondiendo
curl -I https://reportes.progressiagroup.com/api/reportes

# 4. Logs de auto-recovery
tail -f /var/log/citizen-reports-monitor.log

# 5. Database backups
ls -lh /root/citizen-reports/backups/
```

---

## 🚨 Si Algo Falla

### El script se detiene por error
```bash
# Ver qué salió mal
tail -50 /var/log/citizen-reports-implementation.log

# O ejecutar manualmente:
cd /root/citizen-reports
docker compose down
docker compose up -d --build
```

### Docker health muestra "unhealthy"
```bash
# Ver logs del container
docker logs citizen-reports-app

# Reiniciar
docker compose restart citizen-reports-app

# Esperar 40s (start_period) y verificar
docker inspect citizen-reports-app --format='{{.State.Health.Status}}'
```

### Cron jobs no ejecutándose
```bash
# Verificar que están en crontab
crontab -l

# Ver logs de cron
grep CRON /var/log/syslog | tail -20

# O ejecutar manualmente:
bash /root/citizen-reports/scripts/production-recovery.sh
bash /root/citizen-reports/scripts/backup-database.sh
```

---

## 📈 Próximos Pasos (Después de Implementar)

### ESTA SEMANA:
- [ ] Ejecutar `implement-prevention-plan.sh`
- [ ] Verificar cron jobs funcionando
- [ ] Configurar UptimeRobot (ver UPTIMEROBOT_SETUP_GUIDE.sh)

### ESTE MES:
- [ ] Revisar logs de auto-recovery para validar que funciona
- [ ] Test: Detener manualmente container y verificar que se reinicia
- [ ] Revisar performance y optimizar si es necesario

### PRÓXIMOS 2 MESES:
- [ ] Múltiples replicas (load balancing)
- [ ] APM (New Relic / Sentry)
- [ ] Disaster recovery testing

---

## 🔗 Scripts Incluidos

| Script | Propósito | Ejecuta |
|--------|----------|---------|
| `implement-prevention-plan.sh` | Master script - ejecutar TODO de una vez | Manual (1x) |
| `production-recovery.sh` | Auto-restart si está down | Cron (cada 5 min) |
| `backup-database.sh` | Backup automático | Cron (02:00 AM) |
| `production-health-check.sh` | Diagnóstico manual | Manual (on-demand) |
| `UPTIMEROBOT_SETUP_GUIDE.sh` | Guía de configuración de alertas externas | Referencia |

---

## 📞 Support

Si necesitas ayuda:

1. **Error en ejecución:** Ver `/var/log/citizen-reports-implementation.log`
2. **Container no responde:** Ver `docker logs citizen-reports-app`
3. **Cron no funciona:** Verificar `crontab -l` y `/var/log/syslog`

---

## 📊 Métricas de Éxito

Después de implementar, esperas ver:

✅ **Uptime:** 99.5%+ (máximo 3.6 horas downtime/mes)  
✅ **MTTR (Mean Time To Recover):** < 5 minutos  
✅ **Detection time:** < 1 minuto (UptimeRobot)  
✅ **Alert time:** < 2 minutos (Email/SMS)  
✅ **Database backups:** 30 días de retención  
✅ **Logs:** 30 días de rotación

---

**Última actualización:** 14 Noviembre 2025  
**Estado:** ✅ Listo para implementar  
**Tiempo de ejecución:** 15 minutos
