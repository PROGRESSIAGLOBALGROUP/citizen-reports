#!/bin/bash
# 🌐 Remote Production Prevention Deployment
# Execute from local machine to deploy prevention on production server
# Usage: bash deploy-prevention-remote.sh <server_ip> <ssh_key_path>

SERVER_IP="${1:-145.79.0.77}"
SSH_KEY="${2:-}"

if [ -z "$SERVER_IP" ]; then
    echo "Usage: bash deploy-prevention-remote.sh <server_ip> [ssh_key_path]"
    exit 1
fi

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       🚀 REMOTE PREVENTION DEPLOYMENT                         ║"
echo "║       Target: $SERVER_IP                                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Build SSH command
SSH_CMD="ssh"
if [ -n "$SSH_KEY" ]; then
    SSH_CMD="ssh -i $SSH_KEY"
fi

# Test connection
echo "Testing SSH connection..."
if ! $SSH_CMD root@$SERVER_IP "echo 'OK'" > /dev/null 2>&1; then
    echo "❌ Cannot connect to $SERVER_IP"
    echo "Make sure you can SSH: $SSH_CMD root@$SERVER_IP"
    exit 1
fi
echo "✅ Connected to $SERVER_IP"
echo ""

# Upload scripts
echo "Uploading prevention scripts..."
scp -q scripts/production-recovery.sh root@$SERVER_IP:/root/citizen-reports/scripts/
scp -q scripts/production-health-check.sh root@$SERVER_IP:/root/citizen-reports/scripts/
scp -q scripts/setup-production-prevention.sh root@$SERVER_IP:/root/citizen-reports/scripts/
echo "✅ Scripts uploaded"
echo ""

# Execute setup
echo "Running prevention setup on $SERVER_IP..."
$SSH_CMD root@$SERVER_IP "bash /root/citizen-reports/scripts/setup-production-prevention.sh"

echo ""
echo "✅ Prevention setup completed!"
echo ""
echo "View status: $SSH_CMD root@$SERVER_IP 'bash /root/citizen-reports/scripts/dashboard.sh'"
