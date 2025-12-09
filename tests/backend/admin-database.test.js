/**
 * @file tests/backend/admin-database.test.js
 * @description Tests for Admin Database Tools API endpoints (US-A05)
 * 
 * Tests the following endpoints:
 * - GET /api/admin/database/stats - Database statistics
 * - GET /api/admin/database/logs - Recent audit logs
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../server/app.js';

let app;
let adminToken;

describe('Admin Database Tools API (US-A05)', () => {
  beforeAll(async () => {
    app = createApp();
    
    // Login as admin to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@jantetelco.gob.mx', password: 'admin123' });
    
    adminToken = loginRes.body.token;
  });

  afterAll(() => {
    // DB cleanup handled by singleton
  });

  // ═══════════════════════════════════════════════════════════════
  // GET /api/admin/database/stats
  // ═══════════════════════════════════════════════════════════════

  describe('GET /api/admin/database/stats', () => {
    it('should return database statistics for admin', async () => {
      const res = await request(app)
        .get('/api/admin/database/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('database');
      expect(res.body).toHaveProperty('tables');
      expect(res.body).toHaveProperty('timestamp');
      
      // Verify database info structure
      expect(res.body.database).toHaveProperty('path');
      expect(res.body.database).toHaveProperty('sizeBytes');
      expect(res.body.database).toHaveProperty('sizeHuman');
    });

    it('should include table counts in stats', async () => {
      const res = await request(app)
        .get('/api/admin/database/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('tables');
      
      // Should include common tables
      expect(res.body.tables).toHaveProperty('usuarios');
      expect(res.body.tables).toHaveProperty('reportes');
      expect(typeof res.body.tables.usuarios).toBe('number');
    });

    it('should reject request without auth token', async () => {
      const res = await request(app)
        .get('/api/admin/database/stats');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject request with non-admin token', async () => {
      // Login as funcionario
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'func.obras1@jantetelco.gob.mx', password: 'func123' });

      const funcionarioToken = loginRes.body.token;
      if (!funcionarioToken) {
        console.log('⚠️ Funcionario user not found, skipping test');
        return;
      }

      const res = await request(app)
        .get('/api/admin/database/stats')
        .set('Authorization', `Bearer ${funcionarioToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // GET /api/admin/database/logs
  // ═══════════════════════════════════════════════════════════════

  describe('GET /api/admin/database/logs', () => {
    it('should return recent audit logs for admin', async () => {
      const res = await request(app)
        .get('/api/admin/database/logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('logs');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('timestamp');
      expect(Array.isArray(res.body.logs)).toBe(true);
    });

    it('should support limit parameter', async () => {
      const res = await request(app)
        .get('/api/admin/database/logs?limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.logs)).toBe(true);
      expect(res.body.logs.length).toBeLessThanOrEqual(5);
    });

    it('should include log metadata', async () => {
      const res = await request(app)
        .get('/api/admin/database/logs?limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      
      // If there are logs, verify structure
      if (res.body.logs.length > 0) {
        expect(res.body.logs[0]).toHaveProperty('id');
        expect(res.body.logs[0]).toHaveProperty('tipo_cambio');
        expect(res.body.logs[0]).toHaveProperty('tipo');
      }
    });

    it('should reject request without auth token', async () => {
      const res = await request(app)
        .get('/api/admin/database/logs');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should respect max limit of 200', async () => {
      const res = await request(app)
        .get('/api/admin/database/logs?limit=500')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      // Should be capped at 200
      expect(res.body.logs.length).toBeLessThanOrEqual(200);
    });

    it('should classify log types correctly', async () => {
      const res = await request(app)
        .get('/api/admin/database/logs?limit=50')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      
      // All logs should have a valid tipo classification
      res.body.logs.forEach(log => {
        expect(['error', 'warning', 'success', 'info']).toContain(log.tipo);
      });
    });
  });
});
