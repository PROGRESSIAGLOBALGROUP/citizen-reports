# 🚨 Emergency Runbook - Citizen Reports Production

**Procedimientos de respuesta a emergencias**  
**Fecha:** 11 Noviembre 2025  
**Clasificación:** Interno - Operaciones

---

## 🎯 Guía Rápida por Escenario

### Escenario 1: Aplicación NO responde (HTTP 503)

**Tiempo de resolución:** 5 minutos

**Paso 1: Verificar Status**
```bash
ssh root@145.79.0.77
docker ps | grep citizen-reports
# Si NO aparece: Ir a Paso 2a
# Si aparece pero "Exited": Ir a Paso 2b
# Si aparece y "Up": Ir a Paso 3
```

**Paso 2a: Contenedor no existe**
```bash
cd /root/citizen-reports
docker compose up -d
sleep 30
docker ps | grep citizen-reports
# Verificar que está "Up"
```

**Paso 2b: Contenedor crashed**
```bash
# Ver por qué crasheó
docker logs citizen-reports-app | tail -100

# Revisar si hay errores de:
# - "Cannot find module" → Ver Precaución Node:20-alpine
# - "ENOENT: no such file" → Database no inicializada
# - "Cannot connect to port" → Puerto 4000 ocupado

# Restart limpio
docker compose -f /root/citizen-reports/docker-compose.yml down
docker system prune -f
docker compose up -d
```

**Paso 3: Contenedor up pero 503**
```bash
# Revisar logs para ver qué hace
docker logs -f citizen-reports-app

# Buscar la línea:
# "✅ Aplicación creada"
# Si NO aparece: Server no inició correctamente

# Forzar reinicio total
docker compose down
docker compose up -d

# Esperar 60 segundos
sleep 60

# Test
curl -I https://reportes.progressiagroup.com/
```

**Si persiste después de todos estos pasos:**
- [ ] Contactar desarrollador
- [ ] Proporcionar: `docker logs citizen-reports-app`
- [ ] Proporcionar: `docker stats citizen-reports-app`

---

### Escenario 2: HTTPS devuelve 404

**Indicador:** `curl -I https://reportes.progressiagroup.com/` → HTTP 404

**Causa probable:** Traefik routing incorrecto

**Paso 1: Verificar aplicación**
```bash
# App está respondiendo en puerto 4000?
curl -I http://145.79.0.77:4000/
# Esperado: HTTP/1.1 200
# Si 503: Ver Escenario 1
```

**Paso 2: Verificar Traefik config**
```bash
# Ver si ruta está configurada
cat /etc/easypanel/traefik/config/main.yaml | grep -A5 "citizen-reports"

# Esperado: Debe tener router y service configurados
```

**Paso 3: Recargar Traefik**
```bash
# Forzar re-lectura de configuración
docker service update --force traefik

# Esperar 30 segundos
sleep 30

# Test
curl -I https://reportes.progressiagroup.com/
```

**Paso 4: Regenerar config (si todo falló)**
```bash
# Ejecutar script de configuración
python3 /root/fix-entrypoints.py

# Reiniciar Traefik
docker service update --force traefik

# Esperar 60 segundos
sleep 60

# Test
curl -I https://reportes.progressiagroup.com/
```

---

### Escenario 3: DNS no resuelve

**Indicador:** `nslookup reportes.progressiagroup.com` → request timed out

**Causa probable:** Nameservers de Hostgator inactivos O TTL expirado sin actualización

**Paso 1: Verificar nameservers**
```bash
dig reportes.progressiagroup.com +trace

# Buscar línea con "reportes.progressiagroup.com"
# Debe tener A record apuntando a 145.79.0.77
```

**Paso 2: Si nameservers incorrectos**
1. Abrir https://www.hostgator.com
2. Login
3. Ir a "Manage Domains" → "reportes.progressiagroup.com"
4. DNS Zone Editor
5. Verificar A Record:
   - Name: @ (o vacío)
   - Points To: 145.79.0.77
6. Si es incorrecto: Editar
7. Guardar

**Paso 3: Propagar cambios**
```bash
# TTL es 3600 (1 hora)
# Cambios tardan hasta 1 hora en propagarse

# Monitorear propagación
for i in {1..12}; do
  echo "Intento $i:"
  nslookup reportes.progressiagroup.com 8.8.8.8 | grep "Address"
  sleep 300  # Esperar 5 minutos
done
```

**Paso 4: Validar resolución**
```bash
# Cuando se resuelva correctamente
nslookup reportes.progressiagroup.com 8.8.8.8
# Esperado: 145.79.0.77

# Verificar múltiples resolvers
nslookup reportes.progressiagroup.com 1.1.1.1
nslookup reportes.progressiagroup.com ns104.hostgator.mx
```

---

### Escenario 4: CORS bloqueado en navegador

**Indicador:** DevTools → Console muestra:
```
Access to XMLHttpRequest at 'https://...' has been blocked by CORS policy
```

**Causa:** Dominio no en CORS whitelist en server/app.js

**Paso 1: Verificar CORS actual**
```bash
# Test CORS desde línea de comando
curl -v -H 'Origin: https://reportes.progressiagroup.com' \
     -X OPTIONS https://reportes.progressiagroup.com/api/dependencias 2>&1 | \
     grep -i "access-control-allow-origin"

# Esperado: Access-Control-Allow-Origin: https://reportes.progressiagroup.com
# Si NO aparece: CORS no configurado
```

**Paso 2: Agregar dominio a CORS**

En local machine, editar `server/app.js` (línea ~110):

```javascript
// ANTES:
if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('145.79.0.77')) {
  callback(null, true);
}

// DESPUÉS (AGREGAR línea con dominio):
if (!origin || 
    origin.includes('localhost') || 
    origin.includes('127.0.0.1') || 
    origin.includes('145.79.0.77') ||
    origin.includes('reportes.progressiagroup.com')) {  // ← AGREGAR ESTA LÍNEA
  callback(null, true);
}
```

**Paso 3: Commit y push**
```bash
cd c:\PROYECTOS\Jantetelco

git add server/app.js
git commit -m "Fix: Add reportes.progressiagroup.com to CORS whitelist (emergency fix)"
git push origin main
```

**Paso 4: Actualizar en VPS**
```bash
ssh root@145.79.0.77

cd /root/citizen-reports
git pull origin main

# Rebuild Docker con cambios
docker compose build --no-cache --pull
docker compose up -d

# Esperar 30 segundos
sleep 30

# Test CORS
curl -v -H 'Origin: https://reportes.progressiagroup.com' \
     -X OPTIONS https://reportes.progressiagroup.com/api/dependencias 2>&1 | \
     grep "access-control"
```

---

### Escenario 5: SSL Certificate expirando/expirado

**Indicador:** Navegador muestra "Connection not secure" O
```bash
openssl s_client -connect reportes.progressiagroup.com:443 -showcerts 2>/dev/null | grep notAfter
# notAfter: < 14 días en futuro
```

**Paso 1: Verificar certificado actual**
```bash
openssl s_client -connect reportes.progressiagroup.com:443 -showcerts 2>/dev/null | \
  grep -E "subject=|issuer=|notAfter="

# Esperado:
# subject=CN = reportes.progressiagroup.com
# issuer=C = US, O = Let's Encrypt, CN = R3
# notAfter=Feb  9 XX:XX:XX 2026 GMT (>60 días)
```

**Paso 2: Forzar renovación (si < 14 días)**
```bash
ssh root@145.79.0.77

# BACKUP (CRÍTICO)
cp /etc/easypanel/traefik/acme.json /etc/easypanel/traefik/acme.json.backup.$(date +%s)

# Remover certificado viejo (fuerza renovación)
rm /etc/easypanel/traefik/acme.json

# Reiniciar Traefik
docker service update --force traefik

# ESPERAR 60 SEGUNDOS
sleep 60

# Verificar que se regeneró
ls -la /etc/easypanel/traefik/acme.json
# Debe tener timestamp NUEVO

# Validar nuevo certificado
openssl s_client -connect reportes.progressiagroup.com:443 -showcerts 2>/dev/null | \
  grep -E "notAfter="
# Debe estar 90 días en futuro
```

**Si no se regeneró:**
```bash
# Ver logs de Traefik
docker service logs traefik | grep -i "acme\|error\|certificate"

# Posibles problemas:
# 1. DNS no resuelve (ver Escenario 3)
# 2. Puerto 443 no accesible desde internet
# 3. acme.json corrupto
```

---

### Escenario 6: Database corrupta

**Indicador:** Logs muestran:
```
database disk image is malformed
SQLITE_CORRUPT
```

**Paso 1: Verificar corrupción**
```bash
ssh root@145.79.0.77

docker exec citizen-reports-app sqlite3 /app/server/data.db "PRAGMA integrity_check;"

# Si resultado es "ok": No está corrupta
# Si resultado es "error": Está corrupta
```

**Paso 2: Backup DB corrupta**
```bash
docker cp citizen-reports-app:/app/server/data.db /root/data.db.corrupt
```

**Paso 3: Restore from backup (SI existe)**
```bash
# Listar backups disponibles
ls -la /root/backups/data-*.db

# Seleccionar el más reciente que NO sea corrupto
# Ejemplo: data-20251110_140000.db

docker cp /root/backups/data-20251110_140000.db citizen-reports-app:/app/server/data.db

# Restart app
docker restart citizen-reports-app

# Verificar
curl -s https://reportes.progressiagroup.com/api/dependencias | jq length
# Debe retornar número de departamentos
```

**Paso 4: Si NO hay backup**
```bash
# Reinicializar DB limpia (PERDERÁS DATOS ACTUALES)
docker exec citizen-reports-app npm run init

# App se reiniciará con schema vacío pero funcional

# IMPORTANTE: Contactar desarrollador inmediatamente
# para recuperar datos de otra fuente
```

---

### Escenario 7: Puerto 4000 ocupado

**Indicador:** `docker logs` muestra:
```
Error: listen EADDRINUSE: address already in use 0.0.0.0:4000
```

**Paso 1: Ver qué ocupa puerto**
```bash
netstat -tulpn | grep :4000

# Resultado esperado:
# tcp 0 0 0.0.0.0:4000 LISTENING 12345/docker-proxy
```

**Paso 2: Si es otro proceso (no docker)**
```bash
# Matar el proceso
kill -9 <PID>

# Reiniciar aplicación
docker compose restart citizen-reports-app
```

**Paso 3: Si es ghost container**
```bash
# Ver todos los containers (incluso detenidos)
docker ps -a | grep citizen-reports

# Si hay múltiples "Exited" containers:
docker rm <container_id>

# Reiniciar
docker compose up -d
```

---

### Escenario 8: Memory leak (App consume > 500MB)

**Indicador:**
```bash
docker stats citizen-reports-app
# MEMORY: 550MB o más

# y logs llenos de información repetida
```

**Paso 1: Restart rápido**
```bash
docker restart citizen-reports-app

# Ver si se normaliza
docker stats --no-stream citizen-reports-app
# Debe volver a ~150MB
```

**Paso 2: Si problema persiste**
```bash
# Ver logs para encontrar qué causa memory leak
docker logs --since 1h citizen-reports-app | grep -i "memory\|leak\|request"

# Tomar nota del patrón (qué endpoint está siendo llamado)

# Contactar desarrollador con:
# - Tiempo de cuando empezó el leak
# - Qué endpoint genera requests (si lo ves en logs)
# - Output de: docker stats
```

**Paso 3: Preventivo**
```bash
# Mientras se soluciona, hacer restart automático cada noche
# Agregar a crontab:
# 0 3 * * * docker restart citizen-reports-app

crontab -e
# Agregar: 0 3 * * * docker restart citizen-reports-app
```

---

## 🔄 Procedimientos Comunes

### Restart Limpio

```bash
ssh root@145.79.0.77

cd /root/citizen-reports

# Full cleanup and restart
docker compose down -v
docker system prune -f
docker compose up -d

sleep 30

# Verificar
docker ps | grep citizen-reports
```

### Rollback a Versión Anterior

```bash
ssh root@145.79.0.77

cd /root/citizen-reports

# Ver commits recientes
git log --oneline -10

# Revertir a commit anterior
git revert HEAD --no-edit
# O si quieres descartar cambios:
git reset --hard HEAD~1

# Rebuild
docker compose build --no-cache
docker compose up -d
```

### Cambiar Node version

**SI necesitas cambiar de Node 20 a otra versión:**

1. Editar `Dockerfile`:
   ```dockerfile
   FROM node:20            # Cambiar a node:18, node:22, etc
   ```

2. Rebuild:
   ```bash
   docker compose build --no-cache --pull
   docker compose up -d
   ```

---

## 📞 Escalation Decision Tree

```
├─ ¿App responde? (curl -I https://...)
│  ├─ NO (503/500)
│  │  ├─ ¿Contenedor up? (docker ps)
│  │  │  ├─ NO → START CONTAINER
│  │  │  └─ SÍ → RESTART + CHECK LOGS
│  │  └─ CONTACT DEV si persiste > 10 min
│  │
│  └─ SÍ (200) → OK
│
├─ ¿DNS resuelve?
│  ├─ NO → UPDATE HOSTGATOR + WAIT 1 HOUR
│  └─ SÍ (145.79.0.77) → OK
│
├─ ¿SSL válido?
│  ├─ NO (< 14 días) → FORCE RENEWAL
│  └─ SÍ (> 60 días) → OK
│
├─ ¿SPA carga? (navegador)
│  ├─ Blank page → CLEAR CACHE + Hard Refresh
│  ├─ CORS error → UPDATE CORS WHITELIST
│  ├─ Network errors → CHECK INTERNET
│  └─ OK → ✓
│
└─ ✓ SISTEMA OPERATIVO
```

---

## 📋 Post-Incident Checklist

Después de resolver cualquier incidente:

- [ ] Documentar qué falló
- [ ] Documentar causa raíz
- [ ] Documentar solución aplicada
- [ ] Actualizar este runbook si es relevante
- [ ] Enviar resumen a team slack
- [ ] Agendar retrospective si fue crítico
- [ ] Implementar preventivos para futura ocurrencia

**Template de Post-Incident:**
```
INCIDENTE: [descripción]
HORA: [timestamp]
DURACIÓN: [X minutos]
CAUSA: [root cause]
SOLUCIÓN: [pasos que se hicieron]
IMPACTO: [cuántos usuarios afectados]
PREVENTIVOS: [qué hace falta para no repetir]
RESPONSABLE FOLLOW-UP: [persona]
```

---

## 🚀 Comandos de Emergencia (Copy-Paste Listos)

```bash
# EMERGENCIA - Reset completo
ssh root@145.79.0.77 "cd /root/citizen-reports && docker compose down -v && docker system prune -f && docker compose up -d && sleep 30 && docker ps | grep citizen-reports"

# EMERGENCIA - Ver logs último error
ssh root@145.79.0.77 "docker logs citizen-reports-app | tail -50"

# EMERGENCIA - Restart Traefik
ssh root@145.79.0.77 "docker service update --force traefik && sleep 60 && curl -I https://reportes.progressiagroup.com/"

# EMERGENCIA - Validar sistema completo
ssh root@145.79.0.77 "echo '=== APP ===' && curl -I https://reportes.progressiagroup.com/ && echo -e '\n=== DNS ===' && nslookup reportes.progressiagroup.com 8.8.8.8 && echo -e '\n=== SSL ===' && openssl s_client -connect reportes.progressiagroup.com:443 -showcerts 2>/dev/null | grep notAfter && echo -e '\n=== DOCKER ===' && docker ps | grep citizen-reports"

# EMERGENCIA - Backup DB antes de cualquier cosa
ssh root@145.79.0.77 "docker exec citizen-reports-app cp /app/server/data.db /app/server/data-emergency-$(date +%s).db"
```

---

**Actualizar este documento con cada incidente nuevo**  
**Última actualización:** 11 Noviembre 2025
