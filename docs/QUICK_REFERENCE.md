# 🚀 Quick Reference - Production Operations
**citizen-reports** - Links y comandos de referencia rápida

---

## 🌐 URLs Importantes

| Servicio | URL | Descripción |
|----------|-----|-----------|
| **Aplicación** | https://reportes.progressiagroup.com | Plataforma principal (Reportes Ciudadanos) |
| **API** | https://reportes.progressiagroup.com/api/reportes | Endpoint para listar reportes |
| **GitHub** | https://github.com/PROGRESSIAGLOBALGROUP/citizen-reports | Código fuente |
| **Servidor Web** | https://easypanel.145.79.0.77 | Panel de control (Traefik + Docker) |
| **Monitoreo** | UptimeRobot (por configurar) | Alertas de uptime |

---

## 🔐 Acceso Servidor

```bash
# SSH al servidor de producción
ssh root@145.79.0.77

# Una vez dentro:
cd /root/citizen-reports
```

---

## 🐳 Comandos Docker Útiles

### Status y Logs

```bash
# Ver si container está running
docker ps | grep citizen-reports

# Ver todos los containers
docker ps -a

# Ver logs en vivo
docker logs -f citizen-reports-app

# Ver últimas 50 líneas
docker logs --tail=50 citizen-reports-app

# Ver logs con timestamps
docker logs --timestamps citizen-reports-app
```

### Control de Servicios

```bash
# Reiniciar container
docker compose restart citizen-reports-app

# Detener container
docker compose stop citizen-reports-app

# Iniciar container
docker compose start citizen-reports-app

# Reconstruir e iniciar
docker compose down
docker compose up -d --build

# Ver estado del container
docker stats citizen-reports-app --no-stream
```

### Database

```bash
# Conectar a SQLite
docker exec -it citizen-reports-app sqlite3 /app/server/data.db

# Ver tablas
sqlite> .tables

# Contar reportes
sqlite> SELECT COUNT(*) FROM reportes;

# Salir
sqlite> .exit
```

---

## 📊 Monitoreo y Validación

### Health Check Completo

```bash
# Script de diagnóstico completo
bash /root/citizen-reports/scripts/production-health-check.sh
```

### Tests Rápidos

```bash
# DNS resolution
nslookup reportes.progressiagroup.com 8.8.8.8

# HTTPS conectividad
curl -I https://reportes.progressiagroup.com

# API responding
curl -s https://reportes.progressiagroup.com/api/reportes | jq .

# HTML validation
curl -s https://reportes.progressiagroup.com | grep -o "PROGRESSIA\|Jantetelco"

# Port checking
nc -zv 145.79.0.77 80
nc -zv 145.79.0.77 443
nc -zv 145.79.0.77 4000  # Interno
```

---

## 🔄 Auto-Recovery Setup

### Agregar Cron Job (una sola vez)

```bash
ssh root@145.79.0.77

# Editar crontab
crontab -e

# Agregar esta línea:
*/5 * * * * bash /root/citizen-reports/scripts/production-recovery.sh

# Guardar (Ctrl+X, Y, Enter)

# Verificar que se agregó
crontab -l
```

### Ver Logs del Auto-Recovery

```bash
tail -f /var/log/citizen-reports-monitor.log
```

---

## 🚑 Troubleshooting Rápido

| Problema | Comando |
|----------|---------|
| **502 Bad Gateway** | `docker compose restart citizen-reports-app` |
| **Logs muestra error** | `docker logs --tail=100 citizen-reports-app \| grep -i error` |
| **Alto CPU** | `docker stats citizen-reports-app --no-stream` |
| **Alto memoria** | `docker exec citizen-reports-app free -h` |
| **Base de datos corrupta** | `docker exec citizen-reports-app sqlite3 /app/server/data.db "PRAGMA integrity_check;"` |
| **Certificado SSL** | `openssl s_client -connect reportes.progressiagroup.com:443 -showcerts` |
| **DNS** | `nslookup reportes.progressiagroup.com 8.8.8.8` |

---

## 📋 Procedimiento de Deployment

### Tras cambios en GitHub

```bash
ssh root@145.79.0.77
cd /root/citizen-reports

# Traer cambios
git pull origin main

# Verificar cambios
git log --oneline -5

# Reconstruir si hay cambios de código
docker compose down
docker compose up -d --build

# Verificar
sleep 10
curl -I https://reportes.progressiagroup.com/api/reportes
```

---

## 📈 Métricas Importantes

```bash
# Tamaño de base de datos
du -sh /root/citizen-reports/server/data.db

# Espacio en disco
df -h /

# Memoria disponible
free -h

# CPU
top -bn1 | head -20

# Uptime del servidor
uptime
```

---

## 🔗 Documentación

| Documento | Ubicación | Cuándo usar |
|-----------|-----------|-----------|
| **Incident Report** | `docs/INCIDENT_REPORT_2025-11-14.md` | Referencia del incidente actual |
| **Monitoring Plan** | `docs/PRODUCTION_MONITORING_RECOVERY_PLAN.md` | Entender la estrategia de monitoreo |
| **Troubleshooting** | `docs/PRODUCTION_TROUBLESHOOTING_RUNBOOK.md` | Resolver problemas específicos |
| **Deployment Docs** | `docs/DEPLOYMENT_PRODUCTION_COMPLETE_2025-11-11.md` | Cómo se configuró todo |

---

## 📞 En Caso de Emergencia

### Escalation

1. **Nivel 1:** Ejecutar health check
   ```bash
   bash /root/citizen-reports/scripts/production-health-check.sh
   ```

2. **Nivel 2:** Intentar reinicio
   ```bash
   docker compose restart citizen-reports-app
   sleep 10 && curl -I https://reportes.progressiagroup.com
   ```

3. **Nivel 3:** Ver logs detallados
   ```bash
   docker logs --tail=100 citizen-reports-app
   ```

4. **Nivel 4:** Contactar DevOps/Developer
   - Proporcionar: logs, memoria, CPU, últimos cambios

---

## 🎯 SLA Target

| Métrica | Target | Estado |
|---------|--------|--------|
| **Uptime** | 99.5% | 📊 Por monitorear |
| **MTTR (Media a reparar)** | < 5 min | 🎯 Objetivo con auto-restart |
| **MTBF (Media entre fallos)** | > 30 días | 📈 En mejora |
| **Tiempo de respuesta API** | < 500ms | ✅ Típicamente < 100ms |

---

## 📅 Mantenimiento Programado

| Frecuencia | Tarea |
|-----------|------|
| Diario | Revisar logs (`tail -f /var/log/citizen-reports-monitor.log`) |
| Semanal | Validar uptime en UptimeRobot |
| Mensual | Revisar performance y optimizar si es necesario |
| Trimestral | Backup y test de disaster recovery |

---

**Última actualización:** 14 Noviembre 2025  
**Próxima revisión:** 30 Noviembre 2025

