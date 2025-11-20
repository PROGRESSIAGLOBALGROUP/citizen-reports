# Docker Deployment Guide - Citizen Reports Platform

**Última actualización:** 2025-11-20  
**Status:** Producción Ready  
**Arquitectura:** Docker Swarm + Multi-stage builds

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura](#arquitectura)
3. [Quick Start](#quick-start)
4. [Deployment](#deployment)
5. [Operaciones](#operaciones)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

---

## 🎯 Visión General

La plataforma Citizen Reports está completamente dockerizada con:

- **Multi-stage builds** para optimización de tamaño
- **Zero-downtime deployments** con health checks
- **Rollback automático** si falla deployment
- **Resource limits** para prevenir memory leaks
- **Logs centralizados** con rotación automática
- **Backup automático** de DB antes de cada deploy

### Stack Tecnológico

- **Base:** Node.js 20 Alpine (imagen mínima)
- **Orquestación:** Docker Swarm
- **Reverse Proxy:** Traefik/Easypanel (configurado externamente)
- **Database:** SQLite en volumen persistente
- **Health Checks:** Integrados en Dockerfile y Compose

---

## 🏗 Arquitectura

### Multi-Stage Build

```
┌─────────────────────────────────────────────────────────────┐
│ STAGE 1: Client Builder                                    │
│ - Build frontend SPA con Vite                               │
│ - Optimización de assets                                    │
│ - Output: client/dist/                                      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ STAGE 2: Server Builder                                    │
│ - Instalar dependencias backend                             │
│ - Compilar sqlite3 nativo                                   │
│ - Output: node_modules/                                     │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ STAGE 3: Production Runtime                                │
│ - Solo archivos necesarios                                  │
│ - Usuario no-root (seguridad)                               │
│ - Health checks integrados                                  │
│ - Size: ~250MB (vs ~800MB sin multi-stage)                  │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Deployment

```
Local Dev          →    Build     →    Server      →    Swarm
┌─────────┐           ┌───────┐      ┌─────────┐     ┌────────┐
│ Git Repo│  scp/rsync│ Docker│ push │ Registry│ pull│Services│
│         │ ───────── │ Build │─────→│(local)  │────→│Running │
└─────────┘           └───────┘      └─────────┘     └────────┘
    │                                                      │
    │                                                      │
    └──────────── Webhook Auto-Deploy ───────────────────┘
           (GitHub → Webhook Server → deploy.sh)
```

---

## 🚀 Quick Start

### Prerrequisitos

```powershell
# En tu máquina local
✓ Docker Desktop
✓ PowerShell 7+
✓ SSH access al servidor

# En el servidor (145.79.0.77)
✓ Docker 24+
✓ Docker Swarm inicializado
✓ Red 'easypanel' creada
```

### Primera Vez (Setup)

```powershell
# 1. Clonar repo
git clone https://github.com/PROGRESSIAGLOBALGROUP/citizen-reports.git
cd citizen-reports

# 2. Instalar dependencias locales
npm install
cd client && npm install && cd ..

# 3. Ejecutar tests
npm run test:all

# 4. Desplegar
.\scripts\deploy-docker.ps1
```

### Deployments Subsecuentes

```powershell
# Deployment completo (recomendado)
.\scripts\deploy-docker.ps1

# Skip tests (más rápido, usa con precaución)
.\scripts\deploy-docker.ps1 -SkipTests

# Force deployment (si servicio actual está caído)
.\scripts\deploy-docker.ps1 -Force
```

---

## 📦 Deployment

### Script Automatizado: `deploy-docker.ps1`

**Características:**

- ✅ Pre-deployment health checks
- ✅ Backup automático de DB
- ✅ Build local + tests (opcional)
- ✅ Sync a servidor
- ✅ Build de imagen Docker
- ✅ Deploy con zero-downtime
- ✅ Post-deployment validation
- ✅ Rollback automático si falla
- ✅ Cleanup de recursos

**Opciones:**

```powershell
# Parámetros disponibles
-Host "145.79.0.77"         # IP del servidor
-StackName "citizen-reports" # Nombre del stack
-User "root"                 # Usuario SSH
-SkipTests                   # Omitir tests locales
-Force                       # Ignorar health check previo
```

**Ejemplo de uso:**

```powershell
# Deployment estándar
.\scripts\deploy-docker.ps1

# Deployment rápido (sin tests)
.\scripts\deploy-docker.ps1 -SkipTests

# Deployment de emergencia (forzar)
.\scripts\deploy-docker.ps1 -Force -SkipTests
```

### Deployment Manual

Si prefieres control total:

```bash
# SSH al servidor
ssh root@145.79.0.77

# Navegar al proyecto
cd /root/citizen-reports

# Build imagen
docker build -t citizen-reports:latest .

# Deploy stack
docker stack deploy -c docker-compose.prod.yml citizen-reports

# Verificar
docker service ls --filter name=citizen-reports_
```

---

## 🔧 Operaciones

### Comandos Comunes

#### Ver Estado

```bash
# Listar servicios
docker service ls --filter name=citizen-reports_

# Ver réplicas detalladas
docker service ps citizen-reports_citizen-reports

# Verificar health
curl -I http://localhost:4000/api/reportes?limit=1
```

#### Logs

```bash
# Logs en tiempo real
docker service logs citizen-reports_citizen-reports -f

# Últimas 100 líneas
docker service logs --tail 100 citizen-reports_citizen-reports

# Con timestamps
docker service logs --timestamps citizen-reports_citizen-reports
```

#### Escalar

```bash
# Escalar a 2 réplicas
docker service scale citizen-reports_citizen-reports=2

# Volver a 1 réplica
docker service scale citizen-reports_citizen-reports=1
```

#### Rollback

```bash
# Rollback automático (a versión anterior)
docker service update --rollback citizen-reports_citizen-reports

# Rollback a imagen específica
docker service update --image citizen-reports:20251120-143000 citizen-reports_citizen-reports
```

#### Actualización Manual

```bash
# Update con nueva imagen
docker service update --image citizen-reports:latest citizen-reports_citizen-reports

# Update con parámetros específicos
docker service update \
  --image citizen-reports:latest \
  --update-parallelism 1 \
  --update-delay 10s \
  citizen-reports_citizen-reports
```

### Gestión de Volúmenes

```bash
# Listar volúmenes
docker volume ls | grep citizen-reports

# Inspeccionar volumen DB
docker volume inspect citizen-reports_db_data

# Backup manual de DB
docker run --rm \
  -v citizen-reports_db_data:/source:ro \
  -v $(pwd)/backups:/backup \
  alpine \
  tar -czf /backup/db-backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /source .
```

### Health Checks

```bash
# Ver health status
docker service ps citizen-reports_citizen-reports --format "table {{.Name}}\t{{.CurrentState}}"

# Forzar health check
docker exec $(docker ps -q -f name=citizen-reports) curl -f http://localhost:4000/api/reportes?limit=1
```

---

## 🔍 Troubleshooting

### Servicio no inicia (0/1 réplicas)

```bash
# Ver logs de errores
docker service logs --tail 50 citizen-reports_citizen-reports | grep -i error

# Ver eventos del servicio
docker service ps citizen-reports_citizen-reports --no-trunc

# Verificar resources
docker stats $(docker ps -q -f name=citizen-reports)
```

**Causas comunes:**
- Port 4000 ya en uso
- Volumen DB corrupto
- Límites de memoria muy bajos
- Configuración de red incorrecta

### Health Check falla constantemente

```bash
# Test manual del endpoint
docker exec -it $(docker ps -q -f name=citizen-reports) sh
curl http://localhost:4000/api/reportes?limit=1

# Verificar DB
ls -lh /app/server/data.db
sqlite3 /app/server/data.db "SELECT COUNT(*) FROM reportes;"
```

**Soluciones:**
- Verificar que `data.db` existe en volumen
- Ejecutar `npm run init` si DB no está inicializada
- Revisar logs de aplicación para errores SQL

### Imagen no se construye

```bash
# Build con logs detallados
docker build --no-cache --progress=plain -t citizen-reports:latest .

# Verificar espacio en disco
df -h

# Limpiar cache de Docker
docker system prune -a --volumes -f
```

### Deployment queda colgado

```bash
# Ver estado de update
docker service inspect citizen-reports_citizen-reports --format '{{.UpdateStatus}}'

# Cancelar update
docker service update --force citizen-reports_citizen-reports

# Eliminar y recrear
docker stack rm citizen-reports
# Esperar 30s
docker stack deploy -c docker-compose.prod.yml citizen-reports
```

---

## ✅ Best Practices

### Seguridad

1. **Usuario no-root:** Imagen usa usuario `nodejs` (UID 1001)
2. **Read-only filesystem:** Considera agregar `read_only: true` al compose
3. **Secrets:** NUNCA incluir passwords en variables de entorno
4. **Network isolation:** Usa redes internas para comunicación inter-servicios
5. **Resource limits:** Siempre define CPU/memory limits

### Performance

1. **Multi-stage builds:** Reduce tamaño de imagen final
2. **Layer caching:** Copia `package.json` antes de código fuente
3. **npm ci:** Usa `npm ci` en vez de `npm install` para builds reproducibles
4. **Prune regularmente:** `docker system prune` cada semana
5. **Health checks:** Interval de 30s (no más frecuente, consume recursos)

### Reliability

1. **Restart policies:** Usa `on-failure` con max_attempts
2. **Update strategy:** `start-first` para zero-downtime
3. **Rollback automático:** Configurado con `failure_action: rollback`
4. **Logs rotation:** Limita tamaño de logs (max-size: 10m, max-file: 3)
5. **Backups automáticos:** Script deploy hace backup antes de cada cambio

### Monitoring

```bash
# Agregar monitoring con Prometheus (opcional)
docker service update \
  --label-add prometheus.enable=true \
  --label-add prometheus.port=4000 \
  --label-add prometheus.path=/metrics \
  citizen-reports_citizen-reports
```

---

## 📊 Checklist de Deployment

Antes de hacer deployment a producción:

- [ ] Tests locales pasan 100% (`npm run test:all`)
- [ ] Build local exitoso
- [ ] Backup de DB actual creado
- [ ] Ventana de mantenimiento comunicada (si aplica)
- [ ] Health check del servicio actual
- [ ] Plan de rollback claro
- [ ] Logs being monitored

Durante deployment:

- [ ] Health checks pasan
- [ ] Réplicas en estado Running
- [ ] API responde correctamente
- [ ] Frontend carga sin errores
- [ ] No hay errores en logs

Post-deployment:

- [ ] Validar funcionalidad crítica manualmente
- [ ] Verificar métricas de performance
- [ ] Confirmar rollback disponible
- [ ] Documentar cambios en CHANGELOG.md

---

## 🆘 Soporte

**Documentación adicional:**
- Architecture: `docs/architecture.md`
- API Reference: `docs/API_REFERENCE_COMPLETA_2025-11-17.md`
- Backend: `docs/BACKEND_ARCHITECTURE_COMPLETE_2025-11-17.md`

**Comandos de emergencia:**

```bash
# ROLLBACK INMEDIATO
ssh root@145.79.0.77 "docker service update --rollback citizen-reports_citizen-reports"

# RESTART FORZADO
ssh root@145.79.0.77 "docker service update --force citizen-reports_citizen-reports"

# ELIMINAR STACK (último recurso)
ssh root@145.79.0.77 "docker stack rm citizen-reports"
```

---

**Versión:** 1.0.0  
**Fecha:** 2025-11-20  
**Autor:** PROGRESSIA Global Group
