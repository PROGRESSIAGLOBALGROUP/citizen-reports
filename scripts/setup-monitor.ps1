#!/usr/bin/env pwsh
# =============================================================================
# Jantetelco Server Monitor Setup Script
# Instala y configura el sistema de monitoreo automático
# =============================================================================

param(
    [switch]$InstallService,  # Instalar como servicio de Windows
    [switch]$CreateShortcuts, # Crear accesos directos en el escritorio
    [switch]$TestSetup       # Probar la instalación
)

$PROJECT_ROOT = "C:\PROYECTOS\Jantetelco"
$SCRIPTS_DIR = "$PROJECT_ROOT\scripts"

function Write-Setup {
    param([string]$Message, [string]$Color = "Green")
    Write-Host "🔧 $Message" -ForegroundColor $Color
}

function Test-AdminRights {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Set-ExecutionPolicy {
    Write-Setup "Configurando políticas de ejecución..." "Yellow"
    try {
        Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
        Write-Setup "Política de ejecución configurada" "Green"
    } catch {
        Write-Setup "Error configurando política de ejecución: $($_.Exception.Message)" "Red"
    }
}

function Create-DesktopShortcuts {
    Write-Setup "Creando accesos directos..." "Yellow"
    
    $desktop = [Environment]::GetFolderPath("Desktop")
    $shell = New-Object -ComObject WScript.Shell
    
    # Shortcut para iniciar servicios
    $startShortcut = $shell.CreateShortcut("$desktop\Iniciar Jantetelco.lnk")
    $startShortcut.TargetPath = "pwsh.exe"
    $startShortcut.Arguments = "-File `"$PROJECT_ROOT\start-jantetelco.ps1`""
    $startShortcut.WorkingDirectory = $PROJECT_ROOT
    $startShortcut.Description = "Iniciar servicios de Jantetelco"
    $startShortcut.IconLocation = "shell32.dll,137"
    $startShortcut.Save()
    
    # Shortcut para iniciar con monitoreo
    $monitorShortcut = $shell.CreateShortcut("$desktop\Jantetelco con Monitor.lnk")
    $monitorShortcut.TargetPath = "pwsh.exe"
    $monitorShortcut.Arguments = "-File `"$PROJECT_ROOT\start-jantetelco.ps1`" -Monitor"
    $monitorShortcut.WorkingDirectory = $PROJECT_ROOT
    $monitorShortcut.Description = "Iniciar Jantetelco con monitoreo automático"
    $monitorShortcut.IconLocation = "shell32.dll,138"
    $monitorShortcut.Save()
    
    # Shortcut para detener servicios
    $stopShortcut = $shell.CreateShortcut("$desktop\Detener Jantetelco.lnk")
    $stopShortcut.TargetPath = "pwsh.exe"
    $stopShortcut.Arguments = "-File `"$PROJECT_ROOT\start-jantetelco.ps1`" -Stop"
    $stopShortcut.WorkingDirectory = $PROJECT_ROOT
    $stopShortcut.Description = "Detener servicios de Jantetelco"
    $stopShortcut.IconLocation = "shell32.dll,131"
    $stopShortcut.Save()
    
    Write-Setup "Accesos directos creados en el escritorio" "Green"
}

function Install-WindowsService {
    if (!(Test-AdminRights)) {
        Write-Setup "Se requieren permisos de administrador para instalar el servicio" "Red"
        return
    }
    
    Write-Setup "Instalando servicio de Windows..." "Yellow"
    
    # Crear script wrapper para el servicio
    $serviceScript = @'
$PROJECT_ROOT = "C:\PROYECTOS\Jantetelco"
$SCRIPTS_DIR = "$PROJECT_ROOT\scripts"

# Función principal del servicio
function Start-MonitorService {
    try {
        & "$SCRIPTS_DIR\server-monitor.ps1" -Verbose
    } catch {
        Write-EventLog -LogName Application -Source "JantetelcoMonitor" -EventId 1001 -EntryType Error -Message "Error en monitor: $($_.Exception.Message)"
    }
}

# Iniciar servicio
Start-MonitorService
'@
    
    $serviceScriptPath = "$SCRIPTS_DIR\service-wrapper.ps1"
    $serviceScript | Out-File -FilePath $serviceScriptPath -Encoding UTF8
    
    try {
        # Crear el servicio usando New-Service
        New-Service -Name "JantetelcoMonitor" `
                   -BinaryPathName "pwsh.exe -File `"$serviceScriptPath`"" `
                   -DisplayName "Jantetelco Server Monitor" `
                   -Description "Monitoreo automático de servidores Jantetelco" `
                   -StartupType Automatic
        
        Write-Setup "Servicio instalado correctamente" "Green"
        Write-Setup "Puedes iniciar el servicio con: Start-Service JantetelcoMonitor" "Cyan"
    } catch {
        Write-Setup "Error instalando servicio: $($_.Exception.Message)" "Red"
    }
}

function Test-Installation {
    Write-Setup "Probando instalación..." "Yellow"
    
    $errors = @()
    
    # Verificar archivos de script
    $requiredFiles = @(
        "$PROJECT_ROOT\start-jantetelco.ps1",
        "$SCRIPTS_DIR\server-monitor.ps1",
        "$SCRIPTS_DIR\server-recovery.ps1",
        "$SCRIPTS_DIR\monitor-config.json"
    )
    
    foreach ($file in $requiredFiles) {
        if (!(Test-Path $file)) {
            $errors += "Archivo faltante: $file"
        }
    }
    
    # Verificar dependencias
    try {
        $nodeVersion = node --version 2>$null
        Write-Setup "Node.js encontrado: $nodeVersion" "Green"
    } catch {
        $errors += "Node.js no encontrado"
    }
    
    try {
        $npmVersion = npm --version 2>$null
        Write-Setup "NPM encontrado: $npmVersion" "Green"
    } catch {
        $errors += "NPM no encontrado"
    }
    
    # Verificar estructura del proyecto
    $requiredDirs = @(
        "$PROJECT_ROOT\server",
        "$PROJECT_ROOT\client",
        "$PROJECT_ROOT\scripts"
    )
    
    foreach ($dir in $requiredDirs) {
        if (!(Test-Path $dir)) {
            $errors += "Directorio faltante: $dir"
        }
    }
    
    if ($errors.Count -eq 0) {
        Write-Setup "✅ Instalación completa y funcional" "Green"
        return $true
    } else {
        Write-Setup "❌ Errores encontrados:" "Red"
        foreach ($error in $errors) {
            Write-Setup "  • $error" "Red"
        }
        return $false
    }
}

function Show-Usage {
    Write-Setup "=== Sistema de Monitoreo Jantetelco Instalado ===" "Green"
    Write-Host ""
    Write-Host "📋 Comandos disponibles:" -ForegroundColor Cyan
    Write-Host "  • .\start-jantetelco.ps1              - Iniciar servicios" -ForegroundColor White
    Write-Host "  • .\start-jantetelco.ps1 -Monitor     - Iniciar con monitoreo" -ForegroundColor White
    Write-Host "  • .\start-jantetelco.ps1 -Clean       - Iniciar con limpieza" -ForegroundColor White
    Write-Host "  • .\start-jantetelco.ps1 -Status      - Ver estado" -ForegroundColor White
    Write-Host "  • .\start-jantetelco.ps1 -Stop        - Detener servicios" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Scripts de mantenimiento:" -ForegroundColor Cyan
    Write-Host "  • .\scripts\server-recovery.ps1       - Recuperación manual" -ForegroundColor White
    Write-Host "  • .\scripts\server-monitor.ps1        - Solo monitoreo" -ForegroundColor White
    Write-Host ""
    Write-Host "📁 Archivos de configuración:" -ForegroundColor Cyan
    Write-Host "  • .\scripts\monitor-config.json       - Configuración del monitor" -ForegroundColor White
    Write-Host "  • .\server-monitor.log                 - Log de monitoreo" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 URLs de acceso:" -ForegroundColor Cyan
    Write-Host "  • http://localhost:4000                - API Backend" -ForegroundColor White
    Write-Host "  • http://localhost:5173                - Frontend App" -ForegroundColor White
}

# Main execution
Write-Setup "=== Configurando Sistema de Monitoreo Jantetelco ===" "Cyan"

# Configurar políticas de ejecución
Set-ExecutionPolicy

# Crear accesos directos si se solicita
if ($CreateShortcuts) {
    Create-DesktopShortcuts
}

# Instalar servicio si se solicita
if ($InstallService) {
    Install-WindowsService
}

# Probar instalación
if ($TestSetup) {
    $testResult = Test-Installation
    if (!$testResult) {
        exit 1
    }
}

# Mostrar instrucciones de uso
Show-Usage

Write-Setup "Configuración completada. ¡Sistema listo para usar!" "Green"