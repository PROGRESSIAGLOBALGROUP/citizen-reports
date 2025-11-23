#!/bin/bash
# Setup GitHub Webhook Auto-Deployment on Production Server
# Usage: bash scripts/setup-webhook-auto-deploy.sh [github-secret]
# 
# Example:
#   bash scripts/setup-webhook-auto-deploy.sh "Pq7mK9xL2nJ5qR8sT3uV6wX1yZ4aB9cD"

set -e

GITHUB_SECRET="${1:-}"
REPO_PATH="/root/citizen-reports"
LOG_DIR="/var/log/citizen-reports"
PM2_CONFIG="/root/citizen-reports/config/pm2/webhook.config.cjs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   SETUP GITHUB WEBHOOK AUTO-DEPLOYMENT                       ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Validate input
if [ -z "$GITHUB_SECRET" ]; then
    echo -e "${RED}❌ ERROR: GitHub webhook secret required${NC}"
    echo ""
    echo "Usage: bash scripts/setup-webhook-auto-deploy.sh [github-secret]"
    echo ""
    echo "Example:"
    echo "  bash scripts/setup-webhook-auto-deploy.sh \"Pq7mK9xL2nJ5qR8sT3uV6wX1yZ4aB9cD\""
    echo ""
    echo "To generate a secret, run:"
    echo "  node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    exit 1
fi

if [ ${#GITHUB_SECRET} -lt 20 ]; then
    echo -e "${RED}❌ ERROR: Secret too short (minimum 20 characters)${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 GitHub Webhook Secret: ${GITHUB_SECRET:0:10}...${GITHUB_SECRET: -10}${NC}"
echo ""

# Step 1: Create logs directory
echo -e "${BLUE}✓ Step 1: Creating logs directory...${NC}"
mkdir -p "$LOG_DIR"
if [ -d "$LOG_DIR" ]; then
    echo -e "${GREEN}  ✅ Logs directory ready: $LOG_DIR${NC}"
else
    echo -e "${RED}  ❌ Failed to create logs directory${NC}"
    exit 1
fi
echo ""

# Step 2: Check webhook server script exists
echo -e "${BLUE}✓ Step 2: Checking webhook server script...${NC}"
WEBHOOK_SCRIPT="$REPO_PATH/server/webhook-github-auto-deploy.js"
if [ -f "$WEBHOOK_SCRIPT" ]; then
    echo -e "${GREEN}  ✅ Webhook script found: $WEBHOOK_SCRIPT${NC}"
else
    echo -e "${RED}  ❌ Webhook script not found: $WEBHOOK_SCRIPT${NC}"
    exit 1
fi
echo ""

# Step 3: Update PM2 config with secret
echo -e "${BLUE}✓ Step 3: Updating PM2 configuration...${NC}"
if [ -f "$PM2_CONFIG" ]; then
    sed -i "s/GITHUB_WEBHOOK_SECRET: '.*'/GITHUB_WEBHOOK_SECRET: '$GITHUB_SECRET'/" "$PM2_CONFIG"
    echo -e "${GREEN}  ✅ PM2 config updated with secret${NC}"
else
    echo -e "${RED}  ❌ PM2 config not found: $PM2_CONFIG${NC}"
    exit 1
fi
echo ""

# Step 4: Check if PM2 is installed
echo -e "${BLUE}✓ Step 4: Checking PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}  ⚠️  PM2 not found, installing globally...${NC}"
    npm install -g pm2
    echo -e "${GREEN}  ✅ PM2 installed${NC}"
else
    echo -e "${GREEN}  ✅ PM2 already installed: $(pm2 --version)${NC}"
fi
echo ""

# Step 5: Stop existing webhook app if running
echo -e "${BLUE}✓ Step 5: Checking for existing webhook process...${NC}"
if pm2 list | grep -q "webhook-auto-deploy"; then
    echo -e "${YELLOW}  ⚠️  Stopping existing webhook-auto-deploy...${NC}"
    pm2 stop webhook-auto-deploy
    pm2 delete webhook-auto-deploy
    sleep 2
    echo -e "${GREEN}  ✅ Existing process stopped${NC}"
else
    echo -e "${GREEN}  ✅ No existing process found${NC}"
fi
echo ""

# Step 6: Start webhook server with PM2
echo -e "${BLUE}✓ Step 6: Starting webhook server with PM2...${NC}"
cd "$REPO_PATH"
pm2 start "$PM2_CONFIG"
sleep 3

if pm2 list | grep -q "webhook-auto-deploy"; then
    pm2 show webhook-auto-deploy | grep -E "pid|status|memory"
    echo -e "${GREEN}  ✅ Webhook server started${NC}"
else
    echo -e "${RED}  ❌ Failed to start webhook server${NC}"
    pm2 logs webhook-auto-deploy --lines 20
    exit 1
fi
echo ""

# Step 7: Save PM2 to resurrect on reboot
echo -e "${BLUE}✓ Step 7: Saving PM2 configuration...${NC}"
pm2 save
if command -v pm2-startup &> /dev/null; then
    pm2-startup systemd -u root --hp /root
fi
echo -e "${GREEN}  ✅ PM2 configuration saved${NC}"
echo ""

# Step 8: Verify webhook is responding
echo -e "${BLUE}✓ Step 8: Testing webhook server...${NC}"
sleep 2
HEALTH_CHECK=$(curl -s http://localhost:3000/health || echo "{}")

if echo "$HEALTH_CHECK" | grep -q "ok"; then
    echo -e "${GREEN}  ✅ Webhook server is responding${NC}"
    echo "     Response: $HEALTH_CHECK"
else
    echo -e "${YELLOW}  ⚠️  Health check didn't respond as expected${NC}"
    echo "     Response: $HEALTH_CHECK"
fi
echo ""

# Step 9: Display GitHub Setup Instructions
echo -e "${BLUE}✓ Step 9: GitHub Configuration${NC}"
echo ""
echo -e "${YELLOW}Next, configure the webhook in GitHub:${NC}"
echo ""
echo "  1. Go to: https://github.com/PROGRESSIAGLOBALGROUP/citizen-reports"
echo "  2. Click: Settings → Webhooks → Add webhook"
echo "  3. Fill in:"
echo "     • Payload URL: https://145.79.0.77:3000/webhook"
echo "     • Content type: application/json"
echo "     • Secret: $GITHUB_SECRET"
echo "     • Events: Push events only"
echo "     • Active: ✅ Yes"
echo "  4. Click: Add webhook"
echo ""

# Step 10: Display verification commands
echo -e "${BLUE}✓ Step 10: Verification Commands${NC}"
echo ""
echo -e "${YELLOW}To verify and monitor:${NC}"
echo ""
echo "  View webhook status:"
echo "    curl -s http://localhost:3000/status | jq ."
echo ""
echo "  View deployment logs:"
echo "    tail -50 /var/log/citizen-reports/webhook-deploy.log"
echo ""
echo "  Watch logs in real-time:"
echo "    tail -f /var/log/citizen-reports/webhook-deploy.log"
echo ""
echo "  Check PM2 status:"
echo "    pm2 status"
echo "    pm2 logs webhook-auto-deploy"
echo ""

# Final summary
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ WEBHOOK AUTO-DEPLOYMENT SETUP COMPLETE                  ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Summary:${NC}"
echo "  • Webhook Server: Running on port 3000"
echo "  • Process Manager: PM2"
echo "  • Logs Directory: $LOG_DIR"
echo "  • Config File: $PM2_CONFIG"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Configure webhook in GitHub (see instructions above)"
echo "  2. Test with: git push origin main"
echo "  3. Monitor with: tail -f /var/log/citizen-reports/webhook-deploy.log"
echo ""
echo -e "${YELLOW}Documentation:${NC}"
echo "  See: docs/WEBHOOK_AUTO_DEPLOY_SETUP.md"
echo ""
