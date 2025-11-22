# Contenedor Docker - Citizen Reports - Producción

**Status:** ✅ Build en progreso (multi-stage, sin cache)  
**Fecha:** 21 de Noviembre de 2025  
**Versión:** latest

## 🚀 Inicio Rápido

### Build local
```bash
docker build -t citizen-reports:latest --target production -f Dockerfile .
```

### Test local
```bash
docker run -it -p 4000:4000 -e DB_PATH=/tmp/test.db citizen-reports:latest
# Luego: curl http://localhost:4000/
```

### Push a producción
```bash
# Opción 1: Script automático (Windows)
.\deploy-prod.ps1 -Tag "2025-11-21"

# Opción 2: Script automático (Linux)
bash deploy-prod.sh "2025-11-21"

# Opción 3: Manual
docker tag citizen-reports:latest progressiaglobalgroup/citizen-reports:2025-11-21
docker push progressiaglobalgroup/citizen-reports:2025-11-21
```

### Deploy en servidor (145.79.0.77)
```bash
ssh root@145.79.0.77
cd /root/citizen-reports

# Backup
cp server/data.db backups/data.db.backup_$(date +%Y%m%d)

# Descargar
docker pull progressiaglobalgroup/citizen-reports:2025-11-21

# Actualizar docker-compose.yml con nueva imagen
# Luego:
docker-compose down && docker-compose up -d

# Verificar
docker logs -f citizen-reports
curl http://localhost:4000/api/reportes?limit=1
```

---

## 📦 Contenido del Contenedor

| Componente | Detalles |
|-----------|----------|
| **SO Base** | Alpine Linux 3.20 (minimal, 40 MB) |
| **Node.js** | v20-alpine |
| **Backend** | Express.js + SQLite3 (nativo compilado en Alpine) |
| **Frontend** | Vite SPA compilado (623 KB JS) |
| **Herramientas** | curl, dumb-init para señales POSIX |
| **Usuario** | nodejs (non-root, uid:1001) |
| **Ports** | 4000 (API + SPA) |
| **Health** | Auto-check cada 30s |

---

## 🔧 Variables de Entorno

```yaml
NODE_ENV: production
PORT: 4000
DB_PATH: /app/server/data.db
TZ: America/Mexico_City
NODE_OPTIONS: "--max-old-space-size=256"
```

---

## 📊 Tamaño y Performance

- **Imagen final:** ~588 MB (optimizada multi-stage)
- **Tiempo de build:** ~5 min (primera vez, después cacheado)
- **Tiempo de startup:** ~5 segundos
- **Memory:** 256 MB recomendado, 512 MB máximo
- **CPU:** Sin límite específico (se adapta)

---

## ✅ Checklist Pre-Deploy

- [ ] Build completo sin errores
- [ ] Test local exitoso (curl a /api/reportes)
- [ ] Frontend carga en http://localhost:4000
- [ ] Backup de data.db realizado
- [ ] docker-compose.yml actualizado
- [ ] Credenciales de Docker Registry disponibles
- [ ] SSH acceso a 145.79.0.77 verificado

---

## 🆘 Si algo falla

**El contenedor no inicia:**
```bash
docker logs citizen-reports
# Buscar "ERR_DLOPEN_FAILED" → Probable: sqlite3 mal compilado

# Solución:
docker system prune -f
docker build -t citizen-reports:latest --target production --no-cache -f Dockerfile .
```

**API retorna HTML en lugar de JSON:**
```bash
# Verificar que VerReporte.jsx usa /api/usuarios (ya está arreglado)
git diff HEAD -- client/src/VerReporte.jsx | grep "API_BASE"
```

**Puerto 4000 en uso:**
```bash
# Windows
netstat -aon | findstr :4000
taskkill /PID [PID] /F

# Linux
lsof -i :4000
kill -9 [PID]
```

---

## 📝 Notas Importantes

1. **Dockerfile multi-stage:**
   - Stage 1: client-builder (compila Vite)
   - Stage 2: server-builder (npm install nativo en Alpine)
   - Stage 3: production (runtime optimizado)

2. **sqlite3 compilado EN contenedor:**
   - Usa build tools de Alpine (python3, make, g++)
   - Garantiza compatibilidad con Alpine runtime

3. **Frontend incluido:**
   - Compilado con `npm run build`
   - Servido desde `/app/server/dist`
   - Express sirve SPA + API desde mismo puerto

4. **Graceful shutdown:**
   - dumb-init maneja señales SIGTERM
   - permite 30s para conexiones antes de kill

5. **Health check integrado:**
   - Docker reinicia si falla curl a /api/reportes
   - Interval: 30s, Timeout: 10s, Retries: 3

---

**Ver más:** `docs/DEPLOYMENT_DOCKER_PRODUCTION.md`
