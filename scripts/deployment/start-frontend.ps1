param([bool]$NoRestart = $false)

$Host.UI.RawUI.WindowTitle = 'Jantetelco - Frontend (Vite)'
$ErrorActionPreference = 'Continue'

Write-Host ''
Write-Host '╔════════════════════════════════════════════════════════════╗' -ForegroundColor Magenta
Write-Host '║       JANTETELCO - SERVIDOR FRONTEND (VITE + REACT)       ║' -ForegroundColor Magenta
Write-Host '╚════════════════════════════════════════════════════════════╝' -ForegroundColor Magenta
Write-Host ''
Write-Host '🚀 Iniciando servidor en http://localhost:5173' -ForegroundColor Green
Write-Host '⚡ Hot Module Replacement (HMR) activo' -ForegroundColor Yellow
Write-Host '🔗 Proxy API: /api/* → http://localhost:4000' -ForegroundColor Yellow
Write-Host '🗺️  Proxy Tiles: /tiles/* → http://localhost:4000' -ForegroundColor Yellow
Write-Host ''
Write-Host '💡 Accede a la aplicación en tu navegador:' -ForegroundColor Magenta
Write-Host '   http://localhost:5173' -ForegroundColor White
Write-Host ''
Write-Host '⌨️  Presiona Ctrl+C para detener el servidor' -ForegroundColor Gray
Write-Host '⌨️  Presiona H + Enter para ver comandos de Vite' -ForegroundColor Gray
Write-Host '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' -ForegroundColor DarkGray
Write-Host ''

Set-Location $PSScriptRoot\client

if ($NoRestart) {
    npm run dev
} else {
    while ($true) {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Iniciando servidor..." -ForegroundColor Magenta
        npm run dev
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -eq 0) {
            Write-Host ''
            Write-Host '✅ Servidor detenido correctamente' -ForegroundColor Green
            break
        } else {
            Write-Host ''
            Write-Host "⚠️  Servidor terminó con código $exitCode" -ForegroundColor Yellow
            Write-Host '🔄 Reiniciando en 3 segundos...' -ForegroundColor Yellow
            Start-Sleep -Seconds 3
        }
    }
}

Write-Host ''
Write-Host 'Presiona Enter para cerrar esta ventana...' -ForegroundColor Gray
Read-Host
