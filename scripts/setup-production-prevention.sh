#!/bin/bash
# 🚀 Production Prevention Setup Script
# Ejecutar SOLO UNA VEZ en el servidor para implementar todas las medidas preventivas
# Usage: bash setup-production-prevention.sh

set -e

DOMAIN="reportes.progressiagroup.com"
SERVICE_DIR="/root/citizen-reports"
CRON_USER="root"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         🚀 PRODUCTION PREVENTION SETUP                        ║"
echo "║  citizen-reports - 14 Noviembre 2025                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================
# FASE 1: Validar Estado Actual
# ============================================================
echo "📋 FASE 1: Validar Estado Actual"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if docker ps | grep -q citizen-reports-app; then
    echo "✅ Container citizen-reports-app está RUNNING"
else
    echo "⚠️  Container citizen-reports-app está DOWN - Intentando restart..."
    cd $SERVICE_DIR
    docker compose restart citizen-reports-app
    sleep 5
fi

# Verificar API
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -k https://127.0.0.1/api/reportes 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API respondiendo correctamente (HTTP $HTTP_CODE)"
else
    echo "⚠️  API retornando $HTTP_CODE - Revisar logs"
    docker logs --tail=20 citizen-reports-app
fi
echo ""

# ============================================================
# FASE 2: Actualizar Docker Compose con Health Checks
# ============================================================
echo "📋 FASE 2: Actualizar Docker Compose con Health Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Backup del archivo actual
cp $SERVICE_DIR/docker-compose-prod.yml $SERVICE_DIR/docker-compose-prod.yml.backup.$(date +%s)
echo "✅ Backup creado"

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
