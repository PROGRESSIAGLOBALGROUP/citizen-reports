import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('API usuarios - filtros de asignación', () => {
	let app;
	let initDb;
	let getDb;
	let createApp;
	let tmpDir;
	let dbPath;
	let authToken;
	let db;

	beforeAll(async () => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'citizen-reports-usuarios-'));
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
		// Cerrar conexión de base de datos antes de eliminar archivos
		if (db) {
			db.close((err) => {
				if (err) console.error('Error cerrando DB:', err);
				// Esperar un poco antes de eliminar
				setTimeout(() => {
					if (tmpDir) {
						try {
							fs.rmSync(tmpDir, { recursive: true, force: true });
						} catch (err) {
							// Ignore EBUSY errors on Windows - files will be cleaned by OS
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

	test('filtra usuarios por dependencia', async () => {
		const res = await request(app)
			.get('/api/usuarios?dependencia=obras_publicas')
			.set('Authorization', `Bearer ${authToken}`);

		expect(res.status).toBe(200);
		expect(Array.isArray(res.body)).toBe(true);
		
		// Todos los usuarios deben ser de obras_publicas
		res.body.forEach(usuario => {
			expect(usuario.dependencia).toBe('obras_publicas');
		});
	});

	test('filtra usuarios por rol', async () => {
		const res = await request(app)
			.get('/api/usuarios?rol=funcionario')
			.set('Authorization', `Bearer ${authToken}`);

		expect(res.status).toBe(200);
		expect(Array.isArray(res.body)).toBe(true);
		
		// Todos los usuarios deben ser funcionarios
		res.body.forEach(usuario => {
			expect(usuario.rol).toBe('funcionario');
		});
	});

	test('filtra usuarios por dependencia y rol', async () => {
		const res = await request(app)
			.get('/api/usuarios?dependencia=servicios_publicos&rol=funcionario')
			.set('Authorization', `Bearer ${authToken}`);

		expect(res.status).toBe(200);
		expect(Array.isArray(res.body)).toBe(true);
		
		// Todos deben cumplir ambas condiciones
		res.body.forEach(usuario => {
			expect(usuario.dependencia).toBe('servicios_publicos');
			expect(usuario.rol).toBe('funcionario');
		});
	});

	test('devuelve array vacío si no hay matches', async () => {
		const res = await request(app)
			.get('/api/usuarios?dependencia=dependencia_inexistente')
			.set('Authorization', `Bearer ${authToken}`);

		expect(res.status).toBe(200);
		expect(res.body).toEqual([]);
	});
});
