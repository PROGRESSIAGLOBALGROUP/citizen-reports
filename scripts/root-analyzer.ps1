#Requires -Version 5.1
<#
.SYNOPSIS
    Intelligent root directory analyzer - Categorizes files and suggests organization
.DESCRIPTION
    Analyzes all files in root directory, determines their purpose, and suggests
    optimal locations based on world-class project structure best practices
.PARAMETER ReportPath
    Output report file path (default: ./root-analysis-report.txt)
.PARAMETER Verbose
    Show detailed analysis for each file
#>

param(
    [string]$ReportPath = "./root-analysis-report.txt",
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

# Define file categories based on content and naming patterns
$fileCategories = @{
    "config" = @{
        patterns = @("\.eslintrc", "\.prettierrc", "\.editorconfig", "\.babelrc", "\.nvmrc", "tsconfig", "jest\.config", "vitest\.config", "playwright\.config")
        description = "Configuration files"
    }
    "documentation" = @{
        patterns = @("\.md$", "\.txt$")
        description = "Documentation files"
        exclusive = $false  # Can be root if README.md
    }
    "scripts" = @{
        patterns = @("\.ps1$", "\.sh$", "\.bat$", "\.js$")
        description = "Script files (excluding tests/main app)"
    }
    "test" = @{
        patterns = @("test_", "verify_", "\.test\.", "\.spec\.")
        description = "Test and verification files"
    }
    "root_only" = @{
        patterns = @("package\.json", "package-lock\.json", "\.gitignore", "README\.md")
        description = "Files that MUST be in root"
        protected = $true
    }
}

function Analyze-File {
    param([string]$FilePath, [string]$FileName)
    
    $analysis = @{
        name = $FileName
        path = $FilePath
        size = (Get-Item $FilePath).Length
        category = "unknown"
        suggestions = @()
        confidence = 0
        shouldMove = $false
        destination = $null
        reason = ""
    }
    
    # Check root_only files first
    foreach ($pattern in $fileCategories["root_only"].patterns) {
        if ($FileName -match $pattern) {
            $analysis.category = "root_only"
            $analysis.confidence = 100
            $analysis.shouldMove = $false
            $analysis.reason = "Protected - Must remain in root"
            return $analysis
        }
    }
    
    # Analyze by category
    foreach ($cat in $fileCategories.Keys) {
        if ($cat -eq "root_only") { continue }
        
        foreach ($pattern in $fileCategories[$cat].patterns) {
            if ($FileName -match $pattern) {
                $analysis.category = $cat
                $analysis.confidence = 100
                $analysis.shouldMove = $true
                
                # Determine destination
                switch ($cat) {
                    "config" { $analysis.destination = "config" }
                    "documentation" { $analysis.destination = "docs" }
                    "scripts" {
                        if ($FileName -match "deploy|prod|start|stop") {
                            $analysis.destination = "scripts/deployment"
                        } else {
                            $analysis.destination = "scripts/development"
                        }
                    }
                    "test" { $analysis.destination = "tests/fixtures" }
                }
                
                $analysis.reason = $fileCategories[$cat].description
                return $analysis
            }
        }
    }
    
    # If no pattern matched, analyze by content
    try {
        $content = Get-Content $FilePath -Raw -ErrorAction SilentlyContinue
        
        if ($content) {
            if ($content -match "#!/(bin|usr)" -or $content -match "function|npm run|docker") {
                $analysis.category = "scripts"
                $analysis.destination = "scripts/development"
                $analysis.confidence = 70
                $analysis.shouldMove = $true
                $analysis.reason = "Detected as script (content analysis)"
            }
            elseif ($content -match "test|describe|expect|assert") {
                $analysis.category = "test"
                $analysis.destination = "tests/fixtures"
                $analysis.confidence = 75
                $analysis.shouldMove = $true
                $analysis.reason = "Detected as test file (content analysis)"
            }
        }
    } catch { }
    
    return $analysis
}

function Generate-Report {
    param([array]$Analyses)
    
    $report = @()
    $report += "╔════════════════════════════════════════════════════════════════╗"
    $report += "║   ROOT DIRECTORY INTELLIGENT ANALYSIS REPORT                  ║"
    $report += "║   Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')                           ║"
    $report += "╚════════════════════════════════════════════════════════════════╝"
    $report += ""
    
    # Summary
    $shouldMove = @($Analyses | Where-Object { $_.shouldMove }).Count
    $protected = @($Analyses | Where-Object { $_.category -eq "root_only" }).Count
    $unknown = @($Analyses | Where-Object { $_.category -eq "unknown" }).Count
    
    $report += "📊 SUMMARY"
    $report += "  Total Files:       $($Analyses.Count)"
    $report += "  Should Move:       $shouldMove"
    $report += "  Protected (Root):  $protected"
    $report += "  Unclassified:      $unknown"
    $report += ""
    
    # Files by category
    $report += "📁 FILES BY CATEGORY"
    $report += ""
    
    foreach ($cat in @("root_only", "config", "documentation", "scripts", "test", "unknown")) {
        $catFiles = @($Analyses | Where-Object { $_.category -eq $cat })
        if ($catFiles.Count -gt 0) {
            $report += "  [$cat] - $($fileCategories[$cat].description)"
            foreach ($file in $catFiles | Sort-Object name) {
                $status = if ($file.shouldMove) { "→ MOVE" } else { "  KEEP" }
                $dest = if ($file.destination) { "to: $($file.destination)" } else { "" }
                $report += "    $status  $($file.name)  $dest  [$($file.confidence)% confidence]"
                if ($Verbose) {
                    $report += "           Reason: $($file.reason)"
                }
            }
            $report += ""
        }
    }
    
    # Recommended actions
    $report += "🎯 RECOMMENDED ACTIONS"
    $report += ""
    
    foreach ($file in $Analyses | Where-Object { $_.shouldMove } | Sort-Object destination) {
        $report += "  Move: $($file.name)"
        $report += "    → $($file.destination)/"
        $report += "    Confidence: $($file.confidence)%"
        $report += ""
    }
    
    # Protected files reminder
    $report += "🔒 PROTECTED FILES (Must stay in root)"
    foreach ($file in $Analyses | Where-Object { $_.category -eq "root_only" }) {
        $report += "  ✓ $($file.name)"
    }
    $report += ""
    
    # Quality gates
    $report += "⚠️ QUALITY GATES"
    if ($protected -lt 2) {
        $report += "  ❌ MISSING CRITICAL FILES: package.json and/or README.md"
    } else {
        $report += "  ✅ All critical root files present"
    }
    
    if ($unknown -gt 0) {
        $report += "  ⚠️  WARNING: $unknown unclassified files found - manual review recommended"
    } else {
        $report += "  ✅ All files classified"
    }
    
    if ($shouldMove -gt 0) {
        $report += "  ℹ️  $shouldMove files ready to move to organized structure"
    }
    
    $report += ""
    $report += "════════════════════════════════════════════════════════════════"
    
    return $report -join "`n"
}

# Main execution
Write-Host "🔍 Analyzing root directory..." -ForegroundColor Cyan

$rootPath = Get-Location
$files = Get-ChildItem -Path $rootPath -File -Force | Where-Object { $_.Name -notmatch "^\." -or $_.Name -eq ".gitignore" }

$analyses = @()
foreach ($file in $files) {
    $analysis = Analyze-File -FilePath $file.FullName -FileName $file.Name
    $analyses += $analysis
    
    if ($Verbose) {
        Write-Host "  Analyzed: $($file.Name) → $($analysis.category) (confidence: $($analysis.confidence)%)"
    }
}

# Generate and save report
$report = Generate-Report -Analyses $analyses
$report | Out-File -FilePath $ReportPath -Encoding UTF8

Write-Host ""
Write-Host "✅ Analysis complete!" -ForegroundColor Green
Write-Host "📄 Report saved to: $ReportPath"
Write-Host ""

# Display report
Write-Host $report

# Export analysis as JSON for scripting
$jsonPath = $ReportPath -replace "\.txt$", ".json"
$analyses | ConvertTo-Json | Out-File -FilePath $jsonPath -Encoding UTF8
Write-Host "📊 Data exported to: $jsonPath" -ForegroundColor Cyan
