<![CDATA[#!/usr/bin/env pwsh
# ============================================================================
# CITIZEN REPORTS - DOCKER DEPLOYMENT SCRIPT
# ============================================================================
# Script profesional de despliegue con rollback automático y health checks
# Cumple con mejores prácticas clase mundial de DevOps
#
# Uso: .\deploy-docker.ps1 [-Host "145.79.0.77"] [-StackName "citizen-reports"] [-SkipTests]
#
# Features:
# - Pre-deployment health check
# - Backup automático de DB
# - Build multi-stage optimizado
# - Zero-downtime deployment con rollback
# - Post-deployment validation
# - Logs detallados con timestamps
# ============================================================================

param(
    [string]$Host = "145.79.0.77",
    [string]$StackName = "citizen-reports",
    [string]$User = "root",
    [switch]$SkipTests = $false,
    [switch]$Force = $false
)

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

$ErrorActionPreference = "Stop"
$RemotePath = "/root/citizen-reports"
$BackupDir = "$RemotePath/backups"
$LogFile = "deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# ============================================================================
# FUNCIONES HELPER
# ============================================================================

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch($Level) {
        "INFO" { "Cyan" }
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        "ERROR" { "Red" }
        default { "White" }
    }
    
    $logEntry = "[$timestamp] [$Level] $Message"
    Write-Host $logEntry -ForegroundColor $color
    Add-Content -Path $LogFile -Value $logEntry
}

function Invoke-RemoteCommand {
    param([string]$Command, [string]$Description)
    
    Write-Log "Ejecutando: $Description" "INFO"
    try {
        $result = ssh "${User}@${Host}" "$Command" 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Command failed with exit code $LASTEXITCODE"
        }
        return $result
    }
    catch {
        Write-Log "Error en: $Description - $_" "ERROR"
        throw
    }
}

function Test-RemoteHealth {
    param([string]$Url = "http://localhost:4000/api/reportes?limit=1")
    
    Write-Log "Verificando health del servicio..." "INFO"
    $result = Invoke-RemoteCommand -Command "curl -f -s -o /dev/null -w '%{http_code}' $Url" -Description "Health check"
    
    if ($result -eq "200") {
        Write-Log "✓ Servicio saludable (HTTP 200)" "SUCCESS"
        return $true
    }
    else {
        Write-Log "✗ Servicio no responde correctamente (HTTP $result)" "WARNING"
        return $false
    }
}

# ============================================================================
# BANNER
# ============================================================================

Write-Host @"

╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   🚀 CITIZEN REPORTS - DOCKER SWARM DEPLOYMENT                           ║
║                                                                           ║
║   Host: $Host                                              ║
║   Stack: $StackName                                          ║
║   Timestamp: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")                   ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

Start-Sleep -Seconds 1

# ============================================================================
# FASE 1: PRE-DEPLOYMENT CHECKS
# ============================================================================

Write-Log "════════════════════════════════════════════════════════════" "INFO"
Write-Log "FASE 1: PRE-DEPLOYMENT CHECKS" "INFO"
Write-Log "════════════════════════════════════════════════════════════" "INFO"

# 1.1 Test SSH Connection
Write-Log "1.1 Verificando conexión SSH..." "INFO"
try {
    Invoke-RemoteCommand -Command "echo 'SSH OK'" -Description "SSH connection test" | Out-Null
    Write-Log "✓ Conexión SSH exitosa" "SUCCESS"
}
catch {
    Write-Log "✗ No se pudo conectar al servidor" "ERROR"
    exit 1
}

# 1.2 Check Docker Swarm
Write-Log "1.2 Verificando Docker Swarm..." "INFO"
$swarmStatus = Invoke-RemoteCommand -Command "docker info --format '{{.Swarm.LocalNodeState}}'" -Description "Swarm status check"
if ($swarmStatus -ne "active") {
    Write-Log "✗ Docker Swarm no está activo" "ERROR"
    exit 1
}
Write-Log "✓ Docker Swarm activo" "SUCCESS"

# 1.3 Current service health
Write-Log "1.3 Verificando estado actual del servicio..." "INFO"
$currentHealth = Test-RemoteHealth
if (-not $currentHealth -and -not $Force) {
    Write-Log "⚠ Servicio actual no está saludable. Usa -Force para continuar" "WARNING"
    exit 1
}

# ============================================================================
# FASE 2: BACKUP
# ============================================================================

Write-Log "" "INFO"
Write-Log "════════════════════════════════════════════════════════════" "INFO"
Write-Log "FASE 2: BACKUP DE BASE DE DATOS" "INFO"
Write-Log "════════════════════════════════════════════════════════════" "INFO"

$backupTimestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupName = "data.db.pre-deploy-${backupTimestamp}"

Write-Log "2.1 Creando backup de DB..." "INFO"
Invoke-RemoteCommand -Command "mkdir -p $BackupDir && cp $RemotePath/server/data.db $BackupDir/$backupName" -Description "Database backup" | Out-Null

# Verificar backup
$backupCheck = Invoke-RemoteCommand -Command "test -f $BackupDir/$backupName && echo 'OK' || echo 'FAIL'" -Description "Backup verification"
if ($backupCheck -ne "OK") {
    Write-Log "✗ Backup falló" "ERROR"
    exit 1
}

$backupSize = Invoke-RemoteCommand -Command "ls -lh $BackupDir/$backupName | awk '{print \`$5}'" -Description "Backup size"
Write-Log "✓ Backup creado exitosamente: $backupName ($backupSize)" "SUCCESS"

# ============================================================================
# FASE 3: BUILD LOCAL
# ============================================================================

if (-not $SkipTests) {
    Write-Log "" "INFO"
    Write-Log "════════════════════════════════════════════════════════════" "INFO"
    Write-Log "FASE 3: BUILD Y TESTS LOCALES" "INFO"
    Write-Log "════════════════════════════════════════════════════════════" "INFO"
    
    Write-Log "3.1 Ejecutando tests..." "INFO"
    try {
        npm run test:all 2>&1 | Out-Null
        Write-Log "✓ Tests pasaron exitosamente" "SUCCESS"
    }
    catch {
        Write-Log "✗ Tests fallaron. Usa -SkipTests para omitir" "ERROR"
        exit 1
    }
}

# ============================================================================
# FASE 4: SYNC TO SERVER
# ============================================================================

Write-Log "" "INFO"
Write-Log "════════════════════════════════════════════════════════════" "INFO"
Write-Log "FASE 4: SINCRONIZACIÓN CON SERVIDOR" "INFO"
Write-Log "════════════════════════════════════════════════════════════" "INFO"

Write-Log "4.1 Sincronizando archivos..." "INFO"

# Archivos críticos a sincronizar
$filesToSync = @(
    "Dockerfile",
    "docker-compose.prod.yml",
    ".dockerignore",
    "package.json",
    "package-lock.json",
    "server/",
    "client/"
)

foreach ($file in $filesToSync) {
    Write-Log "  → Sincronizando $file" "INFO"
    scp -r $file "${User}@${Host}:${RemotePath}/" 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Log "✗ Error sincronizando $file" "ERROR"
        exit 1
    }
}

Write-Log "✓ Archivos sincronizados exitosamente" "SUCCESS"

# ============================================================================
# FASE 5: BUILD EN SERVIDOR
# ============================================================================

Write-Log "" "INFO"
Write-Log "════════════════════════════════════════════════════════════" "INFO"
Write-Log "FASE 5: BUILD DE IMAGEN DOCKER" "INFO"
Write-Log "════════════════════════════════════════════════════════════" "INFO"

Write-Log "5.1 Construyendo imagen Docker..." "INFO"
Invoke-RemoteCommand -Command "cd $RemotePath && docker build -t ${StackName}:latest -f Dockerfile ." -Description "Docker build"

# Tag con timestamp para rollback
$imageTag = "$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Invoke-RemoteCommand -Command "docker tag ${StackName}:latest ${StackName}:${imageTag}" -Description "Image tagging"

Write-Log "✓ Imagen construida: ${StackName}:latest (backup: ${StackName}:${imageTag})" "SUCCESS"

# ============================================================================
# FASE 6: DEPLOY TO SWARM
# ============================================================================

Write-Log "" "INFO"
Write-Log "════════════════════════════════════════════════════════════" "INFO"
Write-Log "FASE 6: DEPLOYMENT A DOCKER SWARM" "INFO"
Write-Log "════════════════════════════════════════════════════════════" "INFO"

Write-Log "6.1 Desplegando stack..." "INFO"

# Verificar si stack existe
$stackExists = Invoke-RemoteCommand -Command "docker stack ls --format '{{.Name}}' | grep -w $StackName || echo 'NOTFOUND'" -Description "Check existing stack"

if ($stackExists -ne "NOTFOUND") {
    Write-Log "  → Stack existente detectado, actualizando..." "INFO"
    Invoke-RemoteCommand -Command "cd $RemotePath && docker stack deploy -c docker-compose.prod.yml $StackName" -Description "Stack update"
}
else {
    Write-Log "  → Creando nuevo stack..." "INFO"
    Invoke-RemoteCommand -Command "cd $RemotePath && docker stack deploy -c docker-compose.prod.yml $StackName" -Description "Stack creation"
}

Write-Log "✓ Stack desplegado" "SUCCESS"

# ============================================================================
# FASE 7: VALIDATION & HEALTH CHECKS
# ============================================================================

Write-Log "" "INFO"
Write-Log "════════════════════════════════════════════════════════════" "INFO"
Write-Log "FASE 7: POST-DEPLOYMENT VALIDATION" "INFO"
Write-Log "════════════════════════════════════════════════════════════" "INFO"

Write-Log "7.1 Esperando que servicios inicien (60s)..." "INFO"
Start-Sleep -Seconds 60

Write-Log "7.2 Verificando réplicas..." "INFO"
$replicas = Invoke-RemoteCommand -Command "docker service ls --filter name=${StackName}_ --format '{{.Name}}: {{.Replicas}}'" -Description "Service replicas check"
Write-Log "  → $replicas" "INFO"

Write-Log "7.3 Health check final..." "INFO"
$maxAttempts = 10
$attempt = 1
$healthy = $false

while ($attempt -le $maxAttempts) {
    Write-Log "  → Intento $attempt/$maxAttempts..." "INFO"
    $healthy = Test-RemoteHealth
    
    if ($healthy) {
        break
    }
    
    Start-Sleep -Seconds 10
    $attempt++
}

if (-not $healthy) {
    Write-Log "✗ Servicio no pasó health checks. Iniciando ROLLBACK..." "ERROR"
    
    # ROLLBACK
    Write-Log "Ejecutando rollback a versión anterior..." "WARNING"
    Invoke-RemoteCommand -Command "docker service update --rollback ${StackName}_citizen-reports" -Description "Rollback"
    
    Write-Log "✗ DEPLOYMENT FALLÓ - Rollback ejecutado" "ERROR"
    exit 1
}

Write-Log "✓ Servicio saludable y operacional" "SUCCESS"

# ============================================================================
# FASE 8: CLEANUP
# ============================================================================

Write-Log "" "INFO"
Write-Log "════════════════════════════════════════════════════════════" "INFO"
Write-Log "FASE 8: CLEANUP" "INFO"
Write-Log "════════════════════════════════════════════════════════════" "INFO"

Write-Log "8.1 Limpiando imágenes antiguas..." "INFO"
Invoke-RemoteCommand -Command "docker image prune -f" -Description "Image cleanup" | Out-Null
Write-Log "✓ Cleanup completado" "SUCCESS"

# ============================================================================
# RESUMEN FINAL
# ============================================================================

Write-Log "" "INFO"
Write-Host @"

╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   ✅ DEPLOYMENT COMPLETADO EXITOSAMENTE                                  ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

📊 INFORMACIÓN DEL DEPLOYMENT:
   • Host: $Host
   • Stack: $StackName
   • Imagen: ${StackName}:latest (backup: ${imageTag})
   • Backup DB: $backupName
   • Log: $LogFile

🌐 ACCESO:
   • URL Externa: http://$Host:4000
   • Health Check: curl http://$Host:4000/api/reportes?limit=1

📝 COMANDOS ÚTILES:
   • Ver logs:        ssh $User@$Host "docker service logs ${StackName}_citizen-reports -f"
   • Ver servicios:   ssh $User@$Host "docker service ls --filter name=${StackName}_"
   • Ver réplicas:    ssh $User@$Host "docker service ps ${StackName}_citizen-reports"
   • Rollback manual: ssh $User@$Host "docker service update --rollback ${StackName}_citizen-reports"
   • Escalar:         ssh $User@$Host "docker service scale ${StackName}_citizen-reports=2"

"@ -ForegroundColor Green

Write-Log "Deployment completado exitosamente en $(((Get-Date) - $startTime).TotalSeconds) segundos" "SUCCESS"
]]>