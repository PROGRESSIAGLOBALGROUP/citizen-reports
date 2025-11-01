# ==============================================================================
# Script Simple de Inicio - Jantetelco
# ==============================================================================
# Versión simplificada que inicia los servidores directamente
# ==============================================================================

$ErrorActionPreference = "Stop"

function Write-Info($message) {
    Write-Host "ℹ️  $message" -ForegroundColor Cyan
}

function Write-Success($message) {
    Write-Host "✅ $message" -ForegroundColor Green
}

function Write-Error($message) {
    Write-Host "❌ $message" -ForegroundColor Red
}

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Success "Node.js detectado: $nodeVersion"
} catch {
    Write-Error "Node.js no está instalado"
    exit 1
}

$projectRoot = $PSScriptRoot

# Verificar dependencias backend
if (-not (Test-Path "$projectRoot\server\node_modules")) {
    Write-Info "Instalando dependencias del servidor..."
    Push-Location "$projectRoot\server"
    npm install
    Pop-Location
}

# Verificar dependencias frontend  
if (-not (Test-Path "$projectRoot\client\node_modules")) {
    Write-Info "Instalando dependencias del cliente..."
    Push-Location "$projectRoot\client"
    npm install
    Pop-Location
}

# Verificar base de datos
if (-not (Test-Path "$projectRoot\server\data.db")) {
    Write-Info "Inicializando base de datos..."
    Push-Location "$projectRoot\server"
    npm run init
    Pop-Location
}

Write-Host ''
Write-Host '╔══════════════════════════════════════════════════════════════╗' -ForegroundColor White
Write-Host '║          🗺️  INICIANDO JANTETELCO SERVIDORES 🗺️             ║' -ForegroundColor White
Write-Host '╚══════════════════════════════════════════════════════════════╝' -ForegroundColor White
Write-Host ''

# Iniciar backend en nueva ventana
Write-Info "Iniciando backend en nueva ventana..."
$backendCmd = "cd '$projectRoot\server'; node server.js"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

Start-Sleep -Seconds 3

# Iniciar frontend en nueva ventana
Write-Info "Iniciando frontend en nueva ventana..."
$frontendCmd = "cd '$projectRoot\client'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Start-Sleep -Seconds 2

Write-Host ''
Write-Host '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' -ForegroundColor Green
Write-Success "Servidores iniciados en ventanas separadas!"
Write-Host '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' -ForegroundColor Green
Write-Host ''
Write-Host '🌐 Frontend: ' -NoNewline -ForegroundColor Cyan
Write-Host 'http://localhost:5173' -ForegroundColor Yellow
Write-Host '📚 Backend: ' -NoNewline -ForegroundColor Cyan
Write-Host 'http://localhost:4000' -ForegroundColor Yellow
Write-Host ''
Write-Host '🔐 Credenciales de prueba:' -ForegroundColor Magenta
Write-Host '   Email: admin@jantetelco.gob.mx' -ForegroundColor White
Write-Host '   Password: admin123' -ForegroundColor White
Write-Host ''
Write-Warning "Para detener: Usa Ctrl+C en cada ventana o ejecuta .\stop-servers.ps1"
Write-Host ''
Write-Host 'Presiona Enter para cerrar este launcher (los servidores seguirán corriendo)...' -ForegroundColor Gray
Read-Host
