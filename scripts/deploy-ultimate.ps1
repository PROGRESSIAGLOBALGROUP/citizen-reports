# 🚀 Deploy Ultimate - Citizen Reports
# Solucionando problemas de SQLite y PM2

Write-Host "🚀 Citizen Reports - Deploy Ultimate Fix" -ForegroundColor Cyan

$vpsIP = "145.79.0.77"
$vpsUser = "root"

Write-Host "🔧 Instalando herramientas del sistema..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "apt-get install -y sqlite3 sqlite3-dev build-essential python3"

Write-Host "📤 Subiendo ZIP al VPS..." -ForegroundColor Yellow
$zipFile = "C:\PROYECTOS\citizen-reports\citizen-reports.zip"
scp $zipFile "${vpsUser}@${vpsIP}:/root/"

Write-Host "🧹 Limpieza completa..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "pkill -f node || true && pm2 kill || true && rm -rf /root/citizen-reports"

Write-Host "📁 Extrayendo archivos..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "cd /root && mkdir -p citizen-reports && unzip -o Citizen-reports.zip -d citizen-reports/"

Write-Host "🔧 Recompilando SQLite3 para arquitectura correcta..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "cd /root/citizen-reports/server && rm -rf node_modules && npm install"

Write-Host "🗄️ Inicializando base de datos..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "cd /root/citizen-reports/server && npm run init"

Write-Host "📊 Verificando datos..." -ForegroundColor Yellow
$reportCount = ssh "$vpsUser@$vpsIP" "cd /root/citizen-reports/server && sqlite3 data.db 'SELECT COUNT(*) FROM reportes;'"
Write-Host "Reportes creados: $reportCount" -ForegroundColor Green

Write-Host "⚙️ Instalando PM2..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "npm install -g pm2"

Write-Host "📄 Creando configuración PM2 corregida..." -ForegroundColor Yellow
$pm2Config = @'
module.exports = {
  apps: [{
    name: "citizen-reports",
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
  }]
};
'@

# Escribir configuración al VPS
ssh "$vpsUser@$vpsIP" @"
cd /root/citizen-reports
cat > ecosystem.config.js << 'ENDCONFIG'
$pm2Config
ENDCONFIG
"@

Write-Host "📁 Creando directorio logs..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "mkdir -p /root/citizen-reports/logs"

Write-Host "🚀 Iniciando aplicación..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "cd /root/citizen-reports && pm2 start ecosystem.config.js && pm2 save"

Write-Host "📊 Estado de PM2..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "pm2 status"

Write-Host "🧪 Testing API interno..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
ssh "$vpsUser@$vpsIP" "curl -s http://localhost:4000/api/reportes/tipos | head -100"

Write-Host "`n🌐 Verificación final externa..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
try {
    $response = Invoke-WebRequest -Uri "http://$vpsIP:4000" -TimeoutSec 15 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ ¡CITIZEN REPORTS ESTÁ EN LÍNEA!" -ForegroundColor Green
        
        # Test API específica
        $apiTest = Invoke-WebRequest -Uri "http://$vpsIP:4000/api/reportes/tipos" -TimeoutSec 10 -UseBasicParsing
        if ($apiTest.StatusCode -eq 200) {
            Write-Host "✅ API funcionando correctamente" -ForegroundColor Green
            $content = $apiTest.Content | ConvertFrom-Json
            Write-Host "📊 Tipos de reportes disponibles: $($content.Count)" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "❌ Error en verificación: $_" -ForegroundColor Red
    Write-Host "🔍 Revisando logs de PM2..." -ForegroundColor Yellow
    ssh "$vpsUser@$vpsIP" "pm2 logs citizen-reports --lines 20"
}

Write-Host "`n🎉 DEPLOYMENT COMPLETADO!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Gray
Write-Host "🌐 URL Demo: http://$vpsIP:4000" -ForegroundColor Cyan
Write-Host "🔑 Login: admin@jantetelco.gob.mx" -ForegroundColor White
Write-Host "🔑 Password: admin123" -ForegroundColor White
Write-Host "`n💡 Comandos útiles:" -ForegroundColor Yellow
Write-Host "   ssh $vpsUser@$vpsIP" -ForegroundColor Gray
Write-Host "   pm2 status" -ForegroundColor Gray
Write-Host "   pm2 logs citizen-reports" -ForegroundColor Gray
Write-Host "   pm2 restart citizen-reports" -ForegroundColor Gray
Write-Host "`n🎯 ¡LISTO PARA TU DEMO!" -ForegroundColor Green