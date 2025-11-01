# Deploy Corregido - Estructura de archivos arreglada
Write-Host "🚀 Deploy Corregido - Arreglando estructura" -ForegroundColor Green

$HOSTINGER_IP = "145.79.0.77"

Write-Host "🧹 Paso 1: Limpiando servidor..." -ForegroundColor Cyan
ssh root@$HOSTINGER_IP "pm2 kill; rm -rf citizen-reports jantetelco; echo 'Servidor limpio'"

Write-Host ""
Write-Host "📤 Paso 2: Subiendo paquete..." -ForegroundColor Cyan
scp .\Citizen-reports.zip root@${HOSTINGER_IP}:/root/

Write-Host ""
Write-Host "📂 Paso 3: Creando estructura correcta..." -ForegroundColor Cyan
ssh root@$HOSTINGER_IP @"
cd /root
# Crear directorios
mkdir -p citizen-reports/server
mkdir -p citizen-reports/client

# Extraer archivos
unzip -o Citizen-reports.zip

# Mover archivos a estructura correcta
mv *.js citizen-reports/server/ 2>/dev/null || true
mv *.json citizen-reports/server/ 2>/dev/null || true
mv schema.sql citizen-reports/server/ 2>/dev/null || true
mv index.html citizen-reports/client/ 2>/dev/null || true
mv assets/ citizen-reports/client/ 2>/dev/null || true
mv README.md citizen-reports/ 2>/dev/null || true

echo "Estructura reorganizada"
"@

Write-Host ""
Write-Host "🔍 Paso 4: Verificando estructura..." -ForegroundColor Cyan
ssh root@$HOSTINGER_IP "cd /root/citizen-reports && echo 'Contenido raíz:' && ls -la && echo 'Contenido server:' && ls -la server/ | head -10"

Write-Host ""
Write-Host "📚 Paso 5: Instalando dependencias..." -ForegroundColor Cyan
Write-Host "⚠️  Este paso puede tardar 2-3 minutos..." -ForegroundColor Yellow
ssh root@$HOSTINGER_IP "cd /root/citizen-reports/server && npm install --production && echo 'Dependencias instaladas'"

Write-Host ""
Write-Host "🗄️ Paso 6: Inicializando BD..." -ForegroundColor Cyan
ssh root@$HOSTINGER_IP "cd /root/citizen-reports/server && npm run init && echo 'BD inicializada'"

Write-Host ""
Write-Host "⚙️ Paso 7: Configurando PM2..." -ForegroundColor Cyan
# Crear configuración PM2 localmente
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

# Escribir archivo sin BOM
[System.IO.File]::WriteAllText(".\temp-pm2.config.cjs", $pm2Config, [System.Text.UTF8Encoding]::new($false))

# Subir configuración
scp .\temp-pm2.config.cjs root@${HOSTINGER_IP}:/root/citizen-reports/ecosystem.config.cjs

# Limpiar archivo temporal
Remove-Item ".\temp-pm2.config.cjs" -Force

ssh root@$HOSTINGER_IP "cd /root/citizen-reports && mkdir -p logs && echo 'PM2 configurado'"

Write-Host ""
Write-Host "🚀 Paso 8: Iniciando aplicación..." -ForegroundColor Cyan
ssh root@$HOSTINGER_IP "cd /root/citizen-reports && pm2 start ecosystem.config.cjs && pm2 save"

Write-Host ""
Write-Host "✅ Paso 9: Verificaciones..." -ForegroundColor Green
Start-Sleep 3
ssh root@$HOSTINGER_IP "pm2 status"

Write-Host ""
Write-Host "🧪 Paso 10: Test de API..." -ForegroundColor Cyan
Start-Sleep 3

try {
    $response = Invoke-RestMethod -Uri "http://145.79.0.77:4000/api/reportes" -TimeoutSec 10
    Write-Host ""
    Write-Host "🎉 ¡DESPLIEGUE EXITOSO!" -ForegroundColor Green
    Write-Host "======================" -ForegroundColor Yellow
    Write-Host "🌐 URL: http://145.79.0.77:4000" -ForegroundColor White
    Write-Host "📊 Reportes: $($response.Count)" -ForegroundColor White
    Write-Host "👤 Usuario: admin@jantetelco.gob.mx" -ForegroundColor White
    Write-Host "🔑 Password: admin123" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 La aplicación está corriendo en el servidor!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "⚠️ API no responde. Revisando logs..." -ForegroundColor Yellow
    ssh root@$HOSTINGER_IP "pm2 logs citizen-reports --lines 15"
    
    Write-Host ""
    Write-Host "🔍 Para debug manual:" -ForegroundColor Cyan
    Write-Host "   ssh root@145.79.0.77" -ForegroundColor Gray
    Write-Host "   cd /root/citizen-reports" -ForegroundColor Gray
    Write-Host "   pm2 logs citizen-reports" -ForegroundColor Gray
    Write-Host "   node server/server.js" -ForegroundColor Gray
}