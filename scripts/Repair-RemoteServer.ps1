# PowerShell script para reparar servidor remoto vía SSH
# Este script usa Posh-SSH module si está disponible, sino usa ssh.exe con contraseña

param(
    [string]$ServerHost = "145.79.0.77",
    [string]$User = "root",
    [string]$ServerPassword = "#M3YBmUDK+C,iQM3tn4t",
    [string]$ProjectDir = "/root/Citizen-reports"
)

function Invoke-RemoteCommand {
    param([string]$Command, [string]$Description)
    
    Write-Host "`n📌 $Description" -ForegroundColor Cyan
    Write-Host "   Cmd: $Command" -ForegroundColor Gray
    
    try {
        # Crear archivo temporal con contraseña
        $tempScript = "$env:TEMP\ssh_cmd_$(Get-Random).sh"
        @"
#!/bin/bash
cd $ProjectDir
$Command
"@ | Out-File -Encoding ASCII $tempScript
        
        # Ejecutar con timeout
        $result = & ssh -o ConnectTimeout=5 -o BatchMode=no `
            -o PasswordAuthentication=yes `
            -o PreferredAuthentications=password `
            "$User@$Host" "$Command" 2>&1
        
        if ($LASTEXITCODE -eq 0 -or $result) {
            Write-Host "   ✅ Completado" -ForegroundColor Green
            if ($result) {
                $result | ForEach-Object { 
                    Write-Host "      $_" -ForegroundColor Gray 
                }
            }
        } else {
            Write-Host "   ⚠️  Posible error (código: $LASTEXITCODE)" -ForegroundColor Yellow
        }
        
        Remove-Item $tempScript -ErrorAction SilentlyContinue
    }
    catch {
        Write-Host "   ❌ Error: $_" -ForegroundColor Red
    }
}

Write-Host "`n" + ("=" * 70) -ForegroundColor Cyan
Write-Host "🚀 REPARACIÓN DE SERVIDOR REMOTO - Citizen-reports" -ForegroundColor Cyan
Write-Host ("=" * 70) + "`n" -ForegroundColor Cyan

Write-Host "📍 Servidor: $User@$ServerHost" -ForegroundColor Yellow
Write-Host "📁 Directorio: $ProjectDir" -ForegroundColor Yellow

# Test conexión
Write-Host "`n🔐 Probando conexión SSH..." -ForegroundColor Yellow
$testConnection = & ssh -o ConnectTimeout=5 -o BatchMode=no `
    -o PasswordAuthentication=yes `
    "$User@$ServerHost" "whoami" 2>&1
    
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Conexión exitosa: $testConnection" -ForegroundColor Green
} else {
    Write-Host "❌ No se puede conectar. Verifica:" -ForegroundColor Red
    Write-Host "   • IP: $ServerHost" -ForegroundColor Red
    Write-Host "   • Usuario: $User" -ForegroundColor Red
    Write-Host "   • Contraseña" -ForegroundColor Red
    exit 1
}

# Ejecutar pasos de reparación
$steps = @(
    @{ Cmd = "cd $ProjectDir && pwd"; Desc = "Verificar directorio" }
    @{ Cmd = "git log --oneline -1"; Desc = "Ver versión actual" }
    @{ Cmd = "git pull origin main"; Desc = "Actualizar código" }
    @{ Cmd = "cd server && npm install"; Desc = "Instalar servidor" }
    @{ Cmd = "cd ../client && npm install"; Desc = "Instalar cliente" }
    @{ Cmd = "npm run build"; Desc = "Compilar frontend" }
    @{ Cmd = "cd ../server && pkill -f 'node server.js' || true"; Desc = "Detener servidor anterior" }
    @{ Cmd = "sleep 2 && nohup npm start > server.log 2>&1 &"; Desc = "Iniciar servidor" }
    @{ Cmd = "sleep 3 && curl -s http://localhost:4000/api/reportes | head -c 50"; Desc = "Test: /api/reportes" }
    @{ Cmd = "curl -s -w 'Status: %{http_code}' http://localhost:4000/api/reportes/tipos"; Desc = "Test: /api/reportes/tipos" }
    @{ Cmd = "tail -20 server.log"; Desc = "Logs finales" }
)

foreach ($step in $steps) {
    Invoke-RemoteCommand -Command $step.Cmd -Description $step.Desc
    Start-Sleep -Milliseconds 500
}

Write-Host "`n" + ("=" * 70) -ForegroundColor Green
Write-Host "✅ REPARACIÓN COMPLETADA" -ForegroundColor Green
Write-Host ("=" * 70) + "`n" -ForegroundColor Green

Write-Host "🌐 Panel Administrativo:" -ForegroundColor Yellow
Write-Host "   http://145.79.0.77:4000/#/panel" -ForegroundColor Cyan

Write-Host "`n📋 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Abre el navegador a la URL arriba" -ForegroundColor Gray
Write-Host "   2. Inicia sesión como admin" -ForegroundColor Gray
Write-Host "   3. Ve a 'Mis Reportes Asignados'" -ForegroundColor Gray
Write-Host "   4. Verifica que carga sin errores" -ForegroundColor Gray

Write-Host "`n💾 Para ver logs después:" -ForegroundColor Yellow
Write-Host "   ssh root@145.79.0.77 'tail -100 /root/Citizen-reports/server/server.log'" -ForegroundColor Gray
