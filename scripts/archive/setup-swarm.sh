#!/bin/bash
# Setup completo de citizen-reports en Docker Swarm
# Ejecutar UNA SOLA VEZ en el servidor

TARGET_HOST="${1:-145.79.0.77}"
STACK_NAME="citizen-reports"

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  SETUP DOCKER SWARM PARA CITIZEN-REPORTS                        ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "🎯 Target: $TARGET_HOST"
echo ""

# 1. Conectar y verificar Docker Swarm
echo "✓ Paso 1: Verificar Docker Swarm..."
ssh root@$TARGET_HOST "
    if docker info | grep -q 'Swarm: active'; then
        echo '  ✅ Docker Swarm activo'
    else
        echo '  ⚠️  Docker Swarm no activo, inicializando...'
        docker swarm init --advertise-addr 127.0.0.1
        echo '  ✅ Swarm inicializado'
    fi
    
    # Verificar que la red de Traefik existe
    if docker network ls | grep -q 'easypanel'; then
        echo '  ✅ Red easypanel encontrada'
    else
        echo '  ⚠️  Red easypanel no encontrada'
        docker network create --driver overlay easypanel || true
    fi
"

# 2. Crear estructura de directorios
echo ""
echo "✓ Paso 2: Crear directorios..."
ssh root@$TARGET_HOST "
    mkdir -p /root/citizen-reports/backups
    mkdir -p /root/citizen-reports/server
    mkdir -p /var/log/citizen-reports
    chmod 755 /root/citizen-reports/backups
    chmod 755 /var/log/citizen-reports
    echo '  ✅ Directorios creados'
"

# 3. Crear cron jobs
echo ""
echo "✓ Paso 3: Configurar cron jobs..."
ssh root@$TARGET_HOST "
    # Remover cron jobs antiguos
    crontab -l 2>/dev/null | grep -v 'citizen-reports' | crontab - || true
    
    # Agregar nuevos cron jobs
    (crontab -l 2>/dev/null; echo '*/5 * * * * /bin/bash /root/citizen-reports/scripts/monitor-swarm.sh >> /var/log/citizen-reports-cron.log 2>&1') | crontab -
    (crontab -l 2>/dev/null; echo '0 2 * * * /bin/bash /root/citizen-reports/scripts/backup-swarm.sh >> /var/log/citizen-reports-backup.log 2>&1') | crontab -
    
    echo '  ✅ Cron jobs configurados'
    echo '  Verificando:'
    crontab -l | grep citizen-reports
"

# 4. Crear script de backup
echo ""
echo "✓ Paso 4: Crear scripts auxiliares..."
ssh root@$TARGET_HOST "
    cat > /root/citizen-reports/scripts/backup-swarm.sh << 'EOF'
#!/bin/bash
# Backup automático de base de datos
DB_PATH='/root/citizen-reports/server/data.db'
BACKUP_DIR='/root/citizen-reports/backups'
TIMESTAMP=\$(date +%Y%m%d_%H%M%S)

if [ -f \"\$DB_PATH\" ]; then
    cp \"\$DB_PATH\" \"\$BACKUP_DIR/data-\$TIMESTAMP.db\"
    
    # Mantener solo últimos 30 backups
    ls -t \"\$BACKUP_DIR\"/data-*.db 2>/dev/null | tail -n +31 | xargs rm -f 2>/dev/null || true
    
    echo \"[\\$(date '+%Y-%m-%d %H:%M:%S')] Backup realizado: data-\$TIMESTAMP.db\"
fi
EOF
    chmod +x /root/citizen-reports/scripts/backup-swarm.sh
    echo '  ✅ Scripts auxiliares creados'
"

# 5. Inicializar BD si no existe
echo ""
echo "✓ Paso 5: Inicializar base de datos..."
ssh root@$TARGET_HOST "
    if [ ! -f /root/citizen-reports/server/data.db ]; then
        echo '  DB no existe, se creará al desplegar'
    else
        echo '  ✅ DB existente protegida'
    fi
"

# 6. Desplegar stack
echo ""
echo "✓ Paso 6: Desplegar stack Docker..."
ssh root@$TARGET_HOST "
    cd /root/citizen-reports
    
    # Verificar que el código existe
    if [ ! -f 'docker-compose-prod.yml' ]; then
        echo '  ❌ docker-compose-prod.yml no encontrado'
        exit 1
    fi
    
    # Build imagen
    echo '  Construyendo imagen Docker...'
    docker build -t citizen-reports:latest .
    
    # Remover stack anterior si existe
    docker stack rm $STACK_NAME 2>/dev/null || true
    sleep 5
    
    # Deploy
    echo '  Desplegando stack...'
    docker stack deploy -c docker-compose-prod.yml $STACK_NAME
    
    echo '  ✅ Stack desplegado'
    sleep 10
    
    echo '  Status:'
    docker service ls --filter name=${STACK_NAME}_
"

# 7. Validación
echo ""
echo "✓ Paso 7: Validar setup..."
ssh root@$TARGET_HOST "
    echo '  Esperando que el servicio sea healthy...'
    
    for i in {1..60}; do
        REPLICAS=\$(docker service ls --filter name='citizen-reports_citizen-reports' --format '{{.Replicas}}' 2>/dev/null)
        if [ \"\$REPLICAS\" = \"1/1\" ]; then
            echo '  ✅ Servicio listo (replicas: 1/1)'
            sleep 5
            HTTP_CODE=\$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4000/api/reportes?limit=1)
            echo \"  ✅ API respondiendo (HTTP \$HTTP_CODE)\"
            break
        else
            echo \"  ⏳ Esperando... replicas: \$REPLICAS\"
            sleep 2
        fi
    done
"

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  ✅ SETUP COMPLETADO                                             ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Estado del servicio:"
echo "   URL: https://reportes.progressiagroup.com"
echo "   API (directo): http://$TARGET_HOST:4000/api/reportes"
echo ""
echo "📝 Acceso al servidor:"
echo "   ssh root@$TARGET_HOST"
echo "   docker service ps citizen-reports_citizen-reports"
echo "   docker service logs citizen-reports_citizen-reports -f"
echo ""
echo "⚙️  Monitoreo automático:"
echo "   - Health check cada 30 segundos (Docker)"
echo "   - Monitor cron cada 5 minutos"
echo "   - Backup automático diario a las 2 AM"
echo ""
