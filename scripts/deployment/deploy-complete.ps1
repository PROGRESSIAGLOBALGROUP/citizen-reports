# Deploy Completo - Sin confirmaciones y empaquetado correcto
Write-Host "🚀 Deploy Completo - Citizen Reports" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Yellow

$HOSTINGER_IP = "145.79.0.77"

# ========================================
# FASE 1: EMPAQUETADO LOCAL (SIN node_modules)
# ========================================
Write-Host "📦 1. Creando paquete optimizado..." -ForegroundColor Cyan

# Eliminar paquete anterior si existe
if (Test-Path ".\Citizen-reports.zip") {
    Remove-Item ".\Citizen-reports.zip" -Force
    Write-Host "   ✓ Paquete anterior eliminado" -ForegroundColor Green
}

# Verificar que el frontend esté compilado
if (-not (Test-Path ".\client\dist")) {
    Write-Host "   🔨 Compilando frontend..." -ForegroundColor Yellow
    Set-Location client
    npm run build
    Set-Location ..
}

Write-Host "   📁 Empaquetando archivos (SIN node_modules)..." -ForegroundColor Yellow

# Crear ZIP excluyendo node_modules y archivos innecesarios
$compress = @{
    Path = @(
        ".\client\dist\*",
        ".\server\*.js", 
        ".\server\*.json",
        ".\server\schema.sql",
        ".\package.json",
        ".\README.md",
        ".\start-prod.ps1"
    )
    DestinationPath = ".\Citizen-reports.zip"
    CompressionLevel = "Fastest"
}
Compress-Archive @compress

Write-Host "   ✅ Paquete creado: $(Get-Item .\Citizen-reports.zip | Select-Object -ExpandProperty Length) bytes" -ForegroundColor Green

# ========================================
# FASE 2: LIMPIEZA Y SUBIDA AL SERVIDOR
# ========================================
Write-Host "🗂️ 2. Limpiando servidor remoto..." -ForegroundColor Cyan
ssh root@$HOSTINGER_IP @"
# Detener aplicación existente
pm2 kill 2>/dev/null || true

# Eliminar todo el directorio anterior SIN CONFIRMACIÓN
rm -rf /root/citizen-reports/ 2>/dev/null || true
rm -rf /root/jantetelco/ 2>/dev/null || true
rm -f /root/Citizen-reports.zip 2>/dev/null || true

echo "Servidor limpio"
"@

Write-Host "📤 3. Subiendo nuevo paquete..." -ForegroundColor Cyan
scp -o StrictHostKeyChecking=no .\Citizen-reports.zip root@${HOSTINGER_IP}:/root/

# ========================================
# FASE 3: INSTALACIÓN Y CONFIGURACIÓN
# ========================================
Write-Host "🔧 4. Extrayendo e instalando..." -ForegroundColor Cyan
ssh root@$HOSTINGER_IP @"
cd /root
unzip -q Citizen-reports.zip -d citizen-reports/

# Crear estructura correcta
mkdir -p citizen-reports/server/
mkdir -p citizen-reports/client/

# Mover archivos a estructura correcta
mv /root/citizen-reports/*.js citizen-reports/server/ 2>/dev/null || true
mv /root/citizen-reports/*.json citizen-reports/server/ 2>/dev/null || true
mv /root/citizen-reports/schema.sql citizen-reports/server/ 2>/dev/null || true
mv /root/citizen-reports/dist/ citizen-reports/client/ 2>/dev/null || true

cd citizen-reports/server

echo "Estructura creada correctamente"
"@

Write-Host "📚 5. Instalando dependencias de producción..." -ForegroundColor Cyan
ssh root@$HOSTINGER_IP @"
cd /root/citizen-reports/server

# Instalar herramientas de compilación (para SQLite3)
apt-get update -qq
apt-get install -y build-essential python3 sqlite3 libsqlite3-dev

# Instalar dependencias de producción únicamente
npm install --production --no-audit --no-fund

echo "Dependencias instaladas"
"@

Write-Host "🗄️ 6. Inicializando base de datos..." -ForegroundColor Cyan
ssh root@$HOSTINGER_IP @"
cd /root/citizen-reports/server
npm run init
echo "Base de datos inicializada"
"@

# ========================================
# FASE 4: CONFIGURACIÓN PM2
# ========================================
Write-Host "⚙️ 7. Configurando PM2..." -ForegroundColor Cyan
ssh root@$HOSTINGER_IP @"
cd /root/citizen-reports

# Instalar PM2 globalmente si no existe
npm install -g pm2 2>/dev/null || true

# Crear configuración PM2 compatible con ES modules
cat > ecosystem.config.cjs << 'EOFPM2'
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
    time: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}
EOFPM2

mkdir -p logs
echo "PM2 configurado"
"@

# ========================================
# FASE 5: INICIO DE LA APLICACIÓN
# ========================================
Write-Host "🚀 8. Iniciando aplicación..." -ForegroundColor Cyan
ssh root@$HOSTINGER_IP @"
cd /root/citizen-reports
pm2 start ecosystem.config.cjs
pm2 save
echo "Aplicación iniciada"
"@

# ========================================
# FASE 6: VERIFICACIONES
# ========================================
Write-Host "✅ 9. Verificaciones finales..." -ForegroundColor Green
Start-Sleep 3

ssh root@$HOSTINGER_IP "pm2 status"

Write-Host "🧪 10. Probando API..." -ForegroundColor Cyan
Start-Sleep 2

try {
    $response = Invoke-RestMethod -Uri "http://145.79.0.77:4000/api/reportes" -TimeoutSec 15
    Write-Host ""
    Write-Host "🎉 ¡DESPLIEGUE EXITOSO!" -ForegroundColor Green
    Write-Host "======================" -ForegroundColor Yellow
    Write-Host "🌐 URL: http://145.79.0.77:4000" -ForegroundColor White
    Write-Host "📊 API: $($response.Count) reportes disponibles" -ForegroundColor White
    Write-Host "👤 Usuario: admin@jantetelco.gob.mx" -ForegroundColor White
    Write-Host "🔑 Password: admin123" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Comandos útiles:" -ForegroundColor Cyan
    Write-Host "   ssh root@145.79.0.77" -ForegroundColor Gray
    Write-Host "   pm2 status" -ForegroundColor Gray
    Write-Host "   pm2 logs citizen-reports" -ForegroundColor Gray
} catch {
    Write-Host "⚠️ API no responde, verificando logs..." -ForegroundColor Yellow
    ssh root@$HOSTINGER_IP "pm2 logs citizen-reports --lines 10"
    Write-Host ""
    Write-Host "🔍 Para debug manual:" -ForegroundColor Cyan
    Write-Host "   ssh root@145.79.0.77" -ForegroundColor Gray
    Write-Host "   cd /root/citizen-reports" -ForegroundColor Gray
    Write-Host "   pm2 logs citizen-reports" -ForegroundColor Gray
}