# 📋 COMANDOS LISTOS PARA COPIAR & PEGAR

**Copia uno de estos comandos directamente en tu terminal**

---

## 🖥️ WINDOWS (PowerShell)

### 1. Validar (PRIMERO - No afecta nada)
```powershell
cd c:\PROYECTOS\citizen-reports
.\deploy-master.ps1 -DeployMode test
```

**Espera a ver:** `✅ All validations passed`

---

### 2. Deploy Completo (Si validación OK)

**IMPORTANTE:** Reemplaza `PASSWORD` con tu password Docker Hub

```powershell
.\deploy-master.ps1 -DeployMode full `
  -SSHHost "root@145.79.0.77" `
  -DockerUser "progressiaglobalgroup" `
  -DockerPass "PASSWORD" `
  -ImageTag "2025-11-21" `
  -PreserveBD $true
```

---

### 3. Deploy Rápido (Si imagen ya está en Docker Hub)

```powershell
.\deploy-master.ps1 -DeployMode fast `
  -SSHHost "root@145.79.0.77" `
  -ImageTag "2025-11-21" `
  -PreserveBD $true
```

---

### 4. Verificar que Funcione

```powershell
# Test API
curl http://145.79.0.77:4000/api/reportes?limit=1

# Ver logs
ssh root@145.79.0.77 "docker logs --tail 20 citizen-reports"

# Contar reportes (debe ser igual que antes)
ssh root@145.79.0.77 "sqlite3 /root/citizen-reports/server/data.db 'SELECT COUNT(*) FROM reportes;'"

# Ver backups
ssh root@145.79.0.77 "ls -lh /root/citizen-reports/backups/"
```

---

### 5. Rollback Manual (Si algo falla)

```powershell
ssh root@145.79.0.77 "cd /root/citizen-reports && docker-compose down --timeout 30 && cp docker-compose.yml.backup docker-compose.yml && docker-compose up -d"
```

---

## 🐧 LINUX / MAC (Bash)

### 1. Validar
```bash
cd /path/to/citizen-reports
bash deploy-master.sh test
```

---

### 2. Deploy Completo

**IMPORTANTE:** Reemplaza `PASSWORD` con tu password Docker Hub

```bash
bash deploy-master.sh full \
  root@145.79.0.77 \
  progressiaglobalgroup \
  "PASSWORD" \
  true \
  2025-11-21
```

---

### 3. Deploy Rápido

```bash
bash deploy-master.sh fast \
  root@145.79.0.77 \
  progressiaglobalgroup \
  "" \
  true \
  2025-11-21
```

---

### 4. Verificar

```bash
# Test API
curl http://145.79.0.77:4000/api/reportes?limit=1

# Ver logs
ssh root@145.79.0.77 "docker logs --tail 20 citizen-reports"

# Contar reportes
ssh root@145.79.0.77 "sqlite3 /root/citizen-reports/server/data.db 'SELECT COUNT(*) FROM reportes;'"

# Ver backups
ssh root@145.79.0.77 "ls -lh /root/citizen-reports/backups/"
```

---

### 5. Rollback Manual

```bash
ssh root@145.79.0.77 \
  "cd /root/citizen-reports && \
   docker-compose down --timeout 30 && \
   cp docker-compose.yml.backup docker-compose.yml && \
   docker-compose up -d"
```

---

## 🔗 VERIFICACIONES RÁPIDAS

### Check API
```bash
curl http://145.79.0.77:4000/api/reportes?limit=1
```

**Debe retornar JSON type, así:**
```json
{
  "reportes": [
    {"id": 1, "tipo": "baches", "lat": 19.4326, ...}
  ]
}
```

### Check Contenedor
```bash
ssh root@145.79.0.77 "docker ps | grep citizen-reports"
```

**Debe mostrar el contenedor corriendo:**
```
CONTAINER ID   IMAGE                           STATUS
a1b2c3d4       citizen-reports:2025-11-21      Up 2 minutes
```

### Check Logs Sin Errores
```bash
ssh root@145.79.0.77 "docker logs citizen-reports | grep -i error"
```

**Debe retornar vacío (sin errores)**

### Check DB
```bash
ssh root@145.79.0.77 "sqlite3 /root/citizen-reports/server/data.db 'PRAGMA integrity_check;'"
```

**Debe retornar:** `ok`

---

## ⚡ FLUJO COMPLETO (Copy-Paste Ready)

### Windows - Ejecución Completa

```powershell
# 1. Navega a directorio
cd c:\PROYECTOS\citizen-reports

# 2. Validar
.\deploy-master.ps1 -DeployMode test

# Si ves ✅, continúa...

# 3. Deploy (reemplaza PASSWORD)
.\deploy-master.ps1 -DeployMode full `
  -SSHHost "root@145.79.0.77" `
  -DockerUser "progressiaglobalgroup" `
  -DockerPass "PASSWORD" `
  -PreserveBD $true

# Espera 5-10 minutos...

# 4. Verificar
curl http://145.79.0.77:4000/api/reportes?limit=1
```

### Linux/Mac - Ejecución Completa

```bash
# 1. Navega a directorio
cd /path/to/citizen-reports

# 2. Validar
bash deploy-master.sh test

# Si ves ✅, continúa...

# 3. Deploy (reemplaza PASSWORD)
bash deploy-master.sh full \
  root@145.79.0.77 \
  progressiaglobalgroup \
  "PASSWORD" \
  true \
  2025-11-21

# Espera 5-10 minutos...

# 4. Verificar
curl http://145.79.0.77:4000/api/reportes?limit=1
```

---

## 🆘 COMANDOS DE EMERGENCIA

### Ver logs en tiempo real
```bash
ssh root@145.79.0.77 "docker logs -f citizen-reports"
```

### Parar todo
```bash
ssh root@145.79.0.77 "cd /root/citizen-reports && docker-compose down"
```

### Iniciar última versión
```bash
ssh root@145.79.0.77 "cd /root/citizen-reports && docker-compose up -d"
```

### Restaurar backup
```bash
ssh root@145.79.0.77 "cd /root/citizen-reports && \
  cp backups/data.db.backup_* server/data.db && \
  docker restart citizen-reports"
```

### Limpiar todo (peligroso!)
```bash
ssh root@145.79.0.77 "cd /root/citizen-reports && \
  docker-compose down && \
  rm server/data.db && \
  npm run init && \
  docker-compose up -d"
```

---

## 📊 COMANDOS DE MONITOREO

### Ver estado de todo
```bash
ssh root@145.79.0.77 "cd /root/citizen-reports && \
  echo '=== CONTENEDOR ===' && \
  docker ps | grep citizen-reports && \
  echo '=== BD ===' && \
  sqlite3 server/data.db 'SELECT COUNT(*) as reportes FROM reportes;' && \
  echo '=== BACKUPS ===' && \
  ls -lh backups/ && \
  echo '=== API ===' && \
  curl -s http://localhost:4000/api/reportes?limit=1 | head -20"
```

### Ver estadísticas en tiempo real
```bash
ssh root@145.79.0.77 "docker stats citizen-reports"
```

### Ver últimas líneas de log
```bash
ssh root@145.79.0.77 "docker logs --tail 100 citizen-reports"
```

### Ver solo errores
```bash
ssh root@145.79.0.77 "docker logs citizen-reports 2>&1 | grep -i 'error\|fail\|exception' | tail -20"
```

---

## 🎯 CHECKLIST - Copia y marca según avances

```
PREPARACIÓN
- [ ] Tengo password Docker Hub
- [ ] SSH acceso a 145.79.0.77 funciona
- [ ] Leo START_HERE_DEPLOY.md

VALIDACIÓN
- [ ] Ejecuto: .\deploy-master.ps1 -DeployMode test
- [ ] Veo: ✅ All validations passed

DEPLOYMENT
- [ ] Ejecuto deploy completo
- [ ] Espero 5-10 minutos
- [ ] Veo: "Deployment successful"

VERIFICACIÓN
- [ ] curl http://145.79.0.77:4000/api/reportes?limit=1 retorna JSON
- [ ] ssh logs no muestran errores
- [ ] BD intacta (mismo count)
- [ ] Modal de Asignar funciona
- [ ] Backup creado

FINALIZACIÓN
- [ ] Documenta en registros
- [ ] Prueba workflows
- [ ] Notifica al equipo
```

---

## 📝 NOTAS IMPORTANTES

1. **PASSWORD:** Reemplaza `PASSWORD` con tu contraseña Docker Hub actual
2. **ESPERAR:** Deploy toma 5-10 minutos, no interrumpas
3. **LOGS:** Si ves errores, consulta `DEPLOY_MASTER_README.md`
4. **ROLLBACK:** Es automático si health check falla
5. **DATOS:** NUNCA se pierden (backup automático)

---

**¡Copia uno de estos comandos y ejecuta! 🚀**
