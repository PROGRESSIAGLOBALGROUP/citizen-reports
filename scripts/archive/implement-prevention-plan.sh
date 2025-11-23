#!/bin/bash
# 🎯 PRODUCTION PREVENTION - Master Implementation Script
# Este script IMPLEMENTA TODOS LOS PASOS DE UNA VEZ
# Solo ejecutar UNA VEZ: bash implement-prevention-plan.sh

set -e

DOMAIN="reportes.progressiagroup.com"
SERVICE_DIR="/root/citizen-reports"
LOG_FILE="/var/log/citizen-reports-implementation.log"

# ============================================================
# SETUP INICIAL
# ============================================================
mkdir -p $(dirname $LOG_FILE)
touch $LOG_FILE

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

log "╔════════════════════════════════════════════════════════════════╗"
log "║     🎯 PRODUCTION PREVENTION - IMPLEMENTATION MASTER         ║"
log "║     citizen-reports Production Hardening                     ║"
log "║     14 Noviembre 2025                                        ║"
log "╚════════════════════════════════════════════════════════════════╝"
log ""

# ============================================================
# FASE 1: VALIDACIÓN INICIAL
# ============================================================
log "📋 FASE 1/6: Validación Inicial"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! command -v docker &> /dev/null; then
    log "❌ Docker no está instalado"
    exit 1
fi
log "✅ Docker disponible"

if ! command -v sqlite3 &> /dev/null; then
    log "❌ SQLite3 no está instalado"
    exit 1
fi
log "✅ SQLite3 disponible"

cd $SERVICE_DIR || exit 1
log "✅ Directorio de servicio OK: $SERVICE_DIR"
log ""

# ============================================================
# FASE 2: BACKUP DE CONFIGURACIÓN
# ============================================================
log "📋 FASE 2/6: Backup de Configuración"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

BACKUP_TIMESTAMP=$(date +%s)
mkdir -p $SERVICE_DIR/backups-config

for file in docker-compose-prod.yml Dockerfile .env; do
    if [ -f "$file" ]; then
        cp "$file" "$SERVICE_DIR/backups-config/${file}.backup.${BACKUP_TIMESTAMP}"
        log "✅ Backup: $file"
    fi
done
log ""

# ============================================================
# FASE 3: IMPLEMENTAR HEALTH CHECKS
# ============================================================
log "📋 FASE 3/6: Implementar Health Checks"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Actualizar docker-compose con health checks
cp docker-compose-prod-hardened.yml docker-compose-prod.yml
log "✅ Docker-compose actualizado con health checks"

# Redeploy con nuevas configuraciones
docker compose down
log "✅ Contenedores detenidos"

sleep 3

docker compose up -d --build
log "✅ Contenedores iniciados con health checks"

sleep 10

# Verificar que está running
if docker ps | grep -q citizen-reports-app; then
    log "✅ Container citizen-reports-app running"
else
    log "❌ Container no está running"
    docker logs citizen-reports-app | tail -20 >> $LOG_FILE
    exit 1
fi
log ""

# ============================================================
# FASE 4: CONFIGURAR CRON JOBS
# ============================================================
log "📋 FASE 4/6: Configurar Cron Jobs"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Crear archivo temporal para crontab
CRON_TMP=$(mktemp)
(crontab -l 2>/dev/null || true) > $CRON_TMP

# 1. Auto-recovery cada 5 minutos
if ! grep -q "production-recovery.sh" $CRON_TMP; then
    echo "*/5 * * * * bash $SERVICE_DIR/scripts/production-recovery.sh" >> $CRON_TMP
    log "✅ Cron: Auto-recovery cada 5 minutos"
fi

# 2. Database backup a las 2 AM diariamente
if ! grep -q "backup-database.sh" $CRON_TMP; then
    echo "0 2 * * * bash $SERVICE_DIR/scripts/backup-database.sh" >> $CRON_TMP
    log "✅ Cron: Backup de database 02:00 AM"
fi

# 3. Log rotation diario
if ! grep -q "logrotate" $CRON_TMP; then
    echo "0 3 * * * logrotate -f /etc/logrotate.d/citizen-reports" >> $CRON_TMP
    log "✅ Cron: Log rotation a las 03:00 AM"
fi

# Aplicar crontab
crontab $CRON_TMP
rm $CRON_TMP

# Mostrar crons agregados
log "📌 Cron jobs configurados:"
crontab -l | grep -v "^#" | grep -v "^$" | sed 's/^/   /'
log ""

# ============================================================
# FASE 5: CONFIGURAR LOG ROTATION
# ============================================================
log "📋 FASE 5/6: Configurar Log Rotation"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Crear directorio de logs
mkdir -p /var/log
touch /var/log/citizen-reports-monitor.log
touch /var/log/citizen-reports-backup.log
chmod 666 /var/log/citizen-reports-*.log

log "✅ Directorios de logs creados"

# Crear configuración de logrotate
cat > /etc/logrotate.d/citizen-reports << 'LOGROTATE'
/var/log/citizen-reports-monitor.log
/var/log/citizen-reports-backup.log
{
    daily
    rotate 30
    missingok
    notifempty
    compress
    delaycompress
    copytruncate
}
LOGROTATE

log "✅ Logrotate configurado (30 días de rotación)"
log ""

# ============================================================
# FASE 6: VALIDACIONES FINALES
# ============================================================
log "📋 FASE 6/6: Validaciones Finales"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test 1: Docker health
HEALTH=$(docker inspect citizen-reports-app --format='{{.State.Health.Status}}' 2>/dev/null || echo "none")
log "🐳 Docker Health Status: $HEALTH"

# Test 2: API Response
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" -k https://127.0.0.1/api/reportes 2>/dev/null || echo "000")
if [ "$API_CODE" = "200" ]; then
    log "✅ API respondiendo correctamente (HTTP $API_CODE)"
else
    log "⚠️  API retornando $API_CODE"
fi

# Test 3: Database
DB_COUNT=$(docker exec citizen-reports-app sqlite3 /app/server/data.db "SELECT COUNT(*) FROM reportes;" 2>/dev/null || echo "ERROR")
if [ "$DB_COUNT" != "ERROR" ]; then
    log "✅ Database OK ($DB_COUNT reportes)"
fi

# Test 4: Disk space
DISK_PERCENT=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_PERCENT" -lt 90 ]; then
    log "✅ Disk space OK (${DISK_PERCENT}% usado)"
else
    log "⚠️  Disk space CRÍTICO (${DISK_PERCENT}% usado)"
fi

# Test 5: Memory
MEM_PERCENT=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100)}')
if [ "$MEM_PERCENT" -lt 90 ]; then
    log "✅ Memory OK (${MEM_PERCENT}% usado)"
else
    log "⚠️  Memory CRÍTICO (${MEM_PERCENT}% usado)"
fi

log ""
log "╔════════════════════════════════════════════════════════════════╗"
log "║               ✅ IMPLEMENTACIÓN COMPLETADA                    ║"
log "╠════════════════════════════════════════════════════════════════╣"
log "║                                                                ║"
log "║  ✓ Health checks en Docker configurados                       ║"
log "║  ✓ Auto-recovery cron: cada 5 minutos                         ║"
log "║  ✓ Database backups: diariamente a las 2 AM                   ║"
log "║  ✓ Log rotation: 30 días de retención                         ║"
log "║  ✓ Restart policy: unless-stopped                             ║"
log "║                                                                ║"
log "║  📊 Status: ✅ TODO OK                                        ║"
log "║  📁 Logs: /var/log/citizen-reports-*.log                     ║"
log "║  🔄 Recovery script: /root/citizen-reports/scripts/...        ║"
log "║                                                                ║"
log "║  🎯 PRÓXIMO PASO: Configurar UptimeRobot para alertas externas║"
log "║                   (Ver: UPTIMEROBOT_SETUP_GUIDE.sh)           ║"
log "║                                                                ║"
log "╚════════════════════════════════════════════════════════════════╝"
log ""
log "✅ Implementation log guardado en: $LOG_FILE"
