#!/usr/bin/env node
/* eslint-disable no-console */
const { setTimeout: delay } = require('timers/promises');

const DEFAULT_TEMPLATE = 'http://localhost:4000/tiles/{z}/{x}/{y}.png';
const DEFAULT_COORDS = '0,0,0:world;5,12,15:regional;12,2205,1373:local';
const DEFAULT_TIMEOUT = 10000;

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }
    const key = token.slice(2);
    if (key.length === 0) {
      continue;
    }
    if (key === 'help') {
      args.help = true;
      continue;
    }
    const next = argv[i + 1];
    if (typeof next === 'undefined' || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function printHelp() {
  console.log(`Tile smoke-check utility

Usage:
  node scripts/tile-smoke.js [template] [--template <urlTemplate>] [--coords <z,x,y[:label];...>] [--timeout <ms>] [--retries <n>] [--delay <ms>] [--json]

Examples:
  node scripts/tile-smoke.js
  node scripts/tile-smoke.js https://tile.openstreetmap.org/{z}/{x}/{y}.png
  npm run smoke:tiles -- "http://localhost:4000/tiles/{z}/{x}/{y}.png" --coords 0,0,0:world;12,2205,1373:town

Options:
  --template  Plantilla de URL con {z}, {x}, {y}. Default: ${DEFAULT_TEMPLATE}
  --coords    Lista separada por ';' con cada tupla 'z,x,y[:label]'. Default: ${DEFAULT_COORDS}
  --timeout   Timeout por solicitud en milisegundos. Default: ${DEFAULT_TIMEOUT}
  --retries   Reintentos cuando la solicitud falla (default: 0)
  --delay     Milisegundos entre solicitudes (default: 0)
  --json      Imprime resultado en JSON además de la salida legible.
`);
}

function parseCoords(raw) {
  if (!raw) return [];
  return raw
    .split(';')
  .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry, idx) => {
      const [coords, labelPart] = entry.split(':');
      const [zStr, xStr, yStr] = (coords || '').split(',');
      const z = Number(zStr);
      const x = Number(xStr);
      const y = Number(yStr);
      if (![z, x, y].every(Number.isFinite)) {
        throw new Error(`Coordenada inválida en '${entry}'. Usa el formato z,x,y[:label]`);
      }
      if (z < 0 || !Number.isInteger(z)) {
        throw new Error(`Zoom inválido (${z}) en '${entry}'. Debe ser un entero >= 0.`);
      }
      const limit = 2 ** z;
      if (!Number.isInteger(x) || x < 0 || x >= limit) {
        throw new Error(`Valor x inválido (${x}) en '${entry}'. Para z=${z}, x debe estar entre 0 y ${limit - 1}.`);
      }
      if (!Number.isInteger(y) || y < 0 || y >= limit) {
        throw new Error(`Valor y inválido (${y}) en '${entry}'. Para z=${z}, y debe estar entre 0 y ${limit - 1}.`);
      }
      return {
        z,
        x,
        y,
        label: (labelPart || '').trim() || `tile-${idx + 1}`,
      };
    });
}

function formatUrl(template, { z, x, y }) {
  if (typeof template !== 'string' || !template.includes('{z}')) {
    throw new Error('La plantilla debe incluir {z}, {x} y {y}.');
  }
  return template.replace('{z}', z).replace('{x}', x).replace('{y}', y);
}

async function fetchWithTimeout(url, timeoutMs, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('timeout')), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function probeTile(url, { timeout, retries }) {
  let attempt = 0;
  const started = Date.now();
  /* eslint-disable no-await-in-loop */
  while (attempt <= retries) {
    try {
      const response = await fetchWithTimeout(url, timeout, {
        headers: {
          'User-Agent': 'Jantetelco-Heatmap-Smoke/1.0 (+https://localhost)',
        },
      });
      const elapsed = Date.now() - started;
      const ok = response.ok;
      const status = response.status;
      const fallback = response.headers.get('x-fallback-tile') === '1';
      const buffer = await response.arrayBuffer();
      return {
        ok,
        status,
        fallback,
        elapsed,
        bytes: buffer.byteLength,
      };
    } catch (error) {
      if (attempt === retries) {
        return { ok: false, error: error.message, elapsed: Date.now() - started };
      }
    }
    attempt += 1;
  }
  return { ok: false, error: 'unknown', elapsed: Date.now() - started };
}

function summarize(results) {
  const errors = results.filter((r) => r.result.error || r.result.ok === false && r.result.status >= 400);
  const fallbacks = results.filter((r) => r.result.fallback);
  const successCount = results.length - errors.length - fallbacks.length;
  let exitCode = 0;
  let statusText = 'OK';
  if (errors.length > 0) {
    exitCode = 2;
    statusText = 'FAILED';
  } else if (fallbacks.length > 0) {
    exitCode = 1;
    statusText = 'DEGRADED';
  }
  return {
    exitCode,
    statusText,
    counts: {
      total: results.length,
      success: successCount,
      fallbacks: fallbacks.length,
      errors: errors.length,
    },
  };
}

async function main() {
  const argv = parseArgs(process.argv.slice(2));
  if (argv.help) {
    printHelp();
    process.exit(0);
  }

  const template = argv.template || (Array.isArray(argv._) && argv._[0]) || DEFAULT_TEMPLATE;
  const timeout = Number(argv.timeout || DEFAULT_TIMEOUT);
  const retries = Number(argv.retries || 0);
  const delayMs = Number(argv.delay || 0);

  if (!Number.isFinite(timeout) || timeout <= 0) {
    throw new Error(`Timeout inválido: ${argv.timeout}`);
  }
  if (!Number.isInteger(retries) || retries < 0) {
    throw new Error(`Reintentos inválidos: ${argv.retries}`);
  }
  if (!Number.isFinite(delayMs) || delayMs < 0) {
    throw new Error(`Delay inválido: ${argv.delay}`);
  }

  const coordinates = parseCoords(argv.coords || DEFAULT_COORDS);
  if (coordinates.length === 0) {
    throw new Error('No hay coordenadas a validar. Usa --coords para definir al menos una.');
  }

  console.log('=== Tile smoke-check ===');
  console.log(`Plantilla: ${template}`);
  console.log(`Timeout: ${timeout} ms | Reintentos: ${retries} | Delay entre probes: ${delayMs} ms`);
  console.log(`Total de coordenadas: ${coordinates.length}`);
  console.log('-----------------------------------------');

  const results = [];
  for (const coord of coordinates) {
    const url = formatUrl(template, coord);
    process.stdout.write(`→ ${coord.label} (z=${coord.z}, x=${coord.x}, y=${coord.y}) ... `);
    const result = await probeTile(url, { timeout, retries });
    const statusPart = result.ok && !result.error ? `${result.status} en ${result.elapsed} ms (${result.bytes} bytes)` : `error: ${result.error || result.status}`;
    const badge = !result.ok || result.error ? '✖' : result.fallback ? '⚠' : '✔';
    console.log(`${badge} ${statusPart}${result.fallback ? ' [fallback]' : ''}`);
    results.push({ coord, url, result });
    if (delayMs > 0) {
      await delay(delayMs);
    }
  }

  const summary = summarize(results);
  console.log('-----------------------------------------');
  console.log(`Resultado: ${summary.statusText}`);
  console.log(`Éxitos: ${summary.counts.success} | Fallbacks: ${summary.counts.fallbacks} | Errores: ${summary.counts.errors}`);

  if (argv.json) {
    const payload = {
      template,
      timeout,
      retries,
      delay: delayMs,
      results: results.map((entry) => ({
        coord: entry.coord,
        url: entry.url,
        ...entry.result,
      })),
      summary,
    };
    console.log(JSON.stringify(payload, null, 2));
  }

  if (summary.exitCode !== 0) {
    process.exit(summary.exitCode);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('\nError durante el smoke-check:', err.message);
    process.exit(2);
  });
}

module.exports = {
  DEFAULT_TEMPLATE,
  DEFAULT_COORDS,
  DEFAULT_TIMEOUT,
  parseArgs,
  parseCoords,
  formatUrl,
  summarize,
  fetchWithTimeout,
  probeTile,
  main,
};
