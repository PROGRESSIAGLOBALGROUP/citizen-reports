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

  test('downloadArchive supports s3 scheme', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'restore-s3-'));
    const destPath = path.join(tmpDir, 'archive.tgz');

    const result = await downloadArchive('s3://bucket/path/archive.tgz', destPath, {});
    expect(result.provider).toBe('s3');
    expect(fs.readFileSync(destPath, 'utf8')).toBe('s3data');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('downloadArchive supports azblob scheme', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'restore-az-'));
    const destPath = path.join(tmpDir, 'archive.tgz');

    process.env.MAINTENANCE_AZURE_BLOB_CONNECTION = 'UseDevelopmentStorage=true';
    const result = await downloadArchive('azblob://container/path/archive.tgz', destPath, {});
    expect(result.provider).toBe('azblob');
    expect(fs.readFileSync(destPath, 'utf8')).toBe('azuredata');

    fs.rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.MAINTENANCE_AZURE_BLOB_CONNECTION;
  });
});
