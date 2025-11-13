import http from 'http';
import crypto from 'crypto';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'your-webhook-secret-change-this';
const DEPLOY_SCRIPT = '/root/deploy.sh';
const LOG_DIR = '/root/logs';

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logFile = path.join(LOG_DIR, 'webhook-events.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage + '\n');
}

function verifyGitHubSignature(payload, signature) {
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return signature === expectedSignature;
}

function triggerDeployment() {
  try {
    log('🚀 Deployment triggered via GitHub webhook');
    log(`Running deployment script: ${DEPLOY_SCRIPT}`);

    const output = execSync(`bash ${DEPLOY_SCRIPT}`, {
      cwd: '/root/citizen-reports',
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    log('✅ Deployment completed successfully');
    log(`Output:\n${output}`);
    return true;
  } catch (error) {
    log(`❌ Deployment failed: ${error.message}`);
    if (error.stdout) log(`stdout: ${error.stdout}`);
    if (error.stderr) log(`stderr: ${error.stderr}`);
    return false;
  }
}

const server = http.createServer((req, res) => {
  // Enable CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Hub-Signature-256');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Webhook endpoint
  if (req.url === '/github-webhook' && req.method === 'POST') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const signature = req.headers['x-hub-signature-256'];

      if (!signature || !verifyGitHubSignature(body, signature)) {
        log('❌ Invalid GitHub signature');
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'Invalid signature' }));
        return;
      }

      try {
        const payload = JSON.parse(body);

        if (payload.action === 'opened' || payload.ref === 'refs/heads/main') {
          log('✅ Valid webhook received');
          const deploySuccess = triggerDeployment();

          res.writeHead(deploySuccess ? 200 : 500);
          res.end(JSON.stringify({
            status: deploySuccess ? 'deployment started' : 'deployment failed',
            timestamp: new Date().toISOString()
          }));
        } else {
          log('⏭️  Skipping non-main branch or non-PR event');
          res.writeHead(200);
          res.end(JSON.stringify({ status: 'ignored' }));
        }
      } catch (error) {
        log(`❌ Error parsing webhook: ${error.message}`);
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid payload' }));
      }
    });
  } else if (req.url === '/health') {
    // Health check endpoint
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', service: 'webhook-server' }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = process.env.WEBHOOK_PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  log(`✅ Webhook server started on port ${PORT}`);
  log(`📍 GitHub webhooks: POST http://0.0.0.0:${PORT}/github-webhook`);
});

server.on('error', (error) => {
  log(`❌ Server error: ${error.message}`);
  process.exit(1);
});
