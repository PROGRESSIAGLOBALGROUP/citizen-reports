// Utilidad para generar fingerprint del navegador
// Combina características del dispositivo/navegador para crear un identificador único

/**
 * Genera un fingerprint único del navegador/dispositivo
 * @returns {string} Hash único basado en características del navegador
 */
export function generarFingerprintNavegador() {
  const caracteristicas = [
    // Información de pantalla
    screen.width,
    screen.height,
    screen.colorDepth,
    screen.pixelDepth,
    
    // Información del navegador
    navigator.userAgent,
    navigator.language,
    navigator.languages ? navigator.languages.join(',') : '',
    navigator.platform,
    navigator.cookieEnabled,
    
    // Zona horaria
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    new Date().getTimezoneOffset(),
    
    // Características adicionales si están disponibles
    navigator.hardwareConcurrency || 0,
    navigator.maxTouchPoints || 0,
    navigator.deviceMemory || 0,
    
    // Información de ventana
    window.innerWidth,
    window.innerHeight,
    window.outerWidth,
    window.outerHeight
  ];
  
  // Crear string combinado
  const datosCombinados = caracteristicas.join('|');
  
  // Generar hash simple pero efectivo
  return generarHashSimple(datosCombinados);
}

/**
 * Genera un ID de sesión único que persiste durante la sesión del navegador
 * @returns {string} ID único de sesión
 */
export function obtenerIdSesion() {
  let sesionId = sessionStorage.getItem('citizen-reports_sesion_id');
  
  if (!sesionId) {
    sesionId = generarIdAleatorio();
    sessionStorage.setItem('citizen-reports_sesion_id', sesionId);
  }
  
  return sesionId;
}

/**
 * Genera un hash simple de 32 caracteres
 * @param {string} str - String a hashear
 * @returns {string} Hash hexadecimal
 */
function generarHashSimple(str) {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir a 32-bit integer
  }
  
  // Convertir a hex positivo de 8 caracteres
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  
  // Agregar timestamp para más unicidad
  const timestamp = Date.now().toString(16).slice(-6);
  
  return hex + timestamp;
}

/**
 * Genera un ID aleatorio de 16 caracteres
 * @returns {string} ID aleatorio
 */
function generarIdAleatorio() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Recopila todos los datos de identificación para enviar al servidor
 * @returns {object} Objeto con datos de identificación
 */
export function recopilarDatosIdentificacion() {
  return {
    fingerprint: generarFingerprintNavegador(),
    sesionId: obtenerIdSesion(),
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  };
}