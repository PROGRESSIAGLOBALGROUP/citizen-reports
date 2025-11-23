#!/bin/bash
# Kill-switch para procesos Node fugados
# Monitorea memoria de procesos Node y mata cualquiera que exceda 300MB
# Este script corre cada 2 minutos vía cron

set -e

LOG_FILE="/var/log/citizen-reports-killswitch.log"
MAX_MEMORY_MB=300
MAX_AGE_SECONDS=600

log_action() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Rotar logs si exceden 10MB
if [ -f "$LOG_FILE" ] && [ $(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE") -gt 10485760 ]; then
    mv "$LOG_FILE" "$LOG_FILE.$(date +%s)"
    gzip -9 "$LOG_FILE".* 2>/dev/null &
fi

log_action "=== Kill-switch check started ==="

# Obtener PIDs de procesos Node no containerizados
for pid in $(pgrep -f "node" 2>/dev/null || true); do
    # Omitir si es parte de Docker
    if grep -q "docker" "/proc/$pid/cgroup" 2>/dev/null; then
        continue
    fi
    
    # Obtener memoria en MB
    rss_kb=$(awk '/VmRSS/ {print $2}' "/proc/$pid/status" 2>/dev/null || echo 0)
    rss_mb=$((rss_kb / 1024))
    
    # Obtener edad del proceso en segundos
    cmdline=$(cat "/proc/$pid/cmdline" 2>/dev/null | tr '\0' ' ')
    start_time=$(stat -c %Y "/proc/$pid" 2>/dev/null || echo 0)
    current_time=$(date +%s)
    age=$((current_time - start_time))
    
    # Kill si cumple criterios sospechosos
    if [ "$rss_mb" -gt "$MAX_MEMORY_MB" ]; then
        log_action "⚠️  KILLED: PID=$pid, Memory=${rss_mb}MB (threshold=${MAX_MEMORY_MB}MB), Cmd=$cmdline"
        kill -9 "$pid" 2>/dev/null || true
    fi
    
    # Kill si es proceso huérfano antiguo
    if [ "$age" -gt "$MAX_AGE_SECONDS" ] && ! docker ps --no-trunc | grep -q "$pid" 2>/dev/null; then
        case "$cmdline" in
            *"dist/main"*|*"backend.js"*|*"npm run start"*)
                log_action "🗑️  CLEANED: PID=$pid (orphaned, age=${age}s), Cmd=$cmdline"
                kill -9 "$pid" 2>/dev/null || true
                ;;
        esac
    fi
done

# Verificar que Docker Swarm está activo
if ! docker service ls --filter name=citizen-reports --format "{{.Replicas}}" 2>/dev/null | grep -q "1/1"; then
    log_action "❌ ALERT: Docker Swarm replica issue detected"
    exit 1
fi

log_action "✅ Check complete - no issues"
exit 0
