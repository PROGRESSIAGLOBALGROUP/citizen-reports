#!/bin/bash
set -e
cd /root/citizen-reports

echo "=================================================="
echo "🚀 DEPLOYMENT DOCKER - INICIO"
echo "=================================================="
echo ""

echo "📋 STEP 1: Compilando frontend..."
cd client
npm run build
echo "✅ Frontend compilado"
ls -lh dist/ | head -5
cd ..
echo ""

echo "📋 STEP 2: Construyendo imagen Docker..."
docker build --target production -t citizen-reports:latest -f Dockerfile .
echo "✅ Imagen construida"
echo ""

echo "📋 STEP 3: Desplegando stack..."
docker stack deploy -c docker-compose.prod.yml citizen-reports
echo "✅ Stack desplegado"
echo ""

echo "📋 STEP 4: Esperando servicio (30s)..."
sleep 30
docker stack ps citizen-reports --no-trunc | head -5
echo ""

echo "📋 STEP 5: Health check..."
sleep 5
curl -f http://localhost:4000/api/reportes?limit=1
echo ""
echo "✅ Health check OK"
echo ""

echo "=================================================="
echo "✅✅✅ DEPLOYMENT COMPLETADO ✅✅✅"
echo "=================================================="
echo ""
echo "Verificación:"
echo "  curl http://145.79.0.77:4000/api/reportes?limit=1"
echo ""
