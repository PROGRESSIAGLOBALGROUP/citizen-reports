param([bool]$NoRestart = $false)

$Host.UI.RawUI.WindowTitle = 'Jantetelco - Backend (Express)'
$ErrorActionPreference = 'Continue'

Write-Host ''
Write-Host '╔════════════════════════════════════════════════════════════╗' -ForegroundColor Cyan
Write-Host '║      JANTETELCO - SERVIDOR BACKEND (EXPRESS + SQLite)     ║' -ForegroundColor Cyan
Write-Host '╚════════════════════════════════════════════════════════════╝' -ForegroundColor Cyan
Write-Host ''
Write-Host '🚀 Iniciando servidor en http://localhost:4000' -ForegroundColor Green
Write-Host '📊 Base de datos: SQLite (data.db)' -ForegroundColor Yellow
Write-Host '🔐 Autenticación: Activa' -ForegroundColor Yellow
Write-Host ''
Write-Host '💡 Usuarios de prueba (password: admin123):' -ForegroundColor Magenta
Write-Host '   - admin@jantetelco.gob.mx (Administrador)' -ForegroundColor White
Write-Host '   - supervisor.obras@jantetelco.gob.mx (Supervisor Obras)' -ForegroundColor White
Write-Host '   - func.obras1@jantetelco.gob.mx (Funcionario Obras)' -ForegroundColor White
Write-Host ''
Write-Host '⌨️  Presiona Ctrl+C para detener el servidor' -ForegroundColor Gray
Write-Host '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' -ForegroundColor DarkGray
Write-Host ''

Set-Location $PSScriptRoot\server

if ($NoRestart) {
    node server.js
} else {
    while ($true) {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Iniciando servidor..." -ForegroundColor Cyan
        node server.js
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
