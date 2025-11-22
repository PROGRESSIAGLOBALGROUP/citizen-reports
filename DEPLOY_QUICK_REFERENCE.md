# ⚡ QUICK REFERENCE - Deploy Master

## 🚀 TL;DR - COMANDOS RÁPIDOS

### Windows PowerShell

**Validar antes de deploy:**
```powershell
.\deploy-master.ps1 -DeployMode test
```

**Deploy completo (build + push + deploy):**
```powershell
.\deploy-master.ps1 -DeployMode full `
  -SSHHost "root@145.79.0.77" `
  -DockerUser "progressiaglobalgroup" `
  -DockerPass "PASSWORD"
```

**Deploy rápido (imagen ya en Docker Hub):**
```powershell
.\deploy-master.ps1 -DeployMode fast -ImageTag "2025-11-21"
```

---

### Linux / Mac Bash

**Validar:**
```bash
bash deploy-master.sh test
```

**Deploy completo:**
```bash
bash deploy-master.sh full \
  root@145.79.0.77 \
  progressiaglobalgroup \
  "PASSWORD" \
  true \
  2025-11-21
```

**Deploy rápido:**
```bash
bash deploy-master.sh fast \
  root@145.79.0.77 \
  progressiaglobalgroup \
  "" \
  true \
  2025-11-21
```

---

## 📊 WHAT HAPPENS

| Paso | Acción | Tiempo |
|------|--------|--------|
| 1 | Build Docker image | 2-3 min |
| 2 | Push a Docker Hub | 1-2 min |
| 3 | Backup BD en servidor | <5s |
| 4 | Schema migration | <10s |
| 5 | Graceful shutdown | 30s |
| 6 | Switchover a nueva imagen | 5-10s |
| 7 | Health checks | <60s |
| 8 | ✅ API respondiendo | ✅ |

**Downtime:** ~30-35s | **Datos perdidos:** NINGUNO | **Rollback:** Automático

---

## 🔐 SECURITY

✅ **Backup automático** - Pre-deploy en `/backups/`  
✅ **Schema idempotent** - No afecta datos existentes  
✅ **Graceful shutdown** - Permite cerrar conexiones activas  
✅ **Health checks** - Valida API post-deploy  
✅ **Auto-rollback** - Si falla, vuelve versión anterior  
✅ **docker-compose.yml backup** - Para rollback manual  

---

## 🆘 EMERGENCY ROLLBACK

```bash
ssh root@145.79.0.77

cd /root/citizen-reports

# Volver a versión anterior
docker-compose down --timeout 30
cp docker-compose.yml.backup docker-compose.yml
docker-compose up -d

# Verificar
curl http://localhost:4000/api/reportes?limit=1
```

---

## 📋 CHECKLIST PRE-DEPLOY

- [ ] `npm run test:all` pasando en local
- [ ] `.deploy-master.ps1` / `deploy-master.sh` presente
- [ ] Docker Hub credentials listos
- [ ] SSH acceso a 145.79.0.77 verificado
- [ ] `.\deploy-master.ps1 -DeployMode test` OK
- [ ] Backup manual de BD (recomendado)

---

## 🎯 EJEMPLO PASO A PASO

```powershell
# 1. Validar
.\deploy-master.ps1 -DeployMode test
# ✅ All validations passed

# 2. Deploy
.\deploy-master.ps1 -DeployMode full `
  -SSHHost "root@145.79.0.77" `
  -DockerUser "progressiaglobalgroup" `
  -DockerPass "mypass"

# 3. Esperar ~5-10 minutos
# Verás: Build... Push... Backup... Migration... Switchover... Health checks...

# 4. Verificar
curl http://145.79.0.77:4000/api/reportes?limit=1
# ✅ Returns JSON array

# 5. Ver logs
ssh root@145.79.0.77 "docker logs -f citizen-reports"
```

---

## 📞 TROUBLESHOOTING

**Error: "SSH: Connection refused"**
```bash
ssh root@145.79.0.77 "echo OK"  # Verificar conectividad
```

**Error: "Docker: Cannot connect to Docker daemon"**
```bash
docker ps  # Verificar Docker en tu máquina
```

**Error: "Health check falló"**
```bash
ssh root@145.79.0.77 "docker logs citizen-reports"
# Script hace rollback automático
```

**Error: "Docker image not found"**
```bash
docker images | grep citizen-reports  # Verificar imagen local
```

---

**Todo listo para producción! 🚀**
