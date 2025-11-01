import sqlite3 from 'sqlite3';
import { readFileSync } from 'fs';
import { dirname, isAbsolute, join, resolve } from 'path';
import { fileURLToPath } from 'url';

sqlite3.verbose();

const __dirname = dirname(fileURLToPath(import.meta.url));

function resolveDbPath() {
  const custom = process.env.DB_PATH;
  if (custom) {
    return isAbsolute(custom) ? custom : resolve(custom);
  }
  return join(__dirname, 'data.db');
}

export function getDb() {
  return new sqlite3.Database(resolveDbPath());
}

export function initDb() {
  const db = getDb();
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  return new Promise((resolveInit, reject) => {
    db.exec(schema, (err) => {
      if (err) reject(err);
      else resolveInit();
      db.close();
    });
  });
}