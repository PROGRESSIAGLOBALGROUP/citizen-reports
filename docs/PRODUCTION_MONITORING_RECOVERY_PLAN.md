# 🚨 Production Monitoring & Recovery Plan
**citizen-reports** - Plataforma de Reportes Ciudadanos

**Fecha:** 14 Noviembre 2025  
**Versión:** 1.0  
**Última actualización:** $(date)

---

## 📋 Tabla de Contenidos

1. [Incidente Identificado](#incidente-identificado)
2. [Plan de Monitoreo](#plan-de-monitoreo)
3. [Estrategia de Auto-recuperación](#estrategia-de-auto-recuperación)
4. [Procedimientos de Respuesta](#procedimientos-de-respuesta)
5. [Preventiva a Largo Plazo](#preventiva-a-largo-plazo)

---

## 🔴 Incidente Identificado

### Problema
- **Fecha Detectada:** 14 Noviembre 2025
- **Impacto:** 502 Bad Gateway en https://reportes.progressiagroup.com
- **Causa Raíz:** Proceso Node.js (citizen-reports-app) no está respondiendo en puerto 4000
- **Severidad:** 🔴 CRÍTICO - Plataforma no operacional

### Síntomas
```
❌ Reverse proxy (Traefik) activo: Puerto 443 respondiendo
❌ Backend Node.js caído: Docker container no responde
❌ API retornando: 502 Bad Gateway
```

### Diagnóstico Realizado
```bash
# Test de conectividad
Test-NetConnection -ComputerName 145.79.0.77 -Port 4000
# Resultado: TcpTestSucceeded: False ❌

# Test de proxy
curl -I https://145.79.0.77/api/reportes
# Resultado: HTTP/2 502 Bad Gateway ❌

# Ping OK, pero servicio down
Test-Connection -ComputerName 145.79.0.77 -Count 1
# Resultado: PingSucceeded: True ✅
```

---

## 📊 Plan de Monitoreo

### 1. Health Check Manual (Diario)

**Frecuencia:** Una vez por día (en horario laboral)  
**Script:** `/scripts/production-health-check.sh`

**Ejecutar:**
```bash
ssh root@145.79.0.77 "bash /root/citizen-reports/scripts/production-health-check.sh"
```

**Qué verifica:**
- ✅ DNS resolution (nslookup)
- ✅ Puerto 443 abierto
- ✅ Docker daemon activo
- ✅ Container citizen-reports-app running
- ✅ HTTP 200 response
- ✅ API responding
- ✅ Disk space < 90%
- ✅ Memory usage < 90%
- ✅ Traefik running

**Acciones si falla:**
- 🔴 CRÍTICO: Contactar administrador
- 🟡 ADVERTENCIA: Reintentar script
- 🟢 OK: Registrar en logs

### 2. Health Check Automatizado (Cada 5 minutos)

**Frecuencia:** Continuo (cron job cada 5 minutos)  
**Script:** `/scripts/production-recovery.sh`

**Configuración cron en VPS:**
```bash
# SSH al servidor
ssh root@145.79.0.77

# Editar crontab
crontab -e

# Agregar línea:
*/5 * * * * bash /root/citizen-reports/scripts/production-recovery.sh

# Guardar (Ctrl+X, Y, Enter)
```

**Qué hace:**
1. Verifica si container está running
2. Si está down → Reinicia automáticamente
3. Si está up → Verifica que API responde (HTTP 200)
4. Si API falla 3+ veces → Reinicia
5. Registra todo en `/var/log/citizen-reports-monitor.log`

### 3. Uptime Monitoring (Servicio Externo)

**Recomendado:** UptimeRobot, Pingdom o similar

**Configuración:**
```
URL: https://reportes.progressiagroup.com/api/reportes
Method: GET
Interval: 5 minutos
Timeout: 10 segundos
Success Condition: HTTP 200
```

**Alertas:**
- 🔴 Down: Email + SMS
- 🟡 Slow (>5s): Email
- 🟢 Back Online: Email

**Ejemplo UptimeRobot (gratuito):**
1. Ir a https://uptimerobot.com/
2. Sign up (free tier: 50 monitors)
3. Add monitor → HTTPS → https://reportes.progressiagroup.com
4. Set interval: 5 minutes
5. Add notifications: Email
6. Enable SMS alerts (paid)

### 4. Application Performance Monitoring (APM)

**Recomendado:** New Relic, Datadog o similar

**Métricas clave:**
- Response time (API)
- Error rate (5xx, 4xx)
- Database query performance
- Memory/CPU usage
- Request throughput

**Gratis/Económico:**
- New Relic: 1 free app
- Datadog: 14-day free trial
- Sentry: Desarrollo gratis

---

## 🔄 Estrategia de Auto-recuperación

### Nivel 1: Auto-restart del Container (5 min)

```bash
# Cron job ejecuta cada 5 minutos:
*/5 * * * * /root/citizen-reports/scripts/production-recovery.sh

# Lógica:
1. ¿Container running? → OK
2. ¿Container down? → docker compose restart
3. ¿API no responde? → Reintentar
4. ¿3+ fallos? → Restart completo
5. ¿Sigue fallando? → Log y alertar
```

### Nivel 2: Systemd Service Restart (10 min)

Si el container falla al reiniciar, usar systemd:

```bash
# Crear servicio
sudo systemctl edit citizen-reports-app

# Agregar:
[Service]
Restart=always
RestartSec=10s
StartLimitInterval=60s
StartLimitBurst=3

# Si falla 3 veces en 60s, esperar manual
```

### Nivel 3: Manual SSH Command (En caso de emergencia)

```bash
# SSH al servidor
ssh root@145.79.0.77

# Entrar a directorio
cd /root/citizen-reports

# Ver logs
docker compose logs -f citizen-reports-app

# Reiniciar
docker compose restart citizen-reports-app

# Reconstruir si hay cambios
docker compose down
docker compose up -d --build

# Verificar
curl -I https://reportes.progressiagroup.com/api/reportes
```

---

## 📞 Procedimientos de Respuesta

### Incidente: API retorna 502 Bad Gateway

**Tiempo de Respuesta:** < 5 minutos

**Paso 1: Diagnóstico Rápido (1 min)**
```bash
# Test local
curl -s https://reportes.progressiagroup.com/api/reportes | head -c 100

# Si error 502 → continuar
```

**Paso 2: Verificar Servicios (2 min)**
```bash
ssh root@145.79.0.77

# Ver estado de container
docker ps | grep citizen-reports

# Ver logs últimas líneas
docker logs --tail=50 citizen-reports-app

# Ver si hay errores de Python/Node
docker logs citizen-reports-app 2>&1 | grep -i "error\|exception"
```

**Paso 3: Reiniciar (1 min)**
```bash
cd /root/citizen-reports

# Opción A: Solo reiniciar container
docker compose restart citizen-reports-app

# Opción B: Reconstruir si hay cambios
docker compose down
docker compose pull
docker compose up -d --build

# Esperar 10 segundos
sleep 10

# Verificar
curl -s https://reportes.progressiagroup.com/api/reportes | head -c 100
```

**Paso 4: Validación (Verificar)**
```bash
# Si HTTP 200 → Exitoso ✅
# Si error → Ver logs y contactar admin

# Comando para ver logs en vivo
docker compose logs -f citizen-reports-app
```

---

## 🛡️ Preventiva a Largo Plazo

### Semana 1: Implementar Monitoreo

- [ ] Agregar `/scripts/production-recovery.sh` a cron (*/5 minutos)
- [ ] Configurar UptimeRobot (5-min checks)
- [ ] Crear log viewer en Easypanel dashboard
- [ ] Documentar runbook de recuperación

**Tiempo Estimado:** 2 horas

### Semana 2: Hardening de Infraestructura

- [ ] Aumentar recursos de container (CPU/Memory limits)
- [ ] Implementar health checks en docker-compose.yml
- [ ] Agregar restart policy: `unless-stopped`
- [ ] Configurar logrotate para logs
- [ ] Backup automático de base de datos

**Tiempo Estimado:** 3 horas

### Mes 1: Mejoras Arquitectónicas

- [ ] Migrar a Docker Stack en Swarm (auto-restart)
- [ ] Configurar múltiples replicas del servicio
- [ ] Implementar load balancer
- [ ] Agregar CDN para assets estáticos
- [ ] Database backup + restore testing

**Tiempo Estimado:** 8 horas

### Mes 2+: Observabilidad

- [ ] Implementar logging centralizado (Loki/ELK)
- [ ] Agregar métricas Prometheus
- [ ] Configurar dashboards Grafana
- [ ] Alertas en Slack/Teams
- [ ] SLA tracking

**Tiempo Estimado:** 12 horas

---

## 📋 Checklist de Implementación

### Inmediato (Hoy)

- [ ] Crear `/scripts/production-health-check.sh`
- [ ] Crear `/scripts/production-recovery.sh`
- [ ] SSH al servidor y ejecutar health check
- [ ] Si está down → Ejecutar recovery script
- [ ] Verificar que API responde
- [ ] Agregar cron job de recovery (*/5 min)

### Esta Semana

- [ ] Configurar UptimeRobot
- [ ] Agregar alertas a Slack
- [ ] Documentar en Runbook
- [ ] Entrenar al equipo

### Este Mes

- [ ] Revisar logs de performance
- [ ] Optimizar docker-compose.yml
- [ ] Agregar health checks en container
- [ ] Configurar APM (New Relic/Sentry)

---

## 🔗 Referencias

- **Health Check Script:** `/scripts/production-health-check.sh`
- **Recovery Script:** `/scripts/production-recovery.sh`
- **Docker Compose:** `/docker-compose.yml`
- **Deployment Doc:** `/docs/DEPLOYMENT_PRODUCTION_COMPLETE_2025-11-11.md`
- **Server:** 145.79.0.77
- **Domain:** https://reportes.progressiagroup.com
- **Dashboard:** https://easypanel.145.79.0.77

---

## 📞 Contactos de Emergencia

| Rol | Nombre | Teléfono | Email |
|-----|--------|----------|-------|
| DevOps Lead | [Tu nombre] | [Teléfono] | [Email] |
| Backup Admin | [Nombre] | [Teléfono] | [Email] |
| Project Manager | [Nombre] | [Teléfono] | [Email] |

---

**Última actualización:** 14 Noviembre 2025  
**Próxima revisión:** 30 Noviembre 2025
