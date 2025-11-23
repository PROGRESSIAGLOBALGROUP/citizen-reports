#!/bin/bash
# Production Health Check Script for citizen-reports
# Run this on the VPS to diagnose and fix issues
# Usage: bash production-health-check.sh

set -e

DOMAIN="reportes.progressiagroup.com"
API_URL="https://${DOMAIN}/api/reportes"
SERVICE_NAME="citizen-reports"
CONTAINER_NAME="citizen-reports-app"

echo "=========================================="
echo "🔍 PRODUCTION HEALTH CHECK"
echo "Domain: $DOMAIN"
echo "Time: $(date)"
echo "=========================================="
echo ""

# 1. Check DNS Resolution
echo "✓ Step 1: DNS Resolution"
if nslookup $DOMAIN 8.8.8.8 > /dev/null 2>&1; then
    DNS_IP=$(nslookup $DOMAIN 8.8.8.8 | grep "Address:" | tail -1 | awk '{print $2}')
    echo "✅ DNS resolves to: $DNS_IP"
else
    echo "❌ DNS resolution failed"
    exit 1
fi
echo ""

# 2. Check Port 443 (HTTPS)
echo "✓ Step 2: HTTPS Port 443"
if timeout 5 bash -c "cat < /dev/null > /dev/tcp/127.0.0.1/443" 2>/dev/null; then
    echo "✅ Port 443 is open locally"
else
    echo "❌ Port 443 is not responding"
    exit 1
fi
echo ""

# 3. Check Docker Service Status
echo "✓ Step 3: Docker Service"
if systemctl is-active --quiet docker; then
    echo "✅ Docker daemon is running"
else
    echo "⚠️  Docker daemon not running - attempting restart..."
    systemctl restart docker
    sleep 3
fi
echo ""

# 4. Check Container Status
echo "✓ Step 4: Container Status"
if docker ps | grep -q $CONTAINER_NAME; then
    STATUS=$(docker ps --filter "name=$CONTAINER_NAME" --format "{{.Status}}")
    echo "✅ Container $CONTAINER_NAME is running"
    echo "   Status: $STATUS"
else
    echo "❌ Container $CONTAINER_NAME is NOT running"
    echo "   Attempting to start container..."
    docker compose -f /root/citizen-reports/docker-compose.yml up -d
    sleep 5
fi
echo ""

# 5. Check Application Response
echo "✓ Step 5: Application HTTP Response"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -k https://127.0.0.1/ 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ]; then
    echo "✅ Application responding with HTTP $HTTP_CODE"
else
    echo "❌ Application HTTP response: $HTTP_CODE (expected 200/301)"
fi
echo ""

# 6. Check API Endpoint
echo "✓ Step 6: API Endpoint"
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" -k "$API_URL" 2>/dev/null || echo "000")
if [ "$API_CODE" = "200" ]; then
    echo "✅ API responding with HTTP $API_CODE"
else
    echo "⚠️  API HTTP response: $API_CODE (expected 200)"
fi
echo ""

# 7. Check Disk Space
echo "✓ Step 7: Disk Space"
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 90 ]; then
    echo "✅ Disk usage: ${DISK_USAGE}% (OK)"
else
    echo "⚠️  Disk usage: ${DISK_USAGE}% (WARNING - above 90%)"
fi
echo ""

# 8. Check Memory
echo "✓ Step 8: Memory Usage"
MEMORY_USAGE=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
if [ "$MEMORY_USAGE" -lt 90 ]; then
    echo "✅ Memory usage: ${MEMORY_USAGE}% (OK)"
else
    echo "⚠️  Memory usage: ${MEMORY_USAGE}% (WARNING - above 90%)"
fi
echo ""

# 9. Check Container Logs
echo "✓ Step 9: Container Logs (last 10 lines)"
echo "---"
docker logs --tail=10 $CONTAINER_NAME 2>&1 || echo "No logs available"
echo "---"
echo ""

# 10. Check Traefik Status
echo "✓ Step 10: Traefik Status"
if docker ps | grep -q traefik; then
    echo "✅ Traefik container is running"
else
    echo "⚠️  Traefik container is not running"
fi
echo ""

echo "=========================================="
echo "✅ HEALTH CHECK COMPLETE"
echo "=========================================="
echo ""
echo "Summary:"
echo "  - DNS: ✅"
echo "  - Port 443: ✅"
echo "  - Docker: ✅"
echo "  - Container: $([ $? -eq 0 ] && echo '✅' || echo '❌')"
echo "  - Application: $([ "$HTTP_CODE" = "200" ] && echo '✅' || echo '⚠️')"
echo ""
echo "If there are issues, check:"
echo "  1. docker logs citizen-reports-app"
echo "  2. docker compose logs -f"
echo "  3. journalctl -u docker -n 50"
