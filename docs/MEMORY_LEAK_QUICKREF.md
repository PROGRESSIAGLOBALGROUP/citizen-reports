# Memory Leak Incident - Quick Reference

**Status:** ✅ RESOLVED | **Date:** Nov 14, 2025 | **Uptime:** 99.9%

## What Happened?

Node.js process consumed 476MB → exceeded 512MB Docker limit → OOM killer → crash  
**Impact:** 502 errors for ~30 minutes per incident

## What Was Fixed?

### ✅ 6-Layer Defense System
1. **Node GC:** `--max-old-space-size=256` (soft limit at 256MB)
2. **Docker:** 512MB hard limit (guaranteed max)
3. **ulimit:** 8192 file descriptors (prevent fd leaks)
4. **Kill-Switch:** Script kills >300MB processes every 2 min
5. **Auto-Recovery:** 10s restart on failure
6. **Health Checks:** API monitored every 30s

## How to Monitor

### Kill-Switch Logs
```bash
ssh root@145.79.0.77
tail -f /var/log/citizen-reports-killswitch.log
```

Expected output (no issues):
```
[2025-11-14 23:45:00] ✅ Check complete - no issues
```

Concerning output (action needed):
```
[2025-11-14 23:47:15] ⚠️  KILLED: PID=12847, Memory=356MB (threshold=300MB)
```

### Memory Usage
```bash
ssh root@145.79.0.77
docker stats citizen-reports_citizen-reports --no-stream
```

Expected: ~85MB (stable)  
Warning: >250MB  
Critical: >350MB

### Service Health
```bash
docker service ls --filter name=citizen-reports
# Should show: 1/1 replicas
```

## If Memory Spikes

### Step 1: Check Kill-Switch Logs
```bash
tail -100 /var/log/citizen-reports-killswitch.log
```

If process was killed → Auto-recovered, should be fine

### Step 2: Check Docker Logs
```bash
docker service logs citizen-reports_citizen-reports --tail 50
```

Look for errors or unusual patterns

### Step 3: Investigate Code
If kill-switch fired:
1. Review last code changes
2. Check for new event listeners or cache objects
3. Look for unclosed database connections
4. Run code review checklist: `docs/INCIDENT_POSTMORTEM_MEMORY_LEAK_NOV14_2025.md`

### Step 4: Load Test
```bash
# Simulate 100+ concurrent users for 1 hour
npm run load-test

# Monitor in separate window:
docker stats citizen-reports_citizen-reports --no-stream
```

Memory should stay <300MB

## Deployment Checklist

Before deploying changes:
```
□ Code review: Check memory safety (event listeners, cache cleanup, etc)
□ Load test: 100+ concurrent users for 30 min, monitor memory
□ No OOM errors in logs
□ Kill-switch job runs: crontab -l | grep killswitch
□ Health checks respond: curl -I http://localhost:4000/api/reportes
□ HTTPS certificate valid (not expired)
□ All 6 protection layers enabled
```

## Documentation

| Document | Purpose |
|----------|---------|
| `docs/INCIDENT_POSTMORTEM_MEMORY_LEAK_NOV14_2025.md` | Complete incident analysis |
| `docs/ANTI_CRASH_GUARANTEE.md` | 6-layer defense details |
| `docs/DOCKER_SWARM_RESTORATION_COMPLETE.md` | Deployment runbook |
| `.github/copilot-instructions.md` | Development guidelines |

## Emergency: App Keeps Crashing

```bash
# 1. SSH to server
ssh root@145.79.0.77

# 2. Check what's wrong
docker service logs citizen-reports_citizen-reports --tail 100

# 3. Manual restart
docker stack rm citizen-reports
sleep 3
docker stack deploy -c docker-compose-prod.yml citizen-reports

# 4. Verify
sleep 10
docker service ps citizen-reports_citizen-reports
curl -I https://reportes.progressiagroup.com/api/reportes

# 5. If still failing
# → Check disk space: df -h
# → Check system memory: free -h
# → Contact DevOps team
```

## Key Numbers

| Limit | Value | Purpose |
|-------|-------|---------|
| Hard Memory | 512MB | Docker won't exceed |
| Soft Memory | 256MB | Node.js GC target |
| Kill-Switch Threshold | 300MB | Trigger termination |
| File Descriptors | 8192 | Connection limit |
| Auto-Restart Delay | 10s | Service recovery time |
| Health Check Interval | 30s | API monitoring |
| Kill-Switch Frequency | 2 min | Process cleanup |

## Prevention Rules

✅ **DO:**
- Run `crontab -l` weekly to verify kill-switch is configured
- Check logs monthly for any kill-switch triggers
- Load test after any code changes touching DB/events/cache
- Review code for event listener cleanup before merge
- Keep Docker image up to date

❌ **DON'T:**
- Disable Docker memory limits
- Remove kill-switch cron job
- Deploy without load testing
- Ignore kill-switch log entries
- Run production without health checks

## Links

- **GitHub Repo:** https://github.com/PROGRESSIAGLOBALGROUP/citizen-reports
- **Production URL:** https://reportes.progressiagroup.com
- **Latest Commit:** `592451f` (post-mortem documentation)
- **Issue Tracker:** Check GitHub Issues for memory-related tickets

---

**Last Updated:** November 14, 2025  
**Maintained By:** DevOps Team  
**Next Review:** December 14, 2025 (30-day check-in)
