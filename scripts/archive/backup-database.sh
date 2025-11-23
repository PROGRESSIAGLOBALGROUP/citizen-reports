#!/bin/bash
# 🔒 Database Backup Script - Automatic daily backups
# Schedule: 0 2 * * * /root/citizen-reports/scripts/backup-database.sh

BACKUP_DIR="/root/citizen-reports/backups"
DB_PATH="/root/citizen-reports/server/data.db"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/data_$DATE.db"
LOG_FILE="/var/log/citizen-reports-backup.log"

# Crear directorio de backups si no existe
mkdir -p $BACKUP_DIR

# Función de logging
log_message() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

# ============================================================
# PASO 1: Verificar que database existe
# ============================================================
if [ ! -f "$DB_PATH" ]; then
    log_message "❌ ERROR: Database no encontrada en $DB_PATH"
    exit 1
fi

log_message "🔄 Iniciando backup de database"

# ============================================================
# PASO 2: Crear backup
# ============================================================
if sqlite3 "$DB_PATH" "VACUUM;" >/dev/null 2>&1; then
    log_message "✅ Database optimizada"
else
    log_message "⚠️  No se pudo optimizar database"
fi

# Copiar archivo
if cp "$DB_PATH" "$BACKUP_FILE"; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | awk '{print $1}')
    log_message "✅ Backup creado: $BACKUP_FILE ($BACKUP_SIZE)"
else
    log_message "❌ ERROR: No se pudo crear backup"
    exit 1
fi

# ============================================================
# PASO 3: Verificar integridad del backup
# ============================================================
if sqlite3 "$BACKUP_FILE" "PRAGMA integrity_check;" | grep -q "ok"; then
    log_message "✅ Integridad del backup verificada"
else
    log_message "❌ ERROR: Backup corrupto"
    rm "$BACKUP_FILE"
    exit 1
fi

# ============================================================
# PASO 4: Limpiar backups viejos (> 30 días)
# ============================================================
OLD_BACKUPS=$(find $BACKUP_DIR -name "data_*.db" -mtime +30)
if [ ! -z "$OLD_BACKUPS" ]; then
    COUNT=$(echo "$OLD_BACKUPS" | wc -l)
    rm $OLD_BACKUPS
    log_message "🧹 Eliminados $COUNT backups antiguos"
fi

# ============================================================
# PASO 5: Mantener solo últimos 30 backups
# ============================================================
BACKUP_COUNT=$(ls -1 $BACKUP_DIR/data_*.db 2>/dev/null | wc -l)
if [ $BACKUP_COUNT -gt 30 ]; then
    EXCESS=$((BACKUP_COUNT - 30))
    ls -t1 $BACKUP_DIR/data_*.db | tail -n $EXCESS | xargs rm
    log_message "📊 Manteniendo solo últimos 30 backups (eliminados $EXCESS extras)"
fi

# ============================================================
# PASO 6: Reporte de estado
# ============================================================
TOTAL_SIZE=$(du -sh $BACKUP_DIR | awk '{print $1}')
LATEST_BACKUP=$(ls -lt1 $BACKUP_DIR/data_*.db | head -1 | awk '{print $NF}')

log_message "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_message "✅ Backup completado exitosamente"
log_message "📊 Directorio de backups: $TOTAL_SIZE"
log_message "📁 Último backup: $(basename $LATEST_BACKUP)"
log_message "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ============================================================
# PASO 7: Enviar notificación (opcional)
# ============================================================
# Descomentar para enviar email
# echo "Backup completado: $BACKUP_FILE" | \
#   mail -s "citizen-reports DB Backup OK" devops@progressiagroup.com

log_message "✅ Fin del backup"
