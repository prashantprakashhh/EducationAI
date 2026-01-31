import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // FORCE Vite to point to the main entry point, bypassing the confusing exports map
      '@apollo/client': path.resolve(__dirname, 'node_modules/@apollo/client/index.js')
    }
  },
  server: {
    port: 5173,
  },
});