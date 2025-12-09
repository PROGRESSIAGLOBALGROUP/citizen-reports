<# 
.SYNOPSIS
    Test Runner Optimizado - citizen-reports
    Evita cuelgues de terminal con patrones premium de clase mundial

.DESCRIPTION
    Este script ejecuta tests de forma segura, evitando:
    - Pipes bloqueantes (Select-Object en streams largos)
    - Timeouts infinitos
    - Buffers de output que se llenan

.EXAMPLE
    .\scripts\test-runner.ps1 -Suite backend
    .\scripts\test-runner.ps1 -Suite frontend
    .\scripts\test-runner.ps1 -Suite e2e -File "flujo-completo"
    .\scripts\test-runner.ps1 -Suite quick
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('backend', 'frontend', 'e2e', 'quick', 'all')]
    [string]$Suite = 'quick',
    
    [Parameter(Mandatory=$false)]
    [string]$File = '',
    
    [Parameter(Mandatory=$false)]
    [int]$Timeout = 300,
    
    [Parameter(Mandatory=$false)]
    [switch]$ShowDetails
)

# Configuracion
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

$env:NODE_OPTIONS = "--experimental-vm-modules"
$env:NODE_ENV = "test"

# Colores para output
function Write-Success { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Fail { param($msg) Write-Host "[FAIL] $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Time { param($seconds) Write-Host "[TIME] $($seconds.ToString('F1'))s" -ForegroundColor Yellow }

# Timer wrapper seguro
function Invoke-TimedCommand {
    param(
        [string]$Name,
        [scriptblock]$Command,
        [int]$TimeoutSeconds = 300
    )
    
    $t0 = Get-Date
    Write-Info "Ejecutando: $Name"
    
    try {
        # Ejecutar sin pipe bloqueante
        $job = Start-Job -ScriptBlock $Command
        $result = Wait-Job -Job $job -Timeout $TimeoutSeconds
        
        if ($result.State -eq 'Running') {
            Stop-Job -Job $job
            Remove-Job -Job $job -Force
            Write-Fail "$Name - TIMEOUT despues de ${TimeoutSeconds}s"
            return $false
        }
        
        $output = Receive-Job -Job $job
        Remove-Job -Job $job
        
        $duration = (Get-Date) - $t0
        
        # Mostrar ultimas lineas relevantes
        if ($output) {
            $lines = $output -split "`n"
            $relevantLines = $lines | Select-Object -Last 8
            $relevantLines | ForEach-Object { Write-Host $_ }
        }
        
        Write-Time $duration.TotalSeconds
        return $true
    }
    catch {
        Write-Fail "$Name - Error: $_"
        return $false
    }
}

# Ejecutar suite seleccionada
$t0Global = Get-Date

switch ($Suite) {
    'quick' {
        Write-Info "=== QUICK TEST (sanity + syntax) ==="
        
        # Syntax check - rapido y sin cuelgue
        $t0 = Get-Date
        node --check server/app.js 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Syntax server/app.js OK"
        } else {
            Write-Fail "Syntax error en server/app.js"
            exit 1
        }
        
        # Sanity test - un solo archivo, rapido
        $t0 = Get-Date
        npx jest tests/backend/sanity.test.js --config=config/jest.config.cjs --testTimeout=10000 2>&1
        $duration = (Get-Date) - $t0
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Sanity tests passed"
        } else {
            Write-Fail "Sanity tests failed"
        }
        Write-Time $duration.TotalSeconds
    }
    
    'backend' {
        Write-Info "=== BACKEND TESTS (Jest) ==="
        
        if ($File) {
            $testPath = "tests/backend/$File"
            if (-not $testPath.EndsWith('.test.js')) {
                $testPath = "$testPath.test.js"
            }
            Write-Info "Archivo: $testPath"
            
            $t0 = Get-Date
            npx jest $testPath --config=config/jest.config.cjs --testTimeout=15000 2>&1
            $duration = (Get-Date) - $t0
            Write-Time $duration.TotalSeconds
        } else {
            Write-Info "Suite completa backend..."
            
            $t0 = Get-Date
            npx jest tests/backend --config=config/jest.config.cjs --testTimeout=15000 2>&1
            $duration = (Get-Date) - $t0
            Write-Time $duration.TotalSeconds
        }
    }
    
    'frontend' {
        Write-Info "=== FRONTEND TESTS (Vitest) ==="
        
        $t0 = Get-Date
        npx vitest run --config config/vitest.config.ts 2>&1
        $duration = (Get-Date) - $t0
        Write-Time $duration.TotalSeconds
    }
    
    'e2e' {
        Write-Info "=== E2E TESTS (Playwright) ==="
        
        if ($File) {
            $testPath = "tests/e2e/$File"
            if (-not $testPath.EndsWith('.spec.ts')) {
                $testPath = "$testPath.spec.ts"
            }
            Write-Info "Archivo: $testPath"
            
            $t0 = Get-Date
            npx playwright test $testPath --config=config/playwright.config.ts --reporter=line 2>&1
            $duration = (Get-Date) - $t0
            Write-Time $duration.TotalSeconds
        } else {
            Write-Info "Suite E2E completa (puede tomar varios minutos)..."
            Write-Info "Considera ejecutar archivos individuales con -File"
            
            $t0 = Get-Date
            npx playwright test --config=config/playwright.config.ts --reporter=dot 2>&1
            $duration = (Get-Date) - $t0
            Write-Time $duration.TotalSeconds
        }
    }
    
    'all' {
        Write-Info "=== ALL TESTS ==="
        
        # Backend
        Write-Info "--- Backend ---"
        $t0 = Get-Date
        npx jest tests/backend --config=config/jest.config.cjs --testTimeout=15000 2>&1
        Write-Time ((Get-Date) - $t0).TotalSeconds
        
        # Frontend
        Write-Info "--- Frontend ---"
        $t0 = Get-Date
        npx vitest run --config config/vitest.config.ts 2>&1
        Write-Time ((Get-Date) - $t0).TotalSeconds
        
        Write-Info "E2E omitido (ejecutar manualmente con -Suite e2e)"
    }
}

$globalDuration = (Get-Date) - $t0Global
Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "TOTAL: $($globalDuration.TotalSeconds.ToString('F1'))s" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
