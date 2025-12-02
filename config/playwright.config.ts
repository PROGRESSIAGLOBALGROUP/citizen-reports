import { defineConfig, devices } from '@playwright/test';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

// Force IPv4 before anything else
dns.setDefaultResultOrder('ipv4first');

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

export default defineConfig({
  testDir: join(rootDir, './tests/e2e'),
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']]
    : [['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4000',
    headless: true,
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure'
  },
  webServer: {
    command: 'node scripts/start-test-server.js',
    url: 'http://127.0.0.1:4000/',
    reuseExistingServer: true,
    cwd: rootDir,
    timeout: 60_000,
    env: {
      PORT: '4000',
      NODE_ENV: 'test',
      DB_PATH: process.env.PLAYWRIGHT_DB_PATH || 'server/e2e.db',
      TILE_PROXY_HOSTS:
        process.env.PLAYWRIGHT_TILE_PROXY_HOSTS ||
        'https://a.tile.openstreetmap.org,https://b.tile.openstreetmap.org,https://c.tile.openstreetmap.org'
    }
  }
});
