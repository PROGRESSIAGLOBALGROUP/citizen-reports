# INSTRUCCIONES FINALES DE DEPLOYMENT MANUAL

## ⚠️ PROBLEMA IDENTIFICADO
PowerShell SSH está requiriendo contraseña interactiva en cada comando, lo que impide la automatización completa.

## ✅ LO QUE YA ESTÁ LISTO

1. **GitHub actualizado** con commit `e2a6e14`
   - Dockerfile corregido con `AS production` target
   - docker-compose.prod.yml funcional
   - Scripts de deployment listos

2. **Servidor actualizado** con último código
   - Commit `e2a6e14` pulled exitosamente
   - Frontend compilado (dist/ generado)
   - Dockerfile corregido presente

## 🎯 DEPLOYMENT EN 3 COMANDOS

### Opción A: SSH Interactivo (RECOMENDADO)

Abre una terminal SSH y ejecuta:

```bash
ssh root@145.79.0.77
```

Luego, una vez dentro, copia y pega todo esto:

```bash
cd /root/citizen-reports

# Build Docker image (2-3 minutos)
docker build --target production -t citizen-reports:latest -f Dockerfile .

# Deploy con rolling update (zero-downtime)
docker stack deploy -c docker-compose.prod.yml citizen-reports

# Esperar 30 segundos
sleep 30

# Verificar
docker stack ps citizen-reports
curl http://localhost:4000/api/reportes?limit=1

# Ver logs si es necesario
docker service logs citizen-reports_citizen-reports --tail 50
```

### Opción B: PowerShell con Credenciales

Si prefieres desde Windows, crea un archivo `creds.txt` con tu contraseña y usa:

```powershell
$password = Get-Content creds.txt | ConvertTo-SecureString -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential ("root", $password)

# Crear sesión persistente
$session = New-PSSession -HostName 145.79.0.77 -Credential $cred

# Ejecutar comandos
Invoke-Command -Session $session -ScriptBlock {
    cd /root/citizen-reports
    docker build --target production -t citizen-reports:latest .
    docker stack deploy -c docker-compose.prod.yml citizen-reports
    Start-Sleep -Seconds 30
    docker stack ps citizen-reports
    curl http://localhost:4000/api/reportes?limit=1
}

# Cerrar sesión
Remove-PSSession $session
```

### Opción C: Script Bash Simple

El script ya está en el servidor como `/tmp/deploy-now.sh`. Solo ejecuta:

```bash
ssh root@145.79.0.77 'bash /tmp/deploy-now.sh'
```

O desde el servidor directamente:

```bash
ssh root@145.79.0.77
bash /tmp/deploy-now.sh
```

## 📊 VERIFICACIÓN POST-DEPLOY

### 1. Verificar Réplicas
```bash
docker service ls | grep citizen-reports
# Debe mostrar: 1/1
```

### 2. Health Check Local (en el servidor)
```bash
curl http://localhost:4000/api/reportes?limit=1
# Debe retornar JSON con reportes
```

### 3. Health Check Externo (desde tu máquina)
```powershell
curl http://145.79.0.77:4000/api/reportes?limit=1
```

### 4. Verificar Logs
```bash
docker service logs citizen-reports_citizen-reports --tail 100 --follow
```

### 5. Ver Estado del Stack
```bash
docker stack ps citizen-reports --no-trunc
```

## 🔧 TROUBLESHOOTING

### Si el build falla:
```bash
# Ver logs completos
cat /tmp/docker-build.log

# Build manual con output visible
docker build --target production -t citizen-reports:latest . --progress=plain
```

### Si el deploy falla:
```bash
# Ver servicios actuales
docker service ls

# Ver eventos del stack
docker stack ps citizen-reports --no-trunc

# Remover y redesplegar
docker stack rm citizen-reports
sleep 30
docker stack deploy -c docker-compose.prod.yml citizen-reports
```

### Si el health check falla:
```bash
# Verificar puerto
netstat -tlnp | grep 4000

# Ver logs del contenedor
docker service logs citizen-reports_citizen-reports --tail 200

# Verificar DB
docker exec $(docker ps -q -f name=citizen-reports) ls -lh /app/server/data.db
```

## 🚀 PRÓXIMOS PASOS DESPUÉS DEL DEPLOYMENT

1. **Configurar SSH Keys** para evitar password prompts:
   ```powershell
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ssh-copy-id root@145.79.0.77
   ```

2. **Arreglar nginx-proxy** (actualmente 0/1 réplicas):
   ```bash
   docker service logs nginx-proxy_nginx-reverse-proxy --tail 100
   docker service update --force nginx-proxy_nginx-reverse-proxy
   ```

3. **Configurar auto-deployment** con webhook funcional

4. **Monitoreo continuo**:
   ```bash
   watch -n 5 'docker service ls'
   ```

## 📞 SOPORTE

Si encuentras errores, documenta:
1. El comando exacto ejecutado
2. El error completo
3. Output de `docker service logs citizen-reports_citizen-reports --tail 50`
4. Output de `docker stack ps citizen-reports --no-trunc`

---

**Estado Final:** 
- ✅ GitHub: Actualizado (commit e2a6e14)
- ✅ Servidor: Código actualizado
- ⏳ Docker Stack: Pendiente de rebuild manual (3 comandos arriba)

**Tiempo estimado:** 5 minutos total
