#!/usr/bin/env node
/* eslint-disable no-console */
const { promises: fs } = require('fs');
const path = require('path');

async function main() {
  const dbPath = process.env.DB_PATH
    ? path.resolve(process.cwd(), process.env.DB_PATH)
    : path.resolve(__dirname, '../server/data.db');
  const backupDir = process.env.BACKUP_DIR
    ? path.resolve(process.cwd(), process.env.BACKUP_DIR)
    : path.resolve(__dirname, '../backups');

  try {
    await fs.stat(dbPath);
  } catch (err) {
    throw new Error(`No se encontró la base de datos en ${dbPath}. Ajusta DB_PATH antes de ejecutar el respaldo.`);
  }

  await fs.mkdir(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const basename = path.basename(dbPath, path.extname(dbPath));
  const extension = path.extname(dbPath) || '.db';
  const destination = path.join(backupDir, `${basename}-${timestamp}${extension}`);

  await fs.copyFile(dbPath, destination);

  console.log(`Respaldo creado en ${destination}`);
}

main().catch((err) => {
  console.error('Error al generar el respaldo:', err.message);
  process.exit(1);
});
