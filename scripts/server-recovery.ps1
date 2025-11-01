#!/usr/bin/env pwsh
# =============================================================================
# Jantetelco Server Recovery Script
# Maneja errores específicos y recuperación avanzada
# =============================================================================

param(
    [switch]$Force,
    [switch]$CleanStart,
    [switch]$CheckPorts
)

$PROJECT_ROOT = "C:\PROYECTOS\Jantetelco"
$REQUIRED_PORTS = @(4000, 5173)
$LOG_FILE = "$PROJECT_ROOT\server-recovery.log"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    Add-Content -Path $LOG_FILE -Value $logEntry
    Write-Host $logEntry -ForegroundColor $(
        switch($Level) {
            "ERROR" { "Red" }
            "WARN" { "Yellow" }
            "SUCCESS" { "Green" }
            default { "Cyan" }
        }
    )
}

function Test-PortAvailability {
    param([int]$Port)
    
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
        return !$connection
    } catch {
        return $true  # Si hay error, asumimos que está disponible
    }
}

function Clear-PortConflicts {
    Write-Log "Checking for port conflicts..." "INFO"
    
    foreach ($port in $REQUIRED_PORTS) {
        try {
            $processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | 
                         Select-Object -ExpandProperty OwningProcess -Unique
            
            if ($processes) {
                foreach ($processId in $processes) {
                    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                    if ($process) {
                        Write-Log "Killing process using port ${port}: $($process.ProcessName) (PID: $processId)" "WARN"
                        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                    }
                }
            }
        } catch {
            Write-Log "Error checking port $port`: $($_.Exception.Message)" "ERROR"
        }
    }
    
    Start-Sleep -Seconds 3
}

function Clear-NodeModulesCache {
    Write-Log "Clearing Node.js cache and temporary files..." "INFO"
    
    # Limpiar caché de npm
    try {
        npm cache clean --force 2>$null
        Write-Log "NPM cache cleared" "SUCCESS"
    } catch {
        Write-Log "Could not clear NPM cache: $($_.Exception.Message)" "WARN"
    }
    
    # Limpiar node_modules/.cache si existe
    $cacheDirs = @(
        "$PROJECT_ROOT\client\node_modules\.cache",
        "$PROJECT_ROOT\server\node_modules\.cache"
    )
    
    foreach ($cacheDir in $cacheDirs) {
        if (Test-Path $cacheDir) {
            try {
                Remove-Item -Path $cacheDir -Recurse -Force
                Write-Log "Cleared cache directory: $cacheDir" "SUCCESS"
            } catch {
                Write-Log "Could not clear $cacheDir`: $($_.Exception.Message)" "WARN"
            }
        }
    }
}

function Test-Dependencies {
    Write-Log "Checking project dependencies..." "INFO"
    
    $errors = @()
    
    # Verificar Node.js
    try {
        $nodeVersion = node --version 2>$null
        Write-Log "Node.js version: $nodeVersion" "SUCCESS"
    } catch {
        $errors += "Node.js not found or not working"
    }
    
    # Verificar NPM
    try {
        $npmVersion = npm --version 2>$null
        Write-Log "NPM version: $npmVersion" "SUCCESS"
    } catch {
        $errors += "NPM not found or not working"
    }
    
    # Verificar archivos críticos
    $criticalFiles = @(
        "$PROJECT_ROOT\server\server.js",
        "$PROJECT_ROOT\server\package.json",
        "$PROJECT_ROOT\client\package.json",
        "$PROJECT_ROOT\client\vite.config.js"
    )
    
    foreach ($file in $criticalFiles) {
        if (!(Test-Path $file)) {
            $errors += "Missing critical file: $file"
        }
    }
    
    if ($errors.Count -gt 0) {
        Write-Log "Dependency check failed:" "ERROR"
        foreach ($error in $errors) {
            Write-Log "  - $error" "ERROR"
        }
        return $false
    }
    
    Write-Log "All dependencies check passed" "SUCCESS"
    return $true
}

function Repair-DatabaseConnection {
    Write-Log "Checking database connectivity..." "INFO"
    
    $dbFiles = @(
        "$PROJECT_ROOT\server\data.db",
        "$PROJECT_ROOT\server\e2e.db"
    )
    
    foreach ($dbFile in $dbFiles) {
        if (Test-Path $dbFile) {
            try {
                # Verificar que el archivo no esté corrupto
                $fileInfo = Get-Item $dbFile
                if ($fileInfo.Length -eq 0) {
                    Write-Log "Database file is empty: $dbFile" "ERROR"
                    # Aquí podrías implementar restauración desde backup
                } else {
                    Write-Log "Database file OK: $dbFile ($($fileInfo.Length) bytes)" "SUCCESS"
                }
            } catch {
                Write-Log "Error checking database file $dbFile`: $($_.Exception.Message)" "ERROR"
            }
        } else {
            Write-Log "Database file missing: $dbFile" "WARN"
            # Intentar reinicializar
            if ($dbFile -like "*data.db") {
                Write-Log "Attempting to reinitialize main database..." "INFO"
                Push-Location "$PROJECT_ROOT\server"
                try {
                    npm run init 2>$null
                    Write-Log "Database reinitialized successfully" "SUCCESS"
                } catch {
                    Write-Log "Failed to reinitialize database" "ERROR"
                } finally {
                    Pop-Location
                }
            }
        }
    }
}

function Start-CleanRecovery {
    Write-Log "=== Starting Clean Recovery Process ===" "INFO"
    
    # 1. Detener todos los procesos
    Write-Log "Step 1: Stopping all Node processes..." "INFO"
    Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 5
    
    # 2. Limpiar conflictos de puertos
    Write-Log "Step 2: Clearing port conflicts..." "INFO"
    Clear-PortConflicts
    
    # 3. Limpiar cachés si se solicita
    if ($CleanStart) {
        Write-Log "Step 3: Cleaning caches..." "INFO"
        Clear-NodeModulesCache
    }
    
    # 4. Verificar dependencias
    Write-Log "Step 4: Testing dependencies..." "INFO"
    if (!(Test-Dependencies)) {
        Write-Log "Dependency check failed. Cannot proceed." "ERROR"
        return $false
    }
    
    # 5. Reparar base de datos
    Write-Log "Step 5: Checking database..." "INFO"
    Repair-DatabaseConnection
    
    # 6. Iniciar servicios
    Write-Log "Step 6: Starting services..." "INFO"
    
    # Iniciar backend
    Push-Location "$PROJECT_ROOT\server"
    try {
        Write-Log "Starting backend server..." "INFO"
        Start-Process -FilePath "node" -ArgumentList "server.js" -WindowStyle Hidden
        Start-Sleep -Seconds 8
        
        # Verificar backend
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:4000/api/reportes/tipos" -UseBasicParsing -TimeoutSec 10
            Write-Log "Backend server is responding (Status: $($response.StatusCode))" "SUCCESS"
        } catch {
            Write-Log "Backend server not responding: $($_.Exception.Message)" "ERROR"
        }
    } finally {
        Pop-Location
    }
    
    # Iniciar frontend
    Push-Location "$PROJECT_ROOT\client"
    try {
        Write-Log "Starting frontend server..." "INFO"
        Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Hidden
        Start-Sleep -Seconds 10
        
        # Verificar frontend
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 10
            Write-Log "Frontend server is responding (Status: $($response.StatusCode))" "SUCCESS"
        } catch {
            Write-Log "Frontend server not responding: $($_.Exception.Message)" "ERROR"
        }
    } finally {
        Pop-Location
    }
    
    Write-Log "=== Recovery Process Complete ===" "SUCCESS"
    Write-Log "Backend: http://localhost:4000" "INFO"
    Write-Log "Frontend: http://localhost:5173" "INFO"
    
    return $true
}

function Show-SystemStatus {
    Write-Log "=== Jantetelco System Status ===" "INFO"
    
    # Verificar procesos Node
    $nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
    Write-Log "Node.js processes running: $($nodeProcesses.Count)" "INFO"
    
    # Verificar puertos
    foreach ($port in $REQUIRED_PORTS) {
        $isAvailable = Test-PortAvailability -Port $port
        $status = if ($isAvailable) { "Available" } else { "In Use" }
        Write-Log "Port $port`: $status" "INFO"
    }
    
    # Verificar servicios
    try {
        $backendResponse = Invoke-WebRequest -Uri "http://localhost:4000/api/reportes/tipos" -UseBasicParsing -TimeoutSec 5
        Write-Log "Backend API: Healthy (Status: $($backendResponse.StatusCode))" "SUCCESS"
    } catch {
        Write-Log "Backend API: Unhealthy ($($_.Exception.Message))" "ERROR"
    }
    
    try {
        $frontendResponse = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 5
        Write-Log "Frontend: Healthy (Status: $($frontendResponse.StatusCode))" "SUCCESS"
    } catch {
        Write-Log "Frontend: Unhealthy ($($_.Exception.Message))" "ERROR"
    }
}

# Main execution
if ($CheckPorts) {
    Show-SystemStatus
    exit 0
}

if ($Force -or $CleanStart -or 
    (Read-Host "Start clean recovery process? (y/N)") -eq 'y') {
    
    $success = Start-CleanRecovery
    if (!$success) {
        Write-Log "Recovery process failed" "ERROR"
        exit 1
    }
} else {
    Show-SystemStatus
}