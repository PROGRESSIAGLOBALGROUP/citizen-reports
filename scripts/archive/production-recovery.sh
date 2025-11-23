#!/bin/bash
# Production Recovery Script for citizen-reports
# Automatically restarts the service if it's down
# Should be run as a cron job every 5 minutes

CONTAINER_NAME="citizen-reports-app"
SERVICE_NAME="citizen-reports"
DOCKER_COMPOSE="/root/citizen-reports/docker-compose.yml"
LOG_FILE="/var/log/citizen-reports-monitor.log"

# Function to log messages
log_message() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

# Check if container is running
if ! docker ps | grep -q $CONTAINER_NAME; then
    log_message "❌ Container $CONTAINER_NAME is DOWN - attempting restart"
    
    # Try to restart
    cd $(dirname $DOCKER_COMPOSE)
    docker compose restart $CONTAINER_NAME >> $LOG_FILE 2>&1
    
    sleep 3
    
    # Check if it's running now
    if docker ps | grep -q $CONTAINER_NAME; then
        log_message "✅ Container successfully restarted"
        
        # Send notification (optional - requires webhook)
        # curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK \
        #   -d '{"text":"citizen-reports restarted at '$(date)'"}'
    else
        log_message "❌ CRITICAL: Container restart failed - manual intervention required"
        
        # Show logs for debugging
        log_message "Recent logs:"
        docker logs --tail=20 $CONTAINER_NAME >> $LOG_FILE 2>&1
    fi
else
    # Container is running, check if API is responding
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -k https://reportes.progressiagroup.com/api/reportes 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" != "200" ]; then
        log_message "⚠️  Container running but API returning $HTTP_CODE"
        
        # If API not responding for multiple checks, restart
        if [ $(grep -c "API returning" $LOG_FILE | tail -5) -ge 3 ]; then
            log_message "API not responding for multiple checks - restarting container"
            docker compose -f $DOCKER_COMPOSE restart $CONTAINER_NAME >> $LOG_FILE 2>&1
        fi
    else
        log_message "✅ Service is healthy (API responding with $HTTP_CODE)"
    fi
fi

# Cleanup old logs (keep only last 30 days)
find /var/log/citizen-reports-monitor.log -mtime +30 -delete 2>/dev/null || true
