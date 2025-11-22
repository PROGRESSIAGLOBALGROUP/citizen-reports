#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy login bugfix to production server (145.79.0.77)
.DESCRIPTION
    Executes production deployment:
    1. SSH to production
    2. git pull (gets latest code from main)
    3. Restart PM2 process
    4. Run health checks
.PARAMETER ServerIP
    Production server IP (default: 145.79.0.77)
.PARAMETER SshKey
    Path to SSH private key (optional)
#>

param(
    [string]$ServerIP = "145.79.0.77",
    [string]$SshKey = ""
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 DEPLOY LOGIN BUGFIX TO PRODUCTION" -ForegroundColor Cyan
Write-Host "Server: $ServerIP" -ForegroundColor Green
Write-Host ""

# Step 1: SSH Connection Test
Write-Host "📡 Testing SSH connection..." -ForegroundColor Yellow
$sshCmd = if ($SshKey) { "ssh -i `"$SshKey`"" } else { "ssh" }

try {
    Write-Host "Running: $sshCmd root@$ServerIP 'echo SSH OK'"
    & powershell -Command "$sshCmd root@$ServerIP 'echo SSH OK'" | Out-Null
    Write-Host "✅ SSH connection successful" -ForegroundColor Green
} catch {
    Write-Host "❌ SSH connection failed!" -ForegroundColor Red
    Write-Host "Error: $_"
    exit 1
}

# Step 2: Deploy via SSH
Write-Host ""
Write-Host "📦 Starting deployment sequence..." -ForegroundColor Yellow

$deployScript = @"
#!/bin/bash
set -e
echo ""
echo "🔄 Step 1: Navigate to project directory"
cd /root/citizen-reports
echo "✅ Location: \$(pwd)"

echo ""
echo "🔄 Step 2: Pull latest code from GitHub"
git pull origin main
echo "✅ Git pull completed"

echo ""
echo "🔄 Step 3: Verify repair script exists"
if [ -f "server/repair-auth-production.js" ]; then
    echo "✅ Repair script found"
else
    echo "❌ Repair script NOT found!"
    exit 1
fi

echo ""
echo "🔄 Step 4: Install dependencies (if needed)"
cd server
npm install --production 2>/dev/null || echo "⚠️ Dependencies already installed"
cd ..

echo ""
echo "🔄 Step 5: Restart PM2 application"
pm2 restart citizen-reports-app --update-env
echo "✅ PM2 restarted"

echo ""
echo "🔄 Step 6: Wait for application startup"
sleep 3

echo ""
echo "🔄 Step 7: Run post-deployment health check"
if [ -f "server/health-check-post-deploy.js" ]; then
    node server/health-check-post-deploy.js
    if [ \$? -eq 0 ]; then
        echo "✅ Health check PASSED"
    else
        echo "⚠️ Health check warnings"
    fi
else
    echo "⚠️ Health check script not found"
fi

echo ""
echo "🔄 Step 8: Verify application is responding"
for i in {1..10}; do
    HTTP_CODE=\$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/health || echo "000")
    if [ "\$HTTP_CODE" = "200" ]; then
        echo "✅ API responding with 200 OK"
        exit 0
    else
        echo "  Attempt \$i/10: HTTP \$HTTP_CODE"
        sleep 1
    fi
done

echo "❌ API not responding after 10 attempts!"
exit 1
"@

# Save script to temp file and execute
$tempScript = "C:\Windows\Temp\deploy-$([DateTime]::Now.Ticks).sh"
$deployScript | Out-File -FilePath $tempScript -Encoding ASCII -Force

try {
    Write-Host "📤 Uploading deployment script..." -ForegroundColor Yellow
    & powershell -Command "scp -o ConnectTimeout=10 `"$tempScript`" root@${ServerIP}:/tmp/deploy.sh" | Out-Null
    
    Write-Host "⚙️ Executing deployment on server..." -ForegroundColor Yellow
    Write-Host ""
    
    & powershell -Command "$sshCmd -o ConnectTimeout=30 root@$ServerIP 'bash /tmp/deploy.sh'"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Verification:" -ForegroundColor Cyan
        Write-Host "  • Login endpoint: http://$ServerIP:4000/api/auth/login"
        Write-Host "  • Test credentials: admin@jantetelco.gob.mx / admin123"
        Write-Host "  • Production app: http://145.79.0.77"
        Write-Host ""
        Write-Host "🔍 Monitor logs:" -ForegroundColor Cyan
        Write-Host "  pm2 logs citizen-reports-app"
        exit 0
    } else {
        Write-Host ""
        Write-Host "❌ DEPLOYMENT FAILED!" -ForegroundColor Red
        Write-Host "Check logs on production server"
        exit 1
    }
} finally {
    Remove-Item -Force -ErrorAction SilentlyContinue $tempScript
}
