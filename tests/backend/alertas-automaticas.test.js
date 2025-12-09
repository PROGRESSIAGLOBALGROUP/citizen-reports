/**
 * Tests para el sistema de alertas automáticas
 * tests/backend/alertas-automaticas.test.js
 */

import request from 'supertest';
import { createApp } from '../../server/app.js';
import { getDb, initDb } from '../../server/db.js';

let app;
let adminToken;

beforeAll(async () => {
  await initDb();
  app = createApp();
  
  // Login como admin
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'admin@jantetelco.gob.mx',
      password: 'admin123'
    });
  
  adminToken = loginRes.body.token;
});

describe('Sistema de Alertas Automáticas', () => {
  
  describe('GET /api/alertas', () => {
    it('requiere autenticación', async () => {
      const res = await request(app)
        .get('/api/alertas');
      
      expect(res.status).toBe(401);
    });

    it('requiere rol supervisor o admin', async () => {
      // Buscar funcionario para test
      const db = getDb();
      const funcionario = await new Promise((resolve, reject) => {
        db.get("SELECT email FROM usuarios WHERE rol = 'funcionario' LIMIT 1", (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (funcionario) {
        const loginRes = await request(app)
          .post('/api/auth/login')
          .send({
            email: funcionario.email,
            password: 'admin123'
          });
        
        if (loginRes.body.token) {
          const res = await request(app)
            .get('/api/alertas')
            .set('Authorization', `Bearer ${loginRes.body.token}`);
          
          expect(res.status).toBe(403);
        }
      }
    });

    it('retorna lista de alertas para admin', async () => {
      const res = await request(app)
        .get('/api/alertas')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ok', true);
      expect(res.body).toHaveProperty('alertas');
      expect(Array.isArray(res.body.alertas)).toBe(true);
      expect(res.body).toHaveProperty('total');
    });

    it('permite filtrar por severidad', async () => {
      const res = await request(app)
        .get('/api/alertas')
        .query({ severidad: 'critical' })
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.filtros).toHaveProperty('severidad', 'critical');
    });
  });

  describe('GET /api/alertas/stats', () => {
    it('retorna estadísticas de alertas', async () => {
      const res = await request(app)
        .get('/api/alertas/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ok', true);
      expect(res.body).toHaveProperty('stats');
      
      const { stats } = res.body;
      expect(stats).toHaveProperty('activas');
      expect(stats).toHaveProperty('criticas');
      expect(stats).toHaveProperty('advertencias');
    });
  });

  describe('GET /api/alertas/config', () => {
    it('retorna configuración del sistema', async () => {
      const res = await request(app)
        .get('/api/alertas/config')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ok', true);
      expect(res.body).toHaveProperty('config');
      
      const { config } = res.body;
      expect(config).toHaveProperty('THRESHOLD_PENDING_REPORTS');
      expect(config).toHaveProperty('SLA_HOURS_ASSIGN');
      expect(config).toHaveProperty('SLA_HOURS_CLOSE');
      expect(config).toHaveProperty('ENABLED');
    });

    it('incluye tipos y severidades disponibles', async () => {
      const res = await request(app)
        .get('/api/alertas/config')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.body).toHaveProperty('tipos_disponibles');
      expect(res.body).toHaveProperty('severidades_disponibles');
    });
  });

  describe('POST /api/alertas/verificar', () => {
    it('ejecuta verificación manual', async () => {
      const res = await request(app)
        .post('/api/alertas/verificar')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ok', true);
      expect(res.body).toHaveProperty('mensaje');
      expect(res.body).toHaveProperty('alertas');
      expect(Array.isArray(res.body.alertas)).toBe(true);
    });

    it('solo admin puede ejecutar verificación', async () => {
      // Buscar supervisor para test
      const db = getDb();
      const supervisor = await new Promise((resolve, reject) => {
        db.get("SELECT email FROM usuarios WHERE rol = 'supervisor' LIMIT 1", (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (supervisor) {
        const loginRes = await request(app)
          .post('/api/auth/login')
          .send({
            email: supervisor.email,
            password: 'admin123'
          });
        
        if (loginRes.body.token) {
          const res = await request(app)
            .post('/api/alertas/verificar')
            .set('Authorization', `Bearer ${loginRes.body.token}`);
          
          expect(res.status).toBe(403);
        }
      }
    });
  });
});

describe('Funciones de Detección de Alertas', () => {
  it('el módulo exporta funciones de detección', async () => {
    const module = await import('../../server/alertas-automaticas.js');
    
    expect(typeof module.detectarUmbralPendientes).toBe('function');
    expect(typeof module.detectarViolacionesSLAAsignacion).toBe('function');
    expect(typeof module.detectarViolacionesSLACierre).toBe('function');
    expect(typeof module.detectarAnomalias).toBe('function');
    expect(typeof module.ejecutarVerificaciones).toBe('function');
  });

  it('detectarUmbralPendientes retorna array', async () => {
    const { detectarUmbralPendientes } = await import('../../server/alertas-automaticas.js');
    
    const alertas = await detectarUmbralPendientes();
    
    expect(Array.isArray(alertas)).toBe(true);
  });

  it('detectarAnomalias retorna array', async () => {
    const { detectarAnomalias } = await import('../../server/alertas-automaticas.js');
    
    const alertas = await detectarAnomalias();
    
    expect(Array.isArray(alertas)).toBe(true);
  });
});

console.log('✅ Tests de alertas automáticas cargados');
