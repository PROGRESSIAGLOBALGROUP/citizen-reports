# Upload y Deploy Script - Citizen Reports
# Sube el código local al VPS y hace deployment completo

Write-Host "🚀 Citizen Reports Deployment Script" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Gray

$vpsIP = "145.79.0.77"
$vpsUser = "root"
$localPath = "c:\PROYECTOS\Jantetelco"
$remotePath = "/root/citizen-reports"

# Paso 1: Verificar que el build del frontend existe
Write-Host "`n1️⃣ Verificando build del frontend..." -ForegroundColor Yellow
$distPath = "$localPath\client\dist\index.html"
if (!(Test-Path $distPath)) {
    Write-Host "❌ Frontend no está built. Ejecutando build..." -ForegroundColor Red
    
    Push-Location "$localPath\client"
    try {
        npm run build
        Write-Host "✅ Frontend built exitosamente" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Error building frontend: $_" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
} else {
    Write-Host "✅ Frontend ya está built" -ForegroundColor Green
}

# Paso 2: Crear ZIP de deployment
Write-Host "`n2️⃣ Creando package de deployment..." -ForegroundColor Yellow
$deployZip = "$localPath\Citizen-reports.zip"

# Eliminar ZIP anterior si existe
if (Test-Path $deployZip) {
    Remove-Item $deployZip -Force
}

# Crear ZIP con archivos necesarios
$filesToInclude = @(
    "client\dist",
    "client\package.json", 
    "client\vite.config.js",
    "server",
    "package.json",
    "README.md",
    "start-prod.ps1"
)

Push-Location $localPath
try {
    Compress-Archive -Path $filesToInclude -DestinationPath $deployZip -Force -ErrorAction Stop
    Write-Host "✅ Package creado: $deployZip" -ForegroundColor Green
    
    # Mostrar tamaño
    $zipSize = (Get-Item $deployZip).Length / 1MB
    Write-Host "📦 Tamaño: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Gray
}
catch {
    Write-Host "❌ Error creando ZIP: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

# Paso 3: Upload al VPS
Write-Host "`n3️⃣ Subiendo al VPS..." -ForegroundColor Yellow
Write-Host "📤 Destino: ${vpsUser}@${vpsIP}:${remotePath}/" -ForegroundColor Gray

try {
    # Upload usando SCP
    scp $deployZip "${vpsUser}@${vpsIP}:/root/"
    Write-Host "✅ Archivo subido exitosamente" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error subiendo archivo: $_" -ForegroundColor Red
    Write-Host "💡 Verifica la conexión SSH" -ForegroundColor Yellow
    exit 1
}

# Paso 4: Deployment remoto
Write-Host "`n4️⃣ Ejecutando deployment en VPS..." -ForegroundColor Yellow

$deployCommands = @"
# Deployment automático en VPS
echo '🚀 Iniciando deployment de Citizen Reports...'

# Limpiar deployment anterior
sudo pkill -f 'node.*server.js' || true
rm -rf /root/citizen-reports-old
mv /root/citizen-reports /root/citizen-reports-old 2>/dev/null || true

# Crear directorio y extraer
mkdir -p /root/citizen-reports
cd /root
unzip -o Citizen-reports.zip -d citizen-reports/

# Verificar extracción
cd /root/citizen-reports
ls -la

# Instalar Node.js 20 si no está
if ! command -v node &> /dev/null; then
    echo '📦 Instalando Node.js 20...'
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Verificar versión
echo '📋 Node version:' `$(node --version)`
echo '📋 NPM version:' `$(npm --version)`

# Instalar dependencias del servidor
echo '📦 Instalando dependencias del servidor...'
cd server
npm install --production --silent

# Inicializar base de datos con datos demo
echo '🗄️ Inicializando base de datos...'
npm run init

# Verificar BD
echo '🔍 Verificando datos demo:'
sqlite3 data.db "SELECT COUNT(*) as total_reportes FROM reportes;"

# Instalar PM2 globalmente
if ! command -v pm2 &> /dev/null; then
    echo '⚙️ Instalando PM2...'
    sudo npm install -g pm2
fi

# Crear configuración PM2
cd /root/citizen-reports
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'citizen-reports-demo',
      script: './server/server.js',
      cwd: '/root/citizen-reports',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        DB_PATH: '/root/citizen-reports/server/data.db'
      },
      log_file: '/root/citizen-reports/logs/combined.log',
      error_file: '/root/citizen-reports/logs/error.log',
      out_file: '/root/citizen-reports/logs/out.log',
      merge_logs: true
    }
  ]
};
EOF

# Crear directorio de logs
mkdir -p logs

# Iniciar aplicación con PM2
echo '🚀 Iniciando aplicación...'
pm2 start ecosystem.config.js
pm2 save

# Configurar autostart
pm2 startup systemd -u root --hp /root

# Verificar estado
pm2 status

# Test final
echo '🧪 Testing endpoints...'
sleep 3
curl -s http://localhost:4000/api/reportes/tipos | head -c 100
echo

echo '✅ Deployment completado!'
echo '🌐 Acceso: http://145.79.0.77:4000'
echo '📊 Status: pm2 status'
echo '📝 Logs: pm2 logs citizen-reports-demo'

# Cleanup
rm -f /root/Citizen-reports.zip
"@

# Ejecutar comandos remotos
Write-Host "⚙️ Ejecutando comandos de deployment..." -ForegroundColor Cyan
try {
    $deployCommands | ssh "$vpsUser@$vpsIP" "bash -s"
    Write-Host "`n✅ DEPLOYMENT COMPLETADO!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error durante deployment: $_" -ForegroundColor Red
    exit 1
}

# Paso 5: Verificación final
Write-Host "`n5️⃣ Verificación final..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://$vpsIP:4000/api/reportes/tipos" -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ API responde correctamente" -ForegroundColor Green
        Write-Host "📋 Tipos disponibles: $($response.Content.Length) bytes" -ForegroundColor Gray
    }
}
catch {
    Write-Host "⚠️ API no responde aún (normal, puede tardar 30 segundos)" -ForegroundColor Yellow
}

Write-Host "`n🎉 CITIZEN REPORTS DESPLEGADO!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Gray
Write-Host "🌐 URL para demos: http://$vpsIP:4000" -ForegroundColor Cyan
Write-Host "👤 Login demo: admin@jantetelco.gob.mx" -ForegroundColor White
Write-Host "🔑 Password: admin123" -ForegroundColor White
Write-Host "`n💡 Para monitorear:" -ForegroundColor Yellow
Write-Host "   ssh $vpsUser@$vpsIP" -ForegroundColor Gray
Write-Host "   pm2 status" -ForegroundColor Gray
Write-Host "   pm2 logs citizen-reports-demo" -ForegroundColor Gray

Write-Host "`n🎯 ¡Listo para tu demo con prospects!" -ForegroundColor Green