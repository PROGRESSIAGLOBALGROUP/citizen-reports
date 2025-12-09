/**
 * Tests para reasignación de usuarios y eliminación de dependencias
 * Cubre US-A03: Gestionar Dependencias (con flujo de reasignación)
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Dependencias - Reasignación y Eliminación', () => {
  let app;
  let initDb;
  let getDb;
  let createApp;
  let tmpDir;
  let dbPath;
  let adminToken;
  
  beforeAll(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'citizen-reports-'));
    dbPath = path.join(tmpDir, 'test.db');
    process.env.DB_PATH = dbPath;

    ({ initDb, getDb } = await import('../../server/db.js'));
    await initDb();
    ({ createApp } = await import('../../server/app.js'));
    app = createApp();
    
    // Login como admin
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@jantetelco.gob.mx', password: 'admin123' });
    adminToken = loginRes.body.token;
  });

  afterAll((done) => {
    const db = getDb();
    db.close(() => {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch (e) {
        // Ignorar errores de limpieza
      }
      done();
    });
  });

  describe('GET /api/admin/dependencias/:id/usuarios', () => {
    it('debe retornar usuarios asociados a una dependencia', async () => {
      const res = await request(app)
        .get('/api/admin/dependencias/2/usuarios')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('dependencia');
      expect(res.body).toHaveProperty('slug');
      expect(res.body).toHaveProperty('usuarios');
      expect(res.body).toHaveProperty('count');
      expect(Array.isArray(res.body.usuarios)).toBe(true);
    });

    it('debe retornar 404 para dependencia inexistente', async () => {
      const res = await request(app)
        .get('/api/admin/dependencias/99999/usuarios')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('no encontrada');
    });

    it('debe requerir autenticación', async () => {
      const res = await request(app)
        .get('/api/admin/dependencias/2/usuarios');
      
      expect(res.status).toBe(401);
    });

    it('debe incluir información de cada usuario', async () => {
      const res = await request(app)
        .get('/api/admin/dependencias/2/usuarios')
        .set('Authorization', `Bearer ${adminToken}`);
      
      if (res.body.usuarios.length > 0) {
        const usuario = res.body.usuarios[0];
        expect(usuario).toHaveProperty('id');
        expect(usuario).toHaveProperty('nombre');
        expect(usuario).toHaveProperty('email');
        expect(usuario).toHaveProperty('rol');
      }
    });
  });

  describe('POST /api/admin/dependencias/:id/reasignar-y-eliminar', () => {
    let dependenciaPruebaId;
    
    beforeEach(async () => {
      // Crear dependencia de prueba
      const createRes = await request(app)
        .post('/api/admin/dependencias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Dependencia Test Reasignación',
          slug: 'test_reasignacion_' + Date.now(),
          descripcion: 'Para tests de reasignación',
          icono: '🧪',
          color: '#ff00ff'
        });
      
      dependenciaPruebaId = createRes.body.id;
    });

    afterEach(async () => {
      // Limpiar dependencia de prueba
      if (dependenciaPruebaId) {
        await request(app)
          .delete(`/api/admin/dependencias/${dependenciaPruebaId}`)
          .set('Authorization', `Bearer ${adminToken}`);
      }
    });

    it('debe requerir dependencia destino', async () => {
      const res = await request(app)
        .post(`/api/admin/dependencias/${dependenciaPruebaId}/reasignar-y-eliminar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('dependencia destino');
    });

    it('debe validar que la dependencia destino existe', async () => {
      const res = await request(app)
        .post(`/api/admin/dependencias/${dependenciaPruebaId}/reasignar-y-eliminar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ dependenciaDestino: 'dependencia_inexistente_xyz' });
      
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('destino no encontrada');
    });

    it('debe reasignar usuarios y eliminar dependencia exitosamente', async () => {
      // Esta dependencia de prueba no tiene usuarios, pero el endpoint debería funcionar
      const res = await request(app)
        .post(`/api/admin/dependencias/${dependenciaPruebaId}/reasignar-y-eliminar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ dependenciaDestino: 'administracion' });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('mensaje');
      expect(res.body).toHaveProperty('usuariosReasignados');
      expect(res.body.usuariosReasignados).toBe(0); // Sin usuarios
      
      // Marcar como eliminada para que afterEach no falle
      dependenciaPruebaId = null;
    });

    it('debe requerir autenticación', async () => {
      const res = await request(app)
        .post('/api/admin/dependencias/2/reasignar-y-eliminar')
        .send({ dependenciaDestino: 'administracion' });
      
      expect(res.status).toBe(401);
    });

    it('debe retornar 404 para dependencia origen inexistente', async () => {
      const res = await request(app)
        .post('/api/admin/dependencias/99999/reasignar-y-eliminar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ dependenciaDestino: 'administracion' });
      
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('origen no encontrada');
    });
  });

  describe('DELETE /api/admin/dependencias/:id (sin usuarios)', () => {
    let depSinUsuariosId;
    
    beforeEach(async () => {
      const res = await request(app)
        .post('/api/admin/dependencias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Dependencia Sin Usuarios',
          slug: 'sin_usuarios_' + Date.now(),
          descripcion: 'Para test de eliminación directa',
          icono: '🗑️',
          color: '#cccccc'
        });
      
      depSinUsuariosId = res.body.id;
    });

    it('debe eliminar dependencia sin usuarios directamente', async () => {
      const res = await request(app)
        .delete(`/api/admin/dependencias/${depSinUsuariosId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.mensaje).toContain('eliminada');
    });
  });

  describe('Flujo completo de reasignación', () => {
    it('debe poder consultar usuarios de dependencia existente', async () => {
      const res = await request(app)
        .get('/api/admin/dependencias/2/usuarios')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.dependencia).toBe('Obras Públicas');
      expect(res.body.slug).toBe('obras_publicas');
      expect(typeof res.body.count).toBe('number');
      expect(Array.isArray(res.body.usuarios)).toBe(true);
    });
  });
});
