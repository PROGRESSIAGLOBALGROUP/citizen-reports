#!/usr/bin/env pwsh
# Script para levantar ambos servidores de citizen-reports

Write-Host "🚀 Iniciando citizen-reports Servers..." -ForegroundColor Cyan
Write-Host ""

# Kill existing processes
Write-Host "🛑 Deteniendo procesos anteriores..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Start Backend
Write-Host "📦 Iniciando Backend (Puerto 4000)..." -ForegroundColor Green
$backendJob = Start-Job -ScriptBlock {
    Set-Location c:\PROYECTOS\citizen-reports\server
    node server-dev.js
} -Name "Backend"

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "⚛️  Iniciando Frontend (Puerto 5173)..." -ForegroundColor Green
$frontendJob = Start-Job -ScriptBlock {
    Set-Location c:\PROYECTOS\citizen-reports\client
    npm run dev
} -Name "Frontend"

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✅ Servidores iniciados correctamente!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "📍 Backend:  http://localhost:4000" -ForegroundColor Cyan
Write-Host ""
Write-Host "� Estado de procesos:" -ForegroundColor Yellow
Get-Job | Select-Object Name, State

Write-Host ""
Write-Host "⏸️  Presiona Ctrl+C para detener los servidores" -ForegroundColor Yellow

# Keep script running
while ($true) {
    Start-Sleep -Seconds 10
    
    # Check if jobs are still running
    $backendState = (Get-Job -Name "Backend" -ErrorAction SilentlyContinue).State
    $frontendState = (Get-Job -Name "Frontend" -ErrorAction SilentlyContinue).State
    
    if ($backendState -ne "Running") {
        Write-Host "⚠️  Backend se cayó, reiniciando..." -ForegroundColor Red
        Get-Job -Name "Backend" -ErrorAction SilentlyContinue | Remove-Job -Force
        Start-Job -ScriptBlock {
            Set-Location c:\PROYECTOS\citizen-reports\server
            node server-dev.js
        } -Name "Backend" | Out-Null
    }
    
    if ($frontendState -ne "Running") {
        Write-Host "⚠️  Frontend se cayó, reiniciando..." -ForegroundColor Red
        Get-Job -Name "Frontend" -ErrorAction SilentlyContinue | Remove-Job -Force
        Start-Job -ScriptBlock {
            Set-Location c:\PROYECTOS\citizen-reports\client
            npm run dev
        } -Name "Frontend" | Out-Null
    }
}
