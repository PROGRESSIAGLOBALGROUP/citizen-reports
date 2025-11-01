// Rutas de autenticación
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { getDb } from './db.js';
import { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

/**
 * Genera un token de sesión único
 */
function generarToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Crea una sesión en la base de datos
 */
function crearSesion(usuarioId, ip, userAgent) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    const token = generarToken();
    const expiraEn = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 horas
    
    const sql = `
      INSERT INTO sesiones (usuario_id, token, expira_en, ip, user_agent)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    db.run(sql, [usuarioId, token, expiraEn, ip, userAgent], function(err) {
      if (err) return reject(err);
      resolve({ token, expiraEn });
    });
  });
}

/**
 * Configura las rutas de autenticación
 */
export function configurarRutasAuth(app) {
  
  // POST /api/auth/login - Login con email y password
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password requeridos' });
    }
    
    const db = getDb();
    const sql = `SELECT * FROM usuarios WHERE email = ? AND activo = 1`;
    
    db.get(sql, [email.toLowerCase()], async (err, usuario) => {
      if (err) {
        console.error('Error en login:', err);
        return res.status(500).json({ error: 'Error del servidor' });
      }
      
      if (!usuario) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      
      if (!usuario.password_hash) {
        return res.status(401).json({ error: 'Este usuario solo puede ingresar con Google' });
      }
      
      // Verificar password
      const passwordValido = await bcrypt.compare(password, usuario.password_hash);
      
      if (!passwordValido) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      
      // Crear sesión
      try {
        const ip = req.ip || req.connection?.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const sesion = await crearSesion(usuario.id, ip, userAgent);
        
        res.json({
          token: sesion.token,
          expiraEn: sesion.expiraEn,
          usuario: {
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            dependencia: usuario.dependencia,
            rol: usuario.rol,
            tieneFirma: !!usuario.firma_digital
          }
        });
      } catch (err) {
        console.error('Error creando sesión:', err);
        res.status(500).json({ error: 'Error al crear sesión' });
      }
    });
  });
  
  // POST /api/auth/google - Login con Google OAuth
  app.post('/api/auth/google', async (req, res) => {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ error: 'Credential de Google requerido' });
    }
    
    if (!googleClient) {
      return res.status(503).json({ error: 'Google OAuth no configurado' });
    }
    
    try {
      // Verificar token de Google
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID
      });
      
      const payload = ticket.getPayload();
      const googleId = payload.sub;
      const email = payload.email;
      const nombre = payload.name;
      
      const db = getDb();
      
      // Buscar usuario existente por google_id o email
      const sqlBuscar = `SELECT * FROM usuarios WHERE (google_id = ? OR email = ?) AND activo = 1`;
      
      db.get(sqlBuscar, [googleId, email], async (err, usuario) => {
        if (err) {
          console.error('Error buscando usuario:', err);
          return res.status(500).json({ error: 'Error del servidor' });
        }
        
        let usuarioId = usuario?.id;
        
        // Si no existe, no permitir auto-registro (solo usuarios autorizados)
        if (!usuario) {
          return res.status(403).json({ 
            error: 'Usuario no autorizado. Contacta al administrador para solicitar acceso.' 
          });
        }
        
        // Actualizar google_id si no estaba registrado
        if (!usuario.google_id) {
          const sqlUpdate = `UPDATE usuarios SET google_id = ? WHERE id = ?`;
          db.run(sqlUpdate, [googleId, usuarioId]);
        }
        
        // Crear sesión
        try {
          const ip = req.ip || req.connection?.remoteAddress;
          const userAgent = req.headers['user-agent'];
          const sesion = await crearSesion(usuarioId, ip, userAgent);
          
          res.json({
            token: sesion.token,
            expiraEn: sesion.expiraEn,
            usuario: {
              id: usuario.id,
              email: usuario.email,
              nombre: usuario.nombre,
              dependencia: usuario.dependencia,
              rol: usuario.rol,
              tieneFirma: !!usuario.firma_digital
            }
          });
        } catch (err) {
          console.error('Error creando sesión:', err);
          res.status(500).json({ error: 'Error al crear sesión' });
        }
      });
    } catch (err) {
      console.error('Error verificando Google token:', err);
      res.status(401).json({ error: 'Token de Google inválido' });
    }
  });
  
  // POST /api/auth/logout - Cerrar sesión
  app.post('/api/auth/logout', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(400).json({ error: 'Token requerido' });
    }
    
    const db = getDb();
    const sql = `DELETE FROM sesiones WHERE token = ?`;
    
    db.run(sql, [token], (err) => {
      if (err) {
        console.error('Error en logout:', err);
        return res.status(500).json({ error: 'Error del servidor' });
      }
      
      res.json({ mensaje: 'Sesión cerrada exitosamente' });
    });
  });
  
  // GET /api/auth/me - Obtener información del usuario actual
  app.get('/api/auth/me', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token requerido' });
    }
    
    const db = getDb();
    const sql = `
      SELECT u.id, u.email, u.nombre, u.dependencia, u.rol, u.firma_digital
      FROM usuarios u
      JOIN sesiones s ON u.id = s.usuario_id
      WHERE s.token = ? AND datetime(s.expira_en) > datetime('now') AND u.activo = 1
    `;
    
    db.get(sql, [token], (err, usuario) => {
      if (err) {
        console.error('Error obteniendo usuario:', err);
        return res.status(500).json({ error: 'Error del servidor' });
      }
      
      if (!usuario) {
        return res.status(401).json({ error: 'Sesión inválida o expirada' });
      }
      
      res.json({
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        dependencia: usuario.dependencia,
        rol: usuario.rol,
        tieneFirma: !!usuario.firma_digital
      });
    });
  });
}
