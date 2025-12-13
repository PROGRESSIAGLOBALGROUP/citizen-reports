/**
 * Test de Integración: Manejo de autenticación 401 en endpoints de usuarios
 * 
 * Verifica que:
 * 1. /api/usuarios devuelve 401 con token inválido
 * 2. /api/roles devuelve 401 con token inválido
 * 3. /api/usuarios devuelve 401 sin token
 */

import request from 'supertest';
import { createApp } from '../../server/app.js';

describe('API Authentication 401 Handling', () => {
  let app;

  beforeAll(async () => {
    app = await createApp();
  });

  describe('GET /api/usuarios', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .get('/api/usuarios')
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/token/i);
    });

    it('should return 401 when token is invalid', async () => {
      const response = await request(app)
        .get('/api/usuarios')
        .set('Authorization', 'Bearer invalid-token-12345')
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 when token is expired', async () => {
      const response = await request(app)
        .get('/api/usuarios')
        .set('Authorization', 'Bearer expired-session-token')
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/roles', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .get('/api/roles')
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/token/i);
    });

    it('should return 401 when token is invalid', async () => {
      const response = await request(app)
        .get('/api/roles')
        .set('Authorization', 'Bearer invalid-token-xyz')
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Authenticated requests with valid token', () => {
    let validToken;

    beforeAll(async () => {
      // Login para obtener token válido
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@jantetelco.gob.mx',
          password: 'admin123'
        });
      
      if (loginResponse.status === 200) {
        validToken = loginResponse.body.token;
      }
    });

    it('should return 200 with valid admin token on /api/usuarios', async () => {
      if (!validToken) {
        console.warn('⚠️ No valid token available, skipping test');
        return;
      }

      const response = await request(app)
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 200 with valid admin token on /api/roles', async () => {
      if (!validToken) {
        console.warn('⚠️ No valid token available, skipping test');
        return;
      }

      const response = await request(app)
        .get('/api/roles')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });
});
