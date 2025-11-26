# Diagnóstico remoto del servidor - Verificar si está usando el archivo correcto
# Uso: .\diagnose-remote-server.ps1 -ServerUrl "http://145.79.0.77:4000"

param(
    [string]$ServerUrl = "http://145.79.0.77:4000"
)

Write-Host "🔍 Diagnóstico del Servidor Remoto" -ForegroundColor Cyan
Write-Host "📍 Servidor: $ServerUrl" -ForegroundColor Gray
Write-Host ""

# Tabla de endpoints
$endpoints = @(
    @{
        name          = "GET /api/reportes"
        url           = "$ServerUrl/api/reportes"
        method        = "GET"
        auth          = $false
        expectedError = "200"
        description   = "Pública (sin autenticación) - DEBE funcionar"
    }
    @{
        name          = "GET /api/reportes/tipos"
        url           = "$ServerUrl/api/reportes/tipos"
        method        = "GET"
        auth          = $false
        expectedError = "200"
        description   = "Pública (sin autenticación) - DEBE funcionar"
    }
    @{
        name          = "GET /api/reportes/mis-reportes"
        url           = "$ServerUrl/api/reportes/mis-reportes"
        method        = "GET"
        auth          = $true
        expectedError = "401 or data"
        description   = "Autenticada - Si retorna 404 = WRONG SERVER"
    }
    @{
        name          = "POST /api/auth/login"
        url           = "$ServerUrl/api/auth/login"
        method        = "POST"
        auth          = $false
        expectedError = "200 or 400"
        description   = "Autenticación - Si retorna 404 = WRONG SERVER"
    }
)

Write-Host "🧪 PRUEBAS" -ForegroundColor Yellow
Write-Host "─" * 100

foreach ($endpoint in $endpoints) {
    Write-Host "`n[$($endpoint.method)] $($endpoint.name)" -ForegroundColor Magenta
    Write-Host "   Descripción: $($endpoint.description)" -ForegroundColor Gray
    Write-Host "   URL: $($endpoint.url)" -ForegroundColor Gray
    
    try {
        $headers = @{}
        if ($endpoint.auth) {
            $headers['Authorization'] = "Bearer invalid-token-for-testing"
        }
        $headers['Content-Type'] = 'application/json'
        
        $params = @{
            Uri              = $endpoint.url
            Method           = $endpoint.method
            Headers          = $headers
            SkipCertificateCheck = $true
            TimeoutSec       = 5
        }
        
        # Para POST, enviar body vacío o válido
        if ($endpoint.method -eq "POST") {
            $params['Body'] = @{
                email    = "test@test.com"
                password = "invalid"
            } | ConvertTo-Json
        }
        
        $response = Invoke-RestMethod @params
        Write-Host "   ✅ Respuesta: 200 OK" -ForegroundColor Green
        Write-Host "   📦 Tipo de dato: $($response.GetType().Name)" -ForegroundColor Gray
        
    }
    catch [System.Net.Http.HttpRequestException] {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "   ⚠️  Status: $statusCode" -ForegroundColor Yellow
        
        if ($statusCode -eq 404) {
            Write-Host "   ❌ ERROR 404 = Endpoint NO encontrado" -ForegroundColor Red
            if ($endpoint.auth) {
                Write-Host "   🚨 PROBLEMA DETECTADO: Endpoint autenticado retorna 404" -ForegroundColor Red
                Write-Host "      → El servidor está usando production-server.js (INCORRECTO)" -ForegroundColor Red
            }
        }
        elseif ($statusCode -eq 401) {
            Write-Host "   ✅ Status 401 = Endpoint EXISTE pero necesita autenticación válida" -ForegroundColor Green
            Write-Host "      → El servidor está usando server.js (CORRECTO) ✓" -ForegroundColor Green
        }
        elseif ($statusCode -eq 400) {
            Write-Host "   ✅ Status 400 = Endpoint EXISTE (rechaza body inválido)" -ForegroundColor Green
            Write-Host "      → El servidor está usando server.js (CORRECTO) ✓" -ForegroundColor Green
        }
        else {
            Write-Host "   ⚠️  Error: $statusCode" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "   ❌ Error de conexión: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n`n$('─' * 100)" -ForegroundColor Gray
Write-Host "📊 DIAGNÓSTICO FINAL" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Si viste respuestas de estos endpoints autenticados (con 401 o 400, NO 404):" -ForegroundColor Green
Write-Host "   • GET /api/reportes/mis-reportes" -ForegroundColor Green
Write-Host "   • POST /api/auth/login" -ForegroundColor Green
Write-Host "   → El servidor está usando server.js ✓ (TODO CORRECTO)" -ForegroundColor Green

Write-Host ""
Write-Host "❌ Si viste 404 para los endpoints autenticados:" -ForegroundColor Red
Write-Host "   • GET /api/reportes/mis-reportes" -ForegroundColor Red
Write-Host "   • POST /api/auth/login" -ForegroundColor Red
Write-Host "   → El servidor está usando production-server.js ✗ (INCORRECTO)" -ForegroundColor Red
Write-Host ""
Write-Host "   🔧 SOLUCIÓN:" -ForegroundColor Yellow
Write-Host "   1. SSH a 145.79.0.77" -ForegroundColor Yellow
Write-Host "   2. pkill -f 'node production-server.js'" -ForegroundColor Yellow
Write-Host "   3. cd /ruta/a/citizen-reports/server" -ForegroundColor Yellow
Write-Host "   4. npm start" -ForegroundColor Yellow
Write-Host ""

Write-Host "Para documentación completa, ver:" -ForegroundColor Cyan
Write-Host "→ docs/BUGFIX_PRODUCTION_SERVER_404_2025-10-31.md" -ForegroundColor Cyan
