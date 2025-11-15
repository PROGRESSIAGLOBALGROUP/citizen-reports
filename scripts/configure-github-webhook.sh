#!/bin/bash
# Configure GitHub Webhook via GitHub API
# Usage: GITHUB_TOKEN=your-token bash scripts/configure-github-webhook.sh

set -e

GITHUB_TOKEN="${GITHUB_TOKEN:-}"
GITHUB_REPO="PROGRESSIAGLOBALGROUP/citizen-reports"
WEBHOOK_URL="http://145.79.0.77:3001/webhook"
WEBHOOK_SECRET="dc2a6295da8f8c73722c67dd63f25c8ccdd0436895b9183856d06cbea494a6b0"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   GITHUB WEBHOOK CONFIGURATION VIA API                        ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check token
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}❌ ERROR: GITHUB_TOKEN environment variable not set${NC}"
    echo ""
    echo "To get a GitHub token:"
    echo "  1. Go to: https://github.com/settings/tokens"
    echo "  2. Click: 'Generate new token (classic)'"
    echo "  3. Select scopes: repo, admin:repo_hook"
    echo "  4. Copy the token"
    echo ""
    echo "Then run:"
    echo "  export GITHUB_TOKEN='ghp_...your_token...'"
    echo "  bash scripts/configure-github-webhook.sh"
    exit 1
fi

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "  Repository: $GITHUB_REPO"
echo "  Webhook URL: $WEBHOOK_URL"
echo "  Secret: ${WEBHOOK_SECRET:0:10}...${WEBHOOK_SECRET: -10}"
echo ""

# Check existing webhooks
echo -e "${BLUE}Checking existing webhooks...${NC}"
EXISTING=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$GITHUB_REPO/hooks" | jq '.[] | select(.config.url=="'$WEBHOOK_URL'") | .id' 2>/dev/null || echo "")

if [ ! -z "$EXISTING" ]; then
    echo -e "${YELLOW}⚠️  Webhook already exists (ID: $EXISTING)${NC}"
    echo -e "${YELLOW}Deleting old webhook...${NC}"
    curl -s -X DELETE -H "Authorization: token $GITHUB_TOKEN" \
      "https://api.github.com/repos/$GITHUB_REPO/hooks/$EXISTING" > /dev/null
    echo -e "${GREEN}✅ Old webhook deleted${NC}"
    sleep 2
fi

# Create webhook
echo ""
echo -e "${BLUE}Creating new webhook...${NC}"
RESPONSE=$(curl -s -X POST -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$GITHUB_REPO/hooks" \
  -d @- <<EOF
{
  "name": "web",
  "active": true,
  "events": ["push"],
  "config": {
    "url": "$WEBHOOK_URL",
    "content_type": "json",
    "secret": "$WEBHOOK_SECRET",
    "insecure_ssl": "0"
  }
}
EOF
)

# Check response
if echo "$RESPONSE" | grep -q '"id":'; then
    HOOK_ID=$(echo "$RESPONSE" | jq -r '.id')
    echo -e "${GREEN}✅ Webhook created successfully${NC}"
    echo "   Hook ID: $HOOK_ID"
    echo ""
    
    # Test the webhook
    echo -e "${BLUE}Testing webhook...${NC}"
    TEST_RESPONSE=$(curl -s -X POST -H "Authorization: token $GITHUB_TOKEN" \
      "https://api.github.com/repos/$GITHUB_REPO/hooks/$HOOK_ID/tests" 2>&1)
    
    if echo "$TEST_RESPONSE" | grep -q '{"message":"' || [ -z "$TEST_RESPONSE" ]; then
        echo -e "${GREEN}✅ Webhook test initiated${NC}"
        echo ""
        echo -e "${YELLOW}The webhook will receive a test push event.${NC}"
        echo -e "${YELLOW}Check logs: tail -f /var/log/citizen-reports/webhook-deploy.log${NC}"
    else
        echo -e "${YELLOW}⚠️  Test response: $TEST_RESPONSE${NC}"
    fi
else
    ERROR=$(echo "$RESPONSE" | jq -r '.message // .errors[0].message // "Unknown error"' 2>/dev/null)
    echo -e "${RED}❌ Failed to create webhook${NC}"
    echo "   Error: $ERROR"
    echo ""
    echo "Full response:"
    echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
    exit 1
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ GITHUB WEBHOOK CONFIGURED SUCCESSFULLY                  ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Monitor webhook deliveries:"
echo "     https://github.com/$GITHUB_REPO/settings/hooks"
echo ""
echo "  2. Test auto-deployment:"
echo "     git push origin main"
echo ""
echo "  3. Watch deployment:"
echo "     ssh root@145.79.0.77 'tail -f /var/log/citizen-reports/webhook-deploy.log'"
echo ""
