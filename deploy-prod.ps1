#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy script para Citizen Reports Platform a Docker Registry

.DESCRIPTION
    Construye la imagen Docker en target 'production' y la sube a Docker Registry

.PARAMETER Tag
    Tag para la versión (default: 'latest')
    Ejemplo: '2025-11-22', 'v1.0.0'

.PARAMETER RegistryUser
    Usuario del Docker Registry (default: 'progressiaglobalgroup')

.PARAMETER RegistryPass
    Password del Docker Registry (será solicitado si no se proporciona)

.PARAMETER RegistryUrl
    URL del registry (default: 'docker.io')

.EXAMPLE
    .\deploy-prod.ps1 -Tag "2025-11-22" -RegistryUser "myuser" -RegistryPass "mypass"

.EXAMPLE
    .\deploy-prod.ps1  # Interactivo
#>

param(
    [string]$Tag = 'latest',
    [string]$RegistryUser = 'progressiaglobalgroup',
    [string]$RegistryPass = '',
    [string]$RegistryUrl = 'docker.io'
)

$ErrorActionPreference = 'Stop'

# Configuración
$IMAGE_NAME = 'citizen-reports'
$FULL_IMAGE = "$RegistryUrl/$RegistryUser/$IMAGE_NAME`:$Tag"
$LATEST_IMAGE = "$RegistryUrl/$RegistryUser/$IMAGE_NAME`:latest"

# Colores
$Header = "`n================================`nCitizen Reports - Deploy Script`n================================`n"
$Success = "✅"
$Error_Sym = "❌"
$Warning = "⚠️"

Write-Host $Header -ForegroundColor Cyan

Write-Host "Configuración:"
Write-Host "  Registry: $RegistryUrl"
Write-Host "  Usuario: $RegistryUser"
Write-Host "  Imagen base: $IMAGE_NAME"
Write-Host "  Tag: $Tag"
Write-Host "  Full image: $FULL_IMAGE"
Write-Host ""

# 1. Verificar Docker
Write-Host "[1/5] Verificando Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "$Success Docker disponible: $dockerVersion" -ForegroundColor Green
}
catch {
    Write-Host "$Error_Sym Docker no está disponible" -ForegroundColor Red
    exit 1
}

# 2. Build de la imagen
Write-Host "[2/5] Construyendo imagen Docker (production target)..." -ForegroundColor Yellow
try {
    docker build `
        -t "$($IMAGE_NAME):$Tag" `
        -t "$($IMAGE_NAME):latest" `
        --target production `
        -f Dockerfile `
        . | Out-Host

    Write-Host "$Success Build completado" -ForegroundColor Green
}
catch {
    Write-Host "$Error_Sym Build falló: $_" -ForegroundColor Red
    exit 1
}

# 3. Verificar imagen
Write-Host "[3/5] Verificando imagen..." -ForegroundColor Yellow
try {
    $imageInfo = docker image inspect "$($IMAGE_NAME):$Tag" | ConvertFrom-Json
    $sizeMB = [math]::Round($imageInfo[0].Size / 1024 / 1024, 2)
    Write-Host "$Success Imagen verificada (tamaño: ${sizeMB}MB)" -ForegroundColor Green
    Write-Host "  ID: $($imageInfo[0].Id.Substring(0, 12))"
    Write-Host "  Created: $($imageInfo[0].Created)"
}
catch {
    Write-Host "$Error_Sym No se pudo verificar la imagen: $_" -ForegroundColor Red
    exit 1
}

# 4. Login y Push (opcional)
$pushImage = $false
if ([string]::IsNullOrEmpty($RegistryPass)) {
    Write-Host ""
    Write-Host "¿Deseas subir la imagen a Docker Registry?" -ForegroundColor Yellow
    Write-Host "1) Sí, subir ahora" -ForegroundColor White
    Write-Host "2) No, solo crear imagen localmente" -ForegroundColor White
    
    $choice = Read-Host "Selecciona opción (1/2)"
    
    if ($choice -eq "1") {
        $securePass = Read-Host -AsSecureString "Ingresa password de Docker Registry"
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)
        $RegistryPass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
        $pushImage = $true
    }
}
else {
    $pushImage = $true
}

if ($pushImage) {
    Write-Host "[4/5] Autenticando en Docker Registry..." -ForegroundColor Yellow
    try {
        $RegistryPass | docker login -u $RegistryUser --password-stdin $RegistryUrl 2>&1 | Out-Null
        Write-Host "$Success Autenticación exitosa" -ForegroundColor Green
    }
    catch {
        Write-Host "$Error_Sym Autenticación falló: $_" -ForegroundColor Red
        exit 1
    }

    # Tag con full image name
    Write-Host "[5/5] Subiendo imagen a Docker Registry..." -ForegroundColor Yellow
    try {
        docker tag "$($IMAGE_NAME):$Tag" $FULL_IMAGE
        docker tag "$($IMAGE_NAME):latest" $LATEST_IMAGE
        
        Write-Host "  Subiendo $FULL_IMAGE..." -ForegroundColor White
        docker push $FULL_IMAGE | Out-Host
        
        Write-Host "  Subiendo $LATEST_IMAGE..." -ForegroundColor White
        docker push $LATEST_IMAGE | Out-Host
        
        Write-Host "$Success Imagen subida exitosamente" -ForegroundColor Green
    }
    catch {
        Write-Host "$Error_Sym Push falló: $_" -ForegroundColor Red
        exit 1
    }

    # Logout
    docker logout $RegistryUrl | Out-Null
}
else {
    Write-Host "[4/5] Saltando autenticación (imagen local solo)" -ForegroundColor Yellow
    Write-Host "[5/5] Saltando push a registry" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "$Success DEPLOY COMPLETADO" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

Write-Host "Información de la imagen:" -ForegroundColor Cyan
Write-Host "  Nombre: $($IMAGE_NAME):$Tag"
Write-Host "  Tamaño: ${sizeMB}MB"
Write-Host "  Stages: client-builder → server-builder → production"
Write-Host "  Incluye: Backend (Express/SQLite) + Frontend (Vite SPA)"
Write-Host ""

if ($pushImage) {
    Write-Host "Próximos pasos en el servidor de producción (145.79.0.77):" -ForegroundColor Yellow
    Write-Host "  1. ssh root@145.79.0.77"
    Write-Host "  2. docker pull $FULL_IMAGE"
    Write-Host "  3. cd /root/citizen-reports && docker-compose down"
    Write-Host "  4. Actualizar docker-compose.yml con: image: $FULL_IMAGE"
    Write-Host "  5. docker-compose up -d"
    Write-Host "  6. Verificar: docker logs -f citizen-reports"
}
else {
    Write-Host "Imagen creada localmente. Para subirla después:" -ForegroundColor Yellow
    Write-Host "  docker tag $($IMAGE_NAME):$Tag $FULL_IMAGE"
    Write-Host "  docker push $FULL_IMAGE"
}

Write-Host ""
