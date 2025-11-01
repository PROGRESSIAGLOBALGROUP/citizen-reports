# DEPLOY MANUAL - Paso a paso
# Ejecuta cada comando uno por uno y verifica que funcione

# ============================================================
# PASO 1: Limpiar servidor completamente
# ============================================================
Write-Host "PASO 1: Conectate al servidor y limpia" -ForegroundColor Cyan
Write-Host "Comando: ssh root@145.79.0.77" -ForegroundColor Yellow
Write-Host ""
Write-Host "Una vez conectado, ejecuta esto en el servidor:" -ForegroundColor Green
Write-Host @'
pm2 kill
rm -rf /root/citizen-reports /root/jantetelco
rm -f /root/Citizen-reports.zip /root/*.zip
echo "✅ Limpieza completa"
'@

# ============================================================
# PASO 2: Salir del servidor
# ============================================================
Write-Host ""
Write-Host "PASO 2: Sal del servidor" -ForegroundColor Cyan
Write-Host "Comando: exit" -ForegroundColor Yellow

# ============================================================
# PASO 3: Subir el paquete desde tu PC
# ============================================================
Write-Host ""
Write-Host "PASO 3: En tu PC (PowerShell local), sube el paquete:" -ForegroundColor Cyan
Write-Host "Comando:" -ForegroundColor Yellow
Write-Host "scp C:\PROYECTOS\Jantetelco\Citizen-reports.zip root@145.79.0.77:/root/" -ForegroundColor White

# ============================================================
# PASO 4: Conectate de nuevo y extrae
# ============================================================
Write-Host ""
Write-Host "PASO 4: Conectate de nuevo al servidor" -ForegroundColor Cyan
Write-Host "Comando: ssh root@145.79.0.77" -ForegroundColor Yellow
Write-Host ""
Write-Host "Una vez conectado, extrae el ZIP:" -ForegroundColor Green
Write-Host @'
cd /root
unzip -o Citizen-reports.zip -d citizen-reports
ls -la citizen-reports/ | head -20
'@

# ============================================================
# PASO 5: Crear estructura de carpetas
# ============================================================
Write-Host ""
Write-Host "PASO 5: Crear estructura correcta:" -ForegroundColor Cyan
Write-Host @'
mkdir -p /root/citizen-reports/server
mkdir -p /root/citizen-reports/client/dist
mkdir -p /root/citizen-reports/logs

# Crear carpeta temporal para organizar
mkdir -p /tmp/organize
cd /root/citizen-reports
ls *.js > /dev/null 2>&1 && mv *.js /tmp/organize/ || true
ls *.json > /dev/null 2>&1 && mv *.json /tmp/organize/ || true
ls *.sql > /dev/null 2>&1 && mv *.sql /tmp/organize/ || true
ls -d assets > /dev/null 2>&1 && mv assets /tmp/organize/ || true
ls index.html > /dev/null 2>&1 && mv index.html /tmp/organize/ || true

# Limpiar directorio
rm -rf /root/citizen-reports/*

# Copiar a estructura correcta
cp -r /tmp/organize/* /root/citizen-reports/server/ 2>/dev/null || true
mkdir -p /root/citizen-reports/client/dist
mv /root/citizen-reports/server/index.html /root/citizen-reports/client/dist/ 2>/dev/null || true
mv /root/citizen-reports/server/assets /root/citizen-reports/client/dist/ 2>/dev/null || true

# Limpiar
rm -rf /tmp/organize

echo "✅ Estructura creada"
ls -la /root/citizen-reports/
'@

# ============================================================
# PASO 6: Instalar dependencias
# ============================================================
Write-Host ""
Write-Host "PASO 6: Instalar dependencias (tardará 2-3 minutos):" -ForegroundColor Cyan
Write-Host @'
cd /root/citizen-reports/server
npm install --production
echo "✅ Dependencias instaladas"
ls node_modules | wc -l
'@

# ============================================================
# PASO 7: Inicializar BD
# ============================================================
Write-Host ""
Write-Host "PASO 7: Inicializar base de datos:" -ForegroundColor Cyan
Write-Host @'
cd /root/citizen-reports/server
npm run init
echo "✅ BD inicializada"
ls -lh data.db
'@

# ============================================================
# PASO 8: Crear configuración PM2
# ============================================================
Write-Host ""
Write-Host "PASO 8: Crear configuración PM2:" -ForegroundColor Cyan
Write-Host @'
cd /root/citizen-reports

cat > ecosystem.config.cjs << 'EOF'
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
    time: true
  }]
}
EOF

echo "✅ Configuración PM2 creada"
cat ecosystem.config.cjs
'@

# ============================================================
# PASO 9: Iniciar con PM2
# ============================================================
Write-Host ""
Write-Host "PASO 9: Iniciar aplicación:" -ForegroundColor Cyan
Write-Host @'
cd /root/citizen-reports
pm2 start ecosystem.config.cjs
pm2 save
pm2 status
'@

# ============================================================
# PASO 10: Esperar y verificar
# ============================================================
Write-Host ""
Write-Host "PASO 10: Esperar 3 segundos y verificar:" -ForegroundColor Cyan
Write-Host @'
sleep 3
pm2 logs citizen-reports --lines 10
'@

# ============================================================
# PASO 11: Test desde tu PC
# ============================================================
Write-Host ""
Write-Host "PASO 11: En tu PC (PowerShell), prueba la API:" -ForegroundColor Cyan
Write-Host "Comando:" -ForegroundColor Yellow
Write-Host 'Invoke-RestMethod -Uri "http://145.79.0.77:4000/api/reportes"' -ForegroundColor White

Write-Host ""
Write-Host "Si ves un JSON con reportes, ¡ESTÁ FUNCIONANDO!" -ForegroundColor Green
Write-Host ""
Write-Host "URL de acceso: http://145.79.0.77:4000" -ForegroundColor Green
Write-Host "Usuario: admin@jantetelco.gob.mx" -ForegroundColor Green
Write-Host "Password: admin123" -ForegroundColor Green
