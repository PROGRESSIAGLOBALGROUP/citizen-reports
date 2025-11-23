# Deploy citizen-reports to Docker Swarm
# Usage: .\deploy-to-swarm.ps1 -Host 145.79.0.77

param(
    [string]$Host = "145.79.0.77",
    [string]$StackName = "citizen-reports"
)

Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  CITIZEN-REPORTS DOCKER SWARM DEPLOYMENT                    ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Setup inicial
Write-Host "✓ Ejecutando setup en servidor..." -ForegroundColor Green
$setupScript = Get-Content "scripts/setup-swarm.sh" -Raw
$cmd = @"
cd /root/citizen-reports
bash scripts/setup-swarm.sh
"@

ssh root@$Host $cmd | Write-Host

# Paso 2: Deployment
Write-Host ""
Write-Host "✓ Ejecutando deployment..." -ForegroundColor Green
$deployScript = Get-Content "scripts/deploy-swarm.sh" -Raw

ssh root@$Host "cd /root/citizen-reports && bash scripts/deploy-swarm.sh $Host $StackName" | Write-Host

# Paso 3: Verificación final
Write-Host ""
Write-Host "✓ Verificación final..." -ForegroundColor Green
ssh root@$Host "
    echo '=== SERVICIOS ==='
    docker service ls --filter name=${StackName}_
    echo ''
    echo '=== VERIFICACIÓN DE HEALTHCHECK ==='
    sleep 5
    curl -s -I http://127.0.0.1:4000/api/reportes | head -3
" | Write-Host

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ DEPLOYMENT COMPLETADO EXITOSAMENTE                       ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Aplicación disponible en:" -ForegroundColor Yellow
Write-Host "   https://reportes.progressiagroup.com" -ForegroundColor Cyan
Write-Host "   http://$($Host):4000 (directo)" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Para monitorear logs:" -ForegroundColor Yellow
Write-Host "   ssh root@$Host" -ForegroundColor Cyan
Write-Host "   docker service logs ${StackName}_citizen-reports -f" -ForegroundColor Cyan
Write-Host ""
