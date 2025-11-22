# 📋 Copy-Paste Commands

**Todos los comandos listos para copiar y ejecutar**

---

## 🔧 VALIDACIÓN

### Windows
```powershell
cd c:\PROYECTOS\citizen-reports
.\deploy-master.ps1 -DeployMode test
```

### Linux
```bash
cd /path/to/citizen-reports
bash deploy-master.sh test
```

---

## 🚀 DEPLOYMENT (Fast Mode - Recomendado)

### Windows
```powershell
.\deploy-master.ps1 -DeployMode fast `
  -SSHHost "root@145.79.0.77" `
  -PreserveBD $true
```

### Linux
```bash
bash deploy-master.sh fast \
  root@145.79.0.77 \
  "" \
  true \
  2025-11-21
```

---

## ✅ VERIFICACIÓN

### Test API
```bash
curl http://145.79.0.77:4000/api/reportes?limit=1
```

### Ver Logs
```bash
ssh root@145.79.0.77 "docker logs --tail 20 citizen-reports"
```

### Check DB
```bash
ssh root@145.79.0.77 "sqlite3 /root/citizen-reports/server/data.db 'SELECT COUNT(*) FROM reportes;'"
```

### Ver Backups
```bash
ssh root@145.79.0.77 "ls -lh /root/citizen-reports/backups/"
```

---

## 🆘 EMERGENCIAS

### Rollback Manual
```bash
ssh root@145.79.0.77 "cd /root/citizen-reports && docker-compose down --timeout 30 && cp docker-compose.yml.backup docker-compose.yml && docker-compose up -d"
```

### Ver Logs Real-Time
```bash
ssh root@145.79.0.77 "docker logs -f citizen-reports"
```

### Check Container
```bash
ssh root@145.79.0.77 "docker ps | grep citizen-reports"
```

---

**Copia uno de estos comandos y ejecuta. Es todo lo que necesitas.** 🚀
