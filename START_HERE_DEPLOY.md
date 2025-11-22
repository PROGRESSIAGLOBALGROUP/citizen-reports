# 🚀 START HERE - DEPLOY EN 3 PASOS

**¿Prisa?** Lee esto (2 minutos)

---

## PASO 1️⃣: VALIDAR

```powershell
# Windows
cd c:\PROYECTOS\citizen-reports
.\deploy-master.ps1 -DeployMode test

# Linux/Mac
cd /ruta/al/proyecto
bash deploy-master.sh test
```

**Espera que diga:** `✅ All validations passed`

---

## PASO 2️⃣: DEPLOYAR

```powershell
# Windows - Reemplaza PASSWORD con tu contraseña Docker Hub
.\deploy-master.ps1 -DeployMode full `
  -SSHHost "root@145.79.0.77" `
  -DockerUser "progressiaglobalgroup" `
  -DockerPass "PASSWORD" `
  -PreserveBD $true
```

```bash
# Linux/Mac
bash deploy-master.sh full \
  root@145.79.0.77 \
  progressiaglobalgroup \
  "PASSWORD" \
  true \
  2025-11-21
```

**Espera 5-10 minutos.** Verás: Build... Push... Backup... Switchover... Health checks...

---

## PASO 3️⃣: VERIFICAR

```bash
# API respondiendo
curl http://145.79.0.77:4000/api/reportes?limit=1

# Logs limpios
ssh root@145.79.0.77 "docker logs -f citizen-reports"

# DB intacta
ssh root@145.79.0.77 "sqlite3 /root/citizen-reports/server/data.db 'SELECT COUNT(*) FROM reportes;'"
```

---

## ✅ ESO ES TODO

**Si todo dice ✅:**
- ✅ API respondiendo JSON
- ✅ Logs limpios (sin errores)
- ✅ DB con mismo número de reportes
- ✅ Modal ahora muestra funcionarios

**¡DEPLOYMENT EXITOSO! 🎉**

---

## 🆘 ¿ALGO SALIÓ MAL?

### Error: "Docker: Cannot connect"
- Windows: Abre Docker Desktop
- Linux: `sudo systemctl start docker`

### Error: "SSH: Connection refused"
```bash
ssh root@145.79.0.77 "echo OK"  # Verifica conectividad
```

### Error: "Health check failed"
Script hace rollback automático. Verás:
```
⚠️ Health check failed. Starting rollback...
✅ Rolled back to previous version
```

---

## 🔄 ROLLBACK MANUAL (Si lo necesitas)

```bash
ssh root@145.79.0.77

cd /root/citizen-reports

docker-compose down --timeout 30
cp docker-compose.yml.backup docker-compose.yml
docker-compose up -d

# Verificar
curl http://localhost:4000/api/reportes?limit=1
```

---

## 📖 MÁS INFO

- Guía paso a paso: `DEPLOY_INSTRUCTIONS.md`
- Guía completa: `DEPLOY_MASTER_README.md`
- Comandos rápidos: `DEPLOY_QUICK_REFERENCE.md`
- Estado completo: `PROJECT_COMPLETION_STATUS.md`
- Índice maestro: `PROJECT_DOCUMENTATION_INDEX.md`

---

**¡Listo! Ejecuta PASO 1 → PASO 2 → PASO 3 y terminó! 🚀**
