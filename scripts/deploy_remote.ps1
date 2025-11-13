#!/usr/bin/env pwsh

# Script PowerShell para conectar al VPS y ejecutar deployment

$VPS_IP = "145.79.0.77"
$VPS_USER = "root"
$VPS_PASS = $env:DEPLOYMENT_PASSWORD  # Lee de variable de entorno (NO hardcodear)

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  DEPLOYMENT NGINX + HTTPS EN VPS 145.79.0.77                   ║" -ForegroundColor Green
Write-Host "║  Ejecutando remotamente...                                     ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# Crear archivo de comandos a ejecutar en el VPS
$commands = @"
#!/bin/bash
set -euo pipefail

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     DEPLOYMENT NGINX + HTTPS - EJECUTANDO EN VPS              ║"
echo "║     IP: 145.79.0.77                                           ║"
echo "║     Fecha: \$(date)                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# PASO 1
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASO 1/2: INSTALANDO NGINX + CERTBOT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

bash /root/setup_reverse_proxy.sh

if [ \$? -ne 0 ]; then
    echo "❌ PASO 1 FALLÓ"
    exit 1
fi

echo ""
echo "✅ PASO 1 EXITOSO"
echo ""

# Esperar un poco
sleep 2

# PASO 2
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASO 2/2: EMITIENDO CERTIFICADO HTTPS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

bash /root/enable_https.sh

if [ \$? -ne 0 ]; then
    echo "❌ PASO 2 FALLÓ"
    exit 1
fi

echo ""
echo "✅ PASO 2 EXITOSO"
echo ""

# VERIFICACIONES
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "VERIFICACIONES FINALES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "✓ Nginx sintaxis:"
sudo nginx -t 2>&1 | head -2
echo ""

echo "✓ Nginx running:"
sudo systemctl is-active nginx && echo "  Status: RUNNING" || echo "  Status: STOPPED"
echo ""

echo "✓ Certificado:"
sudo certbot certificates | grep -A2 "Certificate Name:" || echo "  (Verificar si se emitió)"
echo ""

echo "✓ Puertos abiertos:"
sudo ss -tlnp 2>/dev/null | grep -E ':(80|443)' | awk '{print "  " \$0}' || echo "  (Verificar puertos)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT COMPLETADO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "SIGUIENTES PASOS:"
echo "  1. Verifica DNS: dig reportes.progressiagroup.com"
echo "  2. Test HTTP: curl -I http://reportes.progressiagroup.com"
echo "  3. Test HTTPS: curl -I https://reportes.progressiagroup.com"
echo "  4. Abre navegador: https://reportes.progressiagroup.com"
echo ""
"@

# Escribir comandos a archivo temporal
$tempCmdFile = Join-Path $env:TEMP "deploy_commands_$([guid]::NewGuid()).sh"
$commands | Out-File -FilePath $tempCmdFile -Encoding UTF8 -NoNewline

Write-Host "📝 Preparando comandos de deployment..." -ForegroundColor Cyan
Write-Host "   Archivo temporal: $tempCmdFile" -ForegroundColor Gray
Write-Host ""

# Intentar ejecutar remotamente
Write-Host "🔗 Conectando al VPS..." -ForegroundColor Cyan

try {
    # Opción 1: Usar PuTTY plink si está disponible
    $plinkPath = "C:\Program Files (x86)\PuTTY\plink.exe"
    $puttygenPath = "C:\Program Files (x86)\PuTTY\puttygen.exe"
    
    if (Test-Path $plinkPath) {
        Write-Host "   ✓ Usando PuTTY plink" -ForegroundColor Green
        # Crear sesión con plink
        & $plinkPath -ssh -l $VPS_USER -pw $VPS_PASS $VPS_IP "bash /root/run_deployment.sh"
    }
    else {
        Write-Host "   ℹ PuTTY no encontrado, usando ssh de OpenSSH" -ForegroundColor Yellow
        # Usar ssh directo
        $sshCmd = @"
bash /root/setup_reverse_proxy.sh && bash /root/enable_https.sh
"@
        $sshCmd | ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 $VPS_USER@$VPS_IP "bash"
    }
}
catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

# Limpiar
Remove-Item $tempCmdFile -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ Ejecución remota completada" -ForegroundColor Green
