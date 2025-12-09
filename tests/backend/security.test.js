/**
 * Tests del módulo de seguridad
 * tests/backend/security.test.js
 * 
 * Extracción quirúrgica desde backup:
 * C:\PROYECTOS\citizen-reports\backups\citizen-reports_08-DEC-2025_ 01.15\tests\backend\security.test.js
 */

import {
  encrypt,
  decrypt,
  encryptSensitiveFields,
  decryptSensitiveFields,
  validarPassword,
  sanitizeInput,
  sanitizeObject,
  hashForSearch,
  secureCompare,
  generateSecureId,
  SECURITY_CONFIG
} from '../../server/security.js';

describe('Módulo de Seguridad', () => {
  
  describe('Cifrado E2E (AES-256-GCM)', () => {
    it('cifra y descifra texto correctamente', () => {
      const original = 'Información sensible del ciudadano';
      const encrypted = encrypt(original);
      
      // El texto cifrado debe ser diferente al original
      expect(encrypted).not.toBe(original);
      
      // Debe tener formato correcto (iv:authTag:ciphertext)
      expect(encrypted.split(':').length).toBe(3);
      
      // Descifrar debe retornar el original
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(original);
    });

    it('genera diferentes ciphertext para el mismo texto (IV aleatorio)', () => {
      const original = 'Texto de prueba';
      const encrypted1 = encrypt(original);
      const encrypted2 = encrypt(original);
      
      // Los dos cifrados deben ser diferentes (IVs únicos)
      expect(encrypted1).not.toBe(encrypted2);
      
      // Pero ambos deben descifrar al mismo texto
      expect(decrypt(encrypted1)).toBe(original);
      expect(decrypt(encrypted2)).toBe(original);
    });

    it('maneja texto vacío y null correctamente', () => {
      expect(encrypt('')).toBe('');
      expect(encrypt(null)).toBe(null);
      expect(decrypt('')).toBe('');
      expect(decrypt(null)).toBe(null);
    });

    it('retorna texto original si no está cifrado', () => {
      const plainText = 'Texto sin cifrar';
      expect(decrypt(plainText)).toBe(plainText);
    });

    it('maneja caracteres especiales y unicode', () => {
      const original = '¡Hola! Dirección: Calle Ñoño #123 🏠';
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(original);
    });
  });

  describe('Cifrado de campos sensibles', () => {
    it('cifra campos sensibles de un objeto', () => {
      const reporte = {
        id: 1,
        tipo: 'bache',
        descripcion: 'Hay un bache grande en la calle',
        colonia: 'Centro',
        lat: 18.123,
        lng: -99.456
      };

      const encrypted = encryptSensitiveFields(reporte);
      
      // Campos sensibles deben estar cifrados
      expect(encrypted.descripcion).not.toBe(reporte.descripcion);
      expect(encrypted.colonia).not.toBe(reporte.colonia);
      
      // Campos no sensibles deben permanecer igual
      expect(encrypted.id).toBe(reporte.id);
      expect(encrypted.tipo).toBe(reporte.tipo);
      expect(encrypted.lat).toBe(reporte.lat);
    });

    it('descifra campos sensibles de un objeto', () => {
      const original = {
        descripcion: 'Descripción original',
        colonia: 'Mi Colonia'
      };

      const encrypted = encryptSensitiveFields(original);
      const decrypted = decryptSensitiveFields(encrypted);

      expect(decrypted.descripcion).toBe(original.descripcion);
      expect(decrypted.colonia).toBe(original.colonia);
    });
  });

  describe('Validación de Passwords', () => {
    it('rechaza passwords muy cortos', () => {
      const result = validarPassword('abc123');
      expect(result.valido).toBe(false);
      expect(result.errores.some(e => /al menos 8 caracteres/i.test(e))).toBe(true);
    });

    it('rechaza passwords sin mayúsculas', () => {
      const result = validarPassword('password123');
      expect(result.valido).toBe(false);
      expect(result.errores.some(e => /mayúscula/i.test(e))).toBe(true);
    });

    it('rechaza passwords sin minúsculas', () => {
      const result = validarPassword('PASSWORD123');
      expect(result.valido).toBe(false);
      expect(result.errores.some(e => /minúscula/i.test(e))).toBe(true);
    });

    it('rechaza passwords sin números', () => {
      const result = validarPassword('PasswordABC');
      expect(result.valido).toBe(false);
      expect(result.errores.some(e => /número/i.test(e))).toBe(true);
    });

    it('rechaza passwords comunes', () => {
      const result = validarPassword('password');
      expect(result.valido).toBe(false);
    });

    it('acepta passwords seguros', () => {
      const result = validarPassword('MiPassword123');
      expect(result.valido).toBe(true);
      expect(result.errores).toHaveLength(0);
    });
  });

  describe('Sanitización de Inputs', () => {
    it('escapa caracteres peligrosos para XSS', () => {
      const malicious = '<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).toContain('&lt;');
      expect(sanitized).toContain('&gt;');
    });

    it('escapa comillas', () => {
      const input = 'Texto con "comillas" y \'apostrofes\'';
      const sanitized = sanitizeInput(input);
      
      expect(sanitized).not.toContain('"');
      expect(sanitized).not.toContain("'");
    });

    it('sanitiza objetos recursivamente', () => {
      const obj = {
        nombre: '<script>evil</script>',
        nested: {
          value: '<img onerror="hack()">'
        }
      };

      const sanitized = sanitizeObject(obj);
      
      expect(sanitized.nombre).not.toContain('<');
      expect(sanitized.nested.value).not.toContain('<');
    });

    it('maneja arrays correctamente', () => {
      const arr = ['<script>1</script>', '<script>2</script>'];
      const sanitized = sanitizeObject(arr);
      
      expect(sanitized[0]).not.toContain('<');
      expect(sanitized[1]).not.toContain('<');
    });
  });

  describe('Hash para búsquedas', () => {
    it('genera hash consistente para el mismo valor', () => {
      const value = 'test@email.com';
      const hash1 = hashForSearch(value);
      const hash2 = hashForSearch(value);
      
      expect(hash1).toBe(hash2);
    });

    it('normaliza a lowercase antes de hashear', () => {
      const hash1 = hashForSearch('Test@Email.COM');
      const hash2 = hashForSearch('test@email.com');
      
      expect(hash1).toBe(hash2);
    });

    it('retorna null para valores vacíos', () => {
      expect(hashForSearch('')).toBe(null);
      expect(hashForSearch(null)).toBe(null);
      expect(hashForSearch(undefined)).toBe(null);
    });

    it('genera hash de 16 caracteres', () => {
      const hash = hashForSearch('cualquier valor');
      expect(hash.length).toBe(16);
    });
  });

  describe('Comparación segura de strings', () => {
    it('retorna true para strings iguales', () => {
      expect(secureCompare('abc123', 'abc123')).toBe(true);
    });

    it('retorna false para strings diferentes', () => {
      expect(secureCompare('abc123', 'abc124')).toBe(false);
    });

    it('retorna false para longitudes diferentes', () => {
      expect(secureCompare('abc', 'abcd')).toBe(false);
    });

    it('retorna false para valores no-string', () => {
      expect(secureCompare(123, 123)).toBe(false);
      expect(secureCompare(null, null)).toBe(false);
    });
  });

  describe('Generación de IDs seguros', () => {
    it('genera UUIDs únicos', () => {
      const id1 = generateSecureId();
      const id2 = generateSecureId();
      
      expect(id1).not.toBe(id2);
    });

    it('genera IDs en formato UUID v4', () => {
      const id = generateSecureId();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      expect(id).toMatch(uuidRegex);
    });
  });

  describe('Configuración de seguridad', () => {
    it('tiene configuración de rate limiting', () => {
      expect(SECURITY_CONFIG.LOGIN_MAX_ATTEMPTS).toBeGreaterThan(0);
      expect(SECURITY_CONFIG.LOGIN_WINDOW_MS).toBeGreaterThan(0);
      expect(SECURITY_CONFIG.API_RATE_LIMIT).toBeGreaterThan(0);
    });

    it('tiene configuración de cifrado', () => {
      expect(SECURITY_CONFIG.ENCRYPTION_ALGORITHM).toBe('aes-256-gcm');
      expect(SECURITY_CONFIG.IV_LENGTH).toBe(16);
    });

    it('tiene lista de campos sensibles', () => {
      expect(SECURITY_CONFIG.SENSITIVE_FIELDS).toContain('descripcion');
      expect(SECURITY_CONFIG.SENSITIVE_FIELDS).toContain('colonia');
    });
  });
});
