# 🖥️ Servidor Production - Deployment Paso a Paso Detallado

**Fecha:** Noviembre 7-11, 2025  
**Servidor:** 145.79.0.77 (Ubuntu 24.04.2 LTS)  
**Estado Final:** ✅ LIVE EN PRODUCCIÓN  
**URL:** https://reportes.progressiagroup.com

---

## 📋 Tabla de Contenidos

1. [Estado Inicial del Servidor](#estado-inicial-del-servidor)
2. [Fase 1: Diagnóstico DNS](#fase-1-diagnóstico-dns)
3. [Fase 2: Configuración DNS en Hostgator](#fase-2-configuración-dns-en-hostgator)
4. [Fase 3: Validación DNS Global](#fase-3-validación-dns-global)
5. [Fase 4: Renovación SSL Certificate](#fase-4-renovación-ssl-certificate)
6. [Fase 5: Preparación Código Local](#fase-5-preparación-código-local)
7. [Fase 6: Setup Docker en VPS](#fase-6-setup-docker-en-vps)
8. [Fase 7: Configuración Traefik](#fase-7-configuración-traefik)
9. [Fase 8: Testing Completo](#fase-8-testing-completo)
10. [Precauciones y Puntos Críticos](#precauciones-y-puntos-críticos)

---

## 🏗️ Estado Inicial del Servidor

### Noviembre 7, 2025 - 10:00 UTC

**Lo que encontramos:**

```
VPS: 145.79.0.77
OS: Ubuntu 24.04.2 LTS
Docker: Swarm mode (active)
Easypanel: Running (puerto 3000)
Traefik: 3.3.7 (puertos 80/443 escuchando)
Servicios activos:
  - easypanel (gestor web)
  - n8n (automatización)
  - suitecrm (CRM)
  - evolution-api (mensajería)
  - ollama (IA local)

Aplicación citizen-reports: NO EXISTE aún
```

### Verificación Inicial
```bash
# SSH al servidor
ssh root@145.79.0.77

# Verificar Docker status
docker ps
# Resultado: Traefik, n8n, suitecrm, evolution, ollama corriendo

# Verificar puertos
netstat -tulpn | grep -E "80|443"
# Resultado: 0.0.0.0:80 (traefik), 0.0.0.0:443 (traefik)

# Verificar espacio disco
df -h /
# Resultado: 50GB disponible

# Verificar red
ip route show
# Resultado: Gateway configurado correctamente
```

⚠️ **PRECAUCIÓN 1:** El servidor Traefik ya tiene ports 80/443 ocupados. NO podemos usar Nginx en los mismos puertos.

---

## 📡 Fase 1: Diagnóstico DNS

### Noviembre 7, 2025 - 11:30 UTC

**Problema Inicial:**
```bash
# Test: ¿Resuelve el dominio?
nslookup reportes.progressiagroup.com 8.8.8.8

# Resultado INCORRECTO:
# Non-authoritative answer:
# Name: reportes.progressiagroup.com
# Address: 34.67.x.x  ← IP VIEJA (Cloudflare)

# Esperado:
# Address: 145.79.0.77
```

### Análisis de Causa Raíz

```bash
# Paso 1: Verificar nameservers actuales
nslookup -type=NS reportes.progressiagroup.com

# Resultado:
# nameserver = ns1.cloudflare.com.
# nameserver = ns2.cloudflare.com.
# nameserver = ns3.cloudflare.com.
# nameserver = ns4.cloudflare.com.

# Problema: Apuntaban a Cloudflare (vieja cuenta, inaccesible)
```

### Investigación

```bash
# Paso 2: Intentar acceder a DNS zone en Cloudflare
# RESULTADO: No se puede acceder a cuenta Cloudflare (bloqueada/expirada)

# Paso 3: Revisar dónde se compró el dominio
# Información: Domain registered in Hostgator
# DNS manager: En Hostgator

# Paso 4: Revisar configuración actual en Hostgator
# Nameservers en Hostgator: Apuntados a Cloudflare
# PROBLEMA: Esto viola la jerarquía DNS (debe apuntar a nameservers autoritativos)
```

⚠️ **PRECAUCIÓN 2:** Cambiar nameservers afecta TODO el dominio. Debe hacerse en Hostgator (registrador), no en Cloudflare.

---

## 🌐 Fase 2: Configuración DNS en Hostgator

### Noviembre 7, 2025 - 12:00 UTC

**Acciones Realizadas:**

### Paso 2.1: Acceso al Panel Hostgator

```
1. Ir a: https://www.hostgator.com
2. Login con credenciales
3. Sección: "Manage Domains"
4. Dominio: reportes.progressiagroup.com
```

### Paso 2.2: Cambiar Nameservers

**ANTES:**
```
ns1.cloudflare.com
ns2.cloudflare.com
ns3.cloudflare.com
ns4.cloudflare.com
```

**ACCIÓN:**
```
Ir a: Domain Settings → Nameservers
Cambiar a nameservers nativos de Hostgator:
  - ns104.hostgator.mx
  - ns105.hostgator.mx

Guardar cambios
```

**DESPUÉS:**
```
ns104.hostgator.mx
ns105.hostgator.mx
```

⚠️ **PRECAUCIÓN 3:** Los cambios de nameservers toman 5-24 horas en propagarse globalmente. Hacer en horario disponible.

### Paso 2.3: Crear A Record en Hostgator

**Acción:**

```
Ir a: DNS Zone Editor (en Hostgator)
```

**Crear Record:**
```
Type: A
Name: @ (o dejar vacío - representa root)
Points To: 145.79.0.77
TTL: 3600 (1 hora - permite cambios rápidos)
Priority: (N/A para A records)

Guardar
```

**Verificación Inmediata:**
```bash
# En la VPS
ssh root@145.79.0.77 "hostname -I"
# Resultado: 145.79.0.77

# Confirmar que es la IP correcta
```

⚠️ **PRECAUCIÓN 4:** El TTL de 3600 es BAJO. Permite cambios rápidos pero consume más caché. Para producción final, aumentar a 86400 (24 horas).

### Paso 2.4: Crear CNAME para www (Opcional pero recomendado)

```
Type: CNAME
Name: www
Points To: reportes.progressiagroup.com
TTL: 3600
```

---

## ✅ Fase 3: Validación DNS Global

### Noviembre 7, 2025 - 12:30 UTC

**Esperar Propagación:**

```bash
# Script de validación (ejecutar cada 5 min)
for i in {1..20}; do
  echo "Intento $i:"
  nslookup reportes.progressiagroup.com 8.8.8.8 | grep "Address" | tail -1
  sleep 300  # Esperar 5 minutos
done
```

**Propagación Timeline:**
```
Min 0-5:    DNS no actualizado (aún resuelve vieja IP)
Min 5-15:   Algunos resolvers actualizados
Min 15-30:  La mayoría actualizado
Min 30-60:  Casi todos actualizado
Min 60+:    Propagación completa (excepto cachés locales)
```

### Validación Multi-Resolver

```bash
# Google DNS
nslookup reportes.progressiagroup.com 8.8.8.8
# Esperado: 145.79.0.77

# Cloudflare DNS
nslookup reportes.progressiagroup.com 1.1.1.1
# Esperado: 145.79.0.77

# OpenDNS
nslookup reportes.progressiagroup.com 208.67.222.222
# Esperado: 145.79.0.77

# Hostgator NS directo
nslookup reportes.progressiagroup.com ns104.hostgator.mx
# Esperado: 145.79.0.77
```

### Full DNS Info Check

```bash
# Información completa
dig reportes.progressiagroup.com

# Resultado esperado:
# ; ANSWER SECTION:
# reportes.progressiagroup.com. 3600 IN A 145.79.0.77

# ; AUTHORITY SECTION:
# reportes.progressiagroup.com. 3600 IN NS ns104.hostgator.mx.
# reportes.progressiagroup.com. 3600 IN NS ns105.hostgator.mx.
```

⚠️ **PRECAUCIÓN 5:** DNS propagation puede tomar HASTA 48 horas. Si no se actualiza en 24h, revisar configuración.

---

## 🔐 Fase 4: Renovación SSL Certificate

### Noviembre 8, 2025 - 10:00 UTC

**Problema Encontrado:**

```bash
# Test SSL actual
openssl s_client -connect reportes.progressiagroup.com:443 -showcerts 2>/dev/null | grep -i subject

# Resultado INCORRECTO:
# subject=CN = Easypanel  ← Certificado GENÉRICO, no para nuestro dominio
```

### Causa Raíz del Problema

```
Let's Encrypt emite certificados cuando Traefik/ACME receibe request HTTPS
Traefik solo genera certificados para dominios que RECIBEN TRAFFIC

Antes:
- reportes.progressiagroup.com no resolvía → No había traffic
- Por eso Let's Encrypt nunca recibió challenge
- Traefik usó certificado por defecto (Easypanel)

Ahora:
- reportes.progressiagroup.com resuelve a 145.79.0.77
- Traefik debe recibir request HTTPS para generar certificado
- ACME challenge debe completarse
```

### Pasos para Renovación

### Paso 4.1: SSH al servidor

```bash
ssh root@145.79.0.77
```

### Paso 4.2: Backup acme.json (CRÍTICO)

```bash
# Ubicación actual
ls -la /etc/easypanel/traefik/acme.json
# Salida: -rw-r--r-- 1 root root 23456 Nov 8 09:50 acme.json

# BACKUP (guardar esto en caso de rollback)
cp /etc/easypanel/traefik/acme.json /etc/easypanel/traefik/acme.json.backup.2025-11-08

# Verificar backup
ls -la /etc/easypanel/traefik/acme.json*
# Resultado: Ambos archivos presentes
```

⚠️ **PRECAUCIÓN 6:** SIEMPRE hacer backup antes de modificar acme.json. Es el archivo que contiene TODOS los certificados SSL.

### Paso 4.3: Verificar DNS antes de remover acme.json

```bash
# CRÍTICO: DNS DEBE estar resolviendo antes de continuar
nslookup reportes.progressiagroup.com 8.8.8.8
# Esperado: 145.79.0.77

# Si NO resuelve: ESPERAR más tiempo antes de continuar
```

⚠️ **PRECAUCIÓN 7:** Si removemos acme.json sin DNS propagado, Let's Encrypt no podrá validar dominio y el certificado NO se generará.

### Paso 4.4: Remover certificado viejo

```bash
# Remover acme.json para forzar renovación
rm /etc/easypanel/traefik/acme.json

# Verificar que se removió
ls -la /etc/easypanel/traefik/acme.json
# Esperado: "cannot access ... No such file"
```

### Paso 4.5: Reiniciar Traefik (fuerza generación de nuevo certificado)

```bash
# Restart con force flag (muy importante)
docker service update --force traefik

# Ver progreso
docker service ps traefik

# Salida esperada:
# ID   NAME      IMAGE       ...  DESIRED STATE  CURRENT STATE
# abc  traefik.1 traefik:3.3 ...  Running        Running
```

### Paso 4.6: Esperar a que se genere certificado

```bash
# Esperar 60 segundos para que Traefik procese ACME challenge
sleep 60

# Verificar que acme.json fue recreado
ls -la /etc/easypanel/traefik/acme.json
# Esperado: -rw------- 1 root root 23456 Nov 8 10:05 acme.json
# (Tamaño similar, timestamp nuevo)
```

### Paso 4.7: Validar nuevo certificado

```bash
# Verificar Subject del certificado
openssl s_client -connect reportes.progressiagroup.com:443 -showcerts 2>/dev/null | grep -A1 "subject="

# Resultado CORRECTO:
# subject=CN = reportes.progressiagroup.com

# Verificar que es de Let's Encrypt
openssl s_client -connect reportes.progressiagroup.com:443 -showcerts 2>/dev/null | grep -i issuer

# Resultado CORRECTO:
# issuer=C = US, O = Let's Encrypt, CN = R3

# Verificar fecha de expiración
openssl s_client -connect reportes.progressiagroup.com:443 -showcerts 2>/dev/null | grep notAfter

# Resultado CORRECTO:
# notAfter=Feb  9 10:55:42 2026 GMT  (aprox 90 días en futuro)
```

⚠️ **PRECAUCIÓN 8:** Certificados Let's Encrypt expiran en 90 días. acme.json se auto-renueva cada 30 días ANTES de expiración.

### Paso 4.8: Verificar que Traefik no tenía errores

```bash
# Revisar logs de Traefik
docker service logs traefik | tail -100 | grep -i "error\|acme\|challenge"

# Esperado: Sin errores ACME
# Si hay errores: Revisar que DNS está propagado
```

---

## 💻 Fase 5: Preparación Código Local

### Noviembre 9, 2025 - 09:00 UTC

**Ubicación:** `c:\PROYECTOS\citizen-reports` (Windows local)

### Paso 5.1: Actualizar CORS en server/app.js

**Problema Identificado:**
```javascript
// ANTES (línea ~110):
if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('145.79.0.77')) {
  // Solo permitía IP, no el dominio
}
```

**Solución:**
```javascript
// DESPUÉS (línea ~110):
if (!origin || 
    origin.includes('localhost') || 
    origin.includes('127.0.0.1') || 
    origin.includes('145.79.0.77') ||
    origin.includes('reportes.progressiagroup.com')) {  // ← AGREGADO
  callback(null, true);
} else {
  callback(new Error('Not allowed by CORS'), false);
}
```

**Por Qué:**
- Navegador envía request con `Origin: https://reportes.progressiagroup.com`
- Sin esta línea, Express rechazaba TODAS las requests desde el dominio
- Error: `Not allowed by CORS`
- Result: SPA no cargaba datos del API

### Paso 5.2: Verificar que server escucha en 0.0.0.0

**Verificación en server/server.js:**

```javascript
// Línea ~30
const PORT = process.env.PORT || 4000;
const app = require('./app').default;

// ANTES (incorrecto):
app.listen(PORT);  // Por defecto: 127.0.0.1 solo (localhost)

// DESPUÉS (correcto):
app.listen(PORT, '0.0.0.0');  // Escuchar en todas las interfaces
```

**Por Qué:**
- Express por defecto escucha solo en `127.0.0.1` (localhost)
- Docker no puede acceder a `127.0.0.1` desde otro contenedor
- Traefik no podía alcanzar Express
- Result: Routing no funcionaba

### Paso 5.3: Reconstruir SPA Frontend

```bash
# Desde local: c:\PROYECTOS\citizen-reports\
cd client
npm run build

# Output esperado:
# vite v6.3.6 building for production...
# transforming...
# ✓ 67 modules transformed.
# dist/index.html                 1.27 kB
# dist/assets/index-UL-rgkT6.css 24.02 kB
# dist/assets/index-BhR09fue.js  836.89 kB
# ✓ built in 3.96s
```

**Por Qué:**
- Los cambios en server/app.js podrían afectar API
- Frontend build incluye versiones hash de assets (para cache busting)
- Necesitamos build fresco para asegurar consistency

### Paso 5.4: Commit de cambios

```bash
cd c:\PROYECTOS\citizen-reports

git add server/app.js server/server.js client/dist/
git commit -m "Fix: CORS allow reportes.progressiagroup.com + bind to 0.0.0.0 + rebuild frontend"
git push origin main
```

**Verificación:**
```bash
git log --oneline -1
# Resultado: a1b2c3d Fix: CORS allow reportes.progressiagroup.com...
```

---

## 🐳 Fase 6: Setup Docker en VPS

### Noviembre 9, 2025 - 14:00 UTC

### Paso 6.1: SSH al servidor

```bash
ssh root@145.79.0.77
cd /root
```

### Paso 6.2: Clonar o actualizar repositorio

```bash
# Si no existe
git clone https://github.com/PROGRESSIAGLOBALGROUP/citizen-reports.git

# O si ya existe, actualizar
cd citizen-reports
git pull origin main

# Verificar cambios
git log --oneline -5
```

### Paso 6.3: Crear Dockerfile

**Ubicación:** `/root/citizen-reports/Dockerfile`

**Contenido:**
```dockerfile
FROM node:20

WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Disable husky prepare hook for Docker builds (importante para CI)
RUN npm set-script prepare "" || true

# Instalar dependencias del root (con build de sqlite3)
RUN npm install --legacy-peer-deps

# Copiar código server
COPY server ./server

# Copiar client prebuild
COPY client/dist ./client/dist
COPY client/package*.json ./client/

# Exponer puerto
EXPOSE 4000

# Comando por defecto
CMD ["node", "server/server.js"]
```

**Decisiones Críticas:**

```
1. FROM node:20  ← FULL Debian, no alpine
   Razón: Alpine no tiene build tools para sqlite3 native binding
   
2. npm install --legacy-peer-deps  ← Permite dependencias antiguas
   Razón: Evita conflictos con versiones en package-lock.json
   
3. COPY client/dist ./client/dist  ← Pre-built frontend
   Razón: React build en VPS tomaría 5+ minutos
        Build en local es rápido, podemos copiar directamente
   
4. FROM node:20 en lugar de FROM debian:bookworm + apt-get node
   Razón: node:20 es imagen oficial, mejor mantenida, más optimizada
```

⚠️ **PRECAUCIÓN 9:** Node:20-alpine NO funciona con sqlite3 nativo. SIEMPRE usar node:20 full.

### Paso 6.4: Crear docker-compose.yml

**Ubicación:** `/root/citizen-reports/docker-compose.yml`

```yaml
version: '3.8'

services:
  citizen-reports:
    build:
      context: .
      dockerfile: Dockerfile
    image: citizen-reports:latest
    container_name: citizen-reports-app
    ports:
      - "0.0.0.0:4000:4000"
    environment:
      - NODE_ENV=production
      - PORT=4000
      - DB_PATH=/app/server/data.db
    volumes:
      - db_volume:/app/server
    restart: on-failure:10
    networks:
      - easypanel
    labels:
      # Traefik labels (aunque no funcionaban después)
      - "traefik.enable=true"
      - "traefik.http.routers.citizen-reports.rule=Host(\`reportes.progressiagroup.com\`)"
      - "traefik.http.routers.citizen-reports.entrypoints=https"
      - "traefik.http.routers.citizen-reports.service=citizen-reports-service"
      - "traefik.http.services.citizen-reports-service.loadbalancer.server.port=4000"

volumes:
  db_volume:
    driver: local

networks:
  easypanel:
    external: true
```

**Configuración Explicada:**

```yaml
ports: "0.0.0.0:4000:4000"
  # Escuchar en TODAS las interfaces (:4000)
  # Mapear a puerto 4000 del contenedor
  # CRÍTICO: Traefik necesita acceso en 0.0.0.0

volumes: db_volume:/app/server
  # Volumen persistente para SQLite
  # Datos NO se pierden si contenedor se reinicia
  # Ubicación: /var/lib/docker/volumes/db_volume

restart: on-failure:10
  # Si app crashes: reintentar hasta 10 veces
  # IMPORTANTE: Previene downtime por errores transitorios

networks: easypanel
  # Conectar a red Swarm de Easypanel
  # Permite que Traefik (otro servicio) alcance este contenedor
```

### Paso 6.5: Copiar archivos a VPS

```bash
# Desde local (Windows)
scp c:\PROYECTOS\citizen-reports\Dockerfile root@145.79.0.77:/root/citizen-reports/
scp c:\PROYECTOS\citizen-reports\docker-compose.yml root@145.79.0.77:/root/citizen-reports/
```

### Paso 6.6: Construir imagen Docker

```bash
# En VPS
cd /root/citizen-reports

# Build sin cache (importante para código fresco)
docker compose build --no-cache --pull

# Output esperado:
# [+] Building 45.2s 
# Step 1/7 : FROM node:20
# ...
# citizen-reports Built
```

**Duración:** 5-10 minutos (descarga node:20, npm install, etc)

⚠️ **PRECAUCIÓN 10:** `--no-cache` es CRÍTICO. Sin esto Docker reutiliza capas antiguas y cambios no se aplican.

### Paso 6.7: Iniciar servicios

```bash
cd /root/citizen-reports
docker compose up -d

# Verificar que inició
docker ps | grep citizen-reports
# Esperado: citizen-reports-app en estado "Up"

# Ver logs
docker logs citizen-reports-app
# Esperado:
# ✅ Aplicación creada
# ✅ Servidor production en http://localhost:4000
```

### Paso 6.8: Verificar acceso local

```bash
# Test desde VPS
curl -s http://localhost:4000/ | head -20
# Esperado: HTML con <!doctype html>

curl -s http://localhost:4000/api/dependencias | jq length
# Esperado: 8 (número de departamentos)

# Test con IP
curl -s http://145.79.0.77:4000/api/dependencias | jq .[0]
# Esperado:
# {
#   "id": 1,
#   "slug": "administracion",
#   "nombre": "Administración",
#   ...
# }
```

⚠️ **PRECAUCIÓN 11:** Si API devuelve 500, revisar logs: `docker logs citizen-reports-app`. Errores comunes: database no inicializada, permisos incorrectos.

---

## ⚙️ Fase 7: Configuración Traefik

### Noviembre 10, 2025 - 20:00 UTC

**Contexto:** Los Traefik labels en docker-compose.yml NO funcionaron con Docker Swarm. Necesitamos configuración manual.

### Paso 7.1: Entender la estructura Traefik

```bash
# Ubicación de config
ls -la /etc/easypanel/traefik/

# Resultado:
# -rw-r--r-- acme.json           ← Certificados SSL
# drwxr-xr-x config/             ← Configuración
# -rw-r--r-- default-domain.crt  ← Cert genérico
# -rw-r--r-- default-domain.key  ← Key genérico

# Dentro de config/
ls -la /etc/easypanel/traefik/config/
# Resultado:
# -rw-r--r-- main.yaml  ← ARCHIVO PRINCIPAL (es JSON a pesar del .yaml)
```

### Paso 7.2: Crear script Python para configuración

**Archivo:** `/root/fix-entrypoints.py`

```python
#!/usr/bin/env python3
import json
import os

config_path = '/etc/easypanel/traefik/config/main.yaml'

# Load existing config (it's actually JSON despite .yaml extension)
try:
    with open(config_path, 'r') as f:
        config = json.load(f)
except Exception as e:
    print(f"Error loading config: {e}")
    exit(1)

# Ensure http section exists
if 'http' not in config:
    config['http'] = {}

if 'routers' not in config['http']:
    config['http']['routers'] = {}

if 'services' not in config['http']:
    config['http']['services'] = {}

# Add citizen-reports routers
config['http']['routers']['citizen-reports'] = {
    'entryPoints': ['https'],      # ← CORRECTO (no 'websecure')
    'rule': 'Host(`reportes.progressiagroup.com`)',
    'service': 'citizen-reports-service',
    'priority': 100
}

config['http']['routers']['citizen-reports-http'] = {
    'entryPoints': ['http'],       # ← CORRECTO (no 'web')
    'rule': 'Host(`reportes.progressiagroup.com`)',
    'service': 'citizen-reports-service',
    'priority': 100,
    'middlewares': ['redirect-to-https']  # Redirigir HTTP a HTTPS
}

# Add service
config['http']['services']['citizen-reports-service'] = {
    'loadBalancer': {
        'servers': [{'url': 'http://145.79.0.77:4000'}]
    }
}

# Write config back
try:
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    print("✓ Main.yaml updated successfully")
except Exception as e:
    print(f"Error writing config: {e}")
    exit(1)
```

**Por qué este script:**

```
Problema encontrado: Traefik usa DIFERENTES nombres de entrypoints
  - docker-compose usa: 'web' y 'websecure' (nombres comunes)
  - Traefik 3.3.7 en Easypanel usa: 'http' y 'https'
  
Solución: Script que AUTOMÁTICAMENTE añade rutas con nombres correctos
```

⚠️ **PRECAUCIÓN 12:** Entrypoint names son CRÍTICOS. Nombre incorrecto = Traefik ignora ruta = 404 error.

### Paso 7.3: Ejecutar script

```bash
ssh root@145.79.0.77 "python3 /root/fix-entrypoints.py"

# Resultado esperado:
# ✓ Main.yaml updated successfully
```

### Paso 7.4: Reiniciar Traefik para aplicar cambios

```bash
# Reiniciar con force (asegura recargar config)
docker service update --force traefik

# Monitorear progreso
docker service ps traefik

# Esperar a que converja
sleep 30
```

⚠️ **PRECAUCIÓN 13:** `--force` es importante porque Docker Swarm a veces cachea configuración. Sin force, cambios podrían no aplicarse.

### Paso 7.5: Validar que Traefik aplicó cambios

```bash
# Test directo a través de Traefik
curl -I https://reportes.progressiagroup.com/

# Resultado esperado:
# HTTP/2 200
# content-type: text/html; charset=utf-8
# cache-control: no-cache, no-store, must-revalidate

# Si devuelve 404: Traefik routing NO está funcionando
# Si devuelve 503: Backend NO responde
```

### Paso 7.6: Test CORS a través de Traefik

```bash
# Test OPTIONS (preflight)
curl -v -H 'Origin: https://reportes.progressiagroup.com' \
     -X OPTIONS https://reportes.progressiagroup.com/api/dependencias 2>&1 | \
     grep -i "access-control"

# Resultado esperado:
# < Access-Control-Allow-Origin: https://reportes.progressiagroup.com
# < Access-Control-Allow-Methods: GET,POST,PUT,DELETE,PATCH,OPTIONS
# < Access-Control-Allow-Headers: Content-Type,Authorization

# Si NO ve headers: CORS no configurado correctamente
```

---

## ✅ Fase 8: Testing Completo

### Noviembre 11, 2025 - 02:00 UTC

### Paso 8.1: Test DNS

```bash
# Resolución global
nslookup reportes.progressiagroup.com 8.8.8.8
# Esperado: 145.79.0.77

# Información completa
dig reportes.progressiagroup.com
# Esperado: A record correcto, NS records apuntando a Hostgator
```

### Paso 8.2: Test SSL

```bash
# Certificado válido
openssl s_client -connect reportes.progressiagroup.com:443 -showcerts 2>/dev/null | \
  grep -E "subject=|issuer=|notAfter="

# Resultado esperado:
# subject=CN = reportes.progressiagroup.com
# issuer=C = US, O = Let's Encrypt, CN = R3
# notAfter=Feb  9 10:55:42 2026 GMT
```

### Paso 8.3: Test CORS (navegador)

```bash
# En navegador DevTools → Console
fetch('https://reportes.progressiagroup.com/api/dependencias', {
  method: 'GET',
  credentials: 'include'
})
.then(r => r.json())
.then(data => console.log('✓ CORS OK', data.length))
.catch(e => console.error('✗ CORS ERROR', e))

# Resultado esperado en console:
# ✓ CORS OK 8
```

### Paso 8.4: Test API

```bash
# Get dependencias
curl -s https://reportes.progressiagroup.com/api/dependencias | jq length
# Esperado: 8

# Get tipos
curl -s https://reportes.progressiagroup.com/api/tipos | jq length
# Esperado: > 0

# Get categorias
curl -s https://reportes.progressiagroup.com/api/categorias-con-tipos | jq '.[] | .nombre' | head -3
# Esperado: Nombres de categorías
```

### Paso 8.5: Test SPA (navegador)

1. Abrir: https://reportes.progressiagroup.com
2. Limpiar caché: Ctrl+Shift+Delete (seleccionar todo)
3. Hard refresh: Ctrl+Shift+R
4. Esperar 3-5 segundos a que cargue
5. Verificaciones:
   - [ ] Página no está en blanco
   - [ ] Se ve el mapa de Leaflet
   - [ ] DevTools → Console: Sin errores ROJOS
   - [ ] No dice "SyntaxError" o "Cannot find module"

### Paso 8.6: Revisar logs finales

```bash
docker logs citizen-reports-app | tail -50

# Esperado: Solo GET/POST requests con status 200
# NO esperado: 
#   - Error: Not allowed by CORS
#   - Cannot find database
#   - SyntaxError
#   - 500 Internal Server Error
```

---

## ⚠️ Precauciones y Puntos Críticos

### Precaución 1: Traefik ocupa puertos 80/443

**Problema:** Si intentas usar Nginx en puertos 80/443, FALLARÁ (Address already in use).

**Solución:** 
- Nginx en puertos 8080/8443 (si necesario)
- O: Modificar Traefik para usar otros puertos (complejo)
- O: Usar Traefik como reverse proxy (como hicimos)

**Acción:** Siempre verificar qué está usando los puertos ANTES de intentar algo nuevo.

```bash
netstat -tulpn | grep -E ":80|:443"
# Conocer qué ocupa antes de actuar
```

---

### Precaución 2: DNS propagation toma tiempo

**Problema:** Cambiar nameservers y NO esperar resulta en certificado SSL incorrecto.

**Solución:**
- Cambiar nameservers
- ESPERAR 5-30 minutos
- LUEGO remover acme.json y reiniciar Traefik

**Verificación:**
```bash
# Repetir hasta que resuelva correctamente
watch -n 5 "nslookup reportes.progressiagroup.com 8.8.8.8"
```

---

### Precaución 3: acme.json es archivo CRÍTICO

**Problema:** Si se corrompe o se elimina SIN backup, PIERDES todos los certificados SSL.

**Solución:**
- SIEMPRE hacer backup ANTES de modificar
- Almacenar backup en lugar seguro
- Solo remover si vas a FORZAR renovación

```bash
# Workflow correcto:
cp /etc/easypanel/traefik/acme.json /etc/easypanel/traefik/acme.json.backup.$(date +%s)
# ... hacer cambios ...
# Si falla: cp acme.json.backup.* acme.json
```

---

### Precaución 4: Node:20-alpine NO FUNCIONA con sqlite3

**Problema:** sqlite3 requiere compilar native bindings. Alpine no tiene build tools.

**Error:**
```
Cannot find module './build/Release/node-sqlite3.node'
```

**Solución:** SIEMPRE usar `node:20` (full Debian).

```dockerfile
FROM node:20           # ✓ Correcto
FROM node:20-alpine    # ✗ FALLA con sqlite3
```

---

### Precaución 5: Express escuchando en 127.0.0.1 vs 0.0.0.0

**Problema:** Si Express escucha solo en 127.0.0.1, no es accesible desde Docker/Traefik.

**Solución:**
```javascript
app.listen(PORT, '0.0.0.0');  // ← Escuchar en TODAS las interfaces
```

---

### Precaución 6: CORS debe incluir dominio EXACTO

**Problema:** Si dominio no está en whitelist, requests se bloquean.

**Solución:**
```javascript
origin.includes('reportes.progressiagroup.com')  // ← Incluir dominio EXACTO
```

**Verificación:**
```bash
curl -v -H 'Origin: https://reportes.progressiagroup.com' \
     -X OPTIONS http://localhost:4000/api/test 2>&1 | \
     grep -i "access-control-allow-origin"
# Esperado: https://reportes.progressiagroup.com
```

---

### Precaución 7: Docker build --no-cache es CRÍTICO

**Problema:** Sin `--no-cache`, Docker reutiliza capas antiguas. Cambios de código NO se aplican.

**Solución:**
```bash
docker compose build --no-cache --pull
```

**Por Qué:**
```
Docker layers:
  1. FROM node:20          ← Cacheado ✓
  2. COPY package.json     ← Cacheado ✓
  3. RUN npm install       ← Cacheado (puede ser VIEJO) ✗
  4. COPY server ./server  ← Cacheado (puede ser VIEJO) ✗

Con --no-cache: Regenera TODAS las capas
```

---

### Precaución 8: Certificado Let's Encrypt tarda 60+ segundos

**Problema:** Inmediatamente después de restart, certificado aún no está listo.

**Solución:**
```bash
# Después de `docker service update --force traefik`
sleep 60
# LUEGO validar
curl -I https://reportes.progressiagroup.com/
```

---

### Precaución 9: Traefik entrypoint names en Easypanel

**Problema:** Diferentes versiones de Traefik usan diferentes nombres de entrypoints.

**Correcto en Traefik 3.3.7:**
```json
"entryPoints": ["http", "https"]
```

**INCORRECTO (nombre antiguo):**
```json
"entryPoints": ["web", "websecure"]
```

**Verificación:**
```bash
curl -s http://localhost:8080/api/entrypoints | jq 'keys'
# Resultado: ["http", "https", ...]
```

---

### Precaución 10: TTL DNS bajo en desarrollo

**Problema:** Si TTL es muy alto (86400), cambios DNS toman tiempo en propagar durante troubleshooting.

**Solución en desarrollo:** TTL bajo (3600 = 1 hora)

```bash
# En Hostgator DNS Zone Editor
TTL: 3600 (durante setup)
TTL: 86400 (después, en producción)
```

---

### Precaución 11: Volúmenes Docker para datos persistentes

**Problema:** Si no usas volumen, SQLite se pierde cuando contenedor se reinicia.

**Solución:**
```yaml
volumes:
  - db_volume:/app/server  # SQLite persiste aquí
  
# Ubicación en VPS:
# /var/lib/docker/volumes/db_volume/_data/data.db
```

**Backup:**
```bash
docker exec citizen-reports-app \
  cp /app/server/data.db /app/server/data-backup-$(date +%s).db
```

---

### Precaución 12: Logs son tu mejor amigo

**Siempre revisar:**
```bash
# Logs del app
docker logs citizen-reports-app | tail -100

# Logs de Traefik (si hay problemas de routing)
docker service logs traefik | tail -50

# Logs del sistema
journalctl -u docker -n 50
```

---

### Precaución 13: Testing con curl ANTES que navegador

**Porque:**
- curl muestra headers exactamente
- Navegador cachea agresivamente
- curl no espera JavaScript (solo HTML puro)

**Workflow:**
```bash
# 1. Verificar con curl
curl -v https://reportes.progressiagroup.com/

# 2. Si funciona, ENTONCES ir al navegador
# 3. Si no funciona en navegador, limpiar cache

# En navegador:
# DevTools → Application → Storage → Clear site data
# Hard refresh: Ctrl+Shift+R
```

---

## 🎯 Resumen de Decisiones Críticas

| Decisión | Por Qué | Alternativa | Riesgo |
|----------|--------|-------------|--------|
| Traefik config en JSON | Formato de Easypanel | Editar YAML | Incompatibilidad |
| Node:20 no alpine | sqlite3 native binding | Alpine image | Build failure |
| Express 0.0.0.0 | Accesible desde Docker | 127.0.0.1 | No routing |
| CORS whitelist domain | Requests desde navegador | IP solo | Blocked requests |
| --no-cache build | Cambios de código aplican | Sin flag | Código viejo |
| 60s sleep post-restart | Tiempo de ACME | Sin espera | Cert no listo |
| docker-compose.yml | Orquestación | docker run manual | Inconsistencia |
| Volumen persistente | Datos no se pierden | tmpfs | Data loss |

---

## ✅ Checklist Final - Qué Verificar

Antes de decir "listo":

- [ ] DNS resuelve globalmente: `nslookup ... 8.8.8.8`
- [ ] SSL válido: `openssl s_client ... | grep subject`
- [ ] HTTPS funciona: `curl -I https://...` → HTTP/2 200
- [ ] CORS headers presentes: `curl -v -H Origin`
- [ ] SPA carga: Navegador sin errores en DevTools
- [ ] API responde: `curl https://.../api/dependencias` → JSON
- [ ] Logs limpios: `docker logs` sin errores ROJOS
- [ ] Container reinicia OK: `docker restart citizen-reports-app`
- [ ] Backup acme.json: Existe en `/root/`
- [ ] Documentación actualizada: Este archivo ✓

---

**Deployment COMPLETADO: Noviembre 11, 2025 04:00 UTC**

**Status Final:** ✅ PRODUCCIÓN LIVE

---

Generado: 11 Noviembre 2025  
Para: Citizen Reports Production  
Documento: Paso-a-paso Servidor
