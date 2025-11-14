#!/bin/bash
# Monitor y auto-recovery para citizen-reports en Docker Swarm
# Cron: */5 * * * * /root/citizen-reports/scripts/monitor-swarm.sh

STACK_NAME="citizen-reports"
SERVICE_NAME="${STACK_NAME}_citizen-reports"
LOG_FILE="/var/log/citizen-reports-monitor.log"
CHECK_INTERVAL=5  # segundos entre checks
HEALTH_THRESHOLD=3  # fallos antes de recovery

# Función de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Rotar logs si crecen mucho
if [ -f "$LOG_FILE" ] && [ $(stat -c%s "$LOG_FILE") -gt 10485760 ]; then
    mv "$LOG_FILE" "$LOG_FILE.$(date +%s)"
    gzip "$LOG_FILE.$(date +%s)" &
fi

log "=== CITIZEN-REPORTS MONITOR CHECK ==="

# 1. Verificar si el stack existe
if ! docker stack ls | grep -q "^$STACK_NAME"; then
    log "⚠️  Stack no encontrado: $STACK_NAME - RE-DESPLEGANDO"
    cd /root/citizen-reports || exit 1
    docker stack deploy -c docker-compose-prod.yml "$STACK_NAME"
    log "✅ Stack re-desplegado"
    exit 0
fi

# 2. Verificar replicas ready
REPLICAS=$(docker service ls --filter name="$SERVICE_NAME" --format '{{.Replicas}}' 2>/dev/null)
log "Replicas status: $REPLICAS"

if [ "$REPLICAS" != "1/1" ]; then
    log "⚠️  Servicio no tiene todas las replicas - esperando recuperación..."
    # Docker Swarm debería auto-recuperar, dar 30 segundos
    sleep 30
    REPLICAS=$(docker service ls --filter name="$SERVICE_NAME" --format '{{.Replicas}}' 2>/dev/null)
    
    if [ "$REPLICAS" != "1/1" ]; then
        log "❌ Servicio sigue degradado: $REPLICAS - REINICIANDO STACK"
        docker stack rm "$STACK_NAME"
        sleep 5
        cd /root/citizen-reports || exit 1
        docker stack deploy -c docker-compose-prod.yml "$STACK_NAME"
        log "✅ Stack reiniciado después de fallo de replicas"
        exit 0
    fi
fi

# 3. Health check de la API
API_URL="http://127.0.0.1:4000/api/reportes?limit=1"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$API_URL" 2>/dev/null)

if [ "$HTTP_CODE" = "200" ]; then
    log "✅ API healthy (HTTP $HTTP_CODE)"
else
    log "⚠️  API unhealthy (HTTP $HTTP_CODE) - revisando logs"
    
    # Mostrar últimos errores
    docker service logs "$SERVICE_NAME" 2>/dev/null | tail -10 | while read -r line; do
        log "  LOG: $line"
    done
    
    # Si es error crítico, recuperar
    if [ "$HTTP_CODE" = "000" ] || [ "$HTTP_CODE" = "502" ] || [ "$HTTP_CODE" = "503" ]; then
        log "❌ API no responde - FORZANDO RECOVERY"
        docker service update --force "$SERVICE_NAME" 2>/dev/null
        log "✅ Fuerzo update ejecutado"
    fi
fi

# 4. Verificar consumo de memoria (memory leak detection)
MEMORY=$(docker service ls --filter name="$SERVICE_NAME" --format '{{.Replicas}}' 2>/dev/null)
INSPECT=$(docker service inspect "$SERVICE_NAME" 2>/dev/null | grep -A 5 "MemoryLimit" | head -1)
log "Memory config: $INSPECT"

# 5. Estadísticas finales
TASKS=$(docker service ps "$SERVICE_NAME" --no-trunc 2>/dev/null | grep Running | wc -l)
log "Tasks running: $TASKS"

log "✅ Check completo"
log ""
