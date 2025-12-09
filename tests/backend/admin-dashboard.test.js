// Test básico para el endpoint del dashboard de admin
// tests/backend/admin-dashboard.test.js

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

describe('GET /api/admin/dashboard', () => {
  it('requiere autenticación', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard');
    
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('requiere rol admin', async () => {
    // Crear usuario funcionario para test
    const db = getDb();
    
    // Buscar un funcionario existente
    const funcionario = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM usuarios WHERE rol = 'funcionario' LIMIT 1", (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (funcionario) {
      // Login como funcionario
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: funcionario.email,
          password: 'funcionario123' // Password por defecto
        });
      
      if (loginRes.body.token) {
        const res = await request(app)
          .get('/api/admin/dashboard')
          .set('Authorization', `Bearer ${loginRes.body.token}`);
        
        expect(res.status).toBe(403);
      }
    }
  });

  it('retorna métricas del dashboard para admin', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    
    // Verifica estructura de respuesta
    expect(res.body).toHaveProperty('general');
    expect(res.body).toHaveProperty('porEstado');
    expect(res.body).toHaveProperty('porTipo');
    expect(res.body).toHaveProperty('porDependencia');
    expect(res.body).toHaveProperty('tendenciaSemanal');
    expect(res.body).toHaveProperty('tendenciaMensual');
    expect(res.body).toHaveProperty('tiempoResolucion');
    expect(res.body).toHaveProperty('personal');
    expect(res.body).toHaveProperty('cierresPendientes');
    expect(res.body).toHaveProperty('recientes24h');
    expect(res.body).toHaveProperty('porPrioridad');
  });

  it('general contiene contadores correctos', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    
    const { general } = res.body;
    expect(general).toHaveProperty('total_reportes');
    expect(general).toHaveProperty('usuarios_activos');
    expect(general).toHaveProperty('total_funcionarios');
    expect(general).toHaveProperty('total_supervisores');
    
    // Los valores deben ser números
    expect(typeof general.total_reportes).toBe('number');
    expect(typeof general.usuarios_activos).toBe('number');
  });

  it('porEstado es un array con estructura correcta', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(Array.isArray(res.body.porEstado)).toBe(true);
    
    if (res.body.porEstado.length > 0) {
      const item = res.body.porEstado[0];
      expect(item).toHaveProperty('estado');
      expect(item).toHaveProperty('cantidad');
    }
  });

  it('personal contiene conteos de usuarios por rol', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    
    const { personal } = res.body;
    expect(personal).toHaveProperty('funcionarios');
    expect(personal).toHaveProperty('supervisores');
    expect(personal).toHaveProperty('admins');
    
    expect(typeof personal.funcionarios).toBe('number');
    expect(typeof personal.supervisores).toBe('number');
    expect(typeof personal.admins).toBe('number');
  });
});
