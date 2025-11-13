# ADR-0011: Traefik Production Routing Architecture

**Status:** ACCEPTED  
**Date:** 2025-11-12  
**Deciders:** PROGRESSIA Global Group (Post-incident resolution)  
**Related Incident:** INC-TRAEFIK-ROUTING-404 (2025-11-12 00:52 UTC)

---

## Context

The Jantetelco Heatmap Platform runs on a single Ubuntu VPS (145.79.0.77) with a complex microservices architecture:

- **Reverse Proxy:** Traefik 3.3.7 (primary ingress for all services)
- **Orchestration:** Docker Swarm (easypanel, n8n, ollama, crm_suitecrm, evolution-api, invoice-ninja, etc.)
- **Citizen-Reports App:** Originally deployed as Docker Swarm service, then migrated to docker-compose (due to build complexity)

This architectural mismatch between the app (docker-compose) and Traefik's routing configuration (Swarm-only providers) created a critical vulnerability.

### The Problem

**Incident Timeline:**
- **2025-11-12 00:52 UTC:** Production went dark (404 errors on https://reportes.progressiagroup.com)
- **2025-11-12 01:00 UTC:** Server diagnostics: API responding on localhost:4000, but Traefik returning 404
- **Root Cause:** Traefik priority conflict
  - Easypanel error-page router: priority=1 (matches ALL 404s)
  - Citizen-reports router: priority=0 (lower = less specific)
  - Result: All requests matched error-page first, never reached citizen-reports

**Why It Happened:**
1. Citizen-reports deployed as docker-compose (not Swarm service)
2. Docker-compose labels added to docker-compose.yml for Traefik routing
3. Traefik's docker provider ONLY reads Swarm labels, ignores docker-compose labels
4. Routes from docker-compose labels were invisible to Traefik
5. Error-page service (priority=1) became default router
6. Recovery attempts failed because:
   - Increasing priority in docker-compose.yml had no effect (labels invisible)
   - Traefik file provider required correct mount path (/etc/easypanel/traefik/config/)
   - Swarm deployment converted app labels to file provider format incorrectly

---

## Decision

**Adopt a hybrid routing strategy:**

1. **Primary (Stable):** Traefik File Provider for citizen-reports routing
   - Location: `/etc/easypanel/traefik/config/citizen-reports.yml`
   - Priority: 999999 (ultra-high, overrides all other routers)
   - Watch: true (auto-reload on file changes)

2. **Secondary (Legacy Compatibility):** Docker-compose still allowed
   - Labels kept in docker-compose.yml for developer convenience
   - Labels will be IGNORED by Traefik (documented)
   - Real source of truth: File provider ONLY

3. **Monitoring:** Add health check dashboard
   - Verify Traefik seeing citizen-reports route
   - Alert on route disappearance

---

## Rationale

### Why File Provider?

✅ **Advantages:**
- Explicit control: Decouples app deployment from routing rules
- Priority visible: No more priority conflicts (999999 is unmissable)
- Reliable: Not dependent on docker provider reading Swarm labels
- Hot-reload: Changes apply without Traefik restart
- Debuggable: Single source of truth (not scattered in compose files)

❌ **Why NOT Docker provider alone?**
- Docker provider reads Swarm service labels only
- docker-compose labels are invisible to Traefik
- Priority conflicts with Swarm services (Easypanel, etc.)
- No explicit control over routing order

❌ **Why NOT pure docker-compose labels?**
- Labels must be on running containers for provider to see them
- Requires Traefik docker provider running on host
- Still subject to priority conflicts with Swarm services
- No way to guarantee routing precedence

### Why Priority=999999?

- Traefik routes are matched by priority (highest first)
- Easypanel error-page uses priority=1
- Setting citizen-reports to 999999 guarantees it matches before error-page
- Buffer against future additions: room for priorities up to 1,000,000

---

## Implementation

### File: `/etc/easypanel/traefik/config/citizen-reports.yml`

```yaml
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
```

### Steps to Deploy

1. **SSH to production server:**
   ```bash
   ssh root@145.79.0.77
   ```

2. **Create file provider config:**
   ```bash
   cat > /etc/easypanel/traefik/config/citizen-reports.yml << 'EOF'
   [paste YAML above]
   EOF
   ```

3. **Verify Traefik sees it:**
   ```bash
   docker exec <traefik-container> traefik version  # Confirm Traefik running
   curl -s http://localhost:8080/api/http/routers | jq '.[] | select(.name | contains("citizen"))'
   ```

4. **Test routing:**
   ```bash
   curl -s https://reportes.progressiagroup.com/api/health
   ```

---

## Consequences

### Positive

✅ **Resilience:** File provider never affected by Swarm label conflicts  
✅ **Clarity:** Routes explicitly defined, not hidden in compose files  
✅ **Speed:** Hot-reload means no service restarts for routing changes  
✅ **Debuggability:** Single source of truth for Traefik routing  
✅ **Future-proof:** Can coexist with future Swarm deployments

### Negative

⚠️ **Operational Burden:** File provider requires manual creation/updates (not auto-generated)  
⚠️ **Split Brain Risk:** docker-compose labels might confuse future developers (mitigated by docs)  
⚠️ **No IaC for routing:** File provider config lives outside git (must be managed separately)

### Mitigations

- **Split Brain:** Document in README + code comments that docker-compose labels are IGNORED
- **Operational Burden:** Create runbook for quick deployment
- **IaC:** Store YAML in git as reference, managed via `deploy.sh` script
- **Monitoring:** Add health checks to alert on routing failures

---

## Related Decisions

- **ADR-0001:** Bootstrap architecture (original Traefik + Swarm setup)
- **ADR-0009:** Database-driven types (independent of routing, but related to API availability)
- **INC-TRAEFIK-ROUTING-404:** Production incident that triggered this ADR

---

## Alternatives Considered

### 1. Migrate citizen-reports back to Swarm service

**Rejected because:**
- Requires full rebuild infrastructure (Swarm stack compose file)
- Docker build in Swarm context is fragile
- No benefit over file provider (still Swarm labels)
- Risk of reintroducing priority conflicts

### 2. Use Traefik external service discovery (Consul/Etcd)

**Rejected because:**
- Overkill for single-app routing
- Adds external dependency (Consul not running on VPS)
- Complexity not justified for 1 VPS

### 3. Use Nginx instead of Traefik for citizen-reports only

**Rejected because:**
- Defeats purpose of unified reverse proxy
- Creates fragmentation (Traefik + Nginx coexisting)
- Doesn't solve underlying architecture problem

### 4. Run citizen-reports on host directly (not containerized)

**Rejected because:**
- Loses containerization benefits (isolation, reproducibility)
- Makes deployment harder (no docker-compose)
- Increases VPS maintenance burden

---

## Validation Criteria

- ✅ `curl https://reportes.progressiagroup.com/api/health` returns 200 OK
- ✅ Traefik dashboard shows citizen-reports router with priority=999999
- ✅ No 404 errors on public-facing URLs
- ✅ Admin panel loads without console errors
- ✅ Heatmap renders correctly
- ✅ File provider config survives Traefik restart
- ✅ All tests pass: `npm run test:all`

---

## Review History

| Date | Reviewer | Status | Comments |
|------|----------|--------|----------|
| 2025-11-12 | Incident Response | ACCEPTED | Post-incident emergency decision |
| - | Architecture Review | PENDING | Formal review pending |

---

## References

- [Traefik File Provider Docs](https://doc.traefik.io/traefik/providers/file/)
- [Traefik Router Priority](https://doc.traefik.io/traefik/routing/routers/#priority)
- [Incident Report: INC-TRAEFIK-ROUTING-404](../INCIDENT_RECOVERY_2025-11-12.md)
- [Production Deployment Guide](../deployment/DEPLOYMENT_PROCESS.md)
