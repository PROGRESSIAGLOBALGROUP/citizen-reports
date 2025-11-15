#!/bin/bash
# Quick Test of GitHub Webhook Auto-Deployment
# Usage: bash scripts/test-webhook-deployment.sh
# 
# This script:
# 1. Generates a test GitHub webhook payload
# 2. Computes the HMAC-SHA256 signature
# 3. Sends it to the webhook server
# 4. Monitors the deployment process

set -e

WEBHOOK_URL="http://localhost:3000/webhook"
SECRET="${GITHUB_WEBHOOK_SECRET:-change-me-in-github-settings}"
LOG_FILE="/var/log/citizen-reports/webhook-deploy.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   TESTING GITHUB WEBHOOK AUTO-DEPLOYMENT                     ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check webhook server is running
echo -e "${YELLOW}Checking webhook server...${NC}"
if ! curl -s http://localhost:3000/health | grep -q "ok"; then
    echo -e "${RED}❌ Webhook server not responding on localhost:3000${NC}"
    echo ""
    echo "Start it with: pm2 start /root/pm2-webhook.config.cjs"
    exit 1
fi
echo -e "${GREEN}✅ Webhook server is running${NC}"
echo ""

# Generate test payload
echo -e "${YELLOW}Generating test webhook payload...${NC}"
COMMIT_SHA="abc1234567890def"
COMMIT_MSG="test: trigger auto-deployment"
PUSHER="test-user"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

PAYLOAD=$(cat <<EOF
{
  "ref": "refs/heads/main",
  "before": "0000000000000000000000000000000000000000",
  "after": "$COMMIT_SHA",
  "repository": {
    "id": "123456789",
    "name": "citizen-reports",
    "full_name": "PROGRESSIAGLOBALGROUP/citizen-reports"
  },
  "pusher": {
    "name": "$PUSHER",
    "email": "${PUSHER}@example.com"
  },
  "head_commit": {
    "id": "$COMMIT_SHA",
    "message": "$COMMIT_MSG",
    "timestamp": "$TIMESTAMP"
  },
  "commits": [
    {
      "id": "$COMMIT_SHA",
      "message": "$COMMIT_MSG"
    }
  ]
}
EOF
)

echo -e "${GREEN}✅ Payload generated${NC}"
echo "   Commit: $COMMIT_SHA"
echo "   Message: $COMMIT_MSG"
echo "   Pusher: $PUSHER"
echo ""

# Calculate signature
echo -e "${YELLOW}Computing HMAC-SHA256 signature...${NC}"
SIGNATURE="sha256=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" -hex | cut -d' ' -f2)"
echo -e "${GREEN}✅ Signature computed${NC}"
echo "   $SIGNATURE"
echo ""

# Send webhook
echo -e "${YELLOW}Sending webhook to $WEBHOOK_URL...${NC}"
RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: $SIGNATURE" \
  -H "X-GitHub-Event: push" \
  -d "$PAYLOAD")

if echo "$RESPONSE" | grep -q "status"; then
    echo -e "${GREEN}✅ Webhook accepted${NC}"
    echo "   Response: $RESPONSE"
else
    echo -e "${RED}❌ Webhook rejected${NC}"
    echo "   Response: $RESPONSE"
    exit 1
fi
echo ""

# Monitor deployment
echo -e "${YELLOW}Monitoring deployment...${NC}"
echo -e "${BLUE}(Press Ctrl+C to stop monitoring)${NC}"
echo ""

if [ ! -f "$LOG_FILE" ]; then
    echo -e "${YELLOW}Creating log file...${NC}"
    touch "$LOG_FILE"
fi

INITIAL_LINES=$(wc -l < "$LOG_FILE" || echo "0")
echo "Initial log lines: $INITIAL_LINES"
echo ""

# Show logs as they arrive
echo -e "${BLUE}=== Deployment Logs ===${NC}"
(tail -f "$LOG_FILE" 2>/dev/null || echo "Waiting for logs...") &
TAIL_PID=$!

# Wait for deployment to complete (max 10 minutes)
echo ""
echo -e "${YELLOW}Waiting for deployment to complete (max 10 minutes)...${NC}"
sleep 5

# Check for completion
MAX_WAIT=600 # 10 minutes
ELAPSED=0
COMPLETED=false

while [ $ELAPSED -lt $MAX_WAIT ]; do
    if grep -q "✅ DEPLOYMENT COMPLETED\|❌ DEPLOYMENT FAILED" "$LOG_FILE"; then
        COMPLETED=true
        break
    fi
    sleep 5
    ELAPSED=$((ELAPSED + 5))
    echo -ne "\rWaiting... ${ELAPSED}s"
done

echo ""
echo ""

# Kill tail process
kill $TAIL_PID 2>/dev/null || true

if $COMPLETED; then
    if grep -q "✅ DEPLOYMENT COMPLETED SUCCESSFULLY" "$LOG_FILE"; then
        echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║   ✅ DEPLOYMENT SUCCESSFUL                                    ║${NC}"
        echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        
        # Get deployment stats
        echo -e "${YELLOW}Deployment Summary:${NC}"
        DURATION=$(grep "Duration:" "$LOG_FILE" | tail -1)
        echo "  $DURATION"
        echo ""
        
        # Verify API is responding
        echo -e "${YELLOW}Checking API health...${NC}"
        sleep 2
        if curl -s http://127.0.0.1:4000/api/reportes?limit=1 | grep -q '"reportes"'; then
            echo -e "${GREEN}✅ API is responding correctly${NC}"
        else
            echo -e "${YELLOW}⚠️  API response check incomplete (may still be initializing)${NC}"
        fi
    else
        echo -e "${RED}╔═══════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║   ❌ DEPLOYMENT FAILED                                        ║${NC}"
        echo -e "${RED}╚═══════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${YELLOW}Error Details:${NC}"
        grep "❌\|ERROR\|FAILED" "$LOG_FILE" | tail -10
        exit 1
    fi
else
    echo -e "${RED}Deployment did not complete within 10 minutes${NC}"
    echo -e "${YELLOW}Last log lines:${NC}"
    tail -20 "$LOG_FILE"
    exit 1
fi

echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Verify the application is live: https://reportes.progressiagroup.com"
echo "  2. Check git logs: git log --oneline -5"
echo "  3. View deployment logs: tail -100 $LOG_FILE"
echo ""
