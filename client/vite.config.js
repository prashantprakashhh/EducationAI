import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@apollo/client/link/context': path.resolve(__dirname, 'node_modules/@apollo/client/link/context/index.js'),
    }
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          apollo: ['@apollo/client', 'graphql'],
          ui: ['framer-motion', 'lucide-react'],
        },
      },
    },
  },
});