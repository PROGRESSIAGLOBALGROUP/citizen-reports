# ==============================================================================
# Script de Inicio para Jantetelco - Producción
# ==============================================================================
# Inicia el servidor en modo producción (sirve tanto API como SPA compilado)
#
# USO: .\start-prod.ps1
# ==============================================================================

param(
    [switch]$Build,      # Recompila el frontend antes de iniciar
    [switch]$NoRestart   # Deshabilita el reinicio automático
)

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "Jantetelco - Producción"

function Write-Info($message) {
    Write-Host "ℹ️  $message" -ForegroundColor Cyan
}

function Write-Success($message) {
    Write-Host "✅ $message" -ForegroundColor Green
}

function Write-Error($message) {
    Write-Host "❌ $message" -ForegroundColor Red
}

function Write-Warning($message) {
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

# ==============================================================================
# VERIFICACIONES INICIALES
# ==============================================================================

Write-Info "Verificando entorno de producción..."

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Verificar estructura
if (-not (Test-Path "$projectRoot\server\server.js")) {
    Write-Error "No se encuentra server/server.js"
    exit 1
}

# Verificar que el frontend esté compilado
if (-not (Test-Path "$projectRoot\client\dist\index.html") -or $Build) {
    if ($Build) {
        Write-Info "Opción -Build activada. Recompilando frontend..."
    } else {
        Write-Warning "Frontend no compilado. Compilando..."
    }
    
    Push-Location "$projectRoot\client"
    Write-Info "Ejecutando: npm run build"
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error al compilar el frontend"
        Pop-Location
        exit 1
    }
    Pop-Location
    Write-Success "Frontend compilado correctamente"
} else {
    Write-Success "Frontend ya compilado (usa -Build para recompilar)"
}

# Verificar base de datos
if (-not (Test-Path "$projectRoot\server\data.db")) {
    Write-Warning "Base de datos no existe. Inicializando..."
    Push-Location "$projectRoot\server"
    npm run init
    Pop-Location
    Write-Success "Base de datos inicializada"
}

# ==============================================================================
# CONFIGURACIÓN
# ==============================================================================

$env:NODE_ENV = "production"
$env:PORT = "4000"

Write-Host ''
Write-Host '╔══════════════════════════════════════════════════════════════╗' -ForegroundColor White
Write-Host '║                                                              ║' -ForegroundColor White
Write-Host '║          🗺️  JANTETELCO - MODO PRODUCCIÓN 🗺️                 ║' -ForegroundColor White
Write-Host '║                                                              ║' -ForegroundColor White
Write-Host '╚══════════════════════════════════════════════════════════════╝' -ForegroundColor White
Write-Host ''
Write-Host '🚀 Puerto: ' -NoNewline -ForegroundColor Cyan
Write-Host "4000" -ForegroundColor Yellow
Write-Host '📦 Modo: ' -NoNewline -ForegroundColor Cyan
Write-Host "Producción (SPA + API en un solo proceso)" -ForegroundColor Yellow
Write-Host '🗄️  Base de datos: ' -NoNewline -ForegroundColor Cyan
Write-Host "SQLite (data.db)" -ForegroundColor Yellow
Write-Host ''
Write-Host '🌐 Accede a la aplicación en: ' -NoNewline -ForegroundColor Green
Write-Host 'http://localhost:4000' -ForegroundColor Yellow -BackgroundColor DarkGreen
Write-Host ''
Write-Host '⌨️  Presiona Ctrl+C para detener' -ForegroundColor Gray
Write-Host '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' -ForegroundColor DarkGray
Write-Host ''

Set-Location "$projectRoot\server"

# ==============================================================================
# INICIO DEL SERVIDOR
# ==============================================================================

if ($NoRestart) {
    # Modo simple: un solo intento
    node server.js
} else {
    # Modo con reinicio automático
    while ($true) {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Iniciando servidor..." -ForegroundColor Cyan
        
        node server.js
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -eq 0) {
            Write-Host ''
            Write-Success "Servidor detenido correctamente"
            break
        } else {
            Write-Host ''
            Write-Warning "Servidor terminó con código $exitCode"
            Write-Host '🔄 Reiniciando en 5 segundos... (Ctrl+C para cancelar)' -ForegroundColor Yellow
            Start-Sleep -Seconds 5
        }
    }
}

Write-Host ''
Write-Host 'Presiona Enter para salir...' -ForegroundColor Gray
Read-Host
