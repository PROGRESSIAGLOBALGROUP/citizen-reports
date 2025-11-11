# Deployment Status - citizen-reports en Producción

**Fecha:** 7 de Noviembre de 2025  
**Ambiente:** VPS 145.79.0.77 (Ubuntu 24.04.2, Docker + Traefik + Easypanel)

---

## ✅ COMPLETADO

### Backend/Frontend
- [x] Repository clonado en `/root/citizen-reports/`
- [x] Node.js 20.19.5 instalado en VPS
- [x] `npm install` ejecutado (server + client)
- [x] Frontend buildeado: `npm run build` ✅ (outputs en `client/dist/`)
- [x] Database inicializada: `npm run init` ✅ (`data.db` 184KB con schema)
- [x] Express configurado para servir SPA + API ✅

### Docker
- [x] Docker instalado y funcional
- [x] `docker-compose.yml` creado con Traefik labels
- [x] Container lanzado: `citizen-reports-app` (node:20-alpine)
- [x] Container en puerto 4000 (interno)
- [x] Container conectado a red `easypanel` ✅
- [x] Express listening en 0.0.0.0:4000 ✅
- [x] API respondiendo en http://localhost:4000/api/* ✅
- [x] SPA serving en http://localhost:4000 ✅

### Traefik
- [x] Traefik escuchando en 0.0.0.0:80 y 0.0.0.0:443
- [x] Traefik labels presentes en container
- [x] HTTP → HTTPS redirect configurado (301 Moved Permanently) ✅
- [x] Let's Encrypt cert resolver configurado (`letsencrypt`)
- [x] Ruta configurada: `Host(reportes.progressiagroup.com)` → puerto 4000

---

## ⏳ PENDIENTE: DNS PROPAGACIÓN

### Actual (Bloqueante)
- DNS resoluciones a Cloudflare IPs: 172.67.152.58, 104.21.12.110
- Nameservers aún en Cloudflare (viejo, inaccessible)

### Requerido para completar
1. **User: Cambiar nameservers en Hostgator cPanel**
   - Ir a: Zone Editor → progressiagroup.com → Manage Nameservers
   - Cambiar de: "Cloudflare Nameservers" 
   - A: "Hostgator Nameservers" (nativas)
   - Click: Save/Apply

2. **DNS Propagación** (esperar)
   - Timeframe: 30 minutos a 24 horas
   - Validación: `nslookup reportes.progressiagroup.com 8.8.8.8` → debe retornar 145.79.0.77

3. **Traefik automático**
   - Una vez DNS resuelva a 145.79.0.77:
   - Traefik detecta container con labels
   - Let's Encrypt provisiona certificado
   - HTTPS disponible en `https://reportes.progressiagroup.com`

---

## 🔧 Configuración Técnica

### Docker Compose Labels (Traefik)
```yaml
traefik.enable: "true"
traefik.http.routers.citizen-reports.rule: "Host(`reportes.progressiagroup.com`)"
traefik.http.routers.citizen-reports.entrypoints: "websecure"
traefik.http.routers.citizen-reports.tls.certresolver: "letsencrypt"
traefik.http.services.citizen-reports.loadbalancer.server.port: "4000"
traefik.http.routers.citizen-reports-http.rule: "Host(`reportes.progressiagroup.com`)"
traefik.http.routers.citizen-reports-http.entrypoints: "web"
traefik.http.routers.citizen-reports-http.middlewares: "redirect-to-https"
```

### Container Status
```
CONTAINER ID   IMAGE                CREATED         STATUS          PORTS
c686aafaf5a8   node:20-alpine       15 seconds ago  Up 14 seconds   0.0.0.0:4000->4000/tcp
```

### Database
- Path: `/root/citizen-reports/server/data.db`
- Size: 184 KB (inicializado)
- Tables: Todas presentes (reportes, usuarios, sesiones, etc.)

### Frontend Build
- Path: `/root/citizen-reports/client/dist/`
- Served by: Express en `/`
- Assets: SPA + Leaflet + heatmap JS

### API
- Base URL: `http://localhost:4000/api`
- Endpoints: `/usuarios`, `/dependencias`, `/reportes`, `/tipos`, etc.
- Auth: Token-based (localStorage.auth_token)

---

## 🚀 Próximos Pasos

**IMMEDIATAMENTE:**
1. User cambia nameservers en Hostgator cPanel
2. Wait para propagación DNS

**CUANDO DNS PROPAGUE:**
1. Validar: `nslookup reportes.progressiagroup.com 8.8.8.77` → 145.79.0.77
2. Test: `curl -k https://reportes.progressiagroup.com` → carga SPA
3. Test: `curl https://reportes.progressiagroup.com/api/dependencias` → JSON response
4. Browser: `https://reportes.progressiagroup.com` → mapa interactivo

---

## 🔗 URLs Actuales

| URL | Status | Notes |
|-----|--------|-------|
| http://localhost:4000 | ✅ OK | Solo desde VPS |
| http://145.79.0.77:4000 | ✅ OK | IP pública, puerto expuesto |
| https://reportes.progressiagroup.com | ⏳ ESPERA | DNS pendiente + Let's Encrypt |
| http://reportes.progressiagroup.com | ⏳ ESPERA | Redirige a HTTPS (Traefik) |

---

## 📊 Arquitectura Final

```
┌─────────────────────────────────────┐
│ Cliente (navegador/app)             │
│ https://reportes.progressiagroup.com│
└────────────────┬────────────────────┘
                 │ HTTPS + Let's Encrypt
                 ▼
        ┌────────────────────┐
        │   Traefik (80/443) │
        │  (Easypanel)       │
        └────────────┬───────┘
                     │
        ┌────────────▼─────────────┐
        │ citizen-reports-app      │
        │ (node:20-alpine)         │
        │ - Express server         │
        │ - SPA (client/dist)      │
        │ - SQLite DB              │
        │ Puerto: 4000 (interno)   │
        └──────────────────────────┘
```

---

## 📝 Notas Importantes

- **No hay PM2:** Sistema está containerizado en Docker, no requiere PM2
- **Traefik como reverse proxy:** Maneja HTTPS, certificados, y redirecciones automáticamente
- **Easypanel network:** Container conectado a `easypanel` overlay network (Docker Swarm)
- **Isolation:** Aplicación aislada en container, no afecta otros servicios (n8n, suitecrm, ollama, evolution-api)
- **Restart policy:** Container restart automático si falla (`unless-stopped`)

---

## ⚠️ Si algo falla

### Container down?
```bash
ssh root@145.79.0.77
cd /root/citizen-reports
docker compose up -d
docker logs citizen-reports-app
```

### Traefik no enruta?
```bash
docker inspect citizen-reports-app | grep -A 50 "Labels"
# Verificar que traefik.* labels están presentes
```

### Express error?
```bash
docker logs citizen-reports-app -f
# Watch logs in real-time
```

---

**Status:** Deployment completado, esperando DNS propagación.
