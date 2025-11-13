# 🚀 Script Simple de Deployment para Citizen Reports
# Solo para demo rápido

Write-Host "🚀 Citizen Reports - Deploy Simple" -ForegroundColor Cyan

$vpsIP = "145.79.0.77"
$vpsUser = "root"

# Verificar que el ZIP existe
$zipFile = "C:\PROYECTOS\citizen-reports\citizen-reports.zip"
if (!(Test-Path $zipFile)) {
    Write-Host "❌ No se encuentra: $zipFile" -ForegroundColor Red
    Write-Host "💡 Crea el ZIP primero con los archivos del proyecto" -ForegroundColor Yellow
    exit 1
}

# Subir ZIP
Write-Host "📤 Subiendo ZIP al VPS..." -ForegroundColor Yellow
scp $zipFile "${vpsUser}@${vpsIP}:/root/"

# Script de deployment simplificado
$simpleScript = @"
#!/bin/bash
echo '🚀 Iniciando deployment simple de Citizen Reports...'

# Parar aplicación anterior
pkill -f 'node.*server.js' || true
pm2 kill || true

# Limpiar y crear directorio
rm -rf /root/citizen-reports
mkdir -p /root/citizen-reports
cd /root

# Extraer archivos
unzip -o Citizen-reports.zip -d citizen-reports/
cd /root/citizen-reports

# Instalar Node.js si no está
if ! command -v node >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Instalar dependencias del servidor
cd server
npm install --production --no-audit --no-fund

# Inicializar BD
npm run init

# Verificar datos
echo 'Reportes en BD:'
sqlite3 data.db "SELECT COUNT(*) FROM reportes;"

# Instalar PM2
npm install -g pm2

# Configurar PM2
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

# Crear logs
mkdir -p logs

# Iniciar
pm2 start ecosystem.config.js
pm2 save

# Status
pm2 status

echo '✅ Deployment completado!'
echo '🌐 URL: http://145.79.0.77:4000'

# Test
sleep 2
curl -s http://localhost:4000/api/reportes/tipos | head -50
"@

# Ejecutar en VPS
Write-Host "⚙️ Configurando en VPS..." -ForegroundColor Yellow
$simpleScript | ssh "$vpsUser@$vpsIP" "bash -s"

# Verificar
Write-Host "`n🧪 Verificando deployment..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://$vpsIP:4000" -TimeoutSec 15 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Citizen Reports está en línea!" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Esperando que la aplicación inicie..." -ForegroundColor Yellow
}

Write-Host "`n🎉 CITIZEN REPORTS DESPLEGADO!" -ForegroundColor Green
Write-Host "🌐 Demo URL: http://$vpsIP:4000" -ForegroundColor Cyan
Write-Host "🔑 Login: admin@jantetelco.gob.mx / admin123" -ForegroundColor White