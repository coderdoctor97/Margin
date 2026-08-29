import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    hmr: { clientPort: 443 },
    headers: { 'X-Frame-Options': 'ALLOWALL' },
    allowedHosts: true,
    cors: true,
  },
  preview: {
    host: '0.0.0.0',
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});