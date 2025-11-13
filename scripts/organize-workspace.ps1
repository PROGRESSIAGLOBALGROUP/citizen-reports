#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Smart File Organizer para Citizen-Reports Project
  Reorganiza archivos del raíz siguiendo mejores prácticas de arquitectura
  
.DESCRIPTION
  Este script analiza cada archivo en el raíz y lo reorganiza en carpetas
  apropiadas basándose en:
  - Tipo de archivo (docs, scripts, config, test, etc)
  - Patrón de nombre (deploy, fix, test, etc)
  - Contenido (cuando es necesario)
  - Mejores prácticas de class mundial
  
.EXAMPLE
  .\organize-workspace.ps1 -DryRun
  .\organize-workspace.ps1 -Verbose
#>

param(
  [switch]$DryRun = $false,
  [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"
$VerbosePreference = if ($Verbose) { "Continue" } else { "SilentlyContinue" }

# Colors
$colors = @{
  Success = "Green"
  Warning = "Yellow"
  Error   = "Red"
  Info    = "Cyan"
}

function Write-Log {
  param([string]$Message, [string]$Level = "Info")
  $color = $colors[$Level] ?? "White"
  Write-Host "[$Level] $Message" -ForegroundColor $color
}

# Define categorización de archivos
$fileCategories = @{
  "docs" = @{
    patterns = @("*.md", "README*", "CHANGELOG*")
    desc = "Documentación del proyecto"
  }
  "scripts/deployment" = @{
    patterns = @("deploy*.ps1", "start-*.ps1", "stop-*.ps1", "*.sh")
    desc = "Scripts de deployment y control de servidor"
  }
  "scripts/development" = @{
    patterns = @("check-*.js", "verify-*.js", "test-*.js")
    desc = "Scripts de desarrollo y verificación"
  }
  "config" = @{
    patterns = @(".eslintrc*", ".prettierrc*", "jest.config.*", "vitest.config.*", "playwright.config.*")
    desc = "Archivos de configuración"
  }
  "tests/fixtures" = @{
    patterns = @("test_*.json", "*.json" -ne "package*.json")
    desc = "Datos de prueba y fixtures"
  }
  ".github" = @{
    patterns = @("approve.json", "temp_*.json")
    desc = "Archivos temporales de CI/CD"
  }
  "docs/archive" = @{
    patterns = @("BUGFIX_*.md", "RESUMEN_*.md", "IMPLEMENTACION_*.md", "FASE_*.md", "FIX_*.md", 
                 "DEPLOYMENT_*.md", "FINAL_STATUS_*.md", "COPILOT_INSTRUCTIONS_UPDATE*.md",
                 "DOCUMENTACION_*.md", "CENTRALIZACION_*.md", "REPOBLACION_*.md",
                 "RESUMEN_CAMBIOS_*.md", "MEJORAS_*.md", "PLAN_*.md", "PROBLEMA*.md",
                 "DEMO_INSTRUCTIONS_*.md", "ESTRATEGIA_*.md")
    desc = "Archivo de documentación histórica"
  }
}

# Archivos que NO se deben tocar
$protectedFiles = @(
  "package.json", "package-lock.json",
  ".gitignore", ".github/copilot-instructions.md",
  "README.md",
  "jest.config.cjs", "vitest.config.ts", "playwright.config.ts"
)

# Obtener todos los archivos del raíz
$rootFiles = @(Get-ChildItem -Path "c:\PROYECTOS\citizen-reports" -File -Force) | 
  Where-Object { $_.Directory.FullName -eq "c:\PROYECTOS\citizen-reports" -and $_.Name -notin $protectedFiles }

$statistics = @{
  Total = $rootFiles.Count
  Moved = 0
  Protected = ($protectedFiles | Measure-Object).Count
  Skipped = 0
}

Write-Log "🔍 Analizando $($statistics.Total) archivos en raíz..." "Info"
Write-Log "🔒 Protegidos: $($statistics.Protected)" "Info"

# Procesar cada archivo
foreach ($file in $rootFiles) {
  $moved = $false
  $targetPath = $null
  
  # Determinar categoría
  foreach ($category in $fileCategories.GetEnumerator()) {
    $patterns = $category.Value.patterns
    
    foreach ($pattern in $patterns) {
      if ($file.Name -like $pattern) {
        $targetPath = Join-Path "c:\PROYECTOS\citizen-reports" $category.Key
        Write-Log "📂 $($file.Name) → $($category.Key)/" "Info"
        $moved = $true
        break
      }
    }
    if ($moved) { break }
  }
  
  # Si no se encontró categoría pero es un archivo temporal
  if (-not $moved) {
    if ($file.Extension -in @(".log", ".tmp", ".bak")) {
      $targetPath = "c:\PROYECTOS\citizen-reports\backups"
      $moved = $true
    }
    elseif ($file.Name -eq "MAP.txt" -or $file.Name -eq "SOLUCION.md" -or 
            $file.Name -eq "MONITOR-README.md" -or $file.Name -eq "INICIO_RAPIDO.md") {
      $targetPath = "c:\PROYECTOS\citizen-reports\docs"
      $moved = $true
    }
    elseif ($file.Name -like "*.zip") {
      $targetPath = "c:\PROYECTOS\citizen-reports\backups"
      $moved = $true
    }
  }
  
  # Ejecutar movimiento
  if ($moved -and $targetPath) {
    if (-not (Test-Path $targetPath)) {
      Write-Log "  Creando carpeta: $targetPath" "Info"
      if (-not $DryRun) { New-Item -ItemType Directory -Path $targetPath -Force | Out-Null }
    }
    
    $newPath = Join-Path $targetPath $file.Name
    
    if ($DryRun) {
      Write-Log "  [DRY RUN] Move-Item '$($file.FullName)' → '$newPath'" "Warning"
    } else {
      Move-Item -Path $file.FullName -Destination $newPath -Force
      Write-Log "  ✅ Movido" "Success"
    }
    $statistics.Moved++
  } else {
    Write-Log "⏭️  $($file.Name) → Sin categoría (permanece en raíz)" "Warning"
    $statistics.Skipped++
  }
}

# Mostrar resumen
Write-Host ""
Write-Log "═══════════════════════════════════════════════════════════════" "Info"
Write-Log "📊 RESUMEN DE REORGANIZACIÓN" "Info"
Write-Log "═══════════════════════════════════════════════════════════════" "Info"
Write-Log "Total archivos raíz: $($statistics.Total)" "Info"
Write-Log "Movidos: $($statistics.Moved)" "Success"
Write-Log "Saltados: $($statistics.Skipped)" "Warning"
Write-Log "Protegidos: $($statistics.Protected)" "Info"

if ($DryRun) {
  Write-Log "" "Info"
  Write-Log "⚠️  MODO SIMULACIÓN (DRY RUN)" "Warning"
  Write-Log "Para aplicar cambios, ejecuta: .\organize-workspace.ps1" "Warning"
}

Write-Log "✅ Completado" "Success"
