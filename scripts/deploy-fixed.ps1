# 🚀 Deploy Corregido - Citizen Reports
# Sin problemas de caracteres de Windows

Write-Host "🚀 Citizen Reports - Deploy Corregido" -ForegroundColor Cyan

$vpsIP = "145.79.0.77"
$vpsUser = "root"

# Verificar ZIP
$zipFile = "C:\PROYECTOS\Jantetelco\Citizen-reports.zip"
if (!(Test-Path $zipFile)) {
    Write-Host "❌ No se encuentra: $zipFile" -ForegroundColor Red
    exit 1
}

# Subir ZIP
Write-Host "📤 Subiendo ZIP al VPS..." -ForegroundColor Yellow
scp $zipFile "${vpsUser}@${vpsIP}:/root/"

# Ejecutar deployment con comandos separados para evitar problemas de formato
Write-Host "⚙️ Limpiando deployment anterior..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "pkill -f 'node.*server.js' || true"
ssh "$vpsUser@$vpsIP" "pm2 kill || true"
ssh "$vpsUser@$vpsIP" "rm -rf /root/citizen-reports"

Write-Host "📁 Creando directorio y extrayendo..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "mkdir -p /root/citizen-reports"
ssh "$vpsUser@$vpsIP" "cd /root && unzip -o Citizen-reports.zip -d citizen-reports/"

Write-Host "📋 Verificando extracción..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "ls -la /root/citizen-reports/"

Write-Host "🐧 Instalando Node.js (si no está)..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "command -v node || (curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs)"

Write-Host "📦 Instalando dependencias del servidor..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "cd /root/citizen-reports/server && npm install --production --no-audit --no-fund"

Write-Host "🗄️ Inicializando base de datos..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "cd /root/citizen-reports/server && npm run init"

Write-Host "🔍 Verificando datos demo..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "cd /root/citizen-reports/server && sqlite3 data.db 'SELECT COUNT(*) as reportes FROM reportes;'"

Write-Host "⚙️ Instalando PM2..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "npm install -g pm2"

Write-Host "📄 Creando configuración PM2..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" @"
cd /root/citizen-reports
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'citizen-reports',
    script: './server/server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 4000,
      DB_PATH: '/root/citizen-reports/server/data.db'
    }
  }]
};
EOF
"@

Write-Host "📁 Creando directorio de logs..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "mkdir -p /root/citizen-reports/logs"

Write-Host "🚀 Iniciando aplicación..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "cd /root/citizen-reports && pm2 start ecosystem.config.js && pm2 save"

Write-Host "📊 Verificando estado..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "pm2 status"

Write-Host "🧪 Testing API..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
ssh "$vpsUser@$vpsIP" "curl -s http://localhost:4000/api/reportes/tipos | head -100"

# Verificación final desde Windows
Write-Host "`n🌐 Verificando acceso externo..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://$vpsIP:4000" -TimeoutSec 15 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ ¡CITIZEN REPORTS ESTÁ EN LÍNEA!" -ForegroundColor Green
        Write-Host "🎉 Deployment EXITOSO!" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Verificando si la app está iniciando..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    try {
        $response2 = Invoke-WebRequest -Uri "http://$vpsIP:4000" -TimeoutSec 10 -UseBasicParsing
        if ($response2.StatusCode -eq 200) {
            Write-Host "✅ ¡CITIZEN REPORTS ESTÁ EN LÍNEA!" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ La aplicación no responde. Revisar logs:" -ForegroundColor Red
        Write-Host "   ssh $vpsUser@$vpsIP" -ForegroundColor Gray
        Write-Host "   pm2 logs citizen-reports" -ForegroundColor Gray
    }
}

Write-Host "`n🎉 DEPLOYMENT COMPLETADO!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Gray
Write-Host "🌐 Demo URL: http://$vpsIP:4000" -ForegroundColor Cyan
Write-Host "🔑 Login: admin@jantetelco.gob.mx" -ForegroundColor White
Write-Host "🔑 Password: admin123" -ForegroundColor White
Write-Host "`n💡 Para monitorear:" -ForegroundColor Yellow
Write-Host "   ssh $vpsUser@$vpsIP" -ForegroundColor Gray
Write-Host "   pm2 status" -ForegroundColor Gray
Write-Host "   pm2 logs citizen-reports" -ForegroundColor Gray
Write-Host "`n🎯 ¡Listo para demostrar a tus prospects!" -ForegroundColor Green