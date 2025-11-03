import express from 'express';
import crypto from 'crypto';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// GitHub Webhook Secret (set via environment variable)
const GITHUB_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'your-secret-here';
const PROJECT_PATH = '/home/jantetelco/jantetelco';
const LOG_FILE = path.join(PROJECT_PATH, 'logs', 'deploy.log');

// Ensure logs directory exists
const logsDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Log deployment events
 */
function logDeploy(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  console.log(logEntry);
  fs.appendFileSync(LOG_FILE, logEntry);
}

/**
 * Verify GitHub webhook signature
 */
function verifyGitHubSignature(req, secret) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) {
    return false;
  }

  const payload = JSON.stringify(req.body);
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  const expected = `sha256=${hash}`;

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected),
  );
}

/**
 * POST /api/github-webhook
 * Triggered by GitHub on push to main branch
 */
router.post('/github-webhook', express.json(), (req, res) => {
  try {
    // Verify signature
    if (!verifyGitHubSignature(req, GITHUB_SECRET)) {
      logDeploy('❌ REJECTED: Invalid GitHub signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Check if this is a push event
    if (req.headers['x-github-event'] !== 'push') {
      return res.status(200).json({ message: 'Not a push event' });
    }

    // Check if it's to main branch
    const branch = req.body.ref?.split('/')?.pop();
    if (branch !== 'main') {
      logDeploy(`⏭️ SKIPPED: Push to branch '${branch}' (not main)`);
      return res.status(200).json({ message: 'Not main branch' });
    }

    logDeploy(`🚀 DEPLOYMENT TRIGGERED: ${req.body.head_commit?.message}`);

    // Acknowledge receipt immediately (deploy runs async)
    res.json({ status: 'Deployment queued' });

    // Run deploy script asynchronously
    deployAsync();
  } catch (error) {
    logDeploy(`❌ ERROR: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Async deployment process
 */
async function deployAsync() {
  try {
    logDeploy('📋 Step 1: Fetching latest from GitHub...');
    execSync('git fetch origin main', {
      cwd: PROJECT_PATH,
      stdio: 'inherit',
    });

    logDeploy('📋 Step 2: Resetting to latest commit...');
    execSync('git reset --hard origin/main', {
      cwd: PROJECT_PATH,
      stdio: 'inherit',
    });

    logDeploy('📋 Step 3: Installing dependencies...');
    execSync('npm install --production', {
      cwd: PROJECT_PATH,
      stdio: 'inherit',
    });

    logDeploy('📋 Step 4: Building frontend...');
    execSync('cd client && npm run build', {
      cwd: PROJECT_PATH,
      shell: true,
      stdio: 'inherit',
    });

    logDeploy('📋 Step 5: Restarting server...');
    // Kill existing process on port 4000
    try {
      execSync('lsof -i :4000 | grep LISTEN | awk "{print $2}" | xargs kill -9', {
        shell: true,
      });
      execSync('sleep 1'); // Give process time to die
    } catch (e) {
      logDeploy('⚠️  No process on port 4000 to kill');
    }

    // Start new server (detached)
    execSync('nohup node server/server.js > logs/server.log 2>&1 &', {
      cwd: PROJECT_PATH,
      shell: true,
    });

    logDeploy('✅ DEPLOYMENT SUCCESSFUL');
  } catch (error) {
    logDeploy(`❌ DEPLOYMENT FAILED: ${error.message}`);
    logDeploy('⚠️  Attempting rollback...');
    try {
      execSync('git reset --hard HEAD~1', {
        cwd: PROJECT_PATH,
      });
      logDeploy('✅ Rollback successful');
    } catch (rollbackError) {
      logDeploy(`❌ Rollback FAILED: ${rollbackError.message}`);
    }
  }
}

/**
 * GET /api/health
 * Simple health check
 */
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

/**
 * GET /api/deploy/logs
 * View recent deployment logs (last 50 lines)
 */
router.get('/deploy/logs', (req, res) => {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return res.json({ logs: 'No deployment logs yet' });
    }

    const logs = fs
      .readFileSync(LOG_FILE, 'utf-8')
      .split('\n')
      .slice(-50)
      .join('\n');

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
