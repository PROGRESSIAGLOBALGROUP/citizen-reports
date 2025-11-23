# Docker Swarm Deployment Guide - Citizen Reports

**Last Updated:** November 23, 2025  
**Status:** Production Guide  
**Audience:** DevOps, Release Engineers, SREs

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Critical Concepts](#critical-concepts)
4. [Step-by-Step Deployment](#step-by-step-deployment)
5. [Volume Mount Strategy](#volume-mount-strategy)
6. [Common Errors and Fixes](#common-errors-and-fixes)
7. [Validation Checklist](#validation-checklist)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Troubleshooting](#troubleshooting)
10. [Disaster Recovery](#disaster-recovery)

---

## Prerequisites

### Server Requirements
- Ubuntu 20.04+ (or compatible Linux)
- Docker 20.10+ with Swarm mode enabled
- At least 2GB free disk space (preferably 10GB+)
- SSH access to production server
- Git repository with main branch ready

### Local Development Machine
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Node.js 18+ with npm
- PowerShell 5.1+ (for deployment scripts on Windows)
- SCP/SSH client configured

### Credentials Needed
- SSH key to production server
- GitHub access (if using private repository)
- Database credentials (if applicable)

---

## Architecture Overview

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Server                         │
│                    (145.79.0.77)                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │         Docker Swarm Manager                             ││
│  │  ┌────────────────────────────────────────────────────┐ ││
│  │  │  citizen-reports Service                           │ ││
│  │  │  ┌────────────────────────────────────────────────┐│ ││
│  │  │  │ Container (nodejs:20-alpine)                  ││ ││
│  │  │  │ ├─ /app/server (volume mount)          ◄──────┼┼─┼─ /root/citizen-reports/server (HOST)
│  │  │  │ │  ├─ app.js                                  ││ ││
│  │  │  │ │  ├─ data.db (SQLite)                        ││ ││
│  │  │  │ │  ├─ dist/ (Frontend HTML/CSS/JS)           ││ ││
│  │  │  │ │  └─ node_modules/                           ││ ││
│  │  │  │ ├─ /app/node_modules                          ││ ││
│  │  │  │ └─ Process: npm start (Express on :4000)     ││ ││
│  │  │  └────────────────────────────────────────────────┘│ ││
│  │  └────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Port 4000 → API + Static SPA                               │
└─────────────────────────────────────────────────────────────┘
```

### Key Points

1. **Single Process Node:** Express.js serves both API and static frontend
2. **Volume Mounts (Bind Mounts):** Direct host filesystem → container filesystem
3. **Database Persistence:** SQLite at `/root/citizen-reports/server/data.db`
4. **Frontend Distribution:** Built locally → copied to host → mounted in container

---

## Critical Concepts

### ⚠️ Volume Mount Shadowing (MOST CRITICAL)

**What It Is:**
When Docker mounts a volume, it completely replaces the container path with the host path. Files in the image at that location become inaccessible.

**Example:**
```dockerfile
# In Dockerfile
COPY --from=client-builder /app/client/dist ./server/dist
# This creates /app/server/dist in the IMAGE

# In docker-compose.prod.yml
volumes:
  - /root/citizen-reports/server:/app/server:rw
# This REPLACES /app/server (including dist/) with the host directory
```

**Impact:**
- If `/root/citizen-reports/server/dist/` is empty on host, container can't access frontend
- Even though image has the files, they're inaccessible due to shadowing
- Changes to app.js in image won't appear in container (volume shadows it)

**Solution:**
✅ Ensure all runtime files exist on the host BEFORE container starts:
- Frontend dist files: `/root/citizen-reports/server/dist/`
- Backend code: `/root/citizen-reports/server/app.js` (gets shadowed from host)
- Database: `/root/citizen-reports/server/data.db` (persistent)

### ⚠️ Service Update vs. Image Rebuild

**What It Is:**
`docker build` updates your local image, but Docker Swarm caches image layers. Same tag = might use old cached image.

**Scenario:**
```bash
docker build -t citizen-reports:latest .  # Creates new image SHA
docker service update --force citizen-reports_citizen-reports
# Swarm might still use old image if tag hasn't changed globally
```

**Solution:**
✅ After `docker build`, must explicitly load into Swarm:
```bash
docker save citizen-reports:latest | ssh root@server 'docker load'
# OR
docker stack deploy -c docker-compose.prod.yml citizen-reports  # Re-reads compose file
```

### ⚠️ Host File vs. Image File Priority

**Priority Order (in running container):**
1. **Volume Mount** (if exists): `/root/citizen-reports/server/*` → shadows image
2. **Image Layer:** Only if no volume mount shadows it
3. **Container Layer:** Runtime changes

**Implication:**
- Fixing code locally doesn't help unless you:
  - Option A: Update the file on the host
  - Option B: Remove the volume mount (not recommended for persistence)
  - Option C: Rebuild Docker image AND copy to host

---

## Step-by-Step Deployment

### Phase 1: Local Validation (Developer Machine)

#### 1.1 Build Frontend

```bash
cd c:\PROYECTOS\citizen-reports\client
npm install
npm run build
# Output: dist/ folder created with index.html, assets/, etc.
# Verify: ls dist/index.html should exist
```

#### 1.2 Build Docker Image

```bash
cd c:\PROYECTOS\citizen-reports
docker build -t citizen-reports:latest . --no-cache
# --no-cache ensures fresh build (no layer caching surprises)
# Verify: docker run --rm citizen-reports:latest ls /app/server/dist/index.html
```

#### 1.3 Run Local Test

```bash
# Optional: Test locally before production
docker run -d -p 4000:4000 citizen-reports:latest
curl http://localhost:4000/
# Should return HTML (frontend) not JSON (fallback)
```

### Phase 2: Push Image to Server

#### 2.1 Save and Transfer Image

```powershell
# Save image to tar
docker save citizen-reports:latest -o "$env:TEMP\citizen-reports.tar"

# Copy to server (from Windows PowerShell)
scp "$env:TEMP\citizen-reports.tar" "root@145.79.0.77:/tmp/citizen-reports.tar"
# Expected: 100-150MB transfer (~30-60 seconds)

# Load on server
ssh root@145.79.0.77 'docker load -i /tmp/citizen-reports.tar && rm /tmp/citizen-reports.tar'
# Verify: docker images citizen-reports:latest
```

#### 2.2 Verify Image on Server

```bash
# SSH to server
ssh root@145.79.0.77

# Check image
docker images citizen-reports:latest

# Inspect image contents
docker run --rm citizen-reports:latest ls -la /app/server/dist/
# Expected: index.html, assets/, favicon.ico present

# Check app.js in image
docker run --rm citizen-reports:latest grep "const distPath" /app/server/app.js
# This verifies code is in image
```

### Phase 3: Prepare Host Filesystem

#### 3.1 Copy Frontend Dist Files

```bash
# From local machine to server
scp -r "c:\PROYECTOS\citizen-reports\client\dist\*" "root@145.79.0.77:/root/citizen-reports/server/dist/"
# Expected: index.html, assets/, favicon.ico copied to host

# Verify on server
ssh root@145.79.0.77 'ls -la /root/citizen-reports/server/dist/ | head -10'
```

#### 3.2 Copy Backend Files

```bash
# Critical: Copy app.js and other server files
scp "c:\PROYECTOS\citizen-reports\server\app.js" "root@145.79.0.77:/root/citizen-reports/server/app.js"
scp "c:\PROYECTOS\citizen-reports\server\db.js" "root@145.79.0.77:/root/citizen-reports/server/db.js"
# Copy ALL modified server files
```

#### 3.3 Initialize Database (if needed)

```bash
ssh root@145.79.0.77 'cd /root/citizen-reports/server && npm run init'
# Creates /root/citizen-reports/server/data.db from schema.sql
# Safe to run multiple times (idempotent)
```

### Phase 4: Deploy with Docker Compose

#### 4.1 Verify docker-compose.prod.yml

```yaml
version: '3.8'

services:
  citizen-reports:
    image: citizen-reports:latest  # Must exist locally on server
    ports:
      - "4000:4000"
    volumes:
      - /root/citizen-reports/server:/app/server:rw  # Bind mount (shadows image)
      - /root/citizen-reports/backups:/app/backups:rw
    environment:
      - NODE_ENV=production
      - DB_PATH=/app/server/data.db
      - PORT=4000
    networks:
      - citizen-reports_internal
    deploy:
      replicas: 1
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3

networks:
  citizen-reports_internal:
    external: true  # Pre-created: docker network create citizen-reports_internal
```

**Critical Lines Explained:**
- `image: citizen-reports:latest` - Must exist in Swarm (loaded via docker load)
- `volumes: /root/citizen-reports/server:/app/server:rw` - **SHADOWS** image contents
- `:rw` - Read-write permission for container
- `external: true` - Network must exist (create with: `docker network create citizen-reports_internal`)

#### 4.2 Deploy

```bash
# On production server
cd /root/citizen-reports

# Create network if doesn't exist
docker network create citizen-reports_internal 2>/dev/null || echo "Network exists"

# Deploy
docker stack deploy -c docker-compose.prod.yml citizen-reports

# Monitor rollout
docker stack ps citizen-reports
# Watch for: CURRENT STATE = Running
```

### Phase 5: Verification

#### 5.1 Check Container Status

```bash
docker ps
# Expected: citizen-reports_citizen-reports.1, Status: Up

# Detailed info
docker stack ps citizen-reports
```

#### 5.2 Check Port Accessibility

```bash
# From local machine
curl http://145.79.0.77:4000/
# Expected: HTML response (<!DOCTYPE html...) NOT JSON

# Check headers
curl -i http://145.79.0.77:4000/
# Expected: Content-Type: text/html; charset=utf-8
```

#### 5.3 Test API Endpoint

```bash
curl -X POST http://145.79.0.77:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jantetelco.gob.mx","password":"admin123"}'
# Expected: HTTP 200 + JSON with token
```

#### 5.4 Check Database

```bash
docker exec $(docker ps -q -f label=com.docker.swarm.service.name=citizen-reports_citizen-reports | head -1) \
  sqlite3 /app/server/data.db "SELECT COUNT(*) FROM usuarios;"
# Expected: Numeric count > 0
```

---

## Volume Mount Strategy

### Bind Mounts vs. Named Volumes

| Aspect | Bind Mounts | Named Volumes |
|--------|-------------|---------------|
| **Path** | `/root/citizen-reports/server:/app/server` | `citizen-reports-data:/app/server` |
| **Storage** | Host filesystem | Docker managed location |
| **Shadowing** | YES - replaces image contents | YES - same issue |
| **Host Access** | Direct file access (easy debugging) | Through Docker (complex) |
| **Persistence** | Until manually deleted | Until `docker volume rm` |
| **Backup** | `scp` or regular file backup | `docker volume export` (complex) |
| **Recommended For** | Production (direct access) | Development (isolation) |

### Why Bind Mounts for Production

✅ **Advantages:**
- Direct SSH access to files for debugging
- Easy backup with standard tools (scp, rsync, tar)
- Transparent file management
- Fast file I/O (no Docker indirection)

❌ **Challenges:**
- Must ensure host has all needed files
- Volume mount completely shadows image
- Requires careful coordination of host vs. image files

### Mitigation Strategy

**Golden Rule:** After volume mount, treat the HOST directory as the source of truth.

```
Image Built → Contains files
           ↓
         BUT
           ↓
Volume Mount → Replaces image path with host path
           ↓
         SO
           ↓
Host Must Have → All runtime files:
  - dist/ (frontend)
  - app.js (backend)
  - node_modules/ (dependencies)
  - data.db (database)
```

---

## Common Errors and Fixes

### Error 1: Frontend Returns JSON Instead of HTML

**Symptoms:**
```
GET http://145.79.0.77:4000/
HTTP 200
Content-Type: application/json
{"message":"Citizen Reports API activo","status":"ok"}
```

**Expected:**
```
GET http://145.79.0.77:4000/
HTTP 200
Content-Type: text/html; charset=utf-8
<!DOCTYPE html>
<html>
  ...
</html>
```

**Root Causes:**
1. `/app/server/dist/index.html` doesn't exist in container
2. Path resolution issue in app.js (looking in wrong directory)
3. Volume mount shadowed image dist/ files

**Fix:**

```bash
# Step 1: Verify host has dist files
ssh root@145.79.0.77 'ls -la /root/citizen-reports/server/dist/index.html'
# If NOT found: Copy from local build
scp -r "c:\PROYECTOS\citizen-reports\client\dist\*" "root@145.79.0.77:/root/citizen-reports/server/dist/"

# Step 2: Verify app.js path logic
ssh root@145.79.0.77 'docker exec $(docker ps -q | head -1) cat /app/server/app.js | grep -A 3 "const distPath"'
# Expected: Should check ./dist first (Docker path)

# Step 3: If app.js has wrong path, update host file
scp "c:\PROYECTOS\citizen-reports\server\app.js" "root@145.79.0.77:/root/citizen-reports/server/app.js"

# Step 4: Restart container
ssh root@145.79.0.77 'docker service update --force citizen-reports_citizen-reports'

# Step 5: Verify
curl http://145.79.0.77:4000/
```

### Error 2: Login Returns 500 "Error al crear sesión"

**Symptoms:**
```
POST /api/auth/login
HTTP 500
{"error":"Error al crear sesión"}
```

**Root Cause:** Database table `sesiones` corrupted or missing

**Fix:**

```bash
# Option 1: Reinitialize database
ssh root@145.79.0.77 'cd /root/citizen-reports/server && npm run init'

# Option 2: If init fails, backup and start fresh
ssh root@145.79.0.77 'mv /root/citizen-reports/server/data.db /root/citizen-reports/backups/data.db.backup && cd /root/citizen-reports/server && npm run init'

# Verify
curl -X POST http://145.79.0.77:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jantetelco.gob.mx","password":"admin123"}'
# Expected: HTTP 200 + token
```

### Error 3: Port 4000 Already in Use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::4000
```

**Root Causes:**
1. Container already running on port
2. Old service not cleaned up
3. Another application using port

**Fix:**

```bash
# Stop all containers/services
docker service rm citizen-reports_citizen-reports
docker stack rm citizen-reports

# Wait 10 seconds
sleep 10

# Verify port free
netstat -tlnp | grep 4000  # Should show nothing

# Restart Docker Swarm if needed
docker swarm leave --force
docker swarm init
```

### Error 4: "No Such Container" When Running docker exec

**Symptoms:**
```bash
$ docker exec 4067cb38b16d430c07ef... ls /app
Error response from daemon: No such container: ls /app
```

**Root Cause:** PowerShell escaping issue with backticks/piping

**Fix:**

```bash
# WRONG (PowerShell):
docker exec $(docker ps -q | head -1) ls /app  # head not recognized in PowerShell

# RIGHT (PowerShell):
$CONTAINER_ID = docker ps -q | Select-Object -First 1
docker exec $CONTAINER_ID ls /app

# Or use bash via SSH:
ssh root@145.79.0.77 'docker exec $(docker ps -q | head -1) ls /app'
```

### Error 5: Image Doesn't Update After docker build

**Symptoms:**
```
docker build -t citizen-reports:latest .
# Changes app.js but container still has old version
```

**Root Causes:**
1. Volume mount shadows the image
2. Swarm cached old image layer
3. Didn't reload image on server

**Fix:**

```bash
# Step 1: Local build
docker build -t citizen-reports:latest . --no-cache
# --no-cache forces fresh layer rebuild

# Step 2: Copy changed files to host (due to volume mount shadowing)
scp "c:\PROYECTOS\citizen-reports\server\app.js" "root@145.79.0.77:/root/citizen-reports/server/app.js"

# Step 3: Transfer image to server
docker save citizen-reports:latest | ssh root@145.79.0.77 'docker load'

# Step 4: Force Swarm to redeploy
ssh root@145.79.0.77 'docker service update --force citizen-reports_citizen-reports'

# Verify container restarted
docker ps  # Should see new container with different ID
```

### Error 6: SCP Command Syntax Error in PowerShell

**Symptoms:**
```
scp -r "c:\path\*" "root@server:/path/"
# PowerShell expands * locally before sending to SSH
```

**Root Cause:** PowerShell wildcard expansion vs. SSH expectation

**Fix:**

```powershell
# Option 1: Quote the wildcard (best)
scp -r "c:\PROYECTOS\citizen-reports\client\dist\*" "root@145.79.0.77:/root/citizen-reports/server/dist/"

# Option 2: Use PowerShell syntax
scp -r "c:\PROYECTOS\citizen-reports\client\dist\." "root@145.79.0.77:/root/citizen-reports/server/dist\"

# Option 3: Use bash/WSL instead
# From WSL: scp -r c:\PROYECTOS\citizen-reports\client\dist/* root@145.79.0.77:/root/citizen-reports/server/dist/
```

### Error 7: Database WAL File Locks

**Symptoms:**
```
sqlite3: database is locked
Error: SQLITE_CANTOPEN: unable to open database file
```

**Root Cause:** Multiple processes writing to SQLite simultaneously or stale WAL lock files

**Fix:**

```bash
# Check for lock files
ssh root@145.79.0.77 'ls -la /root/citizen-reports/server/data.db*'
# Look for: data.db, data.db-shm, data.db-wal

# Remove lock files (only if container stopped)
ssh root@145.79.0.77 'rm /root/citizen-reports/server/data.db-shm /root/citizen-reports/server/data.db-wal'

# Restart container
ssh root@145.79.0.77 'docker service update --force citizen-reports_citizen-reports'

# Verify
curl -X POST http://145.79.0.77:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jantetelco.gob.mx","password":"admin123"}'
```

---

## Validation Checklist

Use this before marking deployment complete:

```bash
#!/bin/bash
# Deployment Validation Script
set -e

SERVER="root@145.79.0.77"
API_URL="http://145.79.0.77:4000"

echo "=== Citizen Reports Deployment Validation ==="

# 1. Container running
echo "[1/10] Checking container status..."
ssh $SERVER "docker ps | grep citizen-reports" > /dev/null && echo "✓ Container running" || echo "✗ Container NOT running"

# 2. Frontend accessible
echo "[2/10] Checking frontend..."
RESPONSE=$(curl -s -w "%{http_code}" $API_URL)
STATUS_CODE="${RESPONSE: -3}"
if [ "$STATUS_CODE" == "200" ]; then
  echo "✓ Frontend HTTP 200"
else
  echo "✗ Frontend returned $STATUS_CODE"
fi

# 3. Frontend is HTML (not JSON)
echo "[3/10] Checking frontend content type..."
CONTENT=$(curl -s $API_URL | head -c 50)
if [[ $CONTENT == *"<!DOCTYPE"* ]] || [[ $CONTENT == *"<html"* ]]; then
  echo "✓ Frontend returns HTML"
else
  echo "✗ Frontend returns JSON (fallback): $CONTENT"
fi

# 4. API endpoint accessible
echo "[4/10] Checking API endpoint..."
API_RESPONSE=$(curl -s -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jantetelco.gob.mx","password":"admin123"}' \
  -w "\n%{http_code}")
HTTP_CODE=$(echo "$API_RESPONSE" | tail -1)
if [ "$HTTP_CODE" == "200" ]; then
  echo "✓ Login endpoint HTTP 200"
else
  echo "✗ Login endpoint returned $HTTP_CODE"
  echo "$API_RESPONSE"
fi

# 5. Database accessible
echo "[5/10] Checking database..."
CONTAINER_ID=$(ssh $SERVER "docker ps -q | head -1")
DB_COUNT=$(ssh $SERVER "docker exec $CONTAINER_ID sqlite3 /app/server/data.db 'SELECT COUNT(*) FROM usuarios;'" 2>/dev/null || echo "0")
if [ "$DB_COUNT" -gt 0 ]; then
  echo "✓ Database has $DB_COUNT users"
else
  echo "✗ Database empty or inaccessible"
fi

# 6. Frontend files on host
echo "[6/10] Checking frontend dist on host..."
ssh $SERVER "ls /root/citizen-reports/server/dist/index.html" > /dev/null && echo "✓ Frontend dist exists" || echo "✗ Frontend dist missing"

# 7. Volume mount working
echo "[7/10] Checking volume mount..."
ssh $SERVER "test -f /app/server/data.db && echo ✓ Mount accessible" || echo "✗ Mount not accessible"

# 8. Port 4000 listening
echo "[8/10] Checking port 4000..."
ssh $SERVER "netstat -tlnp | grep 4000" > /dev/null && echo "✓ Port 4000 listening" || echo "✗ Port not listening"

# 9. No error logs
echo "[9/10] Checking error logs..."
ERRORS=$(ssh $SERVER "docker logs $CONTAINER_ID 2>&1 | grep -i 'error\|failed' | wc -l")
if [ "$ERRORS" -eq 0 ]; then
  echo "✓ No errors in logs"
else
  echo "⚠ Found $ERRORS error-like entries in logs"
fi

# 10. Service stability (running > 30 seconds)
echo "[10/10] Checking service uptime..."
UPTIME=$(ssh $SERVER "docker ps --format='{{.RunningFor}}' | grep citizen | head -1")
echo "✓ Service uptime: $UPTIME"

echo ""
echo "=== Validation Complete ==="
```

---

## Post-Deployment Verification

### Immediate Checks (0-5 minutes after deploy)

```bash
# SSH to server
ssh root@145.79.0.77

# Check service is running
docker stack ps citizen-reports
# Expected: CURRENT STATE = Running less than 1 minute

# Check logs for startup errors
docker service logs citizen-reports_citizen-reports --tail 50
# Expected: "Servidor escuchando en puerto 4000" or similar

# Test connectivity
curl -s http://localhost:4000/ | head -20
# Expected: HTML, not JSON
```

### Functional Tests (5-30 minutes after deploy)

```bash
# 1. Test login
curl -X POST http://145.79.0.77:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jantetelco.gob.mx","password":"admin123"}'
# Expected: {"token":"...", "usuario":{...}}

# 2. Test report submission
REPORT_DATA='{
  "lat":19.4326,
  "lng":-99.1332,
  "tipo":"bache",
  "descripcion":"Prueba de despliegue"
}'
curl -X POST http://145.79.0.77:4000/api/reportes \
  -H "Content-Type: application/json" \
  -d "$REPORT_DATA"
# Expected: HTTP 201 with report ID

# 3. Test report retrieval
curl http://145.79.0.77:4000/api/reportes
# Expected: JSON array of reports
```

### Performance Verification (30+ minutes after deploy)

```bash
# Monitor container resource usage
docker stats citizen-reports_citizen-reports.1

# Check database size
ls -lh /root/citizen-reports/server/data.db

# Monitor disk space
df -h /root/citizen-reports/

# Check response times
time curl http://145.79.0.77:4000/api/reportes > /dev/null
# Typical: <100ms for API responses
```

---

## Troubleshooting

### Issue: Container Crashes Immediately

```bash
# Check logs
docker service logs citizen-reports_citizen-reports --tail 100

# Common causes:
# 1. Port already in use
netstat -tlnp | grep 4000

# 2. Missing database
ls -la /root/citizen-reports/server/data.db

# 3. Missing node_modules (should be in image)
docker run --rm citizen-reports:latest ls /app/node_modules | wc -l

# Fix: Reinit database
cd /root/citizen-reports/server && npm run init

# Restart
docker service update --force citizen-reports_citizen-reports
```

### Issue: High Memory Usage

```bash
# Check current usage
docker stats citizen-reports_citizen-reports.1

# If > 500MB, likely memory leak. Check:
# 1. Recent logs for errors
docker service logs citizen-reports_citizen-reports | tail -50

# 2. Database size (SQLite memory mapped)
du -sh /root/citizen-reports/server/data.db

# 3. Node processes
docker exec $(docker ps -q | head -1) ps aux | grep node

# Fix: Restart service
docker service update --force citizen-reports_citizen-reports
```

### Issue: Database Corruption

```bash
# Verify database integrity
sqlite3 /root/citizen-reports/server/data.db "PRAGMA integrity_check;"
# Expected: ok

# If corrupted, restore from backup
cp /root/citizen-reports/backups/data.db.backup /root/citizen-reports/server/data.db

# Reinit from schema
cd /root/citizen-reports/server && npm run init
```

### Issue: Frontend Assets 404

```bash
# Check what assets exist
ls -la /root/citizen-reports/server/dist/assets/

# Check app.js serves assets correctly
grep -n "app.use.*assets" /root/citizen-reports/server/app.js

# Check response headers
curl -i http://145.79.0.77:4000/assets/main.js 2>/dev/null | head -20

# Fix: Rebuild and copy frontend
cd c:\PROYECTOS\citizen-reports\client && npm run build
scp -r "c:\PROYECTOS\citizen-reports\client\dist\*" "root@145.79.0.77:/root/citizen-reports/server/dist/"
```

---

## Disaster Recovery

### Full Service Restoration

```bash
# Step 1: Stop current service
ssh root@145.79.0.77 'docker service rm citizen-reports_citizen-reports'
sleep 5

# Step 2: Restore database from backup
ssh root@145.79.0.77 'cp /root/citizen-reports/backups/data.db.backup-latest /root/citizen-reports/server/data.db'

# Step 3: Redeploy
ssh root@145.79.0.77 'cd /root/citizen-reports && docker stack deploy -c docker-compose.prod.yml citizen-reports'

# Step 4: Verify
curl http://145.79.0.77:4000/
```

### Rollback to Previous Image

```bash
# If current image broken, use previous

# Step 1: Check image history
docker images citizen-reports

# Step 2: Tag previous working image
docker tag citizen-reports:previous citizen-reports:latest

# Step 3: Push and redeploy
docker save citizen-reports:latest | ssh root@145.79.0.77 'docker load'
ssh root@145.79.0.77 'docker service update --force citizen-reports_citizen-reports'
```

### Automated Backup Strategy

```bash
#!/bin/bash
# Daily backup script (add to crontab)

BACKUP_DIR="/root/citizen-reports/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_SOURCE="/root/citizen-reports/server/data.db"
BACKUP_FILE="$BACKUP_DIR/data.db.backup_$TIMESTAMP"

# Create backup
cp $DB_SOURCE $BACKUP_FILE

# Keep only last 7 days
find $BACKUP_DIR -name "data.db.backup_*" -mtime +7 -delete

# Verify backup
sqlite3 $BACKUP_FILE "PRAGMA integrity_check;" || echo "BACKUP FAILED" | mail -s "DB Backup Error" ops@example.com
```

---

## Deployment Checklist

Use this form before each production deployment:

```
DEPLOYMENT CHECKLIST - Citizen Reports
====================================

Prepared By: _________________    Date: ___________
Approved By: _________________    

PRE-DEPLOYMENT
[ ] Code committed and pushed to main
[ ] npm run test:all passes locally
[ ] docker build successful (--no-cache)
[ ] docker run test shows "✓ Frontend returns HTML"
[ ] No uncommitted changes locally (git status clean)
[ ] Backup of production database created

DURING DEPLOYMENT
[ ] Frontend dist/ copied to host
[ ] Backend app.js copied to host
[ ] Docker image loaded on production server
[ ] docker stack deploy executed
[ ] Container status = Running (docker ps)
[ ] HTTP 200 response from GET /

POST-DEPLOYMENT
[ ] Login endpoint works (POST /api/auth/login)
[ ] Frontend HTML loads (no JSON fallback)
[ ] Database accessible (SELECT COUNT(*) FROM usuarios)
[ ] No errors in docker service logs
[ ] Performance acceptable (curl <100ms response)
[ ] All validation checks pass

SIGN-OFF
Deployment Validated By: _______    Time: ___________
Issues Encountered: ________________________________________
Resolution Notes: _________________________________________
```

---

## Quick Reference Commands

```bash
# Deployment
docker build -t citizen-reports:latest . --no-cache
docker save citizen-reports:latest | ssh root@145.79.0.77 'docker load'
ssh root@145.79.0.77 'cd /root/citizen-reports && docker stack deploy -c docker-compose.prod.yml citizen-reports'

# Verification
curl http://145.79.0.77:4000/
docker ps
docker service logs citizen-reports_citizen-reports --tail 50

# Updates
scp "c:\PROYECTOS\citizen-reports\server\app.js" "root@145.79.0.77:/root/citizen-reports/server/app.js"
ssh root@145.79.0.77 'docker service update --force citizen-reports_citizen-reports'

# Database
ssh root@145.79.0.77 'cd /root/citizen-reports/server && npm run init'
ssh root@145.79.0.77 'sqlite3 /root/citizen-reports/server/data.db ".tables"'

# Debugging
ssh root@145.79.0.77 'docker exec $(docker ps -q | head -1) cat /app/server/app.js | grep distPath'
ssh root@145.79.0.77 'ls -la /root/citizen-reports/server/dist/'
```

---

## Support & Escalation

**Issues:** Contact DevOps team  
**Critical Outage:** Escalate to SRE on-call  
**Database Issues:** See disaster-recovery section  
**Performance Issues:** Check logs → Check disk space → Restart service

---

**Document Version:** 1.0  
**Last Modified:** November 23, 2025  
**Status:** APPROVED FOR PRODUCTION
