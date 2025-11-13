# PowerShell script para desplegar directamente sin Git
# Copia archivos locales al servidor remoto y reinicia

param(
    [string]$ServerHost = "145.79.0.77",
    [string]$ServerUser = "root",
    [string]$ServerPassword = $env:DEPLOYMENT_PASSWORD,  # Lee de variable de entorno (NO hardcodear)
    [string]$RemoteDir = "/root/citizen-reports",
    [string]$LocalDir = "C:\PROYECTOS\citizen-reports"
)

$ErrorActionPreference = "Continue"

Write-Host "`n" + ("=" * 80) -ForegroundColor Cyan
Write-Host "🚀 DEPLOY DIRECTO - Sin Git (Copia de archivos locales)" -ForegroundColor Cyan
Write-Host ("=" * 80) + "`n" -ForegroundColor Cyan

# 1. Crear archivo de credenciales SSH para scp
Write-Host "🔐 Configurando credenciales SSH..." -ForegroundColor Yellow

$sshConfig = @"
Host $ServerHost
    User $ServerUser
    HostName $ServerHost
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
"@

$sshDir = "$env:USERPROFILE\.ssh"
if (!(Test-Path $sshDir)) {
    New-Item -ItemType Directory -Path $sshDir -Force | Out-Null
}

$sshConfig | Out-File -Encoding ASCII "$sshDir\config"
Write-Host "✅ SSH config creado`n" -ForegroundColor Green

# 2. Función para ejecutar comandos en el servidor
function Invoke-SSH {
    param([string]$Command, [string]$Description)
    
    Write-Host "📌 $Description" -ForegroundColor Cyan
    Write-Host "   Cmd: $Command" -ForegroundColor Gray
    
    # Usar ssh.exe (viene con Windows 10+)
    $result = & ssh -o StrictHostKeyChecking=no `
        -o PasswordAuthentication=yes `
        -o PreferredAuthentications=password `
        "$ServerUser@$ServerHost" "$Command" 2>&1
    
    # Mostrar resultado
    if ($result) {
        $result | ForEach-Object {
            Write-Host "   $_" -ForegroundColor Gray
        }
    }
    
    Write-Host ""
    return $LASTEXITCODE
}

# 3. Verificar que el directorio remoto existe
Write-Host "🔍 Verificando servidor remoto..." -ForegroundColor Yellow
Invoke-SSH "ls -la $RemoteDir/server/ | head -5" "Verificar estructura remota"

Write-Host "`n" + ("-" * 80) -ForegroundColor Gray

# 4. Copiar archivos críticos corregidos
Write-Host "`n📁 PASO 1: Copiar archivos corregidos al servidor" -ForegroundColor Yellow
Write-Host "   (Archivos modificados localmente)" -ForegroundColor Gray

$filesToCopy = @(
    "server/reportes_auth_routes.js",
    "server/app.js",
    "server/auth_routes.js",
    "server/auth_middleware.js"
)

foreach ($file in $filesToCopy) {
    $localPath = Join-Path $LocalDir $file
    $remotePath = "${ServerUser}@${ServerHost}:${RemoteDir}/${file}"
    
    if (Test-Path $localPath) {
        Write-Host "   📤 Copiando: $file" -ForegroundColor Cyan
        
        # Usar scp con ssh (ssh.exe debe estar disponible)
        # La contraseña se pasa mediante SSH_ASKPASS o interactivamente
        & scp -o StrictHostKeyChecking=no `
              -o PasswordAuthentication=yes `
              "$localPath" "$remotePath" 2>&1 | ForEach-Object {
            if ($_ -match "error|failed|denied") {
                Write-Host "      ⚠️  $_" -ForegroundColor Yellow
            }
        }
        
        Write-Host "      ✅ Completado" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  NO ENCONTRADO: $file" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host ("-" * 80) -ForegroundColor Gray

# 5. Reinstalar dependencias
Write-Host "`n📦 PASO 2: Reinstalar dependencias en servidor" -ForegroundColor Yellow

Invoke-SSH "cd $RemoteDir/server && npm install --production 2>&1 | tail -5" "Instalar dependencias backend"
Invoke-SSH "cd $RemoteDir/client && npm install --production 2>&1 | tail -5" "Instalar dependencias frontend"

# 6. Compilar frontend
Write-Host "`n🎨 PASO 3: Compilar interfaz (frontend)" -ForegroundColor Yellow

Invoke-SSH "cd $RemoteDir/client && npm run build 2>&1 | tail -10" "Compilar frontend"

# 7. Detener servidor anterior
Write-Host "`n🛑 PASO 4: Detener servidor anterior" -ForegroundColor Yellow

Invoke-SSH "pkill -f 'node server.js' 2>/dev/null || echo 'No hay proceso anterior'" "Detener servidor"
Start-Sleep -Seconds 2

# 8. Iniciar servidor
Write-Host "`n🚀 PASO 5: Iniciar nuevo servidor" -ForegroundColor Yellow

Invoke-SSH "cd $RemoteDir/server && nohup npm start > server.log 2>&1 &" "Iniciar servidor con nohup"
Start-Sleep -Seconds 4

# 9. Verificar que inició correctamente
Write-Host "`n🧪 PASO 6: Verificar endpoints" -ForegroundColor Yellow

Write-Host "   Test 1: GET /api/reportes" -ForegroundColor Cyan
Invoke-SSH "curl -s -w 'HTTP Status: %{http_code}\n' http://localhost:4000/api/reportes | head -c 150" "Test /api/reportes"

Write-Host "   Test 2: GET /api/reportes/tipos" -ForegroundColor Cyan
Invoke-SSH "curl -s -w '\nHTTP Status: %{http_code}\n' http://localhost:4000/api/reportes/tipos" "Test /api/reportes/tipos"

Write-Host "   Test 3: POST /api/auth/login" -ForegroundColor Cyan
Invoke-SSH "curl -s -w '\nHTTP Status: %{http_code}\n' -X POST -H 'Content-Type: application/json' -d '{}' http://localhost:4000/api/auth/login" "Test /api/auth/login"

# 10. Mostrar logs
Write-Host "`n📋 PASO 7: Logs del servidor" -ForegroundColor Yellow

Invoke-SSH "tail -20 $RemoteDir/server/server.log" "Últimas líneas de server.log"

# Resumen final
Write-Host "`n" + ("=" * 80) -ForegroundColor Green
Write-Host "✅ DEPLOY COMPLETADO" -ForegroundColor Green
Write-Host ("=" * 80) + "`n" -ForegroundColor Green

Write-Host "🌐 Panel Administrativo:" -ForegroundColor Yellow
Write-Host "   http://145.79.0.77:4000/#/panel`n" -ForegroundColor Cyan

Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Abre en el navegador: http://145.79.0.77:4000/#/panel" -ForegroundColor Gray
Write-Host "   2. Inicia sesión con admin@jantetelco.gob.mx / admin123" -ForegroundColor Gray
Write-Host "   3. Ve a 'Panel' → 'Mis Reportes Asignados'" -ForegroundColor Gray
Write-Host "   4. Verifica que carga sin errores" -ForegroundColor Gray

Write-Host "`n💾 Para ver logs después:" -ForegroundColor Yellow
Write-Host "   ssh root@145.79.0.77 'tail -100 /root/Citizen-reports/server/server.log'" -ForegroundColor Gray

Write-Host ""
