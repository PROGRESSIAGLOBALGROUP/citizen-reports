// Rutas de autenticación
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { getDb } from './db.js';
import { 
  loginRateLimiter, 
  registrarIntentoFallido, 
  limpiarIntentosLogin,
  generarCSRFToken,
  actualizarActividadSesion,
  registrarEventoSeguridad,
  getClientIP,
  encrypt
} from './security.js';

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
    
    // Encriptar PII (IP y user_agent) antes de guardar - Encryption at Rest
    const encryptedIp = ip ? encrypt(ip) : null;
    const encryptedUserAgent = userAgent ? encrypt(userAgent) : null;
    
    const sql = `
      INSERT INTO sesiones (usuario_id, token, expira_en, ip, user_agent)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    db.run(sql, [usuarioId, token, expiraEn, encryptedIp, encryptedUserAgent], function(err) {
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
  // Con rate limiting: 5 intentos por minuto, bloqueo de 15 min
  app.post('/api/auth/login', loginRateLimiter, async (req, res) => {
    const { email, password } = req.body;
    const ip = getClientIP(req);
    
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
        registrarIntentoFallido(req);
        registrarEventoSeguridad('LOGIN_FAILED', ip, { email, razon: 'usuario_no_existe' });
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      
      if (!usuario.password_hash) {
        return res.status(401).json({ error: 'Este usuario solo puede ingresar con Google' });
      }
      
      // Verificar password
      const passwordValido = await bcrypt.compare(password, usuario.password_hash);
      
      if (!passwordValido) {
        registrarIntentoFallido(req);
        registrarEventoSeguridad('LOGIN_FAILED', ip, { email, razon: 'password_incorrecto' });
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      
      // Login exitoso - limpiar intentos fallidos
      limpiarIntentosLogin(req);
      
      // Crear sesión
      try {
        const userAgent = req.headers['user-agent'];
        const sesion = await crearSesion(usuario.id, ip, userAgent);
        
        // Generar token CSRF
        const csrfToken = generarCSRFToken(sesion.token);
        
        // Registrar login exitoso
        registrarEventoSeguridad('LOGIN_SUCCESS', ip, { 
          usuarioId: usuario.id, 
          email: usuario.email 
        });
        
        res.json({
          token: sesion.token,
          csrfToken: csrfToken,
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
