#!/usr/bin/env pwsh
# Deploy Correcto - Estructura adecuada
Write-Host "🚀 Deploy Correcto - Organización de archivos" -ForegroundColor Green

$HOSTINGER_IP = "145.79.0.77"

# PASO 1: Limpiar servidor completamente
Write-Host ""
Write-Host "🧹 PASO 1: Limpiando servidor..." -ForegroundColor Cyan
ssh root@$HOSTINGER_IP @'
pm2 kill
rm -rf /root/citizen-reports
rm -f /root/Citizen-reports.zip
echo "✅ Servidor limpio"
'@

# PASO 2: Subir paquete
Write-Host "📤 PASO 2: Subiendo paquete..." -ForegroundColor Cyan
scp .\Citizen-reports.zip root@${HOSTINGER_IP}:/root/

# PASO 3: Extraer y reorganizar
Write-Host "📂 PASO 3: Extrayendo y reorganizando..." -ForegroundColor Cyan
ssh root@$HOSTINGER_IP @'
cd /root

# Extraer a carpeta temporal
mkdir -p temp-extract
cd temp-extract
unzip -q ../Citizen-reports.zip

# Crear estructura correcta
mkdir -p ../citizen-reports/server
mkdir -p ../citizen-reports/client/dist

# Mover archivos de servidor
mv index.html assets/ *.css ../citizen-reports/client/dist/ 2>/dev/null || true
mv *.js package.json package-lock.json schema.sql README.md ../citizen-reports/server/ 2>/dev/null || true

# Limpiar
cd /root
rm -rf temp-extract

echo "✅ Estructura creada correctamente"
ls -la citizen-reports/
'@

# PASO 4: Instalar dependencias
Write-Host "📚 PASO 4: Instalando dependencias (esto puede tardar)..." -ForegroundColor Cyan
ssh root@$HOSTINGER_IP @'
cd /root/citizen-reports/server
npm install --production --no-audit --no-fund
echo "✅ Dependencias instaladas"
'@

# PASO 5: Inicializar BD
Write-Host "🗄️ PASO 5: Inicializando base de datos..." -ForegroundColor Cyan
ssh root@$HOSTINGER_IP @'
cd /root/citizen-reports/server
npm run init
echo "✅ BD inicializada"
'@

# PASO 6: Crear configuración PM2
Write-Host "⚙️ PASO 6: Configurando PM2..." -ForegroundColor Cyan

# Crear archivo con formato correcto (sin \r\n)
$pm2Content = @'
module.exports = {
  apps: [{
    name: 'citizen-reports',
    script: './server.js',
    cwd: '/root/citizen-reports/server',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      PORT: 4000,
      DB_PATH: './data.db'
    },
    error_file: '/root/citizen-reports/logs/error.log',
    out_file: '/root/citizen-reports/logs/out.log',
    time: true,
    max_memory_restart: '500M'
  }]
}
'@

# Guardar sin caracteres especiales
[System.IO.File]::WriteAllText("$PSScriptRoot\temp-pm2.config.cjs", $pm2Content, [System.Text.Encoding]::UTF8)

# Subir configuración
scp "$PSScriptRoot\temp-pm2.config.cjs" root@${HOSTINGER_IP}:/root/citizen-reports/ecosystem.config.cjs

# Limpiar archivo temporal
Remove-Item "$PSScriptRoot\temp-pm2.config.cjs" -Force

ssh root@$HOSTINGER_IP @'
mkdir -p /root/citizen-reports/logs
echo "✅ PM2 configurado"
'@

# PASO 7: Iniciar aplicación
Write-Host "🚀 PASO 7: Iniciando aplicación..." -ForegroundColor Cyan
ssh root@$HOSTINGER_IP @'
cd /root/citizen-reports
pm2 start ecosystem.config.cjs
pm2 save
echo "✅ Aplicación iniciada"
'@

# PASO 8: Esperar y verificar
Write-Host "⏳ Esperando que la aplicación se inicie..." -ForegroundColor Yellow
Start-Sleep 3

Write-Host "📊 PASO 8: Estado actual..." -ForegroundColor Cyan
ssh root@$HOSTINGER_IP "pm2 status"

# PASO 9: Test de API
Write-Host ""
Write-Host "🧪 PASO 9: Probando API..." -ForegroundColor Cyan
Start-Sleep 2

try {
    $response = Invoke-RestMethod -Uri "http://145.79.0.77:4000/api/reportes" -TimeoutSec 10 -ErrorAction Stop
    Write-Host ""
    Write-Host "✅ ¡API FUNCIONANDO!" -ForegroundColor Green
    Write-Host "===================" -ForegroundColor Yellow
    Write-Host "🌐 URL: http://145.79.0.77:4000" -ForegroundColor White
    Write-Host "📊 Reportes: $($response.Count)" -ForegroundColor White
    Write-Host "👤 Usuario: admin@jantetelco.gob.mx" -ForegroundColor White
    Write-Host "🔑 Password: admin123" -ForegroundColor White
} catch {
    Write-Host ""
    Write-Host "❌ API no responde. Verificando logs..." -ForegroundColor Red
    ssh root@$HOSTINGER_IP "pm2 logs citizen-reports --lines 20"
    
    Write-Host ""
    Write-Host "🔍 Debug: Verificando estructura..." -ForegroundColor Yellow
    ssh root@$HOSTINGER_IP "ls -la /root/citizen-reports/server/ | head -20"
}
