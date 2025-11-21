#!/bin/bash
set -e

cd /root/citizen-reports

echo "=== INICIO BUILD DOCKER ==="
echo "Timestamp: $(date)"
echo ""

echo "Compilando frontend..."
cd client
npm run build > /tmp/frontend-build.log 2>&1
echo "✅ Frontend compilado"
cd ..

echo ""
echo "Building Docker image..."
docker build --no-cache --target production -t citizen-reports:latest . > /tmp/docker-build.log 2>&1
echo "✅ Imagen construida"

echo ""
echo "Verificando imagen..."
docker run --rm citizen-reports:latest sh -c "ls server/*.js | wc -l"

echo ""
echo "=== BUILD COMPLETADO ==="
echo "Timestamp: $(date)"
