import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server proxies API + socket to the Express server so the client can use
// same-origin relative paths (/intent, /availability, /socket.io).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
      '/health': 'http://localhost:4000',
      '/socket.io': { target: 'http://localhost:4000', ws: true },
    },
  },
});
