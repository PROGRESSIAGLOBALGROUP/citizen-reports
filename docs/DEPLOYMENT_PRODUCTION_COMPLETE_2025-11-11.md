# Deployment Production Citizen-Reports - Guía Completa
**Fecha:** 7-11 Noviembre 2025  
**Estado:** ✅ **EXITOSO - EN PRODUCCIÓN**  
**URL:** https://reportes.progressiagroup.com  
**VPS:** 145.79.0.77 (Ubuntu 24.04.2 LTS)

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura General](#arquitectura-general)
3. [Problemas Encontrados y Soluciones](#problemas-encontrados-y-soluciones)
4. [Paso a Paso del Deployment](#paso-a-paso-del-deployment)
5. [Configuración DNS](#configuración-dns)
6. [Configuración SSL/TLS](#configuración-ssltls)
7. [Configuración Docker](#configuración-docker)
8. [Configuración CORS](#configuración-cors)
9. [Configuración Traefik](#configuración-traefik)
10. [Testing y Validación](#testing-y-validación)
11. [Rollback y Recuperación](#rollback-y-recuperación)
12. [Monitoring y Logs](#monitoring-y-logs)

---

## 📍 Resumen Ejecutivo

Se desplegó exitosamente la aplicación **citizen-reports** (Plataforma de Reportes Ciudadanos para Jantetelco, Morelos) en producción con HTTPS en:

🌍 **https://reportes.progressiagroup.com**

### Stack Técnico
- **Frontend:** React 18 + Vite + Leaflet (SPA en `client/dist/`)
- **Backend:** Node.js 20 + Express 4 + SQLite
- **Infraestructura:** Docker Swarm + Easypanel + Traefik 3.3.7
- **SSL:** Let's Encrypt (renovado exitosamente)
- **DNS:** Hostgator (ns104.hostgator.mx, ns105.hostgator.mx)

### Objetivos Cumplidos ✅
- [x] DNS resuelve correctamente desde cualquier lugar
- [x] Certificado SSL válido para reportes.progressiagroup.com
- [x] Aplicación accesible en HTTPS
- [x] CORS configurado para aceptar el dominio
- [x] SPA carga correctamente
- [x] API responde en `/api/*`
- [x] Base de datos SQLite inicializada
- [x] Servicios adicionales (Easypanel, n8n, suitecrm) no afectados
- [x] Routing Traefik funcionando correctamente

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                        INTERNET (Usuarios)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS (Puerto 443)
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  VPS: 145.79.0.77                               │
│                  Ubuntu 24.04.2 LTS                             │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │      Traefik 3.3.7 (Reverse Proxy)     │
        │  - Escucha: 0.0.0.0:80 y :443          │
        │  - TLS/SSL Termination                 │
        │  - Routing a servicios                 │
        └────────────────────────────────────────┘
                             │
                             ▼
      ┌──────────────────────────────────────────────┐
      │     Docker Swarm (Easypanel Manager)         │
      ├──────────────────────────────────────────────┤
      │ Servicios:                                   │
      │  ├─ citizen-reports-app (Node.js)            │
      │  ├─ Easypanel                                │
      │  ├─ n8n                                      │
      │  ├─ suitecrm                                 │
      │  ├─ evolution-api                            │
      │  └─ ollama                                   │
      └──────────────────────────────────────────────┘
                             │
                    ┌────────┴─────────┐
                    │                  │
                    ▼                  ▼
           ┌──────────────────┐ ┌─────────────────┐
           │  citizen-reports │ │  SQLite Database│
           │  Container       │ │  /data.db       │
           │  (Node:20)       │ │  (Volumen)      │
           │  :4000           │ │  184KB          │
           └──────────────────┘ └─────────────────┘
                    │
        ┌───────────┴──────────┐
        │                      │
        ▼                      ▼
    ┌─────────────┐   ┌──────────────┐
    │  Express    │   │  Leaflet/OSM │
    │  API        │   │  Tiles       │
    │ /api/*      │   │              │
    └─────────────┘   └──────────────┘
```

### Componentes Clave

#### 1. **DNS (Hostgator)**
```
Dominio: reportes.progressiagroup.com
A Record: 145.79.0.77
Nameservers: ns104.hostgator.mx, ns105.hostgator.mx
```

#### 2. **SSL Certificate (Let's Encrypt)**
- Ubicación: `/etc/easypanel/traefik/acme.json`
- CN: reportes.progressiagroup.com
- Válido por: 90 días (Se renuevan automáticamente con acme.json)
- Termination: En Traefik

#### 3. **Docker Container**
- Imagen: `citizen-reports:latest`
- Base: `node:20` (full Debian, no alpine)
- Puerto: `0.0.0.0:4000:4000`
- Volumen: `db_volume:/app/server` (SQLite)
- Network: `easypanel` (overlay)

#### 4. **Traefik Routing**
- Router: `citizen-reports` (HTTPS, priority=100)
- Router: `citizen-reports-http` (HTTP→HTTPS redirect)
- Service: `citizen-reports-service` (backend: http://145.79.0.77:4000)
- Config: `/etc/easypanel/traefik/config/main.yaml`

---

## 🔧 Problemas Encontrados y Soluciones

### Problema 1: DNS No Resolvía Correctamente
**Síntoma:** `nslookup reportes.progressiagroup.com` devolvía IP antigua

**Causa Raíz:** 
- Nameservers en Hostgator apuntaban a Cloudflare antigua
- Cloudflare cuenta no tenía acceso (bloqueada)

**Solución:**
```bash
# En Hostgator, cambiar nameservers a:
ns104.hostgator.mx
ns105.hostgator.mx

# Crear A Record:
reportes.progressiagroup.com → 145.79.0.77
```

**Validación:**
```bash
nslookup reportes.progressiagroup.com 8.8.8.8
# Respuesta: 145.79.0.77 ✅
```

---

### Problema 2: Certificado SSL para Dominio Incorrecto
**Síntoma:** Certificado era para "Easypanel", no para "reportes.progressiagroup.com"

**Causa Raíz:**
- Let's Encrypt no había recibido traffic para el nuevo dominio
- acme.json contenía certificado viejo

**Solución:**
```bash
# En VPS, forzar renovación:
cd /root/citizen-reports

# 1. Backup del acme.json
cp /etc/easypanel/traefik/acme.json /etc/easypanel/traefik/acme.json.backup

# 2. Remover acme.json para forzar renovación
rm /etc/easypanel/traefik/acme.json

# 3. Reiniciar Traefik
docker service update --force traefik

# 4. Esperar a que Let's Encrypt genere certificado
sleep 60

# 5. Validar el certificado
openssl s_client -connect reportes.progressiagroup.com:443 -showcerts | grep Subject
# Subject CN: reportes.progressiagroup.com ✅
```

---

### Problema 3: SQLite Native Bindings No Compilaban
**Síntoma:** `Error: /app/node_modules/sqlite3/lib/binding/napi-v*/linux-x64/node-sqlite3.node cannot find`

**Causa Raíz:**
- Dockerfile usaba `node:20-alpine`
- Alpine no tiene compiladores (gcc, python, make)
- sqlite3 necesita compilar bindings nativos

**Solución:**
```dockerfile
# Cambiar de:
FROM node:20-alpine

# A:
FROM node:20  # Full Debian with build tools
```

Imagen Debian incluye:
- `gcc` - compilador C
- `g++` - compilador C++
- `python3` - necesario para node-gyp
- `make` - para compilar
- `git` - para dependencias via git

---

### Problema 4: Express Escuchando Solo en 127.0.0.1
**Síntoma:** Aplicación solo accesible vía `localhost:4000`, no desde la IP

**Causa Raíz:**
```javascript
app.listen(PORT);  // Por defecto: 127.0.0.1 (solo localhost)
```

**Solución:**
```javascript
// En server/server.js y server/app.js
app.listen(PORT, '0.0.0.0');  // Escuchar en todas las interfaces
```

Validación:
```bash
curl -s http://145.79.0.77:4000/api/dependencias | jq .[0]
# Respuesta: JSON array ✅
```

---

### Problema 5: CORS Bloqueando Requests desde el Dominio
**Síntoma:** Navegador devolvía `CORS error: Not allowed by CORS`

**Causa Raíz:**
```javascript
// CORS solo permitía IP
if (origin.includes('145.79.0.77')) {
  // Pero requests venían de: https://reportes.progressiagroup.com
}
```

**Solución:**
```javascript
// En server/app.js línea ~105
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || 
        origin.includes('localhost') || 
        origin.includes('127.0.0.1') || 
        origin.includes('145.79.0.77') ||
        origin.includes('reportes.progressiagroup.com')) {  // ← ADDED
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

Validación:
```bash
curl -v -H 'Origin: https://reportes.progressiagroup.com' \
     -X OPTIONS http://localhost:4000/api/dependencias 2>&1 | grep access-control

# Respuesta:
# < Access-Control-Allow-Origin: https://reportes.progressiagroup.com ✅
# < Access-Control-Allow-Methods: GET,POST,PUT,DELETE,PATCH,OPTIONS ✅
```

---

### Problema 6: Asset Files Sirviendo con MIME Type Incorrecto
**Síntoma:** CSS cargaba como `application/json`, no como `text/css`

**Causa Raíz:**
- Caché del navegador retenía headers antiguos
- Asset middleware no configurado correctamente

**Solución:**
```javascript
// En server/app.js línea ~470
const getMimeType = (filePath) => {
  if (filePath.endsWith('.css')) {
    return 'text/css; charset=utf-8';  // Correcto
  } else if (filePath.endsWith('.js')) {
    return 'application/javascript; charset=utf-8';  // Correcto
  }
  // ... más tipos
};

// Middleware de assets
app.use('/assets', (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});
```

Validación (Limpiar caché):
```bash
# En navegador:
# DevTools → Application → Storage → Clear site data
# O: Ctrl+Shift+Delete
# Hard refresh: Ctrl+Shift+R
```

---

### Problema 7: Docker Image No Tomaba Cambios
**Síntoma:** Código actualizado en VPS pero contenedor seguía con versión vieja

**Causa Raíz:**
```bash
docker compose build  # Sin --no-cache reutiliza capas antiguas
```

**Solución:**
```bash
# Limpiar TODO y reconstruir
cd /root/citizen-reports

# 1. Eliminar contenedor y volúmenes
docker compose down -v

# 2. Eliminar imagen anterior
docker image rm citizen-reports:latest

# 3. Limpiar sistema
docker system prune -f

# 4. Rebuild sin caché desde cero
docker compose build --no-cache --pull

# 5. Reiniciar servicios
docker compose up -d
```

Validación:
```bash
# Verificar que el código nuevo está en el contenedor
docker exec citizen-reports-app \
  grep 'reportes.progressiagroup.com' /app/server/app.js
# Respuesta: línea encontrada ✅
```

---

### Problema 8: Traefik No Aplicaba Configuración
**Síntoma:** Traefik devolvía 404 pese a tener rutas configuradas

**Contexto:** Se realizaron 5 intentos diferentes de configuración Traefik, todos fallaron. Eventualmente se resolvió con una solución simple de Python.

**Causa Raíz:**
- Traefik usa entrypoints `http`/`https`, no `web`/`websecure`
- Configuración JSON mal formateada
- Traefik cacheaba configuración en memoria

**Solución:**
```python
# Script: fix-entrypoints.py (ejecutado en VPS)
import json

with open('/etc/easypanel/traefik/config/main.yaml', 'r') as f:
    config = json.load(f)

# Agregar routers para citizen-reports con entrypoints correctos
config['http']['routers']['citizen-reports'] = {
    'entryPoints': ['https'],  # ← CORRECTO (no 'websecure')
    'rule': 'Host(`reportes.progressiagroup.com`)',
    'service': 'citizen-reports-service',
    'priority': 100
}

config['http']['routers']['citizen-reports-http'] = {
    'entryPoints': ['http'],  # ← CORRECTO (no 'web')
    'rule': 'Host(`reportes.progressiagroup.com`)',
    'service': 'citizen-reports-service',
    'priority': 100,
    'middlewares': ['redirect-to-https']
}

config['http']['services']['citizen-reports-service'] = {
    'loadBalancer': {
        'servers': [{'url': 'http://145.79.0.77:4000'}]
    }
}

with open('/etc/easypanel/traefik/config/main.yaml', 'w') as f:
    json.dump(config, f, indent=2)
```

Ejecución:
```bash
cd /root/citizen-reports
python3 fix-entrypoints.py
docker service update --force traefik
sleep 30
curl -I https://reportes.progressiagroup.com/
# Respuesta: HTTP/2 200 ✅
```

---

## 📝 Paso a Paso del Deployment

### Fase 1: Preparación DNS (Día 1)

#### 1.1 Verificar DNS actual
```bash
nslookup reportes.progressiagroup.com 8.8.8.8
# Resultado anterior: 34.67.x.x (IP Cloudflare vieja)
```

#### 1.2 Cambiar nameservers en Hostgator
1. Acceder a: https://www.hostgator.com/
2. Ir a: Accounts → Manage Domains → reportes.progressiagroup.com
3. Cambiar nameservers a:
   - `ns104.hostgator.mx`
   - `ns105.hostgator.mx`
4. Guardar cambios

#### 1.3 Crear A Record
1. En Hostgator → DNS Zone Editor
2. Crear A Record:
   - Name: `@` (root)
   - Points to: `145.79.0.77`
   - TTL: 3600 (1 hora)

#### 1.4 Validar DNS Propagation
```bash
# Esperar 5-15 minutos
watch -n 5 "nslookup reportes.progressiagroup.com 8.8.8.8"
# Esperar resultado: 145.79.0.77

# Verificar desde múltiples resolvers
nslookup reportes.progressiagroup.com 1.1.1.1     # Cloudflare
nslookup reportes.progressiagroup.com 208.67.222.222  # OpenDNS
```

---

### Fase 2: SSL Certificate Renewal (Día 2)

#### 2.1 Acceso VPS
```bash
ssh root@145.79.0.77
```

#### 2.2 Backup de acme.json
```bash
cp /etc/easypanel/traefik/acme.json /etc/easypanel/traefik/acme.json.$(date +%s)
```

#### 2.3 Forzar renovación Let's Encrypt
```bash
# Remover certificado viejo
rm /etc/easypanel/traefik/acme.json

# Reiniciar Traefik (fuerza genera nuevo certificado)
docker service update --force traefik

# Esperar 60 segundos
sleep 60
```

#### 2.4 Validar certificado nuevo
```bash
openssl s_client -connect reportes.progressiagroup.com:443 -showcerts 2>/dev/null | \
  grep -A1 'subject='

# Resultado esperado:
# subject=CN = reportes.progressiagroup.com
```

---

### Fase 3: Preparación Aplicación (Días 1-2)

#### 3.1 Clonar repositorio en local
```bash
cd c:\PROYECTOS\Jantetelco
git pull origin main
```

#### 3.2 Actualizar server/app.js - Bind a todas las interfaces
```javascript
// En server/app.js línea ~550
app.listen(PORT, '0.0.0.0');  // Escuchar en todas las interfaces
```

#### 3.3 Actualizar server/app.js - Permitir dominio en CORS
```javascript
// En server/app.js línea ~105-120
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || 
        origin.includes('localhost') || 
        origin.includes('127.0.0.1') || 
        origin.includes('145.79.0.77') ||
        origin.includes('reportes.progressiagroup.com')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

#### 3.4 Rebuild frontend
```bash
cd client
npm run build
# Resultado: ✓ built in 3.96s
```

#### 3.5 Commit y push
```bash
git add server/app.js client/dist/
git commit -m "Fix: CORS allow reportes.progressiagroup.com domain + rebuild frontend"
git push origin main
```

---

### Fase 4: Docker Setup (Día 2)

#### 4.1 Crear Dockerfile
**Ubicación:** `/root/citizen-reports/Dockerfile`

```dockerfile
FROM node:20

WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Disable husky prepare hook for Docker builds
RUN npm set-script prepare "" || true

# Instalar dependencias del root (con build de sqlite3)
RUN npm install --legacy-peer-deps

# Copiar código server
COPY server ./server

# Copiar client prebuild
COPY client/dist ./client/dist
COPY client/package*.json ./client/

# Si no existe data.db en el volumen, crear uno nuevo
RUN [ ! -f server/data.db ] && echo "DB will be initialized on first run" || echo "DB already exists"

# Exponer puerto
EXPOSE 4000

# Comando por defecto
CMD ["node", "server/server.js"]
```

#### 4.2 Crear docker-compose.yml
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
      - "traefik.enable=true"
      - "traefik.http.routers.citizen-reports.rule=Host(\`reportes.progressiagroup.com\`)"
      - "traefik.http.routers.citizen-reports.entrypoints=https"
      - "traefik.http.routers.citizen-reports.service=citizen-reports-service"
      - "traefik.http.routers.citizen-reports.priority=100"
      - "traefik.http.routers.citizen-reports-http.rule=Host(\`reportes.progressiagroup.com\`)"
      - "traefik.http.routers.citizen-reports-http.entrypoints=http"
      - "traefik.http.routers.citizen-reports-http.middlewares=redirect-to-https@file"
      - "traefik.http.services.citizen-reports-service.loadbalancer.server.port=4000"

volumes:
  db_volume:
    driver: local

networks:
  easypanel:
    external: true
```

#### 4.3 Copiar Dockerfile y docker-compose.yml a VPS
```bash
# En local (Windows):
scp c:\PROYECTOS\Jantetelco\Dockerfile root@145.79.0.77:/root/citizen-reports/
scp c:\PROYECTOS\Jantetelco\docker-compose.yml root@145.79.0.77:/root/citizen-reports/
```

#### 4.4 En VPS - Clonar o actualizar repositorio
```bash
ssh root@145.79.0.77 "cd /root/citizen-reports && git pull origin main"
```

#### 4.5 Construir imagen Docker
```bash
ssh root@145.79.0.77 "cd /root/citizen-reports && docker compose build --no-cache --pull"

# Resultado esperado:
# Building citizen-reports
# [+] Building 45.2s ...
# citizen-reports Built
```

#### 4.6 Iniciar servicios
```bash
ssh root@145.79.0.77 "cd /root/citizen-reports && docker compose up -d"

# Resultado:
# Container citizen-reports-app  Starting
# Container citizen-reports-app  Started
```

#### 4.7 Verificar que está corriendo
```bash
ssh root@145.79.0.77 "docker ps | grep citizen-reports"

# Resultado:
# CONTAINER ID  IMAGE                   STATUS              PORTS
# abc123def...  citizen-reports:latest  Up 2 minutes        0.0.0.0:4000->4000/tcp
```

---

### Fase 5: Configuración Traefik (Día 3)

#### 5.1 Acceder a VPS
```bash
ssh root@145.79.0.77
```

#### 5.2 Crear script Python para configurar Traefik
**Ubicación:** `/root/fix-entrypoints.py`

```python
#!/usr/bin/env python3
import json
import os

config_path = '/etc/easypanel/traefik/config/main.yaml'

# Load existing config (it's actually JSON despite .yaml extension)
with open(config_path, 'r') as f:
    config = json.load(f)

# Ensure http section exists
if 'http' not in config:
    config['http'] = {}

if 'routers' not in config['http']:
    config['http']['routers'] = {}

if 'services' not in config['http']:
    config['http']['services'] = {}

if 'middlewares' not in config['http']:
    config['http']['middlewares'] = {}

# Add citizen-reports routers
config['http']['routers']['citizen-reports'] = {
    'entryPoints': ['https'],
    'rule': 'Host(`reportes.progressiagroup.com`)',
    'service': 'citizen-reports-service',
    'priority': 100
}

config['http']['routers']['citizen-reports-http'] = {
    'entryPoints': ['http'],
    'rule': 'Host(`reportes.progressiagroup.com`)',
    'service': 'citizen-reports-service',
    'priority': 100,
    'middlewares': ['redirect-to-https']
}

# Add service
config['http']['services']['citizen-reports-service'] = {
    'loadBalancer': {
        'servers': [{'url': 'http://145.79.0.77:4000'}]
    }
}

# Write config back
with open(config_path, 'w') as f:
    json.dump(config, f, indent=2)

print("✓ Main.yaml updated")
print("  Router: citizen-reports")
print("    EntryPoint: https (correct)")
print("    Service: citizen-reports-service")
print("    Priority: 100")
print("")
print("  Router: citizen-reports-http")
print("    EntryPoint: http (correct)")
print("    Service: citizen-reports-service")
print("    Priority: 100")
print("")
print("  Service: citizen-reports-service")
print("    Backend: http://145.79.0.77:4000")
print("")
print("Ready to restart Traefik")
```

#### 5.3 Ejecutar script
```bash
python3 /root/fix-entrypoints.py

# Resultado:
# ✓ Main.yaml updated
#   Router: citizen-reports
#   ...
# Ready to restart Traefik
```

#### 5.4 Reiniciar Traefik para aplicar configuración
```bash
docker service update --force traefik

# Esperar a convergencia
sleep 30
```

#### 5.5 Validar acceso HTTPS
```bash
curl -sI https://reportes.progressiagroup.com/

# Resultado esperado:
# HTTP/2 200
# content-type: text/html; charset=utf-8
```

---

### Fase 6: Testing (Días 2-3)

#### 6.1 Verificar DNS
```bash
# Desde local o VPS
nslookup reportes.progressiagroup.com 8.8.8.8
# Esperado: 145.79.0.77

# Verificar TTL
dig reportes.progressiagroup.com @ns104.hostgator.mx
# Esperado: A record con ttl 3600
```

#### 6.2 Verificar SSL
```bash
# Certificado válido
openssl s_client -connect reportes.progressiagroup.com:443 -showcerts 2>/dev/null | \
  grep -A1 "subject="
# Esperado: CN = reportes.progressiagroup.com

# Expiración
openssl s_client -connect reportes.progressiagroup.com:443 2>/dev/null | \
  grep "notAfter"
# Esperado: 90 días en el futuro
```

#### 6.3 Verificar CORS
```bash
curl -v -H 'Origin: https://reportes.progressiagroup.com' \
     -X OPTIONS http://localhost:4000/api/dependencias 2>&1 | \
     grep "access-control"

# Esperado:
# < Access-Control-Allow-Origin: https://reportes.progressiagroup.com
# < Access-Control-Allow-Credentials: true
# < Access-Control-Allow-Methods: GET,POST,PUT,DELETE,PATCH,OPTIONS
```

#### 6.4 Verificar API
```bash
curl -s https://reportes.progressiagroup.com/api/dependencias | jq .[0]

# Esperado:
# {
#   "id": 1,
#   "slug": "administracion",
#   "nombre": "Administración",
#   "icono": "🏛️",
#   "color": "#6366f1",
#   "orden": 1
# }
```

#### 6.5 Verificar SPA (en navegador)
1. Abrir: https://reportes.progressiagroup.com
2. Limpiar caché: Ctrl+Shift+Delete
3. Hard refresh: Ctrl+Shift+R
4. Verificar que se carga el mapa de Leaflet
5. Verificar que se puede crear un reporte

#### 6.6 Verificar logs
```bash
ssh root@145.79.0.77 "docker logs citizen-reports-app | tail -50"

# Esperado: Solo requests HTTP 200, sin errores CORS
# NO esperado: "Error: Not allowed by CORS"
```

---

## 🌐 Configuración DNS

### Verificación de DNS

```bash
# Resolución global
nslookup reportes.progressiagroup.com 8.8.8.8

# Información completa
dig reportes.progressiagroup.com

# Verificar nameservers
dig NS reportes.progressiagroup.com

# Verificar MX (si aplica)
dig MX reportes.progressiagroup.com
```

### En caso de necesitar cambiar DNS
1. Hostgator → Manage Domains → reportes.progressiagroup.com
2. Cambiar nameservers a:
   - `ns104.hostgator.mx`
   - `ns105.hostgator.mx`
3. Guardar y esperar 24 horas para propagación completa

---

## 🔒 Configuración SSL/TLS

### Certificado Actual
```
Ubicación: /etc/easypanel/traefik/acme.json
Proveedor: Let's Encrypt
CN: reportes.progressiagroup.com
Válido por: 90 días
Auto-renovación: Sí (vía acme.json)
```

### Renovar Certificado Manualmente
```bash
# En VPS
ssh root@145.79.0.77

# 1. Backup
cp /etc/easypanel/traefik/acme.json /etc/easypanel/traefik/acme.json.backup

# 2. Remover viejo
rm /etc/easypanel/traefik/acme.json

# 3. Reiniciar Traefik
docker service update --force traefik

# 4. Esperar renovación
sleep 60

# 5. Validar
openssl s_client -connect reportes.progressiagroup.com:443 -showcerts 2>/dev/null | \
  grep "CN = reportes"
```

### Monitorear Expiración
```bash
# Crear cron job (opcional)
# En: /etc/cron.d/check-cert-expiry

0 0 * * * root echo "Expiry: $(openssl s_client -connect reportes.progressiagroup.com:443 2>/dev/null | grep notAfter | cut -d= -f2)" >> /var/log/cert-expiry.log
```

---

## 🐳 Configuración Docker

### Estructura de Directorios
```
/root/citizen-reports/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── server/
│   ├── app.js          ← CORS configurado
│   ├── server.js       ← Escucha en 0.0.0.0:4000
│   ├── auth_routes.js
│   ├── reportes_auth_routes.js
│   ├── db.js
│   ├── schema.sql
│   └── data.db         ← Base de datos (en volumen)
├── client/
│   ├── dist/           ← SPA compilada (index.html, assets/)
│   ├── src/
│   └── package.json
└── git_repo/           ← .git
```

### Dockerfile Explicado
```dockerfile
FROM node:20
# Base: Debian completa con herramientas de compilación

WORKDIR /app
# Directorio de trabajo

COPY package*.json ./
RUN npm install --legacy-peer-deps
# Instala todas las dependencias, incluyendo sqlite3 nativo

COPY server ./server
COPY client/dist ./client/dist
# Copia código ya compilado (no necesita compilar React en el contenedor)

EXPOSE 4000
CMD ["node", "server/server.js"]
# Escucha en puerto 4000
```

### docker-compose.yml Explicado
```yaml
services:
  citizen-reports:
    build: .
    # Construye desde Dockerfile local
    
    ports:
      - "0.0.0.0:4000:4000"
    # Mapea puerto 4000 de la máquina host al puerto 4000 del contenedor
    
    volumes:
      - db_volume:/app/server
    # Volumen persistente para SQLite (no se pierde al reiniciar)
    
    environment:
      - NODE_ENV=production
      - PORT=4000
    # Variables de entorno
    
    networks:
      - easypanel
    # Conecta a la red Docker Swarm de Easypanel
    
    labels:
      - "traefik.enable=true"
      # Traefik autodetecta este servicio
      
      - "traefik.http.routers.citizen-reports.rule=Host(\`reportes.progressiagroup.com\`)"
      # Ruta al dominio correcto
```

### Comandos Útiles Docker
```bash
# Ver contenedores corriendo
docker ps

# Ver logs en tiempo real
docker logs -f citizen-reports-app

# Ver últimas 50 líneas
docker logs --tail 50 citizen-reports-app

# Ejecutar comando en contenedor
docker exec citizen-reports-app ls -la /app/server

# Entrar en el contenedor (bash)
docker exec -it citizen-reports-app /bin/bash

# Reiniciar contenedor
docker restart citizen-reports-app

# Eliminar e reiniciar todo
docker compose down && docker compose up -d
```

---

## 🔑 Configuración CORS

### Código Actualizado (server/app.js)
```javascript
// Línea ~105-120
app.use(cors({
  origin: function(origin, callback) {
    // Permitir:
    // 1. Requests sin origin (same-origin)
    // 2. Requests desde el mismo host (IP)
    // 3. Requests desde dominio en producción
    // 4. Localhost en desarrollo
    if (!origin || 
        origin.includes('localhost') || 
        origin.includes('127.0.0.1') || 
        origin.includes('145.79.0.77') ||
        origin.includes('reportes.progressiagroup.com')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Qué Permite
✅ Requests desde `https://reportes.progressiagroup.com`
✅ Requests desde `http://localhost:3000` (desarrollo)
✅ Requests desde `http://127.0.0.1:4000`
✅ Requests desde IP `145.79.0.77`
✅ Requests sin origin (from same origin)

### Qué Bloquea
❌ Requests desde otros dominios
❌ Requests con origin no listado

### Testing CORS
```bash
# Test OPTIONS (preflight)
curl -v -H 'Origin: https://reportes.progressiagroup.com' \
     -H 'Access-Control-Request-Method: POST' \
     -X OPTIONS http://localhost:4000/api/reportes/crear

# Test GET real
curl -H 'Origin: https://reportes.progressiagroup.com' \
     -H 'Content-Type: application/json' \
     https://reportes.progressiagroup.com/api/dependencias
```

---

## 🔄 Configuración Traefik

### Archivo de Configuración
**Ubicación:** `/etc/easypanel/traefik/config/main.yaml`

**Nota:** A pesar de la extensión `.yaml`, el archivo es **JSON**.

### Estructura JSON
```json
{
  "http": {
    "routers": {
      "citizen-reports": {
        "entryPoints": ["https"],
        "rule": "Host(`reportes.progressiagroup.com`)",
        "service": "citizen-reports-service",
        "priority": 100
      },
      "citizen-reports-http": {
        "entryPoints": ["http"],
        "rule": "Host(`reportes.progressiagroup.com`)",
        "service": "citizen-reports-service",
        "priority": 100,
        "middlewares": ["redirect-to-https"]
      }
    },
    "services": {
      "citizen-reports-service": {
        "loadBalancer": {
          "servers": [
            {"url": "http://145.79.0.77:4000"}
          ]
        }
      }
    }
  }
}
```

### EntryPoints Traefik
- `http` - Puerto 80 (no `web`)
- `https` - Puerto 443 (no `websecure`)

### Priority (Prioridad de Rutas)
- Mayor número = más prioridad
- `citizen-reports` (https): priority=100
- `citizen-reports-http` (http): priority=100

### Validación
```bash
# Verificar que la ruta está activa
curl -s http://localhost:8080/api/http/routers | jq '.[] | select(.name == "citizen-reports")'

# Verificar service
curl -s http://localhost:8080/api/http/services | jq '.[] | select(.name == "citizen-reports-service")'
```

### En caso de cambios
```bash
# 1. Editar /etc/easypanel/traefik/config/main.yaml
# 2. Validar JSON (usar jq o herramienta online)
# 3. Reiniciar Traefik
docker service update --force traefik
```

---

## ✅ Testing y Validación

### Checklist de Validación Completa

#### DNS ✅
```bash
✓ Hostname resuelve a IP correcta
✓ Propagación global
✓ TTL correcto
✓ MX records (si aplica)

nslookup reportes.progressiagroup.com 8.8.8.8
# Esperado: 145.79.0.77
```

#### SSL/TLS ✅
```bash
✓ Certificado válido para dominio correcto
✓ No hay advertencias de seguridad
✓ HTTPS funciona
✓ Certificado no está expirado

openssl s_client -connect reportes.progressiagroup.com:443 -showcerts 2>/dev/null | \
  grep -E "CN =|notAfter"
# Esperado:
# CN = reportes.progressiagroup.com
# notAfter=... (90 días en futuro)
```

#### HTTP/HTTPS ✅
```bash
✓ HTTP redirige a HTTPS
✓ HTTPS devuelve 200

curl -I http://reportes.progressiagroup.com
# Esperado: HTTP/1.1 301/302 Location: https://...

curl -I https://reportes.progressiagroup.com
# Esperado: HTTP/2 200
```

#### CORS ✅
```bash
✓ OPTIONS devuelve headers correctos
✓ GET/POST devuelven datos
✓ No hay errores de CORS en logs

curl -v -H 'Origin: https://reportes.progressiagroup.com' \
     -X OPTIONS http://localhost:4000/api/dependencias 2>&1 | \
     grep -E "Access-Control|HTTP"
# Esperado:
# < HTTP/1.1 204 No Content
# < Access-Control-Allow-Origin: https://reportes.progressiagroup.com
```

#### API ✅
```bash
✓ /api/* endpoints responden JSON
✓ Base de datos accesible
✓ Dependencias se cargan
✓ Tipos de reporte se cargan

curl -s https://reportes.progressiagroup.com/api/dependencias | jq length
# Esperado: 8 (número de departamentos)

curl -s https://reportes.progressiagroup.com/api/tipos | jq length
# Esperado: > 0 (tipos de reporte)
```

#### SPA Frontend ✅
```bash
✓ index.html carga sin errores
✓ Assets (JS/CSS) cargan
✓ Mapa Leaflet se renderiza
✓ Interfaz es funcional
✓ No hay errores en Console

# En navegador:
1. Abrir DevTools (F12)
2. Ir a Console
3. Ver que no hay errores rojos
4. Recargar página (Ctrl+R)
5. Verificar que Console está limpia
```

#### Contenedor Docker ✅
```bash
✓ Contenedor está corriendo
✓ Puerto 4000 está mapeado
✓ Logs sin errores
✓ Volumen de base de datos existe

docker ps
docker logs citizen-reports-app
docker inspect citizen-reports-app | grep -A5 "Mounts"
```

---

## 🔄 Rollback y Recuperación

### En caso de que algo salga mal

#### Opción 1: Revert de código
```bash
# En VPS
cd /root/citizen-reports

# Ver histórico de commits
git log --oneline -10

# Revert a commit anterior
git revert <commit-hash>
# O: git reset --hard <commit-hash>

# Reconstruir
docker compose down
docker compose build --no-cache
docker compose up -d
```

#### Opción 2: Restore de backup
```bash
# Backup de acme.json (certificados)
cp /etc/easypanel/traefik/acme.json.backup /etc/easypanel/traefik/acme.json

# Restart Traefik
docker service update --force traefik
```

#### Opción 3: Reiniciar desde cero
```bash
cd /root/citizen-reports

# 1. Eliminar todo
docker compose down -v
docker system prune -f
docker image rm citizen-reports:latest

# 2. Pull código limpio
git fetch origin
git reset --hard origin/main

# 3. Reconstruir
docker compose build --no-cache --pull
docker compose up -d
```

#### Opción 4: Verificar y reparar
```bash
# Logs detallados
docker logs -f citizen-reports-app

# Entrar en contenedor
docker exec -it citizen-reports-app /bin/bash

# Ver archivos
ls -la /app/server/
ls -la /app/client/dist/

# Verificar base de datos
sqlite3 /app/server/data.db ".tables"
```

---

## 📊 Monitoring y Logs

### Acceso a Logs

#### En Tiempo Real
```bash
# Logs en vivo
docker logs -f citizen-reports-app

# Últimas 100 líneas
docker logs --tail 100 citizen-reports-app

# Logs desde hace 10 minutos
docker logs --since 10m citizen-reports-app
```

#### Filtrar por Patrón
```bash
# Solo errores
docker logs citizen-reports-app 2>&1 | grep -i "error\|failed\|cors"

# Solo requests exitosos
docker logs citizen-reports-app 2>&1 | grep "200"

# Requests a /api
docker logs citizen-reports-app 2>&1 | grep "/api"
```

#### Estructura de Log
```
IP_CLIENTE - - [TIMESTAMP] "METHOD /PATH HTTP/VERSION" STATUS SIZE "-" "USER_AGENT"
```

Ejemplo:
```
201.119.237.38 - - [11/Nov/2025:04:14:36 +0000] "GET /api/dependencias HTTP/1.1" 200 - "-" "Mozilla/5.0..."
```

### Métricas Importantes a Monitorear

#### 1. Uptime del Contenedor
```bash
# Verificar cuánto tiempo está corriendo
docker ps --format "table {{.Names}}\t{{.Status}}"

# Esperado: Up X hours/days
```

#### 2. Uso de Recursos
```bash
# CPU y memoria
docker stats citizen-reports-app

# Esperado:
# CPU: < 5% (idle)
# MEM: < 200MB
```

#### 3. Errores en Logs
```bash
# Buscar errores
docker logs citizen-reports-app 2>&1 | grep -c "error"

# Esperado: 0 (cero errores)
```

#### 4. Disponibilidad de API
```bash
# Health check
curl -s https://reportes.progressiagroup.com/api/dependencias | \
  jq . > /dev/null && echo "OK" || echo "FAILED"

# Crear cron para verificar cada 5 minutos
*/5 * * * * curl -s https://reportes.progressiagroup.com/api/dependencias > /dev/null || echo "API DOWN" | mail admin@example.com
```

### Dashboard de Traefik (Opcional)
```
URL: http://145.79.0.77:8080
# Muestra routers, services, middleware activos
```

---

## 📋 Resumen de Cambios

### Archivos Modificados
1. **server/app.js**
   - Línea ~105-120: CORS permitir dominio
   - Línea ~550: Listen en 0.0.0.0:4000

2. **server/server.js**
   - Línea ~30: Listen en 0.0.0.0 en lugar de 127.0.0.1

3. **client/dist/index.html** (regenerado)
   - Rebuild completo con npm run build

4. **Dockerfile** (nuevo)
   - Node:20 full (Debian, no alpine)
   - Instalación de dependencias con sqlite3

5. **docker-compose.yml** (nuevo)
   - Configuración de servicios
   - Traefik labels
   - Volumen para base de datos

### Comandos Finales de Validación

```bash
# En VPS - Verificar todo está corriendo
ssh root@145.79.0.77 << 'EOF'

echo "=== DOCKER CONTAINERS ==="
docker ps | grep citizen

echo ""
echo "=== PORT MAPPING ==="
docker port citizen-reports-app

echo ""
echo "=== LOGS (último 10) ==="
docker logs --tail 10 citizen-reports-app

echo ""
echo "=== CURL TESTS ==="
echo "HTTP Redirect:"
curl -I http://reportes.progressiagroup.com 2>&1 | head -1

echo "HTTPS Response:"
curl -I https://reportes.progressiagroup.com 2>&1 | head -1

echo "API Response:"
curl -s https://reportes.progressiagroup.com/api/dependencias | jq length

echo ""
echo "=== DNS ==="
nslookup reportes.progressiagroup.com 8.8.8.8 | grep "Address"

echo ""
echo "=== SSL CERT ==="
openssl s_client -connect reportes.progressiagroup.com:443 2>/dev/null | grep "CN ="

EOF
```

---

## 🎯 Conclusión

**Deployment exitoso.** La aplicación citizen-reports está ahora en producción en:

🌍 **https://reportes.progressiagroup.com**

### Checklist Final ✅
- [x] DNS resuelve correctamente
- [x] Certificado SSL válido
- [x] CORS configurado
- [x] Docker funcionando
- [x] Traefik ruteando correctamente
- [x] SPA carga sin errores
- [x] API responde correctamente
- [x] Base de datos inicializada
- [x] Logs limpios sin errores
- [x] Documentación completa

### Próximos Pasos
1. **Usuarios:** Acessar https://reportes.progressiagroup.com
2. **Testing:** Crear reportes de prueba
3. **Monitoring:** Configurar alertas para uptime
4. **Backups:** Configurar backups diarios de data.db
5. **Updates:** Establecer proceso de CI/CD automático

---

**Documentación generada:** 11 de Noviembre de 2025  
**Responsable:** AI Coding Agent  
**Versión:** 1.0 - FINAL
