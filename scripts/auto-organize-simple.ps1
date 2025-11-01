#Requires -Version 5.1
<#
.SYNOPSIS
    Intelligent auto-organize - Reorganizes root directory safely
.DESCRIPTION
    Automatically moves files to appropriate directories with safety checks.
.PARAMETER DryRun
    Preview changes without making them
.PARAMETER Confirm
    Require confirmation before moving files
#>

param(
    [switch]$DryRun,
    [switch]$Confirm
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

# File categorization rules (pattern → destination)
$rules = @(
    @{ patterns = @("jest\.config", "vitest\.config", "playwright\.config", "\.eslintrc", "\.prettierrc", "tsconfig"); dest = "config" },
    @{ patterns = @("start-", "stop-", "deploy"); dest = "scripts/deployment" },
    @{ patterns = @("test_", "verify_", "\.test\.", "\.spec\."); dest = "tests/fixtures" },
    @{ patterns = @("root-analyzer", "auto-organize", "enforce-root", "organize-workspace", "check-servers"); dest = "scripts" },
    @{ patterns = @("\.md$", "\.txt$", "\.json$"); dest = "docs" }
)

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   AUTO-ORGANIZE" -ForegroundColor Cyan
if ($DryRun) { Write-Host "║   🔍 DRY-RUN MODE (No changes will be made)" -ForegroundColor Yellow }
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$moveOperations = @()
$protected = 0
$skipped = 0

# Analyze all files in root
$rootFiles = Get-ChildItem -Path (Get-Location) -File -Force | 
             Where-Object { $_.Name -notmatch "^\.(?!gitignore|json|txt)" }

foreach ($file in $rootFiles) {
    if ($protectedFiles -contains $file.Name) {
        Write-Host "  🔒 Protected: $($file.Name)" -ForegroundColor Green
        $protected++
        continue
    }
    
    if ($file.Name -match "^\.") {
        Write-Host "  ⏭️  System: $($file.Name)" -ForegroundColor Gray
        $skipped++
        continue
    }
    
    # Determine destination
    $destination = $null
    foreach ($rule in $rules) {
        foreach ($pattern in $rule.patterns) {
            if ($file.Name -match $pattern) {
                $destination = $rule.dest
                break
            }
        }
        if ($destination) { break }
    }
    
    if ($destination) {
        $moveOperations += @{
            source = $file.FullName
            destination = $destination
            file = $file.Name
            size = $file.Length
        }
    } else {
        Write-Host "  ❓ Unknown: $($file.Name)" -ForegroundColor Yellow
        $skipped++
    }
}

# Display preview
if ($moveOperations.Count -gt 0) {
    Write-Host "📋 FILES TO MOVE ($($moveOperations.Count) files):" -ForegroundColor Cyan
    Write-Host ""
    
    foreach ($op in $moveOperations) {
        Write-Host "  $($op.file)"
        Write-Host "    → $($op.destination)/ ($('{0:N0}' -f ($op.size / 1KB)) KB)"
    }
    
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    # Verify destinations exist or can be created
    $destCheck = @()
    foreach ($op in $moveOperations) {
        $destPath = Join-Path (Get-Location) $op.destination
        if (-not (Test-Path $destPath -PathType Container)) {
            $destCheck += @{ path = $destPath; exists = $false }
        } else {
            $destCheck += @{ path = $destPath; exists = $true }
        }
    }
    
    # Create destinations
    foreach ($dest in $destCheck | Where-Object { -not $_.exists }) {
        Write-Host "📁 Creating directory: $($dest.path)" -ForegroundColor Cyan
        if (-not $DryRun) {
            New-Item -ItemType Directory -Path $dest.path -Force | Out-Null
        }
    }
    
    if ($DryRun) {
        Write-Host "🔍 DRY-RUN: No files moved (use without -DryRun to execute)" -ForegroundColor Yellow
    } else {
        if ($Confirm) {
            Write-Host ""
            $response = Read-Host "⚠️  Ready to move $($moveOperations.Count) files. Continue? (yes/no)"
            if ($response -ne "yes") {
                Write-Host "❌ Operation cancelled" -ForegroundColor Red
                exit 0
            }
        }
        
        # Execute moves
        Write-Host ""
        Write-Host "🔄 Moving files..." -ForegroundColor Cyan
        Write-Host ""
        
        $successCount = 0
        foreach ($op in $moveOperations) {
            try {
                $targetPath = Join-Path (Get-Location) $op.destination $op.file
                Move-Item -Path $op.source -Destination $targetPath -Force
                Write-Host "  ✅ $($op.file) → $($op.destination)/" -ForegroundColor Green
                $successCount++
            } catch {
                Write-Host "  ❌ $($op.file): $_" -ForegroundColor Red
            }
        }
        
        Write-Host ""
        Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host "✅ Reorganization complete: $successCount/$($moveOperations.Count) files moved" -ForegroundColor Green
    }
} else {
    Write-Host "✅ All files properly organized! ($protected protected, $skipped skipped)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Run enforce-root-protocol.ps1 to verify compliance" -ForegroundColor Cyan
Write-Host ""

exit 0
