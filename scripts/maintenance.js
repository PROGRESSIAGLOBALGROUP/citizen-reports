#!/usr/bin/env node
/* eslint-disable no-console */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import zlib from 'zlib';
import { pipeline } from 'stream/promises';
import tar from 'tar';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { BlobServiceClient } from '@azure/storage-blob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fsp = fs.promises;

const DEFAULT_TILE_TEMPLATE = 'http://localhost:4000/tiles/{z}/{x}/{y}.png';
const REPO_ROOT = path.resolve(__dirname, '..'); // Will be updated after __dirname definition above
const ENV_METRICS_LABELS = [
  process.env.MAINTENANCE_METRICS_LABELS || '',
  process.env.MAINTENANCE_ENV ? `env=${process.env.MAINTENANCE_ENV}` : '',
  process.env.MAINTENANCE_REGION ? `region=${process.env.MAINTENANCE_REGION}` : '',
]
  .filter(Boolean)
  .join(',');

const DEFAULT_NOTIFY_CONTEXT = {
  environment: process.env.MAINTENANCE_ENV,
  region: process.env.MAINTENANCE_REGION,
  service: process.env.MAINTENANCE_SERVICE || 'maintenance',
};

function toCamelCase(key) {
  return key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function parseArgs(argv) {
  const args = {};
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      positional.push(token);
      continue;
    }

    const rawKey = token.slice(2);
    if (!rawKey) continue;
    if (rawKey === 'help') {
      args.help = true;
      continue;
    }
    if (rawKey.startsWith('no-')) {
      const camel = toCamelCase(rawKey.slice(3));
      args[camel] = false;
      continue;
    }
    const camelKey = toCamelCase(rawKey);
    const next = argv[i + 1];
    if (typeof next === 'undefined' || next.startsWith('--')) {
      args[camelKey] = true;
    } else {
      args[camelKey] = next;
      i += 1;
    }
  }
  if (positional.length > 0) {
    args._ = positional;
  }
  return args;
}

function printHelp() {
  console.log(`Maintenance orchestrator

Usage:
  node scripts/maintenance.js [--skip-backup] [--skip-smoke] [--template <url>] [--coords <z,x,y;...>]
                              [--timeout <ms>] [--retries <n>] [--delay <ms>] [--json] [--log <file>]
                              [--metrics-file <path>] [--metrics-url <url>] [--metrics-labels k=v,...]
                              [--retain-backups <count>] [--backup-dir <path>] [--compress-log [path]]
                              [--archive <file>] [--archive-notes <text>] [--upload <uri>]
                              [--notify-webhook <url>] [--notify-token <token>]
                              [--fail-fast] [--dry-run]

Examples:
  node scripts/maintenance.js
  node scripts/maintenance.js --skip-smoke
  npm run maintenance -- --template https://tile.example.com/{z}/{x}/{y}.png --coords 0,0,0:world

Options:
  --skip-backup     Omite el paso de respaldo SQLite.
  --skip-smoke      Omite el smoke-check de mosaicos.
  --template        Plantilla de URL para el smoke-check (default: ${DEFAULT_TILE_TEMPLATE}).
  --coords          Tuplas z,x,y[:label] separadas por ';' para mosaicos específicos.
  --timeout         Timeout por solicitud en milisegundos para el smoke-check.
  --retries         Reintentos para cada mosaico.
  --delay           Retraso en milisegundos entre probes.
  --json            Emite un resumen JSON además de la salida legible.
  --log <file>      Escribe un registro JSON línea a un archivo.
  --compress-log    Comprime (gzip) el archivo indicado en --log o la ruta proporcionada.
  --metrics-file    Escribe métricas en formato Prometheus (Node exporter textfile).
  --metrics-url     Envía métricas a un Pushgateway HTTP (PUT).
  --metrics-labels  Etiquetas extra para métricas (clave=valor, separadas por coma).
  --retain-backups  Conserva sólo N respaldos más recientes en BACKUP_DIR.
  --backup-dir      Directorio de respaldos (default: ./backups o BACKUP_DIR).
  --archive <file>  Genera un tar.gz con los artefactos (último respaldo, logs) para archivo frío.
  --archive-notes   Texto que se guarda como README dentro del archivo (metadata operativa).
  --upload <uri>    Sube el archivo tar.gz a s3://bucket/path o azblob://container/blob.
  --notify-webhook  Envía un POST JSON con el resumen a un webhook (Slack, Teams, etc.).
  --notify-token    Token Bearer opcional para el webhook (Authorization: Bearer <token>).
  --fail-fast       Detiene la ejecución en cuanto falle un paso.
  --dry-run         Muestra los pasos sin ejecutarlos.
`);
}

function parseLabels(raw = '') {
  if (!raw) return {};
  return raw
    .split(',')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .reduce((acc, token) => {
      const [key, value] = token.split('=');
      if (!key || typeof value === 'undefined') {
        throw new Error(`Etiqueta inválida: "${token}". Usa clave=valor.`);
      }
      acc[key.trim()] = value.trim();
      return acc;
    }, {});
}

function formatLabels(labels = {}) {
  const entries = Object.entries(labels).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return '';
  return '{' + entries.map(([k, v]) => `${k}="${String(v).replace(/"/g, '\\"')}"`).join(',') + '}';
}

function resolveMetricsLabels(options = {}) {
  const envLabels = parseLabels(ENV_METRICS_LABELS);
  const cliLabels = parseLabels(options.metricsLabels);
  return { ...envLabels, ...cliLabels };
}

function buildMetricsPayload(summary, results, baseLabels = {}) {
  const lines = [];
  lines.push('# HELP jantetelco_maintenance_status Final aggregated status (0=OK,1=DEGRADED,2=FAILED)');
  lines.push('# TYPE jantetelco_maintenance_status gauge');
  const statusValue = summary.exitCode;
  lines.push(`jantetelco_maintenance_status${formatLabels(baseLabels)} ${statusValue}`);

  lines.push('# HELP jantetelco_maintenance_counts_totals Step counts by status');
  lines.push('# TYPE jantetelco_maintenance_counts_totals gauge');
  Object.entries(summary.counts).forEach(([status, value]) => {
    if (status === 'total') return;
    lines.push(`jantetelco_maintenance_counts_totals${formatLabels({ ...baseLabels, status })} ${value}`);
  });

  lines.push('# HELP jantetelco_maintenance_step_duration_milliseconds Step duration');
  lines.push('# TYPE jantetelco_maintenance_step_duration_milliseconds gauge');
  results.forEach((step) => {
    lines.push(
      `jantetelco_maintenance_step_duration_milliseconds${formatLabels({ ...baseLabels, step: step.name, status: step.status })} ${step.durationMs}`
    );
  });

  return lines.join('\n') + '\n';
}

async function writeMetricsFile(filePath, payload) {
  const resolved = path.resolve(process.cwd(), filePath);
  await fsp.mkdir(path.dirname(resolved), { recursive: true });
  await fsp.writeFile(resolved, payload, 'utf8');
  return resolved;
}

async function pushMetrics(url, payload) {
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'text/plain' },
    body: payload,
  });
  if (!response.ok) {
    throw new Error(`Error al enviar métricas (${response.status} ${response.statusText})`);
  }
}

function buildNotificationPayload(summary, results, { labels = {}, context = {}, options = {} } = {}) {
  return {
    job: 'maintenance',
    status: summary.statusText,
    exitCode: summary.exitCode,
    counts: summary.counts,
    timestamp: new Date().toISOString(),
    labels,
    context,
    options: {
      skipBackup: options.skipBackup,
      skipSmoke: options.skipSmoke,
      failFast: options.failFast,
      archive: options.archive,
      metricsFile: options.metricsFile,
      metricsUrl: options.metricsUrl,
      retainBackups: options.retainBackups,
    },
    steps: results.map((step) => ({
      name: step.name,
      status: step.status,
      exitCode: step.exitCode,
      durationMs: step.durationMs,
      startedAt: step.startedAt,
      finishedAt: step.finishedAt,
      stdout: step.stdout,
      stderr: step.stderr,
    })),
  };
}

async function sendNotification(url, payload, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Error al enviar notificación (${response.status} ${response.statusText})`);
  }
}

function getBackupDir(options = {}) {
  if (options.backupDir) {
    return path.resolve(process.cwd(), options.backupDir);
  }
  if (process.env.BACKUP_DIR) {
    return path.resolve(process.cwd(), process.env.BACKUP_DIR);
  }
  return path.resolve(REPO_ROOT, 'backups');
}

async function pruneBackups(backupDir, retainCount) {
  if (!Number.isInteger(retainCount) || retainCount < 0) {
    throw new Error('retain-backups debe ser un entero >= 0');
  }
  if (retainCount === 0) return { pruned: 0, kept: 0 };
  let entries;
  try {
    entries = await fsp.readdir(backupDir);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { pruned: 0, kept: 0 };
    }
    throw err;
  }

  const fullEntries = await Promise.all(
    entries.map(async (name) => {
      const fullPath = path.join(backupDir, name);
      const stats = await fsp.stat(fullPath);
      return { name, fullPath, stats };
    })
  );

  const candidates = fullEntries
    .filter((entry) => entry.stats.isFile())
    .sort((a, b) => b.stats.mtimeMs - a.stats.mtimeMs);

  const toKeep = candidates.slice(0, retainCount);
  const toDelete = candidates.slice(retainCount);

  await Promise.all(toDelete.map((entry) => fsp.unlink(entry.fullPath)));
  return { pruned: toDelete.length, kept: toKeep.length };
}

async function compressLogFile(targetPath) {
  const resolved = path.resolve(process.cwd(), targetPath);
  await fsp.access(resolved);
  const gzPath = `${resolved}.gz`;
  await pipeline(fs.createReadStream(resolved), zlib.createGzip({ level: 9 }), fs.createWriteStream(gzPath));
  await fsp.truncate(resolved, 0);
  return gzPath;
}

async function getLatestBackupFile(backupDir) {
  let entries;
  try {
    entries = await fsp.readdir(backupDir);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
  if (entries.length === 0) return null;
  const files = await Promise.all(
    entries.map(async (name) => {
      const fullPath = path.join(backupDir, name);
      const stats = await fsp.stat(fullPath).catch(() => null);
      if (!stats || !stats.isFile()) return null;
      return { name, fullPath, stats };
    })
  );
  const existing = files.filter(Boolean).sort((a, b) => b.stats.mtimeMs - a.stats.mtimeMs);
  if (!existing.length) return null;
  return existing[0].fullPath;
}

async function createArchive(targetPath, sources = [], notes) {
  if ((!sources || sources.length === 0) && !notes) {
    return null;
  }
  const resolvedTarget = path.resolve(process.cwd(), targetPath);
  await fsp.mkdir(path.dirname(resolvedTarget), { recursive: true });
  const staging = await fsp.mkdtemp(path.join(os.tmpdir(), 'maintenance-archive-'));
  try {
    const relativeNames = [];
    if (notes) {
      const noteName = 'README.txt';
      await fsp.writeFile(path.join(staging, noteName), String(notes), 'utf8');
      relativeNames.push(noteName);
    }
    for (const source of sources) {
      if (!source || !source.path) continue;
      const sourcePath = path.resolve(process.cwd(), source.path);
      let stats;
      try {
        stats = await fsp.stat(sourcePath);
      } catch (err) {
        console.warn(`Archivo de archivo omitido: ${sourcePath} (${err.message})`);
        continue;
      }
      const targetName = source.rename || path.basename(sourcePath);
      const targetLocation = path.join(staging, targetName);
      if (stats.isDirectory()) {
        await fsp.cp(sourcePath, targetLocation, { recursive: true });
      } else {
        await fsp.copyFile(sourcePath, targetLocation);
      }
      relativeNames.push(targetName);
    }
    if (relativeNames.length === 0) {
      return null;
    }
    await tar.c({ gzip: true, file: resolvedTarget, cwd: staging }, relativeNames);
    return resolvedTarget;
  } finally {
    await fsp.rm(staging, { recursive: true, force: true });
  }
}

function parseUploadTarget(target) {
  if (!target) return null;
  if (typeof target !== 'string' || target.trim().length === 0) {
    throw new Error('upload requiere una URI válida.');
  }
  let url;
  try {
    url = new URL(target);
  } catch (err) {
    throw new Error(`URI de upload inválida: ${target}`);
  }
  if (!url.protocol || !url.hostname) {
    throw new Error(`URI de upload incompleta: ${target}`);
  }
  return url;
}

async function uploadArchiveS3(url, filePath, options = {}) {
  const bucket = url.hostname;
  const key = url.pathname.replace(/^\/+/, '');
  if (!bucket || !key) {
    throw new Error('URI S3 requiere bucket y objeto (s3://bucket/objeto).');
  }
  const region = options.s3Region || process.env.MAINTENANCE_S3_REGION || process.env.AWS_REGION;
  const storageClass = options.s3StorageClass || process.env.MAINTENANCE_S3_STORAGE_CLASS;
  const sse = options.s3Sse || process.env.MAINTENANCE_S3_SSE;
  const sseKmsKeyId = options.s3SseKmsKeyId || process.env.MAINTENANCE_S3_SSE_KMS_KEY_ID;

  const client = new S3Client({ region });
  const commandParams = {
    Bucket: bucket,
    Key: key,
    Body: fs.createReadStream(filePath),
    ContentType: 'application/gzip',
  };
  if (storageClass) {
    commandParams.StorageClass = storageClass;
  }
  if (sse) {
    commandParams.ServerSideEncryption = sse;
    if (sse === 'aws:kms' && sseKmsKeyId) {
      commandParams.SSEKMSKeyId = sseKmsKeyId;
    }
  }

  await client.send(new PutObjectCommand(commandParams));
  return { provider: 's3', bucket, key, region };
}

async function uploadArchiveAzure(url, filePath, options = {}) {
  const container = url.hostname;
  const blob = url.pathname.replace(/^\/+/, '');
  if (!container || !blob) {
    throw new Error('URI azblob requiere contenedor y blob (azblob://container/path).');
  }
  const connectionString =
    options.azureConnectionString ||
    process.env.MAINTENANCE_AZURE_BLOB_CONNECTION ||
    process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('Se requiere MAINTENANCE_AZURE_BLOB_CONNECTION o AZURE_STORAGE_CONNECTION_STRING para subir a azblob.');
  }

  const serviceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = serviceClient.getContainerClient(container);
  if (options.azureEnsureContainer || process.env.MAINTENANCE_AZURE_BLOB_ENSURE_CONTAINER === 'true') {
    await containerClient.createIfNotExists();
  }
  const blockBlobClient = containerClient.getBlockBlobClient(blob);
  await blockBlobClient.uploadFile(filePath, {
    blobHTTPHeaders: {
      blobContentType: 'application/gzip',
    },
  });
  return { provider: 'azblob', container, blob };
}

async function uploadArchive(target, filePath, options = {}) {
  if (!target) return null;
  const url = parseUploadTarget(target);
  switch (url.protocol) {
    case 's3:':
      return uploadArchiveS3(url, filePath, options);
    case 'azblob:':
      return uploadArchiveAzure(url, filePath, options);
    default:
      throw new Error(`Protocolo de upload no soportado: ${url.protocol}`);
  }
}

function buildSteps(options = {}) {
  const steps = [];
  const backupScript = path.join(__dirname, 'backup-db.js');
  const smokeScript = path.join(__dirname, 'tile-smoke.js');

  if (!options.skipBackup) {
    steps.push({
      name: 'backup-db',
      command: process.execPath,
      args: [backupScript],
      cwd: REPO_ROOT,
      degradedExitCodes: [],
    });
  }

  if (!options.skipSmoke) {
    const args = [smokeScript];
    const template = options.template || options._?.[0] || DEFAULT_TILE_TEMPLATE;
    if (template) {
      args.push(template);
    }
    if (options.coords) {
      args.push('--coords', options.coords);
    }
    if (options.timeout) {
      args.push('--timeout', String(options.timeout));
    }
    if (options.retries) {
      args.push('--retries', String(options.retries));
    }
    if (options.delay) {
      args.push('--delay', String(options.delay));
    }
    if (options.jsonSmoke) {
      args.push('--json');
    }
    steps.push({
      name: 'tile-smoke',
      command: process.execPath,
      args,
      cwd: REPO_ROOT,
      degradedExitCodes: [1],
    });
  }

  return steps;
}

function determineStatus(exitCode, degradedExitCodes = []) {
  if (exitCode === 0) return 'ok';
  if (degradedExitCodes.includes(exitCode)) return 'degraded';
  return 'failed';
}

function spawnStep(step) {
  return new Promise((resolve, reject) => {
    const child = spawn(step.command, step.args, {
      cwd: step.cwd || REPO_ROOT,
      env: { ...process.env, ...(step.env || {}) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    if (child.stdout) {
      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });
    }
    if (child.stderr) {
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on('error', (err) => reject(err));
    child.on('close', (code) => {
      resolve({
        exitCode: typeof code === 'number' ? code : 0,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      });
    });
  });
}

async function executeSteps(steps, options = {}, runner = spawnStep) {
  const results = [];
  for (const step of steps) {
    const startedAt = new Date();
    let outcome;
    try {
      outcome = await runner(step, options);
    } catch (error) {
      outcome = {
        exitCode: step.failureExitCode || 2,
        stdout: '',
        stderr: error.message,
        error,
      };
    }
    const finishedAt = new Date();
    const status = determineStatus(outcome.exitCode, step.degradedExitCodes);
    const result = {
      name: step.name,
      command: `${step.command} ${step.args.join(' ')}`.trim(),
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      exitCode: outcome.exitCode,
      status,
      stdout: outcome.stdout,
      stderr: outcome.stderr,
      error: outcome.error ? outcome.error.message : undefined,
    };
    results.push(result);
    if (status === 'failed' && options.failFast) {
      break;
    }
  }
  return results;
}

function summarize(results) {
  const counts = {
    total: results.length,
    ok: results.filter((r) => r.status === 'ok').length,
    degraded: results.filter((r) => r.status === 'degraded').length,
    failed: results.filter((r) => r.status === 'failed').length,
  };
  let exitCode = 0;
  let statusText = 'OK';
  if (counts.failed > 0) {
    exitCode = 2;
    statusText = 'FAILED';
  } else if (counts.degraded > 0) {
    exitCode = 1;
    statusText = 'DEGRADED';
  }
  return { counts, exitCode, statusText };
}

function logHuman(results, summary) {
  console.log('=== Maintenance Summary ===');
  results.forEach((step) => {
    console.log(`• ${step.name} -> ${step.status.toUpperCase()} (exit ${step.exitCode}, ${step.durationMs} ms)`);
    if (step.stdout) {
      console.log(`  stdout: ${step.stdout}`);
    }
    if (step.stderr) {
      console.log(`  stderr: ${step.stderr}`);
    }
  });
  console.log('---------------------------');
  console.log(`Status: ${summary.statusText}`);
  console.log(`OK: ${summary.counts.ok} | Degraded: ${summary.counts.degraded} | Failed: ${summary.counts.failed}`);
}

async function main() {
  const rawArgs = parseArgs(process.argv.slice(2));
  if (rawArgs.help) {
    printHelp();
    return 0;
  }

  const options = {
    ...rawArgs,
    skipBackup: rawArgs.skipBackup === true,
    skipSmoke: rawArgs.skipSmoke === true,
    failFast: rawArgs.failFast === true,
    jsonSmoke: rawArgs.jsonSmoke === true,
  };

  if (!options.metricsFile && process.env.MAINTENANCE_METRICS_FILE) {
    options.metricsFile = process.env.MAINTENANCE_METRICS_FILE;
  }
  if (!options.metricsUrl && process.env.MAINTENANCE_METRICS_URL) {
    options.metricsUrl = process.env.MAINTENANCE_METRICS_URL;
  }
  if (!options.metricsLabels && ENV_METRICS_LABELS) {
    options.metricsLabels = ENV_METRICS_LABELS;
  }
  if (!options.backupDir && process.env.MAINTENANCE_BACKUP_DIR) {
    options.backupDir = process.env.MAINTENANCE_BACKUP_DIR;
  }
  if (!options.archive && process.env.MAINTENANCE_ARCHIVE_PATH) {
    options.archive = process.env.MAINTENANCE_ARCHIVE_PATH;
  }
  if (!options.archiveNotes && process.env.MAINTENANCE_ARCHIVE_NOTES) {
    options.archiveNotes = process.env.MAINTENANCE_ARCHIVE_NOTES;
  }
  if (!options.upload && process.env.MAINTENANCE_ARCHIVE_UPLOAD) {
    options.upload = process.env.MAINTENANCE_ARCHIVE_UPLOAD;
  }
  if (!options.notifyWebhook && process.env.MAINTENANCE_NOTIFY_WEBHOOK) {
    options.notifyWebhook = process.env.MAINTENANCE_NOTIFY_WEBHOOK;
  }
  if (!options.notifyToken && process.env.MAINTENANCE_NOTIFY_TOKEN) {
    options.notifyToken = process.env.MAINTENANCE_NOTIFY_TOKEN;
  }

  if (options.retainBackups === true) {
    throw new Error('--retain-backups requiere un número.');
  }
  if (options.metricsFile === true) {
    throw new Error('--metrics-file requiere una ruta.');
  }
  if (options.metricsUrl === true) {
    throw new Error('--metrics-url requiere una URL.');
  }
  if (options.archive === true) {
    throw new Error('--archive requiere una ruta.');
  }
  if (options.archiveNotes === true) {
    throw new Error('--archive-notes requiere texto.');
  }
  if (options.upload === true) {
    throw new Error('--upload requiere una URI.');
  }
  if (options.notifyWebhook === true) {
    throw new Error('--notify-webhook requiere una URL.');
  }
  if (options.notifyToken === true) {
    throw new Error('--notify-token requiere un valor.');
  }

  if (options.retainBackups !== undefined && options.retainBackups !== null) {
    options.retainBackups = Number(options.retainBackups);
  }
  if (Number.isNaN(options.retainBackups)) {
    throw new Error('retain-backups debe ser un número.');
  }

  const backupDir = getBackupDir(options);

  let metricsLabels = {};
  try {
    metricsLabels = resolveMetricsLabels(options);
  } catch (err) {
    console.error('Error al interpretar métricas:', err.message);
    return 2;
  }

  const steps = buildSteps(options);
  if (steps.length === 0) {
    console.log('No hay pasos que ejecutar. Usa --help para ver opciones.');
    return 0;
  }

  if (options.dryRun) {
    console.log('=== Dry run ===');
    steps.forEach((step) => {
      console.log(`${step.name}: ${step.command} ${step.args.join(' ')}`);
    });
    return 0;
  }

  const results = await executeSteps(steps, options);
  const summary = summarize(results);

  logHuman(results, summary);

  if (options.json || options.log) {
    const payload = {
      timestamp: new Date().toISOString(),
      options: {
        skipBackup: options.skipBackup,
        skipSmoke: options.skipSmoke,
        failFast: options.failFast,
      },
      results,
      summary,
    };
    if (options.json) {
      console.log(JSON.stringify(payload, null, 2));
    }
    if (options.log) {
      const logPath = path.resolve(process.cwd(), options.log);
      fs.appendFileSync(logPath, JSON.stringify(payload) + '\n', { encoding: 'utf8' });
    }
  }

  if (options.metricsFile || options.metricsUrl) {
    const payload = buildMetricsPayload(summary, results, metricsLabels);
    if (options.metricsFile) {
      await writeMetricsFile(options.metricsFile, payload);
    }
    if (options.metricsUrl) {
      await pushMetrics(options.metricsUrl, payload);
    }
  }

  if (options.retainBackups && options.retainBackups > 0) {
    await pruneBackups(backupDir, options.retainBackups);
  }

  let archiveLogPath = options.log ? path.resolve(process.cwd(), options.log) : null;
  if (options.compressLog) {
    let target = options.log;
    if (typeof options.compressLog === 'string' && options.compressLog !== 'true') {
      target = options.compressLog;
    }
    if (target) {
      archiveLogPath = await compressLogFile(target);
    } else {
      console.warn('compress-log requiere --log o una ruta explícita.');
    }
  }

  let latestBackupPath = null;
  if (!options.skipBackup) {
    latestBackupPath = await getLatestBackupFile(backupDir);
  }

  let archivePathResult = null;
  if (options.archive) {
    const sources = [];
    if (latestBackupPath && fs.existsSync(latestBackupPath)) {
      sources.push({ path: latestBackupPath });
    }
    if (archiveLogPath && fs.existsSync(archiveLogPath)) {
      sources.push({ path: archiveLogPath });
    }
    const defaultNotes = `Archivo generado el ${new Date().toISOString()} con estado ${summary.statusText}.`;
    archivePathResult = await createArchive(options.archive, sources, options.archiveNotes || defaultNotes);
  } else if (options.upload) {
    console.warn('Se ignorará --upload porque no se generó --archive.');
  }

  if (options.upload && archivePathResult) {
    try {
      const uploadInfo = await uploadArchive(options.upload, archivePathResult, options);
      console.log(`Archivo subido (${uploadInfo.provider}) -> ${options.upload}`);
    } catch (err) {
      console.error(`Error al subir archivo: ${err.message}`);
      return 2;
    }
  }

  if (options.notifyWebhook) {
    const notificationContext = {
      ...DEFAULT_NOTIFY_CONTEXT,
      archivePath: archivePathResult,
      logPath: archiveLogPath,
      uploadTarget: options.upload,
    };
    const notificationPayload = buildNotificationPayload(summary, results, {
      labels: metricsLabels,
      context: notificationContext,
      options,
    });
    try {
      await sendNotification(options.notifyWebhook, notificationPayload, options.notifyToken);
      console.log(`Notificación enviada a ${options.notifyWebhook}`);
    } catch (err) {
      console.error(`Error al enviar notificación: ${err.message}`);
    }
  }

  return summary.exitCode;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error('Error en mantenimiento:', err.message);
      process.exit(2);
    });
}

export {
  DEFAULT_TILE_TEMPLATE,
  parseArgs,
  buildSteps,
  executeSteps,
  summarize,
  determineStatus,
  spawnStep,
  main,
  parseLabels,
  resolveMetricsLabels,
  buildMetricsPayload,
  writeMetricsFile,
  pushMetrics,
  buildNotificationPayload,
  sendNotification,
  getBackupDir,
  pruneBackups,
  compressLogFile,
  getLatestBackupFile,
  createArchive,
  parseUploadTarget,
  uploadArchive,
};
