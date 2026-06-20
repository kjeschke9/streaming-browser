import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@streambrws/shared-types': path.resolve(__dirname, '../../packages/shared-types/src'),
      '@streambrws/shared-logic': path.resolve(__dirname, '../../packages/shared-logic/src'),
      '@streambrws/ui-tokens':    path.resolve(__dirname, '../../packages/ui-tokens/src'),
    },
  },
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
