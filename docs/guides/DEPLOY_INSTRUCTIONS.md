# 🚀 DEPLOYMENT INSTRUCTIONS

**Last Updated:** 2025-11-21  
**Status:** Ready for Production  
**Target Server:** 145.79.0.77:4000

---

## 📋 PREREQUISITES

Before deploying, you need:

1. **Docker Hub account** 
   - Username: `progressiaglobalgroup`
   - Password: (ask your admin)

2. **SSH access to production server**
   - Host: `145.79.0.77`
   - User: `root`
   - Access method: password or SSH key

3. **Scripts in your workspace**
   - ✅ `deploy-master.ps1` (Windows)
   - ✅ `deploy-master.sh` (Linux/Mac)

---

## ⚡ STEP 1: QUICK VALIDATION

**Windows:**
```powershell
cd c:\PROYECTOS\citizen-reports

.\deploy-master.ps1 -DeployMode test
```

**Linux/Mac:**
```bash
cd /path/to/citizen-reports

bash deploy-master.sh test
```

**Expected output:**
```
✅ Docker available
✅ SSH connectivity to 145.79.0.77 OK
✅ Dockerfile valid
✅ All validations passed
```

**If you see errors:** Check prerequisites above, then retry.

---

## 🚀 STEP 2: DEPLOY TO PRODUCTION

### Option A: Full Deployment (Recommended for First Time)

**Windows:**
```powershell
.\deploy-master.ps1 -DeployMode full `
  -SSHHost "root@145.79.0.77" `
  -DockerUser "progressiaglobalgroup" `
  -DockerPass "YOUR_DOCKER_HUB_PASSWORD" `
  -ImageTag "2025-11-21" `
  -PreserveBD $true
```

**Linux/Mac:**
```bash
bash deploy-master.sh full \
  root@145.79.0.77 \
  progressiaglobalgroup \
  "YOUR_DOCKER_HUB_PASSWORD" \
  true \
  2025-11-21
```

**What happens (takes ~5-10 minutes):**
1. Builds Docker image locally
2. Pushes to Docker Hub
3. Backs up database on server
4. Runs schema migration (idempotent)
5. Graceful shutdown (30 seconds)
6. Starts new image
7. Runs health checks
8. Shows deployment status

---

### Option B: Fast Deployment (Image Already in Docker Hub)

If you already pushed the image and just want to deploy:

**Windows:**
```powershell
.\deploy-master.ps1 -DeployMode fast `
  -SSHHost "root@145.79.0.77" `
  -ImageTag "2025-11-21" `
  -PreserveBD $true
```

**Linux/Mac:**
```bash
bash deploy-master.sh fast \
  root@145.79.0.77 \
  progressiaglobalgroup \
  "" \
  true \
  2025-11-21
```

**What happens (takes ~1-2 minutes):**
1. Backs up database on server
2. Runs schema migration
3. Graceful shutdown
4. Starts new image
5. Runs health checks

---

## ✅ STEP 3: VERIFY DEPLOYMENT

### Check 1: API Responding
```bash
curl http://145.79.0.77:4000/api/reportes?limit=1
```

**Expected:** Returns JSON array

```json
{
  "reportes": [
    {
      "id": 1,
      "tipo": "baches",
      "lat": 19.4326,
      "lng": -99.1332,
      "estado": "activo",
      ...
    }
  ]
}
```

### Check 2: View Logs
```bash
ssh root@145.79.0.77 "docker logs --tail 50 citizen-reports"
```

**Expected:** No errors, service running normally

### Check 3: Check Database
```bash
ssh root@145.79.0.77 "sqlite3 /root/citizen-reports/server/data.db 'SELECT COUNT(*) as total_reports FROM reportes;'"
```

**Expected:** Returns number (should match pre-deployment)

### Check 4: Check Backups
```bash
ssh root@145.79.0.77 "ls -lh /root/citizen-reports/backups/"
```

**Expected:** See backup files with today's date

---

## 🔄 IF SOMETHING GOES WRONG

### Automatic Rollback
The script has **automatic rollback**. If health check fails, it will:
1. Stop new container
2. Restore previous docker-compose.yml
3. Start previous image
4. Verify it's responding

You'll see output like:
```
⚠️  Health check failed. Starting rollback...
✅ Rolled back to previous version
```

### Manual Rollback
If you need to manually rollback:

```bash
ssh root@145.79.0.77

cd /root/citizen-reports

# Stop current container
docker-compose down --timeout 30

# Restore previous version
cp docker-compose.yml.backup docker-compose.yml

# Start previous version
docker-compose up -d

# Verify
docker logs -f citizen-reports
```

### Restore From Backup
If you need to restore database from backup:

```bash
ssh root@145.79.0.77

cd /root/citizen-reports/server

# Find backup files
ls -la ../backups/

# Restore (replace TIMESTAMP with actual backup)
cp ../backups/data.db.backup_20251121_TIMESTAMP data.db

# Restart service
docker restart citizen-reports

# Verify
docker logs -f citizen-reports
```

---

## 📊 MONITORING POST-DEPLOYMENT

### Real-time Logs
```bash
ssh root@145.79.0.77 "docker logs -f citizen-reports"
```

### Container Status
```bash
ssh root@145.79.0.77 "docker ps | grep citizen-reports"
```

### Resource Usage
```bash
ssh root@145.79.0.77 "docker stats citizen-reports"
```

### API Health
```bash
# Every 10 seconds
watch -n 10 "curl -s http://145.79.0.77:4000/api/reportes?limit=1 | jq '.reportes | length'"
```

---

## 🎯 COMMON ISSUES & SOLUTIONS

### Issue: "Docker: Cannot connect"
**Cause:** Docker not running on your local machine
**Solution:**
- Windows: Open Docker Desktop
- Linux: `sudo systemctl start docker`
- Mac: Open Docker.app

### Issue: "SSH: Connection refused"
**Cause:** Can't connect to server
**Solution:**
```bash
# Test connectivity
ping 145.79.0.77
ssh -v root@145.79.0.77 "echo OK"

# Check firewall, ports, credentials
```

### Issue: "Image not found"
**Cause:** Docker image not built locally
**Solution:**
```bash
# Use mode=full to build it
.\deploy-master.ps1 -DeployMode full ...
```

### Issue: "Health check failed after 60s"
**Cause:** API not responding after deployment
**Solution:**
```bash
# Check logs on server
ssh root@145.79.0.77 "docker logs citizen-reports"

# Check if container is running
ssh root@145.79.0.77 "docker ps | grep citizen-reports"

# Manual rollback
bash deploy-master.sh rollback root@145.79.0.77
```

### Issue: "Could not connect to Docker daemon"
**Cause:** Docker daemon not running
**Solution:**
- Ensure Docker is running
- On Windows: Docker Desktop must be open
- On Linux: `sudo service docker start`

---

## 📝 DEPLOYMENT RECORD

Keep track of your deployments:

| Date | Time | Status | Image | Notes |
|------|------|--------|-------|-------|
| 2025-11-21 | 05:30 | ✅ SUCCESS | 2025-11-21 | Bug fix for cargarFuncionarios |
| | | | | 98/98 tests passing |
| | | | | Zero-downtime, full backup |

---

## ✨ AFTER SUCCESSFUL DEPLOYMENT

1. **Test all workflows:**
   - Create a report
   - View on map
   - Assign to funcionario
   - Mark as in progress
   - Request closure
   - Close report

2. **Verify new fix works:**
   - Open report detail
   - Click "Asignar" button
   - Modal should load funcionarios list
   - Should NOT see SyntaxError

3. **Monitor logs for 30 minutes:**
   ```bash
   ssh root@145.79.0.77 "docker logs -f citizen-reports"
   ```

4. **Check database integrity:**
   ```bash
   ssh root@145.79.0.77 "sqlite3 /root/citizen-reports/server/data.db 'PRAGMA integrity_check;'"
   # Should return: ok
   ```

---

## 🆘 EMERGENCY CONTACT

If deployment fails and you can't rollback:

1. Check logs: `docker logs citizen-reports`
2. Check database: `sqlite3 data.db 'SELECT COUNT(*) FROM reportes;'`
3. Restore from backup: `cp backups/data.db.backup_* data.db`
4. Restart service: `docker restart citizen-reports`

---

## 📞 SUPPORT

**For Windows issues:**
- Run in PowerShell (not cmd.exe)
- Check `$PSVersionTable.PSVersion` (should be 5.0+)
- Ensure Docker Desktop is running

**For Linux/Mac issues:**
- Ensure Docker daemon is running
- Check SSH key permissions: `chmod 600 ~/.ssh/id_rsa`
- Verify SSH connectivity: `ssh -vv root@145.79.0.77`

**For deployment issues:**
- Check logs: `docker logs citizen-reports`
- Check network: `curl http://145.79.0.77:4000/api/reportes?limit=1`
- Manual rollback: Restore previous docker-compose.yml.backup

---

## ✅ CHECKLIST

Before you deploy:
- [ ] `.\deploy-master.ps1 -DeployMode test` passed
- [ ] Docker image built (`citizen-reports:2025-11-21`)
- [ ] Docker Hub credentials ready
- [ ] SSH access to 145.79.0.77 verified
- [ ] Backup of current database made
- [ ] Team notified of upcoming deployment

After deployment:
- [ ] API responding (curl test)
- [ ] Logs show no errors
- [ ] Database count unchanged
- [ ] Workflows tested
- [ ] New fix verified (modal loads funcionarios)
- [ ] Deployment recorded

---

**🟢 Ready to Deploy! Execute Step 1, then Step 2 above.**
