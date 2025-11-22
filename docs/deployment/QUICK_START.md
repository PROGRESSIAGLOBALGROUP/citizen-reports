# ⚡ QUICK START - Deploy en 3 Pasos

**Tiempo:** 15 minutos | **Downtime:** ~30-35 segundos | **Data Loss:** ZERO

---

## ✅ PASO 1: VALIDAR

Ejecuta en PowerShell:

```powershell
cd c:\PROYECTOS\citizen-reports
.\deploy-master.ps1 -DeployMode test
```

Resultado esperado: `✅ All validations passed`

---

## ✅ PASO 2: DEPLOY

**El usuario debe proporcionar contraseña del servidor**

Ejecuta (reemplaza PASSWORD con credencial del server):

```powershell
.\deploy-master.ps1 -DeployMode fast `
  -SSHHost "root@145.79.0.77" `
  -PreserveBD $true
```

Espera 5-10 minutos. Verás progreso automático.

---

## ✅ PASO 3: VERIFICAR

```powershell
curl http://145.79.0.77:4000/api/reportes?limit=1
```

Debe retornar JSON array. Si ve eso: ✅ **LISTO**

---

## 🎯 Eso es todo

- ✅ Backup automático
- ✅ Zero-downtime (30-35 seg)
- ✅ Auto-rollback si falla
- ✅ Datos intactos

**Siguiente:** Open http://145.79.0.77:4000 en navegador

---

**¿Problemas?** Ve a `TROUBLESHOOTING.md`
