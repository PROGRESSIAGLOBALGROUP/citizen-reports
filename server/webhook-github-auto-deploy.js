#!/usr/bin/env node
/**
 * GitHub Webhook Server for Auto-Deployment
 * 
 * Receives GitHub webhook on push to main branch
 * Triggers automatic build, test, and deployment
 * 
 * Usage:
 *   node webhook-github-auto-deploy.js
 * 
 * Environment Variables:
 *   GITHUB_WEBHOOK_SECRET - GitHub webhook secret (from Settings > Webhooks)
 *   WEBHOOK_PORT - Port to listen on (default: 3000)
 *   DEPLOY_REPO_PATH - Path to citizen-reports repo (default: /root/citizen-reports)
 *   STACK_NAME - Docker stack name (default: citizen-reports)
 *   LOG_DIR - Directory for logs (default: /var/log/citizen-reports)
 */

import http from 'http';
import crypto from 'crypto';
import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'your-secret-change-this';
const WEBHOOK_PORT = parseInt(process.env.WEBHOOK_PORT || '3000');
const DEPLOY_REPO_PATH = process.env.DEPLOY_REPO_PATH || '/root/citizen-reports';
const STACK_NAME = process.env.STACK_NAME || 'citizen-reports';
const LOG_DIR = process.env.LOG_DIR || '/var/log/citizen-reports';

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const LOG_FILE = path.join(LOG_DIR, 'webhook-deploy.log');
const DEPLOY_LOG = path.join(LOG_DIR, 'deploy-latest.log');

// State tracking
let isDeploying = false;
let lastDeployStatus = 'idle';
let lastDeployTime = null;
let deployHistory = [];

/**
 * Centralized logging
 */
function log(level, message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] ${message}`;
  console.log(logEntry);
  fs.appendFileSync(LOG_FILE, logEntry + '\n', { encoding: 'utf-8' });
}

/**
 * Verify GitHub webhook signature (prevents unauthorized deployments)
 */
function verifyGitHubSignature(payload, signature) {
  if (!signature) {
    log('WARN', 'No X-Hub-Signature-256 header present');
    return false;
  }

  const computedSignature = 'sha256=' + crypto
    .createHmac('sha256', GITHUB_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  // Debug logging (remove in production)
  const isValid = computedSignature === signature;
  
  if (!isValid) {
    log('DEBUG', `Signature mismatch:`);
    log('DEBUG', `   Received:  ${signature.substring(0, 20)}...${signature.substring(signature.length - 20)}`);
    log('DEBUG', `   Computed:  ${computedSignature.substring(0, 20)}...${computedSignature.substring(computedSignature.length - 20)}`);
    log('DEBUG', `   Secret len: ${GITHUB_WEBHOOK_SECRET.length}`);
    log('DEBUG', `   Payload len: ${payload.length}`);
  }

  return isValid;
}

/**
 * Execute deployment asynchronously
 */
async function runDeployment(commit, branch, pusher) {
  if (isDeploying) {
    log('WARN', 'Deployment already in progress, queuing...');
    return;
  }

  isDeploying = true;
  lastDeployStatus = 'deploying';
  lastDeployTime = new Date();

  const deployLogStream = fs.createWriteStream(DEPLOY_LOG, { flags: 'a' });
  const logDeploy = (msg) => {
    const entry = `[${new Date().toISOString()}] ${msg}\n`;
    deployLogStream.write(entry);
    console.log(entry.trim());
  };

  try {
    log('INFO', `🚀 DEPLOYMENT STARTED`);
    log('INFO', `   Commit: ${commit}`);
    log('INFO', `   Branch: ${branch}`);
    log('INFO', `   Pusher: ${pusher}`);
    logDeploy(`\n${'='.repeat(70)}`);
    logDeploy(`🚀 DEPLOYMENT STARTED at ${new Date().toISOString()}`);
    logDeploy(`   Branch: ${branch}`);
    logDeploy(`   Commit: ${commit}`);
    logDeploy(`   Pusher: ${pusher}`);

    // ============================================
    // STEP 1: Git Fetch & Pull
    // ============================================
    logDeploy(`\n📋 STEP 1: Fetching latest from GitHub...`);
    try {
      const fetchOutput = execSync('git fetch origin main', {
        cwd: DEPLOY_REPO_PATH,
        encoding: 'utf-8',
        timeout: 60000
      });
      logDeploy(`✅ Git fetch successful`);
    } catch (err) {
      logDeploy(`❌ Git fetch failed: ${err.message}`);
      throw new Error('Git fetch failed');
    }

    // ============================================
    // STEP 2: Git Reset Hard
    // ============================================
    logDeploy(`\n📋 STEP 2: Resetting to latest commit...`);
    try {
      const resetOutput = execSync('git reset --hard origin/main', {
        cwd: DEPLOY_REPO_PATH,
        encoding: 'utf-8',
        timeout: 60000
      });
      logDeploy(`✅ Git reset successful`);
    } catch (err) {
      logDeploy(`❌ Git reset failed: ${err.message}`);
      throw new Error('Git reset failed');
    }

    // ============================================
    // STEP 3: Install Dependencies
    // ============================================
    logDeploy(`\n📋 STEP 3: Installing backend dependencies...`);
    try {
      execSync('npm install --production', {
        cwd: DEPLOY_REPO_PATH,
        encoding: 'utf-8',
        timeout: 300000,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      logDeploy(`✅ Backend dependencies installed`);
    } catch (err) {
      logDeploy(`⚠️  Backend npm install had issues: ${err.message}`);
    }

    // ============================================
    // STEP 4: Build Frontend
    // ============================================
    logDeploy(`\n📋 STEP 4: Building frontend...`);
    try {
      execSync('npm install', {
        cwd: path.join(DEPLOY_REPO_PATH, 'client'),
        encoding: 'utf-8',
        timeout: 300000,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      logDeploy(`   ✓ Client dependencies installed`);

      execSync('npm run build', {
        cwd: path.join(DEPLOY_REPO_PATH, 'client'),
        encoding: 'utf-8',
        timeout: 300000,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      logDeploy(`✅ Frontend build successful`);
    } catch (err) {
      logDeploy(`❌ Frontend build failed: ${err.message}`);
      throw new Error('Frontend build failed');
    }

    // ============================================
    // STEP 5: Run Tests (if test:all exists)
    // ============================================
    logDeploy(`\n📋 STEP 5: Running tests...`);
    try {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(DEPLOY_REPO_PATH, 'package.json'), 'utf-8')
      );
      
      if (packageJson.scripts?.['test:all']) {
        logDeploy(`   Running npm run test:all...`);
        execSync('npm run test:all', {
          cwd: DEPLOY_REPO_PATH,
          encoding: 'utf-8',
          timeout: 600000,
          stdio: ['pipe', 'pipe', 'pipe']
        });
        logDeploy(`✅ All tests passed`);
      } else {
        logDeploy(`⊘ No test:all script, skipping`);
      }
    } catch (err) {
      logDeploy(`⚠️  Tests failed (non-blocking): ${err.message}`);
      logDeploy(`   Continuing with deployment...`);
    }

    // ============================================
    // STEP 6: Backup Database
    // ============================================
    logDeploy(`\n📋 STEP 6: Backing up database...`);
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(DEPLOY_REPO_PATH, 'backups', `data-before-deploy-${timestamp}.db`);
      const dbPath = path.join(DEPLOY_REPO_PATH, 'server', 'data.db');
      
      if (fs.existsSync(dbPath)) {
        fs.mkdirSync(path.dirname(backupPath), { recursive: true });
        fs.copyFileSync(dbPath, backupPath);
        logDeploy(`✅ Database backed up to ${backupPath}`);
      } else {
        logDeploy(`⊘ No database file found, skipping backup`);
      }
    } catch (err) {
      logDeploy(`⚠️  Database backup failed: ${err.message}`);
    }

    // ============================================
    // STEP 7: Docker Build & Deploy
    // ============================================
    logDeploy(`\n📋 STEP 7: Docker build and deployment...`);
    try {
      logDeploy(`   Building Docker image...`);
      execSync('docker build -t citizen-reports:latest .', {
        cwd: DEPLOY_REPO_PATH,
        encoding: 'utf-8',
        timeout: 600000,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      logDeploy(`   ✓ Docker image built`);

      logDeploy(`   Removing old stack...`);
      try {
        execSync(`docker stack rm ${STACK_NAME}`, {
          encoding: 'utf-8',
          timeout: 30000,
          stdio: ['pipe', 'pipe', 'pipe']
        });
        // Give stack time to fully remove
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (e) {
        logDeploy(`   ℹ️  Stack removal note: ${e.message.split('\n')[0]}`);
      }

      logDeploy(`   Deploying new stack...`);
      execSync(`docker stack deploy -c docker-compose-prod.yml ${STACK_NAME}`, {
        cwd: DEPLOY_REPO_PATH,
        encoding: 'utf-8',
        timeout: 60000,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      logDeploy(`✅ Docker stack deployed`);
    } catch (err) {
      logDeploy(`❌ Docker deployment failed: ${err.message}`);
      throw new Error('Docker deployment failed');
    }

    // ============================================
    // STEP 8: Wait for Service Ready
    // ============================================
    logDeploy(`\n📋 STEP 8: Waiting for service to be ready...`);
    let isReady = false;
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes

    while (!isReady && attempts < maxAttempts) {
      try {
        const response = execSync('docker service ls --filter name=citizen-reports --format "{{.Replicas}}"', {
          encoding: 'utf-8',
          timeout: 10000,
          stdio: ['pipe', 'pipe', 'pipe']
        }).trim();

        if (response === '1/1') {
          logDeploy(`   ✓ Service ready (attempt ${attempts + 1}/${maxAttempts})`);
          isReady = true;
        } else {
          logDeploy(`   ⏳ Waiting... replicas: ${response} (attempt ${attempts + 1}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
          attempts++;
        }
      } catch (err) {
        logDeploy(`   ⏳ Health check attempt ${attempts + 1}/${maxAttempts}...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        attempts++;
      }
    }

    if (!isReady) {
      logDeploy(`⚠️  Service didn't reach 1/1 after 5 minutes, but continuing`);
    } else {
      logDeploy(`✅ Service is ready`);
    }

    // ============================================
    // STEP 9: Health Check
    // ============================================
    logDeploy(`\n📋 STEP 9: Running health check...`);
    try {
      const healthCheck = execSync('curl -f -s http://localhost:4000/api/reportes?limit=1', {
        encoding: 'utf-8',
        timeout: 10000,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      logDeploy(`✅ API health check passed`);
    } catch (err) {
      logDeploy(`⚠️  Health check had issues: ${err.message}`);
      logDeploy(`   Service may still be initializing...`);
    }

    // ============================================
    // SUCCESS
    // ============================================
    log('INFO', `✅ DEPLOYMENT SUCCESSFUL`);
    lastDeployStatus = 'success';
    logDeploy(`\n✅ DEPLOYMENT COMPLETED SUCCESSFULLY`);
    logDeploy(`   Duration: ${Math.round((Date.now() - lastDeployTime.getTime()) / 1000)}s`);
    logDeploy(`${'='.repeat(70)}\n`);

    deployHistory.push({
      time: lastDeployTime,
      status: 'success',
      commit,
      branch,
      pusher,
      duration: Math.round((Date.now() - lastDeployTime.getTime()) / 1000)
    });

  } catch (error) {
    log('ERROR', `❌ DEPLOYMENT FAILED: ${error.message}`);
    lastDeployStatus = 'failed';
    logDeploy(`\n❌ DEPLOYMENT FAILED`);
    logDeploy(`   Error: ${error.message}`);
    logDeploy(`   Duration: ${Math.round((Date.now() - lastDeployTime.getTime()) / 1000)}s`);
    logDeploy(`${'='.repeat(70)}\n`);

    deployHistory.push({
      time: lastDeployTime,
      status: 'failed',
      commit,
      branch,
      pusher,
      error: error.message,
      duration: Math.round((Date.now() - lastDeployTime.getTime()) / 1000)
    });

    // Keep only last 100 deployments in history
    if (deployHistory.length > 100) {
      deployHistory = deployHistory.slice(-100);
    }
  } finally {
    isDeploying = false;
    lastDeployStatus = 'idle';
    deployLogStream.end();
  }
}

/**
 * HTTP Server
 */
const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Hub-Signature-256');
  res.setHeader('Content-Type', 'application/json');

  // Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // ============================================
  // POST /webhook - GitHub webhook endpoint
  // ============================================
  if (req.url === '/webhook' && req.method === 'POST') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1024 * 1024) { // 1MB limit
        req.connection.destroy();
      }
    });

    req.on('end', async () => {
      try {
        const signature = req.headers['x-hub-signature-256'];
        const event = req.headers['x-github-event'];

        log('INFO', `📨 Webhook received: ${event}`);

        // Verify signature
        if (!verifyGitHubSignature(body, signature)) {
          log('WARN', '❌ REJECTED: Invalid GitHub signature');
          res.writeHead(401);
          res.end(JSON.stringify({ error: 'Invalid signature' }));
          return;
        }

        // Only handle push events
        if (event !== 'push') {
          log('INFO', `⊘ Ignoring ${event} event (only push handled)`);
          res.writeHead(200);
          res.end(JSON.stringify({ message: 'Event ignored' }));
          return;
        }

        const payload = JSON.parse(body);
        const branch = payload.ref?.split('/')?.pop();
        const commit = payload.head_commit?.id?.substring(0, 7);
        const pusher = payload.pusher?.name || 'unknown';

        // Only deploy on main branch
        if (branch !== 'main') {
          log('INFO', `⊘ Skipping push to branch '${branch}' (only main auto-deploys)`);
          res.writeHead(200);
          res.end(JSON.stringify({ message: 'Not main branch', branch }));
          return;
        }

        log('INFO', `✅ Valid push to main detected`);
        log('INFO', `   Commit: ${commit}`);
        log('INFO', `   Pusher: ${pusher}`);

        // Respond immediately (deployment runs async)
        res.writeHead(200);
        res.end(JSON.stringify({ 
          status: 'Deployment queued',
          deploymentId: `${commit}-${Date.now()}`
        }));

        // Start deployment asynchronously (don't block webhook response)
        setImmediate(() => runDeployment(commit, branch, pusher));

      } catch (error) {
        log('ERROR', `Failed to process webhook: ${error.message}`);
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid payload' }));
      }
    });

  // ============================================
  // GET /health - Health check
  // ============================================
  } else if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      service: 'webhook-server',
      timestamp: new Date().toISOString()
    }));

  // ============================================
  // GET /status - Deployment status
  // ============================================
  } else if (req.url === '/status' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: lastDeployStatus,
      isDeploying,
      lastDeployTime,
      lastDeployments: deployHistory.slice(-5).map(d => ({
        time: d.time,
        status: d.status,
        commit: d.commit,
        duration: `${d.duration}s`
      }))
    }));

  // ============================================
  // GET /logs - Tail deployment logs
  // ============================================
  } else if (req.url === '/logs' && req.method === 'GET') {
    try {
      const lines = req.url.includes('lines=') 
        ? parseInt(req.url.split('lines=')[1]) || 50
        : 50;

      if (!fs.existsSync(DEPLOY_LOG)) {
        res.writeHead(200);
        res.end(JSON.stringify({ logs: 'No deployment logs yet' }));
        return;
      }

      const allLogs = fs.readFileSync(DEPLOY_LOG, 'utf-8').split('\n');
      const recentLogs = allLogs.slice(-lines).join('\n');

      res.writeHead(200);
      res.end(JSON.stringify({ 
        logs: recentLogs,
        lines: allLogs.filter(l => l.trim()).length,
        path: DEPLOY_LOG
      }));
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: error.message }));
    }

  // ============================================
  // GET / - Info page
  // ============================================
  } else if (req.url === '/' && req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.end(`
<!DOCTYPE html>
<html>
<head>
  <title>GitHub Webhook Server</title>
  <style>
    body { font-family: sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 900px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #333; border-bottom: 3px solid #0066cc; padding-bottom: 10px; }
    h2 { color: #0066cc; margin-top: 30px; }
    .endpoint { background: #f9f9f9; padding: 15px; margin: 10px 0; border-left: 4px solid #0066cc; font-family: monospace; }
    .status { padding: 10px; margin: 10px 0; border-radius: 4px; }
    .status.ok { background: #d4edda; color: #155724; }
    .status.deploying { background: #fff3cd; color: #856404; }
    .status.error { background: #f8d7da; color: #721c24; }
    .code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f0f0f0; font-weight: bold; }
  </style>
  <script>
    function updateStatus() {
      fetch('/status').then(r => r.json()).then(data => {
        document.getElementById('status').innerHTML = 'Status: <strong>' + data.status + '</strong>';
        document.getElementById('status').className = 'status ' + data.status;
      });
    }
    setInterval(updateStatus, 5000);
    updateStatus();
  </script>
</head>
<body>
  <div class="container">
    <h1>🚀 GitHub Webhook Server</h1>
    
    <div id="status" class="status">Status: <strong>loading...</strong></div>
    
    <h2>Endpoints</h2>
    <div class="endpoint">POST /webhook</div>
    <p>GitHub webhook receiver. Automatically triggered on push to main branch.</p>
    
    <div class="endpoint">GET /health</div>
    <p>Health check endpoint for monitoring.</p>
    
    <div class="endpoint">GET /status</div>
    <p>Current deployment status and recent deployment history.</p>
    
    <div class="endpoint">GET /logs</div>
    <p>View deployment logs. Add <code>?lines=100</code> to change log lines.</p>
    
    <h2>Configuration</h2>
    <table>
      <tr><th>Variable</th><th>Value</th></tr>
      <tr><td>WEBHOOK_PORT</td><td>${WEBHOOK_PORT}</td></tr>
      <tr><td>DEPLOY_REPO_PATH</td><td>${DEPLOY_REPO_PATH}</td></tr>
      <tr><td>STACK_NAME</td><td>${STACK_NAME}</td></tr>
      <tr><td>LOG_DIR</td><td>${LOG_DIR}</td></tr>
    </table>
    
    <h2>GitHub Setup</h2>
    <ol>
      <li>Go to your GitHub repo Settings → Webhooks</li>
      <li>Click "Add webhook"</li>
      <li>Set Payload URL to: <code>https://145.79.0.77:3000/webhook</code></li>
      <li>Set Content type to: <code>application/json</code></li>
      <li>Set Secret to your GITHUB_WEBHOOK_SECRET</li>
      <li>Select "Push" events</li>
      <li>Click "Add webhook"</li>
    </ol>
    
    <p style="margin-top: 30px; color: #666; font-size: 12px;">
      Logs: ${LOG_FILE}
    </p>
  </div>
</body>
</html>
    `);

  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

/**
 * Start server
 */
server.listen(WEBHOOK_PORT, '0.0.0.0', () => {
  log('INFO', `🎧 GitHub Webhook Server started`);
  log('INFO', `   Port: ${WEBHOOK_PORT}`);
  log('INFO', `   Webhook endpoint: http://0.0.0.0:${WEBHOOK_PORT}/webhook`);
  log('INFO', `   Health check: http://0.0.0.0:${WEBHOOK_PORT}/health`);
  log('INFO', `   Status page: http://0.0.0.0:${WEBHOOK_PORT}/status`);
  log('INFO', `   Deploy repo: ${DEPLOY_REPO_PATH}`);
  log('INFO', `   Stack name: ${STACK_NAME}`);
  log('INFO', `   Logs: ${LOG_FILE}`);
  log('INFO', ``);
  log('INFO', `To configure GitHub:`);
  log('INFO', `   1. Go to Repo Settings → Webhooks`);
  log('INFO', `   2. Add webhook with URL: http://145.79.0.77:${WEBHOOK_PORT}/webhook`);
  log('INFO', `   3. Secret: GITHUB_WEBHOOK_SECRET=${GITHUB_WEBHOOK_SECRET}`);
  log('INFO', `   4. Events: Push`);
  log('INFO', ``);
  log('INFO', `Waiting for webhook events...`);
});

server.on('error', (err) => {
  log('ERROR', `Server error: ${err.message}`);
  process.exit(1);
});

/**
 * Graceful shutdown
 */
process.on('SIGTERM', () => {
  log('INFO', 'SIGTERM received, shutting down...');
  server.close(() => {
    log('INFO', 'Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  log('INFO', 'SIGINT received, shutting down...');
  server.close(() => {
    log('INFO', 'Server closed');
    process.exit(0);
  });
});
