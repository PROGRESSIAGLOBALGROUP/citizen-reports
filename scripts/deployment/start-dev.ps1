# ==============================================================================
# Script de Inicio para Jantetelco - Desarrollo
# ==============================================================================
# Inicia backend (Express) y frontend (Vite) en ventanas separadas persistentes
# Los servidores se reinician automáticamente si hay errores recuperables
#
# USO: .\start-dev.ps1
# ==============================================================================

param(
    [switch]$NoRestart,  # Deshabilita el reinicio automático
    [switch]$Verbose     # Muestra logs detallados
)

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "Jantetelco - Launcher"

# Colores para mensajes
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Info($message) {
    Write-ColorOutput Cyan "ℹ️  $message"
}

function Write-Success($message) {
    Write-ColorOutput Green "✅ $message"
}

function Write-Error($message) {
    Write-ColorOutput Red "❌ $message"
}

function Write-Warning($message) {
    Write-ColorOutput Yellow "⚠️  $message"
}

# ==============================================================================
# VERIFICACIONES INICIALES
# ==============================================================================

Write-Info "Verificando entorno..."

# Verificar que Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Success "Node.js detectado: $nodeVersion"
} catch {
    Write-Error "Node.js no está instalado o no está en el PATH"
    Write-Info "Descarga Node.js desde: https://nodejs.org/"
    exit 1
}

# Verificar que estamos en el directorio correcto
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not (Test-Path "$projectRoot\server\server.js")) {
    Write-Error "No se encuentra server/server.js"
    Write-Info "Asegúrate de ejecutar este script desde la raíz del proyecto"
    exit 1
}

if (-not (Test-Path "$projectRoot\client\package.json")) {
    Write-Error "No se encuentra client/package.json"
    exit 1
}

Write-Success "Estructura del proyecto verificada"

# Verificar dependencias
Write-Info "Verificando dependencias del servidor..."
if (-not (Test-Path "$projectRoot\server\node_modules")) {
    Write-Warning "Dependencias del servidor no instaladas. Instalando..."
    Push-Location "$projectRoot\server"
    npm install
    Pop-Location
}

Write-Info "Verificando dependencias del cliente..."
if (-not (Test-Path "$projectRoot\client\node_modules")) {
    Write-Warning "Dependencias del cliente no instaladas. Instalando..."
    Push-Location "$projectRoot\client"
    npm install
    Pop-Location
}

Write-Success "Dependencias verificadas"

# Verificar base de datos
Write-Info "Verificando base de datos..."
if (-not (Test-Path "$projectRoot\server\data.db")) {
    Write-Warning "Base de datos no existe. Inicializando..."
    Push-Location "$projectRoot\server"
    npm run init
    Pop-Location
    Write-Success "Base de datos inicializada con usuarios de prueba"
}

# ==============================================================================
# FUNCIONES DE INICIO
# ==============================================================================

function Start-Backend {
    # Crear script temporal para backend
    $backendScriptPath = "$projectRoot\start-backend.ps1"
    
    $scriptContent = @'
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
'@

    Set-Content -Path $backendScriptPath -Value $scriptContent -Encoding UTF8
    
    $restartArg = if ($NoRestart) { "-NoRestart `$true" } else { "" }
    Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", "& '$backendScriptPath' $restartArg"
    Write-Success "Servidor backend iniciado en nueva ventana"
}

function Start-Frontend {
    # Crear script temporal para frontend
    $frontendScriptPath = "$projectRoot\start-frontend.ps1"
    
    $scriptContent = @'
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
'@

    Set-Content -Path $frontendScriptPath -Value $scriptContent -Encoding UTF8
    
    $restartArg = if ($NoRestart) { "-NoRestart `$true" } else { "" }
    Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", "& '$frontendScriptPath' $restartArg"
    Write-Success "Servidor frontend iniciado en nueva ventana"
}

# ==============================================================================
# INICIO PRINCIPAL
# ==============================================================================

Write-Host ''
Write-Host '╔══════════════════════════════════════════════════════════════╗' -ForegroundColor White
Write-Host '║                                                              ║' -ForegroundColor White
Write-Host '║              🗺️  JANTETELCO HEATMAP PLATFORM 🗺️              ║' -ForegroundColor White
Write-Host '║                                                              ║' -ForegroundColor White
Write-Host '║           Sistema de Reportes Ciudadanos Geo-referenciados  ║' -ForegroundColor White
Write-Host '║                                                              ║' -ForegroundColor White
Write-Host '╚══════════════════════════════════════════════════════════════╝' -ForegroundColor White
Write-Host ''

Write-Info "Iniciando servidores..."
Write-Host ''

# Iniciar backend
Start-Backend
Start-Sleep -Seconds 2

# Iniciar frontend
Start-Frontend
Start-Sleep -Seconds 2

Write-Host ''
Write-Host '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' -ForegroundColor Green
Write-Success "Ambos servidores iniciados exitosamente!"
Write-Host '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' -ForegroundColor Green
Write-Host ''
Write-Host '🌐 Abre tu navegador en: ' -NoNewline -ForegroundColor Cyan
Write-Host 'http://localhost:5173' -ForegroundColor Yellow
Write-Host ''
Write-Host '📚 Backend API disponible en: ' -NoNewline -ForegroundColor Cyan
Write-Host 'http://localhost:4000/api' -ForegroundColor Yellow
Write-Host ''
Write-Host '🔐 Credenciales de prueba:' -ForegroundColor Magenta
Write-Host '   Email: ' -NoNewline -ForegroundColor White
Write-Host 'admin@jantetelco.gob.mx' -ForegroundColor Yellow
Write-Host '   Password: ' -NoNewline -ForegroundColor White
Write-Host 'admin123' -ForegroundColor Yellow
Write-Host ''

if (-not $NoRestart) {
    Write-Info "Los servidores se reiniciarán automáticamente si hay errores"
}

Write-Host ''
Write-Warning "Para detener los servidores:"
Write-Host '   1. Ve a cada ventana de terminal' -ForegroundColor Gray
Write-Host '   2. Presiona Ctrl+C' -ForegroundColor Gray
Write-Host '   3. O cierra las ventanas directamente' -ForegroundColor Gray
Write-Host ''
Write-Host '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' -ForegroundColor DarkGray
Write-Host ''
Write-Info "Este launcher permanecerá abierto. Puedes cerrarlo si no lo necesitas."
Write-Host ''

# Esperar entrada del usuario para mantener la ventana abierta
Write-Host 'Presiona Enter para cerrar este launcher (los servidores seguirán corriendo)...' -ForegroundColor Gray
Read-Host
