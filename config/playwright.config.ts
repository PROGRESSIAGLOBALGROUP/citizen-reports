import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']]
    : [['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4000',
    headless: true,
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure'
  },
  webServer: {
    command: 'node server/server.js',
    url: 'http://localhost:4000',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      PORT: '4000',
      DB_PATH: process.env.PLAYWRIGHT_DB_PATH || './e2e.db',
      TILE_PROXY_HOSTS:
        process.env.PLAYWRIGHT_TILE_PROXY_HOSTS ||
        'https://a.tile.openstreetmap.org,https://b.tile.openstreetmap.org,https://c.tile.openstreetmap.org'
    }
  }
});
