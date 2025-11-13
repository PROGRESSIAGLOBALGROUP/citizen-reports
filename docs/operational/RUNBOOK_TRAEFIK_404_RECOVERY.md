# RUNBOOK: Traefik 404 Recovery - citizen-reports

**Emergency Response Guide for: "GET / returns 404 Not Found"**

---

## Quick Diagnosis (2 minutes)

### Step 1: Is the API responding?

```bash
ssh root@145.79.0.77
curl -s http://localhost:4000/api/health
```

**Expected:** `{"status":"OK","timestamp":"2025-11-12T...Z"}`

- ✅ YES → Problem is Traefik routing, go to **Step 2**
- ❌ NO → App crashed, go to **Step 5 (App Restart)**

### Step 2: Is Traefik running?

```bash
docker ps | grep traefik
docker logs <traefik-container-id> | tail -20
```

**Expected:** Container UP, no ERROR messages

- ✅ YES → Traefik is healthy, go to **Step 3**
- ❌ NO → Restart Traefik, go to **Step 6 (Traefik Restart)**

### Step 3: Does Traefik see citizen-reports route?

```bash
curl -s http://localhost:8080/api/http/routers | jq '.[] | select(.name | contains("citizen"))'
```

**Expected:** Router named `zzz-citizen-reports-https` with priority=999999

- ✅ YES → Route visible, check file → go to **Step 4**
- ❌ NO → File provider config missing → go to **Step 7 (File Provider Fix)**

### Step 4: Can you reach the app through Traefik?

```bash
curl -s -k https://localhost:443/api/health  # Local test through Traefik
curl -s https://reportes.progressiagroup.com/api/health  # External test
```

**Expected:** `{"status":"OK"...}`

- ✅ YES → **INCIDENT RESOLVED** - test app in browser
- ❌ NO → Permission/TLS issue → go to **Step 8 (TLS Check)**

---

## Root Causes (Choose Your Path)

### 5️⃣ Step 5: App is Crashed (No localhost:4000 response)

```bash
# Check container
docker ps --filter name=citizen-reports --format "table {{.Names}}\t{{.Status}}"
docker logs citizen-reports-app | tail -50

# If not running:
cd /root/citizen-reports
docker compose up -d

# Wait 5 seconds, then test
sleep 5
curl -s http://localhost:4000/api/health
```

**Success criteria:** API responds with 200 OK

---

### 6️⃣ Step 6: Traefik is Crashed (No localhost:8080)

```bash
# Check container
docker ps | grep traefik
docker logs <traefik-id> | tail -50

# If crashed, check Swarm service
docker service ps traefik

# Force restart
docker service update --force traefik

# Wait for recovery
watch docker service ps traefik  # Press Ctrl+C when "Running"
```

**Success criteria:** `docker ps | grep traefik` shows container UP

---

### 7️⃣ Step 7: File Provider Config Missing/Corrupt

```bash
# Check if file exists and is readable
ls -la /etc/easypanel/traefik/config/citizen-reports.yml
cat /etc/easypanel/traefik/config/citizen-reports.yml

# If missing or corrupted, recreate it:
cat > /etc/easypanel/traefik/config/citizen-reports.yml << 'EOF'
# CITIZEN-REPORTS: Override route with MAXIMUM priority
http:
  routers:
    zzz-citizen-reports-https:
      rule: "Host(`reportes.progressiagroup.com`)"
      entrypoints:
        - https
      service: citizen-reports
      priority: 999999
      tls:
        certResolver: letsencrypt
    zzz-citizen-reports-http:
      rule: "Host(`reportes.progressiagroup.com`)"
      entrypoints:
        - http
      service: citizen-reports
      priority: 999999
      middlewares:
        - redirect-https

  services:
    citizen-reports:
      loadBalancer:
        servers:
          - url: "http://citizen-reports-app:4000"

  middlewares:
    redirect-https:
      redirectscheme:
        scheme: https
EOF

# Verify Traefik picks up changes (usually within 1 second)
sleep 2
curl -s http://localhost:8080/api/http/routers | jq '.[] | select(.name | contains("citizen"))'
```

**Success criteria:** File exists, is valid YAML, Traefik sees the route

---

### 8️⃣ Step 8: TLS Certificate Issue

```bash
# Check certificates
docker exec <traefik-id> traefik list --config /etc/traefik/traefik.yml | grep cert

# Check certificate expiry
curl -v https://reportes.progressiagroup.com 2>&1 | grep -i "subject\|expires"

# If expired, trigger renewal
docker exec <traefik-id> acme.json check  # Not standard command

# If stuck, nuclear option - restart Traefik
docker service update --force traefik

# Wait 30 seconds for Let's Encrypt renewal
sleep 30
curl -s https://reportes.progressiagroup.com/api/health
```

**Success criteria:** HTTPS responds with valid certificate

---

## Full Recovery Procedure (If All Else Fails)

### Nuclear Option: Complete Service Restart

```bash
cd /root/citizen-reports

# 1. Stop everything
docker compose down
docker service update --force traefik  # Restart traefik service

# 2. Verify Traefik is up (wait up to 60 seconds)
for i in {1..12}; do
  echo "Check $i/12..."
  curl -s http://localhost:8080/ping && break
  sleep 5
done

# 3. Rebuild and restart app
docker compose build
docker compose up -d

# 4. Wait for app startup (15 seconds)
sleep 15

# 5. Verify
curl -s http://localhost:4000/api/health
curl -s https://reportes.progressiagroup.com/api/health

# 6. Test in browser
echo "Visit: https://reportes.progressiagroup.com/"
```

**Total recovery time:** ~2 minutes

---

## Validation Checklist

After following any of the above steps, verify all these:

- [ ] `curl -s https://reportes.progressiagroup.com/api/health` → 200 OK
- [ ] `curl -s https://reportes.progressiagroup.com/` → 200 OK, HTML content
- [ ] Browser: https://reportes.progressiagroup.com/ loads without 404s
- [ ] Browser DevTools → No console errors in Network tab
- [ ] Admin panel: https://reportes.progressiagroup.com/#admin loads
- [ ] Heatmap: https://reportes.progressiagroup.com/# renders
- [ ] Docker container `citizen-reports-app` is UP
- [ ] Traefik service is UP
- [ ] File `/etc/easypanel/traefik/config/citizen-reports.yml` exists

**All green?** → ✅ **INCIDENT RESOLVED**

---

## Prevention (For Future)

### Monitoring to Add

```bash
# Add to crontab (run every 5 minutes):
curl -s https://reportes.progressiagroup.com/api/health || \
  echo "ALERT: citizen-reports health check failed" | \
  mail -s "CRITICAL: Production Down" ops@progressiagroup.com
```

### Documentation to Update

After ANY incident, update:
- This runbook (add new discovered causes)
- ADR-0011 (if architecture changed)
- INCIDENT_RECOVERY_*.md (add timestamp + resolution)
- CHANGELOG.md (brief entry)

### Escalation Path

| Time Elapsed | Action | Contact |
|--------------|--------|---------|
| 0-5 min | Follow runbook steps | On-call engineer |
| 5-15 min | Still down? Escalate | Tech Lead |
| 15+ min | Major incident | CTO |

---

## Related Documents

- [ADR-0011: Traefik Production Routing](../adr/ADR-0011-TRAEFIK_PRODUCTION_ROUTING.md)
- [Incident Report: INC-TRAEFIK-ROUTING-404](../INCIDENT_RECOVERY_2025-11-12.md)
- [Production Deployment](../deployment/DEPLOYMENT_PROCESS.md)
- [Emergency Runbook](../EMERGENCY_RUNBOOK.md)

---

## Quick Commands Reference

```bash
# Check everything
ssh root@145.79.0.77 && {
  echo "=== API Health ===" && \
  curl -s http://localhost:4000/api/health && \
  echo "\n=== Traefik Routers ===" && \
  curl -s http://localhost:8080/api/http/routers | jq '.[] | {name: .name, priority: .priority}' && \
  echo "\n=== Containers ===" && \
  docker ps --filter "name=citizen\|traefik" --format "table {{.Names}}\t{{.Status}}"
}
```

Copy-paste the above command to get instant status dashboard.

---

**Last Updated:** 2025-11-12  
**Status:** ACTIVE  
**Reviewed By:** Incident Response Team
