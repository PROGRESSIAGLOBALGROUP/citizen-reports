# Deployment Certificate Renewal - 2025-11-10

**Status**: 🔴 IN PROGRESS - Routing Configuration Issue

**Timeline**:
- Nov 10 18:00 UTC: DNS nameservers changed from Cloudflare to Hostgator
- Nov 10 18:30 UTC: DNS propagated (nslookup confirms 145.79.0.77)
- Nov 10 20:17 UTC: acme.json renewed (Let's Encrypt cert for reportes.progressiagroup.com generated)
- Nov 10 20:30+ UTC: Traefik routing configuration debugging

---

## ✅ Completed Steps

### 1. DNS Configuration
- **Before**: Hostgator nameservers → Cloudflare (OLD account, inaccessible)
- **After**: Hostgator nameservers → ns104/105.hostgator.mx
- **Validation**: `nslookup reportes.progressiagroup.com 8.8.8.8` → **145.79.0.77** ✅

### 2. Certificate Renewal
- **Removed**: `/etc/easypanel/traefik/acme.json`
- **Action**: `docker service update --force traefik`
- **Result**: New cert generated with Subject CN=reportes.progressiagroup.com ✅
- **Verification**: 
  ```bash
  openssl s_client -connect reportes.progressiagroup.com:443 -showcerts 2>/dev/null </dev/null | \
  openssl x509 -noout -text | grep "Subject:\|DNS:"
  → Subject: CN = reportes.progressiagroup.com
  → DNS:reportes.progressiagroup.com
  ```

### 3. Application Health
- **Container**: `citizen-reports-app` running ✅
- **Direct Access**: `curl http://localhost:4000/` → HTML 200 ✅
- **API**: `curl http://localhost:4000/api/dependencias` → JSON array ✅
- **Network**: Container in `easypanel` overlay network (IP: 10.11.0.106) ✅

---

## 🔴 Current Issue: Traefik Routing Not Working

**Symptom**: `curl https://reportes.progressiagroup.com/` → HTTP 404 (serving Easypanel error page)

**Root Cause Analysis**:
1. ✅ Traefik has correct cert for reportes.progressiagroup.com
2. ✅ Docker Compose labels specify routing rules
3. ✅ citizen-reports container has labels applied
4. ❌ **Traefik NOT routing to citizen-reports** - still returning 404

**Investigation Findings**:
- main.yaml has `http-error-page` router with **priority 1** (matches all hosts with HostRegexp)
- Docker provider typically has **implicit priority 0**
- Even with explicit `priority: 100` in docker-compose labels, routing fails
- Docker overlay IP (`10.11.0.106:4000`) → Connection timeout (not accessible from Traefik task)
- Need to use `localhost:4000` or `145.79.0.77:4000` as backend

**Architecture Problem**:
- Traefik is Docker Swarm service (cannot directly reach Docker Compose overlay IPs)
- Docker Compose container not fully integrated with Swarm labels detection
- File-based configuration (`main.yaml`) + Docker provider may have priority conflicts

---

##Attempted Solutions

### Solution 1: Add priority labels to docker-compose.yml
- **Result**: Failed - Docker Compose not integrated with Swarm label detection

### Solution 2: Create static Traefik config file (citizen-reports.yaml)
- **File**: `/etc/easypanel/traefik/config/citizen-reports.yaml`
- **Config**: Router with priority 1000, service pointing to `10.11.0.106:4000`
- **Result**: Failed - Overlay IP not reachable from Traefik task

### Solution 3: Use host IP as backend
- **Config**: Changed to `http://145.79.0.77:4000`
- **Result**: Still 404 - Suggests main.yaml error-page routing taking precedence

---

## 🎯 Next Steps (RECOMMENDED)

### Option A: Edit main.yaml to Add Explicit citizen-reports Route (FASTEST)
1. Modify `/etc/easypanel/traefik/config/main.yaml`
2. Add citizen-reports router in `http.routers` section with **priority 50** (higher than error-page's 1)
3. Service backend: `http://145.79.0.77:4000` or create service definition
4. Rule: `Host('reportes.progressiagroup.com')`
5. Restart: `docker service update --force traefik`
6. Test: `curl https://reportes.progressiagroup.com/`

### Option B: Convert to Docker Swarm Service
1. Move docker-compose.yml definition to Swarm service declaration
2. Removes integration issues between Compose and Swarm
3. Traefik labels will work natively

### Option C: Use Docker Network Alias
1. Modify citizen-reports service to use host network mode
2. Simplifies routing

---

## Rollback Plan

**If changes cause issues**:

```bash
# Restore previous acme.json (has default Easypanel cert)
cp /root/backups/acme.json.latest.bak /etc/easypanel/traefik/acme.json

# Restart Traefik
docker service update --force traefik

# Verify Easypanel still works
curl https://145.79.0.77/
```

**If routing config breaks Easypanel**:
```bash
# Restore original main.yaml (git or backup)
cp /etc/easypanel/traefik/config/main.yaml.bak /etc/easypanel/traefik/config/main.yaml

# Restart Traefik
docker service update --force traefik
```

---

## Files Involved

```
/etc/easypanel/traefik/config/main.yaml              # Main routing config
/etc/easypanel/traefik/config/citizen-reports.yaml  # Additional config (not working yet)
/etc/easypanel/traefik/acme.json                    # SSL certificates
/root/citizen-reports/docker-compose.yml            # App definition with Traefik labels
/root/citizen-reports/Dockerfile                    # App image
/root/citizen-reports/server/data.db                # SQLite database
```

---

## Backup Status

```
/root/backups/acme.json.pre-renewal-20251110_201802.bak   ← Before renewal
/root/backups/acme.json.latest.bak                         ← Current backup
```

---

## Relevant Commands

```bash
# Check certificate
openssl s_client -connect reportes.progressiagroup.com:443 -showcerts 2>/dev/null </dev/null | \
  openssl x509 -noout -text | grep "Subject\|DNS"

# Test app directly
curl http://145.79.0.77:4000/

# View Traefik logs
docker service logs traefik 2>&1 | grep -i error

# Restart Traefik safely
docker service update --force traefik

# Check routing config
cat /etc/easypanel/traefik/config/main.yaml | grep -A 10 "routers:"
```

---

**Created**: Nov 10, 2025 20:30 UTC
**Last Updated**: Nov 10, 2025 20:45 UTC
**Owner**: GitHub Copilot (Agent)
**Status**: Awaiting Option A implementation or user input
