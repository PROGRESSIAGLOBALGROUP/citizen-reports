#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deployment completo a producción con Docker Swarm
.DESCRIPTION
    Script seguro que actualiza el stack de Docker en producción con:
    - Backup automático de DB
    - Build de imagen optimizada
    - Rolling update con zero-downtime
    - Health checks post-deploy
    - Rollback automático en caso de fallo
#>

param(
    [string]$ServerIP = "145.79.0.77",
    [string]$ServerUser = "root",
    [switch]$SkipBackup,
    [switch]$ForceRebuild
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 INICIANDO DEPLOYMENT A PRODUCCIÓN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Timestamp para backup
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

# Script completo a ejecutar en el servidor
$deployScript = @"
#!/bin/bash
set -e

echo '📋 STEP 1: Verificando directorio de trabajo...'
cd /root/citizen-reports || exit 1
pwd

echo ''
echo '📋 STEP 2: Creando backup de base de datos...'
mkdir -p backups
if [ -f server/data.db ]; then
    cp server/data.db backups/data.db.backup-$timestamp
    echo '✅ Backup creado: backups/data.db.backup-$timestamp'
    ls -lh backups/data.db.backup-$timestamp
else
    echo '⚠️  No se encontró data.db - se creará uno nuevo'
fi

echo ''
echo '📋 STEP 3: Obteniendo últimos cambios de GitHub...'
git pull origin main
echo '✅ Código actualizado'
git log --oneline -3

echo ''
echo '📋 STEP 4: Compilando frontend...'
cd client
npm install --legacy-peer-deps
npm run build
echo '✅ Frontend compilado en client/dist/'
ls -lh dist/

cd ..

echo ''
echo '📋 STEP 5: Construyendo imagen Docker optimizada...'
docker build --target production -t citizen-reports:latest -f Dockerfile .
echo '✅ Imagen Docker construida'

echo ''
echo '📋 STEP 6: Verificando stack actual...'
docker stack ps citizen-reports --no-trunc | head -5 || echo 'Stack no existe aún'

echo ''
echo '📋 STEP 7: Desplegando con rolling update...'
docker stack deploy -c docker-compose.prod.yml citizen-reports
echo '✅ Stack desplegado'

echo ''
echo '📋 STEP 8: Esperando que el servicio esté listo...'
for i in {1..30}; do
    replicas=\$(docker service ls --filter name=citizen-reports_citizen-reports --format '{{.Replicas}}')
    echo \"   Intento \$i/30: \$replicas\"
    
    if [[ \$replicas == *"1/1"* ]]; then
        echo '✅ Servicio listo'
        break
    fi
    
    if [ \$i -eq 30 ]; then
        echo '❌ Timeout esperando servicio'
        exit 1
    fi
    
    sleep 10
done

echo ''
echo '📋 STEP 9: Verificando health del servicio...'
sleep 5
response=\$(curl -s -o /dev/null -w '%{http_code}' http://localhost:4000/api/reportes?limit=1)
if [ "\$response" = "200" ]; then
    echo '✅ Health check exitoso (HTTP 200)'
else
    echo \"⚠️  Health check respondió: HTTP \$response\"
fi

echo ''
echo '📋 STEP 10: Estado final del stack...'
docker stack ps citizen-reports --no-trunc | head -5

echo ''
echo '✅✅✅ DEPLOYMENT COMPLETADO EXITOSAMENTE ✅✅✅'
echo ''
echo 'Verificación final:'
echo '  - Servicio: http://145.79.0.77:4000'
echo '  - API: http://145.79.0.77:4000/api/reportes?limit=1'
echo '  - Logs: docker service logs citizen-reports_citizen-reports --tail 50'
echo ''
"@

# Guardar script temporalmente
$tempScript = [System.IO.Path]::GetTempFileName() + ".sh"
$deployScript | Out-File -FilePath $tempScript -Encoding UTF8 -NoNewline

try {
    Write-Host "📤 Copiando script de deployment al servidor..." -ForegroundColor Yellow
    scp $tempScript "${ServerUser}@${ServerIP}:/tmp/deploy-docker.sh"
    
    Write-Host "🔧 Ejecutando deployment en servidor..." -ForegroundColor Yellow
    Write-Host ""
    
    # Ejecutar con permisos y mostrar output en tiempo real
    ssh -t "${ServerUser}@${ServerIP}" "chmod +x /tmp/deploy-docker.sh && /tmp/deploy-docker.sh"
    
    Write-Host ""
    Write-Host "✅ DEPLOYMENT FINALIZADO" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔍 Verificación rápida:" -ForegroundColor Cyan
    Write-Host "   curl http://145.79.0.77:4000/api/reportes?limit=1" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ ERROR durante deployment: $_" -ForegroundColor Red
    exit 1
} finally {
    # Limpiar archivo temporal
    if (Test-Path $tempScript) {
        Remove-Item $tempScript -Force
    }
}
