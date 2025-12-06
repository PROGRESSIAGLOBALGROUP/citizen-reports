/**
 * Módulo de Seguridad - citizen-reports
 *
 * Implementa:
 * - Rate Limiting (login, API general)
 * - Cifrado E2E de datos sensibles (AES-256-GCM)
 * - Sanitización de inputs
 * - Protección contra brute force
 * - Session timeout
 * - CSRF protection
 * - Headers de seguridad
 */

import crypto from 'crypto';
import { getDb } from './db.js';

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE SEGURIDAD
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  // Rate Limiting
  LOGIN_MAX_ATTEMPTS: 5, // Intentos máximos de login
  LOGIN_WINDOW_MS: 60 * 1000, // Ventana de 1 minuto
  LOGIN_BLOCK_DURATION_MS: 15 * 60 * 1000, // Bloqueo de 15 minutos

  API_RATE_LIMIT: 100, // Requests por ventana
  API_RATE_WINDOW_MS: 60 * 1000, // Ventana de 1 minuto

  // Cifrado
  ENCRYPTION_ALGORITHM: 'aes-256-gcm',
  IV_LENGTH: 16,
  AUTH_TAG_LENGTH: 16,

  // Sesiones
  SESSION_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutos de inactividad
  SESSION_MAX_AGE_MS: 24 * 60 * 60 * 1000, // 24 horas máximo

  // Password Policy
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBER: true,
  PASSWORD_REQUIRE_SPECIAL: false,

  // Datos sensibles a cifrar
  SENSITIVE_FIELDS: [
    'descripcion',
    'notas',
    'direccion',
    'colonia',
    'nombre_ciudadano',
    'telefono',
    'email_ciudadano',
  ],
};

// ═══════════════════════════════════════════════════════════════
// ALMACENAMIENTO EN MEMORIA PARA RATE LIMITING
// ═══════════════════════════════════════════════════════════════

const loginAttempts = new Map(); // IP -> { attempts: number, firstAttempt: timestamp, blocked: boolean, blockedUntil: timestamp }
const apiRequests = new Map(); // IP -> { count: number, windowStart: timestamp }

// ═══════════════════════════════════════════════════════════════
// RATE LIMITING - LOGIN
// ═══════════════════════════════════════════════════════════════

/**
 * Middleware de rate limiting para login
 * Bloquea después de 5 intentos fallidos en 1 minuto
 * BYPASS: Desactivado en NODE_ENV=test para E2E tests
 */
export function loginRateLimiter(req, res, next) {
  // Bypass rate limiting en modo test (E2E)
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const ip = getClientIP(req);
  const now = Date.now();

  let record = loginAttempts.get(ip);

  // Si está bloqueado, verificar si el bloqueo expiró
  if (record?.blocked) {
    if (now < record.blockedUntil) {
      const remainingMs = record.blockedUntil - now;
      const remainingMin = Math.ceil(remainingMs / 60000);

      console.log(`🚫 Login bloqueado para IP ${ip}. ${remainingMin} minutos restantes.`);

      return res.status(429).json({
        error: 'Demasiados intentos fallidos',
        mensaje: `Por seguridad, su acceso está bloqueado por ${remainingMin} minutos`,
        reintentoEn: record.blockedUntil,
        codigo: 'RATE_LIMIT_EXCEEDED',
      });
    } else {
      // Bloqueo expiró, resetear
      loginAttempts.delete(ip);
      record = null;
    }
  }

  // Limpiar intentos antiguos (fuera de la ventana)
  if (record && now - record.firstAttempt > CONFIG.LOGIN_WINDOW_MS) {
    loginAttempts.delete(ip);
    record = null;
  }

  next();
}

/**
 * Registra un intento de login fallido
 */
export function registrarIntentoFallido(req) {
  const ip = getClientIP(req);
  const now = Date.now();

  let record = loginAttempts.get(ip);

  if (!record || now - record.firstAttempt > CONFIG.LOGIN_WINDOW_MS) {
    record = {
      attempts: 1,
      firstAttempt: now,
      blocked: false,
      blockedUntil: null,
    };
  } else {
    record.attempts++;

    if (record.attempts >= CONFIG.LOGIN_MAX_ATTEMPTS) {
      record.blocked = true;
      record.blockedUntil = now + CONFIG.LOGIN_BLOCK_DURATION_MS;
      console.log(
        `⚠️ IP ${ip} bloqueada por ${CONFIG.LOGIN_BLOCK_DURATION_MS / 60000} minutos (${record.attempts} intentos fallidos)`
      );

      // Registrar en audit trail
      registrarEventoSeguridad('LOGIN_BLOCKED', ip, {
        intentos: record.attempts,
        bloqueadoHasta: new Date(record.blockedUntil).toISOString(),
      });
    }
  }

  loginAttempts.set(ip, record);
}

/**
 * Limpia el registro de intentos tras login exitoso
 */
export function limpiarIntentosLogin(req) {
  const ip = getClientIP(req);
  loginAttempts.delete(ip);
}

// ═══════════════════════════════════════════════════════════════
// RATE LIMITING - API GENERAL
// ═══════════════════════════════════════════════════════════════

/**
 * Middleware de rate limiting para API general
 * BYPASS: Desactivado en NODE_ENV=test para E2E tests
 */
export function apiRateLimiter(req, res, next) {
  // Bypass rate limiting en modo test (E2E)
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const ip = getClientIP(req);
  const now = Date.now();

  let record = apiRequests.get(ip);

  // Limpiar ventana antigua
  if (record && now - record.windowStart > CONFIG.API_RATE_WINDOW_MS) {
    apiRequests.delete(ip);
    record = null;
  }

  if (!record) {
    record = { count: 1, windowStart: now };
  } else {
    record.count++;

    if (record.count > CONFIG.API_RATE_LIMIT) {
      const remainingMs = CONFIG.API_RATE_WINDOW_MS - (now - record.windowStart);

      return res.status(429).json({
        error: 'Límite de solicitudes excedido',
        mensaje: 'Por favor espere antes de realizar más solicitudes',
        reintentoEnMs: remainingMs,
        codigo: 'API_RATE_LIMIT',
      });
    }
  }

  apiRequests.set(ip, record);
  next();
}

// ═══════════════════════════════════════════════════════════════
// CIFRADO E2E (AES-256-GCM)
// ═══════════════════════════════════════════════════════════════

// Obtener o generar clave de cifrado
function getEncryptionKey() {
  // En producción, usar variable de entorno
  const keyEnv = process.env.ENCRYPTION_KEY;

  if (keyEnv) {
    // Asegurar que la clave tenga 32 bytes (256 bits)
    return crypto.createHash('sha256').update(keyEnv).digest();
  }

  // ADVERTENCIA: Solo para desarrollo
  console.warn('⚠️ ENCRYPTION_KEY no definida. Usando clave de desarrollo.');
  return crypto
    .createHash('sha256')
    .update('citizen-reports-dev-key-change-in-production')
    .digest();
}

const ENCRYPTION_KEY = getEncryptionKey();

/**
 * Cifra un texto usando AES-256-GCM
 * @param {string} plaintext - Texto a cifrar
 * @returns {string} - Texto cifrado en formato base64 (iv:authTag:ciphertext)
 */
export function encrypt(plaintext) {
  if (!plaintext || typeof plaintext !== 'string') {
    return plaintext;
  }

  try {
    const iv = crypto.randomBytes(CONFIG.IV_LENGTH);
    const cipher = crypto.createCipheriv(CONFIG.ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Formato: iv:authTag:ciphertext (todo en base64)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  } catch (error) {
    console.error('Error cifrando:', error.message);
    return plaintext; // Fallback: retornar texto sin cifrar
  }
}

/**
 * Descifra un texto cifrado con AES-256-GCM
 * @param {string} encryptedText - Texto cifrado (formato iv:authTag:ciphertext)
 * @returns {string} - Texto descifrado
 */
export function decrypt(encryptedText) {
  if (!encryptedText || typeof encryptedText !== 'string') {
    return encryptedText;
  }

  // Verificar si tiene formato cifrado
  if (!encryptedText.includes(':')) {
    return encryptedText; // No está cifrado
  }

  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      return encryptedText; // Formato inválido, probablemente no está cifrado
    }

    const [ivBase64, authTagBase64, ciphertext] = parts;

    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');

    const decipher = crypto.createDecipheriv(CONFIG.ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    // Si falla el descifrado, puede ser texto no cifrado
    return encryptedText;
  }
}

/**
 * Cifra campos sensibles de un objeto
 */
export function encryptSensitiveFields(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  const encrypted = { ...obj };

  for (const field of CONFIG.SENSITIVE_FIELDS) {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = encrypt(encrypted[field]);
    }
  }

  return encrypted;
}

/**
 * Descifra campos sensibles de un objeto
 */
export function decryptSensitiveFields(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  const decrypted = { ...obj };

  for (const field of CONFIG.SENSITIVE_FIELDS) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      decrypted[field] = decrypt(decrypted[field]);
    }
  }

  return decrypted;
}

/**
 * Hash de datos para búsquedas (permite buscar sin descifrar)
 */
export function hashForSearch(value) {
  if (!value) return null;
  return crypto
    .createHash('sha256')
    .update(value.toLowerCase().trim())
    .digest('hex')
    .substring(0, 16);
}

// ═══════════════════════════════════════════════════════════════
// VALIDACIÓN DE PASSWORDS
// ═══════════════════════════════════════════════════════════════

/**
 * Valida la complejidad de un password
 * @returns {{ valido: boolean, errores: string[] }}
 */
export function validarPassword(password) {
  const errores = [];

  if (!password || password.length < CONFIG.PASSWORD_MIN_LENGTH) {
    errores.push(`La contraseña debe tener al menos ${CONFIG.PASSWORD_MIN_LENGTH} caracteres`);
  }

  if (CONFIG.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errores.push('La contraseña debe contener al menos una mayúscula');
  }

  if (CONFIG.PASSWORD_REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errores.push('La contraseña debe contener al menos una minúscula');
  }

  if (CONFIG.PASSWORD_REQUIRE_NUMBER && !/[0-9]/.test(password)) {
    errores.push('La contraseña debe contener al menos un número');
  }

  if (CONFIG.PASSWORD_REQUIRE_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errores.push('La contraseña debe contener al menos un carácter especial');
  }

  // Verificar passwords comunes
  const passwordsComunes = ['password', '12345678', 'admin123', 'qwerty123'];
  if (passwordsComunes.includes(password.toLowerCase())) {
    errores.push('La contraseña es muy común. Por favor elija una más segura');
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}

// ═══════════════════════════════════════════════════════════════
// SANITIZACIÓN DE INPUTS
// ═══════════════════════════════════════════════════════════════

/**
 * Sanitiza input para prevenir XSS
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/\\/g, '&#x5C;')
    .replace(/`/g, '&#x60;');
}

/**
 * Sanitiza un objeto recursivamente
 */
export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return sanitizeInput(obj);

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[sanitizeInput(key)] = sanitizeObject(value);
  }
  return sanitized;
}

// ═══════════════════════════════════════════════════════════════
// HEADERS DE SEGURIDAD
// ═══════════════════════════════════════════════════════════════

/**
 * Middleware para agregar headers de seguridad
 */
export function securityHeaders(req, res, next) {
  // Prevenir clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevenir MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // HSTS (solo en producción con HTTPS)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.tile.openstreetmap.org",
      "font-src 'self'",
      "connect-src 'self' https://nominatim.openstreetmap.org",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(self), microphone=()');

  next();
}

// ═══════════════════════════════════════════════════════════════
// CSRF PROTECTION
// ═══════════════════════════════════════════════════════════════

const csrfTokens = new Map(); // sessionToken -> csrfToken

/**
 * Genera un token CSRF para una sesión
 */
export function generarCSRFToken(sessionToken) {
  const csrfToken = crypto.randomBytes(32).toString('hex');
  csrfTokens.set(sessionToken, csrfToken);
  return csrfToken;
}

/**
 * Valida un token CSRF
 */
export function validarCSRFToken(sessionToken, csrfToken) {
  const storedToken = csrfTokens.get(sessionToken);
  if (!storedToken || !csrfToken) return false;

  // Comparación de tiempo constante
  try {
    return crypto.timingSafeEqual(Buffer.from(storedToken), Buffer.from(csrfToken));
  } catch {
    return false;
  }
}

/**
 * Middleware de validación CSRF (para mutaciones)
 */
export function csrfProtection(req, res, next) {
  // Solo validar para métodos que modifican datos
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const sessionToken = req.headers.authorization?.replace('Bearer ', '');
  const csrfToken = req.headers['x-csrf-token'];

  // Validar CSRF token si CSRF_ENABLED=true (rollout gradual)
  const csrfEnabled = process.env.CSRF_ENABLED === 'true';

  if (csrfEnabled) {
    if (!csrfToken) {
      console.warn(`⚠️ Request sin CSRF token: ${req.method} ${req.path}`);
      return res.status(403).json({
        error: 'Token CSRF requerido',
        codigo: 'CSRF_REQUIRED',
      });
    }

    if (!validarCSRFToken(sessionToken, csrfToken)) {
      console.warn(`⚠️ CSRF token inválido: ${req.method} ${req.path}`);
      return res.status(403).json({
        error: 'Token CSRF inválido',
        codigo: 'CSRF_INVALID',
      });
    }
  } else {
    // Modo advertencia: solo log si no hay CSRF token
    if (!csrfToken) {
      console.warn(`⚠️ Request sin CSRF token (modo advertencia): ${req.method} ${req.path}`);
    }
  }

  next();
}

// ═══════════════════════════════════════════════════════════════
// SESSION TIMEOUT
// ═══════════════════════════════════════════════════════════════

const sessionActivity = new Map(); // token -> lastActivity timestamp

/**
 * Actualiza la actividad de una sesión
 */
export function actualizarActividadSesion(token) {
  sessionActivity.set(token, Date.now());
}

/**
 * Verifica si una sesión está activa (no expirada por inactividad)
 */
export function verificarSesionActiva(token) {
  const lastActivity = sessionActivity.get(token);

  if (!lastActivity) {
    // Primera vez, registrar actividad
    sessionActivity.set(token, Date.now());
    return true;
  }

  const inactiveTime = Date.now() - lastActivity;

  if (inactiveTime > CONFIG.SESSION_TIMEOUT_MS) {
    console.log(`⏰ Sesión expirada por inactividad: ${inactiveTime / 60000} minutos`);
    sessionActivity.delete(token);
    return false;
  }

  // Actualizar actividad
  sessionActivity.set(token, Date.now());
  return true;
}

/**
 * Limpia sesiones inactivas (ejecutar periódicamente)
 */
export function limpiarSesionesInactivas() {
  const now = Date.now();
  let limpiadas = 0;

  for (const [token, lastActivity] of sessionActivity.entries()) {
    if (now - lastActivity > CONFIG.SESSION_TIMEOUT_MS) {
      sessionActivity.delete(token);
      limpiadas++;

      // También eliminar de BD
      const db = getDb();
      db.run('DELETE FROM sesiones WHERE token = ?', [token]);
    }
  }

  if (limpiadas > 0) {
    console.log(`🧹 ${limpiadas} sesiones inactivas limpiadas`);
  }
}

// Ejecutar limpieza cada 5 minutos
setInterval(limpiarSesionesInactivas, 5 * 60 * 1000);

// ═══════════════════════════════════════════════════════════════
// AUDIT TRAIL
// ═══════════════════════════════════════════════════════════════

/**
 * Registra un evento de seguridad
 * Nota: Para eventos sin usuario autenticado (login fallido), usuario_id es NULL
 */
export function registrarEventoSeguridad(tipo, ip, detalles = {}) {
  const db = getDb();

  // Usar las columnas correctas del schema: valor_anterior, valor_nuevo, metadatos
  // usuario_id puede ser NULL para eventos de seguridad sin usuario autenticado
  const sql = `
    INSERT INTO historial_cambios (
      usuario_id, entidad, entidad_id, tipo_cambio, 
      valor_anterior, valor_nuevo, metadatos
    ) VALUES (?, 'seguridad', 0, ?, NULL, ?, ?)
  `;

  const metadatos = JSON.stringify({
    ip,
    userAgent: detalles.userAgent || null,
    ...detalles,
  });

  // Usar NULL si no hay usuarioId (login fallido, etc.)
  const usuarioId = detalles.usuarioId || null;

  db.run(sql, [usuarioId, tipo, JSON.stringify(detalles), metadatos], (err) => {
    if (err) console.error('Error registrando evento de seguridad:', err);
  });
}

// ═══════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene la IP real del cliente (considera proxies)
 */
export function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.ip ||
    req.connection?.remoteAddress ||
    'unknown'
  );
}

/**
 * Genera un ID único seguro
 */
export function generateSecureId() {
  return crypto.randomUUID();
}

/**
 * Compara strings de manera segura (tiempo constante)
 */
export function secureCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;

  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// CIFRADO DE ARCHIVOS (BACKUPS)
// ═══════════════════════════════════════════════════════════════

/**
 * Cifra un archivo usando AES-256-GCM
 * Formato de salida: IV (16 bytes) | AuthTag (16 bytes) | CipherData
 *
 * @param {Buffer} fileBuffer - Contenido del archivo
 * @returns {{ encrypted: Buffer, iv: string, authTag: string }}
 */
export function encryptFile(fileBuffer) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(CONFIG.IV_LENGTH);

  const cipher = crypto.createCipheriv(CONFIG.ENCRYPTION_ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);

  const authTag = cipher.getAuthTag();

  // Formato binario: IV | AuthTag | CipherData
  const result = Buffer.concat([iv, authTag, encrypted]);

  return {
    encrypted: result,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

/**
 * Descifra un archivo cifrado con encryptFile
 *
 * @param {Buffer} encryptedBuffer - Archivo cifrado (IV | AuthTag | Data)
 * @returns {Buffer} - Contenido original
 */
export function decryptFile(encryptedBuffer) {
  const key = getEncryptionKey();

  // Extraer componentes
  const iv = encryptedBuffer.slice(0, CONFIG.IV_LENGTH);
  const authTag = encryptedBuffer.slice(
    CONFIG.IV_LENGTH,
    CONFIG.IV_LENGTH + CONFIG.AUTH_TAG_LENGTH
  );
  const cipherData = encryptedBuffer.slice(CONFIG.IV_LENGTH + CONFIG.AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(CONFIG.ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(cipherData), decipher.final()]);

  return decrypted;
}

/**
 * Cifra un archivo y retorna stream para descarga
 * Usado para backups de base de datos
 *
 * @param {string} filePath - Ruta del archivo a cifrar
 * @returns {Promise<{ stream: ReadableStream, size: number, iv: string }>}
 */
export async function encryptFileStream(filePath) {
  const fs = await import('fs');

  return new Promise((resolve, reject) => {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(CONFIG.IV_LENGTH);

    const cipher = crypto.createCipheriv(CONFIG.ENCRYPTION_ALGORITHM, key, iv);

    // Crear stream de lectura
    const readStream = fs.createReadStream(filePath);

    // Buffer para acumular datos cifrados
    const chunks = [];

    cipher.on('data', (chunk) => chunks.push(chunk));
    cipher.on('error', reject);

    readStream.on('error', reject);
    readStream.on('end', () => {
      cipher.end();
    });

    cipher.on('end', () => {
      const authTag = cipher.getAuthTag();

      // Resultado final: IV | AuthTag | CipherData
      const encrypted = Buffer.concat([iv, authTag, ...chunks]);

      resolve({
        buffer: encrypted,
        size: encrypted.length,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
      });
    });

    readStream.pipe(cipher);
  });
}

/**
 * Verifica si un buffer está cifrado (verifica estructura IV|AuthTag|Data)
 */
export function isEncryptedFile(buffer) {
  // Mínimo: IV (16) + AuthTag (16) + al menos 1 byte de datos
  if (!buffer || buffer.length < 33) return false;

  // Los primeros 16 bytes (IV) no deberían ser todos ceros o un patrón reconocible
  const iv = buffer.slice(0, 16);
  const allZeros = iv.every((b) => b === 0);

  return !allZeros;
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS DE CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════

export const SECURITY_CONFIG = CONFIG;
