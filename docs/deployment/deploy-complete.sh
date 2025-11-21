cd /root/citizen-reports
echo "=== INICIANDO DEPLOYMENT ==="
echo ""
echo "Paso 1/3: Building Docker image..."
docker build --target production -t citizen-reports:latest -f Dockerfile . 2>&1 | tee /tmp/docker-build.log
echo ""
echo "✅ Build completado"
echo ""
echo "Paso 2/3: Deploying stack..."
docker stack deploy -c docker-compose.prod.yml citizen-reports
echo ""
echo "✅ Deploy iniciado"
echo ""
echo "Paso 3/3: Esperando servicio (30s)..."
sleep 30
echo ""
docker stack ps citizen-reports --no-trunc | head -5
echo ""
echo "=== VERIFICACIÓN ==="
curl -s http://localhost:4000/api/reportes?limit=1 | head -5
echo ""
echo "=== DEPLOYMENT COMPLETADO ==="
