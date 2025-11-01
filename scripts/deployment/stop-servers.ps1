# ==============================================================================
# Script de Detención para Jantetelco
# ==============================================================================
# Detiene todos los servidores Node.js de Jantetelco de forma segura
#
# USO: .\stop-servers.ps1
# ==============================================================================

$ErrorActionPreference = "Continue"

function Write-Info($message) {
    Write-Host "ℹ️  $message" -ForegroundColor Cyan
}

function Write-Success($message) {
    Write-Host "✅ $message" -ForegroundColor Green
}

function Write-Warning($message) {
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

Write-Host ''
Write-Host '╔══════════════════════════════════════════════════════════════╗' -ForegroundColor Red
Write-Host '║           🛑 DETENIENDO SERVIDORES JANTETELCO 🛑             ║' -ForegroundColor Red
Write-Host '╚══════════════════════════════════════════════════════════════╝' -ForegroundColor Red
Write-Host ''

Write-Info "Buscando procesos de Node.js en puertos 4000 y 5173..."

# Buscar procesos escuchando en puerto 4000 (backend)
$backend = Get-NetTCPConnection -LocalPort 4000 -State Listen -ErrorAction SilentlyContinue | 
           Select-Object -ExpandProperty OwningProcess -Unique

if ($backend) {
    foreach ($pid in $backend) {
        $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($process) {
            Write-Warning "Deteniendo servidor backend (PID: $pid) - $($process.ProcessName)"
            Stop-Process -Id $pid -Force
            Write-Success "Servidor backend detenido"
        }
    }
} else {
    Write-Info "No hay servidor corriendo en puerto 4000"
}

# Buscar procesos escuchando en puerto 5173 (frontend)
$frontend = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue | 
            Select-Object -ExpandProperty OwningProcess -Unique

if ($frontend) {
    foreach ($pid in $frontend) {
        $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($process) {
            Write-Warning "Deteniendo servidor frontend (PID: $pid) - $($process.ProcessName)"
            Stop-Process -Id $pid -Force
            Write-Success "Servidor frontend detenido"
        }
    }
} else {
    Write-Info "No hay servidor corriendo en puerto 5173"
}

# Buscar procesos de Node.js relacionados con Jantetelco
Write-Host ''
Write-Info "Buscando otros procesos Node.js de Jantetelco..."

$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*Jantetelco*" -or $_.CommandLine -like "*Jantetelco*"
}

if ($nodeProcesses) {
    foreach ($proc in $nodeProcesses) {
        Write-Warning "Deteniendo proceso Node.js (PID: $($proc.Id))"
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Success "Procesos Node.js adicionales detenidos"
} else {
    Write-Info "No se encontraron otros procesos de Jantetelco"
}

Write-Host ''
Write-Host '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' -ForegroundColor Green
Write-Success "Todos los servidores han sido detenidos"
Write-Host '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' -ForegroundColor Green
Write-Host ''
Write-Info "Puedes volver a iniciar con: .\start-dev.ps1"
Write-Host ''
