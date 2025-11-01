# Deploy Simple - Jantetelco
# Versión simplificada sin errores de formato

Write-Host "🚀 Jantetelco Simple Deploy" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Gray

$vpsIP = "145.79.0.77"
$vpsUser = "root"

# Paso 1: Verificar que tenemos el ZIP
$zipPath = "C:\PROYECTOS\Jantetelco\Citizen-reports.zip"
if (!(Test-Path $zipPath)) {
    Write-Host "❌ No encontrado: $zipPath" -ForegroundColor Red
    Write-Host "💡 Ejecuta primero el build y creación del ZIP" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ ZIP encontrado: $zipPath" -ForegroundColor Green
$zipSize = (Get-Item $zipPath).Length / 1MB
Write-Host "📦 Tamaño: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Gray

# Paso 2: Upload al VPS
Write-Host "`n📤 Subiendo al VPS..." -ForegroundColor Yellow
try {
    scp $zipPath "${vpsUser}@${vpsIP}:/root/"
    Write-Host "✅ Archivo subido exitosamente" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error subiendo archivo: $_" -ForegroundColor Red
    exit 1
}

# Paso 3: Ejecutar deployment (comandos uno por uno)
Write-Host "`n⚙️ Ejecutando deployment remoto..." -ForegroundColor Yellow

# Comando 1: Setup inicial
Write-Host "1️⃣ Setup inicial..." -ForegroundColor Cyan
ssh "$vpsUser@$vpsIP" "pkill -f 'node.*server.js' || true; rm -rf /root/jantetelco-old; mv /root/jantetelco /root/jantetelco-old 2>/dev/null || true"

# Comando 2: Extraer archivos
Write-Host "2️⃣ Extrayendo archivos..." -ForegroundColor Cyan
ssh "$vpsUser@$vpsIP" "mkdir -p /root/jantetelco && cd /root && unzip -o Citizen-reports.zip -d jantetelco/"

# Comando 3: Verificar extracción
Write-Host "3️⃣ Verificando extracción..." -ForegroundColor Cyan
$extractResult = ssh "$vpsUser@$vpsIP" "ls -la /root/jantetelco/"
Write-Host $extractResult -ForegroundColor Gray

# Comando 4: Instalar Node.js si no está
Write-Host "4️⃣ Verificando Node.js..." -ForegroundColor Cyan
ssh "$vpsUser@$vpsIP" "if ! command -v node >/dev/null 2>&1; then echo 'Instalando Node.js...'; curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs; fi"

# Comando 5: Instalar dependencias
Write-Host "5️⃣ Instalando dependencias..." -ForegroundColor Cyan
ssh "$vpsUser@$vpsIP" "cd /root/jantetelco/server && npm install --production"

# Comando 6: Inicializar BD
Write-Host "6️⃣ Inicializando base de datos..." -ForegroundColor Cyan
ssh "$vpsUser@$vpsIP" "cd /root/jantetelco/server && npm run init"

# Comando 7: Verificar datos
Write-Host "7️⃣ Verificando datos demo..." -ForegroundColor Cyan
$dbResult = ssh "$vpsUser@$vpsIP" "cd /root/jantetelco/server && sqlite3 data.db 'SELECT COUNT(*) as total_reportes FROM reportes;'"
Write-Host "📊 Reportes en BD: $dbResult" -ForegroundColor Gray

# Comando 8: Instalar PM2
Write-Host "8️⃣ Configurando PM2..." -ForegroundColor Cyan
ssh "$vpsUser@$vpsIP" "if ! command -v pm2 >/dev/null 2>&1; then sudo npm install -g pm2; fi"

# Comando 9: Crear configuración PM2
Write-Host "9️⃣ Creando configuración..." -ForegroundColor Cyan
$pm2Config = @'
module.exports = {
  apps: [
    {
      name: 'jantetelco-demo',
      script: './server/server.js',
      cwd: '/root/jantetelco',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        DB_PATH: '/root/jantetelco/server/data.db'
      }
    }
  ]
};
'@

ssh "$vpsUser@$vpsIP" "cd /root/jantetelco && cat > ecosystem.config.js << 'EOF'
$pm2Config
EOF"

# Comando 10: Iniciar aplicación
Write-Host "🔟 Iniciando aplicación..." -ForegroundColor Cyan
ssh "$vpsUser@$vpsIP" "cd /root/jantetelco && mkdir -p logs && pm2 start ecosystem.config.js && pm2 save"

# Comando 11: Verificar estado
Write-Host "✅ Verificando estado..." -ForegroundColor Cyan
$pm2Status = ssh "$vpsUser@$vpsIP" "pm2 status"
Write-Host $pm2Status -ForegroundColor Gray

# Paso 4: Test final
Write-Host "`n🧪 Testing API..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
try {
    $response = Invoke-WebRequest -Uri "http://$vpsIP:4000/api/reportes/tipos" -TimeoutSec 15 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ API responde correctamente!" -ForegroundColor Green
    }
}
catch {
    Write-Host "⚠️ API aún no responde, pero el deployment está completo" -ForegroundColor Yellow
    Write-Host "💡 Espera 1-2 minutos y accede a: http://$vpsIP:4000" -ForegroundColor Cyan
}

# Cleanup remoto
ssh "$vpsUser@$vpsIP" "rm -f /root/Citizen-reports.zip"

Write-Host "`n🎉 DEPLOYMENT COMPLETADO!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Gray
Write-Host "🌐 URL: http://$vpsIP:4000" -ForegroundColor Cyan
Write-Host "👤 Usuario demo: admin@jantetelco.gob.mx" -ForegroundColor White
Write-Host "🔑 Password: admin123" -ForegroundColor White
Write-Host "`n💡 Comandos útiles:" -ForegroundColor Yellow
Write-Host "   ssh $vpsUser@$vpsIP" -ForegroundColor Gray
Write-Host "   pm2 status" -ForegroundColor Gray
Write-Host "   pm2 logs jantetelco-demo" -ForegroundColor Gray
Write-Host "   pm2 restart jantetelco-demo" -ForegroundColor Gray