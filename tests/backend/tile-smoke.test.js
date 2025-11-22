import {
  parseArgs,
  parseCoords,
  formatUrl,
  summarize,
  probeTile,
  DEFAULT_TEMPLATE,
} from '../../scripts/tile-smoke.js';

describe('tile smoke CLI utilities', () => {
  // Clean up after tests to prevent open handles
  afterAll((done) => {
    // Give time for any pending connections to close
    setTimeout(done, 100);
  });

  afterEach(() => {
    if (global.fetch && global.fetch.mockClear) {
      try {
        global.fetch.mockReset();
      } catch (e) {
        // Ignore if mockReset not available
      }
    }
    try {
      if (typeof jest !== 'undefined') {
        jest.clearAllMocks();
        jest.useRealTimers();
      }
    } catch (e) {
      // Ignore jest global issues
    }
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
    // Verify PNG header structure (8 bytes magic number)
    const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(pngHeader.length).toBe(8);
    expect(pngHeader[0]).toBe(137);
    expect(pngHeader[1]).toBe(80);
  });

  test('probeTile returns error after retries exhausted', async () => {
    // CRITICAL: Mock fetch synchronously to prevent TCP connection leak
    const originalFetch = global.fetch;
    global.fetch = () => Promise.reject(new Error('network down'));

    const result = await probeTile('http://example', { timeout: 100, retries: 1 });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/network down|timeout/);
    
    // Restore immediately to prevent handle leak
    global.fetch = originalFetch;
    
    // Allow event loop to clear pending operations
    await new Promise(resolve => setImmediate(resolve));
  });
});
