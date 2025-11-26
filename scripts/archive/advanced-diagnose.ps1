# Script avanzado de diagnóstico - Detecta exactamente cuál server está corriendo
# Verificación: Por qué algunos endpoints funcionan y otros no

param(
    [string]$ServerUrl = "http://145.79.0.77:4000"
)

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  DIAGNÓSTICO AVANZADO - Verificar qué server.js está corriendo" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "📊 Endpoints a Verificar:" -ForegroundColor Yellow
Write-Host ""

$tests = @(
    # ENDPOINTS públicos (ambos servers tienen)
    @{
        name     = "1. GET /api/reportes (PÚBLICA)"
        endpoint = "/api/reportes"
        method   = "GET"
        auth     = $false
        server   = "production-server.js"
        status   = "DEBE estar en ambos"
    }
    # ENDPOINT que solo tiene server.js
    @{
        name     = "2. GET /api/reportes/tipos (DEPRECATED pero en server.js)"
        endpoint = "/api/reportes/tipos"
        method   = "GET"
        auth     = $false
        server   = "server.js ONLY"
        status   = "Si 404 = problema"
    }
    # ENDPOINT autenticado (solo server.js)
    @{
        name     = "3. GET /api/reportes/mis-reportes (AUTENTICADO)"
        endpoint = "/api/reportes/mis-reportes"
        method   = "GET"
        auth     = $true
        server   = "server.js ONLY"
        status   = "Si 404 = INCORRECTO"
    }
    # Autenticación (solo server.js)
    @{
        name     = "4. POST /api/auth/login (AUTENTICACIÓN)"
        endpoint = "/api/auth/login"
        method   = "POST"
        auth     = $false
        server   = "server.js ONLY"
        status   = "Si 404 = INCORRECTO"
    }
)

$results = @()

foreach ($test in $tests) {
    Write-Host "$($test.name)" -ForegroundColor Magenta
    Write-Host "   Endpoint: $($test.endpoint)" -ForegroundColor Gray
    Write-Host "   Debe estar en: $($test.server)" -ForegroundColor Gray
    
    try {
        $url = "$ServerUrl$($test.endpoint)"
        $headers = @{
            'Content-Type' = 'application/json'
        }
        
        if ($test.auth) {
            $headers['Authorization'] = "Bearer test"
        }
        
        $params = @{
            Uri                  = $url
            Method               = $test.method
            Headers              = $headers
            SkipCertificateCheck = $true
            ErrorAction          = "Stop"
        }
        
        if ($test.method -eq "POST") {
            $params['Body'] = '{"email":"test","password":"test"}'
        }
        
        Invoke-RestMethod @params | Out-Null
        $result = "✅ 200 OK"
        
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode
        
        if ($statusCode -eq "NotFound" -or $statusCode -eq 404) {
            $result = "❌ 404 Not Found"
        }
        elseif ($statusCode -eq "Unauthorized" -or $statusCode -eq 401) {
            $result = "✅ 401 Unauthorized (endpoint EXISTS)"
        }
        elseif ($statusCode -eq "BadRequest" -or $statusCode -eq 400) {
            $result = "✅ 400 Bad Request (endpoint EXISTS)"
        }
        else {
            $result = "⚠️  $statusCode"
        }
    }
    
    Write-Host "   Resultado: $result" -ForegroundColor $(if ($result -like "*404*") { "Red" } else { "Green" })
    
    $results += @{
        name   = $test.name
        result = $result
        server = $test.server
    }
    
    Write-Host ""
}

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  ANÁLISIS DE RESULTADOS" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar patrones
$has404Endpoints = $results | Where-Object { $_.result -like "*404*" }
$hasAuthEndpoints = $results | Where-Object { $_.result -like "*401*" -or $_.result -like "*400*" }

Write-Host "📈 Summary:" -ForegroundColor Yellow
Write-Host ""

if ($results[0].result -like "*200*") {
    Write-Host "✅ /api/reportes funciona → Conexión al servidor OK" -ForegroundColor Green
}

if ($results[1].result -like "*404*") {
    Write-Host "❌ /api/reportes/tipos retorna 404 → POSIBLE PROBLEMA" -ForegroundColor Red
}

if ($results[2].result -like "*404*") {
    Write-Host "❌ /api/reportes/mis-reportes retorna 404 → INDICA production-server.js" -ForegroundColor Red
}

if ($results[3].result -like "*401*" -or $results[3].result -like "*400*") {
    Write-Host "✅ /api/auth/login responde → Indica server.js PARCIALMENTE activo" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔍 CONCLUSIÓN:" -ForegroundColor Cyan
Write-Host ""

if ($results[2].result -like "*404*" -and $results[3].result -like "*401*") {
    Write-Host "⚠️  SITUACIÓN CONFUSA:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   • /api/reportes/mis-reportes → 404 (no existe)" -ForegroundColor Red
    Write-Host "   • /api/auth/login → 401 (existe pero error auth)" -ForegroundColor Green
    Write-Host ""
    Write-Host "   Esto sugiere que:" -ForegroundColor Yellow
    Write-Host "   1. El servidor SÍ está corriendo server.js (tiene login)" -ForegroundColor Yellow
    Write-Host "   2. Pero /api/reportes/mis-reportes está dando 404" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Posibles causas:" -ForegroundColor Yellow
    Write-Host "   ① El endpoint NO está registrado en configurarRutasReportes()" -ForegroundColor Yellow
    Write-Host "   ② El router está siendo capturado por otro middleware" -ForegroundColor Yellow
    Write-Host "   ③ Error en el orden de registro de rutas" -ForegroundColor Yellow
    Write-Host "   ④ El archivo reportes_auth_routes.js no está siendo importado" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   → REQUIERE INVESTIGACIÓN DE CÓDIGO" -ForegroundColor Yellow
}
elseif ($results[2].result -like "*404*" -and $results[3].result -like "*404*") {
    Write-Host "❌ CONFIRMADO: El servidor está usando production-server.js" -ForegroundColor Red
    Write-Host ""
    Write-Host "   SOLUCIÓN:" -ForegroundColor Yellow
    Write-Host "   1. SSH a 145.79.0.77" -ForegroundColor Yellow
    Write-Host "   2. Ejecutar: pkill -f 'node server' " -ForegroundColor Yellow
    Write-Host "   3. Navegar: cd /ruta/a/citizen-reports/server" -ForegroundColor Yellow
    Write-Host "   4. Ejecutar: npm start" -ForegroundColor Yellow
}
else {
    Write-Host "✅ El servidor parece estar funcionando correctamente" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Para más detalles, ver:" -ForegroundColor Cyan
Write-Host "   docs/BUGFIX_PRODUCTION_SERVER_404_2025-10-31.md" -ForegroundColor Gray
