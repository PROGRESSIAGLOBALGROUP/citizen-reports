#!/usr/bin/env pwsh
# =============================================================================
# Jantetelco Quick Start Script
# Inicio rápido y confiable de los servidores
# =============================================================================

param(
    [switch]$Monitor,      # Iniciar con monitoreo automático
    [switch]$Clean,        # Limpiar caché antes de iniciar
    [switch]$Background,   # Ejecutar en background
    [switch]$Status,       # Solo mostrar status
    [switch]$Stop         # Detener servicios
)

$PROJECT_ROOT = "C:\PROYECTOS\Jantetelco"
$SCRIPTS_DIR = "$PROJECT_ROOT\scripts"

function Write-Status {
    param([string]$Message, [string]$Color = "Cyan")
    Write-Host "🚀 $Message" -ForegroundColor $Color
}

function Start-Services {
    Write-Status "Iniciando servicios de Jantetelco..." "Green"
    
    if ($Clean) {
        Write-Status "Ejecutando limpieza previa..." "Yellow"
        & "$SCRIPTS_DIR\server-recovery.ps1" -CleanStart -Force
    } else {
        Write-Status "Ejecutando recuperación estándar..." "Yellow"
        & "$SCRIPTS_DIR\server-recovery.ps1" -Force
    }
    
    if ($Monitor) {
        Write-Status "Iniciando monitor automático..." "Green"
        if ($Background) {
            Start-Process -FilePath "pwsh" -ArgumentList "-File", "$SCRIPTS_DIR\server-monitor.ps1", "-Verbose" -WindowStyle Hidden
            Write-Status "Monitor iniciado en background" "Green"
        } else {
            & "$SCRIPTS_DIR\server-monitor.ps1" -Verbose
        }
    } else {
        Write-Status "Servicios iniciados. URLs disponibles:" "Green"
        Write-Status "  • Backend API: http://localhost:4000" "Cyan"
        Write-Status "  • Frontend App: http://localhost:5173" "Cyan"
        Write-Status "" "White"
        Write-Status "Para monitoreo automático, ejecuta: .\start-jantetelco.ps1 -Monitor" "Yellow"
    }
}

function Stop-Services {
    Write-Status "Deteniendo servicios..." "Red"
    
    # Detener monitor si está corriendo
    $monitorPid = Get-Content "$PROJECT_ROOT\server-monitor.pid" -ErrorAction SilentlyContinue
    if ($monitorPid) {
        Stop-Process -Id $monitorPid -Force -ErrorAction SilentlyContinue
        Remove-Item "$PROJECT_ROOT\server-monitor.pid" -ErrorAction SilentlyContinue
        Write-Status "Monitor detenido" "Yellow"
    }
    
    # Detener procesos Node
    $nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        $nodeProcesses | Stop-Process -Force
        Write-Status "Procesos Node.js detenidos ($($nodeProcesses.Count))" "Yellow"
    }
    
    Write-Status "Servicios detenidos" "Red"
}

function Show-Status {
    Write-Status "Estado de Jantetelco:" "Cyan"
    & "$SCRIPTS_DIR\server-recovery.ps1" -CheckPorts
}

# Verificar que los scripts existen
if (!(Test-Path "$SCRIPTS_DIR\server-recovery.ps1")) {
    Write-Error "Script de recuperación no encontrado: $SCRIPTS_DIR\server-recovery.ps1"
    exit 1
}

if (!(Test-Path "$SCRIPTS_DIR\server-monitor.ps1")) {
    Write-Error "Script de monitoreo no encontrado: $SCRIPTS_DIR\server-monitor.ps1"
    exit 1
}

# Ejecutar acción solicitada
switch ($true) {
    $Status { Show-Status; break }
    $Stop { Stop-Services; break }
    default { Start-Services }
}

Write-Status "Operación completada." "Green"