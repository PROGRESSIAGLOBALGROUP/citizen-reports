#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy Interactive - Guía simplificada para deployment
    
.DESCRIPTION
    Script de entrada que:
    1. Valida prerequisitos (Docker, SSH, Git)
    2. Detecta tipo de autenticación SSH (keys vs password)
    3. Ejecuta deploy-master.ps1 con configuración apropiada
    4. Proporciona instrucciones para SSH password si es necesario

.PARAMETER DeployMode
    'full', 'fast', o 'test'
    
.EXAMPLE
    .\deploy-interactive.ps1 -DeployMode fast
    
#>

param(
    [ValidateSet('full', 'fast', 'test')]
    [string]$DeployMode = 'fast',
    
    [string]$SSHHost = 'root@145.79.0.77'
)

$ErrorActionPreference = 'Continue'

# Colores
function Write-Title { param([string]$msg)
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║ $msg" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Cyan
}

function Write-Info { param([string]$msg)
    Write-Host "[i] $msg" -ForegroundColor White
}

function Write-Success { param([string]$msg)
    Write-Host "[+] $msg" -ForegroundColor Green
}

function Write-Error { param([string]$msg)
    Write-Host "[!] ERROR: $msg" -ForegroundColor Red
}

function Write-Warning { param([string]$msg)
    Write-Host "[!] ADVERTENCIA: $msg" -ForegroundColor Yellow
}

# ===================================================================
# FASE 1: VALIDAR REQUISITOS LOCALES
# ===================================================================

Write-Title "VALIDACIONES PREVIAS"

Write-Info "Verificando Docker en local..."
try {
    $dockerVer = docker --version
    Write-Success "Docker disponible: $dockerVer"
} catch {
    Write-Error "Docker no está disponible localmente"
    Write-Info "Instala Docker Desktop desde: https://www.docker.com/products/docker-desktop"
    exit 1
}

Write-Info "Verificando Git..."
try {
    $gitVer = git --version
    Write-Success "Git disponible: $gitVer"
} catch {
    Write-Warning "Git no disponible (opcional, pero recomendado)"
}

# ===================================================================
# FASE 2: DETECTAR SSH AUTHENTICATION
# ===================================================================

Write-Title "DETECTAR AUTENTICACIÓN SSH"

Write-Info "Servidor: $SSHHost"
Write-Info "Probando SSH key-based auth..."

$sshKeyTest = & { ssh -o ConnectTimeout=3 -o PasswordAuthentication=no $SSHHost "echo OK" 2>&1; $LASTEXITCODE }

if ($sshKeyTest -eq 0) {
    Write-Success "SSH Key-based auth: DISPONIBLE ✓"
    Write-Info "Puedes ejecutar deployment sin prompts de password"
    $AuthType = "keys"
} else {
    Write-Warning "SSH Key-based auth: NO disponible"
    Write-Info "Se requerirá password SSH para conectarse"
    $AuthType = "password"
}

# ===================================================================
# FASE 3: INSTRUCCIONES SEGÚN AUTH TYPE
# ===================================================================

Write-Title "PRÓXIMO PASO"

if ($AuthType -eq "keys") {
    Write-Success "Estás listo para deployment automático"
    Write-Host ""
    Write-Info "Ejecuta:"
    Write-Host ""
    Write-Host "  .\deploy-master.ps1 -DeployMode $DeployMode -PreserveBD `$true" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Info "Tienes 2 opciones:"
    Write-Host ""
    Write-Host "OPCIÓN 1: Usar deploy-master.ps1 con prompts de password" -ForegroundColor Cyan
    Write-Host "  (SSH te pedirá password cuando lo necesite)"
    Write-Host ""
    Write-Host "  .\deploy-master.ps1 -DeployMode $DeployMode -PreserveBD `$true" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  → SSH solicitará password cuando se conecte" -ForegroundColor Gray
    Write-Host ""
    Write-Host "OPCIÓN 2: Configurar SSH keys (recomendado para futuro)" -ForegroundColor Cyan
    Write-Host "  (Evita tener que escribir password cada vez)"
    Write-Host ""
    Write-Host "  Genera SSH key:" -ForegroundColor Gray
    Write-Host "  $ ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Copia key al servidor:" -ForegroundColor Gray
    Write-Host "  $ ssh-copy-id -i ~/.ssh/id_ed25519.pub root@$SSHHost" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Luego use deploy-master.ps1 sin prompts:" -ForegroundColor Gray
    Write-Host "  $ .\deploy-master.ps1 -DeployMode $DeployMode" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Info "Referencia rápida:"
Write-Host "  📖 Documentación completa: docs/deployment/INDEX.md"
Write-Host "  ⚡ Quick start: docs/deployment/QUICK_START.md"
Write-Host "  🔧 Troubleshooting: docs/deployment/TROUBLESHOOTING.md"
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
