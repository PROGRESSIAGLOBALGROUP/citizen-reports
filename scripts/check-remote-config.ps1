# Ver qué archivos existen en el servidor remoto y qué versión de código está ejecutándose

param(
    [string]$ServerUrl = "http://145.79.0.77:4000"
)

Write-Host "🔍 Verificando configuración del servidor remoto" -ForegroundColor Cyan
Write-Host ""

# Probar si hay un endpoint de 'version' o 'health'
Write-Host "1. Probando endpoints de diagnostico..." -ForegroundColor Yellow

$diagnosticEndpoints = @(
    "/health",
    "/api/health",
    "/status",
    "/api/status",
    "/version",
    "/api/version",
    "/_version"
)

foreach ($endpoint in $diagnosticEndpoints) {
    try {
        $url = "$ServerUrl$endpoint"
        $response = Invoke-RestMethod -Uri $url -Method GET -SkipCertificateCheck -ErrorAction Stop
        Write-Host "   ✅ Encontrado: $endpoint" -ForegroundColor Green
        Write-Host "      Respuesta: $($response | ConvertTo-Json)" -ForegroundColor Gray
    }
    catch {
        # Silencio
    }
}

Write-Host ""
Write-Host "2. Probando rutas autenticadas con diferentes espacios de rutas..." -ForegroundColor Yellow

$testRoutes = @(
    "/api/reportes",
    "/api/reportes/",
    "/api/reportes/todos",
    "/api/reportes/tipos",
    "/api/reportes/tipos/",
    "/api/reportes/geojson",
    "/api/reportes/grid",
    "/api/reportes/mis-reportes",
    "/api/reportes/cierres-pendientes",
    "/api/auth/me",
    "/api/auth/login"
)

$results = @()

foreach ($endpoint in $testRoutes) {
    try {
        $url = "$ServerUrl$endpoint"
        $headers = @{
            'Content-Type'    = 'application/json'
            'Authorization'   = 'Bearer test-token'
        }
        
        $response = Invoke-RestMethod -Uri $url -Method GET -Headers $headers -SkipCertificateCheck -ErrorAction Stop
        $status = "✅ 200"
        
    }
    catch {
        $sc = $_.Exception.Response.StatusCode
        $status = switch ($sc) {
            "NotFound" { "❌ 404" }
            "Unauthorized" { "✅ 401" }
            "BadRequest" { "⚠️  400" }
            "Forbidden" { "❌ 403" }
            default { "⚠️  $sc" }
        }
    }
    
    Write-Host "   [$status] $endpoint" -ForegroundColor $(if ($status -like "*404*") { "Red" } else { if ($status -like "*401*") { "Green" } else { "Yellow" } })
    
    $results += @{
        endpoint = $endpoint
        status   = $status
    }
}

Write-Host ""
Write-Host "3. Análisis de patrones..." -ForegroundColor Yellow

$has404 = $results | Where-Object { $_.status -like "*404*" }
$has401 = $results | Where-Object { $_.status -like "*401*" }

Write-Host "   Endpoints que retornan 401 (EXISTEN): $($has401.Count)" -ForegroundColor Green
Write-Host "   Endpoints que retornan 404 (NO EXISTEN): $($has404.Count)" -ForegroundColor Red

if ($has401.Count -gt 0) {
    Write-Host ""
    Write-Host "   Que retornan 401:" -ForegroundColor Green
    $has401 | ForEach-Object { Write-Host "      • $($_.endpoint)" -ForegroundColor Green }
}

if ($has404.Count -gt 0) {
    Write-Host ""
    Write-Host "   Que retornan 404:" -ForegroundColor Red
    $has404 | ForEach-Object { Write-Host "      • $($_.endpoint)" -ForegroundColor Red }
}
