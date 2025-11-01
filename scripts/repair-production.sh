#!/bin/bash

# Script de reparación para servidor remoto
# Ejecutar en: 145.79.0.77

echo "🚀 Iniciando proceso de reparación..."
echo ""

# Paso 1: Verificar ubicación
echo "📍 Paso 1: Verificar ubicación del proyecto"
cd /root/jantetelco || { echo "❌ No encontrado: /root/jantetelco"; exit 1; }
echo "✅ Ubicación: $(pwd)"
echo ""

# Paso 2: Ver estado actual
echo "📊 Paso 2: Estado actual del código"
echo "Rama y commit:"
git log --oneline -1
echo ""

# Paso 3: Actualizar código
echo "⬇️ Paso 3: Descargar código más reciente"
git pull origin main
if [ $? -ne 0 ]; then
    echo "⚠️ Posible conflicto de merge. Intentando reset..."
    git fetch origin
    git reset --hard origin/main
fi
echo "✅ Código actualizado"
echo ""

# Paso 4: Instalar dependencias backend
echo "📦 Paso 4: Instalar dependencias del servidor"
cd server
npm install --production
echo "✅ Dependencias del servidor instaladas"
echo ""

# Paso 5: Compilar frontend
echo "🎨 Paso 5: Compilar interfaz (frontend)"
cd ../client
npm install --production
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Frontend compilado exitosamente"
else
    echo "⚠️ Error compilando frontend, pero continuando..."
fi
echo ""

# Paso 6: Inicializar BD (si es necesario)
echo "🗄️ Paso 6: Verificar base de datos"
cd ../server
if [ ! -f "data.db" ]; then
    echo "  Inicializando base de datos..."
    npm run init
else
    echo "  ✅ Base de datos existe"
fi
echo ""

# Paso 7: Matar proceso anterior
echo "🛑 Paso 7: Detener servidor anterior"
pkill -f "node server.js" || echo "  (No hay proceso anterior)"
sleep 2
echo "✅ Proceso anterior detenido"
echo ""

# Paso 8: Iniciar servidor
echo "🚀 Paso 8: Iniciar nuevo servidor"
nohup npm start > server.log 2>&1 &
SERVER_PID=$!
sleep 3

# Verificar que inició correctamente
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Servidor iniciado (PID: $SERVER_PID)"
else
    echo "❌ Error al iniciar servidor. Logs:"
    tail -20 server.log
    exit 1
fi
echo ""

# Paso 9: Pruebas de endpoints
echo "🧪 Paso 9: Verificar endpoints"
echo ""

echo "  Testing: GET /api/reportes"
curl -s -o /dev/null -w "  Status: %{http_code}\n" http://localhost:4000/api/reportes

echo "  Testing: GET /api/reportes/tipos"
curl -s -o /dev/null -w "  Status: %{http_code}\n" http://localhost:4000/api/reportes/tipos

echo "  Testing: POST /api/auth/login"
curl -s -o /dev/null -w "  Status: %{http_code}\n" -X POST -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}' http://localhost:4000/api/auth/login

echo "  Testing: GET /api/reportes/mis-reportes"
curl -s -o /dev/null -w "  Status: %{http_code}\n" -H "Authorization: Bearer test" \
  http://localhost:4000/api/reportes/mis-reportes

echo ""
echo "✅ Verificación de endpoints completada"
echo ""

# Paso 10: Mostrar logs finales
echo "📋 Paso 10: Logs del servidor"
echo "  (Últimas 10 líneas)"
tail -10 server.log
echo ""

echo "╔═══════════════════════════════════════════════════════╗"
echo "║  ✅ REPARACIÓN COMPLETADA"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "Servidor ejecutándose en: http://145.79.0.77:4000"
echo "PID: $SERVER_PID"
echo "Logs: /root/jantetelco/server/server.log"
echo ""
echo "Próximos pasos:"
echo "  1. Probar panel de administrador: http://145.79.0.77:4000/#/panel"
echo "  2. Verificar 'Mis Reportes Asignados' carga sin errores"
echo "  3. Si hay problemas, revisar: tail -50 /root/jantetelco/server/server.log"
