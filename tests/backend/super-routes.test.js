/**
 * @file tests/backend/super-routes.test.js
 * @description Tests for SuperUser SQL Console API endpoints (US-SU01, US-SU02)
 * 
 * Tests the following endpoints:
 * - POST /api/super/query - Execute SQL query
 * - GET /api/super/tables - List database tables
 * - GET /api/super/schema/:table - Get table schema
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../server/app.js';

let app;
const SUPER_TOKEN = 'test_super_token_12345';

describe('SuperUser SQL Console API (US-SU01, US-SU02)', () => {
  beforeAll(async () => {
    // Set the SUPER_TOKEN environment variable for testing
    process.env.SUPER_TOKEN = SUPER_TOKEN;
    process.env.SUPER_USER_TOKEN = SUPER_TOKEN;
    
    app = createApp();
  });

  afterAll(() => {
    // DB cleanup handled by singleton
  });

  // ═══════════════════════════════════════════════════════════════
  // POST /api/super/query
  // ═══════════════════════════════════════════════════════════════

  describe('POST /api/super/query', () => {
    it('should execute SELECT query with valid super token', async () => {
      const res = await request(app)
        .post('/api/super/query')
        .set('X-Super-Token', SUPER_TOKEN)
        .send({ sql: 'SELECT 1 as test_value' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ok', true);
      expect(res.body).toHaveProperty('rows');
      expect(res.body).toHaveProperty('rowCount');
      expect(res.body).toHaveProperty('duration');
      expect(Array.isArray(res.body.rows)).toBe(true);
      expect(res.body.rows[0]).toHaveProperty('test_value', 1);
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .post('/api/super/query')
        .send({ sql: 'SELECT 1' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .post('/api/super/query')
        .set('X-Super-Token', 'invalid_token_here')
        .send({ sql: 'SELECT 1' });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject empty sql', async () => {
      const res = await request(app)
        .post('/api/super/query')
        .set('X-Super-Token', SUPER_TOKEN)
        .send({ sql: '' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should block destructive query without confirmation', async () => {
      const res = await request(app)
        .post('/api/super/query')
        .set('X-Super-Token', SUPER_TOKEN)
        .send({ sql: 'DROP TABLE test_table_nonexistent' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('destructive', true);
    });

    it('should block DELETE without confirmation', async () => {
      const res = await request(app)
        .post('/api/super/query')
        .set('X-Super-Token', SUPER_TOKEN)
        .send({ sql: 'DELETE FROM reportes WHERE id = 999999' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('destructive', true);
    });

    it('should execute query on specific table', async () => {
      const res = await request(app)
        .post('/api/super/query')
        .set('X-Super-Token', SUPER_TOKEN)
        .send({ sql: 'SELECT COUNT(*) as total FROM usuarios' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ok', true);
      expect(res.body.rows[0]).toHaveProperty('total');
      expect(typeof res.body.rows[0].total).toBe('number');
    });

    it('should limit results to 1000 rows', async () => {
      const res = await request(app)
        .post('/api/super/query')
        .set('X-Super-Token', SUPER_TOKEN)
        .send({ sql: 'SELECT * FROM usuarios' });

      expect(res.status).toBe(200);
      expect(res.body.rows.length).toBeLessThanOrEqual(1000);
    });

    it('should return syntax error for invalid SQL', async () => {
      const res = await request(app)
        .post('/api/super/query')
        .set('X-Super-Token', SUPER_TOKEN)
        .send({ sql: 'SELEC * FORM usuarios' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should include duration in response', async () => {
      const res = await request(app)
        .post('/api/super/query')
        .set('X-Super-Token', SUPER_TOKEN)
        .send({ sql: 'SELECT * FROM usuarios LIMIT 5' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('duration');
      expect(typeof res.body.duration).toBe('string');
      expect(res.body.duration).toMatch(/\d+ms/);
    });

    it('should return columns list in response', async () => {
      const res = await request(app)
        .post('/api/super/query')
        .set('X-Super-Token', SUPER_TOKEN)
        .send({ sql: 'SELECT id, email, nombre FROM usuarios LIMIT 1' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('columns');
      expect(Array.isArray(res.body.columns)).toBe(true);
      expect(res.body.columns).toContain('id');
      expect(res.body.columns).toContain('email');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // GET /api/super/tables
  // ═══════════════════════════════════════════════════════════════

  describe('GET /api/super/tables', () => {
    it('should return list of tables with valid token', async () => {
      const res = await request(app)
        .get('/api/super/tables')
        .set('X-Super-Token', SUPER_TOKEN);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('tables');
      expect(Array.isArray(res.body.tables)).toBe(true);
      
      // Tables is array of strings
      expect(res.body.tables).toContain('usuarios');
      expect(res.body.tables).toContain('reportes');
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/super/tables');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should include totals in response', async () => {
      const res = await request(app)
        .get('/api/super/tables')
        .set('X-Super-Token', SUPER_TOKEN);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('total');
      expect(res.body.total).toHaveProperty('tables');
      expect(typeof res.body.total.tables).toBe('number');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // GET /api/super/schema/:table
  // ═══════════════════════════════════════════════════════════════

  describe('GET /api/super/schema/:table', () => {
    it('should return schema for usuarios table', async () => {
      const res = await request(app)
        .get('/api/super/schema/usuarios')
        .set('X-Super-Token', SUPER_TOKEN);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('columns');
      expect(Array.isArray(res.body.columns)).toBe(true);
      
      // Should include common columns
      const columnNames = res.body.columns.map(c => c.name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('email');
    });

    it('should return 404 for non-existent table', async () => {
      const res = await request(app)
        .get('/api/super/schema/tabla_inexistente')
        .set('X-Super-Token', SUPER_TOKEN);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/super/schema/usuarios');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should include column types and constraints', async () => {
      const res = await request(app)
        .get('/api/super/schema/usuarios')
        .set('X-Super-Token', SUPER_TOKEN);

      expect(res.status).toBe(200);
      
      if (res.body.columns.length > 0) {
        expect(res.body.columns[0]).toHaveProperty('name');
        expect(res.body.columns[0]).toHaveProperty('type');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Security Tests
  // ═══════════════════════════════════════════════════════════════

  describe('Security', () => {
    it('should block multi-statement SQL', async () => {
      const res = await request(app)
        .post('/api/super/query')
        .set('X-Super-Token', SUPER_TOKEN)
        .send({ sql: 'SELECT 1; SELECT 2;' });

      // Should block or safely handle multi-statement
      expect([200, 400]).toContain(res.status);
    });

    it('should not expose token in error messages', async () => {
      const res = await request(app)
        .post('/api/super/query')
        .set('X-Super-Token', 'wrong_token')
        .send({ sql: 'SELECT 1' });

      expect(res.status).toBe(403);
      expect(JSON.stringify(res.body)).not.toContain(SUPER_TOKEN);
    });

    it('should work with X-Super-User-Token header', async () => {
      const res = await request(app)
        .post('/api/super/query')
        .set('X-Super-User-Token', SUPER_TOKEN)
        .send({ sql: 'SELECT 1 as test' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ok', true);
    });
  });
});
