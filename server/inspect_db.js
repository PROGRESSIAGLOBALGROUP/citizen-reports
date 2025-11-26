import sqlite3 from 'sqlite3';
import { resolve } from 'path';

const dbPath = resolve('../e2e.db');
console.log(`Inspecting DB at: ${dbPath}`);

const db = new sqlite3.Database(dbPath);

db.all("SELECT * FROM usuarios WHERE email = 'supervisor.obras@jantetelco.gob.mx'", (err, rows) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('User found:', rows);
});
