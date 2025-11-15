#!/bin/bash
# Test webhook locally by simulating a GitHub push event
# This tests the webhook without needing GitHub token

WEBHOOK_URL="${1:-http://localhost:3001/webhook}"
WEBHOOK_SECRET="dc2a6295da8f8c73722c67dd63f25c8ccdd0436895b9183856d06cbea494a6b0"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   LOCAL WEBHOOK TEST - Simulating GitHub Push Event          ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Generate test payload
PAYLOAD=$(cat <<'EOF'
{
  "ref": "refs/heads/main",
  "before": "0000000000000000000000000000000000000000",
  "after": "1234567890abcdef1234567890abcdef12345678",
  "repository": {
    "id": 1,
    "name": "citizen-reports",
    "full_name": "PROGRESSIAGLOBALGROUP/citizen-reports",
    "private": false,
    "owner": {
      "name": "PROGRESSIAGLOBALGROUP",
      "email": "dev@progressiagroup.com"
    },
    "html_url": "https://github.com/PROGRESSIAGLOBALGROUP/citizen-reports",
    "description": "Civic-tech transparency platform",
    "url": "https://api.github.com/repos/PROGRESSIAGLOBALGROUP/citizen-reports"
  },
  "pusher": {
    "name": "test-user",
    "email": "test@progressiagroup.com"
  },
  "commits": [
    {
      "id": "1234567890abcdef1234567890abcdef12345678",
      "tree_id": "abcdef1234567890abcdef1234567890abcdef",
      "distinct": true,
      "message": "test: Trigger webhook test deployment",
      "timestamp": "2025-11-15T00:00:00+00:00",
      "url": "https://github.com/PROGRESSIAGLOBALGROUP/citizen-reports/commit/1234567890abcdef",
      "author": {
        "name": "Test User",
        "email": "test@progressiagroup.com",
        "username": "testuser"
      }
    }
  ],
  "created": false,
  "deleted": false,
  "forced": false,
  "compare": "https://github.com/PROGRESSIAGLOBALGROUP/citizen-reports/compare/0...1234567890ab"
}
EOF
)

echo "📋 Payload:"
echo "$PAYLOAD" | jq '.' | head -20
echo ""

# Compute HMAC signature
if command -v sha256sum &> /dev/null; then
    SIGNATURE="sha256=$(echo -n "$PAYLOAD" | sha256sum | awk '{print $1}')"
elif command -v shasum &> /dev/null; then
    SIGNATURE="sha256=$(echo -n "$PAYLOAD" | shasum -a 256 | awk '{print $1}')"
else
    echo "❌ Error: sha256sum or shasum not found"
    exit 1
fi

# For macOS/Linux with openssl
if command -v openssl &> /dev/null; then
    SIGNATURE="sha256=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -hex | sed 's/^.*= //')"
fi

echo "🔐 HMAC-SHA256 Signature:"
echo "   $SIGNATURE"
echo ""

echo "🚀 Sending webhook to: $WEBHOOK_URL"
echo ""

# Send the webhook
RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: $SIGNATURE" \
  -H "X-GitHub-Event: push" \
  -H "X-GitHub-Delivery: 12345678-1234-1234-1234-123456789012" \
  -d "$PAYLOAD" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "📊 Response Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "202" ]; then
    echo "✅ Webhook received successfully!"
    echo ""
    echo "📝 Response Body:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Monitor deployment:"
    echo "      ssh root@145.79.0.77 'tail -f /var/log/citizen-reports/webhook-deploy.log'"
    echo ""
    echo "   2. Check webhook status:"
    echo "      curl http://145.79.0.77:3001/status | jq ."
    echo ""
    echo "   3. Wait ~3-5 minutes for deployment to complete"
else
    echo "❌ Webhook rejected (HTTP $HTTP_CODE)"
    echo ""
    echo "📝 Response Body:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    echo ""
    echo "❓ Troubleshooting:"
    echo "   - Check webhook URL is accessible"
    echo "   - Verify HMAC signature is correct"
    echo "   - Check webhook logs: tail -f /var/log/citizen-reports/webhook-deploy.log"
    echo "   - Verify webhook is running: pm2 status"
    exit 1
fi

echo ""
