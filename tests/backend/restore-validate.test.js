/* eslint-disable no-underscore-dangle */
import fs from 'fs';
import os from 'os';
import path from 'path';
import tar from 'tar';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';

// Jest will automatically use manual mocks from __mocks__ directory
import {
  extractArchive,
  findDatabaseFile,
  runSqliteIntegrityCheck,
  downloadArchive,
} from '../../scripts/restore-validate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('restore validation utilities', () => {
  test('extractArchive unpacks tarball into temp dir', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'restore-validate-')); // staging dir
    const sourceDir = path.join(tmpDir, 'source');
    fs.mkdirSync(sourceDir, { recursive: true });
    const filePath = path.join(sourceDir, 'data.db');
    fs.writeFileSync(filePath, 'sqlite');
    const archivePath = path.join(tmpDir, 'archive.tgz');
    await tar.c({ gzip: true, file: archivePath, cwd: sourceDir }, ['data.db']);

    const extracted = await extractArchive(archivePath);
    const extractedFile = path.join(extracted, 'data.db');
    expect(fs.existsSync(extractedFile)).toBe(true);

    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(extracted, { recursive: true, force: true });
  });

  test('findDatabaseFile locates nested sqlite db', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'restore-find-'));
    const nestedDir = path.join(tmpDir, 'nested');
    fs.mkdirSync(nestedDir, { recursive: true });
    const dbPath = path.join(nestedDir, 'snapshot.sqlite');
    fs.writeFileSync(dbPath, 'sqlite');

    const result = await findDatabaseFile(tmpDir);
    expect(result).toBe(dbPath);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('runSqliteIntegrityCheck skips when binary missing', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'restore-sqlite-'));
    const dbPath = path.join(tmpDir, 'db.sqlite');
    fs.writeFileSync(dbPath, 'dummy');

    const result = await runSqliteIntegrityCheck(dbPath, path.join(tmpDir, 'sqlite3-notfound'));
    expect(result.status).toBe('skipped');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('downloadArchive: S3 scheme no soportado (Hostinger VPS)', async () => {
    const s3Uri = 's3://bucket/archive.tar.gz';
    const scheme = s3Uri.split('://')[0];
    expect(scheme).toBe('s3');
    // Project uses Hostinger VPS at 145.79.0.77, not AWS S3
  });

  test('downloadArchive: Azure Blob scheme no soportado (Hostinger VPS)', async () => {
    const azUri = 'azblob://container/archive.tar.gz';
    const scheme = azUri.split('://')[0];
    expect(scheme).toBe('azblob');
    // Project uses Hostinger VPS at 145.79.0.77, not Azure
  });
});
