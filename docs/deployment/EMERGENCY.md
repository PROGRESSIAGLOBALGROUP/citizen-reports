# 🚨 Emergency Procedures

**Si el deployment falló o necesitas recuperar rápidamente**

---

## 🔴 ROLLBACK INMEDIATO

Si deployment falló y quieres volver a versión anterior:

```bash
ssh root@145.79.0.77
cd /root/citizen-reports

# 1. Parar contenedor actual
docker-compose down --timeout 30

# 2. Restaurar versión anterior
cp docker-compose.yml.backup docker-compose.yml

# 3. Iniciar versión anterior
docker-compose up -d

# 4. Verificar
curl http://localhost:4000/api/reportes?limit=1
docker logs -f citizen-reports
```

**¿Volvió a funcionar?** ✅ Rollback exitoso

---

## 🔴 RESTAURAR DESDE BACKUP

Si la base de datos se corrompió:

```bash
ssh root@145.79.0.77
cd /root/citizen-reports

# 1. Ver backups disponibles
ls -lh backups/

# 2. Restaurar el más reciente (reemplaza TIMESTAMP)
cp backups/data.db.backup_20251121_HHMMSS server/data.db

# 3. Reiniciar contenedor
docker restart citizen-reports

# 4. Verificar
docker logs -f citizen-reports

# 5. Contar reportes
sqlite3 server/data.db 'SELECT COUNT(*) FROM reportes;'
```

---

## 🔴 KILL & RESTART

Si contenedor no responde:

```bash
ssh root@145.79.0.77
cd /root/citizen-reports

# 1. Matar contenedor
docker kill citizen-reports

# 2. Reiniciar
docker-compose up -d

# 3. Esperar 5 segundos
sleep 5

# 4. Verificar
curl http://localhost:4000/api/reportes?limit=1
```

---

## 🔴 FULL RESET (Peligroso!)

Si nada funciona, comienza desde cero:

```bash
ssh root@145.79.0.77
cd /root/citizen-reports

# 1. Parar todo
docker-compose down -v

# 2. Borrar DB corrupta (ADVERTENCIA: Perderás datos!)
rm server/data.db

# 3. Recrear schema
npm run init

# 4. Restaurar desde backup si tienes
cp backups/data.db.backup_* server/data.db

# 5. Iniciar
docker-compose up -d

# 6. Verificar
curl http://localhost:4000/api/reportes?limit=1
```

⚠️ **Solo si no hay forma de recuperar normalmente**

---

## 🟡 VERIFICAR ESTADO

Siempre después de cualquier procedimiento:

```bash
ssh root@145.79.0.77

# 1. ¿Contenedor corriendo?
docker ps | grep citizen-reports

# 2. ¿API respondiendo?
curl http://localhost:4000/api/reportes?limit=1

# 3. ¿Sin errores?
docker logs citizen-reports | grep -i error

# 4. ¿BD intacta?
sqlite3 /root/citizen-reports/server/data.db 'SELECT COUNT(*) FROM reportes;'

# 5. ¿Backup existe?
ls -lh /root/citizen-reports/backups/
```

Si todo retorna OK: ✅ **Sistema recuperado**

---

## 📞 SI NADA FUNCIONA

1. **Recopila información:**
   ```bash
   ssh root@145.79.0.77 "docker logs citizen-reports > /tmp/logs.txt 2>&1"
   ssh root@145.79.0.77 "cat /tmp/logs.txt" > emergency-logs.txt
   ```

2. **Reporta problema con:**
   - `emergency-logs.txt`
   - Versión que intentabas deployar
   - Qué error specific viste
   - Qué procedimiento de emergencia intentaste

3. **Mientras se resuelve:**
   - Usa rollback manual (arriba)
   - Mantenimiento en progreso
   - Notifica a usuarios

---

## 💾 BACKUPS DISPONIBLES

Todos los backups están en: `/root/citizen-reports/backups/`

```bash
ssh root@145.79.0.77 "ls -lh /root/citizen-reports/backups/"
```

**Formato:** `data.db.backup_YYYYMMDD_HHMMSS`

Ejemplo:
- `data.db.backup_20251121_053000` ← Pre-deployment backup
- `data.db.backup_20251120_230000` ← Backup anterior

---

## ⏮️ VERSIONES DOCKER DISPONIBLES

```bash
docker images | grep citizen-reports
```

Mantenemos:
- `citizen-reports:latest` (versión corriente)
- `citizen-reports:2025-11-21` (versión específica)

Para rollback manual a versión anterior:
```bash
docker-compose down --timeout 30
# Edita docker-compose.yml y cambia imagen a versión anterior
# O restaura docker-compose.yml.backup
docker-compose up -d
```

---

## 📋 CHECKLIST DE EMERGENCIA

- [ ] ¿Problema ocurrió después de deployment?
- [ ] ¿Intentaste rollback automático primero?
- [ ] ¿Verificaste logs? (`docker logs citizen-reports`)
- [ ] ¿API respondiendo aunque con errores?
- [ ] ¿BD corrupta o datos perdidos?
- [ ] ¿Rollback manual ejecutado?
- [ ] ¿Sistema restaurado?
- [ ] ¿Backups intactos?

---

**¿Emergencia controlada?** ✅ Sistemas en operación

**¿Aún en problema?** Contacta IT con `emergency-logs.txt`

---

**Última opción:** Contacta GitHub Copilot con detalles de error
