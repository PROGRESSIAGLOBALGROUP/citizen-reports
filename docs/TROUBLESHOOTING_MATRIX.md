# 🔧 Troubleshooting Matrix - Citizen Reports

**Guía rápida para diagnosticar y resolver problemas**  
**11 Noviembre 2025**

---

## 🎯 ÍNDICE RÁPIDO POR SÍNTOMA

| Síntoma | Sección | Tiempo |
|---------|---------|--------|
| Página en blanco | [SPA No Carga](#spa-no-carga) | 5 min |
| Errores en DevTools | [Errores JavaScript](#errores-javascript) | 10 min |
| CORS bloqueado | [CORS Errors](#cors-errors) | 15 min |
| 404 Not Found | [Routing 404](#routing-404) | 10 min |
| 503 Service Unavailable | [App No Responde](#app-no-responde) | 5 min |
| Muy lento | [Performance Lento](#performance-lento) | 20 min |
| DNS no resuelve | [DNS Issues](#dns-issues) | 30 min |
| SSL advertencia | [SSL Certificate](#ssl-certificate) | 10 min |
| Datos no se guardan | [Database Issues](#database-issues) | 15 min |
| Reportes vacíos | [Empty Results](#empty-results) | 10 min |

---

## 🖥️ SPA No Carga

### Síntomas
- Página completamente en blanco
- No aparece nada, ni error
- En DevTools → Network: archivos css/js devuelven 404

### Diagnóstico Rápido

```bash
# 1. Verificar que app responde
curl -I http://localhost:4000/
# Esperado: 200

# 2. Verificar que frontend existe
ls -la /root/citizen-reports/client/dist/
# Esperado: index.html presente

# 3. Verificar que Traefik enruta
curl -I https://reportes.progressiagroup.com/
# Esperado: 200
```

### Soluciones Ordenadas

| # | Solución | Tiempo | Si Funciona |
|---|----------|--------|------------|
| 1 | Clear navegador cache (Ctrl+Shift+Del) | 30s | ✓ LISTO |
| 2 | Hard refresh (Ctrl+Shift+R) | 30s | ✓ LISTO |
| 3 | Restart app container | 1 min | ✓ LISTO |
| 4 | Rebuild frontend en VPS | 2 min | ✓ LISTO |
| 5 | Rebuild Docker image | 5 min | ✓ LISTO |

### Solución 1: Clear Cache (Rápido)

```
Navegador:
1. DevTools (F12)
2. Right-click reload button → "Empty cache and hard reload"
O:
1. Ctrl+Shift+Del
2. Time: All time
3. Check: Cookies, Cache, etc
4. Clear
```

### Solución 2: Rebuild Frontend

```bash
ssh root@145.79.0.77

cd /root/citizen-reports

# Verificar que client/dist existe
ls -la client/dist/

# Si no existe o está viejo, rebuild
npm run build
# O si no funciona:
cd client && npm run build && cd ..

# Verificar resultado
ls -la client/dist/index.html
```

### Solución 3: Rebuild Docker

```bash
ssh root@145.79.0.77

cd /root/citizen-reports

# Full rebuild
docker compose down
docker compose build --no-cache --pull
docker compose up -d

sleep 30

# Verificar
curl -I https://reportes.progressiagroup.com/
```

---

## ⚠️ Errores JavaScript

### Síntomas comunes

```javascript
// ERROR 1: Module not found
Cannot find module './build/Release/node-sqlite3.node'

// ERROR 2: Port already in use
EADDRINUSE: address already in use 0.0.0.0:4000

// ERROR 3: Database error
no such table: reportes

// ERROR 4: CORS preflight failed
Response to preflight request doesn't pass access control check
```

### Matriz de Errores

| Error | Causa | Solución |
|-------|-------|----------|
| `Cannot find module './build/Release/node-sqlite3.node'` | Base image es alpine (sin build tools) | Cambiar FROM node:20 (ver Dockerfile) |
| `EADDRINUSE: address already in use :::4000` | Otro proceso usa puerto 4000 | Kill proceso: `lsof -ti:4000 \| xargs kill -9` |
| `SQLITE_ERROR: no such table: reportes` | DB no inicializada | `npm run init` en VPS |
| `Cannot connect to database` | DB permisos incorrectos | Revisar volumen Docker |
| `TypeError: Cannot read property '...' of undefined` | Campo falta en respuesta API | Revisar query SQL en server |

### Error: node-sqlite3.node no encontrado

```
✗ PROBLEMA: Base image es node:20-alpine
✓ SOLUCIÓN: 
  1. Editar Dockerfile
  2. Cambiar: FROM node:20-alpine
  3. A: FROM node:20
  4. Save, commit, push
  5. VPS: git pull + docker compose build --no-cache
```

### Error: Port 4000 Already in Use

```bash
# Ver qué proceso ocupa puerto
lsof -i :4000
# Resultado: Proceso ID y nombre

# Matar proceso
kill -9 <PID>

# O simple:
lsof -ti:4000 | xargs kill -9

# Reiniciar app
docker restart citizen-reports-app
```

### Error: No such table

```bash
ssh root@145.79.0.77

# Inicializar database
docker exec citizen-reports-app npm run init

# Verificar
docker exec citizen-reports-app \
  sqlite3 /app/server/data.db "SELECT COUNT(*) FROM reportes;"
# Esperado: 0 (tabla creada, vacía)
```

---

## 🌐 CORS Errors

### Síntoma en DevTools

```
Access to XMLHttpRequest at 'https://reportes.progressiagroup.com/api/dependencias' 
from origin 'https://reportes.progressiagroup.com' 
has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### Diagnóstico Rápido

```bash
# Test CORS desde línea de comandos
curl -v -H 'Origin: https://reportes.progressiagroup.com' \
     -X OPTIONS https://reportes.progressiagroup.com/api/dependencias 2>&1 | \
     grep -i "access-control"

# Esperado:
# < Access-Control-Allow-Origin: https://reportes.progressiagroup.com
# < Access-Control-Allow-Methods: GET,POST,PUT,DELETE,PATCH,OPTIONS
```

### Soluciones Ordenadas

| # | Solución | Tiempo |
|---|----------|--------|
| 1 | Verificar que servidor CORS está configurado | 2 min |
| 2 | Agregar dominio a CORS whitelist | 5 min |
| 3 | Rebuild y restart Docker | 2 min |

### Solución: Agregar Dominio a CORS

**En local machine:**

```bash
cd c:\PROYECTOS\citizen-reports

# Editar server/app.js (línea ~110)
# Encontrar sección:
# if (!origin || origin.includes('localhost') ...

# ANTES:
if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('145.79.0.77')) {

# DESPUÉS (AGREGAR línea):
if (!origin || 
    origin.includes('localhost') || 
    origin.includes('127.0.0.1') || 
    origin.includes('145.79.0.77') ||
    origin.includes('reportes.progressiagroup.com')) {  # ← NUEVA LÍNEA
```

**Commit y push:**

```bash
git add server/app.js
git commit -m "Fix: Add reportes.progressiagroup.com to CORS whitelist"
git push origin main
```

**En VPS:**

```bash
ssh root@145.79.0.77

cd /root/citizen-reports
git pull origin main

# Rebuild
docker compose build --no-cache
docker compose up -d

sleep 30

# Verificar CORS
curl -v -H 'Origin: https://reportes.progressiagroup.com' \
     -X OPTIONS https://reportes.progressiagroup.com/api/dependencias 2>&1 | \
     grep "access-control-allow-origin"
```

---

## 404 Not Found

### Síntomas

```
curl -I https://reportes.progressiagroup.com/
< HTTP/2 404
< content-type: text/html
```

### Diagnóstico Rápido

```bash
# 1. ¿App responde en puerto 4000?
curl -I http://145.79.0.77:4000/
# Esperado: 200

# 2. ¿Traefik config existe?
cat /etc/easypanel/traefik/config/main.yaml | grep -A5 "citizen-reports"

# 3. ¿Traefik listener activo?
netstat -tulpn | grep -E ":80|:443"
# Esperado: traefik escuchando
```

### Soluciones Ordenadas

| # | Causa | Solución | Tiempo |
|---|-------|----------|--------|
| 1 | App no responde | Restart container | 1 min |
| 2 | Config Traefik incorrecta | Regenerar config | 5 min |
| 3 | Traefik no recargó config | Forzar reinicio | 2 min |

### Solución: Forzar Recargar Traefik

```bash
ssh root@145.79.0.77

# Opción 1: Regenerar config
python3 /root/fix-entrypoints.py

# Opción 2: Forzar reinicio Traefik
docker service update --force traefik

# Esperar 30-60 segundos
sleep 60

# Test
curl -I https://reportes.progressiagroup.com/
# Debe retornar 200
```

---

## 503 Service Unavailable

### Síntomas

```
curl -I https://reportes.progressiagroup.com/
< HTTP/2 503
< content-type: application/json
{"error":"Service Unavailable"}
```

### Diagnóstico Rápido

```bash
ssh root@145.79.0.77

# 1. ¿Contenedor existe?
docker ps | grep citizen-reports
# Si NO aparece: Ver "Solución 1"

# 2. ¿Contendor está UP?
docker ps | grep citizen-reports | grep -i "up"
# Si dice "Exited": Ver "Solución 2"

# 3. ¿Qué dice los logs?
docker logs citizen-reports-app | tail -50
```

### Soluciones Ordenadas

| # | Síntoma | Solución |
|---|---------|----------|
| 1 | Contenedor no existe | `docker compose up -d` |
| 2 | Contenedor exited | `docker compose down && docker compose up -d` |
| 3 | Logs con errores | Revisar logs específico (ver abajo) |

### Revisar Logs Específicos

```bash
docker logs citizen-reports-app | tail -100 | grep -E "Error|error|500|exception"

# Errores comunes:
# - "Cannot find module": Base image problema
# - "EADDRINUSE": Otro proceso usa puerto
# - "no such table": DB no inicializada
# - "Connection refused": Database path incorrecto
```

---

## ⚡ Performance Lento

### Síntomas

```
curl -w "Time: %{time_total}s\n" -o /dev/null -s https://reportes.progressiagroup.com/
# Time: 2.5s (LENTO, debe ser < 0.2s)

O navegador toma 10+ segundos para cargar lista de reportes
```

### Diagnóstico Rápido

```bash
# 1. ¿Servidor está bajo carga?
docker stats citizen-reports-app
# Esperado: CPU < 50%, MEM < 300MB

# 2. ¿Disk I/O es problema?
iostat -x 1 5
# Ver %iowait

# 3. ¿Network latency?
ping 145.79.0.77
# Esperado: < 50ms
```

### Causas Comunes

| Causa | Síntomas | Solución |
|-------|----------|----------|
| Query SQL lenta | Response time varía | Agregar índices en DB |
| No tiene índices | `SELECT * FROM reportes` toma segundos | Ver "Create Indexes" |
| Memory leak | RAM > 500MB | `docker restart citizen-reports-app` |
| Network saturada | Ping > 100ms | Contactar Hostgator |

### Create Indexes (SQL)

```bash
ssh root@145.79.0.77

docker exec citizen-reports-app sqlite3 /app/server/data.db << 'EOF'
CREATE INDEX IF NOT EXISTS idx_reportes_tipo ON reportes(tipo);
CREATE INDEX IF NOT EXISTS idx_reportes_estado ON reportes(estado);
CREATE INDEX IF NOT EXISTS idx_reportes_fecha ON reportes(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_reportes_dependencia ON reportes(dependencia);
EOF

# Verificar índices fueron creados
docker exec citizen-reports-app sqlite3 /app/server/data.db ".indices"
```

---

## 🌍 DNS Issues

### Síntomas

```bash
nslookup reportes.progressiagroup.com
# ✗ request timed out

O:
nslookup reportes.progressiagroup.com 8.8.8.8
# Server: google-public-dns-a.google.com
# Address: 8.8.8.8#53
# 
# Non-authoritative answer:
# Name: reportes.progressiagroup.com
# Address: 34.67.x.x  ← INCORRECTO (vieja IP)
```

### Diagnóstico Rápido

```bash
# Ver nameservers actuales
dig reportes.progressiagroup.com +trace

# Ver A record
dig reportes.progressiagroup.com @8.8.8.8

# Verificar A record correcto
dig reportes.progressiagroup.com | grep "^reportes" | head -1
# Debe estar: reportes.progressiagroup.com. 3600 IN A 145.79.0.77
```

### Soluciones Ordenadas

| # | Causa | Solución | Tiempo |
|---|-------|----------|--------|
| 1 | TTL expirado, propagando | Esperar 5-30 minutos | N/A |
| 2 | A record incorrecto en DNS | Actualizar en Hostgator | 5 min |
| 3 | Nameservers inactivos | Cambiar en Hostgator | 10 min |

### Solución: Actualizar A Record en Hostgator

```
1. Ir a https://www.hostgator.com
2. Login
3. Manage Domains → reportes.progressiagroup.com
4. DNS Zone Editor
5. Encontrar A record:
   Name: @ (o vacío)
   Points To: [ACTUAL]
6. Si no es 145.79.0.77: EDITAR
7. New value: 145.79.0.77
8. Save
9. Esperar 1-30 minutos
10. Verificar: nslookup reportes.progressiagroup.com 8.8.8.8
```

### Monitorear Propagación

```bash
# Script para monitorear
for i in {1..20}; do
  echo "Intento $i: $(date)"
  nslookup reportes.progressiagroup.com 8.8.8.8 2>/dev/null | grep "^Address" | tail -1
  sleep 60  # Esperar 1 minuto
done
```

---

## 🔐 SSL Certificate

### Síntomas

```
Navegador: "Your connection is not private" O "ERR_CERT_AUTHORITY_INVALID"

O:
openssl s_client -connect reportes.progressiagroup.com:443 2>&1 | grep "CN"
# subject=CN = Easypanel  ← INCORRECTO (debe ser reportes.progressiagroup.com)
```

### Diagnóstico Rápido

```bash
# Ver certificado actual
openssl s_client -connect reportes.progressiagroup.com:443 -showcerts 2>/dev/null | \
  grep -E "subject=|issuer=|notAfter="

# Esperado:
# subject=CN = reportes.progressiagroup.com
# issuer=C = US, O = Let's Encrypt, CN = R3
# notAfter=Feb  9 10:55:42 2026 GMT (90 días en futuro)
```

### Soluciones Ordenadas

| # | Síntoma | Solución |
|---|---------|----------|
| 1 | CN ≠ reportes.progressiagroup.com | Forzar renovación ACME |
| 2 | notAfter < 14 días | Forzar renovación ACME |
| 3 | issuer ≠ Let's Encrypt | Esperar a que se reneve automáticamente |

### Solución: Forzar Renovación ACME

```bash
ssh root@145.79.0.77

# BACKUP (CRÍTICO)
cp /etc/easypanel/traefik/acme.json /etc/easypanel/traefik/acme.json.backup

# Remover para forzar renovación
rm /etc/easypanel/traefik/acme.json

# Reiniciar Traefik
docker service update --force traefik

# ESPERAR 60 segundos
sleep 60

# Verificar que se regeneró
openssl s_client -connect reportes.progressiagroup.com:443 -showcerts 2>/dev/null | \
  grep -E "subject=CN|notAfter="
# Debe tener CN = reportes.progressiagroup.com
# Y notAfter 90 días en futuro
```

---

## 💾 Database Issues

### Síntomas

```bash
# Logs muestran:
SQLITE_ERROR: database disk image is malformed
Error: Cannot read from database

# O:
curl https://reportes.progressiagroup.com/api/reportes
# {"error":"database disk image is malformed"}
```

### Diagnóstico Rápido

```bash
ssh root@145.79.0.77

# Verificar integridad
docker exec citizen-reports-app sqlite3 /app/server/data.db "PRAGMA integrity_check;"

# Si resultado es "ok": OK
# Si resultado tiene "error": CORRUPTA

# Ver tamaño
docker exec citizen-reports-app ls -lh /app/server/data.db
```

### Soluciones Ordenadas

| # | Solución | Impacto | Tiempo |
|---|----------|--------|--------|
| 1 | Restore from backup | Sin pérdida datos | 2 min |
| 2 | Reinicializar schema | Pérdida de datos | 1 min |
| 3 | Reparar con VACUUM | Sin pérdida | 5 min |

### Solución 1: Restore from Backup

```bash
ssh root@145.79.0.77

# Listar backups
ls -la /root/backups/data-*.db

# Restaurar más reciente
docker cp /root/backups/data-LATEST.db citizen-reports-app:/app/server/data.db

# Restart
docker restart citizen-reports-app

# Verificar
curl -s https://reportes.progressiagroup.com/api/dependencias | jq length
```

### Solución 2: Reinicializar (PIERDE DATOS)

```bash
ssh root@145.79.0.77

# WARNING: Esto borra todos los datos
docker exec citizen-reports-app npm run init

# Verify
curl -s https://reportes.progressiagroup.com/api/dependencias | jq length
```

### Solución 3: VACUUM Repair

```bash
ssh root@145.79.0.77

# Intentar reparar
docker exec citizen-reports-app \
  sqlite3 /app/server/data.db "VACUUM;"

# Verificar
docker exec citizen-reports-app \
  sqlite3 /app/server/data.db "PRAGMA integrity_check;"
```

---

## 📊 Empty Results

### Síntoma

```bash
curl https://reportes.progressiagroup.com/api/reportes
# []  (array vacío)

Pero UI muestra "No hay datos"
```

### Diagnóstico

```bash
ssh root@145.79.0.77

# Contar reportes
docker exec citizen-reports-app \
  sqlite3 /app/server/data.db "SELECT COUNT(*) FROM reportes;"
# Si resultado es 0: Base de datos vacía

# Contar dependencias
docker exec citizen-reports-app \
  sqlite3 /app/server/data.db "SELECT COUNT(*) FROM dependencias;"
# Si resultado es 0: Schema no inicializado

# Ver qué tablas existen
docker exec citizen-reports-app \
  sqlite3 /app/server/data.db ".tables"
```

### Soluciones

| Causa | Solución |
|-------|----------|
| Base inicializada pero vacía | Esperar a que ciudadanos reporten |
| Schema no existe | `docker exec citizen-reports-app npm run init` |
| Query tiene filtro muy restrictivo | Revisar filtros en API |

---

## 🆘 Si Nada Funciona

**Último recurso - Full Reset:**

```bash
ssh root@145.79.0.77

cd /root/citizen-reports

# Nuclear option
docker compose down -v
docker system prune -a -f
docker compose up -d

sleep 60

# Completamente nuevo
curl -I https://reportes.progressiagroup.com/

# Si aún no funciona: CONTACTAR DESARROLLADOR con:
# - docker logs citizen-reports-app (últimas 100 líneas)
# - docker stats citizen-reports-app
# - Qué pasos hiciste antes de fallar
```

---

**Troubleshooting Matrix v1.0**  
Última actualización: 11 Noviembre 2025  
Para reportar problemas: Contactar operaciones
