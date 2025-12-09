/**
 * Test Unitario Backend: Endpoint GET /api/usuarios
 * 
 * Valida que:
 * 1. El endpoint /api/usuarios (CON /api/) existe y retorna JSON
 * 2. Retorna array de usuarios con estructura correcta
 * 3. Filtros de rol y activo funcionan
 * 4. NO retorna HTML/404 cuando es llamado correctamente
 * 5. La respuesta contiene campos esperados (id, email, nombre, rol, dependencia)
 * 
 * Root Cause (FIJO):
 * - El frontend estaba haciendo fetch a ${API_BASE}/usuarios (sin /api/)
 * - Ahora correctamente llama a ${API_BASE}/api/usuarios
 * 
 * Este test asegura que el endpoint está disponible y retorna JSON válido
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Backend - Endpoint GET /api/usuarios (cargarFuncionarios)', () => {
	let app;
	let initDb;
	let getDb;
	let createApp;
	let tmpDir;
	let dbPath;
	let authToken;
	let db;

	beforeAll(async () => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'citizen-reports-usuarios-cargar-'));
		dbPath = path.join(tmpDir, 'test.db');
		process.env.DB_PATH = dbPath;

		({ initDb, getDb } = await import('../../server/db.js'));
		await initDb();
		({ createApp } = await import('../../server/app.js'));
		app = createApp();

		db = getDb();

		// Obtener token de admin
		const loginRes = await request(app)
			.post('/api/auth/login')
			.send({ email: 'admin@jantetelco.gob.mx', password: 'admin123' });
		authToken = loginRes.body.token;
	});

	afterAll((done) => {
		if (db) {
			db.close((err) => {
				if (err) console.error('Error cerrando DB:', err);
				setTimeout(() => {
					if (tmpDir) {
						try {
							fs.rmSync(tmpDir, { recursive: true, force: true });
						} catch (err) {
							if (err.code !== 'EBUSY') {
								console.error('Error eliminando tmpDir:', err);
							}
						}
					}
					delete process.env.DB_PATH;
					done();
				}, 500);
			});
		} else {
			done();
		}
	});

	test('GET /api/usuarios retorna JSON válido (no HTML)', async () => {
		const response = await request(app)
			.get('/api/usuarios')
			.set('Authorization', `Bearer ${authToken}`)
			.expect(200);

		// Validar que la respuesta es JSON
		expect(response.headers['content-type']).toMatch(/json/);

		// Validar que NO es HTML
		expect(response.text).not.toMatch(/^<!DOCTYPE/i);
		expect(response.text).not.toMatch(/^<html/i);

		// Validar que es array
		expect(Array.isArray(response.body)).toBe(true);

		console.log(`✅ Endpoint /api/usuarios retorna JSON válido (${response.body.length} usuarios)`);
	});

	test('GET /api/usuarios retorna array con estructura correcta', async () => {
		const response = await request(app)
			.get('/api/usuarios')
			.set('Authorization', `Bearer ${authToken}`)
			.expect(200);

		expect(Array.isArray(response.body)).toBe(true);
		expect(response.body.length).toBeGreaterThan(0);

		// Validar estructura de cada usuario
		response.body.forEach((usuario) => {
			expect(usuario).toHaveProperty('id');
			expect(usuario).toHaveProperty('email');
			expect(usuario).toHaveProperty('nombre');
			expect(usuario).toHaveProperty('rol');
			expect(usuario).toHaveProperty('dependencia');
		});

		console.log(`✅ Estructura de usuarios es correcta (${response.body.length} usuarios validados)`);
	});

	test('GET /api/usuarios?rol=funcionario filtra funcionarios correctamente', async () => {
		const response = await request(app)
			.get('/api/usuarios')
			.query({ rol: 'funcionario' })
			.set('Authorization', `Bearer ${authToken}`)
			.expect(200);

		expect(Array.isArray(response.body)).toBe(true);

		// Validar que todos sean funcionarios
		response.body.forEach((usuario) => {
			expect(usuario.rol).toBe('funcionario');
		});

		console.log(`✅ Filtro rol=funcionario funciona (${response.body.length} funcionarios encontrados)`);
	});

	test('GET /api/usuarios?rol=supervisor filtra supervisores correctamente', async () => {
		const response = await request(app)
			.get('/api/usuarios')
			.query({ rol: 'supervisor' })
			.set('Authorization', `Bearer ${authToken}`)
			.expect(200);

		expect(Array.isArray(response.body)).toBe(true);

		// Validar que todos sean supervisores
		response.body.forEach((usuario) => {
			expect(usuario.rol).toBe('supervisor');
		});

		console.log(`✅ Filtro rol=supervisor funciona (${response.body.length} supervisores encontrados)`);
	});

	test('GET /api/usuarios?activo=1 filtra usuarios activos', async () => {
		const response = await request(app)
			.get('/api/usuarios')
			.query({ activo: '1' })
			.set('Authorization', `Bearer ${authToken}`)
			.expect(200);

		expect(Array.isArray(response.body)).toBe(true);

		// Validar que todos sean activos
		response.body.forEach((usuario) => {
			expect(usuario.activo).toBe(1);
		});

		console.log(`✅ Filtro activo=1 funciona (${response.body.length} usuarios activos encontrados)`);
	});

	test('GET /api/usuarios?rol=funcionario&activo=1 combina filtros correctamente', async () => {
		const response = await request(app)
			.get('/api/usuarios')
			.query({ rol: 'funcionario', activo: '1' })
			.set('Authorization', `Bearer ${authToken}`)
			.expect(200);

		expect(Array.isArray(response.body)).toBe(true);

		// Validar que todos sean funcionarios activos
		response.body.forEach((usuario) => {
			expect(usuario.rol).toBe('funcionario');
			expect(usuario.activo).toBe(1);
		});

		console.log(`✅ Combinación de filtros funciona (${response.body.length} funcionarios activos encontrados)`);
	});

	test('GET /api/usuarios requiere autenticación de admin (seguridad)', async () => {
		// Sin token → 401 Unauthorized (CORRECTO - ruta protegida)
		const responseNoAuth = await request(app)
			.get('/api/usuarios')
			.expect(401);

		expect(responseNoAuth.body.error).toBeDefined();
		console.log('✅ Sin token retorna 401 (endpoint protegido correctamente)');

		// Con token de admin → 200 OK
		const responseWithAuth = await request(app)
			.get('/api/usuarios')
			.set('Authorization', `Bearer ${authToken}`)
			.expect(200);

		expect(Array.isArray(responseWithAuth.body)).toBe(true);
		console.log('✅ Con token admin retorna datos correctamente');
	});

	test('Frontend: fetch a ${API_BASE}/api/usuarios (con /api/) es correcto', async () => {
		/**
		 * Este test valida la CORRECCIÓN:
		 * 
		 * ANTES (INCORRECTO - retornaba HTML):
		 *   fetch(`${API_BASE}/usuarios?...`)
		 *   → GET /usuarios (sin /api/)
		 *   → Catchall SPA devuelve index.html
		 *   → JSON.parse(html) falla con SyntaxError
		 * 
		 * AHORA (CORRECTO - retorna JSON):
		 *   fetch(`${API_BASE}/api/usuarios?...`)
		 *   → GET /api/usuarios (con /api/)
		 *   → Endpoint real retorna JSON array
		 *   → JSON.parse(json) funciona perfectamente
		 */

		// Simular fetch del frontend a /api/usuarios
		const response = await request(app)
			.get('/api/usuarios')
			.query({ rol: 'funcionario', activo: '1' })
			.set('Authorization', `Bearer ${authToken}`)
			.expect(200);

		// Validar que es JSON válido (como lo esperaría el frontend)
		expect(response.body).toBeDefined();
		expect(Array.isArray(response.body)).toBe(true);

		// Validar que NO es HTML (nunca debería llegar html en /api/*)
		expect(response.text).not.toMatch(/<!DOCTYPE/i);

		console.log('✅ Frontend puede hacer .json() correctamente en respuesta de /api/usuarios');
	});

});
