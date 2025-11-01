#!/usr/bin/env pwsh
# =============================================================================
# Jantetelco Server Monitor & Auto-Restart Script
# Evita caídas del servidor con monitoreo automático y reinicio inteligente
# =============================================================================

param(
    [int]$CheckInterval = 30,  # Intervalo de chequeo en segundos
    [int]$MaxRestarts = 5,     # Máximo número de reinicios consecutivos
    [int]$RestartCooldown = 300, # Tiempo de espera tras múltiples reinicios (5 min)
    [switch]$Verbose
)

# Configuración
$PROJECT_ROOT = "C:\PROYECTOS\Jantetelco"
$SERVER_DIR = "$PROJECT_ROOT\server"
$CLIENT_DIR = "$PROJECT_ROOT\client"
$LOG_FILE = "$PROJECT_ROOT\server-monitor.log"
$PID_FILE = "$PROJECT_ROOT\server-monitor.pid"

# URLs para health checks
$BACKEND_URL = "http://localhost:4000/api/reportes/tipos"
$FRONTEND_URL = "http://localhost:5173"

# Contadores globales
$script:BackendRestarts = 0
$script:FrontendRestarts = 0
$script:LastRestartTime = [DateTime]::MinValue

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    # Escribir a archivo y consola
    Add-Content -Path $LOG_FILE -Value $logEntry
    if ($Verbose -or $Level -eq "ERROR" -or $Level -eq "WARN") {
        Write-Host $logEntry -ForegroundColor $(
            switch($Level) {
                "ERROR" { "Red" }
                "WARN" { "Yellow" }
                "INFO" { "Green" }
                default { "White" }
            }
        )
    }
}

function Test-ServiceHealth {
    param([string]$Url, [string]$ServiceName)
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Log "$ServiceName: Healthy (200 OK)" "INFO"
            return $true
        } else {
            Write-Log "$ServiceName: Unhealthy (Status: $($response.StatusCode))" "WARN"
            return $false
        }
    } catch {
        Write-Log "$ServiceName: Unhealthy (Error: $($_.Exception.Message))" "ERROR"
        return $false
    }
}

function Stop-NodeProcesses {
    Write-Log "Stopping all Node.js processes..." "INFO"
    try {
        $processes = Get-Process -Name node -ErrorAction SilentlyContinue
        if ($processes) {
            $processes | Stop-Process -Force
            Start-Sleep -Seconds 3
            Write-Log "Stopped $($processes.Count) Node.js process(es)" "INFO"
        }
    } catch {
        Write-Log "Error stopping Node processes: $($_.Exception.Message)" "ERROR"
    }
}

function Start-BackendServer {
    Write-Log "Starting backend server..." "INFO"
    try {
        Push-Location $SERVER_DIR
        $process = Start-Process -FilePath "node" -ArgumentList "server.js" -PassThru -WindowStyle Hidden
        Start-Sleep -Seconds 5
        
        # Verificar que el proceso siga corriendo
        if ($process -and !$process.HasExited) {
            Write-Log "Backend server started (PID: $($process.Id))" "INFO"
            return $true
        } else {
            Write-Log "Backend server failed to start or exited immediately" "ERROR"
            return $false
        }
    } catch {
        Write-Log "Error starting backend: $($_.Exception.Message)" "ERROR"
        return $false
    } finally {
        Pop-Location
    }
}

function Start-FrontendServer {
    Write-Log "Starting frontend server..." "INFO"
    try {
        Push-Location $CLIENT_DIR
        $process = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -WindowStyle Hidden
        Start-Sleep -Seconds 8
        
        # Verificar que el proceso siga corriendo
        if ($process -and !$process.HasExited) {
            Write-Log "Frontend server started (PID: $($process.Id))" "INFO"
            return $true
        } else {
            Write-Log "Frontend server failed to start or exited immediately" "ERROR"
            return $false
        }
    } catch {
        Write-Log "Error starting frontend: $($_.Exception.Message)" "ERROR"
        return $false
    } finally {
        Pop-Location
    }
}

function Restart-Services {
    param([bool]$RestartBackend = $false, [bool]$RestartFrontend = $false)
    
    # Verificar límite de reinicios
    $timeSinceLastRestart = (Get-Date) - $script:LastRestartTime
    if ($timeSinceLastRestart.TotalSeconds -lt $RestartCooldown -and 
        ($script:BackendRestarts -ge $MaxRestarts -or $script:FrontendRestarts -ge $MaxRestarts)) {
        Write-Log "Too many restarts recently. Waiting for cooldown period..." "WARN"
        return
    }
    
    # Reset counters after cooldown
    if ($timeSinceLastRestart.TotalSeconds -gt $RestartCooldown) {
        $script:BackendRestarts = 0
        $script:FrontendRestarts = 0
    }
    
    Stop-NodeProcesses
    Start-Sleep -Seconds 5
    
    $backendStarted = $false
    $frontendStarted = $false
    
    if ($RestartBackend) {
        $backendStarted = Start-BackendServer
        if ($backendStarted) {
            $script:BackendRestarts++
        }
    }
    
    if ($RestartFrontend) {
        $frontendStarted = Start-FrontendServer
        if ($frontendStarted) {
            $script:FrontendRestarts++
        }
    }
    
    $script:LastRestartTime = Get-Date
    
    # Esperar y verificar servicios
    Start-Sleep -Seconds 10
    
    if ($RestartBackend) {
        $backendHealth = Test-ServiceHealth -Url $BACKEND_URL -ServiceName "Backend"
        if (!$backendHealth) {
            Write-Log "Backend restart failed - service still unhealthy" "ERROR"
        }
    }
    
    if ($RestartFrontend) {
        $frontendHealth = Test-ServiceHealth -Url $FRONTEND_URL -ServiceName "Frontend"
        if (!$frontendHealth) {
            Write-Log "Frontend restart failed - service still unhealthy" "ERROR"
        }
    }
}

function Initialize-Monitor {
    Write-Log "=== Jantetelco Server Monitor Started ===" "INFO"
    Write-Log "Check Interval: $CheckInterval seconds" "INFO"
    Write-Log "Max Restarts: $MaxRestarts" "INFO"
    Write-Log "Restart Cooldown: $RestartCooldown seconds" "INFO"
    
    # Guardar PID del monitor
    $PID | Out-File -FilePath $PID_FILE -Force
    
    # Configurar manejo de señales
    Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
        Write-Log "Monitor shutting down..." "INFO"
        Remove-Item -Path $PID_FILE -ErrorAction SilentlyContinue
    }
}

function Start-Monitoring {
    Initialize-Monitor
    
    # Iniciar servicios si no están corriendo
    $backendHealth = Test-ServiceHealth -Url $BACKEND_URL -ServiceName "Backend"
    $frontendHealth = Test-ServiceHealth -Url $FRONTEND_URL -ServiceName "Frontend"
    
    if (!$backendHealth -or !$frontendHealth) {
        Write-Log "Starting initial services..." "INFO"
        Restart-Services -RestartBackend (!$backendHealth) -RestartFrontend (!$frontendHealth)
    }
    
    # Loop principal de monitoreo
    while ($true) {
        try {
            $backendHealthy = Test-ServiceHealth -Url $BACKEND_URL -ServiceName "Backend"
            $frontendHealthy = Test-ServiceHealth -Url $FRONTEND_URL -ServiceName "Frontend"
            
            $needsBackendRestart = !$backendHealthy
            $needsFrontendRestart = !$frontendHealthy
            
            if ($needsBackendRestart -or $needsFrontendRestart) {
                Write-Log "Unhealthy service(s) detected. Initiating restart..." "WARN"
                Restart-Services -RestartBackend $needsBackendRestart -RestartFrontend $needsFrontendRestart
            }
            
            Start-Sleep -Seconds $CheckInterval
            
        } catch {
            Write-Log "Monitor error: $($_.Exception.Message)" "ERROR"
            Start-Sleep -Seconds $CheckInterval
        }
    }
}

# Verificar dependencias
if (!(Test-Path $SERVER_DIR)) {
    Write-Error "Server directory not found: $SERVER_DIR"
    exit 1
}

if (!(Test-Path $CLIENT_DIR)) {
    Write-Error "Client directory not found: $CLIENT_DIR"
    exit 1
}

# Iniciar monitoreo
try {
    Start-Monitoring
} catch {
    Write-Log "Fatal monitor error: $($_.Exception.Message)" "ERROR"
    exit 1
} finally {
    Remove-Item -Path $PID_FILE -ErrorAction SilentlyContinue
}