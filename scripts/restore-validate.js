#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const os = require('os');
const tar = require('tar');
const { pipeline } = require('stream/promises');
const { spawn } = require('child_process');
const { Readable } = require('stream');

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { BlobServiceClient } = require('@azure/storage-blob');

const {
  parseArgs,
  getLatestBackupFile,
  getBackupDir,
  parseUploadTarget,
} = require('./maintenance.js');

const fsp = fs.promises;
const REPO_ROOT = path.resolve(__dirname, '..');

function printHelp() {
  console.log(`Restore validation helper

Uso:
  node scripts/restore-validate.js [--archive <tar.gz>] [--source <s3://...|azblob://...>]
                                   [--db <sqlite.db>] [--backup-dir <path>] [--workdir <path>]
                                   [--skip-sqlite] [--sqlite-binary <path>] [--run-tests]
                                   [--test-script <npm-script>]

Ejemplos:
  node scripts/restore-validate.js --archive ./archives/backup.tgz
  node scripts/restore-validate.js --source s3://ops-backups/backup-latest.tgz --run-tests
  node scripts/restore-validate.js --db ./backups/data-2025-09-01.db --skip-sqlite
`);
}

function resolvePathMaybe(p) {
  if (!p) return null;
  return path.resolve(process.cwd(), p);
}

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
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
      resolve({ code: typeof code === 'number' ? code : 0, stdout, stderr });
    });
  });
}

async function extractArchive(archivePath, workdir) {
  const baseDir = workdir ? resolvePathMaybe(workdir) : os.tmpdir();
  const extractionDir = await fsp.mkdtemp(path.join(baseDir, 'restore-validate-'));
  await tar.x({ file: archivePath, cwd: extractionDir });
  return extractionDir;
}

async function findDatabaseFile(rootDir) {
  async function walk(currentDir) {
    const entries = await fsp.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        const nested = await walk(fullPath);
        if (nested) return nested;
      } else if (/\.(db|sqlite)$/.test(entry.name)) {
        return fullPath;
      }
    }
    return null;
  }
  return walk(rootDir);
}

async function runSqliteIntegrityCheck(dbPath, sqliteBinary = process.env.SQLITE3_PATH || 'sqlite3') {
  try {
    const result = await runCommand(sqliteBinary, [dbPath, 'PRAGMA integrity_check;']);
    const output = (result.stdout || result.stderr || '').trim();
    if (result.code !== 0) {
      return { status: 'failed', output };
    }
    if (output.toLowerCase() === 'ok') {
      return { status: 'ok', output };
    }
    return { status: 'failed', output: output || 'integrity_check no devolvió "ok"' };
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { status: 'skipped', output: 'sqlite3 no encontrado en PATH' };
    }
    throw err;
  }
}

async function ensureContainerClient(options = {}) {
  const connectionString =
    options.azureConnectionString ||
    process.env.MAINTENANCE_AZURE_BLOB_CONNECTION ||
    process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('Se requiere cadena de conexión para descargar de Azure Blob.');
  }
  const serviceClient = BlobServiceClient.fromConnectionString(connectionString);
  return serviceClient;
}

async function downloadArchiveAzure(url, destPath, options = {}) {
  const container = url.hostname;
  const blob = url.pathname.replace(/^\/+/, '');
  if (!container || !blob) {
    throw new Error('URI azblob requiere contenedor y blob (azblob://container/path).');
  }
  const serviceClient = await ensureContainerClient(options);
  const containerClient = serviceClient.getContainerClient(container);
  const blockBlobClient = containerClient.getBlockBlobClient(blob);
  await blockBlobClient.downloadToFile(destPath);
  return { provider: 'azblob', container, blob, path: destPath };
}

async function downloadArchiveS3(url, destPath, options = {}) {
  const bucket = url.hostname;
  const key = url.pathname.replace(/^\/+/, '');
  if (!bucket || !key) {
    throw new Error('URI S3 requiere bucket y objeto (s3://bucket/objeto).');
  }
  const region = options.s3Region || process.env.MAINTENANCE_S3_REGION || process.env.AWS_REGION;
  const client = new S3Client({ region });
  const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!response.Body) {
    throw new Error('Respuesta de S3 sin cuerpo para descarga.');
  }
  const bodyStream = response.Body instanceof Readable ? response.Body : Readable.from(response.Body);
  await pipeline(bodyStream, fs.createWriteStream(destPath));
  return { provider: 's3', bucket, key, region, path: destPath };
}

async function downloadArchive(source, destPath, options = {}) {
  const url = typeof source === 'string' ? parseUploadTarget(source) : source;
  switch (url.protocol) {
    case 's3:':
      return downloadArchiveS3(url, destPath, options);
    case 'azblob:':
      return downloadArchiveAzure(url, destPath, options);
    default:
      throw new Error(`Protocolo no soportado para descarga: ${url.protocol}`);
  }
}

async function resolveArchiveFromSource(source, options = {}) {
  const url = typeof source === 'string' ? parseUploadTarget(source) : source;
  const tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'restore-archive-'));
  const fallbackName = path.basename(url.pathname) || 'archive.tgz';
  const destPath = path.join(tempDir, fallbackName);
  await downloadArchive(url, destPath, options);
  return {
    archivePath: destPath,
    cleanup: async () => {
      await fsp.rm(tempDir, { recursive: true, force: true });
    },
  };
}

async function ensureDatabasePath(options = {}) {
  let cleanupFns = [];
  let archivePath = null;
  let dbPath = options.dbPath ? resolvePathMaybe(options.dbPath) : null;

  if (options.archive) {
    archivePath = resolvePathMaybe(options.archive);
    await fsp.access(archivePath);
  } else if (options.source) {
    const { archivePath: downloaded, cleanup } = await resolveArchiveFromSource(options.source, options);
    archivePath = downloaded;
    cleanupFns.push(cleanup);
  }

  if (archivePath) {
    const extractionDir = await extractArchive(archivePath, options.workdir);
    cleanupFns.push(async () => {
      await fsp.rm(extractionDir, { recursive: true, force: true });
    });
    dbPath = await findDatabaseFile(extractionDir);
    if (!dbPath) {
      throw new Error(`No se encontró un archivo .db o .sqlite en el archivo ${archivePath}`);
    }
  }

  if (!dbPath) {
    const backupDir = getBackupDir({ backupDir: options.backupDir });
    dbPath = await getLatestBackupFile(backupDir);
    if (!dbPath) {
      throw new Error(`No se encontraron respaldos en ${backupDir}`);
    }
  }

  return { dbPath, cleanup: cleanupFns };
}

async function runRestoreValidation(options = {}) {
  const cleanupTasks = [];
  try {
    const { dbPath, cleanup } = await ensureDatabasePath(options);
    cleanupTasks.push(...cleanup);
    console.log(`Base candidata: ${dbPath}`);

    let sqliteResult = { status: 'skipped', output: 'omitido' };
    if (!options.skipSqlite) {
      sqliteResult = await runSqliteIntegrityCheck(dbPath, options.sqliteBinary);
      console.log(`Resultado integrity_check: ${sqliteResult.status} (${sqliteResult.output})`);
      if (sqliteResult.status === 'failed') {
        throw new Error('integrity_check falló');
      }
    } else {
      console.log('Chequeo sqlite omitido (--skip-sqlite).');
    }

    if (options.runTests) {
      const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      const scriptName = options.testScript || 'test:unit';
      console.log(`Ejecutando pruebas npm run ${scriptName}...`);
      const res = await runCommand(npmCmd, ['run', scriptName], { cwd: REPO_ROOT, env: process.env });
      if (res.code !== 0) {
        console.error(res.stdout || res.stderr);
        throw new Error(`Las pruebas npm run ${scriptName} terminaron con código ${res.code}`);
      }
      console.log('Pruebas exitosas.');
    }

    return { status: 'ok', sqliteResult };
  } finally {
    await Promise.allSettled(
      cleanupTasks.reverse().map((fn) => fn().catch((err) => console.warn('Error limpiando temporales:', err.message)))
    );
  }
}

async function main(argv = process.argv.slice(2)) {
  const rawArgs = parseArgs(argv);
  if (rawArgs.help) {
    printHelp();
    return 0;
  }

  if (rawArgs.archive === true) {
    throw new Error('--archive requiere una ruta.');
  }
  if (rawArgs.source === true) {
    throw new Error('--source requiere una URI.');
  }
  if (rawArgs.db === true) {
    throw new Error('--db requiere una ruta.');
  }
  if (rawArgs.sqliteBinary === true) {
    throw new Error('--sqlite-binary requiere una ruta.');
  }
  if (rawArgs.testScript === true) {
    throw new Error('--test-script requiere un nombre de script.');
  }

  const options = {
    archive: rawArgs.archive,
    source: rawArgs.source || process.env.MAINTENANCE_RESTORE_SOURCE,
    dbPath: rawArgs.db,
    backupDir: rawArgs.backupDir,
    workdir: rawArgs.workdir,
    skipSqlite: rawArgs.skipSqlite === true,
    sqliteBinary: rawArgs.sqliteBinary,
    runTests: rawArgs.runTests === true,
    testScript: rawArgs.testScript,
    s3Region: rawArgs.s3Region,
    azureConnectionString: rawArgs.azureConnectionString,
  };

  try {
    const result = await runRestoreValidation(options);
    console.log('Validación completada con éxito.');
    return result.status === 'ok' ? 0 : 1;
  } catch (err) {
    console.error('Error en validación de restauración:', err.message);
    return 2;
  }
}

if (require.main === module) {
  main()
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error('Error inesperado:', err.message);
      process.exit(2);
    });
}

module.exports = {
  runCommand,
  extractArchive,
  findDatabaseFile,
  runSqliteIntegrityCheck,
  downloadArchive,
  downloadArchiveS3,
  downloadArchiveAzure,
  resolveArchiveFromSource,
  ensureDatabasePath,
  runRestoreValidation,
  main,
};
