import { defineConfig } from 'vitest/config';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

export default defineConfig(async () => {
  const { default: react } = await import('@vitejs/plugin-react');
  const rootDir = dirname(fileURLToPath(import.meta.url));
  return {
    plugins: [react()],
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        leaflet: resolve(rootDir, 'tests/frontend/mocks/leaflet.js'),
        'leaflet.heat': resolve(rootDir, 'tests/frontend/mocks/leaflet-heat.js'),
      },
    },
    test: {
      include: ['tests/frontend/**/*.{test,spec}.{js,jsx,ts,tsx}'],
      environment: 'jsdom',
      globals: true,
      setupFiles: ['tests/frontend/setupTests.ts'],
    },
  };
});
