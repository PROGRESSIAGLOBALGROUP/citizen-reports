#!/bin/bash
# Deploy citizen-reports a Docker Swarm en producción
# Uso: bash deploy-swarm.sh [target-host] [stack-name]

TARGET_HOST="${1:-145.79.0.77}"
STACK_NAME="${2:-citizen-reports}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   DEPLOYING CITIZEN-REPORTS TO DOCKER SWARM                  ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "🎯 Target: $TARGET_HOST"
echo "📦 Stack: $STACK_NAME"
echo "⏰ Timestamp: $TIMESTAMP"
echo ""

# Step 1: Verificar conectividad SSH
echo "✓ Paso 1: Verificar conectividad SSH..."
if ! ssh -q root@$TARGET_HOST "echo 'SSH OK'" > /dev/null 2>&1; then
    echo "❌ ERROR: No se puede conectar SSH a $TARGET_HOST"
    exit 1
fi
echo "  ✅ SSH conectado"

# Step 2: Backup de BD antes de desplegar
echo ""
echo "✓ Paso 2: Backup de base de datos..."
ssh root@$TARGET_HOST "
    cd /root/citizen-reports
    BACKUP_FILE='backups/data-BEFORE-SWARM-'$TIMESTAMP'.db'
    if [ -f 'server/data.db' ]; then
        cp server/data.db \$BACKUP_FILE
        echo '  ✅ Backup guardado: '\$BACKUP_FILE
    else
        echo '  ℹ️  Sin data.db actual (primera vez?)'
    fi
" || echo "  ⚠️  Backup fallido pero continuando..."

# Step 3: Kill procesos Node huérfanos
echo ""
echo "✓ Paso 3: Limpiar procesos Node huérfanos..."
ssh root@$TARGET_HOST "
    echo '  Buscando procesos...'
    pkill -f 'node dist/main' || true
    pkill -f 'node backend.js' || true
    sleep 2
    REMAINING=\$(ps aux | grep -E 'node dist/main|node backend.js' | grep -v grep | wc -l)
    if [ \$REMAINING -eq 0 ]; then
        echo '  ✅ Todos los procesos huérfanos eliminados'
    else
        echo '  ⚠️  Quedan $REMAINING procesos (reintentando con kill -9)'
        pkill -9 -f 'node dist/main' || true
        pkill -9 -f 'node backend.js' || true
        sleep 1
    fi
" || true

# Step 4: Preparar código localmente
echo ""
echo "✓ Paso 4: Preparar build localmente..."
cd "$SCRIPT_DIR"
if [ ! -f "client/dist/index.html" ]; then
    echo "  ⚠️  client/dist no existe, construyendo..."
    cd client && npm run build && cd ..
fi
echo "  ✅ Client build listo"

# Step 5: Copiar archivos al servidor
echo ""
echo "✓ Paso 5: Copiar código al servidor (rsync)..."
rsync -avz --delete \
    --exclude=.git \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=.env \
    --exclude=data.db \
    --exclude=backups \
    ./ root@$TARGET_HOST:/root/citizen-reports/ > /dev/null

# Copiar client/dist específicamente
rsync -avz client/dist/ root@$TARGET_HOST:/root/citizen-reports/client/dist/ > /dev/null
echo "  ✅ Código sincronizado"

# Step 6: Desplegar stack Docker Swarm
echo ""
echo "✓ Paso 6: Desplegar Docker Swarm stack..."
ssh root@$TARGET_HOST "
    cd /root/citizen-reports
    
    # Build nueva imagen
    echo '  Construyendo imagen Docker...'
    docker build -t citizen-reports:latest .
    
    # Remover stack anterior si existe
    echo '  Removiendo stack anterior...'
    docker stack rm $STACK_NAME 2>/dev/null || true
    sleep 5
    
    # Deploy nuevo stack
    echo '  Desplegando stack...'
    docker stack deploy -c docker-compose-prod.yml $STACK_NAME
    
    echo '  ✅ Stack desplegado'
"

# Step 7: Esperar a que el servicio sea healthy
echo ""
echo "✓ Paso 7: Esperar a que el servicio sea healthy..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    attempt=$((attempt + 1))
    
    # Verificar si el servicio tiene replicas ready
    READY=$(ssh root@$TARGET_HOST "docker service ls --filter name=${STACK_NAME}_citizen-reports --format '{{.Replicas}}' 2>/dev/null" | grep -o '[0-9]*\/[0-9]*')
    
    if [ -z "$READY" ]; then
        echo "  ⏳ Intento $attempt/$max_attempts: Stack en inicialización..."
        sleep 2
        continue
    fi
    
    if [ "$READY" = "1/1" ]; then
        echo "  ✅ Servicio listo (replicas: $READY)"
        break
    else
        echo "  ⏳ Intento $attempt/$max_attempts: Replicas: $READY"
        sleep 2
    fi
done

# Step 8: Test de healthcheck
echo ""
echo "✓ Paso 8: Test de API..."
sleep 5
curl -s -I http://$TARGET_HOST:4000/api/reportes?limit=1 | head -1
if [ $? -eq 0 ]; then
    echo "  ✅ API respondiendo"
else
    echo "  ⚠️  API no respondió en puerto directo, probando via proxy..."
fi

# Step 9: Mostrar estado final
echo ""
echo "✓ Paso 9: Estado final del stack..."
ssh root@$TARGET_HOST "
    echo '=== SERVICIOS ==='
    docker service ls --filter name=${STACK_NAME}_
    echo ''
    echo '=== TASKS ==='
    docker service ps ${STACK_NAME}_citizen-reports 2>/dev/null | head -5
    echo ''
    echo '=== LOGS RECIENTES ==='
    docker service logs ${STACK_NAME}_citizen-reports 2>/dev/null | tail -5
"

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   ✅ DEPLOYMENT COMPLETADO                                    ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Aplicación disponible en:"
echo "   HTTPS: https://reportes.progressiagroup.com"
echo "   HTTP (directo): http://$TARGET_HOST:4000"
echo ""
echo "📝 Para monitorear:"
echo "   ssh root@$TARGET_HOST"
echo "   docker service logs ${STACK_NAME}_citizen-reports -f"
echo ""
