const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');

const originalFetch = global.fetch;

describe('API reportes', () => {
	let app;
	let initDb;
	let getDb;
	let createApp;
	let tmpDir;
	let dbPath;

	beforeAll(async () => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jantetelco-'));
		dbPath = path.join(tmpDir, 'test.db');
		process.env.DB_PATH = dbPath;

		({ initDb, getDb } = await import('../../server/db.js'));
		await initDb();
		({ createApp } = await import('../../server/app.js'));
		app = createApp();
	});

	beforeEach(async () => {
		const db = getDb();
		await new Promise((resolve, reject) => {
			db.run('DELETE FROM reportes', (err) => (err ? reject(err) : resolve()));
		});
		db.close();
	});

	afterAll(() => {
		if (tmpDir) {
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
		delete process.env.DB_PATH;
		global.fetch = originalFetch;
	});

	test('permite crear y recuperar un reporte filtrado por tipo', async () => {
		const nuevoReporte = {
			tipo: 'incendio',
			descripcion: 'Columna de humo en zona industrial',
			lat: 19.4326,
			lng: -99.1332,
			peso: 2,
		};

		const post = await request(app).post('/api/reportes').send(nuevoReporte);
		expect(post.status).toBe(200);
		expect(post.body).toMatchObject({ ok: true });
		expect(post.body.id).toBeGreaterThan(0);

		const res = await request(app).get('/api/reportes').query({ tipo: 'incendio' });
		expect(res.status).toBe(200);
		expect(res.body).toHaveLength(1);
		expect(res.body[0]).toMatchObject({
			tipo: 'incendio',
			descripcion: 'Columna de humo en zona industrial',
			lat: 19.4326,
			lng: -99.1332,
			peso: 2,
		});

		const tipos = await request(app).get('/api/reportes/tipos');
		expect(tipos.status).toBe(200);
		expect(tipos.body).toContain('incendio');
	});

	test('rechaza coordenadas fuera de rango', async () => {
		const invalid = await request(app).post('/api/reportes').send({
			tipo: 'falla',
			lat: -150,
			lng: 35,
		});
		expect(invalid.status).toBe(400);
		expect(invalid.body).toEqual({ error: 'Datos inválidos' });
	});

	test('agrega reportes en modo grid y exporta geojson', async () => {
		const payloads = [
			{ tipo: 'bache', lat: 18.5, lng: -99.0, peso: 1 },
			{ tipo: 'bache', lat: 18.5004, lng: -99.0004, peso: 3 },
			{ tipo: 'derribo', lat: 19.0, lng: -99.2, peso: 2 },
		];
		for (const body of payloads) {
			const response = await request(app).post('/api/reportes').send(body);
			expect(response.status).toBe(200);
		}

		const grid = await request(app).get('/api/reportes/grid').query({ tipo: 'bache', cell: 0.001 });
		expect(grid.status).toBe(200);
		expect(grid.body).toHaveLength(1);
		expect(grid.body[0].speso).toBe(4); // speso = suma de pesos

		const geo = await request(app).get('/api/reportes/geojson').query({ tipo: 'derribo' });
		expect(geo.status).toBe(200);
		expect(geo.headers['content-type']).toContain('application/geo+json');
		const parsed = JSON.parse(geo.text);
		expect(parsed.type).toBe('FeatureCollection');
		expect(parsed.features).toHaveLength(1);
		expect(parsed.features[0].properties).toMatchObject({ tipo: 'derribo', peso: 2 });
	});

	test('proxy de mosaicos devuelve png y cache headers', async () => {
		const tileBuffer = new Uint8Array([1, 2, 3]).buffer;
		global.fetch = jest.fn().mockResolvedValue({
			ok: true,
			status: 200,
			arrayBuffer: async () => tileBuffer,
		});

		const response = await request(app).get('/tiles/12/345/678.png');
		expect(global.fetch).toHaveBeenCalledWith('https://a.tile.openstreetmap.org/12/345/678.png', expect.any(Object));
		expect(response.status).toBe(200);
		expect(response.headers['content-type']).toBe('image/png');
		expect(response.headers['cache-control']).toContain('max-age=86400');
		expect(response.headers['x-fallback-tile']).toBeUndefined();
		expect(Buffer.isBuffer(response.body)).toBe(true);
		expect(response.body.length).toBe(3);
	});

	test('proxy de mosaicos responde propagando error', async () => {
		global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });
		const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
		const response = await request(app).get('/tiles/5/1/2.png');
			expect(response.status).toBe(200);
			expect(response.headers['x-fallback-tile']).toBe('1');
			expect(response.headers['cache-control']).toBe('no-store');
			expect(response.headers['content-type']).toBe('image/png');
			expect(Buffer.isBuffer(response.body)).toBe(true);
			expect(response.body.length).toBeGreaterThan(0);
		consoleSpy.mockRestore();
	});

	test('proxy de mosaicos maneja excepciones', async () => {
		global.fetch = jest.fn().mockRejectedValue(new Error('timeout'));
		const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
		const response = await request(app).get('/tiles/5/10/20.png');
			expect(response.status).toBe(200);
			expect(response.headers['x-fallback-tile']).toBe('1');
			expect(response.headers['cache-control']).toBe('no-store');
			expect(response.headers['content-type']).toBe('image/png');
			expect(Buffer.isBuffer(response.body)).toBe(true);
			expect(response.body.length).toBeGreaterThan(0);
		consoleSpy.mockRestore();
	});
});