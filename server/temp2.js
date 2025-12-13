import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./data.db');

db.all("SELECT email, rol, dependencia FROM usuarios", (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Usuarios:', rows);
  }
  db.close();
});