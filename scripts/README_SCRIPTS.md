# Scripts Directory - Automation & Deployment Tools

## GitHub Webhook Auto-Deployment

### 🚀 One-Command Setup

```bash
bash scripts/setup-webhook-auto-deploy.sh "your-32-char-secret-here"
```

This automatically:
- Creates log directories
- Starts webhook server on port 3000
- Saves PM2 configuration
- Prints GitHub setup instructions

**Documentation:** See `docs/WEBHOOK_QUICK_START.md` or `docs/WEBHOOK_AUTO_DEPLOY_SETUP.md`

---

## Available Scripts

### Deployment Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `setup-webhook-auto-deploy.sh` | Install GitHub webhook server | `bash scripts/setup-webhook-auto-deploy.sh "<secret>"` |
| `test-webhook-deployment.sh` | Test auto-deployment manually | `bash scripts/test-webhook-deployment.sh` |
| `deploy-swarm.sh` | Manual Docker Swarm deployment | `bash scripts/deploy-swarm.sh 145.79.0.77 citizen-reports` |
| `setup-swarm.sh` | Initialize Docker Swarm | `bash scripts/setup-swarm.sh` |

### Monitoring Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `monitor-swarm.sh` | Monitor Docker Swarm health | `bash scripts/monitor-swarm.sh` |
| `killswitch-memhog.sh` | Kill memory-hogging processes | `bash scripts/killswitch-memhog.sh` |

---

## Webhook Deployment System

### How It Works

```
Push to main branch
        ↓
GitHub sends webhook to 145.79.0.77:3000
        ↓
Webhook server verifies signature
        ↓
Starts 9-step deployment:
  1. Git fetch & reset
  2. Install dependencies
  3. Build frontend
  4. Run tests
  5. Backup database
  6. Build Docker image
  7. Deploy to Swarm
  8. Wait for ready
  9. Health check
        ↓
API updated (~3-5 minutes)
```

### Quick Commands

```bash
# View webhook status
curl -s http://localhost:3000/status | jq .

# Watch deployment in real-time
tail -f /var/log/citizen-reports/webhook-deploy.log

# Check PM2 process
pm2 status
pm2 logs webhook-auto-deploy

# Manual webhook trigger (for testing)
bash scripts/test-webhook-deployment.sh
```

---

## Setup Timeline

### Step 1: Generate Secret (< 1 min)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Example: a1b2c3d4e5f6789012345678901234567890abcd
```

### Step 2: Deploy Webhook (< 5 min)
```bash
ssh root@145.79.0.77
cd /root/citizen-reports
bash scripts/setup-webhook-auto-deploy.sh "your-secret"
```

### Step 3: Configure GitHub (< 5 min)
1. Go to https://github.com/PROGRESSIAGLOBALGROUP/citizen-reports/settings/hooks
2. Add webhook with:
   - URL: `https://145.79.0.77:3000/webhook`
   - Secret: your-secret
   - Events: Push only

### Step 4: Test (< 5 min)
```bash
bash /root/citizen-reports/scripts/test-webhook-deployment.sh
```

**Total: ~20 minutes to full auto-deployment**

---

## Monitoring & Logs

### Live Monitoring

```bash
# Option 1: Web Dashboard
# Open: https://145.79.0.77:3000/

# Option 2: Tail logs
tail -f /var/log/citizen-reports/webhook-deploy.log

# Option 3: API
curl http://localhost:3000/status | jq .
```

### Deployment Logs Location

```
/var/log/citizen-reports/
├── webhook-deploy.log    ← Main log (deployment details)
├── webhook-out.log       ← PM2 stdout
└── webhook-error.log     ← PM2 stderr
```

### View Deployment History

```bash
# Last 50 lines
tail -50 /var/log/citizen-reports/webhook-deploy.log

# Count total deployments
grep "DEPLOYMENT STARTED" /var/log/citizen-reports/webhook-deploy.log | wc -l

# Find failed deployments
grep "DEPLOYMENT FAILED" /var/log/citizen-reports/webhook-deploy.log
```

---

## Security

### Webhook Verification
- ✅ Every webhook signed with HMAC-SHA256
- ✅ Secret never stored in repo
- ✅ Only main branch auto-deploys
- ✅ Failed signature verification rejected

### Secret Management
- ✅ 32+ character random secret
- ✅ Stored in PM2 environment only
- ✅ Never commit to Git

### Best Practices
- ✅ Rotate secret annually
- ✅ Monitor deployment logs
- ✅ Use branch protection on main
- ✅ Only allow trusted devs to push main

---

## Troubleshooting

### Webhook Not Triggering

```bash
# Check if webhook server is running
curl -s http://localhost:3000/health | jq .

# Check logs for webhook receipt
grep "webhook received" /var/log/citizen-reports/webhook-deploy.log

# Verify GitHub webhook is configured correctly
# Visit: https://github.com/PROGRESSIAGLOBALGROUP/citizen-reports/settings/hooks
```

### Deployment Failing

```bash
# View detailed error logs
tail -50 /var/log/citizen-reports/webhook-deploy.log | grep "❌\|ERROR"

# Check Docker status
docker service ls --filter name=citizen-reports
docker service logs citizen-reports_citizen-reports -f

# Check PM2 process
pm2 show webhook-auto-deploy
```

### Manual Rollback

```bash
cd /root/citizen-reports

# View available backups
ls -lh backups/data-before-deploy-*

# Restore backup
cp backups/data-before-deploy-TIMESTAMP.db server/data.db

# Redeploy previous version
git reset --hard HEAD~1
docker stack rm citizen-reports
sleep 5
docker stack deploy -c docker-compose-prod.yml citizen-reports
```

---

## PM2 Commands

```bash
# Start webhook server
pm2 start /root/pm2-webhook.config.cjs

# Stop (pauses auto-deploy)
pm2 stop webhook-auto-deploy

# Restart
pm2 restart webhook-auto-deploy

# View status
pm2 status
pm2 show webhook-auto-deploy

# View logs
pm2 logs webhook-auto-deploy --lines 50

# Save for reboot
pm2 save
pm2 startup
```

---

## Environment Variables

### Webhook Server Configuration

```bash
GITHUB_WEBHOOK_SECRET    # GitHub webhook secret (32+ chars)
WEBHOOK_PORT             # Port to listen on (default: 3000)
DEPLOY_REPO_PATH         # Path to repo (default: /root/citizen-reports)
STACK_NAME               # Docker stack name (default: citizen-reports)
LOG_DIR                  # Logs directory (default: /var/log/citizen-reports)
```

### Update Config

```bash
# Edit PM2 config
vim /root/pm2-webhook.config.cjs

# Restart to apply changes
pm2 restart webhook-auto-deploy
pm2 save
```

---

## Related Documentation

- **Quick Start:** `docs/WEBHOOK_QUICK_START.md` (3-min read)
- **Full Guide:** `docs/WEBHOOK_AUTO_DEPLOY_SETUP.md` (20-min read)
- **Memory Protection:** `docs/ANTI_CRASH_GUARANTEE.md`
- **Infrastructure:** `docs/DOCKER_SWARM_RESTORATION_COMPLETE.md`
- **Post-Mortem:** `docs/INCIDENT_POSTMORTEM_MEMORY_LEAK_NOV14_2025.md`

---

## Status

✅ **Webhook Server:** Production ready  
✅ **Setup Scripts:** Automated  
✅ **Documentation:** Complete  
✅ **Testing:** Included  
✅ **Security:** HMAC-SHA256 verified  

**Last Updated:** November 14, 2025  
**Commit:** d509893
