# 🚀 INICIO RÁPIDO DE DEPLOYMENT

**Última actualización:** 22 de noviembre de 2025  
**Estado:** Listo para producción  
**Servidor:** 145.79.0.77 | Puerto: 4000

---

## 3 OPCIONES PARA DESPLEGAR

### OPCIÓN 1: Modo Automático (Recomendado)
Para usuarios que solo tienen SSH password (sin claves SSH configuradas):

```powershell
cd c:\PROYECTOS\citizen-reports
.\deploy-interactive.ps1 -DeployMode fast
```

**Lo que hará:**
1. Solicita SSH password de forma segura (sin mostrar en pantalla)
2. Valida conectividad al servidor
3. Ejecuta deployment automático sin interrupciones
4. Crea backup automático
5. Preserva datos existentes
6. Health checks post-deploy

---

### OPCIÓN 2: Modo Fast (Requiere key-based SSH auth)
Para usuarios con SSH keys ya configuradas:

```powershell
cd c:\PROYECTOS\citizen-reports
.\deploy-master.ps1 -DeployMode fast -PreserveBD $true
```

**Lo que hace:**
- Salta Docker build (usa imagen existente)
- Deploy directo a servidor
- Backup automático
- Zero-downtime switchover

**Duración:** ~3-5 minutos

---

### OPCIÓN 3: Modo Full (Build + Deploy)
Si necesitas recompilar la imagen Docker:

```powershell
cd c:\PROYECTOS\citizen-reports
.\deploy-master.ps1 -DeployMode full -PreserveBD $true
```

**Lo que hace:**
- Recompila imagen Docker
- Valida imagen
- Sube a registry (si DockerPass proporcionado)
- Deploy con backup y preservación de datos

**Duración:** ~10-15 minutos

---

## ¿CUÁL OPCIÓN ELEGIR?

| Situación | Opción | Comando |
|-----------|--------|---------|
| **Primera vez, sin SSH keys** | 1 | `.\deploy-interactive.ps1 -DeployMode fast` |
| **Primera vez, con SSH keys** | 2 | `.\deploy-master.ps1 -DeployMode fast` |
| **Cambios en código/Dockerfile** | 3 | `.\deploy-master.ps1 -DeployMode full` |
| **Solo tests, sin deploy** | Test | `.\deploy-master.ps1 -DeployMode test` |

---

## PASO A PASO: OPCIÓN 1 (Más Común)

### Paso 1: Abre Terminal PowerShell
```powershell
cd c:\PROYECTOS\citizen-reports
```

### Paso 2: Ejecuta Script Interactivo
```powershell
.\deploy-interactive.ps1 -DeployMode fast
```

### Paso 3: Proporciona SSH Password
El script pedirá:
```
SSH Password para root@145.79.0.77: [escribe aqui, no se mostrará]
```

Ingresa el password que tienes para conectarte al servidor.

### Paso 4: Verifica Validaciones
El script verificará:
- ✅ Docker está disponible localmente
- ✅ Conexión SSH al servidor
- ✅ Imagen Docker existe (citizen-reports:2025-11-21)

Si todo está OK:
```
[+] Todas las validaciones pasaron
[~] Iniciando deploy-master.ps1...
```

### Paso 5: Espera Deployment
El script ejecutará:
1. **Backup automático** (~30 seg)
2. **Schema migration** (~20 seg)
3. **Switchover** (~30 seg)
4. **Health checks** (~60 seg máx)
5. **Reporte final**

**Duración total:** 3-5 minutos

### Paso 6: Verifica Éxito
Al finalizar, deberías ver:
```
[+] DEPLOYMENT COMPLETADO EXITOSAMENTE
[i] Sistema está en vivo en: http://145.79.0.77:4000
```

---

## VERIFICACIÓN POST-DEPLOYMENT

### Test 1: API Responde
```bash
curl http://145.79.0.77:4000/api/reportes?limit=1
```

Deberías obtener un JSON con reportes (o array vacío si es nuevo).

### Test 2: Frontend Carga
Abre en navegador:
```
http://145.79.0.77:4000
```

Deberías ver el mapa de Jantetelco.

### Test 3: Base de Datos Intacta
Los scripts reportaron:
```
[+] Backup creado: data.db.backup_20251122_145023
[i] BD ya existe, esquema será validado al iniciar
```

Si ves esto, tus datos están preservados.

---

## SI ALGO SALE MAL

### Error: "Connection refused"
```powershell
# Verifica que el servidor está on
ping 145.79.0.77

# Verifica que SSH está disponible
ssh-keyscan 145.79.0.77

# Intenta conexión manual
ssh root@145.79.0.77
```

### Error: "Docker no está disponible"
```powershell
# Verifica instalación Docker Desktop
docker --version

# Si no está: instala desde https://www.docker.com/products/docker-desktop
```

### Error: "No se puede autenticar"
```powershell
# Verifica SSH password es correcto
# Intenta directamente:
ssh root@145.79.0.77 "echo OK"

# Si pide password es correcto, si pide fingerprint di "yes"
```

### Deployment se detiene a mitad
El script ejecutará **ROLLBACK AUTOMÁTICO** que:
- Detiene contenedor nuevo
- Restaura versión anterior
- Reinicia con versión estable

Revisa logs:
```powershell
ssh root@145.79.0.77 "docker logs --tail 50 citizen-reports"
```

---

## DATOS GARANTIZADOS

✅ **Backup automático** antes de cada deployment  
✅ **Preservación de datos** con idempotent schema migration  
✅ **Zero-downtime** switchover (máx 30 seg visible)  
✅ **Rollback automático** si health checks fallan  
✅ **Verificación post-deploy** de API + health

Todos tus reportes, usuarios y configuraciones se preservan.

---

## PRÓXIMOS PASOS

1. **Primer deployment:** Opción 1 o 2 arriba
2. **Monitoreo:** Revisa `docs/deployment/STATUS.md`
3. **Troubleshooting:** Si algo falla, `docs/deployment/TROUBLESHOOTING.md`
4. **Emergencia:** Si necesitas rollback urgente, `docs/deployment/EMERGENCY.md`

---

## REFERENCIAS RÁPIDAS

| Documento | Propósito |
|-----------|----------|
| `QUICK_START.md` | 2 minutos - lo esencial |
| `GUIDE.md` | 15 minutos - paso a paso completo |
| `COMMANDS.md` | Copy-paste ready todos los comandos |
| `TROUBLESHOOTING.md` | Errores y soluciones |
| `EMERGENCY.md` | Rollback y procedimientos críticos |
| `STATUS.md` | Métricas y estado del proyecto |

---

**¿Listo?** Ejecuta:
```powershell
.\deploy-interactive.ps1 -DeployMode fast
```

**Preguntas?** Revisa `INDEX.md` en esta carpeta.
