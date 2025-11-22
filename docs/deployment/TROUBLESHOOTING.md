# 🆘 Troubleshooting - Solución de Problemas

---

## 🔴 Error: "Docker: Cannot connect"

**Causa:** Docker no está corriendo en tu máquina

**Solución:**
- Windows: Abre Docker Desktop
- Linux: `sudo systemctl start docker`
- Mac: Abre Docker.app

**Verifica:**
```bash
docker ps
```

---

## 🔴 Error: "SSH: Connection refused"

**Causa:** No puede conectar a 145.79.0.77

**Verificación:**
```bash
# Test connectivity
ping 145.79.0.77

# Test SSH
ssh root@145.79.0.77 "echo OK"
```

**Soluciones:**
1. Verifica firewall (¿puerto 22 abierto?)
2. Verifica IP correcta (145.79.0.77)
3. Verifica credenciales SSH
4. Contacta IT si problem persiste

---

## 🟡 Error: "Validation Failed"

**Causa:** Alguna validación pre-deployment falló

**Soluciona según el error:**
- "Docker not found" → Instala Docker
- "SSH not available" → Fix SSH (arriba)
- "No Dockerfile" → Verifica workspace

---

## 🟡 Error: "Health check failed"

**Causa:** API no respondió después del deployment

**Qué sucede automáticamente:**
- Script detecta fallo
- Inicia rollback automático
- Verás: `⚠️ Health check failed. Starting rollback...`
- Script restaura versión anterior
- Verás: `✅ Rolled back to previous version`

**No necesitas hacer nada.** Ocurre automáticamente.

**Si persiste:** Consulta `EMERGENCY.md`

---

## 🟡 Error: "Database Error"

**Síntomas:** API responde pero con errores de BD

**Verificación:**
```bash
ssh root@145.79.0.77 "docker logs citizen-reports 2>&1 | grep -i error"
```

**Soluciones comunes:**
1. **"no such table"** → Schema migration falló
   - Rollback manual (ver EMERGENCY.md)
   - Verifica: `npm run init` en servidor

2. **"database is locked"** → Contenedor viejo aún corriendo
   - Kill contenedor: `docker kill citizen-reports`
   - Restart: `docker-compose up -d`

3. **"permission denied"** → Permisos de archivo
   - Contacta IT

---

## 🟡 Error: "API retorna HTML, no JSON"

**Causa:** Endpoint retorna HTML (error 404)

**Verificación:**
```bash
curl -v http://145.79.0.77:4000/api/reportes?limit=1
```

**Si ve HTML:** API no está respondiendo correctamente

**Soluciones:**
1. Verifica logs: `ssh root@145.79.0.77 "docker logs citizen-reports"`
2. Check container: `ssh root@145.79.0.77 "docker ps | grep citizen-reports"`
3. Si no está corriendo: `ssh root@145.79.0.77 "docker-compose up -d"`

---

## 🟡 Error: "Modal no muestra funcionarios"

**Causa:** Fix no se aplicó

**Verificación:**
- Abre: http://145.79.0.77:4000
- Click: Botón "Asignar" en un reporte
- ¿Ve lista de funcionarios? ✅ OK
- ¿Ve error? Continúa...

**Soluciones:**
1. Verifica que deployment completó exitosamente
2. Hard refresh navegador: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
3. Si persiste: Rollback manual (ver EMERGENCY.md)

---

## 🟡 Error: "SSH key not found"

**Causa:** SSH key en ubicación incorrecta

**Solución:**
```bash
# Linux/Mac
ls -la ~/.ssh/id_rsa

# Windows (si usas OpenSSH)
dir %USERPROFILE%\.ssh\id_rsa
```

**Si no existe:**
1. Genera key: `ssh-keygen -t rsa -b 4096`
2. O proporciona password en lugar de key

---

## 🟡 Error: "Database se perdió"

**IMPOSIBLE** (está protegido por backup automático)

**Pero si sucede:**
1. No entres en pánico
2. Verifica backup: `ssh root@145.79.0.77 "ls -la /root/citizen-reports/backups/"`
3. Restaura: Ver `EMERGENCY.md` sección "Restore from Backup"

---

## ✅ Verificación Post-Deployment

Si deployment completó pero quieres verificar:

```bash
# 1. API respondiendo
curl http://145.79.0.77:4000/api/reportes?limit=1

# 2. Logs limpios
ssh root@145.79.0.77 "docker logs citizen-reports | tail -20"

# 3. Container corriendo
ssh root@145.0.77 "docker ps | grep citizen-reports"

# 4. BD con datos
ssh root@145.79.0.77 "sqlite3 /root/citizen-reports/server/data.db 'SELECT COUNT(*) FROM reportes;'"

# 5. Backup creado
ssh root@145.79.0.77 "ls -lh /root/citizen-reports/backups/ | head -5"
```

Si todo retorna OK: ✅ **Deployment exitoso**

---

## 🚨 Si Aún Hay Problemas

1. Recopila logs:
   ```bash
   ssh root@145.79.0.77 "docker logs citizen-reports" > logs.txt
   ```

2. Ve a `EMERGENCY.md` para rollback manual

3. O contacta equipo de soporte con logs

---

**¿Problema no listado aquí?** Consulta `GUIDE.md` o `EMERGENCY.md`
