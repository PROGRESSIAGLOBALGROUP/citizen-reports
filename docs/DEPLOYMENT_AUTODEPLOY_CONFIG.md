# Auto-Deploy Configuration

## Production Server Details

| Property | Value |
|----------|-------|
| **Server IP** | `145.79.0.77` |
| **HTTP Port** | `4000` |
| **SSH Access** | `root@145.79.0.77` |
| **SSH Port** | `22` (default) |
| **Project Path** | `/home/citizen-reports/citizen-reports/` |
| **Repository** | https://github.com/PROGRESSIAGLOBALGROUP/citizen-reports.git |
| **Branch** | `main` |

## Current Deployment Method

- **Before:** Manual SCP (not viable for active development)
- **Now:** Automatic GitHub Webhook + Deploy Script

## Architecture

```
GitHub (push) 
    ↓
GitHub Webhook (POST to /api/github-webhook)
    ↓
Server Webhook Handler (verify signature)
    ↓
Deploy Script:
  1. git fetch origin main
  2. git reset --hard origin/main
  3. npm run build (client)
  4. Restart server process
    ↓
Live Update ✅
```

## GitHub Webhook Setup

**Webhook URL:** `http://145.79.0.77:4000/api/github-webhook`  
**Events:** Push events on `main` branch  
**Content Type:** `application/json`  
**Secret:** Will be generated during setup

## Deploy Script Location

- **Path:** `/home/citizen-reports/citizen-reports/scripts/deploy.sh`
- **Permissions:** `755` (executable)
- **Runs as:** `root` (via webhook handler)

## Safety Features

✅ GitHub signature verification (prevents unauthorized deployments)  
✅ Atomic git operations (no partial updates)  
✅ Builds verified before restart  
✅ Rollback on failure  
✅ Deployment logs stored  

## Monitoring

Check deployment logs:
```bash
ssh root@145.79.0.77
tail -f /home/citizen-reports/citizen-reports/logs/deploy.log
```

Check server status:
```bash
curl http://145.79.0.77:4000/api/health
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Webhook not triggering | Verify GitHub webhook settings, check firewall |
| Build fails | SSH to server, run `npm run build` manually |
| Server won't restart | Check logs, ensure no stale processes on port 4000 |
| Out of sync | Manual: `git fetch origin && git reset --hard origin/main` |

---

**Last Updated:** November 2, 2025  
**Configured by:** GitHub Copilot  
**Status:** ✅ Ready to implement
