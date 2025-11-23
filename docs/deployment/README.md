# Documentación de Despliegue - Citizen Reports

## 📚 Guías de Despliegue

Esta carpeta contiene documentación completa para desplegar Citizen Reports en producción con Docker Swarm.

### 🎯 Comienza Aquí

**Si es tu PRIMER despliegue:**
1. Lee: [DOCKER_SWARM_DEPLOYMENT_GUIDE.md](./DOCKER_SWARM_DEPLOYMENT_GUIDE.md) - Secciones 1-4
2. Lee: [Prerequisites](./DOCKER_SWARM_DEPLOYMENT_GUIDE.md#prerequisites) y [Architecture](./DOCKER_SWARM_DEPLOYMENT_GUIDE.md#architecture-overview)
3. Sigue: [Step-by-Step Deployment](./DOCKER_SWARM_DEPLOYMENT_GUIDE.md#step-by-step-deployment)

**Si algo FALLA:**
1. Consulta: [ERRORES_COMUNES_RESUELTOS.md](./ERRORES_COMUNES_RESUELTOS.md)
2. Busca tu error en el [Índice Rápido](./ERRORES_COMUNES_RESUELTOS.md#-indice-rápido-de-errores)
3. Sigue la solución paso a paso

**Si quieres AUTOMATIZAR:**
1. Lee: [deploy-safe.sh](../scripts/deploy-safe.sh)
2. Ejecuta: `bash scripts/deploy-safe.sh --help`
3. O: `bash scripts/deploy-safe.sh --dry-run` (simula sin cambios)

---

## 📋 Documentos

### 1. DOCKER_SWARM_DEPLOYMENT_GUIDE.md (30 KB)

**Contenido:**
- Prerequisites (servidor, máquina local, credenciales)
- Architecture overview con diagrama
- 3 Conceptos críticos (Volume Shadowing, Service Updates, File Priority)
- Deployment en 5 fases (Validación, Build, Testing, Transfer, Deploy)
- Strategy para bind mounts vs. named volumes
- Mapping de 7 errores comunes → soluciones rápidas
- Validation checklist con scripts
- Post-deployment verification
- Troubleshooting avanzado
- Disaster recovery procedures
- Quick reference commands

**Cuándo usar:**
- Primer despliegue
- Configuración de infraestructura nueva
- Entender arquitectura de Docker Swarm

**Tiempo de lectura:** 45 minutos (completo), 15 minutos (secciones relevantes)

### 2. ERRORES_COMUNES_RESUELTOS.md (22 KB)

**Errores Documentados:**
1. Frontend devuelve JSON (en lugar de HTML)
2. Login 500 "Error al crear sesión"
3. Hardcoded paths - Container no encuentra archivos
4. Image not updated - Código antiguo en container
5. PowerShell scp escaping issues
6. Port already in use (EADDRINUSE 4000)
7. Payload too large (413 Error)
8. Login 401 - Token key mismatch
9. SQL error - Wrong column name
10. Interdepartmental query - Supervisor not found

**Formato por error:**
- 🔴 Síntoma exacto (qué ves)
- 🔍 Diagnóstico (cómo confirmar)
- 🎯 Causas raíz (por qué ocurre)
- ✅ Solución paso a paso (qué hacer)
- Tabla de verificación o código de referencia

**Cuándo usar:**
- Despliegue falla en algún punto
- Tests no pasan
- Comportamiento inesperado en producción

**Tiempo de uso:** 5-10 minutos (encontrar + aplicar fix)

### 3. deploy-safe.sh (13 KB - Script Bash)

**Fases Automatizadas:**
1. Pre-deployment validation (git clean, server reachable, DB backup)
2. Local build (frontend + Docker image)
3. Local testing (curl a image de prueba)
4. Transfer to production (docker save → scp → docker load)
5. Copy runtime files (dist/, app.js, backend files al host)
6. Initialize database
7. Deploy with docker-compose
8. Validation (8 checks)

**Opciones:**
```bash
./deploy-safe.sh                    # Deployment completo con confirmaciones
./deploy-safe.sh --force            # Sin confirmaciones (CI/CD mode)
./deploy-safe.sh --dry-run          # Simula sin ejecutar
./deploy-safe.sh --skip-build       # Usa imagen existente
./deploy-safe.sh --skip-test        # Salta tests locales
```

**Ventajas:**
- ✅ Valida pre-condiciones
- ✅ Automatiza pasos complicados
- ✅ Backup de DB antes de deploy
- ✅ Validación completa al final
- ✅ Rollback automático si falla
- ✅ Logs detallados y coloreados

**Cuándo usar:**
- Despliegues repetitivos
- CI/CD pipeline
- Cuando quieres una guía interactiva

---

## 🚀 Quick Start Paths

### Escenario A: Primer Despliegue

```
1. Lee DOCKER_SWARM_DEPLOYMENT_GUIDE.md (Sections 1-5)
2. Ejecuta: bash scripts/deploy-safe.sh --dry-run
3. Revisa qué haría
4. Ejecuta: bash scripts/deploy-safe.sh
5. Verifica endpoints según Post-Deployment Verification
```

**Tiempo total:** 30-45 minutos

### Escenario B: Falla en Producción

```
1. Abre ERRORES_COMUNES_RESUELTOS.md
2. Busca síntoma en Índice Rápido
3. Sigue solución paso a paso
4. Verifica con validación checklist
```

**Tiempo total:** 10-15 minutos

### Escenario C: Cambios de Código Solo

```
1. Haz cambios en client/ o server/
2. Ejecuta: bash scripts/deploy-safe.sh
3. Script automatiza: build → test → transfer → validate
```

**Tiempo total:** 5-10 minutos (depende transfer size)

### Escenario D: Disaster Recovery

```
1. Consulta: DOCKER_SWARM_DEPLOYMENT_GUIDE.md → Disaster Recovery
2. O ejecuta si es DB corrupta:
   ssh root@145.79.0.77 'cd /root/citizen-reports/server && npm run init'
3. Reinicia: docker service update --force citizen-reports_citizen-reports
```

---

## 🔍 Troubleshooting Decision Tree

```
¿Cuál es el problema?

├─ Frontend (HTML/UI)
│  ├─ Devuelve JSON en lugar de HTML
│  │  └─ Consulta: ERRORES_COMUNES_RESUELTOS.md #Error 1
│  ├─ Assets (CSS/JS/images) con 404
│  │  └─ Consulta: DOCKER_SWARM_DEPLOYMENT_GUIDE.md #Common Errors
│  └─ Página en blanco/stuck loading
│     └─ Check: docker service logs citizen-reports_citizen-reports
│
├─ API / Backend
│  ├─ Login falla (500)
│  │  └─ Consulta: ERRORES_COMUNES_RESUELTOS.md #Error 2
│  ├─ Endpoints 401/403
│  │  └─ Consulta: ERRORES_COMUNES_RESUELTOS.md #Error 8
│  ├─ SQL errors (500)
│  │  └─ Consulta: ERRORES_COMUNES_RESUELTOS.md #Error 9
│  └─ Reports upload fails (413)
│     └─ Consulta: ERRORES_COMUNES_RESUELTOS.md #Error 7
│
├─ Deployment
│  ├─ Container no inicia
│  │  └─ Consulta: DOCKER_SWARM_DEPLOYMENT_GUIDE.md #Container Crashes
│  ├─ Code changes no se ven
│  │  └─ Consulta: ERRORES_COMUNES_RESUELTOS.md #Error 4
│  ├─ scp/transfer falla
│  │  └─ Consulta: ERRORES_COMUNES_RESUELTOS.md #Error 5
│  └─ Port conflict
│     └─ Consulta: ERRORES_COMUNES_RESUELTOS.md #Error 6
│
└─ Database
   ├─ Tabla no existe
   │  └─ Ejecuta: npm run init
   ├─ Corrupted/locked
   │  └─ Consulta: DOCKER_SWARM_DEPLOYMENT_GUIDE.md #Database WAL
   └─ Need backup
      └─ Consulta: DOCKER_SWARM_DEPLOYMENT_GUIDE.md #Disaster Recovery
```

---

## ✅ Checklists

### Pre-Deployment

```
[ ] Git status clean (no uncommitted changes)
[ ] npm run test:all passes (all tests green)
[ ] SSH key configured to server
[ ] Server connectivity verified (ping)
[ ] Database backup created
[ ] No port conflicts locally/on server
```

### Post-Deployment

```
[ ] Frontend loads (HTTP 200 + HTML)
[ ] Login works (POST /api/auth/login → 200 + token)
[ ] Reports API works (GET /api/reportes → 200 + data)
[ ] Database accessible (sqlite3 count > 0)
[ ] No error logs (docker service logs clean)
[ ] Response time acceptable (<100ms)
[ ] All assets load (CSS/JS/images)
[ ] Mobile responsive (test on phone)
```

---

## 📊 File Organization

```
docs/deployment/
├── README.md (este archivo)
├── DOCKER_SWARM_DEPLOYMENT_GUIDE.md (MAIN GUIDE - 300+ líneas)
├── ERRORES_COMUNES_RESUELTOS.md (ERROR REFERENCE - 10 errores)
└── (otros archivos de referencia)

scripts/
├── deploy-safe.sh (AUTOMATED DEPLOYMENT)
└── (otros scripts)
```

---

## 🎓 Conceptos Clave

### Volume Mount Shadowing (MÁS IMPORTANTE)

**Lo que ocurre:**
```
Docker monta: /root/citizen-reports/server:/app/server
Esto REEMPLAZA /app/server (todo lo que hay en la imagen)
Si host está vacío, container no ve los archivos
```

**Implicación:**
- Cambios en imagen NO aparecen en container
- Host files SIEMPRE tienen prioridad
- Debes copiar archivos al host ANTES de montar

**Solución:**
- Asegúrate que host tiene: dist/, app.js, data.db
- Luego reinicia container con `docker service update --force`

### Image vs. Container

```
Image (plantilla, inmutable):
- Compilada con `docker build`
- Contiene todas las dependencias
- Se distribuye con `docker save/load`

Container (instancia, mutable):
- Creado desde imagen con `docker run`
- Tiene volume mounts superpuestos
- Ficheros temporales se pierden al parar
```

**Por eso:**
- Build localmente
- Transfer imagen a servidor
- Container usa imag
en + volume mounts
- Volumen es lo persistente (DB, archivos)

---

## 📞 Soporte

**Preguntas frecuentes:**
- "¿Por qué cambié app.js pero no se ve?" → Ver Conceptos → Volume Shadowing
- "¿Cómo sé si funcionó?" → Post-Deployment Verification checklist
- "¿Qué hacer si se rompe?" → Disaster Recovery section

**Escalation:**
1. Consulta guía (documento + script)
2. Si persiste → Check logs: `docker service logs`
3. Si aún falla → Disaster recovery (restore from backup)

---

## 📅 Changelog

**Versión 1.0 (23 Noviembre 2025):**
- Documentación inicial basada en 20+ incidentes de producción
- DOCKER_SWARM_DEPLOYMENT_GUIDE.md creado
- ERRORES_COMUNES_RESUELTOS.md creado
- deploy-safe.sh script creado

**Errores que documenta:**
- Login 500 (database sync)
- Frontend JSON fallback
- Volume mount shadowing
- Image caching issues
- Path hardcoding
- Database corruption
- Y 5 más...

---

## 🔗 Referencias Externas

- **Docker Swarm Docs:** https://docs.docker.com/engine/swarm/
- **Docker Compose Reference:** https://docs.docker.com/compose/compose-file/
- **SQLite Documentation:** https://www.sqlite.org/cli.html
- **Express.js Guide:** https://expressjs.com/
- **Vite Build Guide:** https://vitejs.dev/guide/build.html

---

**Última Actualización:** 23 Noviembre 2025  
**Autor:** DevOps Team  
**Estado:** PRODUCTION APPROVED ✅
