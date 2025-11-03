# GitHub Webhook Setup Guide

## Quick Summary

Auto-deploy is now configured. Every push to `main` branch triggers automatic deployment on the production server.

## Architecture

```
1. Push code to GitHub (main branch)
       ↓
2. GitHub sends POST to http://145.79.0.77:4000/api/github-webhook
       ↓
3. Webhook handler verifies GitHub signature
       ↓
4. Deploy script runs:
   - git fetch origin main
   - git reset --hard origin/main
   - npm install
   - npm run build (frontend)
   - Kill old server
   - Start new server
       ↓
5. Live deployment ✅
```

## Files Deployed

| File | Purpose |
|------|---------|
| `server/webhook-routes.js` | Webhook handler (signature verification, deploy orchestration) |
| `server/app.js` | Integrated webhook routes |
| `scripts/deploy.sh` | Shell script executed on server (git, npm, restart) |
| `docs/DEPLOYMENT_AUTODEPLOY_CONFIG.md` | This configuration reference |

## GitHub Webhook Configuration

**Status:** ⏳ Not yet configured (manual step required)

### Steps to Enable

1. Go to GitHub repository: https://github.com/PROGRESSIAGLOBALGROUP/citizen-reports

2. Navigate to: **Settings → Webhooks → Add webhook**

3. Configure:

   | Field | Value |
   |-------|-------|
   | **Payload URL** | `http://145.79.0.77:4000/api/github-webhook` |
   | **Content type** | `application/json` |
   | **Secret** | Generate a secure random string (see below) |
   | **Events** | Select: "Push events" only |
   | **Branch filter** | `main` (optional but recommended) |
   | **Active** | ✅ Checked |

4. **Generate Secret:**
   ```bash
   # Run locally and save the output
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **Set Environment Variable on Server:**
   ```bash
   ssh root@145.79.0.77
   echo "export GITHUB_WEBHOOK_SECRET='<paste-secret-here>'" >> /root/.bashrc
   source /root/.bashrc
   ```

6. **Verify Webhook:**
   - Go to GitHub Webhooks page
   - Click on the webhook you just created
   - Scroll to "Recent Deliveries"
   - You should see successful requests (Status 200)

## Testing Deployment

### Test 1: Manual API Call

```bash
# From any machine with curl:
curl -X POST http://145.79.0.77:4000/api/github-webhook \
  -H "Content-Type: application/json" \
  -H "x-github-event: push" \
  -d '{"ref": "refs/heads/main", "head_commit": {"message": "test deploy"}}'
```

**Expected Response:**
```json
{ "status": "Deployment queued" }
```

### Test 2: Real Deployment

```bash
# Make a trivial change and push
echo "# Updated $(date)" >> README.md
git add README.md
git commit -m "test: trigger webhook deployment"
git push origin main
```

**Verify deployment:**
```bash
# Check logs
ssh root@145.79.0.77
tail -f /home/jantetelco/jantetelco/logs/deploy.log

# Or check health
curl http://145.79.0.77:4000/api/health
```

## Monitoring

### View Deployment Logs

```bash
ssh root@145.79.0.77
tail -f /home/jantetelco/jantetelco/logs/deploy.log
```

### View Server Logs

```bash
ssh root@145.79.0.77
tail -f /home/jantetelco/jantetelco/logs/server.log
```

### Get Recent Deployments

```bash
# Via API
curl http://145.79.0.77:4000/api/deploy/logs

# Via SSH
ssh root@145.79.0.77 "tail -50 /home/jantetelco/jantetelco/logs/deploy.log"
```

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Webhook not triggering | GitHub webhook misconfigured | Check GitHub webhook settings, verify URL/secret |
| `Invalid signature` error in logs | Secret mismatch | Regenerate secret and update both GitHub and server env var |
| `git fetch` fails | No git credentials on server | Use SSH deploy key (see docs/DEPLOYMENT_AUTODEPLOY_CONFIG.md) |
| `npm install` fails | Missing dependencies or lock file issue | SSH to server and run `npm install` manually |
| Server won't restart | Port 4000 in use or build errors | Kill process: `lsof -i :4000 -t \| xargs kill -9` |
| Deployment stuck | Process still running | Check `nohup npm start` - may need to investigate |

## Rollback Strategy

If deployment fails:

1. **Check logs** to identify issue
2. **Automatic rollback** is implemented:
   - If build fails, script exits
   - Previous commit remains deployed
   - No automatic restart (you must fix and retry)

3. **Manual rollback:**
   ```bash
   ssh root@145.79.0.77
   cd /home/jantetelco/jantetelco
   git reset --hard origin/main~1  # Go back one commit
   npm run build
   # Kill and restart server
   ```

## Security Notes

✅ **GitHub Signature Verification:** All webhooks are verified using HMAC-SHA256  
✅ **Environment Variable:** Secret stored in `.bashrc`, not in code  
✅ **Atomic Operations:** Git operations are atomic (no partial updates)  
✅ **Logs:** All deployments logged with timestamps  
❌ **No Rollback on Restart Fail:** Manual intervention required if server won't start

## Environment Setup

The webhook handler needs this environment variable:

```bash
# On production server
export GITHUB_WEBHOOK_SECRET='your-secret-here'
```

Or add to systemd service (recommended for production):

```ini
# /etc/systemd/system/citizen-reports.service
[Service]
Environment="GITHUB_WEBHOOK_SECRET=your-secret-here"
ExecStart=/home/jantetelco/jantetelco/scripts/start-prod.sh
```

## Next Steps

1. ✅ Code committed to GitHub
2. ⏳ Configure GitHub webhook (Steps 1-6 above)
3. ✅ Test deployment with sample push
4. ✅ Monitor deployment logs
5. ✅ Iterate: Push → Auto-deploy → Test

---

**Last Updated:** November 2, 2025  
**Status:** Ready for webhook configuration  
**Deployment Path:** `/home/jantetelco/jantetelco/`  
**Server:** `http://145.79.0.77:4000`
