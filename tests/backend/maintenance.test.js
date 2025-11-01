const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const tar = require('tar');

jest.mock('@aws-sdk/client-s3', () => {
  const sendMock = jest.fn().mockResolvedValue({});
  const S3Client = jest.fn(() => ({ send: sendMock }));
  const PutObjectCommand = jest.fn((input) => input);
  return { S3Client, PutObjectCommand, __esModule: true, __mocks: { sendMock, S3Client, PutObjectCommand } };
});

jest.mock('@azure/storage-blob', () => {
  const uploadFileMock = jest.fn().mockResolvedValue({});
  const createIfNotExistsMock = jest.fn().mockResolvedValue({});
  const getBlockBlobClient = jest.fn(() => ({ uploadFile: uploadFileMock }));
  const getContainerClient = jest.fn(() => ({
    createIfNotExists: createIfNotExistsMock,
    getBlockBlobClient,
  }));
  const fromConnectionString = jest.fn(() => ({ getContainerClient }));
  return {
    BlobServiceClient: { fromConnectionString },
    __esModule: true,
    __mocks: { uploadFileMock, createIfNotExistsMock, getBlockBlobClient, getContainerClient, fromConnectionString },
  };
});

const ORIGINAL_ENV = {
  MAINTENANCE_METRICS_LABELS: process.env.MAINTENANCE_METRICS_LABELS,
  MAINTENANCE_ENV: process.env.MAINTENANCE_ENV,
  MAINTENANCE_REGION: process.env.MAINTENANCE_REGION,
  MAINTENANCE_ARCHIVE_UPLOAD: process.env.MAINTENANCE_ARCHIVE_UPLOAD,
  MAINTENANCE_AZURE_BLOB_CONNECTION: process.env.MAINTENANCE_AZURE_BLOB_CONNECTION,
  MAINTENANCE_AZURE_BLOB_ENSURE_CONTAINER: process.env.MAINTENANCE_AZURE_BLOB_ENSURE_CONTAINER,
  MAINTENANCE_S3_REGION: process.env.MAINTENANCE_S3_REGION,
  MAINTENANCE_S3_STORAGE_CLASS: process.env.MAINTENANCE_S3_STORAGE_CLASS,
  MAINTENANCE_S3_SSE: process.env.MAINTENANCE_S3_SSE,
  MAINTENANCE_S3_SSE_KMS_KEY_ID: process.env.MAINTENANCE_S3_SSE_KMS_KEY_ID,
};

process.env.MAINTENANCE_METRICS_LABELS = 'env=default,region=central';
process.env.MAINTENANCE_ENV = 'default';
process.env.MAINTENANCE_REGION = 'central';

const {
  parseArgs,
  buildSteps,
  executeSteps,
  summarize,
  determineStatus,
  parseLabels,
  resolveMetricsLabels,
  buildMetricsPayload,
  writeMetricsFile,
  buildNotificationPayload,
  sendNotification,
  pruneBackups,
  compressLogFile,
  getLatestBackupFile,
  createArchive,
  parseUploadTarget,
  uploadArchive,
  DEFAULT_TILE_TEMPLATE,
} = require('../../scripts/maintenance.js');

afterAll(() => {
  Object.entries(ORIGINAL_ENV).forEach(([key, value]) => {
    if (typeof value === 'undefined') {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  });
});

describe('maintenance orchestrator utilities', () => {
  test('parseArgs captures flags and positional params', () => {
    const args = parseArgs([
      '--skip-backup',
      '--timeout',
      '5000',
      '--metrics-labels',
      'env=ci,region=mx',
      'https://tiles/{z}/{x}/{y}.png',
    ]);
    expect(args.skipBackup).toBe(true);
    expect(args.timeout).toBe('5000');
    expect(args._).toEqual(['https://tiles/{z}/{x}/{y}.png']);
    expect(args.metricsLabels).toBe('env=ci,region=mx');
  });

  test('buildSteps includes both tasks by default', () => {
    const steps = buildSteps({});
    expect(steps).toHaveLength(2);
    expect(steps[0].name).toBe('backup-db');
    expect(steps[1].name).toBe('tile-smoke');
    expect(steps[1].args[1]).toBe(DEFAULT_TILE_TEMPLATE);
  });

  test('buildSteps respects skip flags and template override', () => {
    const template = 'https://tile.example/{z}/{x}/{y}.png';
    const steps = buildSteps({ skipBackup: true, template });
    expect(steps).toHaveLength(1);
    expect(steps[0].name).toBe('tile-smoke');
    expect(steps[0].args[1]).toBe(template);
  });

  test('determineStatus returns degraded when exit code matches list', () => {
    expect(determineStatus(1, [1])).toBe('degraded');
    expect(determineStatus(0, [1])).toBe('ok');
    expect(determineStatus(2, [1])).toBe('failed');
  });

  test('executeSteps aggregates statuses and honors fail-fast', async () => {
    const steps = [
      { name: 'backup-db', command: 'node', args: ['backup-db.js'], degradedExitCodes: [] },
      { name: 'tile-smoke', command: 'node', args: ['tile-smoke.js'], degradedExitCodes: [1] },
      { name: 'post-check', command: 'node', args: ['noop.js'], degradedExitCodes: [] },
    ];

    const runner = jest
      .fn()
      .mockResolvedValueOnce({ exitCode: 0, stdout: 'backup ok', stderr: '' })
      .mockResolvedValueOnce({ exitCode: 1, stdout: 'fallback hit', stderr: '' })
      .mockResolvedValue({ exitCode: 2, stdout: '', stderr: 'boom' });

    const results = await executeSteps(steps, { failFast: true }, runner);

    expect(results).toHaveLength(3);
    expect(results[0].status).toBe('ok');
    expect(results[0].stdout).toBe('backup ok');
    expect(results[1].status).toBe('degraded');
    expect(results[1].stdout).toBe('fallback hit');
    expect(results[2].status).toBe('failed');
    expect(results[2].stderr).toBe('boom');
    expect(runner).toHaveBeenCalledTimes(3);
  });

  test('summarize computes counts and exit code', () => {
    const summary = summarize([
      { status: 'ok' },
      { status: 'degraded' },
      { status: 'failed' },
    ]);
    expect(summary.counts).toMatchObject({ ok: 1, degraded: 1, failed: 1 });
    expect(summary.exitCode).toBe(2);
    expect(summary.statusText).toBe('FAILED');
  });

  test('parseLabels converts comma-separated values into an object', () => {
    expect(parseLabels('env=prod,region=mx')).toEqual({ env: 'prod', region: 'mx' });
  });

  test('resolveMetricsLabels merges env defaults with CLI overrides', () => {
    const labels = resolveMetricsLabels({ metricsLabels: 'env=prod,region=norte,service=maintenance' });
    expect(labels).toMatchObject({ env: 'prod', region: 'norte', service: 'maintenance' });
  });

  test('buildMetricsPayload emits Prometheus text format', () => {
    const summary = { exitCode: 1, counts: { total: 2, ok: 1, degraded: 1, failed: 0 } };
    const payload = buildMetricsPayload(summary, [{ name: 'backup-db', durationMs: 100, status: 'ok' }], {
      env: 'prod',
    });
    expect(payload).toContain('jantetelco_maintenance_status{env="prod"} 1');
    expect(payload).toContain('jantetelco_maintenance_counts_totals{env="prod",status="ok"} 1');
    expect(payload).toContain(
      'jantetelco_maintenance_step_duration_milliseconds{env="prod",step="backup-db",status="ok"} 100'
    );
  });

  test('writeMetricsFile writes payload to disk', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'maintenance-metrics-'));
    const filePath = path.join(tmpDir, 'metrics.prom');
    await writeMetricsFile(filePath, 'metric 1\n');
    const contents = fs.readFileSync(filePath, 'utf8');
    expect(contents).toBe('metric 1\n');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('pruneBackups deletes old files and keeps newest ones', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'maintenance-backups-'));
    const files = ['a.db', 'b.db', 'c.db'];
    files.forEach((name, idx) => {
      const fullPath = path.join(tmpDir, name);
      fs.writeFileSync(fullPath, `${name}`);
      const mtime = new Date(Date.now() - idx * 1000);
      fs.utimesSync(fullPath, mtime, mtime);
    });

    const result = await pruneBackups(tmpDir, 2);
    const remaining = fs.readdirSync(tmpDir);

    expect(result.pruned).toBe(1);
    expect(remaining.length).toBe(2);
    expect(remaining).toContain('a.db');
    expect(remaining).toContain('b.db');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('compressLogFile gzips target and truncates original', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'maintenance-logs-'));
    const logPath = path.join(tmpDir, 'maintenance.log');
    fs.writeFileSync(logPath, 'line1\nline2\n');

    const gzPath = await compressLogFile(logPath);
    const gzBuffer = fs.readFileSync(gzPath);
    const decompressed = zlib.gunzipSync(gzBuffer).toString('utf8');
    const originalSize = fs.statSync(logPath).size;

    expect(decompressed).toBe('line1\nline2\n');
    expect(originalSize).toBe(0);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('getLatestBackupFile returns most recent backup path', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'maintenance-latest-'));
    const older = path.join(tmpDir, 'old.db');
    const newer = path.join(tmpDir, 'new.db');
    fs.writeFileSync(older, 'old');
    await new Promise((resolve) => setTimeout(resolve, 10));
    fs.writeFileSync(newer, 'new');

    const latest = await getLatestBackupFile(tmpDir);
    expect(latest).toBe(newer);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('createArchive bundles sources and notes', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'maintenance-archive-'));
    const fileA = path.join(tmpDir, 'a.txt');
    const fileB = path.join(tmpDir, 'nested', 'b.txt');
    fs.mkdirSync(path.dirname(fileB), { recursive: true });
    fs.writeFileSync(fileA, 'A');
    fs.writeFileSync(fileB, 'B');

    const archivePath = path.join(tmpDir, 'out.tgz');
    await createArchive(archivePath, [{ path: fileA }, { path: path.dirname(fileB) }], 'Notas');

    const entries = [];
    await tar.t({ file: archivePath, onentry: (entry) => entries.push(entry.path) });
    expect(entries).toEqual(expect.arrayContaining(['a.txt', 'nested/b.txt', 'README.txt']));

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('parseUploadTarget valida URI correcta', () => {
    const url = parseUploadTarget('s3://backup-bucket/path/to/archive.tgz');
    expect(url.protocol).toBe('s3:');
    expect(url.hostname).toBe('backup-bucket');
    expect(url.pathname).toBe('/path/to/archive.tgz');
  expect(() => parseUploadTarget('not-a-uri')).toThrow(/URI de upload inválida/);
  });

  test('uploadArchive envía archivo a S3', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'maintenance-upload-s3-'));
    const archivePath = path.join(tmpDir, 'archive.tgz');
    fs.writeFileSync(archivePath, 'data');

    const s3Module = require('@aws-sdk/client-s3');
    s3Module.__mocks.sendMock.mockClear();
    s3Module.PutObjectCommand.mockClear();
    s3Module.S3Client.mockClear();

    const result = await uploadArchive('s3://my-bucket/backups/archive.tgz', archivePath, {
      s3StorageClass: 'STANDARD_IA',
      s3Sse: 'aes256',
    });

    expect(result).toMatchObject({ provider: 's3', bucket: 'my-bucket', key: 'backups/archive.tgz' });
    expect(s3Module.S3Client).toHaveBeenCalled();
    expect(s3Module.PutObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Bucket: 'my-bucket',
        Key: 'backups/archive.tgz',
        StorageClass: 'STANDARD_IA',
        ServerSideEncryption: 'aes256',
      })
    );
    expect(s3Module.__mocks.sendMock).toHaveBeenCalled();

    const putCallArgs = s3Module.PutObjectCommand.mock.calls[0][0];
    if (putCallArgs.Body && typeof putCallArgs.Body.destroy === 'function') {
      putCallArgs.Body.destroy();
    }

    await new Promise((resolve) => setImmediate(resolve));

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('uploadArchive envía archivo a Azure Blob Storage', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'maintenance-upload-az-'));
    const archivePath = path.join(tmpDir, 'archive.tgz');
    fs.writeFileSync(archivePath, 'data');

    const azureModule = require('@azure/storage-blob');
    const { __mocks: azureMocks } = azureModule;
    azureMocks.uploadFileMock.mockClear();
    azureMocks.createIfNotExistsMock.mockClear();
  azureMocks.getContainerClient.mockClear();
  azureMocks.getBlockBlobClient.mockClear();
    process.env.MAINTENANCE_AZURE_BLOB_CONNECTION = 'UseDevelopmentStorage=true';
    process.env.MAINTENANCE_AZURE_BLOB_ENSURE_CONTAINER = 'true';

    const result = await uploadArchive('azblob://backups/2025/archive.tgz', archivePath, {});

    expect(result).toMatchObject({ provider: 'azblob', container: 'backups', blob: '2025/archive.tgz' });
    expect(azureModule.BlobServiceClient.fromConnectionString).toHaveBeenCalledWith('UseDevelopmentStorage=true');
    expect(azureMocks.getContainerClient).toHaveBeenCalledWith('backups');
    expect(azureMocks.getBlockBlobClient).toHaveBeenCalledWith('2025/archive.tgz');
    expect(azureMocks.createIfNotExistsMock).toHaveBeenCalled();
    expect(azureMocks.uploadFileMock).toHaveBeenCalledWith(archivePath, expect.any(Object));

    fs.rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.MAINTENANCE_AZURE_BLOB_CONNECTION;
    delete process.env.MAINTENANCE_AZURE_BLOB_ENSURE_CONTAINER;
  });

  test('buildNotificationPayload compone resumen y pasos', () => {
    const summary = { statusText: 'OK', exitCode: 0, counts: { total: 2, ok: 2, degraded: 0, failed: 0 } };
    const now = new Date().toISOString();
    const results = [
      {
        name: 'backup-db',
        status: 'ok',
        exitCode: 0,
        durationMs: 1200,
        startedAt: now,
        finishedAt: now,
        stdout: 'done',
        stderr: '',
      },
    ];
    const payload = buildNotificationPayload(summary, results, {
      labels: { env: 'prod' },
      context: { region: 'norte' },
      options: { skipBackup: false, archive: './archives/latest.tgz' },
    });

    expect(payload.status).toBe('OK');
    expect(payload.labels).toMatchObject({ env: 'prod' });
    expect(payload.context).toMatchObject({ region: 'norte' });
    expect(payload.steps).toHaveLength(1);
    expect(payload.options.archive).toBe('./archives/latest.tgz');
  });

  test('sendNotification envía POST con token Bearer', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    const originalFetch = global.fetch;
    global.fetch = fetchMock;

    await sendNotification('https://hooks.example.com/path', { status: 'OK' }, 'secrettoken');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://hooks.example.com/path',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer secrettoken',
        }),
        body: JSON.stringify({ status: 'OK' }),
      })
    );

    global.fetch = originalFetch;
  });
});
