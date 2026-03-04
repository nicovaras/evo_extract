import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    host: true,
    allowedHosts: ['identity-fairly-carries-bones.trycloudflare.com'],
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
  },
});
