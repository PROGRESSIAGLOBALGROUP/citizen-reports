import { defineConfig } from 'vitest/config';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

export default defineConfig(async () => {
  const { default: react } = await import('@vitejs/plugin-react');
  const projectRoot = dirname(dirname(fileURLToPath(import.meta.url))); // Go up to project root from config/
  
  // Custom Vite plugin to handle CSS imports
  const cssImportPlugin = {
    name: 'mock-css-imports',
    resolveId(id) {
      if (id.includes('leaflet/dist/leaflet.css')) {
        return resolve(projectRoot, 'tests/frontend/mocks/leaflet-css.js');
      }
      if (id === 'leaflet') {
        return resolve(projectRoot, 'tests/frontend/mocks/leaflet.js');
      }
      if (id === 'leaflet.heat') {
        return resolve(projectRoot, 'tests/frontend/mocks/leaflet-heat.js');
      }
      return null;
    }
  };
  
  return {
    plugins: [react(), cssImportPlugin],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    test: {
      include: ['tests/frontend/**/*.{test,spec}.{js,jsx,ts,tsx}'],
      environment: 'jsdom',
      globals: true,
      setupFiles: ['tests/frontend/setupTests.ts'],
    },
  };
});
