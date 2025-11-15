# GitHub Webhook Auto-Deployment - Quick Start

**Status:** ✅ Ready to Deploy  
**Commit:** d509893  
**Documentation:** See `docs/WEBHOOK_AUTO_DEPLOY_SETUP.md` for detailed guide

---

## The Goal

Whenever you push to the `main` branch on GitHub, the server automatically:
1. ✅ Pulls latest code
2. ✅ Builds frontend & backend
3. ✅ Runs tests
4. ✅ Backs up database
5. ✅ Deploys to production
6. ✅ Verifies health

**No manual deployment needed!**

---

## 3-Step Setup on Production Server

### Step 1: Generate GitHub Secret

Generate a random secret (32+ characters):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Example output: a1b2c3d4e5f6789012345678901234567890abcd
```

Copy this secret - you'll need it.

### Step 2: SSH to Server & Run Setup

```bash
ssh root@145.79.0.77

# Navigate to repo
cd /root/citizen-reports

# Run setup with your secret
bash scripts/setup-webhook-auto-deploy.sh "your-secret-here"
```

This script will:
- ✅ Create log directories
- ✅ Update PM2 config with your secret
- ✅ Start webhook server on port 3000
- ✅ Verify everything is working
- ✅ Print next steps

### Step 3: Configure GitHub Webhook

1. Go to: https://github.com/PROGRESSIAGLOBALGROUP/citizen-reports/settings/hooks
2. Click **"Add webhook"**
3. Fill in the form:
   - **Payload URL:** `https://145.79.0.77:3000/webhook`
   - **Content type:** `application/json`
   - **Secret:** (paste your secret from Step 1)
   - **Events:** Push events only (☑️)
   - **Active:** ☑️ Yes
4. Click **"Add webhook"**

**Done!** Your webhook is now live.

---

## Testing It Works

### Option 1: Automatic Test

```bash
# On production server
bash /root/citizen-reports/scripts/test-webhook-deployment.sh
```

This sends a fake GitHub webhook and monitors deployment.

### Option 2: Real Test

Make a small change and push:

```bash
# On your local machine
echo "# test" >> README.md
git add README.md
git commit -m "test: trigger auto-deployment"
git push origin main
```

Then watch the deployment:

```bash
# On production server
tail -f /var/log/citizen-reports/webhook-deploy.log
```

You should see deployment starting in ~30 seconds.

---

## Monitor Deployments

### Web Dashboard

Open in browser: **https://145.79.0.77:3000/**

Shows:
- Current deployment status
- Last 5 deployments
- Configuration info

### Command Line

```bash
# SSH to server
ssh root@145.79.0.77

# View deployment status
curl -s http://localhost:3000/status | jq .

# View recent logs
curl -s "http://localhost:3000/logs?lines=50" | jq .logs

# Watch logs in real-time
tail -f /var/log/citizen-reports/webhook-deploy.log

# Check PM2 status
pm2 status
pm2 logs webhook-auto-deploy
```

---

## How It Works

```
                    ┌─────────────────────┐
                    │  Developer pushes   │
                    │   to main branch    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  GitHub sends POST  │
                    │ to 145.79.0.77:3000 │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────────────┐
                    │ Webhook server verifies     │
                    │ GitHub signature (HMAC-256)│
                    └──────────┬──────────────────┘
                               │
          ┌────────────────────▼────────────────────┐
          │    9-Step Deployment Pipeline           │
          ├─────────────────────────────────────────┤
          │ 1. Git fetch & reset                    │
          │ 2. Install dependencies                 │
          │ 3. Build frontend (Vite)                │
          │ 4. Run tests (non-blocking)             │
          │ 5. Backup database                      │
          │ 6. Build Docker image                   │
          │ 7. Deploy to Docker Swarm               │
          │ 8. Wait for service ready (1/1)         │
          │ 9. Health check API                     │
          └────────────────────┬────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │ API automatically   │
                    │ updated with new    │
                    │ code (~3-5 minutes) │
                    └─────────────────────┘
```

---

## Anatomy of Deployment

### Pre-Deployment Checks
- ✅ GitHub signature verification (prevents unauthorized deploys)
- ✅ Only main branch triggers (other branches ignored)
- ✅ One deployment at a time (prevents conflicts)

### Build Phase (~2-3 minutes)
- Pulls latest code from GitHub
- Installs npm dependencies
- Builds React SPA with Vite
- Runs test suite (skips if fails)

### Deployment Phase (~1-2 minutes)
- Creates database backup (keeps data safe)
- Builds new Docker image
- Deploys to Docker Swarm
- Waits for service to be healthy (1/1 replicas)

### Verification Phase (~30-60 seconds)
- Checks API responds on port 4000
- Confirms frontend is served
- Logs all details

### Total Time: ~3-5 minutes

---

## Logs & Monitoring

### Log Locations

```
/var/log/citizen-reports/
├── webhook-deploy.log       ← Main deployment log (detailed)
├── webhook-out.log          ← PM2 stdout
└── webhook-error.log        ← PM2 stderr
```

### Log Format

```
[2025-11-14T15:30:45.123Z] [INFO] 🚀 DEPLOYMENT STARTED
[2025-11-14T15:30:45.234Z] [INFO]    Commit: abc1234
[2025-11-14T15:30:45.345Z] [INFO]    Branch: main
[2025-11-14T15:30:45.456Z] [INFO]    Pusher: john-doe
[2025-11-14T15:31:15.567Z] [INFO] 📋 STEP 1: Fetching latest from GitHub...
[2025-11-14T15:31:20.678Z] [INFO] ✅ Git fetch successful
...
[2025-11-14T15:35:00.789Z] [INFO] ✅ DEPLOYMENT SUCCESSFUL
[2025-11-14T15:35:00.890Z] [INFO]    Duration: 234s
```

### Real-Time Monitoring

```bash
# Watch as deployment happens
tail -f /var/log/citizen-reports/webhook-deploy.log

# Or check status via API
watch -n 5 'curl -s http://localhost:3000/status | jq .isDeploying'
```

---

## Commands Reference

```bash
# ==================== PM2 MANAGEMENT ====================
pm2 start /root/pm2-webhook.config.cjs   # Start webhook server
pm2 stop webhook-auto-deploy             # Stop (pauses auto-deploy)
pm2 restart webhook-auto-deploy          # Restart
pm2 logs webhook-auto-deploy             # View logs
pm2 status                               # Check all processes
pm2 save                                 # Save for reboot

# ==================== VIEW DEPLOYMENTS ====================
tail -100 /var/log/citizen-reports/webhook-deploy.log  # Last 100 lines
tail -f /var/log/citizen-reports/webhook-deploy.log    # Real-time
grep "DEPLOYMENT COMPLETED\|FAILED" /var/log/citizen-reports/webhook-deploy.log | wc -l  # Count

# ==================== API ENDPOINTS ====================
curl http://localhost:3000/health                      # Health check
curl http://localhost:3000/status | jq .               # Deployment status
curl "http://localhost:3000/logs?lines=50" | jq .logs  # View logs via API
```

---

## Troubleshooting

### Issue: Webhook not triggering on push

**Check:**
1. GitHub secret matches (Settings → Webhooks → Edit)
2. URL is correct: `https://145.79.0.77:3000/webhook`
3. Event is "Push" only
4. Webhook is Active (green)

**Test:**
```bash
pm2 logs webhook-auto-deploy --lines 50 | grep "webhook received\|SKIPPED"
```

### Issue: Deployment failed

**View logs:**
```bash
tail -100 /var/log/citizen-reports/webhook-deploy.log | grep "❌\|ERROR"
```

**Common causes:**
- Git authentication issue (SSH key not configured)
- Build error (check `npm run build` locally)
- Docker image build failed (check `docker logs`)
- Tests failing (usually non-blocking)

### Issue: PM2 process not running

**Check:**
```bash
pm2 status
pm2 show webhook-auto-deploy
```

**Restart:**
```bash
pm2 restart webhook-auto-deploy
pm2 logs webhook-auto-deploy --lines 50
```

### Issue: High memory usage

**Check:**
```bash
ps aux | grep webhook
pm2 monit  # Press 'q' to exit
```

**Restart if needed:**
```bash
pm2 restart webhook-auto-deploy
```

---

## Security

### ✅ Protected By

- **GitHub Signature Verification:** Every webhook verified using HMAC-SHA256
- **Main Branch Only:** Only pushes to main trigger deployment
- **Secret Management:** Secret never stored in repo, only in PM2 env
- **HTTPS Enforced:** All external access via HTTPS
- **Logging:** All actions logged with timestamps

### 🔒 Best Practices

- ✅ Keep webhook secret confidential (32+ characters)
- ✅ Regenerate secret annually or if compromised
- ✅ Monitor deployment logs for suspicious activity
- ✅ Only allow trusted developers to push to main
- ✅ Use branch protection rules on main branch

### ⚠️ DO NOT

- ❌ Share secret in Slack/chat/email
- ❌ Commit secret to Git
- ❌ Use weak secret (< 20 characters)
- ❌ Disable signature verification
- ❌ Allow anyone to trigger deployments

---

## Updating Secret

If secret is compromised or needs rotation:

```bash
# Generate new secret
NEW_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Update PM2 config
sed -i "s/GITHUB_WEBHOOK_SECRET: '.*'/GITHUB_WEBHOOK_SECRET: '$NEW_SECRET'/" /root/pm2-webhook.config.cjs

# Restart PM2
pm2 restart webhook-auto-deploy
pm2 save

# Update GitHub webhook secret in Settings → Webhooks
# (visit https://github.com/PROGRESSIAGLOBALGROUP/citizen-reports/settings/hooks)
```

---

## Related Documentation

- **Full Setup Guide:** `docs/WEBHOOK_AUTO_DEPLOY_SETUP.md`
- **Deployment Process:** `docs/DOCKER_SWARM_RESTORATION_COMPLETE.md`
- **Memory Protection:** `docs/ANTI_CRASH_GUARANTEE.md`
- **Post-Mortem:** `docs/INCIDENT_POSTMORTEM_MEMORY_LEAK_NOV14_2025.md`
- **Previous Updates:** `docs/MEMORY_LEAK_QUICKREF.md`

---

## Summary

✅ **Setup:** One command  
✅ **GitHub Config:** 5 fields in webhook settings  
✅ **Testing:** Automatic test script  
✅ **Monitoring:** Web dashboard + logs  
✅ **Security:** HMAC-SHA256 signed  
✅ **Deployment:** ~3-5 minutes  
✅ **Reliability:** Zero-downtime with Docker Swarm

---

**Status:** Production Ready  
**Commit:** d509893  
**Deployed:** November 14, 2025

