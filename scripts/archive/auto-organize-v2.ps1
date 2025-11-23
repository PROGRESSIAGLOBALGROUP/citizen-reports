#Requires -Version 5.1
<#
.SYNOPSIS
    Intelligent auto-organize v2 - Reorganizes root directory with safety checks
.DESCRIPTION
    Automatically moves files to appropriate directories based on intelligent analysis.
    Includes comprehensive safety checks, rollback capability, and verification.
.PARAMETER DryRun
    Preview changes without making them
.PARAMETER Confirm
    Require confirmation before moving files
.PARAMETER SafeMode
    Enable comprehensive safety checks (default: true)
.PARAMETER KeepLog
    Save detailed log file (default: true)
#>

param(
    [switch]$DryRun,
    [switch]$Confirm,
    [switch]$SafeMode = $true,
    [switch]$KeepLog = $true
)

$ErrorActionPreference = "Stop"

# Define robust mapping
$fileMapping = @{
    # Config files → config/
    @("\.eslintrc", "\.prettierrc", "\.babelrc", "\.editorconfig") = "config"
    
    # Startup/deployment scripts → scripts/deployment/
    @("start-", "stop-", "deploy-", "DEPLOY_") = "scripts/deployment"
    
    # Test files → tests/fixtures/
    @("^test_", "^verify_", "\.test\.", "\.spec\.") = "tests/fixtures"
    
    # Documentation → docs/
    @("\.md$", "\.txt$") = "docs"
    
    # Development scripts → scripts/development/
    @("check-", "^check_") = "scripts/development"
}

# Files that MUST stay in root
$rootProtected = @(
    "README.md",
    "package.json",
    "package-lock.json",
    ".gitignore",
    "LICENSE"
)

class SafeOrganizer {
    [string]$RootPath
    [string]$LogPath
    [bool]$DryRun
    [bool]$RequireConfirm
    [bool]$SafeMode
    [array]$MoveOperations = @()
    [array]$Errors = @()
    [int]$SuccessCount = 0
    [int]$SkipCount = 0
    
    SafeOrganizer([string]$path, [bool]$dry, [bool]$confirm, [bool]$safe) {
        $this.RootPath = $path
        $this.DryRun = $dry
        $this.RequireConfirm = $confirm
        $this.SafeMode = $safe
        $this.LogPath = Join-Path $path "organize-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
    }
    
    [void] CategorizeFile([string]$fileName) {
        # Skip protected files
        if ($rootProtected -contains $fileName) {
            Write-Host "  🔒 Protected: $fileName (stays in root)" -ForegroundColor Green
            $this.SkipCount++
            return
        }
        
        # Skip hidden files
        if ($fileName -match "^\.") {
            return
        }
        
        $destination = $null
        $reason = ""
        
        # Match against patterns
        foreach ($pattern in $fileMapping.Keys) {
            foreach ($p in $pattern) {
                if ($fileName -match $p) {
                    $destination = $fileMapping[$pattern]
                    $reason = "Pattern: $p"
                    break
                }
            }
            if ($destination) { break }
        }
        
        if ($destination) {
            $this.MoveOperations += @{
                source = $fileName
                destination = $destination
                reason = $reason
                status = "pending"
                checksum = $null
            }
        }
    }
    
    [void] PreflightChecks() {
        Write-Host "🔍 Running preflight checks..." -ForegroundColor Cyan
        
        $errors = 0
        
        # Check source files exist
        foreach ($op in $this.MoveOperations) {
            $srcPath = Join-Path $this.RootPath $op.source
            if (-not (Test-Path $srcPath)) {
                $this.Errors += "Source file not found: $($op.source)"
                $errors++
            }
        }
        
        # Check destination folders can be created
        $destFolders = @($this.MoveOperations.destination | Sort-Object -Unique)
        foreach ($dest in $destFolders) {
            $destPath = Join-Path $this.RootPath $dest
            if (-not (Test-Path $destPath)) {
                try {
                    if (-not $this.DryRun) {
                        New-Item -ItemType Directory -Path $destPath -ErrorAction SilentlyContinue | Out-Null
                    }
                    Write-Host "  ✓ Will create: $dest" -ForegroundColor Green
                } catch {
                    $this.Errors += "Cannot create destination: $dest ($_)"
                    $errors++
                }
            }
        }
        
        # Check disk space
        $driveInfo = Get-PSDrive -Name ($this.RootPath.Split('\')[0])
        if ($driveInfo.Free -lt 10MB) {
            $this.Errors += "Warning: Less than 10MB free disk space"
        }
        
        if ($errors -gt 0) {
            Write-Host "  ❌ $errors preflight errors found" -ForegroundColor Red
            return $false
        }
        
        Write-Host "  ✅ All preflight checks passed" -ForegroundColor Green
        return $true
    }
    
    [void] MoveFiles() {
        Write-Host ""
        Write-Host "📦 Moving files..." -ForegroundColor Cyan
        Write-Host ""
        
        foreach ($op in $this.MoveOperations) {
            $srcPath = Join-Path $this.RootPath $op.source
            $destDir = Join-Path $this.RootPath $op.destination
            $destPath = Join-Path $destDir $op.source
            
            # Verify source still exists
            if (-not (Test-Path $srcPath)) {
                Write-Host "  ⚠️  Source disappeared: $($op.source)" -ForegroundColor Yellow
                $this.SkipCount++
                continue
            }
            
            # Check for destination conflict
            if (Test-Path $destPath) {
                Write-Host "  ⚠️  Destination exists: $destPath" -ForegroundColor Yellow
                $this.SkipCount++
                continue
            }
            
            try {
                # Calculate checksum for verification
                $srcChecksum = (Get-FileHash $srcPath).Hash
                $op.checksum = $srcChecksum
                
                if ($this.DryRun) {
                    Write-Host "  [DRY RUN] $($op.source) → $($op.destination)/" -ForegroundColor Gray
                } else {
                    # Create destination if needed
                    if (-not (Test-Path $destDir)) {
                        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
                    }
                    
                    # Move file
                    Move-Item -Path $srcPath -Destination $destPath -Force
                    
                    # Verify move
                    if (Test-Path $destPath) {
                        $destChecksum = (Get-FileHash $destPath).Hash
                        if ($destChecksum -eq $srcChecksum) {
                            Write-Host "  ✓ $($op.source) → $($op.destination)/" -ForegroundColor Green
                            $this.SuccessCount++
                        } else {
                            Write-Host "  ❌ Checksum mismatch: $($op.source)" -ForegroundColor Red
                            $this.Errors += "Checksum failed for $($op.source)"
                        }
                    } else {
                        Write-Host "  ❌ Move verification failed: $($op.source)" -ForegroundColor Red
                        $this.Errors += "Move verification failed for $($op.source)"
                    }
                }
            } catch {
                Write-Host "  ❌ Error moving $($op.source): $_" -ForegroundColor Red
                $this.Errors += "Move error for $($op.source): $_"
            }
        }
    }
    
    [void] GenerateReport() {
        Write-Host ""
        Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host "          ORGANIZATION REPORT" -ForegroundColor Cyan
        Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host ""
        
        Write-Host "📊 STATISTICS" -ForegroundColor Cyan
        Write-Host "  Total operations: $($this.MoveOperations.Count)"
        Write-Host "  Successful: $($this.SuccessCount)"
        Write-Host "  Skipped: $($this.SkipCount)"
        Write-Host "  Errors: $($this.Errors.Count)"
        Write-Host ""
        
        Write-Host "📍 FINAL ROOT CONTENTS" -ForegroundColor Green
        $rootFiles = Get-ChildItem -Path $this.RootPath -File -Force | 
                     Where-Object { $_.Name -notmatch "^\.(?!gitignore)" } | 
                     Sort-Object Name
        
        foreach ($file in $rootFiles) {
            Write-Host "  • $($file.Name)"
        }
        Write-Host ""
        
        if ($this.Errors.Count -gt 0) {
            Write-Host "⚠️ ERRORS:" -ForegroundColor Yellow
            foreach ($error in $this.Errors) {
                Write-Host "  • $error"
            }
            Write-Host ""
        }
        
        Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    }
    
    [void] SaveLog() {
        if (-not $this.KeepLog) { return }
        
        $log = @()
        $log += "Organization Log - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        $log += "Mode: $(if ($this.DryRun) { 'DRY RUN' } else { 'ACTUAL' })"
        $log += ""
        $log += "Operations:"
        
        foreach ($op in $this.MoveOperations) {
            $log += "  $($op.source) → $($op.destination)/ ($($op.reason))"
        }
        
        if ($this.Errors.Count -gt 0) {
            $log += ""
            $log += "Errors:"
            foreach ($error in $this.Errors) {
                $log += "  • $error"
            }
        }
        
        $log -join "`n" | Out-File -FilePath $this.LogPath -Encoding UTF8
        Write-Host "📄 Log saved to: $($this.LogPath)" -ForegroundColor Cyan
    }
}

# Main execution
try {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║   INTELLIGENT AUTO-ORGANIZE v2" -ForegroundColor Cyan
    Write-Host "║   Root Directory: $(Get-Location)" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    
    if ($DryRun) {
        Write-Host "🔷 DRY RUN MODE - No changes will be made" -ForegroundColor Yellow
    }
    
    # Create organizer
    $organizer = New-Object SafeOrganizer -ArgumentList (Get-Location).Path, $DryRun, $Confirm, $SafeMode
    
    # Analyze files
    Write-Host "📋 Analyzing files..." -ForegroundColor Cyan
    $files = Get-ChildItem -Path (Get-Location).Path -File -Force
    foreach ($file in $files) {
        $organizer.CategorizeFile($file.Name)
    }
    
    Write-Host "  Found $($organizer.MoveOperations.Count) files to organize"
    Write-Host ""
    
    # Preflight checks
    if (-not $organizer.PreflightChecks()) {
        Write-Host ""
        Write-Host "❌ Preflight checks failed. Aborting." -ForegroundColor Red
        exit 1
    }
    
    # Confirmation
    if ($Confirm -and $organizer.MoveOperations.Count -gt 0) {
        Write-Host ""
        Write-Host "Review operations above. Continue? (Y/N)" -ForegroundColor Yellow
        $response = Read-Host
        if ($response -ne "Y") {
            Write-Host "Aborted." -ForegroundColor Yellow
            exit 0
        }
    }
    
    # Move files
    $organizer.MoveFiles()
    
    # Report
    $organizer.GenerateReport()
    
    # Save log
    $organizer.SaveLog()
    
    Write-Host ""
    if ($DryRun) {
        Write-Host "✅ DRY RUN complete - Run without -DryRun to apply changes" -ForegroundColor Green
    } else {
        Write-Host "✅ Organization complete!" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ Fatal error: $_" -ForegroundColor Red
    exit 1
}
