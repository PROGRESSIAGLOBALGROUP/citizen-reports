# Script de limpieza: Libera el puerto 4000 si está ocupado
# Uso: .\cleanup-port.ps1

$port = 4000

Write-Host "🔍 Verificando puerto $port..." -ForegroundColor Cyan

try {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction Stop
    $processId = $connection.OwningProcess
    
    if ($processId) {
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        
        if ($process) {
            Write-Host "⚠️  Puerto $port está ocupado por:" -ForegroundColor Yellow
            Write-Host "   PID: $processId" -ForegroundColor Yellow
            Write-Host "   Proceso: $($process.ProcessName)" -ForegroundColor Yellow
            Write-Host "   Inicio: $($process.StartTime)" -ForegroundColor Yellow
            
            Write-Host "`n🧹 Deteniendo proceso..." -ForegroundColor Cyan
            Stop-Process -Id $processId -Force -ErrorAction Stop
            
            Start-Sleep -Milliseconds 500
            
            Write-Host "✅ Puerto $port liberado exitosamente" -ForegroundColor Green
        }
    }
}
catch {
    if ($_.Exception.Message -like "*No MSFT_NetTCPConnection objects found*") {
        Write-Host "✅ Puerto $port ya está libre" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
