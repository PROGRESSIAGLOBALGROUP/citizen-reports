# 📊 Reporte de Incidente Producción + Plan de Acción
**citizen-reports.progressiagroup.com**

**Fecha:** 14 Noviembre 2025  
**Hora Detectada:** ~10:30 AM  
**Severidad:** 🔴 CRÍTICO  
**Estado:** ❌ NO OPERACIONAL → Plan de recuperación generado

---

## 🔴 Incidente

### Estado Actual
```
https://reportes.progressiagroup.com
├─ DNS: ✅ Resuelve correctamente a 145.79.0.77
├─ HTTPS/Traefik: ✅ Reverse proxy activo (puerto 443 abierto)
├─ Backend Node.js: ❌ Container no está respondiendo
└─ Resultado: 502 Bad Gateway ❌
```

### Causa Raíz
El proceso Node.js (citizen-reports-app) en Docker **está caído** o no está respondiendo en puerto 4000. El proxy Traefik está activo pero no puede conectar al backend.

### Impacto
- Plataforma completamente inoperacional
- Ciudadanos no pueden reportar incidentes
- Funcionarios no pueden acceder a dashboard
- 100% de downtime

---

## 🔧 Plan de Acción Inmediato (Hoy)

### Paso 1: Diagnóstico SSH (5 min)
```bash
ssh root@145.79.0.77

# Ver estado del container
docker ps | grep citizen-reports

# Ver logs
docker logs --tail=50 citizen-reports-app

# Ver si ocupa recursos
docker stats citizen-reports-app --no-stream
```

### Paso 2: Reinicio del Servicio (3 min)
```bash
cd /root/citizen-reports

# Opción A: Reinicio simple
docker compose restart citizen-reports-app

# Opción B: Reconstruir
docker compose down
docker compose up -d --build

# Esperar 10 segundos y verificar
sleep 10
curl -I https://reportes.progressiagroup.com/api/reportes
# Debe responder HTTP 200
```

### Paso 3: Validación (2 min)
```bash
# Verificar que API responde
curl https://reportes.progressiagroup.com/api/reportes | head -c 100
# Debe retornar JSON con reportes

# Verificar que frontend carga
curl -s https://reportes.progressiagroup.com | grep -q "PROGRESSIA\|citizen-reports" && \
  echo "✅ Frontend OK" || echo "❌ Frontend FAIL"
```

---

## 📋 Plan de Prevención Futuro (Este Mes)

### Semana 1: Monitoreo Automático
- **Cron Job:** Cada 5 minutos verifica si container está running
- **Auto-restart:** Si está down, reinicia automáticamente
- **Logging:** Registra todos los eventos en `/var/log/citizen-reports-monitor.log`

**Ubicación:** `/root/citizen-reports/scripts/production-recovery.sh`

### Semana 2: Alertas Externas
- **UptimeRobot:** Chequea API cada 5 minutos
- **Notificaciones:** Email + SMS si está down
- **Dashboard:** Visualizar histórico de uptime

### Mes 1: Hardening Infraestructura
- **Health checks:** Docker nativo cada 30 segundos
- **Restart policy:** `unless-stopped` (reinicia automáticamente)
- **Memory limits:** Prevenir crashes por falta de memoria
- **Database backups:** Automáticos cada 6 horas

### Mes 2+: Alta Disponibilidad
- **Multiple replicas:** 2-3 instancias del servicio
- **Load balancer:** Distribuir tráfico
- **CDN:** Assets estáticos en CDN
- **Monitoring centralizado:** Grafana + Prometheus

---

## 📚 Documentación Generada

| Documento | Ubicación | Propósito |
|-----------|-----------|----------|
| **Monitoring Plan** | `docs/PRODUCTION_MONITORING_RECOVERY_PLAN.md` | Plan completo de monitoreo y recuperación |
| **Troubleshooting Runbook** | `docs/PRODUCTION_TROUBLESHOOTING_RUNBOOK.md` | Guía rápida para resolver problemas |
| **Health Check Script** | `scripts/production-health-check.sh` | Verificar salud del sistema (manual) |
| **Recovery Script** | `scripts/production-recovery.sh` | Auto-restart si está down (cron job) |
| **Docker Hardened** | `docker-compose-prod-hardened.yml` | Docker-compose mejorado con health checks |

---

## 🎯 Próximos Pasos

### HOY (14 Nov - Urgente)
- [ ] Acceder al servidor vía SSH
- [ ] Ejecutar health check: `bash /root/citizen-reports/scripts/production-health-check.sh`
- [ ] Si está down: `cd /root/citizen-reports && docker compose restart citizen-reports-app`
- [ ] Validar que API responde: `curl https://reportes.progressiagroup.com/api/reportes`
- [ ] Confirmar uptime mediante browser

### ESTA SEMANA (Antes del 17 Nov)
- [ ] Agregar `production-recovery.sh` a cron job (*/5 minutos)
- [ ] Configurar UptimeRobot para alertas
- [ ] Entrenar al equipo en troubleshooting
- [ ] Crear documento para soporte 24/7

### ESTE MES (Antes del 30 Nov)
- [ ] Implementar docker-compose-prod-hardened.yml
- [ ] Agregar health checks nativos de Docker
- [ ] Configurar backup automático de base de datos
- [ ] Revisar logs de performance

### PRÓXIMOS 2 MESES (Diciembre 2025)
- [ ] Migrar a múltiples replicas (load balancing)
- [ ] Implementar observabilidad (Prometheus/Grafana)
- [ ] Alertas en Slack/Teams
- [ ] Testing de disaster recovery

---

## 💡 Recomendaciones

### Corto Plazo
1. **Implementar cron job hoy** para evitar futuro downtime
2. **Usar docker-compose-prod-hardened.yml** para mejor estabilidad
3. **Alertas en UptimeRobot** para visibilidad

### Mediano Plazo
1. **Múltiples instancias** para alta disponibilidad
2. **Load balancer** (Traefik puede hacer esto)
3. **Database backups** automáticos

### Largo Plazo
1. **Kubernetes** para orquestación avanzada
2. **Service mesh** (Istio/Linkerd) para observabilidad
3. **Disaster recovery** plan completo

---

## 🔗 Referencias

- **Aplicación:** https://reportes.progressiagroup.com
- **API:** https://reportes.progressiagroup.com/api/reportes
- **Servidor:** 145.79.0.77
- **Dashboard:** https://easypanel.145.79.0.77 (Traefik + Docker)
- **GitHub:** https://github.com/PROGRESSIAGLOBALGROUP/citizen-reports

---

## 📞 Contacto

Para implementar este plan o si necesita ayuda:

- **DevOps/Infrastructure:** [Necesita asignación]
- **Desarrollo:** Equipo de programadores
- **Hosting:** Hostgator (145.79.0.77) - soporte@hostgator.mx

---

**Estado:** 📋 Documentación Generada ✅  
**Próximo paso:** Ejecutar acciones inmediatas de SSH  
**Última actualización:** 14 Noviembre 2025 - 10:45 AM

