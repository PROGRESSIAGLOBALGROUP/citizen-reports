# Diagnóstico de Conexión SSH - citizen-reports VPS
# Verificar conectividad y configuración

Write-Host "🔍 Diagnóstico de conexión SSH" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Gray

$vpsIP = "145.79.0.77"
$vpsUser = "root"

# Test 1: Ping basic
Write-Host "`n1️⃣ Test de conectividad básica..." -ForegroundColor Yellow
try {
    $ping = Test-NetConnection -ComputerName $vpsIP -Port 22 -InformationLevel Quiet
    if ($ping) {
        Write-Host "✅ Puerto 22 (SSH) está abierto" -ForegroundColor Green
    } else {
        Write-Host "❌ Puerto 22 (SSH) está cerrado o bloqueado" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ No se puede hacer ping al servidor" -ForegroundColor Red
}

# Test 2: SSH version check
Write-Host "`n2️⃣ Verificando versión SSH del servidor..." -ForegroundColor Yellow
try {
    $sshVersion = ssh -o ConnectTimeout=5 -o BatchMode=yes $vpsUser@$vpsIP exit 2>&1
    Write-Host "SSH respuesta: $sshVersion" -ForegroundColor Gray
}
catch {
    Write-Host "❌ Error obteniendo versión SSH" -ForegroundColor Red
}

# Test 3: Conectividad completa
Write-Host "`n3️⃣ Test de conectividad completa..." -ForegroundColor Yellow
$connectionTest = Test-NetConnection -ComputerName $vpsIP -Port 22

Write-Host "🌐 Dirección IP: $($connectionTest.RemoteAddress)" -ForegroundColor White
Write-Host "🔌 Puerto SSH: $($connectionTest.RemotePort)" -ForegroundColor White
Write-Host "📡 Ping exitoso: $($connectionTest.PingSucceeded)" -ForegroundColor White
Write-Host "🔗 TCP exitoso: $($connectionTest.TcpTestSucceeded)" -ForegroundColor White

# Test 4: Información del cliente SSH
Write-Host "`n4️⃣ Información del cliente SSH local..." -ForegroundColor Yellow
$sshCommand = Get-Command ssh -ErrorAction SilentlyContinue
if ($sshCommand) {
    Write-Host "✅ SSH Client encontrado: $($sshCommand.Source)" -ForegroundColor Green
    try {
        $sshVersion = ssh -V 2>&1
        Write-Host "📝 Versión: $sshVersion" -ForegroundColor Gray
    }
    catch {
        Write-Host "⚠️ No se pudo obtener versión SSH" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ SSH Client no encontrado" -ForegroundColor Red
}

Write-Host "`n===============================================" -ForegroundColor Gray
Write-Host "💡 Diagnóstico completo." -ForegroundColor Cyan

# Recomendaciones basadas en resultados
Write-Host "`n🎯 SIGUIENTES PASOS:" -ForegroundColor Green
Write-Host "1. Verifica en Hostinger panel que el VPS esté encendido" -ForegroundColor White
Write-Host "2. Confirma que SSH está habilitado en el VPS" -ForegroundColor White
Write-Host "3. Prueba la password en el panel web de Hostinger" -ForegroundColor White
Write-Host "4. Si todo lo anterior está OK, intenta conexión manual:" -ForegroundColor White
Write-Host "   ssh -v root@$vpsIP" -ForegroundColor Gray