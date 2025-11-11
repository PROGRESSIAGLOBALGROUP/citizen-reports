# 📊 Monitoreo y Mantenimiento Producción

**Citizen Reports - Production Environment**  
**Servidor:** 145.79.0.77  
**Fecha:** Noviembre 11, 2025

---

## 📋 Tabla de Contenidos

1. [Monitoreo Diario](#monitoreo-diario)
2. [Alertas Críticas](#alertas-críticas)
3. [Logs y Diagnostics](#logs-y-diagnostics)
4. [Procedimientos de Backup](#procedimientos-de-backup)
5. [Mantenimiento Semanal](#mantenimiento-semanal)
6. [Mantenimiento Mensual](#mantenimiento-mensual)
7. [Monitoreo de Performance](#monitoreo-de-performance)
8. [SSL Certificate Management](#ssl-certificate-management)
9. [Database Maintenance](#database-maintenance)
10. [Escalation Matrix](#escalation-matrix)

---

## 🔍 Monitoreo Diario

**Frecuencia:** Al inicio de cada día laboral (9:00 AM local)

### Paso 1: Verificar que aplicación está UP

```bash
# SSH a servidor
ssh root@145.79.0.77

# Verificar que contenedor está corriendo
docker ps | grep citizen-reports

# Esperado:
# citizen-reports-app    Up 2 days (o cualquier tiempo > 0)
```

**Si NO está running:**
```bash
# Iniciar contenedor
docker compose -f /root/citizen-reports/docker-compose.yml up -d

# Esperar 30 segundos
sleep 30

# Verificar de nuevo
docker ps | grep citizen-reports
```

### Paso 2: Verificar HTTPS accesible

```bash
# Test HTTPS desde local
curl -I https://reportes.progressiagroup.com/

# Esperado: HTTP/2 200
# Si 503: Backend no responde → Revisar logs
# Si 404: Traefik routing incorrecto → Revisar Traefik config
```

### Paso 3: Verificar DNS

```bash
# Verificar resolución
nslookup reportes.progressiagroup.com 8.8.8.8

# Esperado: 145.79.0.77
```

### Paso 4: Quick API Test

```bash
# Obtener lista de departamentos (debe retornar JSON)
curl -s https://reportes.progressiagroup.com/api/dependencias | jq length

# Esperado: 8 (o número de departamentos en DB)
```

### Paso 5: Revisar logs últimas 24 horas

```bash
# Ver logs recientes
docker logs --since 24h citizen-reports-app | tail -50

# Buscar errores
docker logs --since 24h citizen-reports-app | grep -i "error\|500\|exception" | tail -20

# Si hay muchos errores: Escalate a desarrollador
```

### Paso 6: Verificar espacio en disco

```bash
# Ver espacio disponible
df -h /

# Esperado: > 10GB libre
# Si < 5GB: ALERTA - Limpiar space (revisar section Docker cleanup)
```

---

## 🚨 Alertas Críticas

### ALERTA 1: Aplicación NO responde (HTTP 503)

**Síntomas:**
```
curl -I https://reportes.progressiagroup.com/ → 503 Service Unavailable
```

**Checklist Rápido:**
1. Verificar que contenedor está UP: `docker ps | grep citizen-reports`
2. Si no está UP: `docker compose -f /root/citizen-reports/docker-compose.yml up -d`
3. Esperar 30s
4. Revisar logs: `docker logs --tail 50 citizen-reports-app`
5. Si logs muestran "Cannot find module": Base image incorrecta (ver Precaución)

**Si no se soluciona:**
- [ ] Detener y limpiar: `docker compose -f /root/citizen-reports/docker-compose.yml down`
- [ ] Limpiar volumenes: `docker system prune -f`
- [ ] Rebuild: `docker compose -f /root/citizen-reports/docker-compose.yml build --no-cache`
- [ ] Restart: `docker compose -f /root/citizen-reports/docker-compose.yml up -d`

---

### ALERTA 2: DNS no resuelve (Request times out)

**Síntomas:**
```
nslookup reportes.progressiagroup.com → request timed out
```

**Causa Probable:**
- Nameservers de Hostgator inactivos
- TTL expirado sin actualización

**Acciones:**
1. Verificar nameservers en Hostgator: `dig reportes.progressiagroup.com`
2. Verificar A record en DNS: Debe ser 145.79.0.77
3. Si incorrecto: Actualizar en Hostgator DNS Zone Editor
4. Esperar 5-30 minutos (TTL propagation)

**Si persiste:**
- Contactar Hostgator support
- Alternativa temporal: Cambiar nameservers a Google (8.8.8.8)

---

### ALERTA 3: CORS bloqueado (Browser console error)

**Síntoma en Browser DevTools:**
```
Access to XMLHttpRequest at 'https://...' from origin 'https://reportes.progressiagroup.com' 
has been blocked by CORS policy
```

**Causa:** Dominio no en CORS whitelist

**Solución:**
1. SSH a servidor
2. Editar `server/app.js` en local
3. Agregar dominio a CORS whitelist (línea ~110)
4. Commit y push a GitHub
5. SSH a VPS: `git pull origin main`
6. Rebuild Docker: `docker compose build --no-cache`
7. Restart: `docker compose up -d`

---

### ALERTA 4: SSL certificate expirando (Browser warning)

**Síntoma:** Navegador muestra "Connection not secure"

**Verificación:**
```bash
# Ver fecha de expiración
openssl s_client -connect reportes.progressiagroup.com:443 -showcerts 2>/dev/null | \
  grep notAfter

# Esperado: 90 días en futuro
# Si < 14 días: ACTION REQUIRED
```

**Solución:**
- Traefik auto-renueva 30 días antes de expiración
- Si expira sin renovación automática:
  1. Backup acme.json: `cp /etc/easypanel/traefik/acme.json /root/acme.backup`
  2. Remove: `rm /etc/easypanel/traefik/acme.json`
  3. Force Traefik restart: `docker service update --force traefik`
  4. Esperar 60 segundos
  5. Verificar nuevo cert: `openssl s_client -connect ...`

---

### ALERTA 5: Database corrupted (SQLite errors)

**Síntoma en logs:**
```
database disk image is malformed
SQLITE_CORRUPT: database disk image is malformed
```

**Solución:**
1. Backup actual DB: `docker exec citizen-reports-app cp /app/server/data.db /app/server/data.corrupt.db`
2. Restore from backup: `docker cp /root/backups/data.db citizen-reports-app:/app/server/`
3. Restart app: `docker restart citizen-reports-app`

**Si no hay backup:**
1. Reinicializar DB: `docker exec citizen-reports-app npm run init`
2. App se reiniciará con schema limpio (perderás datos)

---

## 📝 Logs y Diagnostics

### Ver logs en tiempo real

```bash
# Últimos 100 líneas
docker logs -f citizen-reports-app

# Últimas 24 horas
docker logs --since 24h citizen-reports-app

# Solo errores
docker logs citizen-reports-app | grep -i "error\|exception\|500"
```

### Ver logs de Traefik (si routing tiene problemas)

```bash
# Logs de Traefik
docker service logs traefik | tail -50

# Buscar errores de routing
docker service logs traefik | grep -i "reportes\|404\|error"
```

### Ver logs del sistema

```bash
# Docker events
docker events --since 1h

# System journal
journalctl -u docker -n 50

# Check disk usage
du -sh /var/lib/docker/*
```

---

## 💾 Procedimientos de Backup

### Backup Manual (Ejecutar semanalmente)

```bash
# SSH al servidor
ssh root@145.79.0.77

# Crear directorio backups
mkdir -p /root/backups

# Backup database
docker exec citizen-reports-app \
  cp /app/server/data.db /app/server/data-$(date +%Y%m%d_%H%M%S).db

# Copiar a directorio de backups
docker cp citizen-reports-app:/app/server/data-*.db /root/backups/

# Listar backups
ls -lah /root/backups/

# Mantener solo últimos 10 backups
ls -t /root/backups/data-*.db | tail -n +11 | xargs rm -f
```

### Backup a S3 (Optional pero recomendado)

```bash
# Instalar aws-cli
apt-get update && apt-get install -y awscli

# Configurar credenciales
aws configure
# (Ingresar: Access Key, Secret Key, región, formato)

# Backup a S3
aws s3 cp /root/backups/data-latest.db s3://your-bucket/citizen-reports/

# Automated (add a cron job)
# 0 2 * * * docker exec citizen-reports-app cp /app/server/data.db /app/server/data-backup.db && aws s3 cp /app/server/data-backup.db s3://bucket/citizen-reports/
```

### Restore from Backup

```bash
# Si base de datos se corrupta
docker cp /root/backups/data-YYYYMMDD_HHMMSS.db citizen-reports-app:/app/server/data.db

# Restart app
docker restart citizen-reports-app

# Verificar
curl -s https://reportes.progressiagroup.com/api/dependencias | jq length
```

---

## 📅 Mantenimiento Semanal

**Día recomendado:** Viernes 6:00 PM (fuera de horario laboral)

### Checklist Semanal

- [ ] **Backup completo**: Ejecutar procedimiento de backup manual
- [ ] **Logs review**: Buscar patrones de errores en `docker logs --since 7d`
- [ ] **Performance**: Revisar tiempo de respuesta promedio
- [ ] **Space check**: Verificar que disco tiene > 15GB libre
- [ ] **Security**: Verificar SSL válido (< 75 días para expiración)
- [ ] **Dependencies**: Revisar si hay updates de seguridad para node packages

### Limpieza de espacio (si necesario)

```bash
# Ver qué consume espacio
du -sh /var/lib/docker/volumes/*
du -sh /var/lib/docker/images/*

# Limpiar imágenes antiguas
docker image prune -a -f

# Limpiar volumenes no usados
docker volume prune -f

# Limpiar contenedores detenidos
docker container prune -f

# Full cleanup (cuidado - elimina todo no usado)
docker system prune -a -f
```

---

## 📆 Mantenimiento Mensual

**Día recomendado:** Primer viernes del mes (6:00 PM)

### Checklist Mensual

- [ ] **Database optimization**: `docker exec citizen-reports-app sqlite3 /app/server/data.db VACUUM`
- [ ] **Log rotation**: Limpiar logs viejos si son muy grandes
- [ ] **Certificate check**: Verificar fecha de expiración (debe estar > 60 días)
- [ ] **Performance baseline**: Documentar tiempo de respuesta, memoria, CPU
- [ ] **Security audit**: Revisar acceso logs, CORS configuration, passwords
- [ ] **Documentation update**: Si hubo cambios, actualizar runbooks

### Database Optimization

```bash
# Ejecutar VACUUM (compacta SQLite)
docker exec citizen-reports-app \
  sqlite3 /app/server/data.db "VACUUM;"

# Ver tamaño antes y después
docker exec citizen-reports-app ls -lh /app/server/data.db
```

### Performance Baseline (Documentar cada mes)

```bash
# Response time (should be < 200ms)
for i in {1..10}; do
  time curl -s https://reportes.progressiagroup.com/api/dependencias > /dev/null
done

# Memory usage
docker stats --no-stream citizen-reports-app

# Expected: < 200MB RAM usage for idle, < 500MB under load
```

---

## ⚡ Monitoreo de Performance

### Real-time Monitoring

```bash
# Ver CPU y memoria en tiempo real
docker stats citizen-reports-app

# Salida esperada:
# NAME                 CPU %    MEM %
# citizen-reports-app  0.5%     150MB
```

**Umbrales de alerta:**
- CPU > 80% = Revisar logs (posible ataque o procesamiento pesado)
- MEM > 500MB = Posible memory leak (restart app)

### Request Latency

```bash
# Medir tiempo de respuesta
time curl -s https://reportes.progressiagroup.com/api/dependencias > /dev/null

# Esperado: real 0m0.150s (< 200ms)
```

### Database Query Performance

```bash
# Verificar que índices existen
docker exec citizen-reports-app sqlite3 /app/server/data.db ".indices"

# Expectedindices en tablas frecuentes (tipo, estado, etc)
```

---

## 🔐 SSL Certificate Management

### Certificate Renewal (Automatic)

```bash
# Traefik auto-renueva cada 30 días
# Solo necesitas monitorear

# Ver certificados actuales
docker exec -it traefik cat /etc/easypanel/traefik/acme.json | jq '.Certificates[0]'
```

### Certificate Expiration Warning

```bash
# Script para verificar expiración
#!/bin/bash
DAYS_LEFT=$(echo | openssl s_client -connect reportes.progressiagroup.com:443 2>/dev/null | \
  openssl x509 -noout -dates | grep notAfter | cut -d= -f2 | xargs -I {} date -d {} +%s | \
  awk '{print ($1 - systime()) / 86400}')

if [ $DAYS_LEFT -lt 14 ]; then
  echo "⚠️ ALERTA: Certificado expira en $DAYS_LEFT días"
  # Send alert email
fi
```

### Manual Certificate Renewal

```bash
# Si auto-renewal falló

# Backup
cp /etc/easypanel/traefik/acme.json /root/acme.backup

# Remove para forzar renovación
rm /etc/easypanel/traefik/acme.json

# Force Traefik restart
docker service update --force traefik

# Esperar 60 segundos
sleep 60

# Verificar que se regeneró
ls -la /etc/easypanel/traefik/acme.json

# Validar nuevo cert
openssl s_client -connect reportes.progressiagroup.com:443 -showcerts 2>/dev/null | \
  grep -E "subject=|notAfter="
```

---

## 🗄️ Database Maintenance

### Database Integrity Check

```bash
# Ejecutar PRAGMA integrity_check
docker exec citizen-reports-app sqlite3 /app/server/data.db "PRAGMA integrity_check;"

# Esperado: "ok"
# Si hay error: Database corrupted, restore from backup
```

### Database Statistics

```bash
# Ver número de reportes
docker exec citizen-reports-app sqlite3 /app/server/data.db \
  "SELECT COUNT(*) FROM reportes;"

# Ver tamaño
docker exec citizen-reports-app ls -lh /app/server/data.db

# Expected: < 100MB para datos normales
```

### Optimize Indexes

```bash
# Crear índices si no existen (Rerun antes de indices se crean)
docker exec citizen-reports-app sqlite3 /app/server/data.db << 'EOF'
CREATE INDEX IF NOT EXISTS idx_reportes_tipo ON reportes(tipo);
CREATE INDEX IF NOT EXISTS idx_reportes_estado ON reportes(estado);
CREATE INDEX IF NOT EXISTS idx_reportes_fecha ON reportes(fecha_creacion);
EOF

# Verificar índices fueron creados
docker exec citizen-reports-app sqlite3 /app/server/data.db ".indices"
```

---

## 📞 Escalation Matrix

**Cuándo contactar a quién:**

| Severidad | Síntoma | Contactar | Acción Inmediata |
|-----------|---------|-----------|------------------|
| CRÍTICA | App no responde (503) | Dev + DevOps | Restart container, revisar logs |
| CRÍTICA | SSL expirado | DevOps + Dev | Forzar renovación ACME |
| CRÍTICA | Database corrupted | Dev + DBA | Restore from backup |
| ALTA | DNS no resuelve | DevOps | Revisar Hostgator, actualizar NS |
| ALTA | CORS blocked | Dev | Actualizar CORS whitelist, rebuild |
| ALTA | Memory leak (>500MB) | Dev | Análisis de logs, restart container |
| MEDIA | Slow performance (>1s) | Dev | Revisar queries, indices |
| MEDIA | Disk space low (<5GB) | DevOps | Cleanup volumes, archive logs |
| BAJA | Log spam | Dev | Reducir verbosity, clean logs |

---

## 🎯 Monitoring Checklist Template

### Checklist Diario (Copy-paste)

```
☐ App está UP (docker ps)
☐ HTTPS 200 OK (curl -I)
☐ DNS resuelve (nslookup)
☐ API responde (curl /api/dependencias)
☐ Logs sin errores ROJOS (docker logs --since 1h)
☐ Espacio disco > 10GB (df -h)
☐ Memory < 500MB (docker stats)
☐ SSL válido (openssl s_client)

Observaciones:
_____________________________________
_____________________________________

Alertas encontradas:
_____________________________________
_____________________________________
```

---

## 📚 Comandos Rápidos de Referencia

```bash
# Acceso rápido
ssh root@145.79.0.77

# Ver logs
docker logs -f citizen-reports-app
docker logs --since 24h citizen-reports-app | grep "error"

# Restart
docker restart citizen-reports-app

# Status
docker ps | grep citizen-reports
docker stats citizen-reports-app

# Database
docker exec citizen-reports-app sqlite3 /app/server/data.db "SELECT COUNT(*) FROM reportes;"

# Backup
docker exec citizen-reports-app cp /app/server/data.db /app/server/data-$(date +%s).db

# SSL check
openssl s_client -connect reportes.progressiagroup.com:443 -showcerts 2>/dev/null | grep -i "subject=\|notAfter="

# DNS check
nslookup reportes.progressiagroup.com 8.8.8.8

# Performance
curl -w "@curl-format.txt" -o /dev/null -s https://reportes.progressiagroup.com/
```

---

**Documento de Referencia para Operaciones**  
Última actualización: 11 Noviembre 2025  
Responsable: DevOps Team
