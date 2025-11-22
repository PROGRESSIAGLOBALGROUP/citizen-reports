# 📋 Deployment Guide - Paso a Paso

**Tiempo:** 15 minutos | **Para:** Implementadores

---

## FASE 1: Preparación (1 minuto)

### Requisitos
- ✅ SSH acceso a 145.79.0.77
- ✅ Docker Desktop corriendo (Windows)
- ✅ PowerShell 5.0+ (Windows) o Bash (Linux)
- ✅ Deploy scripts en workspace (`deploy-master.ps1` o `deploy-master.sh`)

### Verificación
```powershell
# Windows
docker --version    # Debe mostrar versión
ssh root@145.79.0.77 "echo OK"  # Debe retornar OK
```

---

## FASE 2: Validación (1 minuto)

Sin riesgos. Solo valida todo.

```powershell
# Windows
cd c:\PROYECTOS\citizen-reports
.\deploy-master.ps1 -DeployMode test
```

### Qué ve
```
✅ Docker available
✅ SSH connectivity to 145.79.0.77 OK
✅ Dockerfile valid
✅ All validations passed
```

**Si ve errores:** Consulta `TROUBLESHOOTING.md`

---

## FASE 3: Deployment (10 minutos)

El script automatiza todo:

```powershell
.\deploy-master.ps1 -DeployMode fast `
  -SSHHost "root@145.79.0.77" `
  -PreserveBD $true
```

### Qué sucede (automático)
1. ✅ Backup de BD pre-deployment
2. ✅ Schema migration (idempotent)
3. ✅ Graceful shutdown (30 seg)
4. ✅ Inicia nueva imagen
5. ✅ Health checks (hasta 60 seg)
6. ✅ Rollback automático si falla

### Qué ve en output
```
[1/5] Backing up database...
[2/5] Running schema migration...
[3/5] Graceful shutdown...
[4/5] Starting new image...
[5/5] Running health checks...
✅ Deployment successful!
```

**Espera pacientemente.** No interrumpas.

---

## FASE 4: Verificación (3 minutos)

### Test 1: API Respondiendo
```bash
curl http://145.79.0.77:4000/api/reportes?limit=1
```

**Resultado esperado:**
```json
{
  "reportes": [
    {"id": 1, "tipo": "baches", ...}
  ]
}
```

### Test 2: Logs Limpios
```bash
ssh root@145.79.0.77 "docker logs --tail 20 citizen-reports"
```

**Resultado esperado:** Sin errores

### Test 3: BD Intacta
```bash
ssh root@145.79.0.77 "sqlite3 /root/citizen-reports/server/data.db 'SELECT COUNT(*) FROM reportes;'"
```

**Resultado esperado:** Mismo número que antes

### Test 4: Backup Creado
```bash
ssh root@145.79.0.77 "ls -lh /root/citizen-reports/backups/"
```

**Resultado esperado:** Archivo `data.db.backup_*` con fecha de hoy

---

## ✅ Listo

Si todos los tests pasaron:
- ✅ API corriendo
- ✅ BD intacta
- ✅ Backup creado
- ✅ Modal fix funciona

**Abre en navegador:** http://145.79.0.77:4000

---

## 🆘 Si Algo Falla

### Auto-Rollback
Si health check falla después de deploy, verás:
```
⚠️ Health check failed. Starting rollback...
✅ Rolled back to previous version
```

Script lo hace automáticamente. Nada que hagas.

### Manual Rollback (Si lo necesitas)
Ver `EMERGENCY.md`

### Problemas Específicos
Ver `TROUBLESHOOTING.md`

---

## 🎉 Próximos Pasos

1. Open app: http://145.79.0.77:4000
2. Test workflows (crear reporte, asignar, cerrar)
3. Verifica que modal carga funcionarios (fix está aplicado)
4. Done! 🚀

---

**¿Dudas?** Consulta:
- `QUICK_START.md` - Ultra-rápido
- `COMMANDS.md` - Comandos listos
- `TROUBLESHOOTING.md` - Problemas
- `EMERGENCY.md` - Emergencias
