# Test script to verify /api/reportes/mis-reportes endpoint
# Run after server is started

param(
    [string]$ServerUrl = "http://localhost:4000",
    [string]$Email = "admin@jantetelco.gob.mx",
    [string]$Password = "admin123"
)

Write-Host "🧪 Testing /api/reportes/mis-reportes endpoint" -ForegroundColor Cyan
Write-Host "📍 Server: $ServerUrl" -ForegroundColor Gray

# Step 1: Login to get token
Write-Host "`n[1/3] Logging in as $Email..." -ForegroundColor Yellow
$loginBody = @{
    email    = $Email
    password = $Password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod `
        -Uri "$ServerUrl/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -SkipCertificateCheck
    
    $token = $loginResponse.token
    Write-Host "✅ Login successful" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host "   User: $($loginResponse.usuario.email) (ID: $($loginResponse.usuario.id))" -ForegroundColor Gray
}
catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Fetch mis-reportes
Write-Host "`n[2/3] Fetching /api/reportes/mis-reportes..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    $reportsResponse = Invoke-RestMethod `
        -Uri "$ServerUrl/api/reportes/mis-reportes" `
        -Method GET `
        -Headers $headers `
        -SkipCertificateCheck
    
    Write-Host "✅ Endpoint responded successfully" -ForegroundColor Green
    Write-Host "   Status: 200 OK" -ForegroundColor Gray
    
    # Check if response is array
    if ($reportsResponse -is [array]) {
        Write-Host "   Count: $($reportsResponse.Length) reportes" -ForegroundColor Gray
    }
    else {
        Write-Host "   Response type: $(($reportsResponse | GetType).Name)" -ForegroundColor Gray
    }
    
    # If no error message present
    if ($reportsResponse.error) {
        Write-Host "⚠️  Error in response: $($reportsResponse.error)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "❌ Request failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    exit 1
}

# Step 3: Verify response structure
Write-Host "`n[3/3] Validating response..." -ForegroundColor Yellow
try {
    if ($reportsResponse -is [array]) {
        Write-Host "✅ Response is array (correct)" -ForegroundColor Green
        
        if ($reportsResponse.Length -eq 0) {
            Write-Host "   → Empty array is expected for admin user with no assignments" -ForegroundColor Green
        }
        else {
            Write-Host "   → Found $($reportsResponse.Length) assigned reports" -ForegroundColor Green
            $reportsResponse | ForEach-Object {
                Write-Host "      • Reporte #$($_.id): $($_.descripcion_corta) [$($_.estado)]" -ForegroundColor Gray
            }
        }
    }
    else {
        Write-Host "❌ Response is not array: $(($reportsResponse | GetType).Name)" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ Validation failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✨ Test complete!" -ForegroundColor Cyan
