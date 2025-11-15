#!/usr/bin/env node
/**
 * Test GitHub Webhook locally
 * Computes HMAC signature correctly using Node.js
 * 
 * Usage:
 *   node test-webhook-node.js [webhook-url] [secret]
 */

import crypto from 'crypto';
import http from 'http';

const WEBHOOK_URL = process.argv[2] || 'http://localhost:3001/webhook';
const WEBHOOK_SECRET = process.argv[3] || 'dc2a6295da8f8c73722c67dd63f25c8ccdd0436895b9183856d06cbea494a6b0';

console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║   WEBHOOK TEST - Node.js Version (Correct HMAC)              ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// Generate test payload
const payload = JSON.stringify({
  ref: 'refs/heads/main',
  before: '0000000000000000000000000000000000000000',
  after: '1234567890abcdef1234567890abcdef12345678',
  repository: {
    id: 1,
    name: 'citizen-reports',
    full_name: 'PROGRESSIAGLOBALGROUP/citizen-reports',
    private: false,
    owner: {
      name: 'PROGRESSIAGLOBALGROUP',
      email: 'dev@progressiagroup.com'
    },
    html_url: 'https://github.com/PROGRESSIAGLOBALGROUP/citizen-reports',
    description: 'Civic-tech transparency platform',
    url: 'https://api.github.com/repos/PROGRESSIAGLOBALGROUP/citizen-reports'
  },
  pusher: {
    name: 'test-user',
    email: 'test@progressiagroup.com'
  },
  commits: [
    {
      id: '1234567890abcdef1234567890abcdef12345678',
      tree_id: 'abcdef1234567890abcdef1234567890abcdef',
      distinct: true,
      message: 'test: Trigger webhook test deployment',
      timestamp: '2025-11-15T00:00:00+00:00',
      url: 'https://github.com/PROGRESSIAGLOBALGROUP/citizen-reports/commit/1234567890abcdef',
      author: {
        name: 'Test User',
        email: 'test@progressiagroup.com',
        username: 'testuser'
      }
    }
  ],
  created: false,
  deleted: false,
  forced: false,
  head_commit: {
    id: '1234567890abcdef1234567890abcdef12345678',
    message: 'test: Trigger webhook test deployment'
  },
  compare: 'https://github.com/PROGRESSIAGLOBALGROUP/citizen-reports/compare/0...1234567890ab'
});

console.log('📋 Payload Preview:');
console.log(JSON.stringify(JSON.parse(payload), null, 2).split('\n').slice(0, 15).join('\n'));
console.log('   ...\n');

// Compute HMAC signature
const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
hmac.update(payload);
const signature = 'sha256=' + hmac.digest('hex');

console.log('🔐 HMAC-SHA256 Signature:');
console.log(`   ${signature}\n`);

// Parse URL
const url = new URL(WEBHOOK_URL);
const isHttps = url.protocol === 'https:';
const port = url.port || (isHttps ? 443 : 80);

console.log(`🚀 Sending webhook to: ${WEBHOOK_URL}\n`);

// Send request
const httpModule = isHttps ? await import('https') : http;
const requestOptions = {
  hostname: url.hostname,
  port: port,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'X-Hub-Signature-256': signature,
    'X-GitHub-Event': 'push',
    'X-GitHub-Delivery': '12345678-1234-1234-1234-123456789012'
  }
};

const req = http.request(requestOptions, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`📊 Response Status: ${res.statusCode}\n`);

    try {
      const jsonData = JSON.parse(data);
      console.log('✅ Response received:');
      console.log(JSON.stringify(jsonData, null, 2));
    } catch {
      console.log('Response body:');
      console.log(data);
    }

    if (res.statusCode === 200 || res.statusCode === 202) {
      console.log('\n✅ Webhook received successfully!\n');
      console.log('📋 Next Steps:');
      console.log('   1. Monitor deployment:');
      console.log('      ssh root@145.79.0.77 "tail -f /var/log/citizen-reports/webhook-deploy.log"');
      console.log('\n   2. Check webhook status:');
      console.log('      curl http://145.79.0.77:3001/status | jq .');
      console.log('\n   3. Wait ~3-5 minutes for deployment to complete\n');
    } else {
      console.log('\n❌ Webhook rejected!\n');
      console.log('Troubleshooting:');
      console.log('   - Verify webhook URL is correct');
      console.log('   - Check if webhook server is running: pm2 status');
      console.log('   - Check webhook logs: tail -f /var/log/citizen-reports/webhook-deploy.log');
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.log(`\n❌ Request failed: ${error.message}\n`);
  console.log('Troubleshooting:');
  console.log('   - Check webhook URL is accessible');
  console.log('   - Verify webhook server is running');
  console.log('   - Check firewall rules\n');
  process.exit(1);
});

req.write(payload);
req.end();
