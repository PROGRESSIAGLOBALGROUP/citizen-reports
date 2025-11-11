#!/usr/bin/env pwsh

<#
.SYNOPSIS
Auto-reconnect and continue Phase 2 of Nginx HTTPS deployment

.DESCRIPTION
Waits for VPS to come back online and automatically executes enable_https.sh
#>

param(
    [int]$MaxRetries = 12,
    [int]$RetryIntervalSeconds = 10
)

$VPS_IP = "145.79.0.77"
$VPS_USER = "root"
$Phase2_Script = "/root/enable_https.sh"

Write-Host "╔═════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  WAITING FOR VPS RECONNECTION - Auto-executing Phase 2          ║" -ForegroundColor Cyan
Write-Host "╚═════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$attempt = 0
$connected = $false

while ($attempt -lt $MaxRetries -and -not $connected) {
    $attempt++
    $timestamp = Get-Date -Format "HH:mm:ss"
    
    Write-Host "[$timestamp] Intento #$attempt/$MaxRetries - Conectando a $VPS_IP..." -ForegroundColor Yellow
    
    try {
        # Test SSH connection with short timeout
        $result = ssh -o ConnectTimeout=5 $VPS_USER@$VPS_IP "echo 'OK'" 2>$null
        
        if ($result -eq "OK") {
            $connected = $true
            Write-Host "[$timestamp] ✅ VPS ONLINE!" -ForegroundColor Green
            break
        }
    }
    catch {
        # Continue to retry
    }
    
    if (-not $connected -and $attempt -lt $MaxRetries) {
        Write-Host "[$timestamp] ⏳ Esperando $RetryIntervalSeconds segundos..." -ForegroundColor DarkGray
        Start-Sleep -Seconds $RetryIntervalSeconds
    }
}

if (-not $connected) {
    Write-Host ""
    Write-Host "❌ VPS no se reconectó después de $MaxRetries intentos" -ForegroundColor Red
    Write-Host "Intenta manualmente:"
    Write-Host "  ssh root@$VPS_IP"
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Ejecutando Fase 2: Enable HTTPS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Execute Phase 2
Write-Host "⚡ Ejecutando: bash $Phase2_Script" -ForegroundColor Yellow
Write-Host ""

ssh $VPS_USER@$VPS_IP "bash $Phase2_Script"

$exitCode = $LASTEXITCODE

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "╔═════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║  ✅ FASE 2 COMPLETADA - HTTPS CONFIGURADO                      ║" -ForegroundColor Green
    Write-Host "╚═════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "Tu app está ahora disponible en:" -ForegroundColor Green
    Write-Host "  🔒 https://reportes.progressiagroup.com" -ForegroundColor Green
    Write-Host ""
    Write-Host "Verifica con:" -ForegroundColor Green
    Write-Host "  curl -I https://reportes.progressiagroup.com" -ForegroundColor Green
} else {
    Write-Host "⚠️  Fase 2 terminó con código: $exitCode" -ForegroundColor Yellow
}

exit $exitCode
