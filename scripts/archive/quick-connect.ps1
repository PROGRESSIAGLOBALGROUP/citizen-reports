# Quick SSH Connection to Citizen-Reports VPS
# Creado: 2025-10-29 para deployment inmediato

Write-Host "🚀 Conexión rápida a Citizen-Reports VPS" -ForegroundColor Cyan
Write-Host "📍 Servidor: 145.79.0.77" -ForegroundColor Yellow
Write-Host "👤 Usuario: root" -ForegroundColor Yellow

# Verificar que SSH está disponible
if (!(Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ SSH no disponible. Instalando OpenSSH Client..." -ForegroundColor Red
    Write-Host "💡 Ve a: Configuración > Aplicaciones > Características opcionales > OpenSSH Client" -ForegroundColor Yellow
    Write-Host "💡 O ejecuta como Admin: Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0" -ForegroundColor Gray
    
    # Intentar instalar automáticamente
    try {
        Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
        Write-Host "✅ OpenSSH Client instalado!" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️ No se pudo instalar automáticamente. Hazlo manualmente." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "`n🔐 Usa la variable de entorno: $env:DEPLOYMENT_PASSWORD" -ForegroundColor Cyan
Write-Host "💡 Configúrala en tu sesión PowerShell antes de ejecutar este script" -ForegroundColor Yellow

Write-Host "`n🔌 Conectando..." -ForegroundColor Green
Write-Host "💡 Pega la password cuando te la pida" -ForegroundColor Yellow

try {
    # Conectar con timeout y opciones de conexión
    ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@145.79.0.77
}
catch {
    Write-Host "`n❌ Error de conexión: $_" -ForegroundColor Red
    Write-Host "💡 Verifica que:" -ForegroundColor Yellow
    Write-Host "   - El VPS esté encendido" -ForegroundColor Gray
    Write-Host "   - La IP 145.79.0.77 sea correcta" -ForegroundColor Gray
    Write-Host "   - Tu conexión a internet funcione" -ForegroundColor Gray
}

Write-Host "`n✅ Conexión terminada." -ForegroundColor Green