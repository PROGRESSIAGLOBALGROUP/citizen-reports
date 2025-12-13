import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';

const db = new sqlite3.Database('./data.db');

const email = 'func.obras1@jantetelco.gob.mx';
const password = 'admin123';
const nombre = 'Funcionario Obras';
const rol = 'funcionario';
const dependencia = 'obras_publicas';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error(err);
    return;
  }

  db.run(`INSERT INTO usuarios (email, password_hash, nombre, rol, dependencia, activo) VALUES (?, ?, ?, ?, ?, 1)`, 
    [email, hash, nombre, rol, dependencia], function(err) {
    if (err) {
      console.error(err);
    } else {
      console.log('Usuario creado');
    }
    db.close();
  });
});