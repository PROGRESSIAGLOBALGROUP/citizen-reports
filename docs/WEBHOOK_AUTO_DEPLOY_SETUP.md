# GitHub Webhook Auto-Deployment Setup

**Last Updated:** November 14, 2025  
**Status:** Ready to Deploy  
**Server:** 145.79.0.77:3000

---

## Overview

This guide sets up automatic deployment of the citizen-reports application whenever code is pushed to the `main` branch on GitHub.

### What Happens

```
Developer pushes to GitHub main
        ↓
GitHub sends webhook to 145.79.0.77:3000/webhook
        ↓
Webhook server verifies GitHub signature
        ↓
Deployment process starts automatically:
  1. Git fetch & reset to latest
  2. Install backend dependencies
  3. Build frontend (Vite)
  4. Run tests (if test:all script exists)
  5. Backup database
  6. Build Docker image
  7. Deploy to Docker Swarm
  8. Verify service health
        ↓
API automatically updated (~3-5 minutes)
```

---

## Prerequisites

✅ **Already installed on 145.79.0.77:**
- Node.js 20+
- Docker Swarm initialized
- git configured
- curl for health checks

---

## PART 1: Deploy Webhook Server to Production

### Step 1: Create PM2 Configuration

On your local machine:

```bash
# Create PM2 config file
cat > /root/pm2-webhook.config.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: 'webhook-auto-deploy',
      script: './server/webhook-github-auto-deploy.js',
      cwd: '/root/citizen-reports',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      error_file: '/var/log/citizen-reports/webhook-error.log',
      out_file: '/var/log/citizen-reports/webhook-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
        GITHUB_WEBHOOK_SECRET: 'your-secret-here',
        WEBHOOK_PORT: '3000',
        DEPLOY_REPO_PATH: '/root/citizen-reports',
        STACK_NAME: 'citizen-reports',
        LOG_DIR: '/var/log/citizen-reports'
      }
    }
  ]
};
EOF
```

### Step 2: Set GitHub Secret

Generate a random secret for webhook verification:

```powershell
# PowerShell on local machine
$secret = -join ((33..126) | Get-Random -Count 32 | % {[char]$_})
Write-Host "Your GitHub Webhook Secret:"
Write-Host $secret
Write-Host ""
Write-Host "Save this for later!"
```

Or use any other method to generate a strong random string (minimum 32 characters).

Example: `Pq7mK9xL2nJ5qR8sT3uV6wX1yZ4aB9cD`

### Step 3: Deploy Webhook Server

```bash
# SSH to production server
ssh root@145.79.0.77

# Create logs directory
mkdir -p /var/log/citizen-reports

# Go to repo
cd /root/citizen-reports

# Copy webhook server (if not already there)
# (Already created as server/webhook-github-auto-deploy.js)

# Install webhook server as PM2 app
# Set your GitHub secret here:
GITHUB_SECRET="your-secret-here"

# Update PM2 config with your secret
sed -i "s/'your-secret-here'/'$GITHUB_SECRET'/g" /root/pm2-webhook.config.cjs

# Start webhook server with PM2
pm2 start /root/pm2-webhook.config.cjs

# Save PM2 to auto-restart on reboot
pm2 save
pm2 startup

# Verify it's running
pm2 status
pm2 logs webhook-auto-deploy --lines 20
```

### Step 4: Verify Webhook Server is Running

```bash
# From server terminal
curl -s http://localhost:3000/health | jq .
# Expected: {"status":"ok","service":"webhook-server","timestamp":"..."}

# Check status
curl -s http://localhost:3000/status | jq .

# View logs
curl -s "http://localhost:3000/logs?lines=20" | jq .logs
```

---

## PART 2: Configure GitHub Webhook

### Step 1: Go to Repository Settings

1. Navigate to: https://github.com/PROGRESSIAGLOBALGROUP/citizen-reports
2. Go to **Settings** → **Webhooks**
3. Click **"Add webhook"**

### Step 2: Fill Webhook Form

| Field | Value |
|-------|-------|
| Payload URL | `https://145.79.0.77:3000/webhook` |
| Content type | `application/json` |
| Secret | `your-secret-here` (use the secret from Step 2 above) |
| Which events | ☑️ **Push events** only |
| Active | ☑️ **Yes** |

### Step 3: Click "Add webhook"

GitHub will immediately send a test request. You should see a green checkmark (status 200).

### Step 4: Verify the Webhook

In GitHub webhook settings, you should see:
```
✅ We had a request just now
```

Click on it to view the delivery details.

---

## PART 3: Test Auto-Deployment

### Test 1: Manual Webhook Trigger

```bash
# From any machine:
REPO="/root/citizen-reports"
SECRET="your-secret-here"
PAYLOAD='{"ref":"refs/heads/main","head_commit":{"id":"test12345","message":"test commit"},"pusher":{"name":"test"}}'

# Calculate signature
SIGNATURE="sha256=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" -hex | cut -d' ' -f2)"

# Send webhook
curl -X POST https://145.79.0.77:3000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: $SIGNATURE" \
  -H "X-GitHub-Event: push" \
  -d "$PAYLOAD"
```

### Test 2: Real GitHub Push

1. Make a small change to a file in main branch
2. Commit and push:
   ```bash
   git add .
   git commit -m "test: trigger auto-deployment"
   git push origin main
   ```

3. Immediately check webhook logs:
   ```bash
   ssh root@145.79.0.77
   tail -f /var/log/citizen-reports/webhook-deploy.log
   ```

4. Watch the deployment:
   ```bash
   # In another terminal
   docker service logs citizen-reports_citizen-reports -f
   ```

---

## PART 4: Monitor Auto-Deployments

### Option 1: CLI Monitoring

```bash
# SSH to server
ssh root@145.79.0.77

# View deployment status
curl -s http://localhost:3000/status | jq .

# View recent deployments
pm2 logs webhook-auto-deploy --lines 50

# View detailed deployment log
tail -100 /var/log/citizen-reports/webhook-deploy.log
```

### Option 2: Web Dashboard

Open in browser: https://145.79.0.77:3000/

Shows:
- Current deployment status (idle/deploying/success/failed)
- Last 5 deployments with duration
- Configuration details
- GitHub setup instructions

### Option 3: Continuous Monitoring

```bash
# Watch logs in real-time
ssh root@145.79.0.77 "tail -f /var/log/citizen-reports/webhook-deploy.log"

# In another terminal, push to main
git push origin main

# Watch live deployment progress
```

---

## Deployment Workflow Details

### What Gets Deployed

When `main` branch is updated:

1. **Git Sync** (10s)
   - Fetch latest from GitHub
   - Hard reset to origin/main

2. **Dependencies** (60-90s)
   - `npm install --production` (backend)
   - `npm install` (frontend)

3. **Build** (30-60s)
   - `npm run build` (frontend with Vite)
   - Generates optimized bundle in `client/dist/`

4. **Tests** (0-120s, skipped if failed)
   - Runs `npm run test:all` if script exists
   - Non-blocking (deployment continues if tests fail)

5. **Backup** (5s)
   - Copies `data.db` to `backups/data-before-deploy-*.db`

6. **Docker** (60-120s)
   - Builds new Docker image with latest code
   - Removes old stack
   - Deploys new stack to Docker Swarm
   - Waits for 1/1 replicas

7. **Health Check** (5-30s)
   - Verifies API responds on port 4000
   - Confirms frontend is served

**Total Time:** ~3-5 minutes from push to live

### What Gets Monitored

Each deployment is logged with:
- ✅ Start time (trigger time from GitHub)
- ✅ Git commands output
- ✅ Build logs
- ✅ Docker build progress
- ✅ Stack deployment status
- ✅ Health check results
- ✅ Success/failure status
- ✅ Total duration

### Rollback Strategy

If deployment fails:

1. **Automatic Rollback** (not yet implemented, planned for next version)
2. **Manual Rollback**:
   ```bash
   # SSH to server
   ssh root@145.79.0.77
   
   # View available backups
   ls -lh /root/citizen-reports/backups/
   
   # Restore specific backup
   cp /root/citizen-reports/backups/data-before-deploy-*.db /root/citizen-reports/server/data.db
   
   # Redeploy previous version
   cd /root/citizen-reports
   git reset --hard HEAD~1
   docker stack rm citizen-reports
   sleep 5
   docker stack deploy -c docker-compose-prod.yml citizen-reports
   ```

---

## Troubleshooting

### Issue: Webhook Not Triggering

**Check 1: GitHub Webhook Configuration**
```bash
# SSH to server
curl -s http://localhost:3000/logs | jq .logs | grep -i "webhook received"
```

If no logs appear, check GitHub Settings → Webhooks:
- Payload URL is correct: `https://145.79.0.77:3000/webhook`
- Secret matches: `GITHUB_WEBHOOK_SECRET` environment variable
- Event is "Push"
- Active is enabled

**Check 2: Network Connectivity**
```bash
# From server
curl -v https://145.79.0.77:3000/webhook

# Should return: 405 (POST required, not GET)
```

**Check 3: PM2 Service Running**
```bash
pm2 status
pm2 logs webhook-auto-deploy --lines 50
```

### Issue: Deployment Fails

**Check Logs**
```bash
# Detailed deployment log
tail -100 /var/log/citizen-reports/webhook-deploy.log | tail -50

# PM2 logs
pm2 logs webhook-auto-deploy

# Docker logs
docker service logs citizen-reports_citizen-reports -f
```

**Common Issues:**

1. **Git fetch fails**
   - Check GitHub credentials configured on server
   - Verify SSH key or HTTPS token

2. **Build fails**
   - Check `npm run build` works locally
   - Check for missing dependencies in `package.json`

3. **Docker deployment fails**
   - Check `docker compose-prod.yml` syntax
   - Verify Docker Swarm is initialized
   - Check disk space: `df -h`

4. **Tests fail (non-blocking)**
   - Review test output in logs
   - Fix failing tests in code
   - Retry push to main

### Issue: High Memory Usage

```bash
# Check webhook server memory
ps aux | grep webhook-github

# Restart if needed
pm2 restart webhook-auto-deploy

# Check max memory limit
pm2 show webhook-auto-deploy
```

---

## Security

### Secret Management

**DO:**
- ✅ Generate strong random secret (32+ characters)
- ✅ Store in `GITHUB_WEBHOOK_SECRET` environment variable
- ✅ Never commit secret to Git
- ✅ Verify signature on every webhook

**DON'T:**
- ❌ Use weak/predictable secrets
- ❌ Share secret in chat/docs
- ❌ Commit secret to repository
- ❌ Disable signature verification

### Webhook Signature Verification

All webhooks are verified using HMAC-SHA256:

```javascript
// From webhook-github-auto-deploy.js
const expectedSignature = 'sha256=' + crypto
  .createHmac('sha256', GITHUB_WEBHOOK_SECRET)
  .update(payload)
  .digest('hex');

// Verification fails if signature doesn't match
if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
  return false; // Webhook rejected
}
```

### Access Control

- Only main branch triggers deployment
- Only GitHub's IP addresses can trigger (GitHub signature verification)
- Webhook server runs on internal Docker network
- HTTPS enforced on external access

---

## Maintenance

### Monthly Checks

```bash
# Check webhook server status
pm2 status

# Check for deployment errors
tail -50 /var/log/citizen-reports/webhook-deploy.log

# Verify logs directory isn't too large
du -sh /var/log/citizen-reports/

# Clean old logs (keep last 100MB)
ssh root@145.79.0.77 "
  cd /var/log/citizen-reports
  find . -name '*.log' -type f -exec du -h {} + | sort -rh | head -10
"
```

### Update Secret (if compromised)

1. Generate new secret
2. Update GitHub webhook secret in Settings
3. SSH to server and update PM2:
   ```bash
   GITHUB_SECRET="new-secret-here"
   pm2 delete webhook-auto-deploy
   sed -i "s/'.*'/'$GITHUB_SECRET'/g" /root/pm2-webhook.config.cjs
   pm2 start /root/pm2-webhook.config.cjs
   pm2 save
   ```

---

## Integration with Monitoring

### Uptime Robot

Add to monitoring with webhook health check:

```
URL: https://145.79.0.77:3000/health
Method: GET
Expected: {"status":"ok","service":"webhook-server"}
Interval: 5 minutes
Alerts: Email on failure
```

### Slack Notifications (Optional)

To add Slack notifications on deployment:

```bash
# Create script: /root/scripts/notify-slack.sh
#!/bin/bash
WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
MESSAGE="${1}"
curl -X POST "$WEBHOOK_URL" -d "{\"text\": \"$MESSAGE\"}"

# Add to webhook-deploy.log processing
tail -f /var/log/citizen-reports/webhook-deploy.log | \
  grep "DEPLOYMENT COMPLETED\|DEPLOYMENT FAILED" | \
  while read line; do
    /root/scripts/notify-slack.sh "$line"
  done &
```

---

## FAQ

**Q: Can I deploy to other branches?**
A: Currently only `main` branch auto-deploys. To enable others, modify:
```javascript
if (branch !== 'main') { // Change 'main' to desired branch
```

**Q: What if deployment fails?**
A: Logs are saved in `/var/log/citizen-reports/webhook-deploy.log`. Database backups are created before each deployment in `backups/data-before-deploy-*.db`.

**Q: Can I trigger deployment manually?**
A: Yes, use the manual webhook trigger script in Troubleshooting section. Or push any commit to main.

**Q: How long does deployment take?**
A: ~3-5 minutes typically. Depends on npm install and Docker build times.

**Q: Where can I see deployment history?**
A: Check `/var/log/citizen-reports/webhook-deploy.log` or visit https://145.79.0.77:3000/status

**Q: Does deployment interrupt users?**
A: Docker Swarm provides zero-downtime deployment. Old container stays live until new one is ready.

**Q: Can I disable auto-deployment?**
A: Yes: `pm2 stop webhook-auto-deploy`  
Resume with: `pm2 start webhook-auto-deploy`

---

## Commands Reference

### Start/Stop Webhook Server

```bash
# Start
pm2 start /root/pm2-webhook.config.cjs

# Stop
pm2 stop webhook-auto-deploy

# Restart
pm2 restart webhook-auto-deploy

# View logs
pm2 logs webhook-auto-deploy

# Status
pm2 status
```

### View Deployments

```bash
# Latest deployments
tail -50 /var/log/citizen-reports/webhook-deploy.log

# Real-time watch
tail -f /var/log/citizen-reports/webhook-deploy.log

# Count deployments
grep "DEPLOYMENT STARTED" /var/log/citizen-reports/webhook-deploy.log | wc -l

# View failed deployments
grep "DEPLOYMENT FAILED" /var/log/citizen-reports/webhook-deploy.log
```

### Webhook Information

```bash
# Health check
curl -s http://localhost:3000/health | jq .

# Deployment status
curl -s http://localhost:3000/status | jq .

# View deployment logs via API
curl -s "http://localhost:3000/logs?lines=100" | jq .logs | less
```

---

## Next Steps

1. ✅ Deploy webhook server to production (Steps 1-3 above)
2. ✅ Configure GitHub webhook (Part 2 above)
3. ✅ Test deployment (Part 3 above)
4. ✅ Monitor deployments (Part 4 above)
5. 📅 Schedule monthly maintenance checks

---

**Status:** ✅ Ready for production  
**Server:** 145.79.0.77:3000  
**Contact:** DevOps team
