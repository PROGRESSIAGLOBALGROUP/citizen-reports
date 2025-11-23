#Requires -Version 5.1
<#
.SYNOPSIS
    Enforce root protocol - Validates and protects root directory
.DESCRIPTION
    Ensures only essential files remain in root following world-class standards.
    Protected files: README.md, package.json, package-lock.json, .gitignore
#>

param(
    [switch]$ReportOnly,
    [switch]$Fix,
    [switch]$Strict
)

$ErrorActionPreference = "Stop"

# Files that MUST stay in root
$protectedFiles = @(
    "README.md",
    "package.json",
    "package-lock.json",
    ".gitignore",
    "LICENSE"
)

# File patterns that should NOT be in root
$forbiddenPatterns = @(
    "test_",
    "verify_",
    "jest\.config",
    "vitest\.config",
    "playwright\.config",
    "\.eslintrc",
    "\.prettierrc",
    "\.md$",
    "\.txt$",
    "\.sql$",
    "\.log$",
    "deploy",
    "start-",
    "stop-",
    "check-",
    "\.ps1$",  # PowerShell scripts should go to scripts/
    "\.json$"  # JSON reports should go to docs/
)

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   ROOT PROTOCOL VALIDATOR" -ForegroundColor Cyan
Write-Host "║   Enforcing world-class standards" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Get all files in root (exclude directories and hidden files)
$rootFiles = @(Get-ChildItem -Path (Get-Location) -File -Force | 
               Where-Object { $_.Name -notmatch "^\.(?!gitignore)" })

Write-Host "✅ PROTECTED FILES (Must stay in root)" -ForegroundColor Green
foreach ($protected in $protectedFiles) {
    $exists = $rootFiles | Where-Object { $_.Name -eq $protected }
    $status = if ($exists) { "✓" } else { "✗ (missing)" }
    Write-Host "  $status $protected"
}

Write-Host ""

# Analyze files
$violations = @()
$unclassified = @()

foreach ($file in $rootFiles) {
    # Skip protected files
    if ($protectedFiles -contains $file.Name) {
        continue
    }
    
    # Skip hidden (except .gitignore which we already handled)
    if ($file.Name -match "^\.") {
        continue
    }
    
    $isViolation = $false
    $reason = ""
    
    # Check against forbidden patterns
    foreach ($pattern in $forbiddenPatterns) {
        if ([string]::IsNullOrEmpty($pattern)) { continue }
        
        if ($file.Name -match $pattern) {
            $isViolation = $true
            $reason = $pattern
            break
        }
    }
    
    if ($isViolation) {
        $violations += @{
            file = $file.Name
            reason = $reason
        }
    } else {
        $unclassified += $file.Name
    }
}

# Report violations
if ($violations.Count -gt 0) {
    Write-Host "🟡 VIOLATIONS DETECTED ($($violations.Count) files out of place)" -ForegroundColor Yellow
    Write-Host ""
    
    foreach ($v in $violations) {
        $dest = ""
        
        if ($v.file -match "jest|vitest|playwright|eslint|prettier|tsconfig") {
            $dest = "config/"
        } elseif ($v.file -match "test_|verify_") {
            $dest = "tests/fixtures/"
        } elseif ($v.file -match "deploy") {
            $dest = "scripts/deployment/"
        } elseif ($v.file -match "start-|stop-") {
            $dest = "scripts/deployment/"
        } elseif ($v.file -match "check-") {
            $dest = "scripts/"
        } elseif ($v.file -match "root-analyzer|auto-organize|enforce-root|organize-workspace") {
            $dest = "scripts/"
        } elseif ($v.file -match "\.ps1$") {
            $dest = "scripts/development/"
        } elseif ($v.file -match "\.json$") {
            $dest = "docs/"
        } elseif ($v.file -match "\.md$|\.txt$") {
            $dest = "docs/"
        } else {
            $dest = "scripts/"
        }
        
        Write-Host "  ❌ $($v.file)"
        Write-Host "     → Should move to: $dest"
        Write-Host "     → Pattern match: $($v.reason)"
    }
} else {
    Write-Host "🟢 NO VIOLATIONS - Root directory compliant!" -ForegroundColor Green
}

Write-Host ""

# Report unclassified
if ($unclassified.Count -gt 0) {
    Write-Host "⚠️  UNCLASSIFIED FILES ($($unclassified.Count))" -ForegroundColor Yellow
    foreach ($file in $unclassified) {
        Write-Host "  ? $file"
    }
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Summary
$totalIssues = $violations.Count + $unclassified.Count
if ($totalIssues -eq 0) {
    Write-Host "✅ STATUS: COMPLIANT" -ForegroundColor Green
    Write-Host "   Root directory follows world-class standards"
} else {
    Write-Host "🔧 STATUS: ACTION REQUIRED" -ForegroundColor Yellow
    Write-Host "   $totalIssues issues need attention"
    Write-Host ""
    Write-Host "Run: .\auto-organize-v2.ps1 -DryRun" -ForegroundColor Cyan
    Write-Host "  to preview suggested reorganization"
}

Write-Host ""

if ($Strict -and $violations.Count -gt 0) {
    Write-Host "🚫 STRICT MODE FAILED" -ForegroundColor Red
    exit 1
}

exit 0
