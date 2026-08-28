// TEMPORARY — sandbox preview only. Not part of the project; safe to delete.
// The repo's own vite.config.js is intentionally left untouched.
import { defineConfig, mergeConfig } from 'vite';
import base from './vite.config.js';

export default defineConfig(
  mergeConfig(base, {
    server: {
      host: '0.0.0.0',
      port: 5173,
      // Preview reaches the dev server through a proxied host.
      allowedHosts: true,
    },
  }),
);
