const {
  parseArgs,
  parseCoords,
  formatUrl,
  summarize,
  probeTile,
  DEFAULT_TEMPLATE,
} = require('../../scripts/tile-smoke.js');

describe('tile smoke CLI utilities', () => {
  afterEach(() => {
    if (global.fetch && global.fetch.mockClear) {
      global.fetch.mockReset();
    }
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test('parseArgs handles flags and positional template', () => {
    const args = parseArgs(['--timeout', '5000', 'https://tiles.example/{z}/{x}/{y}.png']);
    expect(args.timeout).toBe('5000');
    expect(args._).toEqual(['https://tiles.example/{z}/{x}/{y}.png']);
  });

  test('parseCoords yields normalized coordinate entries', () => {
    const coords = parseCoords('5,12,15:regional');
    expect(coords).toHaveLength(1);
    expect(coords[0]).toMatchObject({ z: 5, x: 12, y: 15, label: 'regional' });
  });

  test('parseCoords throws on out-of-range values', () => {
    expect(() => parseCoords('2,9,0')).toThrow('Valor x inválido');
  });

  test('formatUrl replaces tokens correctly', () => {
    const url = formatUrl(DEFAULT_TEMPLATE, { z: 1, x: 2, y: 3 });
    expect(url).toBe('http://localhost:4000/tiles/1/2/3.png');
  });

  test('summarize flags fallback responses as degraded', () => {
    const summary = summarize([
      { coord: { label: 'ok' }, url: 'u1', result: { ok: true, status: 200, fallback: false } },
      { coord: { label: 'fb' }, url: 'u2', result: { ok: true, status: 200, fallback: true } },
    ]);
    expect(summary.statusText).toBe('DEGRADED');
    expect(summary.counts).toMatchObject({ success: 1, fallbacks: 1, errors: 0 });
    expect(summary.exitCode).toBe(1);
  });

  test('probeTile marks fallback header and preserves fallback PNG bytes', async () => {
    const fallbackBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
    const fallbackBuffer = Buffer.from(fallbackBase64, 'base64');
    const arrayBuffer = fallbackBuffer.buffer.slice(
      fallbackBuffer.byteOffset,
      fallbackBuffer.byteOffset + fallbackBuffer.byteLength
    );
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: (key) => (key === 'x-fallback-tile' ? '1' : null) },
      arrayBuffer: () => Promise.resolve(arrayBuffer),
    });

    const result = await probeTile('http://example', { timeout: 1000, retries: 0 });
    expect(result.fallback).toBe(true);
    expect(result.status).toBe(200);
    expect(result.bytes).toBe(fallbackBuffer.byteLength);
    expect(result.ok).toBe(true);
  });

  test('probeTile returns error after retries exhausted', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    const result = await probeTile('http://example', { timeout: 100, retries: 1 });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('network down');
  });
});
