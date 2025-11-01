# Deploy Final - Corrigiendo problemas específicos
Write-Host "🔧 Deploy Final - Solucionando SQLite3 y PM2" -ForegroundColor Green

$HOSTINGER_IP = "145.79.0.77"

Write-Host "1️⃣ Solucionando SQLite3 architecture mismatch..." -ForegroundColor Cyan
ssh root@$HOSTINGER_IP @"
cd /root/jantetelco/server
# Eliminar binarios compilados para Windows
rm -rf node_modules/sqlite3/build/
rm -rf node_modules/sqlite3/lib/binding/

# Instalar herramientas de compilación
apt-get update -qq
apt-get install -y build-essential python3 sqlite3 libsqlite3-dev

# Recompilar SQLite3 para Linux
npm rebuild sqlite3 --build-from-source

echo "SQLite3 recompilado para arquitectura Linux"
"@

Write-Host "2️⃣ Solucionando PM2 ESM module config..." -ForegroundColor Cyan
ssh root@$HOSTINGER_IP @"
cd /root/jantetelco
# Crear config compatible con ES modules
cat > ecosystem.config.cjs << 'EOFPM2'
module.exports = {
  apps: [{
    name: 'jantetelco-demo',
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

# Crear directorio logs
mkdir -p logs
echo "Configuración PM2 creada"
"@

Write-Host "3️⃣ Inicializando BD con SQLite3 reparado..." -ForegroundColor Cyan
ssh root@$HOSTINGER_IP @"
cd /root/jantetelco/server
npm run init
echo "Base de datos inicializada correctamente"
"@

Write-Host "4️⃣ Iniciando con PM2..." -ForegroundColor Cyan
ssh root@$HOSTINGER_IP @"
cd /root/jantetelco
pm2 kill
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
echo "PM2 configurado y aplicación iniciada"
"@

Write-Host "5️⃣ Verificaciones finales..." -ForegroundColor Green
Start-Sleep 5

ssh root@$HOSTINGER_IP "pm2 status"

Write-Host "6️⃣ Test de API..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://145.79.0.77:4000/api/reportes" -TimeoutSec 10
    Write-Host "✅ API funcionando: $($response.Count) reportes encontrados" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 DESPLIEGUE COMPLETADO EXITOSAMENTE!" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Yellow
    Write-Host "🌐 URL: http://145.79.0.77:4000" -ForegroundColor White
    Write-Host "👤 Usuario demo: admin@jantetelco.gob.mx" -ForegroundColor White
    Write-Host "🔑 Password: admin123" -ForegroundColor White
} catch {
    Write-Host "⚠️ API no responde aún, verificando logs..." -ForegroundColor Yellow
    ssh root@$HOSTINGER_IP "pm2 logs jantetelco-demo --lines 15"
}