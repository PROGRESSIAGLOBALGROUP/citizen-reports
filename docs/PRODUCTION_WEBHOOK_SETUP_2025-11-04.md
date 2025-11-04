# 🚀 GitHub Webhook Setup - Production Deployment

## ✅ Server Status (November 4, 2025)

**VPS: 145.79.0.77**

```
citizen-reports-app (PORT 4000) - Status: ✅ ONLINE
webhook-server (PORT 3000) - Status: ✅ ONLINE
PM2 Dashboard: Ready for monitoring
```

---

## 📋 Configuring GitHub Webhook

### Step 1: Get Your Webhook Secret

The webhook server uses signature verification. Set the secret to something secure:

**Recommended:** Generate with OpenSSL:
```bash
openssl rand -base64 32
```

**Example output:**
```
aBc1d2E3fG4hI5jK6lM7nO8pQ9rS0tUvWxYzABC1234=
```

### Step 2: Update Webhook Server with Secret

SSH into server and update the webhook environment variable:

```bash
ssh root@145.79.0.77

# Edit the secret
pm2 stop webhook-server
pm2 delete webhook-server

# Set environment variable and restart
PORT=3000 GITHUB_WEBHOOK_SECRET="your-generated-secret-here" \
pm2 start /root/webhook-server.js --name webhook-server

pm2 save
```

### Step 3: Configure GitHub Repository Webhook

1. Go to: **GitHub Repository → Settings → Webhooks**
   - URL: `https://github.com/PROGRESSIAGLOBALGROUP/citizen-reports/settings/hooks`

2. Click **"Add webhook"**

3. Fill in the form:
   - **Payload URL:** `http://145.79.0.77:3000/webhook`
   - **Content type:** `application/json`
   - **Secret:** Paste the secret from Step 1 (e.g., `aBc1d2E3fG4hI5jK6lM7nO8pQ9rS0tUvWxYzABC1234=`)
   - **Which events?:** Select **"Push events"** only
   - **Active:** ✅ Checked

4. Click **"Add webhook"**

### Step 4: Test the Webhook

GitHub will show a test button. Click it to verify the connection.

**Expected response on server:**
```bash
ssh root@145.79.0.77 "tail -20 /root/logs/webhook-events.log"

# Should show:
# [2025-11-04T16:30:45.000Z] ✅ Valid GitHub webhook received from branch: main
# [2025-11-04T16:30:45.000Z] Pusher: github-user
# [2025-11-04T16:30:45.000Z] Commits: 0
```

---

## 🔄 Full Deployment Flow

### How It Works:

1. **Developer** commits and pushes to GitHub `main` branch
2. **GitHub** sends webhook to `http://145.79.0.77:3000/webhook`
3. **Webhook server** verifies signature with GitHub secret
4. **If signature valid**, executes `/root/deploy.sh`
5. **Deploy script** does:
   - `git pull origin main` (fetch latest code)
   - `npm install` (update dependencies)
   - `cd client && npm run build` (rebuild frontend)
   - `pm2 restart citizen-reports-app` (restart app with new code)
6. **App reloads** with new code automatically

### Deployment Log Location:

```bash
# Watch deployment logs in real-time
ssh root@145.79.0.77
tail -f /root/deployment.log

# Or view webhook events
tail -f /root/logs/webhook-events.log

# Or check PM2 logs
pm2 logs citizen-reports-app
pm2 logs webhook-server
```

---

## ⚠️ Troubleshooting

### Webhook not triggering?

1. Check GitHub webhook delivery status:
   - Go to repo settings → Webhooks → Click the webhook
   - Scroll to "Recent Deliveries"
   - If red, check the response

2. Check server webhook logs:
   ```bash
   ssh root@145.79.0.77
   tail -50 /root/logs/webhook-events.log
   ```

3. Check if webhook server is running:
   ```bash
   ssh root@145.79.0.77 "pm2 status"
   ```

### Deployment fails?

1. Check deployment log:
   ```bash
   ssh root@145.79.0.77
   tail -100 /root/deployment.log
   ```

2. Check app logs:
   ```bash
   pm2 logs citizen-reports-app --lines 50
   ```

3. Common issues:
   - **Port 4000 already in use:** `lsof -ti:4000 | xargs kill -9`
   - **npm install fails:** Check disk space `df -h`
   - **Build errors:** Check `/root/citizen-reports/client/` has dist/ folder

### Can't SSH to server?

```bash
# From local machine (Windows)
ssh root@145.79.0.77

# If permission denied, add SSH key to ~/.ssh/authorized_keys on server
# Or contact VPS provider for password reset
```

---

## 🔐 Security Notes

- ✅ Webhook signature verified with SHA-256 HMAC
- ✅ Only `main` branch triggers deployment (other branches ignored)
- ✅ Secret stored in PM2 environment variable (not in config files)
- ✅ Deploy script runs with root privileges - restrict SSH access
- ⚠️ **TODO:** Implement rate limiting on webhook endpoint

---

## 📊 Monitoring & Maintenance

### Check server health:
```bash
ssh root@145.79.0.77 "pm2 status && echo '---' && du -sh /root/"
```

### View recent deployments:
```bash
ssh root@145.79.0.77 "tail -5 /root/deployment.log"
```

### Restart services:
```bash
ssh root@145.79.0.77
pm2 restart all           # Restart all services
pm2 stop citizen-reports-app    # Stop app
pm2 start citizen-reports-app   # Start app
```

### Check disk space:
```bash
ssh root@145.79.0.77 "df -h"
```

### Backup database:
```bash
ssh root@145.79.0.77 "cp /root/citizen-reports/data.db /root/backups/data-$(date +%s).db"
```

---

## ✨ What's Next?

1. ✅ **GitHub webhook configured** - Automatic deployments enabled
2. ✅ **Services running** - App and webhook server online
3. ⏳ **Test deployment cycle** - Make a code change and push to verify
4. ⏳ **Monitor logs** - Ensure deployments run smoothly
5. ⏳ **Production domain** - Point domain DNS to 145.79.0.77

---

## 🎯 Commands Quick Reference

```bash
# SSH to server
ssh root@145.79.0.77

# View PM2 processes
pm2 status

# Tail logs (Ctrl+C to exit)
pm2 logs
tail -f /root/deployment.log
tail -f /root/logs/webhook-events.log

# Restart services
pm2 restart all
pm2 save

# View deployment log
cat /root/deployment.log

# Check if ports are open
netstat -tlnp | grep 4000
netstat -tlnp | grep 3000
```

---

**Server Status:** ✅ PRODUCTION READY  
**Last Updated:** 2025-11-04  
**Deployment Method:** GitHub Webhook → Automatic Deploy
