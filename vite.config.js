import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    https: false,
    port: 3000,
    host: true
  },
  build: {
    target: 'esnext',
    minify: false,
    sourcemap: false,
    chunkSizeWarningLimit: 1000
  }
});
