# Operaciones - Citizen Reports Production
**VPS:** 145.79.0.77  
**App URL:** https://reportes.progressiagroup.com  
**Container:** citizen-reports-app  
**Port:** 4000

---

## 🆘 Emergency Procedures

### Application Down - Quick Fix
```bash
# Step 1: SSH into VPS
ssh root@145.79.0.77

# Step 2: Check container status
docker ps | grep citizen-reports

# Step 3: If not running, start it
docker compose -f /root/citizen-reports/docker-compose.yml up -d

# Step 4: Wait 10 seconds and verify
sleep 10
curl -I https://reportes.progressiagroup.com/

# Step 5: Check logs if not working
docker logs citizen-reports-app | tail -50
```

### Full Restart Procedure
```bash
# Step 1: Stop everything
cd /root/citizen-reports
docker compose down

# Step 2: Wait
sleep 5

# Step 3: Start fresh
docker compose up -d

# Step 4: Monitor startup
docker logs -f citizen-reports-app

# Expect: "✅ Servidor production en http://0.0.0.0:4000"

# Step 5: Test
curl -I https://reportes.progressiagroup.com/
# Expect: HTTP/2 200
```

### Database Corruption Recovery
```bash
# Step 1: Backup corrupted database
docker exec citizen-reports-app cp /app/server/data.db /app/server/data.db.corrupted

# Step 2: Remove corrupted database
docker exec citizen-reports-app rm /app/server/data.db

# Step 3: Restart container (triggers reinitialization)
docker restart citizen-reports-app

# Step 4: Verify
docker exec citizen-reports-app [ -f /app/server/data.db ] && echo "DB recovered"

# Step 5: Reinitialize schema if needed
docker exec citizen-reports-app npm run init
```

### SSL Certificate Renewal (Manual)
```bash
# Step 1: Backup current certificate
ssh root@145.79.0.77 "cp /etc/easypanel/traefik/acme.json /etc/easypanel/traefik/acme.json.backup.$(date +%s)"

# Step 2: Remove to force renewal
ssh root@145.79.0.77 "rm /etc/easypanel/traefik/acme.json"

# Step 3: Restart Traefik
ssh root@145.79.0.77 "docker service update --force traefik"

# Step 4: Wait for renewal
sleep 60

# Step 5: Verify
ssh root@145.79.0.77 "openssl s_client -connect reportes.progressiagroup.com:443 -showcerts 2>/dev/null | grep 'CN ='"
# Expect: CN = reportes.progressiagroup.com
```

---

## 📋 Daily Maintenance Checklist

### Every Day (5 minutes)
```bash
# ✅ Is application accessible?
curl -s https://reportes.progressiagroup.com/api/dependencias | jq length

# Expected: 8 (number of departments)
# If fails, run "Application Down - Quick Fix"
```

### Every Week (15 minutes)
```bash
# ✅ Check container status
docker ps | grep citizen

# ✅ Check recent errors in logs
docker logs --since 7d citizen-reports-app | grep -i error | wc -l

# ✅ Verify SSL certificate expiry
curl -vI https://reportes.progressiagroup.com 2>&1 | grep notAfter

# ✅ Backup database
docker exec citizen-reports-app cp /app/server/data.db /app/server/backups/data-$(date +%Y%m%d).db
```

### Every Month (30 minutes)
```bash
# ✅ Full system health check
ssh root@145.79.0.77 << 'EOF'

echo "=== CONTAINER STATUS ==="
docker ps | grep citizen-reports

echo ""
echo "=== DISK USAGE ==="
df -h | grep -E "Filesystem|/$"

echo ""
echo "=== LOG SIZE ==="
du -sh /var/lib/docker/containers/*/

echo ""
echo "=== CERTIFICATE VALIDITY ==="
openssl s_client -connect reportes.progressiagroup.com:443 2>/dev/null | \
  grep -E "notBefore=|notAfter="

echo ""
echo "=== API RESPONSE TIME ==="
time curl -s https://reportes.progressiagroup.com/api/dependencias > /dev/null

echo ""
echo "=== DATABASE SIZE ==="
docker exec citizen-reports-app ls -lh /app/server/data.db

EOF
```

---

## 🔐 Security Checklist

### Initial Setup ✅
- [x] CORS whitelist includes only necessary domains
- [x] SSL/TLS certificate valid and auto-renewing
- [x] Database credentials not exposed in logs
- [x] Container running with minimal privileges

### Ongoing Monitoring
```bash
# Check for unauthorized access patterns
docker logs citizen-reports-app 2>&1 | grep -i "401\|403\|unauthorized" | wc -l

# Monitor failed CORS attempts
docker logs citizen-reports-app 2>&1 | grep "Not allowed by CORS" | wc -l

# If high numbers: update CORS whitelist

# Check for SQL injection attempts
docker logs citizen-reports-app 2>&1 | grep -i "sql\|injection" | wc -l
```

### Certificate Expiry Monitoring
```bash
# Add to crontab (runs daily at 9 AM)
0 9 * * * /usr/local/bin/check-cert.sh

# Content of /usr/local/bin/check-cert.sh:
#!/bin/bash
EXPIRY=$(openssl s_client -connect reportes.progressiagroup.com:443 2>/dev/null | \
         grep notAfter | cut -d= -f2)
DAYS=$(echo $EXPIRY | awk '{print $1}')
echo "Certificate expires: $DAYS" | logger -t citizen-reports
```

---

## 📊 Monitoring Dashboard Commands

### Real-time Container Monitoring
```bash
# Live stats (CPU, memory, network)
watch -n 2 'docker stats citizen-reports-app --no-stream'

# Process inside container
docker top citizen-reports-app

# Network connections
docker exec citizen-reports-app netstat -tulpn | grep 4000
```

### Application Health
```bash
# Check if API responds
check_api() {
  response=$(curl -s https://reportes.progressiagroup.com/api/dependencias)
  count=$(echo $response | jq length)
  if [ $count -gt 0 ]; then
    echo "✅ API OK - $count departments"
  else
    echo "❌ API FAILED"
  fi
}

check_api

# Check response time
measure_latency() {
  time curl -s https://reportes.progressiagroup.com/api/dependencias > /dev/null
}

measure_latency
```

### Database Health
```bash
# Database integrity check
docker exec citizen-reports-app sqlite3 /app/server/data.db "PRAGMA integrity_check;"

# Database statistics
docker exec citizen-reports-app sqlite3 /app/server/data.db << 'EOF'
SELECT name, COUNT(*) as count FROM sqlite_master WHERE type='table' GROUP BY name;
SELECT COUNT(*) as total_reports FROM reportes;
SELECT COUNT(*) as total_users FROM usuarios;
EOF
```

---

## 🚀 Deployment & Updates

### Deploy Code Changes
```bash
# Step 1: Verify changes locally
cd ~/citizen-reports
git log -1 --oneline

# Step 2: Push to GitHub
git push origin main

# Step 3: SSH to VPS
ssh root@145.79.0.77

# Step 4: Pull latest code
cd /root/citizen-reports
git pull origin main

# Step 5: Rebuild frontend if needed
npm run build

# Step 6: Rebuild Docker image
docker compose down
docker compose build --no-cache
docker compose up -d

# Step 7: Wait and verify
sleep 10
curl -I https://reportes.progressiagroup.com/
```

### Zero-Downtime Update (if database unchanged)
```bash
# Method: Use two ports with fallback

# 1. Start second container on port 4001
docker run -d \
  --name citizen-reports-app-v2 \
  -p 0.0.0.0:4001:4000 \
  --mount type=volume,source=db_volume,target=/app/server \
  citizen-reports:latest

# 2. Test new container
sleep 5
curl -I http://localhost:4001/api/dependencias

# 3. Update Traefik to use new container (if tests pass)
# Edit /etc/easypanel/traefik/config/main.yaml to point to :4001

# 4. Delete old container
docker stop citizen-reports-app
docker rm citizen-reports-app
docker rename citizen-reports-app-v2 citizen-reports-app

# 5. Restart on correct port
docker run -d \
  --name citizen-reports-app \
  -p 0.0.0.0:4000:4000 \
  --mount type=volume,source=db_volume,target=/app/server \
  citizen-reports:latest
```

---

## 📂 Backup & Recovery

### Automated Daily Backup
```bash
# Add to crontab (runs at 2 AM daily)
0 2 * * * /usr/local/bin/backup-db.sh

# Content of /usr/local/bin/backup-db.sh:
#!/bin/bash
BACKUP_DIR=/root/citizen-reports/backups
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker exec citizen-reports-app cp /app/server/data.db $BACKUP_DIR/data-$TIMESTAMP.db
# Keep only last 30 backups
ls -t $BACKUP_DIR/data-*.db | tail -n +31 | xargs rm -f
```

### Manual Backup
```bash
# One-time backup
docker exec citizen-reports-app cp /app/server/data.db /app/server/data-backup-$(date +%s).db

# List backups
docker exec citizen-reports-app ls -lh /app/server/data*.db

# Download backup to local
scp root@145.79.0.77:/root/citizen-reports/server/data-backup-*.db ~/backups/
```

### Restore from Backup
```bash
# Step 1: Stop container
docker stop citizen-reports-app

# Step 2: Copy backup to correct location
docker exec citizen-reports-app cp /app/server/data-backup-TIMESTAMP.db /app/server/data.db

# Step 3: Restart
docker start citizen-reports-app

# Step 4: Verify
sleep 5
curl -I https://reportes.progressiagroup.com/

# Step 5: Check data
docker exec citizen-reports-app sqlite3 /app/server/data.db "SELECT COUNT(*) FROM reportes;"
```

---

## 🔍 Debugging & Troubleshooting

### Enable Debug Logging
```bash
# Set environment variable for verbose logging
docker exec citizen-reports-app NODE_DEBUG=express,cors npm start

# Or rebuild with debug flag
cd /root/citizen-reports
NODE_ENV=production npm run build
docker compose build
docker compose up -d
```

### Analyze Logs
```bash
# Last 100 lines
docker logs --tail 100 citizen-reports-app

# Follow in real-time
docker logs -f citizen-reports-app

# Last hour
docker logs --since 1h citizen-reports-app

# Search for errors
docker logs citizen-reports-app 2>&1 | grep -i error

# Count errors
docker logs citizen-reports-app 2>&1 | grep -ic error

# Show requests to specific path
docker logs citizen-reports-app 2>&1 | grep "/api/dependencias"
```

### Network Debugging
```bash
# Check if container can reach internet
docker exec citizen-reports-app curl -I https://google.com

# Check DNS resolution
docker exec citizen-reports-app nslookup reportes.progressiagroup.com

# Check port binding
docker exec citizen-reports-app netstat -tulpn

# Check network interfaces
docker exec citizen-reports-app ifconfig
```

### Performance Debugging
```bash
# Memory leak check (run hourly)
watch -n 3600 'docker stats citizen-reports-app --no-stream'

# If memory keeps growing:
docker restart citizen-reports-app

# Check for hanging connections
docker exec citizen-reports-app lsof -i -P -n | grep citizen
```

---

## 📞 Contact & Escalation

### If Something Breaks
1. **Check logs:** `docker logs citizen-reports-app`
2. **Restart container:** `docker restart citizen-reports-app`
3. **Check DNS:** `nslookup reportes.progressiagroup.com 8.8.8.8`
4. **Check certificate:** `curl -vI https://reportes.progressiagroup.com`
5. **Full reset:** See "Full Restart Procedure" above
6. **Restore from backup:** See "Restore from Backup" above

### Common Issues & Solutions

**Application returns 503:**
```bash
# Container not responding
docker restart citizen-reports-app
sleep 10
curl -I https://reportes.progressiagroup.com/
```

**DNS doesn't resolve:**
```bash
# Check nameservers
nslookup -type=NS reportes.progressiagroup.com

# If using wrong NS, update in Hostgator dashboard
# ns104.hostgator.mx, ns105.hostgator.mx
```

**API returns 500:**
```bash
# Check database
docker exec citizen-reports-app sqlite3 /app/server/data.db ".tables"

# Reinitialize if missing tables
docker exec citizen-reports-app npm run init

# Or restore backup
# (See "Restore from Backup" above)
```

**Certificate expired:**
```bash
# Check expiry
openssl s_client -connect reportes.progressiagroup.com:443 2>/dev/null | grep notAfter

# If expired, renew manually:
rm /etc/easypanel/traefik/acme.json
docker service update --force traefik
sleep 60
curl -vI https://reportes.progressiagroup.com/
```

---

## 📝 Change Log

| Date | Change | Status |
|------|--------|--------|
| 2025-11-11 | Production deployment | ✅ LIVE |
| 2025-11-10 | CORS configuration | ✅ DONE |
| 2025-11-09 | Docker setup | ✅ DONE |
| 2025-11-08 | SSL certificate renewal | ✅ DONE |
| 2025-11-07 | DNS configuration | ✅ DONE |

---

## 🎯 Operations Contacts

**Primary Contact:** [Your Team]  
**Escalation:** [Your Manager]  
**Emergency:** [24/7 Support]  
**Backup Location:** [Backup Storage URL]

---

Last Updated: November 11, 2025  
Next Review: December 11, 2025
