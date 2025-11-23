#!/usr/bin/env pwsh
# Script para sincronizar cambios locales al servidor sin Git

$ServerIP = "145.79.0.77"
$ServerUser = "root"
$ServerPath = "/root/citizen-reports"

Write-Host "📦 Creando paquete con cambios..." -ForegroundColor Cyan

# Obtener lista de archivos modificados
$modifiedFiles = @()
$modifiedFiles += git diff --name-only
$modifiedFiles += git ls-files --others --exclude-standard

# Filtrar solo archivos que existen y son relevantes
$filesToSync = $modifiedFiles | Where-Object {
    $_ -and 
    (Test-Path $_) -and
    ($_ -match '(server|client|docs|scripts)/') -and
    ($_ -notmatch 'node_modules|\.git|dist|build|\.log')
} | Select-Object -Unique

Write-Host "Archivos a sincronizar: $($filesToSync.Count)" -ForegroundColor Yellow

# Crear directorio temporal
$tempDir = New-Item -ItemType Directory -Force -Path "temp-sync"

# Copiar archivos manteniendo estructura
foreach ($file in $filesToSync) {
    $destPath = Join-Path $tempDir $file
    $destDir = Split-Path $destPath -Parent
    
    if (!(Test-Path $destDir)) {
        New-Item -ItemType Directory -Force -Path $destDir | Out-Null
    }
    
    Copy-Item $file $destPath -Force
    Write-Host "  ✓ $file" -ForegroundColor Green
}

# Crear tar
Write-Host "`n📦 Comprimiendo..." -ForegroundColor Cyan
tar -czf changes-sync.tar.gz -C temp-sync .

# Limpiar temp
Remove-Item -Recurse -Force temp-sync

Write-Host "`n📤 Subiendo al servidor..." -ForegroundColor Cyan
scp changes-sync.tar.gz ${ServerUser}@${ServerIP}:/tmp/

Write-Host "`n🔧 Aplicando cambios en servidor..." -ForegroundColor Cyan
ssh -t ${ServerUser}@${ServerIP} "cd $ServerPath && tar -xzf /tmp/changes-sync.tar.gz && echo 'Cambios aplicados' && ls -lh server/*.js | wc -l"

Write-Host "`n✅ Sincronización completada" -ForegroundColor Green
