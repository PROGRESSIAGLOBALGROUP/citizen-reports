# 🚀 DEPLOY MASTER - ZERO-DOWNTIME PRODUCTION DEPLOYMENT

**Versión:** 1.0  
**Fecha:** 21 de Noviembre de 2025  
**Status:** ✅ PRODUCTION-READY  
**Target:** 145.79.0.77:4000

---

## 📋 CARACTERÍSTICAS

✅ **Backup automático** - Preserva BD antes de deploy  
✅ **Schema migration** - Idempotent (seguro)  
✅ **Zero-downtime** - Graceful shutdown (30s)  
✅ **Health checks** - Valida API post-deploy  
✅ **Rollback automático** - Si falla, vuelve atrás  
✅ **Datos preservados** - NO se pierden datos existentes  
✅ **3 modos** - full (build+push+deploy), fast (solo deploy), test (validaciones)

---

## 🎯 MODOS DE DEPLOY

### Modo 1: FULL (Recomendado - Primera vez o cambios código)
```powershell
# Windows
.\deploy-master.ps1 -DeployMode full `
  -SSHHost "root@145.79.0.77" `
  -DockerUser "progressiaglobalgroup" `
  -DockerPass "TU_PASSWORD" `
  -ImageTag "2025-11-21" `
  -PreserveBD $true

# Linux
bash deploy-master.sh full root@145.79.0.77 progressiaglobalgroup "TU_PASSWORD" true 2025-11-21
```

**Qué hace:**
1. Build imagen Docker localmente
2. Valida imagen (tamaño, layers, etc)
3. Push a Docker Hub
4. Backup de BD en servidor
5. Schema migration (idempotent)
6. Switchover zero-downtime
7. Health checks post-deploy
8. Rollback automático si falla

**Tiempo:** ~5-10 minutos

---

### Modo 2: FAST (Solo deploy imagen existente)
```powershell
# Windows
.\deploy-master.ps1 -DeployMode fast `
  -SSHHost "root@145.79.0.77" `
  -ImageTag "2025-11-21" `
  -PreserveBD $true

# Linux
bash deploy-master.sh fast root@145.79.0.77 progressiaglobalgroup "" true 2025-11-21
```

**Qué hace:**
1. Asume imagen ya está en Docker Hub
2. Backup de BD en servidor
3. Schema migration
4. Switchover
5. Health checks
6. Rollback si falla

**Tiempo:** ~1-2 minutos  
**Uso:** Cuando imagen ya está en registry

---

### Modo 3: TEST (Validaciones locales)
```powershell
# Windows
.\deploy-master.ps1 -DeployMode test

# Linux
bash deploy-master.sh test
```

**Qué hace:**
1. Verifica Docker disponible
2. Verifica SSH conecta a servidor
3. Valida Dockerfile
4. Valida configuración

**Tiempo:** <30 segundos  
**Uso:** Antes de deployar (verificación rápida)

---

## 🔒 SEGURIDAD: PRESERVACIÓN DE DATOS

### Lo que se preserva:
- ✅ **data.db completo** - Todos los datos existentes
- ✅ **Backups automáticos** - En `/root/citizen-reports/backups/`
- ✅ **Schema compatible** - Migration es idempotent
- ✅ **Pre-deploy backup** - `data.db.pre-deploy` creado antes de switchover
- ✅ **docker-compose.yml backup** - `docker-compose.yml.backup` para rollback

### Backups generados:
```
backups/
├── data.db.backup_20251121_053000    ← Backup pre-deploy
├── data.db.backup_20251120_230000    ← Backup anterior
└── data.db.pre-deploy                ← Último pre-deploy
```

---

## ⚙️ PARÁMETROS

| Parámetro | Default | Descripción |
|-----------|---------|-------------|
| `DeployMode` | `full` | full, fast, test |
| `SSHHost` | `root@145.79.0.77` | Usuario@Host SSH |
| `DockerUser` | `progressiaglobalgroup` | Usuario Docker Hub |
| `DockerPass` | (solicitado) | Password Docker Hub |
| `PreserveBD` | `true` | Preservar datos (recomendado) |
| `ImageTag` | Fecha actual | Ej: 2025-11-21 |
| `HealthCheckTimeout` | `60` | Segundos para health check |

---

## 📊 FLUJO DE DEPLOY (Zero-Downtime)

```
┌─────────────────────────────────────────────────────┐
│ 1. BUILD IMAGEN                                     │
│    └─ docker build --target production -f Dockerfile│
├─────────────────────────────────────────────────────┤
│ 2. PUSH A REGISTRY                                  │
│    └─ docker push progressiaglobalgroup/... (opt)  │
├─────────────────────────────────────────────────────┤
│ 3. BACKUP BD EN SERVIDOR                            │
│    └─ cp data.db backups/data.db.backup_20251121_  │
├─────────────────────────────────────────────────────┤
│ 4. SCHEMA MIGRATION (Idempotent)                    │
│    └─ npm run init (solo si BD no existe)          │
├─────────────────────────────────────────────────────┤
│ 5. GRACEFUL SHUTDOWN (30s)                          │
│    └─ docker-compose down --timeout 30             │
│    └─ Permite que conexiones activas cierren       │
├─────────────────────────────────────────────────────┤
│ 6. ACTUALIZAR DOCKER-COMPOSE.YML                    │
│    └─ sed -i "s|image: .*|image: NUEVA|g" ...      │
├─────────────────────────────────────────────────────┤
│ 7. INICIAR NUEVA IMAGEN                             │
│    └─ docker-compose up -d                         │
│    └─ Toma ~5 segundos                             │
├─────────────────────────────────────────────────────┤
│ 8. HEALTH CHECKS (hasta 60s)                        │
│    └─ curl http://localhost:4000/api/reportes     │
│    └─ Si falla → ROLLBACK automático               │
└─────────────────────────────────────────────────────┘

DOWNTIME TOTAL: ~30-35 segundos
DATOS PERDIDOS: NINGUNO (backup + preserve)
ROLLBACK: Automático si algo falla
```

---

## ✅ VERIFICACIONES POST-DEPLOY

El script valida automáticamente:

1. **SSH conecta a 145.79.0.77**
   ```bash
   ssh root@145.79.0.77 "echo OK"
   ```

2. **Docker está disponible**
   ```bash
   docker --version
   ```

3. **Imagen built correctamente**
   ```bash
   docker image inspect citizen-reports:2025-11-21
   ```

4. **Backup creado**
   ```bash
   ls -lh /root/citizen-reports/backups/data.db.backup_*
   ```

5. **API respondiendo**
   ```bash
   curl http://145.79.0.77:4000/api/reportes?limit=1
   ```

6. **Contenedor en ejecución**
   ```bash
   docker ps | grep citizen-reports
   ```

7. **Logs sin errores**
   ```bash
   docker logs --tail 20 citizen-reports
   ```

8. **Estadísticas normales**
   ```bash
   docker stats --no-stream citizen-reports
   ```

---

## 🆘 TROUBLESHOOTING

### "SSH: Connection refused"
```bash
# Verificar conectividad
ping 145.79.0.77
ssh root@145.79.0.77 "echo OK"

# Si no funciona:
# 1. Verificar firewall
# 2. Verificar puertos abiertos
# 3. Verificar credenciales SSH
```

### "Docker: Cannot connect to Docker daemon"
```bash
# Verificar Docker está corriendo
docker ps

# En Windows: Abrir Docker Desktop
# En Linux: sudo systemctl start docker
```

### "Health check falló después de 60s"
```bash
# Ver logs detallados
ssh root@145.79.0.77 "docker logs citizen-reports"

# Rollback manual
ssh root@145.79.0.77 "cd /root/citizen-reports && \
  docker-compose down && \
  cp docker-compose.yml.backup docker-compose.yml && \
  docker-compose up -d"
```

### "API retorna HTML en lugar de JSON"
```bash
# Verificar que VerReporte.jsx usa /api/usuarios
# (Ya está arreglado en esta versión)

# Si aún falla:
ssh root@145.79.0.77 "curl http://localhost:4000/api/usuarios"
# Debe retornar JSON array, no HTML
```

### "BD se perdió después del deploy"
```bash
# Recuperar desde backup
ssh root@145.79.0.77 "
cd /root/citizen-reports
cp backups/data.db.backup_TIMESTAMP server/data.db
docker restart citizen-reports
"
```

---

## 📝 EJEMPLOS COMUNES

### Primer deploy (build completo)
```powershell
.\deploy-master.ps1 `
  -DeployMode full `
  -SSHHost "root@145.79.0.77" `
  -DockerUser "progressiaglobalgroup" `
  -DockerPass "mypassword"
```

### Redeploy rápido (imagen ya en Hub)
```powershell
.\deploy-master.ps1 `
  -DeployMode fast `
  -ImageTag "2025-11-21"
```

### Validación pre-deploy
```powershell
.\deploy-master.ps1 -DeployMode test
```

### Con parámetros personalizados
```bash
bash deploy-master.sh full \
  root@145.79.0.77 \
  myuser \
  mypassword \
  true \
  2025-11-21 \
  120  # Timeout de health check
```

---

## 🔄 ROLLBACK MANUAL

Si necesitas volver atrás:

```bash
ssh root@145.79.0.77

cd /root/citizen-reports

# 1. Detener contenedor actual
docker-compose down --timeout 30

# 2. Restaurar docker-compose.yml anterior
cp docker-compose.yml.backup docker-compose.yml

# 3. Restaurar BD si es necesario
cp backups/data.db.backup_TIMESTAMP server/data.db

# 4. Reiniciar
docker-compose up -d

# 5. Verificar
curl http://localhost:4000/api/reportes?limit=1
docker logs -f citizen-reports
```

---

## 📊 MONITOREO POST-DEPLOY

```bash
# Ver logs en tiempo real
ssh root@145.79.0.77 "docker logs -f citizen-reports"

# Ver estadísticas
ssh root@145.79.0.77 "docker stats citizen-reports"

# Ver BD
ssh root@145.79.0.77 "sqlite3 /root/citizen-reports/server/data.db 'SELECT COUNT(*) FROM reportes;'"

# Ver backups
ssh root@145.79.0.77 "ls -lh /root/citizen-reports/backups/"

# Verificar conectividad
curl http://145.79.0.77:4000/api/reportes?limit=1
```

---

## ⏱️ TIEMPOS ESPERADOS

| Fase | Tiempo |
|------|--------|
| Validaciones | <5s |
| Build imagen | 2-3 min |
| Push a registry | 1-2 min |
| Backup BD | <5s |
| Migration | <10s |
| Graceful shutdown | 30s |
| Switchover | 5-10s |
| Health checks | <60s |
| **TOTAL (full)** | **~5-10 min** |
| **TOTAL (fast)** | **~1-2 min** |

---

## 🎯 RECOMENDACIONES

1. **Siempre usa modo `test` primero**
   ```bash
   .\deploy-master.ps1 -DeployMode test
   ```

2. **Haz backup manual antes de deploy crítico**
   ```bash
   ssh root@145.79.0.77 "cp /root/citizen-reports/server/data.db \
     /root/citizen-reports/backups/manual-backup-$(date +%s).db"
   ```

3. **Monitorea logs post-deploy**
   ```bash
   ssh root@145.79.0.77 "docker logs -f citizen-reports"
   ```

4. **Valida datos después del deploy**
   ```bash
   curl http://145.79.0.77:4000/api/reportes?limit=1
   ```

5. **Mantén docker-compose.yml.backup seguro**
   - Script lo crea automáticamente
   - No borrarlo hasta confirmar deploy OK

---

**¡LISTO PARA DEPLOY PRODUCTION! 🚀**
