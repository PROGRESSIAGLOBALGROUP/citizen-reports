#!/usr/bin/env pwsh
# Script deployment remoto - PowerShell compatible

param(
    [string]$VpsIp = "145.79.0.77",
    [string]$VpsUser = "root",
    [string]$VpsPass = "#M3YBmUDK+C,iQM3tn4t"
)

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "   DEPLOYMENT NGINX + HTTPS" -ForegroundColor Green
Write-Host "   VPS: $VpsIp" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# El script que se ejecutará EN el VPS
$remoteScript = @'
#!/bin/bash
set -euo pipefail

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  DEPLOYMENT EJECUTÁNDOSE EN VPS 145.79.0.77                    ║"
echo "║  Tiempo: $(date '+%Y-%m-%d %H:%M:%S')                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Verificar que los scripts existen
if [ ! -f /root/setup_reverse_proxy.sh ]; then
    echo "❌ Error: /root/setup_reverse_proxy.sh no encontrado"
    exit 1
fi

if [ ! -f /root/enable_https.sh ]; then
    echo "❌ Error: /root/enable_https.sh no encontrado"
    exit 1
fi

echo "✓ Scripts encontrados"
echo ""

# PASO 1: Instalar Nginx
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "▶ PASO 1/2: Instalando Nginx + Certbot..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if bash /root/setup_reverse_proxy.sh; then
    echo ""
    echo "✅ PASO 1 COMPLETADO: Nginx instalado y configurado"
    PASO1_OK=1
else
    echo ""
    echo "❌ PASO 1 FALLÓ"
    PASO1_OK=0
fi

echo ""

# PASO 2: Emitir HTTPS
if [ $PASO1_OK -eq 1 ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "▶ PASO 2/2: Emitiendo certificado HTTPS..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    if bash /root/enable_https.sh; then
        echo ""
        echo "✅ PASO 2 COMPLETADO: Certificado HTTPS emitido"
        PASO2_OK=1
    else
        echo ""
        echo "❌ PASO 2 FALLÓ"
        PASO2_OK=0
    fi
fi

# VERIFICACIONES
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "▶ VERIFICACIONES FINALES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "1️⃣  Verificando Nginx..."
if sudo nginx -t 2>&1 | grep -q "syntax is ok"; then
    echo "   ✅ Nginx sintaxis válida"
else
    echo "   ⚠️  Verificar sintaxis"
fi
echo ""

echo "2️⃣  Verificando Nginx status..."
if sudo systemctl is-active nginx > /dev/null; then
    echo "   ✅ Nginx RUNNING"
else
    echo "   ❌ Nginx NO RUNNING"
fi
echo ""

echo "3️⃣  Verificando certificado..."
if sudo certbot certificates 2>/dev/null | grep -q "reportes.progressiagroup.com"; then
    echo "   ✅ Certificado PRESENTE"
    sudo certbot certificates | grep -A1 "Certificate Name: reportes"
else
    echo "   ⚠️  Certificado no encontrado (puede ser normal si requiere DNS)"
fi
echo ""

echo "4️⃣  Verificando puertos..."
if sudo ss -tlnp 2>/dev/null | grep -qE ':(80|443)'; then
    echo "   ✅ Puertos 80/443 abiertos"
    sudo ss -tlnp 2>/dev/null | grep -E ':(80|443)' | sed 's/^/   /'
else
    echo "   ⚠️  Puertos no listening"
fi
echo ""

# RESUMEN FINAL
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $PASO1_OK -eq 1 ] && [ $PASO2_OK -eq 1 ]; then
    echo "✅ ¡DEPLOYMENT EXITOSO!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo "⚠️  Deployment completado con advertencias"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi

echo ""
echo "PRÓXIMOS PASOS:"
echo "  1. Verificar DNS: dig reportes.progressiagroup.com"
echo "  2. Test HTTP: curl -I http://reportes.progressiagroup.com"
echo "  3. Test HTTPS: curl -I https://reportes.progressiagroup.com"
echo "  4. Abre navegador: https://reportes.progressiagroup.com"
echo ""
echo "Logs disponibles:"
echo "  tail -f /var/log/nginx/reportes.progressiagroup.com.error.log"
echo "  sudo journalctl -u nginx -f"
echo ""
'@

Write-Host "📤 Copiando scripts al VPS..." -ForegroundColor Cyan
Write-Host ""

# Copiar archivos
Write-Host "   Copiando setup_reverse_proxy.sh..." -ForegroundColor Gray
scp c:\PROYECTOS\Jantetelco\scripts\setup_reverse_proxy.sh root@145.79.0.77:/root/ 2>&1 | Select-String -Pattern "100%", "error"

Write-Host "   Copiando enable_https.sh..." -ForegroundColor Gray
scp c:\PROYECTOS\Jantetelco\scripts\enable_https.sh root@145.79.0.77:/root/ 2>&1 | Select-String -Pattern "100%", "error"

Write-Host ""

# Hacer ejecutables
Write-Host "🔧 Preparando scripts..." -ForegroundColor Cyan
ssh root@145.79.0.77 "chmod +x /root/setup_reverse_proxy.sh /root/enable_https.sh" 2>&1 | Select-String -Pattern "error"

Write-Host ""

# Ejecutar deployment
Write-Host "▶️  Iniciando deployment remoto..." -ForegroundColor Cyan
Write-Host ""

# Guardar script remoto en un archivo temporal en el VPS y ejecutarlo
$tempScriptName = "deploy_$([guid]::NewGuid().toString().substring(0,8)).sh"
Write-Host "   Script temporal: $tempScriptName" -ForegroundColor Gray

# Crear el script en el VPS (heredoc mediante ssh)
ssh root@145.79.0.77 @"
cat > /tmp/$tempScriptName << 'SCRIPT_EOF'
$remoteScript
SCRIPT_EOF
chmod +x /tmp/$tempScriptName
bash /tmp/$tempScriptName
SCRIPT_EOF
"@

Write-Host ""
Write-Host "✅ Deployment completado" -ForegroundColor Green
Write-Host ""
