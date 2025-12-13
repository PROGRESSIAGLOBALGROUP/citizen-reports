#!/usr/bin/env pwsh
# ============================================================================
# CITIZEN-REPORTS - Start Servers Script
# ============================================================================
# Inicia Backend (Express:4000) y Frontend (Vite:5173) en terminales separadas
# Uso: .\scripts\start-servers.ps1
# ============================================================================

param(
    [switch]$Help,
    [switch]$BackendOnly,
    [switch]$FrontendOnly
)

if ($Help) {
    Write-Host @"
╔════════════════════════════════════════════════════════════════════════════╗
║                    CITIZEN-REPORTS - Start Servers                        ║
╠════════════════════════════════════════════════════════════════════════════╣
║  Uso: .\scripts\start-servers.ps1 [opciones]                              ║
║                                                                            ║
║  Opciones:                                                                 ║
║    -BackendOnly    Solo inicia el servidor backend (puerto 4000)          ║
║    -FrontendOnly   Solo inicia el servidor frontend (puerto 5173)         ║
║    -Help           Muestra esta ayuda                                     ║
║                                                                            ║
║  URLs:                                                                     ║
║    Frontend: http://127.0.0.1:5173                                        ║
║    Backend:  http://localhost:4000                                        ║
║                                                                            ║
║  Credenciales de prueba:                                                  ║
║    admin@jantetelco.gob.mx / admin123                                     ║
╚════════════════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan
    exit 0
}

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         🚀 CITIZEN-REPORTS - Iniciando Servidores              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# Paso 1: Limpiar procesos Node anteriores
# ============================================================================
Write-Host "🛑 Limpiando procesos Node anteriores..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
Write-Host "   ✅ Procesos anteriores terminados" -ForegroundColor Green
Write-Host ""

# ============================================================================
# Paso 2: Iniciar Backend
# ============================================================================
if (-not $FrontendOnly) {
    Write-Host "📦 Iniciando Backend Express (Puerto 4000)..." -ForegroundColor Green
    
    $backendPath = Join-Path $ProjectRoot "server"
    
    # Verificar que existe package.json
    if (-not (Test-Path (Join-Path $backendPath "package.json"))) {
        Write-Host "   ❌ Error: No se encontró package.json en $backendPath" -ForegroundColor Red
        exit 1
    }
    
    # Iniciar backend en nueva ventana de terminal
    Start-Process pwsh -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$backendPath'; Write-Host '🔧 Backend Express - Puerto 4000' -ForegroundColor Cyan; npm run dev"
    ) -WindowStyle Normal
    
    Write-Host "   ✅ Backend iniciando en nueva terminal..." -ForegroundColor Green
    Start-Sleep -Seconds 2
}

# ============================================================================
# Paso 3: Iniciar Frontend
# ============================================================================
if (-not $BackendOnly) {
    Write-Host "⚛️  Iniciando Frontend Vite (Puerto 5173)..." -ForegroundColor Green
    
    $frontendPath = Join-Path $ProjectRoot "client"
    
    # Verificar que existe package.json
    if (-not (Test-Path (Join-Path $frontendPath "package.json"))) {
        Write-Host "   ❌ Error: No se encontró package.json en $frontendPath" -ForegroundColor Red
        exit 1
    }
    
    # Iniciar frontend en nueva ventana de terminal
    Start-Process pwsh -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$frontendPath'; Write-Host '⚛️ Frontend Vite - Puerto 5173' -ForegroundColor Cyan; npm run dev"
    ) -WindowStyle Normal
    
    Write-Host "   ✅ Frontend iniciando en nueva terminal..." -ForegroundColor Green
    Start-Sleep -Seconds 2
}

# ============================================================================
# Paso 4: Verificar que los servidores están respondiendo
# ============================================================================
Write-Host ""
Write-Host "⏳ Esperando que los servidores estén listos..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$maxRetries = 15
$retryCount = 0
$backendReady = $false

while (-not $backendReady -and $retryCount -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4000/api/whitelabel/config" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $backendReady = $true
        }
    } catch {
        $retryCount++
        if ($retryCount -le 5) {
            Write-Host "   ⏳ Iniciando backend..." -ForegroundColor Gray
        } else {
            Write-Host "   Intento $retryCount/$maxRetries..." -ForegroundColor Gray
        }
        Start-Sleep -Seconds 1
    }
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    ✅ SERVIDORES LISTOS                        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

if ($backendReady) {
    Write-Host "   📍 Backend:  http://localhost:4000      ✅ Respondiendo" -ForegroundColor Cyan
} else {
    Write-Host "   📍 Backend:  http://localhost:4000      ⚠️ Verificar terminal" -ForegroundColor Yellow
}

Write-Host "   📍 Frontend: http://127.0.0.1:5173      🔄 Listo" -ForegroundColor Cyan
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║  🔑 Credenciales de prueba:                                    ║" -ForegroundColor Magenta
Write-Host "║     Email:    admin@jantetelco.gob.mx                          ║" -ForegroundColor White
Write-Host "║     Password: admin123                                         ║" -ForegroundColor White
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""
Write-Host "💡 Tip: Los servidores corren en terminales separadas." -ForegroundColor Gray
Write-Host "        Cierra esas ventanas para detenerlos." -ForegroundColor Gray
Write-Host ""
