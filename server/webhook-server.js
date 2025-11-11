const http = require('http');
const crypto = require('crypto');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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
  if (req.url === '/webhook' && req.method === 'POST') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const signature = req.headers['x-hub-signature-256'];

      if (!signature) {
        log('❌ Webhook received without signature');
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Signature missing' }));
        return;
      }

      if (!verifyGitHubSignature(body, signature)) {
        log('❌ Invalid GitHub webhook signature');
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Signature invalid' }));
        return;
      }

      try {
        const payload = JSON.parse(body);
        const ref = payload.ref || '';
        const branch = ref.replace('refs/heads/', '');

        log(`✅ Valid GitHub webhook received from branch: ${branch}`);
        log(`Pusher: ${payload.pusher?.name || 'unknown'}`);
        log(`Commits: ${payload.commits?.length || 0}`);

        if (branch === 'main') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'Deployment started', branch }));

          // Deploy asynchronously (don't block webhook response)
          setImmediate(() => triggerDeployment());
        } else {
          log(`⊘ Ignoring push to branch: ${branch} (only main branch auto-deploys)`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'Ignored - not main branch', branch }));
        }
      } catch (err) {
        log(`❌ Error parsing webhook payload: ${err.message}`);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
  } else if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'webhook-server' }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  log(`🎧 GitHub Webhook Server listening on port ${PORT}`);
  log(`Webhook endpoint: http://localhost:${PORT}/webhook`);
  log(`Health check: http://localhost:${PORT}/health`);
  log(`Deployment script: ${DEPLOY_SCRIPT}`);
  log(`Log file: ${logFile}`);
});

server.on('error', (err) => {
  log(`❌ Server error: ${err.message}`);
  process.exit(1);
});
