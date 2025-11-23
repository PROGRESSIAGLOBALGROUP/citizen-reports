#!/bin/bash
# Script bash para reparar servidor remoto
# Ejecutar en: bash repair_production.sh

HOST="145.79.0.77"
USER="root"
PASS="#M3YBmUDK+C,iQM3tn4t"
PROJECT="/root/Citizen-reports"

echo "🚀 REPARACIÓN DE SERVIDOR REMOTO"
echo "================================"
echo ""

# Usar sshpass si está disponible
if command -v sshpass &> /dev/null; then
    echo "✅ sshpass encontrado"
    SSH_CMD="sshpass -p '$PASS' ssh -o StrictHostKeyChecking=no"
else
    echo "⚠️  sshpass no encontrado. Instala: apt-get install sshpass"
    echo "   Usando SSH normal (puede pedir contraseña)..."
    SSH_CMD="ssh -o StrictHostKeyChecking=no"
fi

echo ""
echo "📍 Conectando a: $USER@$HOST"
echo ""

# Test conexión
echo "🔐 Probando conexión..."
$SSH_CMD "$USER@$HOST" "whoami" 2>&1

if [ $? -ne 0 ]; then
    echo "❌ No se puede conectar"
    exit 1
fi

echo "✅ Conexión exitosa"
echo ""

# Ejecutar comandos
execute_cmd() {
    local cmd="$1"
    local desc="$2"
    
    echo "📌 $desc"
    echo "   $ $cmd"
    
    $SSH_CMD "$USER@$HOST" "cd $PROJECT && $cmd" 2>&1 | sed 's/^/   /'
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Completado"
    else
        echo "   ⚠️  Posible error"
    fi
    echo ""
}

# Pasos de reparación
execute_cmd "pwd" "Verificar directorio"
execute_cmd "git log --oneline -1" "Ver versión actual"
execute_cmd "git pull origin main" "Actualizar código"
execute_cmd "cd server && npm install --production" "Instalar dependencias servidor"
execute_cmd "cd ../client && npm install --production" "Instalar dependencias cliente"
execute_cmd "npm run build" "Compilar frontend"
execute_cmd "cd ../server && pkill -f 'node server.js' || true" "Detener servidor anterior"
execute_cmd "sleep 2 && nohup npm start > server.log 2>&1 &" "Iniciar servidor"
execute_cmd "sleep 3 && curl -s http://localhost:4000/api/reportes | head -c 100" "Test: /api/reportes"
execute_cmd "curl -s -w 'Status: %{http_code}' http://localhost:4000/api/reportes/tipos" "Test: /api/reportes/tipos"
execute_cmd "tail -10 server.log" "Logs finales"

echo ""
echo "================================"
echo "✅ REPARACIÓN COMPLETADA"
echo "================================"
echo ""
echo "🌐 Panel: http://145.79.0.77:4000/#/panel"
echo ""
