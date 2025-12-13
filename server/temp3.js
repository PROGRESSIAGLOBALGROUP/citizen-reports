import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';

const db = new sqlite3.Database('./data.db');

const email = 'func.obras1@jantetelco.gob.mx';
const password = 'admin123';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error(err);
    return;
  }

  db.run(`UPDATE usuarios SET password_hash = ? WHERE email = ?`, 
    [hash, email], function(err) {
    if (err) {
      console.error(err);
    } else {
      console.log('Password actualizado');
    }
    db.close();
  });
});