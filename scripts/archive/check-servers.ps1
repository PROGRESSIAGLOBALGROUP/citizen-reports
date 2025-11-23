# Script de Verificación de Servidores Jantetelco

$ErrorActionPreference = "Continue"

Write-Host ''
Write-Host '═══════════════════════════════════════════════════════════' -ForegroundColor Cyan
Write-Host '  VERIFICACIÓN DE SERVIDORES JANTETELCO' -ForegroundColor Cyan
Write-Host '═══════════════════════════════════════════════════════════' -ForegroundColor Cyan
Write-Host ''

# Verificar puerto 4000 (Backend)
$backend = netstat -ano | Select-String ":4000.*LISTENING"
if ($backend) {
    Write-Host '✅ Backend corriendo en puerto 4000' -ForegroundColor Green
    $backend | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
} else {
    Write-Host '❌ Backend NO está corriendo en puerto 4000' -ForegroundColor Red
}

Write-Host ''

# Verificar puerto 5173 (Frontend)
$frontend = netstat -ano | Select-String ":5173.*LISTENING"
if ($frontend) {
    Write-Host '✅ Frontend corriendo en puerto 5173' -ForegroundColor Green
    $frontend | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
} else {
    Write-Host '❌ Frontend NO está corriendo en puerto 5173' -ForegroundColor Red
}

Write-Host ''
Write-Host '═══════════════════════════════════════════════════════════' -ForegroundColor Cyan
Write-Host ''

if ($backend -and $frontend) {
    Write-Host '🎉 Ambos servidores están corriendo correctamente!' -ForegroundColor Green
    Write-Host ''
    Write-Host '🌐 Accede a la aplicación en:' -ForegroundColor Cyan
    Write-Host '   http://localhost:5173' -ForegroundColor Yellow
    Write-Host ''
    Write-Host '📚 API Backend disponible en:' -ForegroundColor Cyan
    Write-Host '   http://localhost:4000/api' -ForegroundColor Yellow
} elseif ($backend -or $frontend) {
    Write-Host '⚠️  Solo un servidor está corriendo' -ForegroundColor Yellow
    Write-Host 'Ejecuta: .\start-dev.ps1' -ForegroundColor White
} else {
    Write-Host '❌ Ningún servidor está corriendo' -ForegroundColor Red
    Write-Host ''
    Write-Host '🚀 Para iniciar los servidores ejecuta:' -ForegroundColor Cyan
    Write-Host '   .\start-dev.ps1' -ForegroundColor Yellow
}

Write-Host ''
