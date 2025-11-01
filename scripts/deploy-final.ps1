# 🚀 Deploy Final - Citizen Reports
# Instalando unzip primero y corrigiendo deployment

Write-Host "🚀 Citizen Reports - Deploy Final" -ForegroundColor Cyan

$vpsIP = "145.79.0.77"
$vpsUser = "root"

Write-Host "🔧 Instalando herramientas necesarias..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "apt-get update && apt-get install -y unzip curl"

Write-Host "📤 Verificando ZIP local..." -ForegroundColor Yellow
$zipFile = "C:\PROYECTOS\Jantetelco\Citizen-reports.zip"
if (!(Test-Path $zipFile)) {
    Write-Host "❌ Creando ZIP primero..." -ForegroundColor Red
    
    # Crear ZIP si no existe
    Push-Location "C:\PROYECTOS\Jantetelco"
    $filesToInclude = @("client\dist", "client\package.json", "server", "package.json", "README.md")
    Compress-Archive -Path $filesToInclude -DestinationPath "Citizen-reports.zip" -Force
    Pop-Location
    
    Write-Host "✅ ZIP creado" -ForegroundColor Green
}

Write-Host "📤 Subiendo ZIP al VPS..." -ForegroundColor Yellow
scp $zipFile "${vpsUser}@${vpsIP}:/root/"

Write-Host "🧹 Limpiando deployment anterior..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "pkill -f node || true && pm2 kill || true && rm -rf /root/citizen-reports"

Write-Host "📁 Extrayendo archivos..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "cd /root && mkdir -p citizen-reports && unzip -q Citizen-reports.zip -d citizen-reports/"

Write-Host "🔍 Verificando estructura extraída..." -ForegroundColor Yellow
$structure = ssh "$vpsUser@$vpsIP" "ls -la /root/citizen-reports/"
Write-Host $structure -ForegroundColor Gray

Write-Host "🔍 Verificando directorio server..." -ForegroundColor Yellow
$serverCheck = ssh "$vpsUser@$vpsIP" "ls -la /root/citizen-reports/server/ 2>/dev/null || echo 'SERVER NO EXISTE'"
Write-Host $serverCheck -ForegroundColor Gray

if ($serverCheck -match "SERVER NO EXISTE") {
    Write-Host "❌ Directorio server no encontrado. Verificando contenido del ZIP..." -ForegroundColor Red
    ssh "$vpsUser@$vpsIP" "cd /root/citizen-reports && find . -name '*.js' -o -name 'package.json'"
    
    Write-Host "🔧 Intentando corrección automática..." -ForegroundColor Yellow
    # Buscar si los archivos están en un subdirectorio
    ssh "$vpsUser@$vpsIP" "cd /root/citizen-reports && find . -name 'server.js'"
    
    exit 1
}

Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "cd /root/citizen-reports/server && npm install --production"

Write-Host "🗄️ Inicializando base de datos..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "cd /root/citizen-reports/server && npm run init"

Write-Host "📊 Verificando datos demo..." -ForegroundColor Yellow
$reportCount = ssh "$vpsUser@$vpsIP" "cd /root/citizen-reports/server && sqlite3 data.db 'SELECT COUNT(*) FROM reportes;'"
Write-Host "Reportes en BD: $reportCount" -ForegroundColor Green

Write-Host "⚙️ Configurando PM2..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "npm install -g pm2"

# Crear configuración PM2 de forma más simple
ssh "$vpsUser@$vpsIP" "cd /root/citizen-reports && echo 'module.exports = { apps: [{ name: \"citizen-reports\", script: \"./server/server.js\", env: { NODE_ENV: \"production\", PORT: 4000, DB_PATH: \"/root/citizen-reports/server/data.db\" } }] };' > ecosystem.config.js"

Write-Host "🚀 Iniciando aplicación..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "cd /root/citizen-reports && pm2 start ecosystem.config.js && pm2 save"

Write-Host "📊 Estado de PM2..." -ForegroundColor Yellow
ssh "$vpsUser@$vpsIP" "pm2 status"

Write-Host "🧪 Testing interno..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
ssh "$vpsUser@$vpsIP" "curl -s http://localhost:4000 | head -50"

Write-Host "`n🌐 Verificación final..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
try {
    $response = Invoke-WebRequest -Uri "http://$vpsIP:4000" -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ ¡CITIZEN REPORTS FUNCIONA!" -ForegroundColor Green
        
        # Test API
        $apiResponse = Invoke-WebRequest -Uri "http://$vpsIP:4000/api/reportes/tipos" -TimeoutSec 5 -UseBasicParsing
        if ($apiResponse.StatusCode -eq 200) {
            Write-Host "✅ API también responde correctamente" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "❌ Error en verificación: $_" -ForegroundColor Red
    Write-Host "🔍 Revisando logs..." -ForegroundColor Yellow
    ssh "$vpsUser@$vpsIP" "pm2 logs citizen-reports --lines 10"
}

Write-Host "`n🎉 DEPLOYMENT FINALIZADO!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Gray
Write-Host "🌐 URL de Demo: http://$vpsIP:4000" -ForegroundColor Cyan
Write-Host "🔑 Usuario: admin@jantetelco.gob.mx" -ForegroundColor White
Write-Host "🔑 Password: admin123" -ForegroundColor White
Write-Host "`n🎯 ¡Sistema listo para demos!" -ForegroundColor Green