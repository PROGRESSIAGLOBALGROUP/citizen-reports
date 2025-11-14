# 🚑 Production Troubleshooting Runbook
**citizen-reports** - Quick Reference Guide

**Última actualización:** 14 Noviembre 2025

---

## 🔴 Problema: 502 Bad Gateway

**Síntoma:** `curl https://reportes.progressiagroup.com` retorna HTTP 502

### Diagnóstico Rápido (2 min)

```bash
ssh root@145.79.0.77

# 1. ¿Container está running?
docker ps | grep citizen-reports

# 2. ¿Qué logs muestra?
docker logs --tail=20 citizen-reports-app

# 3. ¿Puerto 4000 respondiendo?
curl -I http://localhost:4000/

# 4. ¿CPU/Memory?
docker stats citizen-reports-app --no-stream
```

### Solución Rápida

**Opción 1: Reinicio Simple (30 seg)**
```bash
cd /root/citizen-reports
docker compose restart citizen-reports-app
sleep 10
curl -I https://reportes.progressiagroup.com/api/reportes
```

**Opción 2: Reconstruir (2 min)**
```bash
cd /root/citizen-reports
docker compose down
docker compose pull
docker compose up -d --build
sleep 10
curl -I https://reportes.progressiagroup.com/api/reportes
```

**Opción 3: Full Reset (3 min - ÚLTIMO RECURSO)**
```bash
cd /root/citizen-reports
docker compose down -v  # Elimina volúmenes - ¡BORRA DATOS!
git pull origin main    # Trae cambios nuevos
npm install --prefix server
npm run init --prefix server  # Reinicializa base de datos
docker compose up -d --build
sleep 10
curl -I https://reportes.progressiagroup.com/api/reportes
```

---

## 🔴 Problema: API lenta (>5 seg)

### Diagnóstico

```bash
# Ver si hay queries SQL lentas
docker logs citizen-reports-app 2>&1 | grep -i "slow\|query"

# Monitor en vivo
docker stats citizen-reports-app

# Ver tabla de reportes
docker exec citizen-reports-app sqlite3 /app/server/data.db \
  "SELECT COUNT(*) FROM reportes;"
```

### Soluciones

```bash
# 1. Optimizar base de datos
docker exec citizen-reports-app sqlite3 /app/server/data.db \
  "VACUUM; ANALYZE;"

# 2. Aumentar memoria del proceso
# Editar docker-compose.yml:
# command: node --max-old-space-size=512 server/server.js
#                              ↑ cambiar de 256 a 512

# 3. Agregar índices si no existen
docker exec citizen-reports-app sqlite3 /app/server/data.db << 'EOF'
CREATE INDEX IF NOT EXISTS idx_reportes_estado ON reportes(estado);
CREATE INDEX IF NOT EXISTS idx_reportes_tipo ON reportes(tipo);
CREATE INDEX IF NOT EXISTS idx_reportes_fecha ON reportes(creado_en);
EOF
```

---

## 🟡 Problema: Alto uso de memoria

### Diagnóstico

```bash
docker stats citizen-reports-app

# Si >500MB: problema
# Si >1GB: crítico
```

### Soluciones

```bash
# 1. Aumentar límite de Node
# docker-compose.yml:
# command: node --max-old-space-size=512 server/server.js

# 2. Limpiar logs viejos
docker logs citizen-reports-app > /dev/null
docker system prune -a --volumes -f

# 3. Si problema persiste - memory leak
# Contactar developer para debugging
docker logs citizen-reports-app --timestamps | tail -100
```

---

## 🟡 Problema: Alto uso de disco

### Diagnóstico

```bash
df -h /
# Si >85%: advertencia
# Si >95%: crítico

# ¿Cuánto ocupa el container?
docker exec citizen-reports-app du -sh /app/server/
```

### Soluciones

```bash
# 1. Limpiar logs viejos
docker logs citizen-reports-app --tail=1000 > backup.log
docker logs citizen-reports-app > /dev/null

# 2. Limpiar sistema Docker
docker system prune -a -f
docker volume prune -f

# 3. Backup y reset base de datos si > 1GB
cp /root/citizen-reports/server/data.db /root/citizen-reports/server/data.db.backup
rm /root/citizen-reports/server/data.db
docker compose restart citizen-reports-app
npm run init --prefix /root/citizen-reports/server
```

---

## 🟠 Problema: Database corrupted

### Síntoma

```
Error: database disk image malformed
```

### Solución

```bash
# 1. Backup
cp /root/citizen-reports/server/data.db /root/citizen-reports/server/data.db.corrupted

# 2. Verificar integridad
sqlite3 /root/citizen-reports/server/data.db "PRAGMA integrity_check;"

# 3. Si falla: Recuperar desde backup
# Si no hay backup: Reiniciar base de datos
rm /root/citizen-reports/server/data.db
cd /root/citizen-reports
npm run init

# 4. Reiniciar aplicación
docker compose restart citizen-reports-app
```

---

## 🔵 Problema: DNS no resuelve

### Diagnóstico

```bash
nslookup reportes.progressiagroup.com 8.8.8.8
# Debería retornar: 145.79.0.77
```

### Soluciones

```bash
# 1. Esperar propagación (15-30 min)
while true; do
  nslookup reportes.progressiagroup.com 8.8.8.8 | grep "145.79.0.77" && \
  echo "✅ DNS OK" && break
  echo "Esperando..." && sleep 10
done

# 2. Si no funciona: revisar Hostgator
# - https://www.hostgator.com/
# - DNS Zone Editor
# - A record debe apuntar a 145.79.0.77

# 3. Limpiar cache DNS local (Windows)
ipconfig /flushdns

# 4. Limpiar cache DNS local (Linux/Mac)
sudo systemctl restart systemd-resolved
```

---

## 🔵 Problema: SSL Certificate error

### Síntoma

```
curl: (60) SSL certificate problem
ERR_CERT_AUTHORITY_INVALID
```

### Soluciones

```bash
# 1. Verificar certificado
openssl s_client -connect reportes.progressiagroup.com:443 -showcerts

# 2. Si expirado: Renovar Let's Encrypt
ssh root@145.79.0.77
rm /etc/easypanel/traefik/acme.json
docker service update --force traefik
sleep 60

# 3. Verificar acme.json tiene cert
docker exec traefik cat /etc/traefik/acme.json | grep reportes

# 4. Verificar Traefik logs
docker logs traefik --tail=50 | grep -i "let\|cert\|error"
```

---

## ✅ Problema: RESUELTO - Confirmar salud

```bash
# Checklist final
echo "=== HEALTH CHECK ==="

# 1. DNS
nslookup reportes.progressiagroup.com 8.8.8.8 | grep "145.79.0.77" && \
echo "✅ DNS OK" || echo "❌ DNS FAIL"

# 2. HTTPS
curl -s -o /dev/null -w "%{http_code}" https://reportes.progressiagroup.com | \
grep "200\|301" && echo "✅ HTTPS OK" || echo "❌ HTTPS FAIL"

# 3. API
curl -s -o /dev/null -w "%{http_code}" https://reportes.progressiagroup.com/api/reportes | \
grep "200" && echo "✅ API OK" || echo "❌ API FAIL"

# 4. Container
docker ps | grep citizen-reports | grep "Up" && \
echo "✅ CONTAINER OK" || echo "❌ CONTAINER FAIL"

# 5. Database
docker exec citizen-reports-app sqlite3 /app/server/data.db \
"SELECT COUNT(*) FROM reportes;" 2>/dev/null | grep -q "[0-9]" && \
echo "✅ DATABASE OK" || echo "❌ DATABASE FAIL"

echo "=== FIN CHECK ==="
```

---

## 📞 Escalation

Si después de estos pasos el problema persiste:

1. **Nivel 1:** Contactar DevOps Lead
2. **Nivel 2:** Escalate a hosting provider (Hostgator)
3. **Nivel 3:** Contactar desarrollador Node.js

**Información a proporcionar:**
- Screenshot del error
- Output de: `docker logs citizen-reports-app --tail=100`
- Output de: `docker stats citizen-reports-app --no-stream`
- Hora exacta cuando empezó
- Últimos cambios (git log -5)

---

**Última actualización:** 14 Noviembre 2025  
**Próxima revisión:** 30 Noviembre 2025
