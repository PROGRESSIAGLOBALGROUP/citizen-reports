# Deploy Simple - Un solo comando SSH
Write-Host "🚀 Deploy Simple - Comando único" -ForegroundColor Green

$HOSTINGER_IP = "145.79.0.77"

Write-Host "� Subiendo paquete..." -ForegroundColor Cyan
scp .\Citizen-reports.zip root@${HOSTINGER_IP}:/root/

Write-Host ""
Write-Host "🔧 Configurando todo en un comando..." -ForegroundColor Cyan
Write-Host "⚠️  Este proceso puede tardar 3-5 minutos..." -ForegroundColor Yellow

ssh root@$HOSTINGER_IP "
cd /root &&
echo 'Limpiando...' &&
pm2 kill 2>/dev/null || true &&
rm -rf citizen-reports jantetelco 2>/dev/null || true &&
echo 'Extrayendo...' &&
unzip -o Citizen-reports.zip &&
echo 'Organizando estructura...' &&
mkdir -p citizen-reports/server citizen-reports/client citizen-reports/logs &&
find . -maxdepth 1 -name '*.js' -exec mv {} citizen-reports/server/ \; &&
find . -maxdepth 1 -name '*.json' -exec mv {} citizen-reports/server/ \; &&
mv schema.sql citizen-reports/server/ 2>/dev/null || true &&
mv index.html citizen-reports/client/ 2>/dev/null || true &&
mv assets citizen-reports/client/ 2>/dev/null || true &&
mv README.md citizen-reports/ 2>/dev/null || true &&
echo 'Verificando archivos...' &&
ls -la citizen-reports/server/ | head -5 &&
echo 'Instalando dependencias...' &&
cd citizen-reports/server &&
npm install --production --no-audit &&
echo 'Inicializando BD...' &&
npm run init &&
echo 'Configurando PM2...' &&
cd .. &&
cat > ecosystem.config.cjs << 'EOFCONFIG'
module.exports = {
  apps: [{
    name: 'citizen-reports',
    script: './server/server.js',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      PORT: 4000,
      DB_PATH: './server/data.db'
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOFCONFIG
echo 'Iniciando aplicación...' &&
pm2 start ecosystem.config.cjs &&
pm2 save &&
echo 'Deploy completado!' &&
pm2 status
"

Write-Host ""
Write-Host "🧪 Testing API..." -ForegroundColor Cyan
Start-Sleep 5

try {
    $response = Invoke-RestMethod -Uri "http://145.79.0.77:4000/api/reportes" -TimeoutSec 15
    Write-Host ""
    Write-Host "🎉 ¡DESPLIEGUE EXITOSO!" -ForegroundColor Green
    Write-Host "======================" -ForegroundColor Yellow
    Write-Host "🌐 URL: http://145.79.0.77:4000" -ForegroundColor White
    Write-Host "📊 Reportes: $($response.Count)" -ForegroundColor White
    Write-Host "👤 Usuario: admin@jantetelco.gob.mx" -ForegroundColor White
    Write-Host "🔑 Password: admin123" -ForegroundColor White
} catch {
    Write-Host ""
    Write-Host "⚠️ API no responde. Verificando logs..." -ForegroundColor Yellow
    ssh root@$HOSTINGER_IP "pm2 logs citizen-reports --lines 10"
}