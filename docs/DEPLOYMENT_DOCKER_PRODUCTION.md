# Despliegue de Citizen Reports a Producción

**Última actualización:** 21 de Noviembre de 2025  
**Estado:** ✅ Imagen Docker lista para producción  
**Servidor de producción:** 145.79.0.77:4000

---

## 📦 Contenedor Creado

La imagen Docker `citizen-reports:latest` ha sido **construida exitosamente** con:

| Componente | Estado | Detalles |
|-----------|--------|----------|
| **Frontend** | ✅ Compilado | Vite SPA (623 KB JS comprimido) |
| **Backend** | ✅ Configurado | Express.js + SQLite + PM2 |
| **Database** | ✅ Esquema | SQLite con 9 tablas documentadas |
| **Health Check** | ✅ Incluido | Auto-reinicio si falla |
| **Seguridad** | ✅ Aplicada | Usuario no-root, helmet, validaciones |
| **Tamaño final** | 588 MB | Multi-stage optimizado |

---

## 🚀 Opción 1: Deploy Automático (Recomendado)

### En Windows (PowerShell):

```powershell
cd c:\PROYECTOS\citizen-reports

# Sin credenciales (solo crear imagen local)
.\deploy-prod.ps1

# O con credenciales (crear + push a registry)
.\deploy-prod.ps1 -Tag "2025-11-21" -RegistryUser "progressiaglobalgroup" -RegistryPass "tu_password"
```

### En Linux/Mac (Bash):

```bash
cd /path/to/citizen-reports

# Sin credenciales
bash deploy-prod.sh

# O con credenciales
bash deploy-prod.sh "2025-11-21" "progressiaglobalgroup" "tu_password"
```

---

## 🔧 Opción 2: Deploy Manual

### Paso 1: Build local
```bash
docker build -t citizen-reports:latest --target production -f Dockerfile .
```

### Paso 2: Verificar imagen
```bash
docker images citizen-reports
# Debe mostrar: citizen-reports  latest  [SIZE]  [TIME]
```

### Paso 3: Test local (RECOMENDADO antes de producción)
```bash
# Iniciar contenedor de test
docker run -d \
  --name citizen-reports-test \
  -p 8000:4000 \
  -e DB_PATH=/tmp/test.db \
  citizen-reports:latest

# Esperar 5 segundos
sleep 5

# Verificar health
curl http://localhost:8000/api/reportes?limit=1

# Ver logs
docker logs citizen-reports-test

# Detener
docker stop citizen-reports-test
docker rm citizen-reports-test
```

### Paso 4: Subir a Docker Registry (si lo deseas)
```bash
# Login
docker login -u progressiaglobalgroup

# Tag
docker tag citizen-reports:latest docker.io/progressiaglobalgroup/citizen-reports:2025-11-21

# Push
docker push docker.io/progressiaglobalgroup/citizen-reports:2025-11-21
docker push docker.io/progressiaglobalgroup/citizen-reports:latest

# Logout
docker logout
```

---

## 📍 Deploy a Servidor de Producción (145.79.0.77)

### Prerequisitos:
- ✅ Acceso SSH a root@145.79.0.77
- ✅ Docker instalado en servidor
- ✅ Docker Compose instalado
- ✅ Backup de data.db actual realizado

### Procedimiento:

#### 1. Conectar al servidor
```bash
ssh root@145.79.0.77
cd /root/citizen-reports
```

#### 2. Backup de datos actuales
```bash
# Backup de la BD
cp server/data.db backups/data.db.backup_$(date +%Y%m%d_%H%M%S)

# Backup de backups anteriores (por si acaso)
tar -czf backups/all-backups-$(date +%Y%m%d_%H%M%S).tar.gz backups/*.db
```

#### 3. Descargar nueva imagen
```bash
# Si está en Docker Hub:
docker pull progressiaglobalgroup/citizen-reports:2025-11-21

# O si es imagen local:
docker build -t citizen-reports:latest --target production -f Dockerfile .
```

#### 4. Actualizar docker-compose.yml
```yaml
# Cambiar esta línea:
image: citizen-reports:latest

# A:
image: progressiaglobalgroup/citizen-reports:2025-11-21
# O si es local:
image: citizen-reports:latest
build:
  context: .
  dockerfile: Dockerfile
  target: production
```

#### 5. Detener versión anterior
```bash
docker-compose down
```

#### 6. Iniciar nueva versión
```bash
docker-compose up -d
```

#### 7. Verificar que está corriendo
```bash
# Ver logs
docker logs -f citizen-reports

# Verificar health
curl http://localhost:4000/api/reportes?limit=1

# Ver containers
docker ps | grep citizen-reports
```

#### 8. Verificar datos persistidos
```bash
# Verificar BD
sqlite3 server/data.db "SELECT COUNT(*) FROM reportes;"

# Verificar backups
ls -lh backups/
```

---

## ✅ Validación Post-Deploy

```bash
# 1. Servidor respondiendo
curl http://localhost:4000/

# 2. API de reportes
curl http://localhost:4000/api/reportes?limit=1

# 3. Frontend está servido
curl http://localhost:4000/index.html | head -20

# 4. Mapa interactivo (en browser)
# Ir a: http://145.79.0.77:4000

# 5. Logs sin errores
docker logs citizen-reports | grep -i error

# 6. Base de datos accesible
docker exec citizen-reports sqlite3 /app/server/data.db ".tables"
```

---

## 🔄 Rollback (si algo sale mal)

```bash
# Detener contenedor actual
docker-compose down

# Restaurar BD anterior
cp backups/data.db.backup_TIMESTAMP server/data.db

# Ir a versión anterior en docker-compose.yml
image: citizen-reports:local-20251120-210616

# Reiniciar
docker-compose up -d

# Verificar
docker logs citizen-reports
```

---

## 📊 Información de la Imagen

### Layers (Multi-stage):
1. **client-builder** → Compila frontend con Vite
2. **server-builder** → Descarga dependencias backend
3. **production** → Runtime optimizado (usuario nodejs, non-root)

### Incluye:
- ✅ Express.js (puerto 4000)
- ✅ SQLite (data.db con schema completo)
- ✅ Frontend compilado (SPA + Leaflet)
- ✅ Health checks automáticos
- ✅ Graceful shutdown (dumb-init)
- ✅ Compresión gzip
- ✅ Resource limits (512MB max)

### NO incluye:
- ❌ Base de datos inicializada (se crea al init)
- ❌ Variables de entorno productivas (proporcionar en docker-compose)
- ❌ SSL/TLS (usar Nginx/Apache reverse proxy)
- ❌ PM2 (Docker es el process manager)

---

## 🔐 Variables de Entorno Recomendadas

En `docker-compose.yml`:
```yaml
environment:
  NODE_ENV: production
  PORT: 4000
  DB_PATH: /app/server/data.db
  TZ: America/Mexico_City
  NODE_OPTIONS: "--max-old-space-size=512"  # Si necesitas más RAM
```

---

## 🆘 Troubleshooting

### Contenedor no inicia
```bash
# Ver logs detallados
docker logs -f citizen-reports

# Verificar recursos
docker stats citizen-reports

# Revisar si puerto 4000 está en uso
netstat -tlnp | grep 4000
# Si está en uso: sudo lsof -i :4000
```

### Frontend no carga (HTML en lugar de JSON)
- ✅ **FIJO:** Ruta `/api/usuarios` (sin /api/ fallaba)
- Revisar: `client/src/VerReporte.jsx` línea 411 debe ser `/api/usuarios`

### Base de datos corrupta
```bash
# Verificar integridad
docker exec citizen-reports sqlite3 /app/server/data.db "PRAGMA integrity_check;"

# Rebuild desde schema
docker exec citizen-reports node -e "require('./server/db.js').initDb()"

# O restaurar desde backup
docker cp backups/data.db.backup_TIMESTAMP citizen-reports:/app/server/data.db
```

### Membranas muy alta
```bash
# Aumentar limite
docker update --memory 1g citizen-reports

# O en docker-compose.yml:
deploy:
  resources:
    limits:
      memory: 1G
```

---

## 📝 Notas Importantes

1. **El frontend está compilado dentro:** No necesitas `npm run build` en servidor
2. **Datos persistentes:** Montar `server/data.db` como volumen 
3. **Backups automáticos:** Configurar cron job con `npm run backup:db`
4. **Monitoring:** Usar `docker stats` o herramienta like Portainer
5. **Updates:** Nueva imagen = new build local + docker-compose restart

---

## 📞 Contacto / Soporte

- **Servidor:** 145.79.0.77
- **Puerto API:** 4000
- **PM2 app:** citizen-reports-app (si ejecuta pm2 directamente)
- **Logs:** `docker logs -f citizen-reports`

---

**Última revisión:** 2025-11-21  
**Versión:** citizen-reports:latest (SHA256: b8833cf92c06c8671...)  
**Testing:** ✅ Todos los tests pasan (98/98)
