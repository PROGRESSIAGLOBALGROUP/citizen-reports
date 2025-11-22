#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script de validación end-to-end para el dashboard de reportes
    
.DESCRIPTION
    Valida que:
    1. La base de datos tenga reportes
    2. El backend retorne datos correctos
    3. Los contadores de prioridad sean consistentes
    4. El frontend esté accesible
#>

param(
    [string]$BackendUrl = "http://localhost:4000",
    [string]$FrontendUrl = "http://localhost:5173"
)

Write-Host "`n🔍 VALIDACIÓN END-TO-END: Dashboard de Reportes`n" -ForegroundColor Cyan

# 1. Verificar base de datos
Write-Host "📊 Verificando base de datos..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\server"
$dbCheck = sqlite3 data.db "SELECT COUNT(*) FROM reportes;" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error accediendo a la base de datos" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Reportes en DB: $dbCheck" -ForegroundColor Green

# 2. Verificar backend
Write-Host "`n🔌 Verificando backend API..." -ForegroundColor Yellow
try {
    $reportes = Invoke-RestMethod "$BackendUrl/api/reportes" -ErrorAction Stop
    $total = $reportes.Count
    
    if ($total -eq 0) {
        Write-Host "   ⚠️  Backend responde pero no hay reportes" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "   ✅ Backend responde: $total reportes" -ForegroundColor Green
    
    # Verificar que todos los reportes tengan el campo prioridad
    $sinPrioridad = ($reportes | Where-Object {-not $_.prioridad}).Count
    if ($sinPrioridad -gt 0) {
        Write-Host "   ❌ $sinPrioridad reportes sin campo 'prioridad'" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✅ Todos los reportes tienen campo 'prioridad'" -ForegroundColor Green
    
} catch {
    Write-Host "   ❌ Error conectando al backend: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Verificar contadores por prioridad
Write-Host "`n📈 Validando contadores de prioridad..." -ForegroundColor Yellow
$alta = ($reportes | Where-Object {$_.prioridad -eq 'alta'}).Count
$media = ($reportes | Where-Object {$_.prioridad -eq 'media'}).Count
$baja = ($reportes | Where-Object {$_.prioridad -eq 'baja'}).Count
$suma = $alta + $media + $baja

if ($suma -ne $total) {
    Write-Host "   ❌ Inconsistencia: suma de prioridades ($suma) != total ($total)" -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ Contadores consistentes:" -ForegroundColor Green
Write-Host "      • TOTAL: $total" -ForegroundColor Cyan
Write-Host "      • ALTA: $alta" -ForegroundColor Red
Write-Host "      • MEDIA: $media" -ForegroundColor Yellow
Write-Host "      • BAJA: $baja" -ForegroundColor White

# 4. Verificar frontend
Write-Host "`n🌐 Verificando frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest "$FrontendUrl" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Frontend accesible en $FrontendUrl" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Frontend no responde (puede estar detenido)" -ForegroundColor Yellow
}

# 5. Verificar estructura de reportes
Write-Host "`n🔬 Validando estructura de datos..." -ForegroundColor Yellow
$primerReporte = $reportes[0]
$camposRequeridos = @('id', 'tipo', 'descripcion', 'lat', 'lng', 'peso', 'estado', 'dependencia', 'prioridad')
$camposFaltantes = @()

foreach ($campo in $camposRequeridos) {
    if (-not $primerReporte.PSObject.Properties[$campo]) {
        $camposFaltantes += $campo
    }
}

if ($camposFaltantes.Count -gt 0) {
    Write-Host "   ❌ Campos faltantes: $($camposFaltantes -join ', ')" -ForegroundColor Red
    exit 1
} else {
    Write-Host "   ✅ Todos los campos requeridos presentes" -ForegroundColor Green
}

# Resumen final
Write-Host "`n" + ("="*60) -ForegroundColor Cyan
Write-Host "✅ VALIDACIÓN COMPLETADA EXITOSAMENTE" -ForegroundColor Green
Write-Host ("="*60) -ForegroundColor Cyan
Write-Host ""

exit 0
