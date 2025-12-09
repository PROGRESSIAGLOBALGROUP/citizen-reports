/**
 * 📋 Módulo de Logging Centralizado - citizen-reports
 * 
 * Implementa:
 * - Log rotation diario (winston-daily-rotate-file)
 * - Niveles de log: error, warn, info, http, debug
 * - Formato JSON para producción, colorizado para desarrollo
 * - Retención configurable (default: 14 días, max 100MB)
 * - Compresión de logs antiguos
 * - Compatibilidad con console.log existente
 * 
 * Uso:
 *   import logger from './logger.js';
 *   logger.info('Mensaje informativo');
 *   logger.error('Error crítico', { detalles: 'aquí' });
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  // Directorio de logs (relativo al servidor)
  LOG_DIR: process.env.LOG_DIR || path.join(__dirname, '..', 'logs'),
  
  // Retención de logs
  MAX_SIZE: process.env.LOG_MAX_SIZE || '20m',      // Tamaño máximo por archivo
  MAX_FILES: process.env.LOG_MAX_FILES || '14d',    // Retención (14 días)
  
  // Nivel de log según entorno
  LEVEL: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  
  // Comprimir logs antiguos
  COMPRESS: process.env.LOG_COMPRESS !== 'false',
};

// ═══════════════════════════════════════════════════════════════
// FORMATOS PERSONALIZADOS
// ═══════════════════════════════════════════════════════════════

// Formato para desarrollo (colorizado, legible)
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

// Formato para producción (JSON estructurado)
const prodFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Formato para archivos (siempre JSON)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// ═══════════════════════════════════════════════════════════════
// TRANSPORTS
// ═══════════════════════════════════════════════════════════════

const transports = [];

// Console transport (siempre activo)
transports.push(
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
    level: CONFIG.LEVEL
  })
);

// File transports (solo en producción o si LOG_DIR existe)
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGS === 'true') {
  // Logs combinados (todos los niveles)
  transports.push(
    new DailyRotateFile({
      filename: path.join(CONFIG.LOG_DIR, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: CONFIG.MAX_SIZE,
      maxFiles: CONFIG.MAX_FILES,
      zippedArchive: CONFIG.COMPRESS,
      format: fileFormat,
      level: 'info'
    })
  );
  
  // Logs de errores (separados para fácil monitoreo)
  transports.push(
    new DailyRotateFile({
      filename: path.join(CONFIG.LOG_DIR, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: CONFIG.MAX_SIZE,
      maxFiles: CONFIG.MAX_FILES,
      zippedArchive: CONFIG.COMPRESS,
      format: fileFormat,
      level: 'error'
    })
  );
  
  // Logs de acceso HTTP (para auditoría)
  transports.push(
    new DailyRotateFile({
      filename: path.join(CONFIG.LOG_DIR, 'access-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: CONFIG.MAX_SIZE,
      maxFiles: '30d', // Retener accesos 30 días
      zippedArchive: CONFIG.COMPRESS,
      format: fileFormat,
      level: 'http'
    })
  );
}

// ═══════════════════════════════════════════════════════════════
// LOGGER PRINCIPAL
// ═══════════════════════════════════════════════════════════════

const logger = winston.createLogger({
  level: CONFIG.LEVEL,
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
  },
  transports,
  // No salir en errores no manejados (dejar que el proceso maneje)
  exitOnError: false
});

// Añadir colores personalizados
winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'cyan',
  debug: 'gray'
});

// ═══════════════════════════════════════════════════════════════
// HELPERS PARA COMPATIBILIDAD CON console.log EXISTENTE
// ═══════════════════════════════════════════════════════════════

/**
 * Middleware de logging HTTP para Express
 * Registra todas las peticiones HTTP
 */
export function httpLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent')?.substring(0, 100)
    };
    
    // Nivel según status code
    if (res.statusCode >= 500) {
      logger.error('HTTP Request', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.http('HTTP Request', logData);
    }
  });
  
  next();
}

/**
 * Logger específico para errores de base de datos
 */
export function dbError(message, error, context = {}) {
  logger.error(message, {
    type: 'database',
    error: error?.message || error,
    stack: error?.stack,
    ...context
  });
}

/**
 * Logger específico para eventos de seguridad
 */
export function securityEvent(event, details = {}) {
  logger.warn(`Security: ${event}`, {
    type: 'security',
    event,
    ...details
  });
}

/**
 * Logger específico para auditoría
 */
export function auditLog(action, userId, details = {}) {
  logger.info(`Audit: ${action}`, {
    type: 'audit',
    action,
    userId,
    ...details
  });
}

/**
 * Sobrescribir console para capturar logs existentes
 * Solo en producción para no afectar desarrollo
 */
export function overrideConsole() {
  if (process.env.NODE_ENV !== 'production') return;
  
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
  };
  
  console.log = (...args) => {
    logger.info(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
  };
  
  console.error = (...args) => {
    logger.error(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
  };
  
  console.warn = (...args) => {
    logger.warn(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
  };
  
  console.info = (...args) => {
    logger.info(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
  };
  
  // Permitir restaurar
  console.restore = () => {
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
  };
}

/**
 * Stream para morgan (si se usa)
 */
export const stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// ═══════════════════════════════════════════════════════════════
// INFORMACIÓN DE INICIO
// ═══════════════════════════════════════════════════════════════

// Log de inicio (solo si no es test)
if (process.env.NODE_ENV !== 'test') {
  logger.info('📋 Logger inicializado', {
    level: CONFIG.LEVEL,
    logDir: CONFIG.LOG_DIR,
    fileLogging: process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGS === 'true',
    rotation: {
      maxSize: CONFIG.MAX_SIZE,
      maxFiles: CONFIG.MAX_FILES,
      compress: CONFIG.COMPRESS
    }
  });
}

export default logger;
