# 👋 Onboarding Guide - Citizen Reports Production

**Bienvenida al equipo de operaciones de Citizen Reports**

**Fecha:** 11 Noviembre 2025  
**Duración Esperada:** 2-4 horas para leer + 1 hora para hands-on

---

## 🎯 Objetivo de Este Documento

Si acabas de ser contratado para manejar el deployment de citizen-reports en producción, este documento te llevará paso-a-paso por:

1. ✅ Qué es citizen-reports
2. ✅ Dónde está alojado
3. ✅ Cómo funciona la arquitectura
4. ✅ Qué hacer en emergencias
5. ✅ Cómo reportar problemas
6. ✅ Dónde obtener ayuda

---

## 📚 Reading Order (Importante)

**PRIMERO (30 minutos):**
1. Este documento (Onboarding)
2. `DEPLOYMENT_PRODUCTION_COMPLETE_2025-11-11.md` → Sección Executive Summary

**SEGUNDO (30 minutos):**
1. `SERVER_DEPLOYMENT_STEP_BY_STEP_DETAILED.md` → Lee todo (entender cómo se deployó)

**TERCERO (30 minutos):**
1. `EMERGENCY_RUNBOOK.md` → Lee todos los escenarios
2. `TROUBLESHOOTING_MATRIX.md` → Entiende cómo diagnosticar

**CUARTO (30 minutos):**
1. `MONITORING_AND_MAINTENANCE.md` → Secciones Diaria y Semanal

**LUEGO (Hands-on, 1 hora):**
1. Ejecutar el checklist "Tu Primer Día"
2. Hacer backup de database
3. Ejecutar todos los tests de diagnóstico

---

## 🏗️ Arquitectura de 30 Segundos

```
┌──────────────────────────────────┐
│ CIUDADANOS EN NAVEGADORES        │
│ https://reportes.progressiagroup │
└──────────────┬───────────────────┘
               │ HTTPS (puerto 443)
               ▼
┌──────────────────────────────────┐
│ TRAEFIK (Reverse Proxy)          │
│ 145.79.0.77:443 → 145.79.0.77:4000
│ • SSL/TLS Termination            │
│ • Enrutamiento                   │
│ • Rate limiting (opcional)       │
└──────────────┬───────────────────┘
               │ HTTP (puerto 4000)
               ▼
┌──────────────────────────────────┐
│ EXPRESS APP (Node.js 20)         │
│ citizen-reports-app container    │
│ • REST API                       │
│ • SPA serving                    │
│ • Authentication                 │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ SQLite DATABASE (data.db)        │
│ • Reportes de ciudadanos         │
│ • Usuarios del gobierno          │
│ • Audit trail                    │
│ • PERSISTENTE (volumen Docker)   │
└──────────────────────────────────┘
```

### En Producción (145.79.0.77)

- **VPS:** Ubuntu 24.04.2 LTS (Hostgator)
- **Orquestación:** Docker Swarm (Easypanel manager)
- **Reverse Proxy:** Traefik 3.3.7
- **App:** Node.js 20 en contenedor
- **Database:** SQLite3
- **SSL:** Let's Encrypt (renovación automática)

---

## 🔑 Información Esencial

### Acceso SSH

```bash
ssh root@145.79.0.77
# Usa ssh key (no password - más seguro)

# O si tienes password (pedir al anterior responsable):
ssh -p 22 root@145.79.0.77
# Ingresar password cuando te lo pida
```

### URL de Producción

```
https://reportes.progressiagroup.com/
```

### Puertos Importantes

```
80    → Traefik HTTP (redirect a 443)
443   → Traefik HTTPS
4000  → Express App (no accesible desde internet)
3000  → Easypanel Web UI
```

### Ubicaciones en VPS

```
/root/citizen-reports/          # Código fuente del proyecto
/root/citizen-reports/data.db   # Database (en volumen Docker)
/root/backups/                  # Backups (manual)
/etc/easypanel/traefik/         # Configuración Traefik
/etc/easypanel/traefik/acme.json # Certificados SSL
```

---

## ✅ Tu Primer Día (Checklist)

### 9:00 AM - Acceso y Verificación

- [ ] **SSH al servidor**
  ```bash
  ssh root@145.79.0.77
  ```

- [ ] **Ver qué corre en Docker**
  ```bash
  docker ps
  # Deberías ver: easypanel, traefik, n8n, suitecrm, evolution, ollama, citizen-reports-app
  ```

- [ ] **Verificar que app está UP**
  ```bash
  curl -I https://reportes.progressiagroup.com/
  # Esperado: HTTP/2 200
  ```

- [ ] **Verificar DNS**
  ```bash
  nslookup reportes.progressiagroup.com 8.8.8.8
  # Esperado: 145.79.0.77
  ```

- [ ] **Revisar logs últimas 24 horas**
  ```bash
  docker logs --since 24h citizen-reports-app | head -50
  # ¿Hay errores? Si sí, revisar TROUBLESHOOTING_MATRIX
  ```

### 10:00 AM - Familiarización con Navegación

- [ ] **Abrir https://reportes.progressiagroup.com/ en navegador**
  - ¿Se ve la aplicación?
  - ¿No hay errores en DevTools (F12)?
  - ¿El mapa carga?

- [ ] **Test básico de funcionalidad**
  ```bash
  # Obtener lista de departamentos
  curl -s https://reportes.progressiagroup.com/api/dependencias | jq '.[0]'
  # Esperado: JSON con información de departamentos
  ```

- [ ] **Login en la aplicación**
  - Usar credenciales: admin@jantetelco.gob.mx / admin123
  - Navegar por el panel de admin
  - Ver si hay reportes pendientes

### 11:00 AM - Backup Strategy

- [ ] **Crear backup manual**
  ```bash
  ssh root@145.79.0.77
  
  docker exec citizen-reports-app \
    cp /app/server/data.db /app/server/data-$(date +%Y%m%d_%H%M%S).db
  
  docker cp citizen-reports-app:/app/server/data-*.db /root/backups/
  
  ls -la /root/backups/
  ```

- [ ] **Verificar que backup existe**
  ```bash
  ls -lh /root/backups/ | head -5
  # Debe ver archivos data-YYYYMMDD_HHMMSS.db
  ```

### 12:00 PM - Documentación Personal

- [ ] **Crear archivo de notas personales**
  ```bash
  # En tu máquina local
  cat > ~/citizen-reports-notes.md << 'EOF'
  # Mi Onboarding - [Tu Nombre]
  Fecha: [Hoy]
  
  ## Aprendizajes
  - [Qué aprendiste]
  
  ## Preguntas Sin Responder
  - [Qué no entiendes]
  
  ## Siguiente Paso
  - [Qué necesitas hacer mañana]
  EOF
  ```

### 1:00 PM - Emergency Procedures

- [ ] **Leer EMERGENCY_RUNBOOK**
  - Enfocarse en Escenario 1 (App no responde)
  - Enfocarse en Escenario 3 (DNS no resuelve)

- [ ] **Practicar restart (en lab, no production)**
  - Ver cómo hace restart: `docker restart citizen-reports-app`
  - Ver cómo hace full rebuild: `docker compose down && docker compose up -d`

### 2:00 PM - Daily Monitoring Setup

- [ ] **Leer MONITORING_AND_MAINTENANCE - Monitoreo Diario**

- [ ] **Crear task diario (opcional pero recomendado)**
  ```bash
  # Agregar a crontab
  crontab -e
  
  # Agregar línea:
  # 0 9 * * 1-5 ssh root@145.79.0.77 "docker ps | grep citizen-reports"
  ```

### 3:00 PM - Questions & Handoff

- [ ] **Reunión con operador anterior (si existe)**
  - Preguntar sobre: problemas recientes, workarounds, gotchas
  - Pedir que te muestre el servidor en vivo
  - Pedir credenciales de acceso confirmadas

- [ ] **Documentar gotchas**
  ```bash
  # Agregar a notas personales cualquier:
  # - Problema conocido
  # - Workaround temporal
  # - Performance issue
  # - Comportamiento extraño
  ```

---

## 🚨 Scenarios para Practicar (Sin Romper Producción)

### Escenario 1: Verificar Status del Sistema

```bash
ssh root@145.79.0.77 << 'EOF'

echo "=== DOCKER STATUS ==="
docker ps | grep citizen-reports

echo -e "\n=== HTTP STATUS ==="
curl -I http://145.79.0.77:4000/

echo -e "\n=== HTTPS STATUS ==="
curl -I https://reportes.progressiagroup.com/

echo -e "\n=== CERTIFICATE DETAILS ==="
openssl s_client -connect reportes.progressiagroup.com:443 -showcerts 2>/dev/null | grep -E "subject=|notAfter="

echo -e "\n=== DNS RESOLUTION ==="
nslookup reportes.progressiagroup.com 8.8.8.8

echo -e "\n=== DATABASE CHECK ==="
docker exec citizen-reports-app sqlite3 /app/server/data.db "SELECT COUNT(*) FROM reportes;"

echo -e "\n=== STORAGE ==="
df -h /
docker exec citizen-reports-app du -sh /app/server/

EOF
```

### Escenario 2: Ver y Entender Logs

```bash
ssh root@145.79.0.77 << 'EOF'

# Últimas 10 líneas (rápido)
docker logs --tail 10 citizen-reports-app

# Últimas 24 horas filtrando errores
docker logs --since 24h citizen-reports-app | grep -i "error"

# Logs en vivo (presionar Ctrl+C para salir)
docker logs -f --tail 50 citizen-reports-app

EOF
```

### Escenario 3: Entender estructura de archivos

```bash
ssh root@145.79.0.77 << 'EOF'

echo "=== PROYECTO STRUCTURE ==="
ls -la /root/citizen-reports/

echo -e "\n=== DOCKER VOLUMES ==="
docker volume ls | grep db

echo -e "\n=== CERTIFICADOS ==="
ls -la /etc/easypanel/traefik/ | grep -E "acme|domain"

echo -e "\n=== BACKUPS ==="
ls -lh /root/backups/ | head -10

EOF
```

---

## 📖 Guía de Referencia Rápida

### Comandos que Usarás Frecuentemente

```bash
# Ver estado del app
docker ps | grep citizen-reports
docker stats citizen-reports-app

# Ver logs
docker logs -f citizen-reports-app
docker logs --since 2h citizen-reports-app | grep -i "error"

# Restart app
docker restart citizen-reports-app

# Hacer backup
docker exec citizen-reports-app cp /app/server/data.db /app/server/data-backup.db

# Verificar SSL
openssl s_client -connect reportes.progressiagroup.com:443 -showcerts 2>/dev/null | grep notAfter

# Verificar DNS
nslookup reportes.progressiagroup.com 8.8.8.8

# Test API
curl -s https://reportes.progressiagroup.com/api/dependencias | jq length
```

### Accesos y Credenciales

**Guarda esto en un lugar seguro (password manager):**

```
SSH: root@145.79.0.77
Database: SQLite (no requiere password, en /app/server/data.db)
Admin UI: https://reportes.progressiagroup.com/
  Email: admin@jantetelco.gob.mx
  Password: admin123

Hostgator Panel: https://www.hostgator.com
  (Para cambios de DNS/dominio si necesario)
```

---

## 🆘 Obtener Ayuda

### Si Algo Está Mal

**Orden de escalation:**

1. **Revisar este documento** - Tal vez ya está documentado
2. **Revisar TROUBLESHOOTING_MATRIX** - Busca tu síntoma
3. **Revisar EMERGENCY_RUNBOOK** - Si es algo crítico
4. **Contactar desarrollador** - Si no encuentras solución en 30 minutos
5. **Contactar Hostgator support** - Si es problema de infraestructura/DNS

### Información a Recopilar Cuando Reportes

```
Cuando reportes un problema, proporciona SIEMPRE:

1. ¿Qué intentaste hacer?
2. ¿Qué esperabas que pasara?
3. ¿Qué pasó en cambio?
4. Timestamp del problema
5. Output de:
   docker logs citizen-reports-app | tail -50
6. Output de:
   curl -I https://reportes.progressiagroup.com/
7. Output de:
   docker stats citizen-reports-app
```

---

## 📋 Documentos de Referencia (Orden de Lectura)

1. **Este archivo** - Onboarding (tú estás aquí)
2. **DEPLOYMENT_PRODUCTION_COMPLETE_2025-11-11.md** - Qué se hizo y por qué
3. **SERVER_DEPLOYMENT_STEP_BY_STEP_DETAILED.md** - Cómo se deployó cada parte
4. **EMERGENCY_RUNBOOK.md** - Qué hacer en problemas críticos
5. **TROUBLESHOOTING_MATRIX.md** - Diagnóstico de problemas
6. **MONITORING_AND_MAINTENANCE.md** - Tareas diarias/semanales

---

## ✅ Antes de Decir "Estoy Listo"

Marca todo esto como completo:

- [ ] Puedo SSH al servidor sin problemas
- [ ] Entiendo cómo funciona Docker en el servidor
- [ ] Entiendo la arquitectura (Traefik → Express → SQLite)
- [ ] Puedo ejecutar comandos docker ps, docker logs
- [ ] Puedo acceder a https://reportes.progressiagroup.com/
- [ ] Puedo hacer y verificar un backup
- [ ] He leído EMERGENCY_RUNBOOK de principio a fin
- [ ] Puedo diagnosticar un problema simple (404, CORS, etc)
- [ ] Tengo contacto del desarrollador para escalation
- [ ] He anotado todos los "gotchas" locales específicos

---

## 🎓 Aprendimiento Continuo

**Cosas para aprender en tus primeras 2 semanas:**

- [ ] Monitorear sistema durante 1 semana completa (sin cambios)
- [ ] Hacer un restart planificado (en horario bajo uso)
- [ ] Practicar restore from backup (en staging, no production)
- [ ] Entender logs y cómo leerlos
- [ ] Entender Docker basics (images, containers, volumes, networks)
- [ ] Entender Traefik basics (routing, SSL termination)
- [ ] Entender SQLite basics (PRAGMA integrity_check, VACUUM, indices)

---

## 💡 Tips y Tricks

### Terminal Productivity

```bash
# Crear alias para acceso rápido
alias prod-ssh="ssh root@145.79.0.77"
alias prod-logs="ssh root@145.79.0.77 'docker logs -f citizen-reports-app'"
alias prod-status="ssh root@145.79.0.77 'docker ps | grep citizen-reports'"

# Guardar en ~/.bashrc o ~/.zshrc para que persista
```

### Monitoreo Continuo (Terminal split)

```bash
# Terminal 1: Logs en vivo
ssh root@145.79.0.77 'docker logs -f citizen-reports-app'

# Terminal 2: Stats en vivo
ssh root@145.79.0.77 'watch -n 1 "docker stats citizen-reports-app --no-stream"'

# Terminal 3: Trabajar normalmente
# ...
```

### Documentación Personal

```bash
# Mantener archivo con:
# - Problemas encontrados
# - Soluciones aplicadas
# - Preguntas sin responder
# - Cambios que hiciste

# Actualizar diariamente = invaluable para futuro
```

---

## 🎯 Metas para Próxima Semana

Después de 1 semana, deberías poder:

- ✅ Diagnosticar y resolver problemas simples (restart, cache clear)
- ✅ Interpretar logs y encontrar problemas
- ✅ Hacer backups y entender dónde están almacenados
- ✅ Escalar problemas complejos apropiadamente
- ✅ Entender arquitectura y cómo componentes se conectan

---

## 🤝 Bienvenida al Equipo

¡Felicidades por unirte! 

Citizen Reports es un proyecto importante para la transparencia municipal en México. Tu rol es crítico para mantenerlo funcionando.

**No dudes en:**
- Hacer preguntas (especialmente en tu primer día)
- Actualizar documentación si encuentras confusiones
- Reportar problemas rápidamente
- Colaborar con el equipo

¡Bienvenido! 🚀

---

**Documento de Onboarding v1.0**  
Última actualización: 11 Noviembre 2025  
Contacto: [Team Lead Email]
