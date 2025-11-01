# Deploy Manual - Versión por pasos separados
Write-Host "🚀 Deploy Manual - Paso a paso" -ForegroundColor Green

$HOSTINGER_IP = "145.79.0.77"

Write-Host "📦 Paso 1: Verificando paquete..." -ForegroundColor Cyan
if (Test-Path ".\Citizen-reports.zip") {
    Write-Host "✅ Paquete existe: $(Get-Item .\Citizen-reports.zip | Select-Object -ExpandProperty Length) bytes" -ForegroundColor Green
} else {
    Write-Host "❌ No existe paquete. Creando..." -ForegroundColor Red
    
    # Eliminar paquete anterior si existe
    if (Test-Path ".\Citizen-reports.zip") {
        Remove-Item ".\Citizen-reports.zip" -Force
    }
    
    # Crear paquete SIN node_modules
    $compress = @{
        Path = @(
            ".\client\dist\*",
            ".\server\*.js", 
            ".\server\*.json",
            ".\server\schema.sql",
            ".\package.json",
            ".\README.md"
        )
        DestinationPath = ".\Citizen-reports.zip"
        CompressionLevel = "Fastest"
    }
    Compress-Archive @compress
    Write-Host "✅ Paquete creado" -ForegroundColor Green
}

Write-Host ""
Write-Host "📤 Paso 2: Subiendo paquete..." -ForegroundColor Cyan
scp .\Citizen-reports.zip root@${HOSTINGER_IP}:/root/

Write-Host ""
Write-Host "🧹 Paso 3: Limpiando servidor..." -ForegroundColor Cyan
ssh root@$HOSTINGER_IP "pm2 kill; rm -rf citizen-reports jantetelco; echo 'Limpieza completa'"

Write-Host ""
Write-Host "📂 Paso 4: Extrayendo archivos..." -ForegroundColor Cyan
ssh root@$HOSTINGER_IP "cd /root && unzip -o Citizen-reports.zip -d citizen-reports && echo 'Archivos extraídos'"

Write-Host ""
Write-Host "🔧 Paso 5: Configurando estructura..." -ForegroundColor Cyan
ssh root@$HOSTINGER_IP "cd /root/citizen-reports && ls -la && echo 'Contenido verificado'"

Write-Host ""
Write-Host "📚 Paso 6: Instalando dependencias..." -ForegroundColor Cyan
Write-Host "⚠️  Este paso puede tardar 2-3 minutos..." -ForegroundColor Yellow
ssh root@$HOSTINGER_IP "cd /root/citizen-reports/server && npm install --production && echo 'Dependencias instaladas'"

Write-Host ""
Write-Host "🗄️ Paso 7: Inicializando BD..." -ForegroundColor Cyan
ssh root@$HOSTINGER_IP "cd /root/citizen-reports/server && npm run init && echo 'BD inicializada'"

Write-Host ""
Write-Host "⚙️ Paso 8: Configurando PM2..." -ForegroundColor Cyan
$pm2Config = @"
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
"@

# Crear archivo temporal local
$pm2Config | Out-File -FilePath ".\temp-pm2.config.cjs" -Encoding UTF8 -NoNewline

# Subir configuración
scp .\temp-pm2.config.cjs root@${HOSTINGER_IP}:/root/citizen-reports/ecosystem.config.cjs

# Limpiar archivo temporal
Remove-Item ".\temp-pm2.config.cjs" -Force

ssh root@$HOSTINGER_IP "cd /root/citizen-reports && mkdir -p logs && echo 'PM2 configurado'"

Write-Host ""
Write-Host "🚀 Paso 9: Iniciando aplicación..." -ForegroundColor Cyan
ssh root@$HOSTINGER_IP "cd /root/citizen-reports && pm2 start ecosystem.config.cjs && pm2 save"

Write-Host ""
Write-Host "✅ Paso 10: Verificaciones..." -ForegroundColor Green
Start-Sleep 3
ssh root@$HOSTINGER_IP "pm2 status"

Write-Host ""
Write-Host "🧪 Paso 11: Test de API..." -ForegroundColor Cyan
Start-Sleep 2

try {
    $response = Invoke-RestMethod -Uri "http://145.79.0.77:4000/api/reportes" -TimeoutSec 10
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
    
    Write-Host ""
    Write-Host "🔍 Para debug manual:" -ForegroundColor Cyan
    Write-Host "   ssh root@145.79.0.77" -ForegroundColor Gray
    Write-Host "   cd /root/citizen-reports" -ForegroundColor Gray
    Write-Host "   pm2 logs citizen-reports" -ForegroundColor Gray
    Write-Host "   node server/server.js --test" -ForegroundColor Gray
}