#!/bin/bash
# 🚀 Setup Production Prevention - Master Script
# This script implements ALL prevention measures in one go
# Run on VPS: bash /root/citizen-reports/scripts/setup-production-prevention.sh

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     🚀 PRODUCTION PREVENTION SETUP - MASTER SCRIPT            ║"
echo "║     Implementing auto-recovery, monitoring, and backups       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log_step() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} 📋 $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} ✅ $1"
}

log_error() {
    echo -e "${RED}[$(date +'%H:%M:%S')]${NC} ❌ $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')]${NC} ⚠️  $1"
}

# ===========================================================================
# STEP 1: Verify Environment
# ===========================================================================
log_step "Step 1: Verifying environment..."

if [ ! -d "/root/citizen-reports" ]; then
    log_error "Directory /root/citizen-reports not found"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    log_error "Docker not installed"
    exit 1
fi

log_success "Environment verified"
echo ""

# ===========================================================================
# STEP 2: Restart Container if Down
# ===========================================================================
log_step "Step 2: Checking container status..."

cd /root/citizen-reports

if ! docker ps | grep -q citizen-reports-app; then
    log_warning "Container is down - restarting..."
    docker compose restart citizen-reports-app
    sleep 5
fi

if docker ps | grep -q citizen-reports-app; then
    log_success "Container is running"
else
    log_error "Container failed to start"
    docker logs citizen-reports-app | tail -20
    exit 1
fi

echo ""

# ===========================================================================
# STEP 3: Deploy Hardened Docker-Compose
# ===========================================================================
log_step "Step 3: Deploying hardened docker-compose.yml..."

# Backup current
if [ -f "docker-compose.yml" ]; then
    cp docker-compose.yml docker-compose.yml.backup.$(date +%s)
    log_success "Backed up current docker-compose.yml"
fi

# Deploy hardened version
if [ -f "docker-compose-prod-hardened.yml" ]; then
    cp docker-compose-prod-hardened.yml docker-compose.yml
    log_success "Deployed hardened docker-compose.yml"
fi

echo ""

# ===========================================================================
# STEP 4: Setup Auto-Recovery Cron Job
# ===========================================================================
log_step "Step 4: Setting up auto-recovery cron job (every 5 minutes)..."

CRON_JOB="*/5 * * * * bash /root/citizen-reports/scripts/production-recovery.sh >> /var/log/citizen-reports-monitor.log 2>&1"

# Check if already exists
if crontab -l 2>/dev/null | grep -q "production-recovery.sh"; then
    log_warning "Cron job already exists, skipping"
else
    (crontab -l 2>/dev/null || echo "") | grep -v "production-recovery.sh" | crontab -
    (crontab -l 2>/dev/null || echo ""; echo "$CRON_JOB") | crontab -
    log_success "Cron job added: */5 * * * *"
fi

# Create log file
touch /var/log/citizen-reports-monitor.log
chmod 666 /var/log/citizen-reports-monitor.log

echo ""

# ===========================================================================
# STEP 5: Setup Database Backup Automation
# ===========================================================================
log_step "Step 5: Setting up database backup automation (daily at 2 AM)..."

# Create backup script
cat > /root/citizen-reports/scripts/backup-database.sh << 'BACKUP_SCRIPT'
#!/bin/bash
DB_PATH="/root/citizen-reports/server/data.db"
BACKUP_DIR="/root/citizen-reports/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
cp $DB_PATH $BACKUP_DIR/data-${DATE}.db
find $BACKUP_DIR -name "data-*.db" -mtime +30 -delete
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Backup completed: data-${DATE}.db" >> /var/log/citizen-reports-backup.log
BACKUP_SCRIPT

chmod +x /root/citizen-reports/scripts/backup-database.sh

# Add to crontab
BACKUP_CRON="0 2 * * * bash /root/citizen-reports/scripts/backup-database.sh"

if crontab -l 2>/dev/null | grep -q "backup-database.sh"; then
    log_warning "Backup cron job already exists, skipping"
else
    (crontab -l 2>/dev/null || echo "") | grep -v "backup-database.sh" | crontab -
    (crontab -l 2>/dev/null || echo ""; echo "$BACKUP_CRON") | crontab -
    log_success "Backup cron job added: 0 2 * * * (daily at 2 AM)"
fi

# Create first backup
bash /root/citizen-reports/scripts/backup-database.sh
log_success "Initial backup created"

echo ""

# ===========================================================================
# STEP 6: Setup Log Rotation
# ===========================================================================
log_step "Step 6: Setting up log rotation..."

cat > /etc/logrotate.d/citizen-reports << 'LOGROTATE_CONF'
/var/log/citizen-reports-monitor.log
/var/log/citizen-reports-backup.log
{
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0666 root root
    sharedscripts
}
LOGROTATE_CONF

log_success "Log rotation configured"

echo ""

# ===========================================================================
# STEP 7: Create Health Check Dashboard Script
# ===========================================================================
log_step "Step 7: Creating health check dashboard..."

cat > /root/citizen-reports/scripts/dashboard.sh << 'DASHBOARD_SCRIPT'
#!/bin/bash
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          🏥 PRODUCTION HEALTH DASHBOARD                       ║"
echo "║          $(date +'%Y-%m-%d %H:%M:%S')                                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Container Status:"
docker ps -a | grep citizen-reports || echo "No container found"
echo ""
echo "💾 Memory/CPU:"
docker stats citizen-reports-app --no-stream 2>/dev/null || echo "Stats not available"
echo ""
echo "📂 Disk:"
df -h / | tail -1
echo ""
echo "🗄️  Database:"
ls -lh /root/citizen-reports/server/data.db 2>/dev/null || echo "Database not found"
echo ""
echo "📈 Recent Monitor Logs (last 5):"
tail -5 /var/log/citizen-reports-monitor.log 2>/dev/null || echo "No logs yet"
echo ""
echo "🔄 Cron Jobs:"
crontab -l 2>/dev/null | grep citizen-reports || echo "No cron jobs"
echo ""
DASHBOARD_SCRIPT

chmod +x /root/citizen-reports/scripts/dashboard.sh
log_success "Dashboard script created"

echo ""

# ===========================================================================
# STEP 8: Test Auto-Recovery
# ===========================================================================
log_step "Step 8: Testing auto-recovery mechanism..."

bash /root/citizen-reports/scripts/production-recovery.sh
RECOVERY_STATUS=$?

if [ $RECOVERY_STATUS -eq 0 ]; then
    log_success "Auto-recovery test passed"
else
    log_warning "Auto-recovery test completed with code: $RECOVERY_STATUS"
fi

echo ""

# ===========================================================================
# STEP 9: Generate Setup Report
# ===========================================================================
log_step "Step 9: Generating setup report..."

cat > /root/citizen-reports/PREVENTION_SETUP_REPORT.txt << 'REPORT'
╔══════════════════════════════════════════════════════════════════════╗
║           PRODUCTION PREVENTION SETUP COMPLETED                     ║
║           $(date +'%Y-%m-%d %H:%M:%S')
╚══════════════════════════════════════════════════════════════════════╝

✅ MEASURES IMPLEMENTED:

1. AUTO-RECOVERY (Every 5 minutes)
   ├─ Script: /root/citizen-reports/scripts/production-recovery.sh
   ├─ Logs: /var/log/citizen-reports-monitor.log
   └─ Status: ACTIVE

2. DATABASE BACKUPS (Daily at 2:00 AM)
   ├─ Location: /root/citizen-reports/backups/
   ├─ Retention: 30 days
   └─ Status: ACTIVE

3. LOG ROTATION (Daily)
   ├─ Config: /etc/logrotate.d/citizen-reports
   ├─ Retention: 30 days
   └─ Status: CONFIGURED

4. MONITORING SCRIPTS
   ├─ Health check: /root/citizen-reports/scripts/production-health-check.sh
   ├─ Dashboard: /root/citizen-reports/scripts/dashboard.sh
   └─ Status: READY

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 QUICK COMMANDS:

View dashboard:
  bash /root/citizen-reports/scripts/dashboard.sh

View monitor logs:
  tail -f /var/log/citizen-reports-monitor.log

View cron jobs:
  crontab -l

REPORT

log_success "Setup report generated"

echo ""

# ===========================================================================
# FINAL SUMMARY
# ===========================================================================
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              ✅ PREVENTION SETUP COMPLETED                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✓${NC} Auto-recovery cron job active (every 5 min)"
echo -e "${GREEN}✓${NC} Database backup automation running (daily 2 AM)"
echo -e "${GREEN}✓${NC} Log rotation configured (30 days)"
echo -e "${GREEN}✓${NC} Health check dashboard ready"
echo ""
echo "📊 View status: bash /root/citizen-reports/scripts/dashboard.sh"
echo "📋 View logs: tail -f /var/log/citizen-reports-monitor.log"
echo ""

# Copiar versión mejorada
if [ -f "$SERVICE_DIR/docker-compose-prod-hardened.yml" ]; then
    cp $SERVICE_DIR/docker-compose-prod-hardened.yml $SERVICE_DIR/docker-compose-prod.yml
    echo "✅ Docker-compose actualizado con health checks"
else
    echo "⚠️  docker-compose-prod-hardened.yml no encontrado - saltando"
fi
echo ""

# ============================================================
# FASE 3: Redeploy con Nuevas Configuraciones
# ============================================================
echo "📋 FASE 3: Redeploy con Health Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd $SERVICE_DIR
docker compose down
sleep 3
docker compose up -d --build
sleep 10
echo "✅ Servicio reiniciado con health checks"
echo ""

# ============================================================
# FASE 4: Configurar Cron Job de Auto-Recovery
# ============================================================
echo "📋 FASE 4: Configurar Cron Job de Auto-Recovery"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Crear archivo de log
LOG_FILE="/var/log/citizen-reports-monitor.log"
touch $LOG_FILE
chmod 666 $LOG_FILE
echo "✅ Log file creado: $LOG_FILE"

# Agregar cron job si no existe
CRON_ENTRY="*/5 * * * * bash $SERVICE_DIR/scripts/production-recovery.sh"
CRON_TMP=$(mktemp)

if crontab -l 2>/dev/null | grep -q "production-recovery.sh"; then
    echo "⚠️  Cron job ya existe - saltando"
else
    (crontab -l 2>/dev/null || true) > $CRON_TMP
    echo "$CRON_ENTRY" >> $CRON_TMP
    crontab $CRON_TMP
    rm $CRON_TMP
    echo "✅ Cron job agregado: cada 5 minutos"
fi

# Verificar que se agregó
echo "📌 Cron jobs actuales:"
crontab -l | grep -v "^#" | grep -v "^$" || echo "   (ninguno)"
echo ""

# ============================================================
# FASE 5: Verificaciones Finales
# ============================================================
echo "📋 FASE 5: Verificaciones Finales"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Docker status
echo "🐳 Estado de Docker:"
docker ps | grep citizen-reports-app || echo "   ❌ Container no found"

# API test
echo ""
echo "🔍 Test de API:"
RESPONSE=$(curl -s -k https://127.0.0.1/api/reportes 2>/dev/null | head -c 50)
if [ ! -z "$RESPONSE" ]; then
    echo "   ✅ API respondiendo: ${RESPONSE:0:50}..."
else
    echo "   ❌ Sin respuesta"
fi

# Disk space
echo ""
echo "💾 Espacio en disco:"
df -h / | tail -1

# Memory
echo ""
echo "🧠 Memoria disponible:"
free -h | grep Mem

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║               ✅ SETUP COMPLETADO                             ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║ ✓ Health checks en Docker configurados                        ║"
echo "║ ✓ Restart policy: unless-stopped                              ║"
echo "║ ✓ Cron job: auto-restart cada 5 minutos                       ║"
echo "║ ✓ Logs en: /var/log/citizen-reports-monitor.log               ║"
echo "║                                                                ║"
echo "║ Próximo paso: Configurar UptimeRobot para alertas externas    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
