# Diagnóstico y Fix - Citizen Reports
# Verificar y corregir el deployment que falló

Write-Host "🔍 DIAGNÓSTICO DEL DEPLOYMENT" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Gray

$vpsIP = "145.79.0.77"
$vpsUser = "root"

# Paso 1: Verificar qué se subió al VPS
Write-Host "`n1️⃣ Verificando archivos en VPS..." -ForegroundColor Yellow
$vpsFiles = ssh "$vpsUser@$vpsIP" "ls -la /root/"
Write-Host $vpsFiles -ForegroundColor Gray

# Paso 2: Intentar extraer el ZIP manualmente
Write-Host "`n2️⃣ Re-extrayendo Citizen-reports.zip..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "cd /root && rm -rf citizen-reports && mkdir -p citizen-reports"
ssh "$vpsUser@$vpsIP" "cd /root && unzip -o Citizen-reports.zip -d citizen-reports/ && ls -la citizen-reports/"

# Paso 3: Verificar estructura extraída
Write-Host "`n3️⃣ Verificando estructura extraída..." -ForegroundColor Yellow
$structure = ssh "$vpsUser@$vpsIP" "cd /root/citizen-reports && find . -type d -maxdepth 2"
Write-Host $structure -ForegroundColor Gray

# Paso 4: Verificar si server/ existe
Write-Host "`n4️⃣ Verificando directorio server..." -ForegroundColor Yellow
$serverCheck = ssh "$vpsUser@$vpsIP" "ls -la /root/citizen-reports/server/ 2>/dev/null || echo 'NO EXISTE'"
Write-Host $serverCheck -ForegroundColor Gray

# Paso 5: Si server existe, continuar con instalación
Write-Host "`n5️⃣ Instalando dependencias (si server/ existe)..." -ForegroundColor Yellow
$installResult = ssh "$vpsUser@$vpsIP" "cd /root/citizen-reports/server && npm install --production 2>/dev/null || echo 'ERROR: No se pudo instalar'"
Write-Host $installResult -ForegroundColor Gray

# Paso 6: Inicializar BD
Write-Host "`n6️⃣ Inicializando base de datos..." -ForegroundColor Yellow
$dbResult = ssh "$vpsUser@$vpsIP" "cd /root/citizen-reports/server && npm run init 2>/dev/null || echo 'ERROR: No se pudo inicializar BD'"
Write-Host $dbResult -ForegroundColor Gray

# Paso 7: Crear configuración PM2 correcta
Write-Host "`n7️⃣ Creando configuración PM2 corregida..." -ForegroundColor Yellow
$pm2ConfigCorrect = @'
module.exports = {
  apps: [
    {
      name: "citizen-reports-demo",
      script: "./server/server.js",
      cwd: "/root/citizen-reports",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
        DB_PATH: "/root/citizen-reports/server/data.db"
      },
      log_file: "/root/citizen-reports/logs/combined.log",
      error_file: "/root/citizen-reports/logs/error.log",
      out_file: "/root/citizen-reports/logs/out.log"
    }
  ]
};
'@

# Escribir configuración al archivo
ssh "$vpsUser@$vpsIP" @"
cd /root/citizen-reports
cat > ecosystem.config.js << 'ENDCONFIG'
$pm2ConfigCorrect
ENDCONFIG
"@

# Paso 8: Verificar que server.js existe
Write-Host "`n8️⃣ Verificando server.js..." -ForegroundColor Yellow
$serverJsCheck = ssh "$vpsUser@$vpsIP" "ls -la /root/citizen-reports/server/server.js 2>/dev/null || echo 'ARCHIVO NO EXISTE'"
Write-Host $serverJsCheck -ForegroundColor Gray

# Paso 9: Intentar iniciar con PM2
Write-Host "`n9️⃣ Iniciando aplicación con PM2..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "cd /root/citizen-reports && mkdir -p logs && pm2 delete all 2>/dev/null; pm2 start ecosystem.config.js"

# Paso 10: Verificar estado final
Write-Host "`n🔟 Estado final de PM2..." -ForegroundColor Yellow
$finalStatus = ssh "$vpsUser@$vpsIP" "pm2 status"
Write-Host $finalStatus -ForegroundColor Gray

# Paso 11: Test API
Write-Host "`n🧪 Testing API final..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
try {
    $response = Invoke-WebRequest -Uri "http://$vpsIP:4000" -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ ¡API RESPONDE CORRECTAMENTE!" -ForegroundColor Green
        Write-Host "🌐 Acceso: http://$vpsIP:4000" -ForegroundColor Cyan
    }
}
catch {
    Write-Host "❌ API no responde: $_" -ForegroundColor Red
    
    # Intentar diagnóstico adicional
    Write-Host "`n🔍 Diagnóstico adicional..." -ForegroundColor Yellow
    $processCheck = ssh "$vpsUser@$vpsIP" "ps aux | grep node"
    Write-Host $processCheck -ForegroundColor Gray
    
    # Ver logs de PM2
    Write-Host "`n📝 Últimos logs de PM2..." -ForegroundColor Yellow
    $pm2logs = ssh "$vpsUser@$vpsIP" "pm2 logs --lines 10"
    Write-Host $pm2logs -ForegroundColor Gray
}

Write-Host "`n📋 RESUMEN DEL DIAGNÓSTICO:" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Gray
Write-Host "1. Verificar los outputs de cada paso arriba" -ForegroundColor White
Write-Host "2. Si API no responde, revisar logs de PM2" -ForegroundColor White
Write-Host "3. Acceso manual: ssh $vpsUser@$vpsIP" -ForegroundColor White
Write-Host "4. Comandos útiles:" -ForegroundColor White
Write-Host "   - pm2 status" -ForegroundColor Gray
Write-Host "   - pm2 logs citizen-reports-demo" -ForegroundColor Gray
Write-Host "   - pm2 restart citizen-reports-demo" -ForegroundColor Gray