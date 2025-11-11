#!/usr/bin/env pwsh

# Esperar a que VPS esté completamente online y verificar estado

$VPS = "145.79.0.77"
$maxAttempts = 60  # 5 minutos con intervalo de 5 segundos
$interval = 5

Write-Host "🔄 Monitoreando VPS $VPS`n" -ForegroundColor Cyan

for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] Intento $attempt/$maxAttempts..." -ForegroundColor Yellow
    
    try {
        $result = ssh -o ConnectTimeout=3 root@$VPS "echo OK" 2>&1
        if ($result -eq "OK") {
            Write-Host "`n✅ VPS ONLINE!`n" -ForegroundColor Green
            
            # Ahora verificar estado
            Write-Host "📋 Verificando estado..." -ForegroundColor Cyan
            Write-Host ""
            
            ssh root@$VPS @"
echo "=== NGINX STATUS ==="
sudo systemctl status nginx | head -3
echo ""
echo "=== CERTIFICADOS ==="
sudo certbot certificates 2>&1 | grep -A 3 "reportes"
echo ""
echo "=== ESCUCHANDO EN ==="
sudo netstat -tlnp 2>/dev/null | grep -E "80|443" || echo "netstat error, probando con ss..."
sudo ss -tlnp 2>/dev/null | grep -E "80|443"
"@
            break
        }
    }
    catch {
        # Continuar
    }
    
    if ($attempt -lt $maxAttempts) {
        Write-Host "  ⏳ Esperando $interval segundos..." -ForegroundColor Gray
        Start-Sleep -Seconds $interval
    }
}

if ($attempt -gt $maxAttempts) {
    Write-Host "`n❌ VPS no respondió después de 5 minutos`n" -ForegroundColor Red
    Write-Host "Acciones:" -ForegroundColor Yellow
    Write-Host "  1. Verifica que el reinicio manual se completó"
    Write-Host "  2. Prueba: ping 145.79.0.77"
    Write-Host "  3. Verifica el status en el panel de control"
    Write-Host "  4. Intenta SSH manualmente: ssh root@145.79.0.77"
}
