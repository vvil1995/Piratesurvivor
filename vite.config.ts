import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  build: { target: 'es2020', sourcemap: false, assetsInlineLimit: Infinity, chunkSizeWarningLimit: 4000 },
  server: { host: '0.0.0.0' },
});
